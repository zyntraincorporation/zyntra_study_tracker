// /api/ai — AI analysis trigger and report retrieval
const router = require('express').Router();
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { buildAIContext } = require('../ai/contextBuilder');
const { generateAnalysis } = require('../ai/promptEngine');
const { getBSTDateString } = require('../lib/schedule');

router.use(requireAuth);

// POST /api/ai/analyze — trigger a new AI analysis
router.post('/analyze', async (req, res) => {
  try {
    const days = req.body.days === 30 ? 30 : 7;

    // Build context from DB
    const context = await buildAIContext(days);

    // Call Claude
    const { reportText, score } = await generateAnalysis(context);

    // Save report to DB
    const report = await prisma.aIAnalysisReport.create({
      data: {
        date:       getBSTDateString(),
        reportText,
        score,
        periodDays: days,
      },
    });

    res.json({ report, context: { aggregates: context.aggregates, meta: context.meta } });
  } catch (err) {
    console.error('AI analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed: ' + err.message });
  }
});

// GET /api/ai/reports — list all past reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await prisma.aIAnalysisReport.findMany({
      orderBy: { generatedAt: 'desc' },
      take:    20,
      select:  { id: true, date: true, score: true, periodDays: true, generatedAt: true },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/reports/latest — latest full report
router.get('/reports/latest', async (req, res) => {
  try {
    const report = await prisma.aIAnalysisReport.findFirst({ orderBy: { generatedAt: 'desc' } });
    res.json(report || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/reports/:id — specific report
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await prisma.aIAnalysisReport.findUnique({ where: { id: Number(req.params.id) } });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
