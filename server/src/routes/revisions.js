// /api/revisions — Spaced repetition revision tracker
const router = require('express').Router();
const { z }  = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString } = require('../lib/schedule');

router.use(requireAuth);

// Spaced repetition intervals (days)
const INTERVALS = [7, 14, 30]; // 1st → 7d, 2nd → 14d, 3rd → 30d

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getNextDue(revisionCount, today) {
  const interval = INTERVALS[Math.min(revisionCount - 1, INTERVALS.length - 1)];
  return addDays(today, interval);
}

// GET /api/revisions/due — chapters due for revision today
router.get('/due', async (req, res) => {
  try {
    const today = getBSTDateString();

    // 1. Chapters completed but never revised (completed 7+ days ago)
    const completedChapters = await prisma.chapterProgress.findMany({
      where: { status: 'completed' },
      orderBy: { lastUpdated: 'asc' },
    });

    // 2. All revision logs
    const allLogs = await prisma.revisionLog.findMany({
      orderBy: { revisedAt: 'desc' },
    });

    // Latest log per chapter
    const latestByChapter = {};
    allLogs.forEach(log => {
      if (!latestByChapter[log.chapterId]) {
        latestByChapter[log.chapterId] = log;
      }
    });

    const dueToday = [];
    const upcoming = [];

    completedChapters.forEach(ch => {
      const latest   = latestByChapter[ch.id];
      const lastDate = latest
        ? latest.revisedAt.toISOString().slice(0, 10)
        : ch.lastUpdated.toISOString().slice(0, 10);
      const count    = latest ? latest.revisionCount : 0;
      const interval = INTERVALS[Math.min(count, INTERVALS.length - 1)];
      const dueDate  = addDays(lastDate, interval);

      const item = {
        chapterId:     ch.id,
        subject:       ch.subject,
        chapterNumber: ch.chapterNumber,
        chapterName:   ch.chapterName,
        revisionCount: count,
        dueDate,
        overdue: dueDate < today,
      };

      if (dueDate <= today) dueToday.push(item);
      else if (dueDate <= addDays(today, 7)) upcoming.push(item);
    });

    res.json({ dueToday, upcoming, today });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/revisions/history — all revision logs
router.get('/history', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 30, 180);
    const cutoff = new Date(Date.now() - days * 86400000);
    const logs   = await prisma.revisionLog.findMany({
      where:   { revisedAt: { gte: cutoff } },
      orderBy: { revisedAt: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/revisions/stats — revision counts per subject
router.get('/stats', async (req, res) => {
  try {
    const logs = await prisma.revisionLog.findMany({ orderBy: { revisedAt: 'desc' } });
    const bySubject = logs.reduce((acc, l) => {
      if (!acc[l.subject]) acc[l.subject] = 0;
      acc[l.subject]++;
      return acc;
    }, {});
    res.json({ bySubject, total: logs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/revisions — log a revision
const revSchema = z.object({
  chapterId:     z.number().int(),
  subject:       z.string(),
  chapterNumber: z.number().int(),
  chapterName:   z.string(),
  notes:         z.string().optional().nullable(),
});

router.post('/', async (req, res) => {
  try {
    const data  = revSchema.parse(req.body);
    const today = getBSTDateString();

    // Count previous revisions for this chapter
    const prevCount = await prisma.revisionLog.count({
      where: { chapterId: data.chapterId },
    });
    const revisionCount = prevCount + 1;
    const nextDueDate   = revisionCount < 3 ? getNextDue(revisionCount, today) : null;

    const log = await prisma.revisionLog.create({
      data: {
        ...data,
        revisionCount,
        nextDueDate,
      },
    });

    // Update chapter status to 'revised'
    await prisma.chapterProgress.update({
      where: { id: data.chapterId },
      data:  { status: 'revised', lastUpdated: new Date() },
    });

    res.status(201).json({ log, nextDueDate, revisionCount });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
