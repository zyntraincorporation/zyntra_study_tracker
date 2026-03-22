export const BST_OFFSET_MS = 6 * 60 * 60 * 1000;

export const SESSION_SLOTS = {
  1: { label: 'S1', startHour: 17, startMin: 0,  endHour: 19, endMin: 0,  display: '5:00 PM – 7:00 PM'   },
  2: { label: 'S2', startHour: 19, startMin: 30, endHour: 22, endMin: 0,  display: '7:30 PM – 10:00 PM'  },
  3: { label: 'S3', startHour: 23, startMin: 0,  endHour: 1,  endMin: 0,  display: '11:00 PM – 1:00 AM'  },
};

export const WEEKLY_SCHEDULE = {
  Sunday:    { 1: ['Botany'],    2: ['Physics'],  3: ['Math', 'Physics']      },
  Monday:    { 1: ['Physics'],   2: ['Math'],      3: ['Chemistry', 'Math']   },
  Tuesday:   { 1: ['Chemistry'], 2: ['Zoology'],   3: ['Physics', 'Chemistry']},
  Wednesday: { 1: ['Botany'],    2: ['Math'],      3: ['Math', 'Chemistry']   },
  Thursday:  { 1: ['Chemistry'], 2: ['Physics'],   3: ['Physics', 'Chemistry']},
  Friday:    null,
  Saturday:  null,
};

// PCMB = scheduled subjects | EBI = timer-only subjects
export const SUBJECTS_SCHEDULED = ['Physics', 'Chemistry', 'Math', 'Botany', 'Zoology'];
export const SUBJECTS_TIMER     = ['Physics', 'Chemistry', 'Math', 'Botany', 'Zoology', 'English', 'Bangla', 'ICT', 'Other'];
export const SUBJECTS           = SUBJECTS_TIMER; // backward compat

export const MISS_REASONS = ['Tired', 'Forgot', 'Emergency', 'Laziness', 'Sick', 'Other'];

export const SUBJECT_COLORS = {
  Physics:   { bg: 'bg-sky-500/15',     text: 'text-sky-400',     dot: 'bg-sky-400',     hex: '#38bdf8' },
  Chemistry: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', hex: '#34d399' },
  Math:      { bg: 'bg-violet-500/15',  text: 'text-violet-400',  dot: 'bg-violet-400',  hex: '#a78bfa' },
  Botany:    { bg: 'bg-green-500/15',   text: 'text-green-400',   dot: 'bg-green-400',   hex: '#4ade80' },
  Zoology:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400',   hex: '#fbbf24' },
  English:   { bg: 'bg-pink-500/15',    text: 'text-pink-400',    dot: 'bg-pink-400',    hex: '#f472b6' },
  Bangla:    { bg: 'bg-orange-500/15',  text: 'text-orange-400',  dot: 'bg-orange-400',  hex: '#fb923c' },
  ICT:       { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    dot: 'bg-cyan-400',    hex: '#22d3ee' },
  Other:     { bg: 'bg-white/10',       text: 'text-white/60',    dot: 'bg-white/40',    hex: '#94a3b8' },
};

export const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function getBSTNow() {
  return new Date(Date.now() + BST_OFFSET_MS);
}
export function getBSTDateString() {
  const d = getBSTNow();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function getBSTDayName() {
  return DAY_NAMES[getBSTNow().getUTCDay()];
}
export function getBSTTime() {
  const d = getBSTNow();
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}
export function formatDuration(minutes) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
export function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
export function getSessionStatus(slot, currentHour, currentMin) {
  const nowMins   = currentHour * 60 + currentMin;
  const startMins = slot.startHour * 60 + slot.startMin;
  let endMins     = slot.endHour   * 60 + slot.endMin;
  if (slot.endHour < slot.startHour) endMins += 1440;
  if (nowMins < startMins) return 'upcoming';
  if (nowMins >= startMins && nowMins < endMins) return 'active';
  return 'ended';
}
export function isPracticeDay(dayName) {
  return dayName === 'Friday' || dayName === 'Saturday';
}