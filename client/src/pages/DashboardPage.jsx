import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Timer, Sparkles, Flame, Target, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { checkinAPI, statsAPI } from '../lib/api';
import { getBSTDayName, getBSTTime, SESSION_SLOTS, WEEKLY_SCHEDULE, SUBJECT_COLORS, isPracticeDay, formatDuration } from '../lib/schedule';
import { LoadingCard, StatCard, SubjectBadge } from '../components/ui/Shared';
import PendingSessionModal from '../components/checkin/PendingSessionModal';
import MorningCheckinModal from '../components/checkin/MorningCheckinModal';
import { useUIStore } from '../store';

export default function DashboardPage() {
  const navigate     = useNavigate();
  const openModal    = useUIStore((s) => s.openModal);
  const day          = getBSTDayName();
  const { hour, minute } = getBSTTime();
  const isBreak      = isPracticeDay(day);

  // Fetch today's sessions
  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['sessions-today'],
    queryFn:  () => checkinAPI.getSessionsToday().then(r => r.data),
    refetchInterval: 60000,
  });

  // Fetch pending sessions
  const { data: pendingData } = useQuery({
    queryKey: ['pending-sessions'],
    queryFn:  () => checkinAPI.getPendingSessions().then(r => r.data),
    refetchInterval: 60000,
  });

  // Fetch morning check-in status
  const { data: morningData } = useQuery({
    queryKey: ['morning-today'],
    queryFn:  () => checkinAPI.getMorningToday().then(r => r.data),
  });

  // Fetch weekly stats
  const { data: statsData } = useQuery({
    queryKey: ['weekly-stats', 7],
    queryFn:  () => statsAPI.getWeekly(7).then(r => r.data),
  });

  // Auto-open morning checkin if not done yet (once per app load)
  useEffect(() => {
    if (morningData && !morningData.checkin) {
      const key = `morning_prompted_${morningData.date}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        openModal('morning');
      }
    }
  }, [morningData]);

  const sessions   = todayData?.schedule || [];
  const pending    = pendingData?.pending || [];
  const isPractice = pendingData?.isPracticeDay || isBreak;
  const streak     = statsData?.streak || 0;
  const avgScore   = statsData?.summary?.avgScore || 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Pending alert banner ──────────────────────────────────── */}
      {pending.length > 0 && (
        <div
          className="card p-4 border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3 cursor-pointer hover:border-yellow-500/50 transition-colors"
          onClick={() => openModal('pending-session')}
        >
          <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">
              {pending.length} session{pending.length > 1 ? 's' : ''} need{pending.length === 1 ? 's' : ''} check-in
            </p>
            <p className="text-xs text-yellow-400/60 mt-0.5">
              {pending.map(s => `S${s.sessionNumber} (${s.subjects.join('/')})`).join(', ')} — Tap to log
            </p>
          </div>
        </div>
      )}

      {/* ── Header stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Study Streak"
          value={`${streak}d`}
          sub="consecutive days"
          color="text-neon-green"
          icon={Flame}
        />
        <StatCard
          label="Avg Score (7d)"
          value={`${avgScore}`}
          sub="out of 100"
          color={avgScore >= 70 ? 'text-neon-green' : avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}
          icon={TrendingUp}
        />
        <StatCard
          label="Today"
          value={day}
          sub={isPractice ? 'Practice Day 📚' : `${sessions.length} sessions`}
          icon={Target}
        />
        <StatCard
          label="BST Time"
          value={`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`}
          sub="Bangladesh Standard"
          icon={Clock}
        />
      </div>

      {/* ── Today's schedule ─────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">Today's Schedule</h2>
        {loadingToday ? (
          <LoadingCard rows={3} />
        ) : isPractice ? (
          <PracticeDayCard day={day} />
        ) : sessions.length === 0 ? (
          <div className="card p-6 text-center text-white/30 text-sm">
            No schedule data — check connection
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <SessionCard
                key={session.sessionNumber}
                session={session}
                currentHour={hour}
                currentMinute={minute}
                onLog={() => openModal('pending-session')}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick action buttons ──────────────────────────────────── */}
      <div>
        <h2 className="section-heading">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/checkin')}
            className="card-hover p-4 flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-neon-green/10 flex items-center justify-center shrink-0">
              <CheckSquare size={18} className="text-neon-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Log Session</p>
              <p className="text-xs text-white/40">Mark completed or missed</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/timer')}
            className="card-hover p-4 flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-neon-blue/10 flex items-center justify-center shrink-0">
              <Timer size={18} className="text-neon-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Custom Study</p>
              <p className="text-xs text-white/40">Start a timed session</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/ai')}
            className="card-hover p-4 flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-neon-purple/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AI Analysis</p>
              <p className="text-xs text-white/40">Get mentor feedback</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Morning status ────────────────────────────────────────── */}
      <MorningStatusCard checkin={morningData?.checkin} onEdit={() => openModal('morning')} />

      {/* ── Modals ────────────────────────────────────────────────── */}
      <MorningCheckinModal />
      <PendingSessionModal pending={pending} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SessionCard({ session, currentHour, currentMinute, onLog }) {
  const slot  = SESSION_SLOTS[session.sessionNumber];
  const nowM  = currentHour * 60 + currentMinute;
  const startM = slot.startHour * 60 + slot.startMin;
  let endM     = slot.endHour * 60 + slot.endMin;
  if (slot.endHour < slot.startHour) endM += 1440;

  const status = session.log
    ? (session.log.completed ? 'done' : 'missed')
    : nowM < startM ? 'upcoming'
    : nowM < endM   ? 'active'
    : 'pending';

  const badges = {
    done:     <span className="badge-green">✓ Done</span>,
    missed:   <span className="badge-red">✗ Missed</span>,
    active:   <span className="badge-blue animate-pulse-slow">● Live now</span>,
    upcoming: <span className="badge-gray">Upcoming</span>,
    pending:  <span className="badge-yellow cursor-pointer" onClick={onLog}>! Log it</span>,
  };

  const borders = {
    done:     'border-neon-green/15',
    missed:   'border-red-500/15',
    active:   'border-neon-blue/30',
    upcoming: 'border-white/[0.06]',
    pending:  'border-yellow-500/20',
  };

  return (
    <div className={`card p-4 border ${borders[status] || ''} ${status === 'active' ? 'shadow-active' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold text-white/30">{slot.label}</span>
            <span className="text-xs text-white/30">{slot.display}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.subjects.map(s => <SubjectBadge key={s} subject={s} />)}
          </div>
          {session.log && !session.log.completed && session.log.reasonMissed && (
            <p className="text-xs text-red-400/70 mt-2">
              Reason: {session.log.reasonMissed}
            </p>
          )}
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
      <Link to="/checkin" className="btn-secondary text-xs w-full justify-center mt-2 block">
        Log practice session →
      </Link>
    </div>
  );
}

function MorningStatusCard({ checkin, onEdit }) {
  return (
    <div>
      <h2 className="section-heading">Morning Routine</h2>
      <div className="card p-4">
        {!checkin ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Today's morning not logged yet</p>
              <p className="text-xs text-white/30 mt-0.5">Did you wake up at 6 AM? Did you study before college?</p>
            </div>
            <button onClick={onEdit} className="btn-primary text-xs shrink-0">Log now</button>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={checkin.wokeUpAt6 ? 'text-neon-green' : 'text-red-400'}>
                {checkin.wokeUpAt6 ? '✓' : '✗'}
              </span>
              <span className="text-sm text-white/60">Woke at 6 AM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={checkin.studiedBeforeCollege ? 'text-neon-green' : 'text-red-400'}>
                {checkin.studiedBeforeCollege ? '✓' : '✗'}
              </span>
              <span className="text-sm text-white/60">Pre-college study</span>
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
