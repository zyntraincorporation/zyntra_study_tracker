// /api/stats — Aggregated statistics for charts, dashboard, AI context
const router = require('express').Router();
const prisma = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { getBSTDateString, getDateRange, WEEKLY_SCHEDULE } = require('../lib/schedule');

router.use(requireAuth);

// GET /api/stats/weekly?days=7 — complete stats package for a period
router.get('/weekly', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 7, 90);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));
    const range  = getDateRange(days);

    const [sessionLogs, customSessions, checkins, practiceSessions] = await Promise.all([
      prisma.sessionLog.findMany({        where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
      prisma.customStudySession.findMany({ where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
      prisma.dailyCheckin.findMany({      where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
      prisma.practiceSession.findMany({   where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
    ]);

    // ── Per-day breakdown ────────────────────────────────────────────────────
    const byDay = range.map(({ date, day }) => {
      const dayLogs     = sessionLogs.filter(l => l.date === date);
      const daySessions = customSessions.filter(s => s.date === date);
      const schedule    = WEEKLY_SCHEDULE[day];
      const isBreakDay  = !schedule;

      const scheduledCount = schedule ? Object.keys(schedule).length : 0;
      const completedCount = dayLogs.filter(l => l.completed).length;
      const missedCount    = dayLogs.filter(l => !l.completed).length;
      const extraMinutes   = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

      // Productivity score (0–100): weighted average
      let score = 0;
      if (!isBreakDay && scheduledCount > 0) {
        score = Math.round((completedCount / scheduledCount) * 70); // 70% from sessions
      }
      const checkin = checkins.find(c => c.date === date);
      if (checkin?.wokeUpAt6)            score += 15;
      if (checkin?.studiedBeforeCollege) score += 15;
      if (isBreakDay) score = Math.min(100, 50 + Math.floor(extraMinutes / 30) * 10);

      return {
        date, day, isBreakDay,
        scheduledSessions: scheduledCount,
        completedSessions: completedCount,
        missedSessions:    missedCount,
        extraStudyMinutes: extraMinutes,
        productivityScore: Math.min(100, score),
        wakeUpAt6:   checkin?.wokeUpAt6 || false,
        preStudy:    checkin?.studiedBeforeCollege || false,
        sessions:    dayLogs,
        extras:      daySessions,
      };
    });

    // ── Subject distribution ──────────────────────────────────────────────────
    const subjectMap = {};
    sessionLogs.filter(l => l.completed).forEach(l => {
      subjectMap[l.subject] = (subjectMap[l.subject] || 0) + 1;
    });
    customSessions.forEach(s => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + Math.round(s.durationMinutes / 30);
    });

    // ── Streak calculation ────────────────────────────────────────────────────
    let streak = 0;
    const sortedDays = [...byDay].reverse();
    for (const d of sortedDays) {
      const hasActivity = d.completedSessions > 0 || d.extraStudyMinutes > 0;
      if (hasActivity) streak++;
      else break;
    }

    // ── Missed sessions detail ────────────────────────────────────────────────
    const missedDetail = sessionLogs
      .filter(l => !l.completed)
      .map(l => ({ date: l.date, day: l.dayOfWeek, session: l.sessionNumber, subject: l.subject, reason: l.reasonMissed }));

    // ── Summary totals ────────────────────────────────────────────────────────
    const summary = {
      totalScheduled:   byDay.reduce((s, d) => s + d.scheduledSessions, 0),
      totalCompleted:   byDay.reduce((s, d) => s + d.completedSessions, 0),
      totalMissed:      byDay.reduce((s, d) => s + d.missedSessions, 0),
      totalExtraMin:    byDay.reduce((s, d) => s + d.extraStudyMinutes, 0),
      wakeUpStreak:     streak,
      avgScore:         Math.round(byDay.reduce((s, d) => s + d.productivityScore, 0) / byDay.length),
      practiceCount:    practiceSessions.length,
    };

    res.json({ byDay, subjectDistribution: subjectMap, missedDetail, summary, streak, range });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/heatmap?days=90 — GitHub-style heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const days   = Math.min(Number(req.query.days) || 90, 365);
    const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));
    const range  = getDateRange(days);

    const [sessionLogs, customSessions] = await Promise.all([
      prisma.sessionLog.findMany({ where: { date: { gte: cutoff }, completed: true } }),
      prisma.customStudySession.findMany({ where: { date: { gte: cutoff } } }),
    ]);

    const heatmap = range.map(({ date, day }) => {
      const completed = sessionLogs.filter(l => l.date === date).length;
      const extra     = customSessions.filter(s => s.date === date).reduce((a, s) => a + s.durationMinutes, 0);
      const level     = completed === 0 && extra === 0 ? 0
                      : completed >= 3 || extra >= 90  ? 4
                      : completed === 2 || extra >= 60  ? 3
                      : completed === 1 || extra >= 30  ? 2 : 1;
      return { date, day, completed, extraMin: extra, level };
    });

    res.json(heatmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
