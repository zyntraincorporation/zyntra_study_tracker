// /api/notes — Daily notes
const router = require('express').Router();
const { z }  = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString } = require('../lib/schedule');

router.use(requireAuth);

// GET /api/notes/today
router.get('/today', async (req, res) => {
  try {
    const today = getBSTDateString();
    const note  = await prisma.dailyNote.findUnique({ where: { date: today } });
    res.json({ date: today, note: note || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notes?days=30
router.get('/', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 30, 180);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));
    const notes  = await prisma.dailyNote.findMany({
      where:   { date: { gte: cutoff } },
      orderBy: { date: 'desc' },
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes — save or update today's note
const noteSchema = z.object({
  content: z.string().min(1),
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.post('/', async (req, res) => {
  try {
    const data = noteSchema.parse(req.body);
    const date = data.date || getBSTDateString();
    const note = await prisma.dailyNote.upsert({
      where:  { date },
      update: { content: data.content },
      create: { date, content: data.content },
    });
    res.json(note);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:date
router.delete('/:date', async (req, res) => {
  try {
    await prisma.dailyNote.delete({ where: { date: req.params.date } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;