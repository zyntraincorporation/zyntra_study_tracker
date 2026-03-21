// ─────────────────────────────────────────────────────────────────────────────
// Schedule Engine — Saiful's fixed weekly timetable + BST time logic
// All time operations use Bangladesh Standard Time (UTC+6)
// ─────────────────────────────────────────────────────────────────────────────

const BST_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6

// Session definitions (BST 24-hour)
const SESSION_SLOTS = {
  1: { label: 'S1', startHour: 17, startMin: 0,  endHour: 19, endMin: 0  }, // 5:00 PM – 7:00 PM
  2: { label: 'S2', startHour: 19, startMin: 30, endHour: 22, endMin: 0  }, // 7:30 PM – 10:00 PM
  3: { label: 'S3', startHour: 23, startMin: 0,  endHour: 1,  endMin: 0  }, // 11:00 PM – 1:00 AM (next day)
};

// Weekly schedule — maps each day to [S1, S2, S3] subjects
// Friday & Saturday are practice days (no fixed sessions)
const WEEKLY_SCHEDULE = {
  Sunday:    { 1: ['Botany'],   2: ['Physics'],   3: ['Math', 'Physics'] },
  Monday:    { 1: ['Physics'],  2: ['Math'],       3: ['Chemistry', 'Math'] },
  Tuesday:   { 1: ['Chemistry'],2: ['Zoology'],    3: ['Physics', 'Chemistry'] },
  Wednesday: { 1: ['Botany'],   2: ['Math'],       3: ['Math', 'Chemistry'] },
  Thursday:  { 1: ['Chemistry'],2: ['Physics'],    3: ['Physics', 'Chemistry'] },
  Friday:    null, // Practice day
  Saturday:  null, // Practice day
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Core BST helpers ───────────────────────────────────────────────────────────

/**
 * Returns current time as a Date object representing BST "wall clock"
 * (We shift UTC by +6h so .getHours() gives BST hour)
 */
function getBSTNow() {
  return new Date(Date.now() + BST_OFFSET_MS);
}

/**
 * Returns today's date string in BST as "YYYY-MM-DD"
 */
function getBSTDateString(date = null) {
  const d = date ? new Date(date.getTime() + BST_OFFSET_MS) : getBSTNow();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns day-of-week name (BST) e.g. "Monday"
 */
function getBSTDayName(date = null) {
  const d = date ? new Date(date.getTime() + BST_OFFSET_MS) : getBSTNow();
  return DAY_NAMES[d.getUTCDay()];
}

/**
 * Returns current BST hour and minute
 */
function getBSTTime() {
  const d = getBSTNow();
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

// ── Session status logic ───────────────────────────────────────────────────────

/**
 * Given current BST hour/min, returns the status of a session slot:
 * 'upcoming' | 'active' | 'pending_checkin' | 'done'
 *
 * 'pending_checkin' = session has ended but user hasn't logged it yet
 * (the app detects this and shows the check-in modal)
 */
function getSessionStatus(slot, currentHour, currentMin) {
  const { startHour, startMin, endHour, endMin } = slot;

  const nowMins  = currentHour * 60 + currentMin;
  const startMins = startHour * 60 + startMin;

  // S3 crosses midnight: endHour=1 means next day → add 1440
  let endMins = endHour * 60 + endMin;
  if (endHour < startHour) endMins += 1440; // past midnight

  if (nowMins < startMins) return 'upcoming';
  if (nowMins >= startMins && nowMins < endMins) return 'active';
  // Session has ended
  return 'pending_checkin'; // caller resolves to 'done' if already logged
}

/**
 * Returns the full schedule for a given BST day name, enriched with slot info.
 * Returns null if it's a practice day.
 */
function getDaySchedule(dayName) {
  const schedule = WEEKLY_SCHEDULE[dayName];
  if (!schedule) return null; // Practice day

  return Object.entries(schedule).map(([sessionNum, subjects]) => {
    const slot = SESSION_SLOTS[Number(sessionNum)];
    return {
      sessionNumber: Number(sessionNum),
      label: slot.label,
      subjects,
      startTime: `${String(slot.startHour).padStart(2,'0')}:${String(slot.startMin).padStart(2,'0')}`,
      endTime:   `${String(slot.endHour).padStart(2,'0')}:${String(slot.endMin).padStart(2,'0')}`,
      startHour: slot.startHour,
      startMin:  slot.startMin,
      endHour:   slot.endHour,
      endMin:    slot.endMin,
    };
  });
}

/**
 * Returns all sessions that should have check-ins by now (session ended, no log)
 * Used by: dashboard pending session detection
 */
function getPendingSessions(dayName, currentHour, currentMin, existingLogs) {
  const daySchedule = getDaySchedule(dayName);
  if (!daySchedule) return [];

  const loggedSessions = new Set(existingLogs.map(l => l.sessionNumber));

  return daySchedule.filter(session => {
    if (loggedSessions.has(session.sessionNumber)) return false;
    const status = getSessionStatus(session, currentHour, currentMin);
    return status === 'pending_checkin';
  });
}

/**
 * Returns the currently active session (if any)
 */
function getActiveSession(dayName, currentHour, currentMin) {
  const daySchedule = getDaySchedule(dayName);
  if (!daySchedule) return null;
  return daySchedule.find(s => getSessionStatus(s, currentHour, currentMin) === 'active') || null;
}

/**
 * Returns array of day names for a given date range (for weekly stats)
 */
function getDateRange(days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    result.push({
      date: getBSTDateString(d),
      day: getBSTDayName(d),
    });
  }
  return result;
}

/**
 * Returns all subjects for a given day (flat, for stats)
 */
function getDaySubjects(dayName) {
  const schedule = WEEKLY_SCHEDULE[dayName];
  if (!schedule) return [];
  return [...new Set(Object.values(schedule).flat())];
}

module.exports = {
  WEEKLY_SCHEDULE,
  SESSION_SLOTS,
  DAY_NAMES,
  BST_OFFSET_MS,
  getBSTNow,
  getBSTDateString,
  getBSTDayName,
  getBSTTime,
  getSessionStatus,
  getDaySchedule,
  getPendingSessions,
  getActiveSession,
  getDateRange,
  getDaySubjects,
};
