// ─────────────────────────────────────────────────────────────────────────────
// /api/checkin — Morning check-ins + session logs
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString, getBSTTime } = require('../lib/schedule');
const {
  AUTO_MISS_REASON,
  getRelevantScheduledSessions,
  reconcileScheduledSessionLogs,
} = require('../lib/sessionReconciliation');

router.use(requireAuth);

function getSessionKey(sessionDate, sessionNumber) {
  return `${sessionDate}:${sessionNumber}`;
}

function serializeScheduledSession(session, log = null) {
  const { startAt, endAt, ...rest } = session;
  return { ...rest, log };
}

function normalizeSessionData(data) {
  if (data.completed) {
    return {
      ...data,
      actualMinutes: data.actualMinutes,
      reasonMissed: null,
      didInstead: null,
      notes: data.notes ?? null,
    };
  }

  return {
    ...data,
    reasonMissed: data.reasonMissed || AUTO_MISS_REASON,
    didInstead: data.didInstead || null,
    notes: data.notes || null,
  };
}

// ── Morning check-in ──────────────────────────────────────────────────────────

// GET /api/checkin/morning/today — check if morning log exists for today
router.get('/morning/today', async (req, res) => {
  try {
    const today = getBSTDateString();
    const checkin = await prisma.dailyCheckin.findUnique({ where: { date: today } });
    res.json({ date: today, checkin: checkin || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin/morning — create or update today's morning check-in
const morningSchema = z.object({
  wokeUpAt6:           z.boolean(),
  studiedBeforeCollege: z.boolean(),
  preCollegeSubject:   z.string().optional().nullable(),
  preCollegeMinutes:   z.number().int().min(0).optional().nullable(),
  notes:               z.string().optional().nullable(),
});

router.post('/morning', async (req, res) => {
  try {
    const data = morningSchema.parse(req.body);
    const today = getBSTDateString();

    const checkin = await prisma.dailyCheckin.upsert({
      where:  { date: today },
      update: data,
      create: { date: today, ...data },
    });

    res.json(checkin);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin/morning/history?days=30 — morning checkin history
router.get('/morning/history', async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));

    const checkins = await prisma.dailyCheckin.findMany({
      where:   { date: { gte: cutoff } },
      orderBy: { date: 'desc' },
    });

    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Session check-in ──────────────────────────────────────────────────────────

// GET /api/checkin/sessions/today — today's session logs + pending sessions
router.get('/sessions/today', async (req, res) => {
  try {
    const now = new Date();
    await reconcileScheduledSessionLogs(now);

    const {
      currentDate,
      currentDayName,
      currentSchedule,
      carryover,
      relevantDates,
    } = getRelevantScheduledSessions(now);
    const { hour, minute } = getBSTTime();

    const logs = await prisma.sessionLog.findMany({
      where:   { date: { in: relevantDates } },
      orderBy: [{ date: 'desc' }, { sessionNumber: 'asc' }],
    });

    const logsByKey = new Map(
      logs.map((log) => [getSessionKey(log.date, log.sessionNumber), log])
    );

    const schedule = currentSchedule.map((session) => (
      serializeScheduledSession(
        session,
        logsByKey.get(getSessionKey(session.sessionDate, session.sessionNumber)) || null
      )
    ));

    const carryoverSessions = carryover.map((session) => (
      serializeScheduledSession(
        session,
        logsByKey.get(getSessionKey(session.sessionDate, session.sessionNumber)) || null
      )
    ));

    const todayLogs = logs.filter((log) => log.date === currentDate);

    res.json({
      date: currentDate,
      dayName: currentDayName,
      currentHour: hour,
      currentMinute: minute,
      schedule,
      carryover: carryoverSessions,
      logs: todayLogs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin/sessions/pending — sessions that ended but aren't logged yet
router.get('/sessions/pending', async (req, res) => {
  try {
    const now = new Date();
    await reconcileScheduledSessionLogs(now);

    const {
      currentDayName,
      currentSchedule,
      carryover,
      relevantDates,
    } = getRelevantScheduledSessions(now);

    const logs = await prisma.sessionLog.findMany({
      where:  { date: { in: relevantDates } },
      select: { date: true, sessionNumber: true },
    });

    const loggedKeys = new Set(
      logs.map((log) => getSessionKey(log.date, log.sessionNumber))
    );

    const pending = [...carryover, ...currentSchedule]
      .filter((session) => session.endAt <= now)
      .filter((session) => !loggedKeys.has(getSessionKey(session.sessionDate, session.sessionNumber)))
      .map((session) => serializeScheduledSession(session));

    res.json({
      pending,
      isPracticeDay: currentSchedule.length === 0,
      dayName: currentDayName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkin/sessions — log a session (completed or missed)
const sessionSchema = z.object({
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek:     z.string(),
  sessionNumber: z.number().int().min(1).max(3),
  subject:       z.string().min(1),
  completed:     z.boolean(),
  actualMinutes: z.number().int().min(0).default(0),
  reasonMissed:  z.string().optional().nullable(),
  didInstead:    z.string().optional().nullable(),
  notes:         z.string().optional().nullable(),
});

router.post('/sessions', async (req, res) => {
  try {
    const parsed = sessionSchema.parse(req.body);
    const data = normalizeSessionData(parsed);

    const log = await prisma.sessionLog.upsert({
      where:  { date_sessionNumber: { date: data.date, sessionNumber: data.sessionNumber } },
      update: data,
      create: data,
    });

    res.json(log);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin/sessions/history?days=30
router.get('/sessions/history', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 30, 90);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));

    const logs = await prisma.sessionLog.findMany({
      where:   { date: { gte: cutoff } },
      orderBy: [{ date: 'desc' }, { sessionNumber: 'asc' }],
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
