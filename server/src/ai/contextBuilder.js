// ─────────────────────────────────────────────────────────────────────────────
// AI Context Builder — queries all tables and structures data for Claude
// ─────────────────────────────────────────────────────────────────────────────
const prisma = require('../db/client');
const { getBSTDateString, getDateRange, WEEKLY_SCHEDULE } = require('../lib/schedule');

/**
 * Builds a complete, structured context object for the AI prompt.
 * @param {number} days - how many days to include (7 or 30)
 */
async function buildAIContext(days = 7) {
  const cutoff = getBSTDateString(new Date(Date.now() - days * 86400000));
  const today  = getBSTDateString();
  const range  = getDateRange(days);

  const [sessionLogs, customSessions, checkins, practiceSessions, chapters] = await Promise.all([
    prisma.sessionLog.findMany({        where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
    prisma.customStudySession.findMany({ where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
    prisma.dailyCheckin.findMany({      where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
    prisma.practiceSession.findMany({   where: { date: { gte: cutoff } }, orderBy: { date: 'asc' } }),
    prisma.chapterProgress.findMany({   orderBy: [{ subject: 'asc' }, { chapterNumber: 'asc' }] }),
  ]);

  // ── Per-day structured summary ─────────────────────────────────────────────
  const dailySummaries = range.map(({ date, day }) => {
    const dayLogs        = sessionLogs.filter(l => l.date === date);
    const completed      = dayLogs.filter(l => l.completed);
    const missed         = dayLogs.filter(l => !l.completed);
    const extras         = customSessions.filter(s => s.date === date);
    const checkin        = checkins.find(c => c.date === date);
    const schedule       = WEEKLY_SCHEDULE[day];
    const isPracticeDay  = !schedule;
    const practices      = practiceSessions.filter(p => p.date === date);

    return {
      date, day, isPracticeDay,
      scheduled: isPracticeDay ? 0 : Object.keys(schedule || {}).length,
      completedSessions: completed.map(l => ({
        session: `S${l.sessionNumber}`, subject: l.subject,
        minutes: l.actualMinutes || (l.sessionNumber === 1 ? 120 : l.sessionNumber === 2 ? 150 : 120),
      })),
      missedSessions: missed.map(l => ({
        session: `S${l.sessionNumber}`, subject: l.subject,
        reason: l.reasonMissed || 'Not provided',
        didInstead: l.didInstead || 'Not specified',
        minutesStudied: l.actualMinutes,
      })),
      extraStudy: extras.map(s => ({
        subject: s.subject,
        minutes: s.durationMinutes,
        studyType: s.studyType || null,
        chapter: s.chapter || null,
        notes: s.notes || null,
      })),
      morning: checkin ? {
        wokeUpAt6: checkin.wokeUpAt6,
        studiedBefore: checkin.studiedBeforeCollege,
        preStudySubject: checkin.preCollegeSubject,
      } : null,
      practiceWork: practices.map(p => ({ subject: p.subject, minutes: p.durationMinutes, type: p.type })),
    };
  });

  // ── Subject frequency analysis ─────────────────────────────────────────────
  const subjectStats = {};
  sessionLogs.forEach(l => {
    if (!subjectStats[l.subject]) subjectStats[l.subject] = { completed: 0, missed: 0, totalMissedMin: 0 };
    if (l.completed) subjectStats[l.subject].completed++;
    else {
      subjectStats[l.subject].missed++;
      subjectStats[l.subject].totalMissedMin += (l.sessionNumber === 2 ? 150 : 120) - (l.actualMinutes || 0);
    }
  });

  // ── Chapter completion rates ───────────────────────────────────────────────
  const chapterSummary = chapters.reduce((acc, ch) => {
    if (!acc[ch.subject]) acc[ch.subject] = { total: 0, completed: 0, revised: 0, inProgress: 0 };
    acc[ch.subject].total++;
    if (ch.status === 'completed') acc[ch.subject].completed++;
    if (ch.status === 'revised')   acc[ch.subject].revised++;
    if (ch.status === 'in_progress') acc[ch.subject].inProgress++;
    return acc;
  }, {});

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const totalScheduled = dailySummaries.reduce((s, d) => s + d.scheduled, 0);
  const totalCompleted = sessionLogs.filter(l => l.completed).length;
  const totalMissed    = sessionLogs.filter(l => !l.completed).length;
  const wakeUpCount    = checkins.filter(c => c.wokeUpAt6).length;
  const preStudyCount  = checkins.filter(c => c.studiedBeforeCollege).length;
  const checkinCount   = checkins.length;
  const totalExtraMin  = customSessions.reduce((s, c) => s + c.durationMinutes, 0);

  // Streak
  let streak = 0;
  for (let i = dailySummaries.length - 1; i >= 0; i--) {
    const d = dailySummaries[i];
    if (d.completedSessions.length > 0 || d.extraStudy.length > 0) streak++;
    else break;
  }

  return {
    meta: {
      studentName: 'Saiful',
      target: 'BUET admission exam',
      hscBatch: 2027,
      classXIExam: 'May 2026',
      today,
      periodDays: days,
      periodStart: cutoff,
      analysisDate: today,
    },
    aggregates: {
      totalScheduled, totalCompleted, totalMissed,
      completionRate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
      wakeUpAt6Rate:  checkinCount > 0 ? Math.round((wakeUpCount / checkinCount) * 100) : 0,
      preStudyRate:   checkinCount > 0 ? Math.round((preStudyCount / checkinCount) * 100) : 0,
      streak,
      totalExtraStudyMinutes: totalExtraMin,
      practiceSessionCount: practiceSessions.length,
    },
    subjectStats,
    chapterProgress: chapterSummary,
    dailySummaries,
  };
}

module.exports = { buildAIContext };
