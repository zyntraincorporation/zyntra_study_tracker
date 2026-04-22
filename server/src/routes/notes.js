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

// GET /api/notes?page=1&limit=30
router.get('/', async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 50);
    const skip = (page - 1) * limit;

    const [total, notes] = await Promise.all([
      prisma.dailyNote.count(),
      prisma.dailyNote.findMany({
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
    ]);

    res.json({
      items: notes,
      page,
      limit,
      hasMore: skip + notes.length < total,
    });
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
