import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock, Timer, RotateCcw, Coffee } from 'lucide-react';
import { sessionsAPI } from '../lib/api';
import { formatElapsed, formatDuration, getBSTDateString } from '../lib/schedule';
import { useTimerStore, useUIStore } from '../store';
import { SubjectBadge } from '../components/ui/Shared';

const SUBJECT_GROUPS = [
  { label: '🔴 BUET Core',   subjects: ['Physics', 'Chemistry', 'Math']                             },
  { label: '🟡 HSC / Other', subjects: ['Botany', 'Zoology', 'English', 'Bangla', 'ICT', 'Other']  },
];

const PRESETS = [
  { label: '25 / 5',  work: 25, brk: 5,  desc: 'Classic Pomodoro'  },
  { label: '45 / 10', work: 45, brk: 10, desc: 'Deep work session'  },
  { label: '50 / 10', work: 50, brk: 10, desc: 'Study marathon'     },
  { label: '90 / 20', work: 90, brk: 20, desc: 'Ultradian rhythm'   },
];

export default function TimerPage() {
  const [activeTab, setActiveTab] = useState('free');
  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-navy-700/40 rounded-xl p-1">
        {[
          { key: 'free', label: '⏱ Free Timer'  },
          { key: 'pomo', label: '🍅 Pomodoro'    },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-neon-green/15 text-neon-green'
                : 'text-white/40 hover:text-white'
            }`}
          >{t.label}</button>
        ))}
      </div>
      {activeTab === 'free' && <FreeTimer />}
      {activeTab === 'pomo' && <PomodoroTimer />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FREE TIMER
// ══════════════════════════════════════════════════════════════════
function FreeTimer() {
  const isRunning = useTimerStore(s => s.isRunning);
  const elapsed   = useTimerStore(s => s.elapsed);
  const subject   = useTimerStore(s => s.subject);
  const start     = useTimerStore(s => s.start);
  const stop      = useTimerStore(s => s.stop);
  const toast     = useUIStore(s => s.toast);
  const qc        = useQueryClient();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');

  const { data: recentData } = useQuery({
    queryKey: ['custom-sessions'],
    queryFn:  () => sessionsAPI.getCustom(7).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => sessionsAPI.saveCustom(data),
    onSuccess: () => {
      qc.invalidateQueries(['custom-sessions']);
      qc.invalidateQueries(['weekly-stats']);
      toast('Session save হয়েছে! 🎯', 'success');
      setNotes('');
    },
    onError: () => toast('Save হয়নি', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sessionsAPI.deleteCustom(id),
    onSuccess: () => qc.invalidateQueries(['custom-sessions']),
  });

  function handleStart() {
    if (!selectedSubject) { toast('আগে subject সিলেক্ট করো', 'warning'); return; }
    start(selectedSubject);
  }

  function handleStop() {
    const result = stop();
    if (result.durationMinutes < 1) { toast('Session অনেক ছোট (১ মিনিটের কম)', 'warning'); return; }
    saveMutation.mutate({
      subject: result.subject, startTime: result.startTime,
      endTime: result.endTime, durationMinutes: result.durationMinutes,
      notes: notes || null, date: getBSTDateString(),
    });
  }

  const today      = getBSTDateString();
  const todaySess  = (recentData || []).filter(s => s.date === today);
  const totalToday = todaySess.reduce((s, x) => s + x.durationMinutes, 0);

  return (
    <div className="space-y-6">
      <div className="card p-8 text-center">
        {/* Clock */}
        <div className={`text-7xl font-mono font-bold tracking-tight mb-6 transition-colors ${
          isRunning ? 'text-neon-green' : 'text-white/20'
        }`}>
          {formatElapsed(elapsed)}
        </div>

        {isRunning && subject && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-sm text-neon-green/80">পড়ছি: <strong>{subject}</strong></span>
          </div>
        )}

        {!isRunning && (
          <div className="mb-6 space-y-3">
            <p className="text-xs text-white/40">কোন বিষয় পড়বে?</p>
            {SUBJECT_GROUPS.map(g => (
              <div key={g.label}>
                <p className="text-[11px] text-white/25 mb-2 text-left">{g.label}</p>
                <div className="flex flex-wrap gap-2">
                  {g.subjects.map(s => (
                    <button key={s} onClick={() => setSelectedSubject(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        selectedSubject === s
                          ? 'border-neon-green/40 bg-neon-green/10 text-neon-green'
                          : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isRunning && (
          <div className="mb-6">
            <input className="input text-center text-sm"
              placeholder="কী পড়ছো? (optional)"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        )}

        {!isRunning ? (
          <button onClick={handleStart} disabled={!selectedSubject}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-neon-green text-navy-900 font-bold text-lg hover:bg-neon-green/90 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-neon"
          >
            <Play size={22} fill="currentColor" /> START STUDY
          </button>
        ) : (
          <button onClick={handleStop} disabled={saveMutation.isPending}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-red-500/15 border-2 border-red-500/30 text-red-400 font-bold text-lg hover:bg-red-500/25 transition-all active:scale-95"
          >
            <Square size={22} fill="currentColor" /> STOP & SAVE
          </button>
        )}
      </div>

      {/* Today summary */}
      {totalToday > 0 && (
        <div className="card p-4 flex items-center gap-3">
          <Clock size={16} className="text-neon-blue" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              আজ extra পড়েছো: <span className="text-neon-blue">{formatDuration(totalToday)}</span>
            </p>
            <p className="text-xs text-white/30">{todaySess.length}টা session</p>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {Object.entries(
              todaySess.reduce((acc, s) => {
                acc[s.subject] = (acc[s.subject] || 0) + s.durationMinutes; return acc;
              }, {})
            ).map(([subj, mins]) => (
              <span key={subj} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50">
                {subj} {formatDuration(mins)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <h2 className="section-heading">সাম্প্রতিক extra sessions (৭ দিন)</h2>
        {!recentData || recentData.length === 0 ? (
          <div className="card p-6 text-center text-sm text-white/30">এখনো কোনো session নেই</div>
        ) : (
          <div className="space-y-2">
            {recentData.map(s => (
              <div key={s.id} className="card p-3 flex items-center gap-3">
                <SubjectBadge subject={s.subject} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{formatDuration(s.durationMinutes)}</p>
                  <p className="text-xs text-white/30">{s.date}{s.notes ? ` · ${s.notes}` : ''}</p>
                </div>
                <button onClick={() => deleteMutation.mutate(s.id)}
                  className="text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// POMODORO TIMER
// ══════════════════════════════════════════════════════════════════
function PomodoroTimer() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const [preset, setPreset]             = useState(PRESETS[0]);
  const [phase, setPhase]               = useState('idle'); // idle | work | break
  const [secondsLeft, setSecondsLeft]   = useState(PRESETS[0].work * 60);
  const [round, setRound]               = useState(1);
  const [totalRounds, setTotalRounds]   = useState(4);
  const [subject, setSubject]           = useState('');
  const [sessionStart, setSessionStart] = useState(null);
  const [totalWorkSecs, setTotalWorkSecs] = useState(0);
  const intervalRef = useRef(null);
  const phaseRef    = useRef(phase);
  const roundRef    = useRef(round);
  phaseRef.current  = phase;
  roundRef.current  = round;

  const saveMutation = useMutation({
    mutationFn: (data) => sessionsAPI.saveCustom(data),
    onSuccess: () => {
      qc.invalidateQueries(['custom-sessions']);
      qc.invalidateQueries(['weekly-stats']);
    },
  });

  function playBeep(freq = 440) {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }

  function handlePhaseEnd(currentPhase, currentRound) {
    clearInterval(intervalRef.current);

    if (currentPhase === 'work') {
      setTotalWorkSecs(t => t + preset.work * 60);
      if (subject && sessionStart) {
        saveMutation.mutate({
          subject, date: getBSTDateString(),
          startTime:       sessionStart,
          endTime:         new Date().toISOString(),
          durationMinutes: preset.work,
          notes:           `🍅 Pomodoro #${currentRound} (${preset.work} min)`,
        });
      }
      playBeep(440);

      if (currentRound >= totalRounds) {
        toast('🎉 সব rounds শেষ! অসাধারণ!', 'success');
        setPhase('idle');
        setRound(1);
        setSecondsLeft(preset.work * 60);
      } else {
        toast(`🍅 Round ${currentRound} শেষ! ${preset.brk} মিনিট break।`, 'success');
        setPhase('break');
        setSecondsLeft(preset.brk * 60);
      }
    } else if (currentPhase === 'break') {
      playBeep(660);
      const nextRound = currentRound + 1;
      toast(`☕ Break শেষ! Round ${nextRound} শুরু করো।`, 'info');
      setRound(nextRound);
      setPhase('work');
      setSecondsLeft(preset.work * 60);
      setSessionStart(new Date().toISOString());
    }
  }

  useEffect(() => {
    if (phase === 'idle') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          handlePhaseEnd(phaseRef.current, roundRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  function startWork() {
    if (!subject) { toast('আগে subject সিলেক্ট করো', 'warning'); return; }
    setSessionStart(new Date().toISOString());
    setTotalWorkSecs(0);
    setRound(1);
    setSecondsLeft(preset.work * 60);
    setPhase('work');
  }

  function pause() {
    clearInterval(intervalRef.current);
    setPhase('idle');
  }

  function reset() {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setRound(1);
    setTotalWorkSecs(0);
    setSessionStart(null);
    setSecondsLeft(preset.work * 60);
  }

  function changePreset(p) {
    reset();
    setPreset(p);
    setTimeout(() => setSecondsLeft(p.work * 60), 20);
  }

  const isRunning  = phase !== 'idle';
  const totalSecs  = phase === 'break' ? preset.brk * 60 : preset.work * 60;
  const pct        = totalSecs > 0 ? Math.round(((totalSecs - secondsLeft) / totalSecs) * 100) : 0;
  const ringColor  = phase === 'work' ? '#ef4444' : phase === 'break' ? '#00ff87' : '#ffffff20';
  const mins       = Math.floor(secondsLeft / 60);
  const secs       = secondsLeft % 60;

  // SVG ring
  const R = 90, CX = 110, CY = 110, circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;

  return (
    <div className="space-y-5">

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => changePreset(p)}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              preset.label === p.label
                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white'
            }`}
          >
            <p className="text-xs font-bold">{p.label}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Ring timer card */}
      <div className="card p-6 flex flex-col items-center">

        {/* Phase badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-5 ${
          phase === 'work'  ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : phase === 'break' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
          : 'bg-white/[0.03] border-white/10 text-white/40'
        }`}>
          {phase === 'work'  && <><div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />পড়ছি — Round {round}/{totalRounds}</>}
          {phase === 'break' && <><Coffee size={13} />Break time!</>}
          {phase === 'idle'  && <><Timer size={13} />Ready</>}
        </div>

        {/* SVG ring */}
        <div className="mb-5">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ffffff08" strokeWidth="12" />
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={ringColor} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <text x={CX} y={CY - 12} textAnchor="middle" fill="white"
              fontSize="40" fontWeight="800" fontFamily="Inter,monospace">
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fill="#ffffff50"
              fontSize="13" fontFamily="Inter,sans-serif">
              {phase === 'work' ? `${preset.work} min focus`
                : phase === 'break' ? `${preset.brk} min break`
                : 'পড়তে শুরু করো'}
            </text>
            <text x={CX} y={CY + 38} textAnchor="middle" fill="#ffffff25"
              fontSize="11" fontFamily="Inter,sans-serif">
              {pct}% complete
            </text>
          </svg>
        </div>

        {/* Subject picker */}
        {!isRunning && (
          <div className="w-full mb-5">
            <p className="text-xs text-white/40 text-center mb-3">Subject সিলেক্ট করো</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Physics','Chemistry','Math','Botany','Zoology','English','Bangla','ICT'].map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    subject === s
                      ? 'border-red-400/50 bg-red-500/15 text-red-300'
                      : 'border-white/10 bg-white/[0.03] text-white/40 hover:text-white'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button onClick={startWork}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-500/15 border-2 border-red-500/40 text-red-300 font-bold hover:bg-red-500/25 transition-all active:scale-95"
            >
              <Play size={18} fill="currentColor" /> START
            </button>
          ) : (
            <button onClick={pause}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 font-bold hover:bg-yellow-500/15 transition-all active:scale-95"
            >
              ⏸ Pause
            </button>
          )}
          <button onClick={reset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Round</p>
          <p className="text-2xl font-bold text-white">{phase !== 'idle' ? round : 0}/{totalRounds}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Focus time</p>
          <p className="text-2xl font-bold text-neon-green">
            {formatDuration(Math.round(totalWorkSecs / 60))}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Rounds set</p>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setTotalRounds(r => Math.max(1, r - 1))}
              className="w-6 h-6 rounded-full bg-white/[0.06] text-white/60 hover:bg-white/10 text-sm">−</button>
            <p className="text-2xl font-bold text-white">{totalRounds}</p>
            <button onClick={() => setTotalRounds(r => Math.min(12, r + 1))}
              className="w-6 h-6 rounded-full bg-white/[0.06] text-white/60 hover:bg-white/10 text-sm">+</button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-4 border-white/[0.04]">
        <p className="text-xs text-white/40 font-medium mb-2">💡 Pomodoro tips</p>
        <div className="space-y-1.5">
          {[
            'Phone silent করো, notification off করো',
            'প্রতিটা break এ উঠে হাঁটো, চোখ বিশ্রাম দাও',
            '৪টা round শেষে ২০-৩০ মিনিটের বড় break নাও',
            'Break এ social media চেক করো না',
          ].map((tip, i) => (
            <p key={i} className="text-xs text-white/25">· {tip}</p>
          ))}
        </div>
      </div>
    </div>
  );
}