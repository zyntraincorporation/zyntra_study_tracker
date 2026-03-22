import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Timer, Sparkles, Flame, Target, TrendingUp, Clock, AlertTriangle, BookOpen, GraduationCap, Award } from 'lucide-react';
import { checkinAPI, statsAPI, chaptersAPI } from '../lib/api';
import { getBSTDayName, getBSTTime, SESSION_SLOTS, SUBJECT_COLORS, isPracticeDay } from '../lib/schedule';
import { LoadingCard, SubjectBadge } from '../components/ui/Shared';
import PendingSessionModal from '../components/checkin/PendingSessionModal';
import MorningCheckinModal from '../components/checkin/MorningCheckinModal';
import { useUIStore } from '../store';

// Which chapter subjects count for each goal
const BUET_SUBJECTS = ['Physics', 'Chemistry', 'HigherMath'];
const DU_SUBJECTS   = ['Physics', 'Chemistry', 'HigherMath', 'Botany', 'Zoology', 'English1', 'English2'];
const HSC_SUBJECTS  = ['Physics', 'Chemistry', 'HigherMath', 'Botany', 'Zoology', 'English1', 'English2', 'Bangla1', 'Bangla2', 'ICT'];

export default function DashboardPage() {
  const navigate  = useNavigate();
  const openModal = useUIStore(s => s.openModal);
  const day       = getBSTDayName();
  const { hour, minute } = getBSTTime();
  const isBreak   = isPracticeDay(day);

  const { data: todayData,   isLoading: loadingToday } = useQuery({
    queryKey: ['sessions-today'],
    queryFn:  () => checkinAPI.getSessionsToday().then(r => r.data),
    refetchInterval: 60000,
  });
  const { data: pendingData } = useQuery({
    queryKey: ['pending-sessions'],
    queryFn:  () => checkinAPI.getPendingSessions().then(r => r.data),
    refetchInterval: 60000,
  });
  const { data: morningData } = useQuery({
    queryKey: ['morning-today'],
    queryFn:  () => checkinAPI.getMorningToday().then(r => r.data),
  });
  const { data: statsData } = useQuery({
    queryKey: ['weekly-stats', 7],
    queryFn:  () => statsAPI.getWeekly(7).then(r => r.data),
  });
  const { data: chaptersData } = useQuery({
    queryKey: ['chapters'],
    queryFn:  () => chaptersAPI.getAll().then(r => r.data),
  });

  useEffect(() => {
    if (morningData && !morningData.checkin) {
      const key = `morning_prompted_${morningData.date}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        openModal('morning');
      }
    }
  }, [morningData]);

  const sessions = todayData?.schedule || [];
  const pending  = pendingData?.pending || [];
  const streak   = statsData?.streak    || 0;
  const avgScore = statsData?.summary?.avgScore || 0;

  // ── Chapter stats per goal ─────────────────────────────────────────────────
  const chapterSummary = chaptersData?.summary || [];
  function goalStats(subjectKeys) {
    const subs   = chapterSummary.filter(s => subjectKeys.includes(s.subject));
    const total  = subs.reduce((a, s) => a + s.total, 0);
    const done   = subs.reduce((a, s) => a + s.completed + s.revised, 0);
    const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }
  const buet = goalStats(BUET_SUBJECTS);
  const du   = goalStats(DU_SUBJECTS);
  const hsc  = goalStats(HSC_SUBJECTS);

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Pending alert ───────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div
          className="card p-4 border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3 cursor-pointer hover:border-yellow-500/50 transition-colors"
          onClick={() => openModal('pending-session')}
        >
          <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">
              {pending.length}টা session লগ করা বাকি
            </p>
            <p className="text-xs text-yellow-400/60 mt-0.5">
              {pending.map(s => `S${s.sessionNumber} (${s.subjects.join('/')})`).join(', ')} — ট্যাপ করো
            </p>
          </div>
        </div>
      )}

      {/* ── Top stats row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-white/40 mb-1">Study Streak</p>
          <p className="text-2xl font-bold text-neon-green">{streak}d</p>
          <p className="text-xs text-white/30 mt-1">consecutive days</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-white/40 mb-1">Avg Score (7d)</p>
          <p className={`text-2xl font-bold ${avgScore >= 70 ? 'text-neon-green' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {avgScore}
          </p>
          <p className="text-xs text-white/30 mt-1">out of 100</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-white/40 mb-1">Today</p>
          <p className="text-lg font-bold text-white">{day}</p>
          <p className="text-xs text-white/30 mt-1">{isBreak ? 'Practice Day 📚' : `${sessions.length} sessions`}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-white/40 mb-1">BST Time</p>
          <p className="text-2xl font-bold tabular-nums text-white">
            {String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')}
          </p>
          <p className="text-xs text-white/30 mt-1">Bangladesh Standard</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          GOAL INFOGRAPHICS — BUET / DU / HSC
      ══════════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="section-heading">লক্ষ্য অনুযায়ী অগ্রগতি</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── BUET (highlighted) ──────────────────────────────────── */}
          <div className="card p-5 border-red-500/25 bg-red-500/5 relative overflow-hidden">
            {/* glow bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <Award size={16} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">BUET</p>
                  <p className="text-[11px] text-white/40">Physics · Chemistry · Math</p>
                </div>
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-semibold">
                  সর্বোচ্চ Priority
                </span>
              </div>

              {/* Big arc gauge */}
              <div className="flex justify-center mb-4">
                <ArcGauge pct={buet.pct} color="#ef4444" size={100} />
              </div>

              <p className="text-center text-xs text-white/40 mb-4">{buet.done} / {buet.total} chapters done</p>

              {/* Per subject bars */}
              {chapterSummary.filter(s => BUET_SUBJECTS.includes(s.subject)).map(s => {
                const done = s.completed + s.revised;
                const pct  = s.total > 0 ? Math.round((done / s.total) * 100) : 0;
                const labels = { Physics: '⚡ Physics', Chemistry: '🧪 Chemistry', HigherMath: '📐 Math' };
                const colors = { Physics: 'bg-sky-400', Chemistry: 'bg-emerald-400', HigherMath: 'bg-violet-400' };
                return (
                  <div key={s.subject} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{labels[s.subject]}</span>
                      <span className="text-white/40">{done}/{s.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[s.subject]} transition-all duration-700`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── DU ──────────────────────────────────────────────────── */}
          <div className="card p-5 border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <GraduationCap size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">DU / Other Universities</p>
                <p className="text-[11px] text-white/40">PCMB + English</p>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <ArcGauge pct={du.pct} color="#60a5fa" size={100} />
            </div>
            <p className="text-center text-xs text-white/40 mb-4">{du.done} / {du.total} chapters done</p>

            {chapterSummary.filter(s => DU_SUBJECTS.includes(s.subject)).map(s => {
              const done = s.completed + s.revised;
              const pct  = s.total > 0 ? Math.round((done / s.total) * 100) : 0;
              const labels = { Physics:'⚡ Physics', Chemistry:'🧪 Chemistry', HigherMath:'📐 Math', Botany:'🌿 Botany', Zoology:'🦋 Zoology', English1:'📖 English 1st', English2:'✍️ English 2nd' };
              return (
                <div key={s.subject} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/55 truncate">{labels[s.subject] || s.subject}</span>
                    <span className="text-white/35 shrink-0 ml-2">{done}/{s.total}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400 transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── HSC ─────────────────────────────────────────────────── */}
          <div className="card p-5 border-neon-green/15">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center">
                <BookOpen size={16} className="text-neon-green" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">HSC 2027</p>
                <p className="text-[11px] text-white/40">সব বিষয় মিলিয়ে</p>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <ArcGauge pct={hsc.pct} color="#00ff87" size={100} />
            </div>
            <p className="text-center text-xs text-white/40 mb-4">{hsc.done} / {hsc.total} chapters done</p>

            {chapterSummary.filter(s => HSC_SUBJECTS.includes(s.subject)).map(s => {
              const done = s.completed + s.revised;
              const pct  = s.total > 0 ? Math.round((done / s.total) * 100) : 0;
              const labels = { Physics:'⚡', Chemistry:'🧪', HigherMath:'📐', Botany:'🌿', Zoology:'🦋', English1:'📖', English2:'✍️', Bangla1:'📚', Bangla2:'🖊️', ICT:'💻' };
              return (
                <div key={s.subject} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/55">{labels[s.subject]} {s.subject === 'HigherMath' ? 'Math' : s.subject.replace(/[12]$/, '')}</span>
                    <span className="text-white/35">{done}/{s.total}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-neon-green/60 transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Today's schedule ────────────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">আজকের Schedule</h2>
        {loadingToday ? (
          <LoadingCard rows={3} />
        ) : isBreak ? (
          <PracticeDayCard day={day} />
        ) : sessions.length === 0 ? (
          <div className="card p-6 text-center text-white/30 text-sm">Schedule data নেই</div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <SessionCard key={session.sessionNumber} session={session}
                currentHour={hour} currentMinute={minute} onLog={() => openModal('pending-session')} />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate('/checkin')} className="card-hover p-4 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-neon-green/10 flex items-center justify-center shrink-0">
              <CheckSquare size={18} className="text-neon-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Log Session</p>
              <p className="text-xs text-white/40">Completed বা missed mark করো</p>
            </div>
          </button>
          <button onClick={() => navigate('/timer')} className="card-hover p-4 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-neon-blue/10 flex items-center justify-center shrink-0">
              <Timer size={18} className="text-neon-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Custom Study</p>
              <p className="text-xs text-white/40">Timer দিয়ে পড়া শুরু করো</p>
            </div>
          </button>
          <button onClick={() => navigate('/ai')} className="card-hover p-4 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-neon-purple/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AI Analysis</p>
              <p className="text-xs text-white/40">Mentor feedback নাও</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Morning status ───────────────────────────────────────────────── */}
      <MorningStatusCard checkin={morningData?.checkin} onEdit={() => openModal('morning')} />

      <MorningCheckinModal />
      <PendingSessionModal pending={pending} />
    </div>
  );
}

// ── Arc gauge SVG ─────────────────────────────────────────────────────────────
function ArcGauge({ pct, color, size = 100 }) {
  const r    = size * 0.38;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
      <path d={`M ${size*0.12} ${size*0.56} A ${r} ${r} 0 0 1 ${size*0.88} ${size*0.56}`}
        fill="none" stroke="#ffffff10" strokeWidth={size*0.08} strokeLinecap="round" />
      <path d={`M ${size*0.12} ${size*0.56} A ${r} ${r} 0 0 1 ${size*0.88} ${size*0.56}`}
        fill="none" stroke={color} strokeWidth={size*0.08} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={size*0.48} textAnchor="middle" fill={color}
        fontSize={size*0.2} fontWeight="700" fontFamily="Inter,sans-serif">{pct}%</text>
    </svg>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────
function SessionCard({ session, currentHour, currentMinute, onLog }) {
  const slot   = SESSION_SLOTS[session.sessionNumber];
  const nowM   = currentHour * 60 + currentMinute;
  const startM = slot.startHour * 60 + slot.startMin;
  let endM     = slot.endHour * 60 + slot.endMin;
  if (slot.endHour < slot.startHour) endM += 1440;

  const status = session.log
    ? (session.log.completed ? 'done' : 'missed')
    : nowM < startM ? 'upcoming' : nowM < endM ? 'active' : 'pending';

  const badges  = {
    done:     <span className="badge-green">✓ Done</span>,
    missed:   <span className="badge-red">✗ Missed</span>,
    active:   <span className="badge-blue animate-pulse-slow">● Live now</span>,
    upcoming: <span className="badge-gray">Upcoming</span>,
    pending:  <span className="badge-yellow cursor-pointer" onClick={onLog}>! Log করো</span>,
  };
  const borders = { done:'border-neon-green/15', missed:'border-red-500/15', active:'border-neon-blue/30', upcoming:'border-white/[0.06]', pending:'border-yellow-500/20' };

  return (
    <div className={`card p-4 border ${borders[status] || ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-white/30">{slot.label}</span>
            <span className="text-xs text-white/30">{slot.display}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.subjects.map(s => <SubjectBadge key={s} subject={s} />)}
          </div>
        </div>
        <div className="shrink-0">{badges[status]}</div>
      </div>
    </div>
  );
}

function PracticeDayCard({ day }) {
  return (
    <div className="card p-6 border border-neon-purple/15">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-neon-purple/10 flex items-center justify-center">
          <Target size={18} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{day} — Practice Day</p>
          <p className="text-xs text-white/40">
            {day === 'Friday' ? 'QB solving + non-academic reading' : 'Admission Question Bank practice'}
          </p>
        </div>
      </div>
      <Link to="/checkin" className="btn-secondary text-xs w-full justify-center mt-2 block text-center">
        Practice session log করো →
      </Link>
    </div>
  );
}

function MorningStatusCard({ checkin, onEdit }) {
  return (
    <div>
      <h2 className="section-heading">সকালের Routine</h2>
      <div className="card p-4">
        {!checkin ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">আজকের সকাল লগ করা হয়নি</p>
              <p className="text-xs text-white/30 mt-0.5">৬টায় উঠেছিলে? কলেজের আগে পড়েছিলে?</p>
            </div>
            <button onClick={onEdit} className="btn-primary text-xs shrink-0">Log করো</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={checkin.wokeUpAt6 ? 'text-neon-green' : 'text-red-400'}>
                {checkin.wokeUpAt6 ? '✓' : '✗'}
              </span>
              <span className="text-sm text-white/60">৬টায় উঠেছি</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={checkin.studiedBeforeCollege ? 'text-neon-green' : 'text-red-400'}>
                {checkin.studiedBeforeCollege ? '✓' : '✗'}
              </span>
              <span className="text-sm text-white/60">কলেজের আগে পড়া</span>
              {checkin.studiedBeforeCollege && checkin.preCollegeSubject && (
                <SubjectBadge subject={checkin.preCollegeSubject} />
              )}
            </div>
            <button onClick={onEdit} className="ml-auto btn-ghost text-xs">Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}