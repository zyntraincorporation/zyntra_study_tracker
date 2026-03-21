// /api/chapters — Chapter progress CRUD
const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/chapters — all chapters grouped by subject
router.get('/', async (req, res) => {
  try {
    const chapters = await prisma.chapterProgress.findMany({
      orderBy: [{ subject: 'asc' }, { chapterNumber: 'asc' }],
    });

    // Group by subject
    const grouped = chapters.reduce((acc, ch) => {
      if (!acc[ch.subject]) acc[ch.subject] = [];
      acc[ch.subject].push(ch);
      return acc;
    }, {});

    // Summary stats per subject
    const summary = Object.entries(grouped).map(([subject, chs]) => ({
      subject,
      total:       chs.length,
      completed:   chs.filter(c => c.status === 'completed').length,
      revised:     chs.filter(c => c.status === 'revised').length,
      inProgress:  chs.filter(c => c.status === 'in_progress').length,
      notStarted:  chs.filter(c => c.status === 'not_started').length,
      chapters:    chs,
    }));

    res.json({ grouped, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/chapters/:id — update chapter status
const updateSchema = z.object({
  status:          z.enum(['not_started', 'in_progress', 'completed', 'revised']),
  completedTopics: z.number().int().min(0).optional(),
  totalTopics:     z.number().int().min(1).optional(),
});

router.patch('/:id', async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const chapter = await prisma.chapterProgress.update({
      where: { id: Number(req.params.id) },
      data:  { ...data, lastUpdated: new Date() },
    });
    res.json(chapter);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chapters/bulk-update — update multiple chapters at once
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, status }]
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates must be array' });

    const results = await Promise.all(
      updates.map(u =>
        prisma.chapterProgress.update({
          where: { id: Number(u.id) },
          data:  { status: u.status, lastUpdated: new Date() },
        })
      )
    );

    res.json({ updated: results.length, chapters: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
