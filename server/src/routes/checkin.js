// ─────────────────────────────────────────────────────────────────────────────
// /api/checkin — Morning check-ins + session logs
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString, getBSTDayName, getDaySchedule, getBSTTime } = require('../lib/schedule');

router.use(requireAuth);

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
    const today    = getBSTDateString();
    const dayName  = getBSTDayName();
    const { hour, minute } = getBSTTime();

    const logs     = await prisma.sessionLog.findMany({ where: { date: today } });
    const schedule = getDaySchedule(dayName);

    // Enrich schedule with logged status
    const enriched = schedule
      ? schedule.map(session => {
          const log = logs.find(l => l.sessionNumber === session.sessionNumber);
          return { ...session, log: log || null };
        })
      : null;

    res.json({ date: today, dayName, currentHour: hour, currentMinute: minute, schedule: enriched, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkin/sessions/pending — sessions that ended but aren't logged yet
router.get('/sessions/pending', async (req, res) => {
  try {
    const today   = getBSTDateString();
    const dayName = getBSTDayName();
    const { hour, minute } = getBSTTime();
    const schedule = getDaySchedule(dayName);

    if (!schedule) return res.json({ pending: [], isPracticeDay: true, dayName });

    const logs    = await prisma.sessionLog.findMany({ where: { date: today } });
    const loggedNums = new Set(logs.map(l => l.sessionNumber));

    const pending = schedule.filter(session => {
      if (loggedNums.has(session.sessionNumber)) return false;
      const nowMins   = hour * 60 + minute;
      const startMins = session.startHour * 60 + session.startMin;
      let   endMins   = session.endHour   * 60 + session.endMin;
      if (session.endHour < session.startHour) endMins += 1440;
      return nowMins >= endMins; // session has ended
    });

    res.json({ pending, isPracticeDay: false, dayName });
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
    const data = sessionSchema.parse(req.body);

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
