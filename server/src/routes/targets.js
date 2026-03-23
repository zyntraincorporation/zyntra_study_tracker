// /api/targets — Monthly chapter targets
const router = require('express').Router();
const { z }  = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/targets?month=2026-04
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || getCurrentMonth();
    const targets = await prisma.monthlyTarget.findMany({
      where:   { yearMonth: month },
      orderBy: [{ subject: 'asc' }, { chapterNumber: 'asc' }],
    });

    // Group by subject
    const grouped = targets.reduce((acc, t) => {
      if (!acc[t.subject]) acc[t.subject] = [];
      acc[t.subject].push(t);
      return acc;
    }, {});

    const summary = Object.entries(grouped).map(([subject, chapters]) => ({
      subject,
      total:     chapters.length,
      completed: chapters.filter(c => c.completed).length,
      chapters,
    }));

    res.json({ month, targets, grouped, summary });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/targets/months — list all months that have targets
router.get('/months', async (req, res) => {
  try {
    const months = await prisma.monthlyTarget.findMany({
      select:  { yearMonth: true },
      distinct: ['yearMonth'],
      orderBy: { yearMonth: 'asc' },
    });
    res.json(months.map(m => m.yearMonth));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/targets/seed — seed all monthly targets from plan
router.post('/seed', async (req, res) => {
  try {
    const { month, targets } = req.body;
    if (!month || !Array.isArray(targets)) {
      return res.status(400).json({ error: 'month and targets[] required' });
    }

    let created = 0;
    for (const t of targets) {
      await prisma.monthlyTarget.upsert({
        where:  { yearMonth_subject_chapterNumber: { yearMonth: month, subject: t.subject, chapterNumber: t.chapterNumber } },
        update: { chapterName: t.chapterName, difficulty: t.difficulty || 'medium' },
        create: { yearMonth: month, subject: t.subject, chapterNumber: t.chapterNumber, chapterName: t.chapterName, difficulty: t.difficulty || 'medium' },
      });
      created++;
    }
    res.json({ created, month });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/targets/:id — mark complete/incomplete
router.patch('/:id', async (req, res) => {
  try {
    const { completed, note } = req.body;
    const target = await prisma.monthlyTarget.update({
      where: { id: Number(req.params.id) },
      data:  {
        completed,
        completedAt: completed ? new Date() : null,
        note: note ?? undefined,
        updatedAt:   new Date(),
      },
    });
    res.json(target);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/targets/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.monthlyTarget.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function getCurrentMonth() {
  const d = new Date(Date.now() + 6 * 3600000); // BST
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

module.exports = router;