// /api/mistakes — Mistake log CRUD
const router = require('express').Router();
const { z }  = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString } = require('../lib/schedule');

router.use(requireAuth);

const schema = z.object({
  subject:     z.string().min(1),
  topic:       z.string().min(1),
  mistakeType: z.enum(['Concept', 'Formula', 'Calculation', 'Silly', 'Memory']),
  description: z.string().min(1),
  correction:  z.string().optional().nullable(),
  source:      z.enum(['Practice', 'Exam', 'QB', 'Homework', 'Other']).optional().nullable(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GET /api/mistakes?days=30&subject=Physics&resolved=false
router.get('/', async (req, res) => {
  try {
    const days     = Math.min(Number(req.query.days) || 90, 365);
    const cutoff   = getBSTDateString(new Date(Date.now() - days * 86400000));
    const where    = { date: { gte: cutoff } };
    if (req.query.subject)  where.subject  = req.query.subject;
    if (req.query.resolved !== undefined)
      where.resolved = req.query.resolved === 'true';

    const mistakes = await prisma.mistakeLog.findMany({
      where, orderBy: [{ resolved: 'asc' }, { date: 'desc' }],
    });
    res.json(mistakes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/mistakes/stats
router.get('/stats', async (req, res) => {
  try {
    const all = await prisma.mistakeLog.findMany();
    const bySubject = {}, byType = {};
    let unresolved = 0;
    all.forEach(m => {
      bySubject[m.subject]     = (bySubject[m.subject]     || 0) + 1;
      byType[m.mistakeType]    = (byType[m.mistakeType]    || 0) + 1;
      if (!m.resolved) unresolved++;
    });
    res.json({ total: all.length, unresolved, bySubject, byType });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/mistakes
router.post('/', async (req, res) => {
  try {
    const data    = schema.parse(req.body);
    const mistake = await prisma.mistakeLog.create({
      data: { ...data, date: data.date || getBSTDateString() },
    });
    res.status(201).json(mistake);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/mistakes/:id — toggle resolved or update
router.patch('/:id', async (req, res) => {
  try {
    const mistake = await prisma.mistakeLog.update({
      where: { id: Number(req.params.id) },
      data:  { ...req.body, updatedAt: new Date() },
    });
    res.json(mistake);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/mistakes/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.mistakeLog.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
