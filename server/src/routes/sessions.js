// /api/sessions — Custom (ad-hoc) study sessions
const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString } = require('../lib/schedule');

router.use(requireAuth);

// POST /api/sessions/custom — save a completed timer session
const customSchema = z.object({
  subject:         z.string().min(1),
  startTime:       z.string().datetime(),
  endTime:         z.string().datetime(),
  durationMinutes: z.number().int().min(1),
  notes:           z.string().optional().nullable(),
  chapter:         z.string().trim().max(200).optional().nullable(),
  studyType:       z.enum(['self', 'online']).optional().nullable(),
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.post('/custom', async (req, res) => {
  try {
    const data = customSchema.parse(req.body);
    const date = data.date || getBSTDateString();

    const session = await prisma.customStudySession.create({
      data: {
        ...data,
        date,
        chapter: data.chapter?.trim() || null,
        studyType: data.studyType || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      },
    });

    res.status(201).json(session);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/custom?days=60 — list custom sessions
router.get('/custom', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 60, 90);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));

    const sessions = await prisma.customStudySession.findMany({
      where:   { date: { gte: cutoff } },
      select:  {
        id: true,
        date: true,
        subject: true,
        studyType: true,
        chapter: true,
        durationMinutes: true,
        notes: true,
      },
      orderBy: { startTime: 'desc' },
    });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/custom/:id
router.delete('/custom/:id', async (req, res) => {
  try {
    await prisma.customStudySession.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Practice sessions (Friday/Saturday) ──────────────────────────────────────

const practiceSchema = z.object({
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  subject:         z.string().min(1),
  durationMinutes: z.number().int().min(1),
  type:            z.enum(['QB', 'Reading', 'Mixed']),
  notes:           z.string().optional().nullable(),
});

router.post('/practice', async (req, res) => {
  try {
    const data = practiceSchema.parse(req.body);
    const date = data.date || getBSTDateString();

    const session = await prisma.practiceSession.create({ data: { ...data, date } });
    res.status(201).json(session);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

router.get('/practice', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 30, 90);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));

    const sessions = await prisma.practiceSession.findMany({
      where:   { date: { gte: cutoff } },
      orderBy: { date: 'desc' },
    });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
