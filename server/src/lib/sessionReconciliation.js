const prisma = require('../db/client');
const {
  getBSTDateString,
  getBSTDayNameFromDateString,
  addBSTDays,
  getScheduledSessionsForDate,
} = require('./schedule');

const AUTO_MISS_INTERVAL_MS = 60 * 1000;
const AUTO_MISS_REASON = 'Other';

let workerHandle = null;

function getSessionKey(sessionDate, sessionNumber) {
  return `${sessionDate}:${sessionNumber}`;
}

function getRelevantScheduledSessions(now = new Date()) {
  const currentDate = getBSTDateString(now);
  const previousDate = addBSTDays(currentDate, -1);
  const currentSchedule = getScheduledSessionsForDate(currentDate);
  const carryover = getScheduledSessionsForDate(previousDate)
    .filter((session) => session.sessionNumber === 3);

  return {
    currentDate,
    currentDayName: getBSTDayNameFromDateString(currentDate),
    previousDate,
    currentSchedule,
    carryover,
    relevantDates: [...new Set([currentDate, ...carryover.map((session) => session.sessionDate)])],
    relevantSessions: [...carryover, ...currentSchedule],
  };
}

async function reconcileScheduledSessionLogs(now = new Date()) {
  const { relevantSessions, relevantDates } = getRelevantScheduledSessions(now);
  const endedSessions = relevantSessions.filter((session) => session.endAt <= now);

  if (endedSessions.length === 0) {
    return { createdCount: 0 };
  }

  const existingLogs = await prisma.sessionLog.findMany({
    where: { date: { in: relevantDates } },
    select: { date: true, sessionNumber: true },
  });

  const existingKeys = new Set(
    existingLogs.map((log) => getSessionKey(log.date, log.sessionNumber))
  );

  const data = endedSessions
    .filter((session) => !existingKeys.has(getSessionKey(session.sessionDate, session.sessionNumber)))
    .map((session) => ({
      date: session.sessionDate,
      dayOfWeek: session.dayOfWeek,
      sessionNumber: session.sessionNumber,
      subject: session.subjects[0],
      completed: false,
      actualMinutes: 0,
      reasonMissed: AUTO_MISS_REASON,
      didInstead: null,
      notes: null,
    }));

  if (data.length === 0) {
    return { createdCount: 0 };
  }

  const result = await prisma.sessionLog.createMany({
    data,
    skipDuplicates: true,
  });

  return { createdCount: result.count || 0 };
}

function startSessionAutoMissWorker(intervalMs = AUTO_MISS_INTERVAL_MS) {
  if (workerHandle) return workerHandle;

  let running = false;

  const run = async () => {
    if (running) return;
    running = true;

    try {
      const { createdCount } = await reconcileScheduledSessionLogs();
      if (createdCount > 0) {
        console.log(`[AutoMiss] Created ${createdCount} missed session log(s)`);
      }
    } catch (err) {
      console.error('[AutoMiss] Reconciliation failed:', err.message);
    } finally {
      running = false;
    }
  };

  void run();
  workerHandle = setInterval(run, intervalMs);
  if (typeof workerHandle.unref === 'function') {
    workerHandle.unref();
  }
  return workerHandle;
}

module.exports = {
  AUTO_MISS_REASON,
  getRelevantScheduledSessions,
  reconcileScheduledSessionLogs,
  startSessionAutoMissWorker,
};
