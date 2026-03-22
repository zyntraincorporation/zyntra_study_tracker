import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, Timer, Sparkles, Target, AlertTriangle, BookOpen, GraduationCap, Award } from 'lucide-react';
import { checkinAPI, statsAPI, chaptersAPI } from '../lib/api';
import { getBSTDayName, getBSTTime, SESSION_SLOTS, isPracticeDay } from '../lib/schedule';
import { LoadingCard, SubjectBadge } from '../components/ui/Shared';
import PendingSessionModal from '../components/checkin/PendingSessionModal';
import MorningCheckinModal from '../components/checkin/MorningCheckinModal';
import { useUIStore } from '../store';

const BUET_SUBJECTS = ['Physics', 'Chemistry', 'HigherMath'];
const DU_SUBJECTS   = ['Physics', 'Chemistry', 'HigherMath', 'Botany', 'Zoology', 'English1', 'English2'];
const HSC_SUBJECTS  = ['Physics', 'Chemistry', 'HigherMath', 'Botany', 'Zoology', 'English1', 'English2', 'Bangla1', 'Bangla2', 'ICT'];

// ── Countdown config ───────────────────────────────────────────────────────────
const BUET_DEADLINE = new Date('2026-12-31T23:59:59+06:00'); // PCM শেষ করার deadline
const HSC_DEADLINE  = new Date('2027-03-15T00:00:00+06:00'); // HSC exam
const APP_START     = new Date('2026-03-22T00:00:00+06:00'); // reference start

function getCountdown(target) {
  const now    = Date.now();
  const diff   = target.getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, pctLeft: 0, pctPassed: 100 };

  const totalMs  = target.getTime() - APP_START.getTime();
  const passedMs = now - APP_START.getTime();
  const pctPassed = Math.min(100, Math.max(0, Math.round((passedMs / totalMs) * 100)));

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { days, hours, minutes, seconds, pctLeft: 100 - pctPassed, pctPassed };
}

export default function DashboardPage() {
  const navigate  = useNavigate();
  const openModal = useUIStore(s => s.openModal);
  const day       = getBSTDayName();
  const { hour, minute } = getBSTTime();
  const isBreak   = isPracticeDay(day);

  // 1-second ticker for countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const buetCD = getCountdown(BUET_DEADLINE);
  const hscCD  = getCountdown(HSC_DEADLINE);

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

  const chapterSummary = chaptersData?.summary || [];
  function goalStats(keys) {
    const subs  = chapterSummary.filter(s => keys.includes(s.subject));
    const total = subs.reduce((a, s) => a + s.total, 0);
    const done  = subs.reduce((a, s) => a + s.completed + s.revised, 0);
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }
  const buetGoal = goalStats(BUET_SUBJECTS);
  const duGoal   = goalStats(DU_SUBJECTS);
  const hscGoal  = goalStats(HSC_SUBJECTS);

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ══════════════════════════════════════════════════════════════════
          COUNTDOWN TIMERS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── BUET — HIGHLIGHTED ────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/50 p-6"
          style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.4) 0%, rgba(13,18,36,0.95) 60%)' }}>
          {/* decorative glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Award size={17} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-white">BUET Admission</p>
                <p className="text-xs text-red-400/70">Physics · Chemistry · Math শেষ করার deadline</p>
              </div>
              <span className="shrink-0 text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 rounded-full px-2.5 py-1 font-bold">
                🎯 MAIN TARGET
              </span>
            </div>
            <p className="text-[11px] text-red-400/50 mb-5 ml-12">৩১ ডিসেম্বর ২০২৬ পর্যন্ত PCM syllabus শেষ + revision</p>

            {/* DD:HH:MM:SS boxes */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {[
                { val: buetCD.days,    label: 'দিন'     },
                { val: buetCD.hours,   label: 'ঘণ্টা'   },
                { val: buetCD.minutes, label: 'মিনিট'   },
                { val: buetCD.seconds, label: 'সেকেন্ড' },
              ].map(({ val, label }, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-14 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-black tabular-nums text-red-200 leading-none">
                        {String(val).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[10px] text-red-500/50 mt-1.5 font-medium">{label}</span>
                  </div>
                  {i < 3 && <span className="text-red-500/60 text-xl font-bold mb-4 select-none">:</span>}
                </div>
              ))}
            </div>
{/* Syllabus remaining bar — BUET */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/40">Syllabus অগ্রগতি (PCM)</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-400/70">{buetGoal.pct}% শেষ হয়েছে</span>
                  <span className="text-sm font-black text-red-300">{100 - buetGoal.pct}% বাকি</span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-black/30 border border-red-500/10 overflow-hidden">
                <div
                  className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
                  style={{
                    width: `${buetGoal.pct}%`,
                    background: 'linear-gradient(90deg, #7f1d1d, #ef4444)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse-slow" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] mt-1.5 text-red-500/40">
                <span>{buetGoal.done} / {buetGoal.total} chapters সম্পন্ন</span>
                <span>{buetGoal.total - buetGoal.done} chapters বাকি</span>
              </div>
            </div>{/* Syllabus remaining bar — BUET */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/40">Syllabus অগ্রগতি (PCM)</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-400/70">{buetGoal.pct}% শেষ হয়েছে</span>
                  <span className="text-sm font-black text-red-300">{100 - buetGoal.pct}% বাকি</span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-black/30 border border-red-500/10 overflow-hidden">
                <div
                  className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
                  style={{
                    width: `${buetGoal.pct}%`,
                    background: 'linear-gradient(90deg, #7f1d1d, #ef4444)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse-slow" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] mt-1.5 text-red-500/40">
                <span>{buetGoal.done} / {buetGoal.total} chapters সম্পন্ন</span>
                <span>{buetGoal.total - buetGoal.done} chapters বাকি</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── HSC — Normal ─────────────────────────────────────────── */}
        <div className="card p-6 border-neon-green/20">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center shrink-0">
              <BookOpen size={17} className="text-neon-green" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white">HSC Exam 2027</p>
              <p className="text-xs text-neon-green/50">সকল বিষয়ের প্রস্তুতি</p>
            </div>
          </div>
          <p className="text-[11px] text-neon-green/40 mb-5 ml-12">১৫ মার্চ ২০২৭</p>

          {/* DD:HH:MM:SS */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {[
              { val: hscCD.days,    label: 'দিন'     },
              { val: hscCD.hours,   label: 'ঘণ্টা'   },
              { val: hscCD.minutes, label: 'মিনিট'   },
              { val: hscCD.seconds, label: 'সেকেন্ড' },
            ].map(({ val, label }, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-14 rounded-xl bg-neon-green/5 border border-neon-green/20 flex items-center justify-center">
                    <span className="text-2xl font-black tabular-nums text-neon-green leading-none">
                      {String(val).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[10px] text-neon-green/40 mt-1.5 font-medium">{label}</span>
                </div>
                {i < 3 && <span className="text-neon-green/30 text-xl font-bold mb-4 select-none">:</span>}
              </div>
            ))}
          </div>

         {/* % remaining bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40">সময় অগ্রগতি</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30">{hscCD.pctPassed}% সময় গেছে</span>
                <span className="text-sm font-bold text-neon-green">{hscCD.pctLeft}% বাকি</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-neon-green/60 transition-all duration-1000"
                style={{ width: `${hscCD.pctPassed}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5 text-white/25">
              <span>২২ মার্চ ২০২৬</span>
              <span>১৫ মার্চ ২০২৭</span>
            </div>
          </div>{/* % remaining bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40">সময় অগ্রগতি</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30">{hscCD.pctPassed}% সময় গেছে</span>
                <span className="text-sm font-bold text-neon-green">{hscCD.pctLeft}% বাকি</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-neon-green/60 transition-all duration-1000"
                style={{ width: `${hscCD.pctPassed}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5 text-white/25">
              <span>২২ মার্চ ২০২৬</span>
              <span>১৫ মার্চ ২০২৭</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending alert ─────────────────────────────────────────────── */}
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

      {/* ── Top stats ──────────────────────────────────────────────────── */}
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

      {/* ── Goal infographics ─────────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">লক্ষ্য অনুযায়ী অগ্রগতি</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* BUET */}
          <div className="card p-5 border-red-500/25 bg-red-500/5 relative overflow-hidden">
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
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-semibold">সর্বোচ্চ Priority</span>
              </div>
              <div className="flex justify-center mb-3">
                <ArcGauge pct={buetGoal.pct} color="#ef4444" size={100} />
              </div>
              <p className="text-center text-xs text-white/40 mb-3">{buetGoal.done} / {buetGoal.total} chapters done</p>
              {chapterSummary.filter(s => BUET_SUBJECTS.includes(s.subject)).map(s => {
                const done = s.completed + s.revised;
                const pct  = s.total > 0 ? Math.round((done / s.total) * 100) : 0;
                const meta = { Physics: ['⚡ Physics','bg-sky-400'], Chemistry: ['🧪 Chemistry','bg-emerald-400'], HigherMath: ['📐 Math','bg-violet-400'] };
                return (
                  <div key={s.subject} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{meta[s.subject]?.[0]}</span>
                      <span className="text-white/40">{done}/{s.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${meta[s.subject]?.[1]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DU */}
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
            <div className="flex justify-center mb-3">
              <ArcGauge pct={duGoal.pct} color="#60a5fa" size={100} />
            </div>
            <p className="text-center text-xs text-white/40 mb-3">{duGoal.done} / {duGoal.total} chapters done</p>
            {chapterSummary.filter(s => DU_SUBJECTS.includes(s.subject)).map(s => {
              const done = s.completed + s.revised;
              const pct  = s.total > 0 ? Math.round((done / s.total) * 100) : 0;
              const labels = { Physics:'⚡ Physics', Chemistry:'🧪 Chemistry', HigherMath:'📐 Math', Botany:'🌿 Botany', Zoology:'🦋 Zoology', English1:'📖 Eng 1st', English2:'✍️ Eng 2nd' };
              return (
                <div key={s.subject} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/55 truncate">{labels[s.subject]}</span>
                    <span className="text-white/35 shrink-0 ml-1">{done}/{s.total}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* HSC */}
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
            <div className="flex justify-center mb-3">
              <ArcGauge pct={hscGoal.pct} color="#00ff87" size={100} />
            </div>
            <p className="text-center text-xs text-white/40 mb-3">{hscGoal.done} / {hscGoal.total} chapters done</p>
            {chapterSummary.filter(s => HSC_SUBJECTS.includes(s.subject)).map(s => {
              const done = s.completed + s.revised;
              const pct  = s.total > 0 ? Math.round((done / s.total) * 100) : 0;
              const em = { Physics:'⚡', Chemistry:'🧪', HigherMath:'📐', Botany:'🌿', Zoology:'🦋', English1:'📖', English2:'✍️', Bangla1:'📚', Bangla2:'🖊️', ICT:'💻' };
              return (
                <div key={s.subject} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/55">{em[s.subject]} {s.subject === 'HigherMath' ? 'Math' : s.subject.replace(/[12]$/,'')}</span>
                    <span className="text-white/35">{done}/{s.total}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-neon-green/60 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Today's schedule ───────────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">আজকের Schedule</h2>
        {loadingToday ? <LoadingCard rows={3} />
          : isBreak ? <PracticeDayCard day={day} />
          : sessions.length === 0 ? (
            <div className="card p-6 text-center text-white/30 text-sm">Schedule data নেই</div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => (
                <SessionCard key={s.sessionNumber} session={s}
                  currentHour={hour} currentMinute={minute} onLog={() => openModal('pending-session')} />
              ))}
            </div>
          )}
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
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

      {/* ── Morning status ─────────────────────────────────────────────── */}
      <MorningStatusCard checkin={morningData?.checkin} onEdit={() => openModal('morning')} />

      <MorningCheckinModal />
      <PendingSessionModal pending={pending} />
    </div>
  );
}

// ── Arc gauge ──────────────────────────────────────────────────────────────────
function ArcGauge({ pct, color, size = 100 }) {
  const r = size * 0.38, circ = Math.PI * r, dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
      <path d={`M ${size*.12} ${size*.56} A ${r} ${r} 0 0 1 ${size*.88} ${size*.56}`}
        fill="none" stroke="#ffffff10" strokeWidth={size*.08} strokeLinecap="round" />
      <path d={`M ${size*.12} ${size*.56} A ${r} ${r} 0 0 1 ${size*.88} ${size*.56}`}
        fill="none" stroke={color} strokeWidth={size*.08} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={size/2} y={size*.48} textAnchor="middle" fill={color}
        fontSize={size*.2} fontWeight="700" fontFamily="Inter,sans-serif">{pct}%</text>
    </svg>
  );
}

// ── Session card ───────────────────────────────────────────────────────────────
function SessionCard({ session, currentHour, currentMinute, onLog }) {
  const slot = SESSION_SLOTS[session.sessionNumber];
  const nowM = currentHour * 60 + currentMinute;
  const startM = slot.startHour * 60 + slot.startMin;
  let endM = slot.endHour * 60 + slot.endMin;
  if (slot.endHour < slot.startHour) endM += 1440;
  const status = session.log
    ? (session.log.completed ? 'done' : 'missed')
    : nowM < startM ? 'upcoming' : nowM < endM ? 'active' : 'pending';
  const badges = {
    done: <span className="badge-green">✓ Done</span>,
    missed: <span className="badge-red">✗ Missed</span>,
    active: <span className="badge-blue animate-pulse-slow">● Live now</span>,
    upcoming: <span className="badge-gray">Upcoming</span>,
    pending: <span className="badge-yellow cursor-pointer" onClick={onLog}>! Log করো</span>,
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
            {day === 'Friday' ? 'QB solving + non-academic reading' : 'Admission QB solving'}
          </p>
        </div>
      </div>
      <Link to="/checkin" className="btn-secondary text-xs w-full text-center block">
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
              <span className={checkin.wokeUpAt6 ? 'text-neon-green' : 'text-red-400'}>{checkin.wokeUpAt6 ? '✓' : '✗'}</span>
              <span className="text-sm text-white/60">৬টায় উঠেছি</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={checkin.studiedBeforeCollege ? 'text-neon-green' : 'text-red-400'}>{checkin.studiedBeforeCollege ? '✓' : '✗'}</span>
              <span className="text-sm text-white/60">কলেজের আগে পড়া</span>
              {checkin.studiedBeforeCollege && checkin.preCollegeSubject && <SubjectBadge subject={checkin.preCollegeSubject} />}
            </div>
            <button onClick={onEdit} className="ml-auto btn-ghost text-xs">Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}