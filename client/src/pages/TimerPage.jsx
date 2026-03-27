import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock, Timer, RotateCcw, Coffee, BookOpen, Monitor, Plus, Trash2, CalendarDays } from 'lucide-react';
import { sessionsAPI } from '../lib/api';
import { formatElapsed, formatDuration, getBSTDateString } from '../lib/schedule';
import { useTimerStore, useUIStore } from '../store';
import { SubjectBadge } from '../components/ui/Shared';

const SUBJECT_GROUPS = [
  { label: '🔴 BUET Core',   subjects: ['Physics', 'Chemistry', 'Math']                            },
  { label: '🟡 HSC / Other', subjects: ['Botany', 'Zoology', 'English', 'Bangla', 'ICT', 'Other'] },
];

const ALL_SUBJECTS = ['Physics', 'Chemistry', 'Math', 'Botany', 'Zoology', 'English', 'Bangla', 'ICT', 'Other'];

const PRESETS = [
  { label: '25 / 5',  work: 25, brk: 5,  desc: 'Classic Pomodoro' },
  { label: '45 / 10', work: 45, brk: 10, desc: 'Deep work session' },
  { label: '50 / 10', work: 50, brk: 10, desc: 'Study marathon'    },
  { label: '90 / 20', work: 90, brk: 20, desc: 'Ultradian rhythm'  },
];

// Study type choices
const STUDY_TYPES = [
  { key: 'self',   label: '📖 নিজে পড়ছি',    icon: BookOpen  },
  { key: 'online', label: '🖥️ Online Class', icon: Monitor   },
];

export default function TimerPage() {
  const [activeTab, setActiveTab] = useState('free');
  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-navy-700/40 rounded-xl p-1">
        {[
          { key: 'free',   label: '⏱ Free Timer'  },
          { key: 'pomo',   label: '🍅 Pomodoro'    },
          { key: 'custom', label: '📝 Custom Log'  },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-neon-green/15 text-neon-green' : 'text-white/40 hover:text-white'
            }`}
          >{t.label}</button>
        ))}
      </div>
      {activeTab === 'free'   && <FreeTimer />}
      {activeTab === 'pomo'   && <PomodoroTimer />}
      {activeTab === 'custom' && <CustomLog />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STUDY TYPE TOGGLE — shared between Free & Pomodoro
// ══════════════════════════════════════════════════════════════════
function StudyTypeToggle({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2 justify-center">
      {STUDY_TYPES.map(t => (
        <button key={t.key}
          disabled={disabled}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            value === t.key
              ? 'bg-neon-blue/15 border-neon-blue/40 text-neon-blue'
              : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FREE TIMER — Date.now() based, background-safe
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
    onSuccess:  () => qc.invalidateQueries(['custom-sessions']),
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
// POMODORO — deadline-based countdown, background-safe
// phaseEndAt = exact timestamp যখন phase শেষ হবে
// প্রতি tick এ: secondsLeft = Math.ceil((phaseEndAt - Date.now()) / 1000)
// তাই background এ গেলেও ফিরে এলে সঠিক সময় দেখাবে
// ══════════════════════════════════════════════════════════════════
function PomodoroTimer() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const [preset,        setPreset]        = useState(PRESETS[0]);
  const [phase,         setPhase]         = useState('idle');
  const [phaseEndAt,    setPhaseEndAt]    = useState(null);  // ms timestamp
  const [secondsLeft,   setSecondsLeft]   = useState(PRESETS[0].work * 60);
  const [round,         setRound]         = useState(1);
  const [totalRounds,   setTotalRounds]   = useState(4);
  const [subject,       setSubject]       = useState('');
  const [sessionStart,  setSessionStart]  = useState(null);
  const [totalWorkSecs, setTotalWorkSecs] = useState(0);

  const intervalRef    = useRef(null);
  const phaseRef       = useRef(phase);
  const roundRef       = useRef(round);
  const presetRef      = useRef(preset);
  const subjectRef     = useRef(subject);
  const sessionStartRef = useRef(sessionStart);
  const totalRoundsRef = useRef(totalRounds);

  phaseRef.current       = phase;
  roundRef.current       = round;
  presetRef.current      = preset;
  subjectRef.current     = subject;
  sessionStartRef.current = sessionStart;
  totalRoundsRef.current = totalRounds;

  const saveMutation = useMutation({
    mutationFn: (data) => sessionsAPI.saveCustom(data),
    onSuccess:  () => {
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
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }

  // Phase end handler — called when countdown hits 0
  const handlePhaseEnd = useCallback(() => {
    clearInterval(intervalRef.current);
    const currentPhase  = phaseRef.current;
    const currentRound  = roundRef.current;
    const currentPreset = presetRef.current;
    const currentTotal  = totalRoundsRef.current;

    if (currentPhase === 'work') {
      const workSecs = currentPreset.work * 60;
      setTotalWorkSecs(t => t + workSecs);

      if (subjectRef.current && sessionStartRef.current) {
        saveMutation.mutate({
          subject:         subjectRef.current,
          date:            getBSTDateString(),
          startTime:       sessionStartRef.current,
          endTime:         new Date().toISOString(),
          durationMinutes: currentPreset.work,
          notes:           `🍅 Pomodoro #${currentRound} (${currentPreset.work} min)`,
        });
      }

      playBeep(440);

      if (currentRound >= currentTotal) {
        toast('🎉 সব rounds শেষ! অসাধারণ!', 'success');
        setPhase('idle');
        setRound(1);
        setPhaseEndAt(null);
        setSecondsLeft(currentPreset.work * 60);
      } else {
        toast(`🍅 Round ${currentRound} শেষ! ${currentPreset.brk} মিনিট break।`, 'success');
        const endAt = Date.now() + currentPreset.brk * 60 * 1000;
        setPhase('break');
        setPhaseEndAt(endAt);
        setSecondsLeft(currentPreset.brk * 60);
      }
    } else if (currentPhase === 'break') {
      playBeep(660);
      const nextRound = currentRound + 1;
      toast(`☕ Break শেষ! Round ${nextRound} শুরু করো।`, 'info');
      setRound(nextRound);
      const start = new Date().toISOString();
      setSessionStart(start);
      sessionStartRef.current = start;
      const endAt = Date.now() + currentPreset.work * 60 * 1000;
      setPhase('work');
      setPhaseEndAt(endAt);
      setSecondsLeft(currentPreset.work * 60);
    }
  }, []);

  // Tick — recalculate from phaseEndAt every second
  useEffect(() => {
    if (phase === 'idle' || !phaseEndAt) return;

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((phaseEndAt - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        handlePhaseEnd();
      } else {
        setSecondsLeft(remaining);
      }
    }, 500); // 500ms interval — catches up faster after background

    return () => clearInterval(intervalRef.current);
  }, [phase, phaseEndAt, handlePhaseEnd]);

  // Page visibility — recalculate immediately when tab becomes visible
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && phaseEndAt && phase !== 'idle') {
        const remaining = Math.ceil((phaseEndAt - Date.now()) / 1000);
        if (remaining <= 0) {
          handlePhaseEnd();
        } else {
          setSecondsLeft(remaining);
        }
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [phaseEndAt, phase, handlePhaseEnd]);

  function startWork() {
    if (!subject) { toast('আগে subject সিলেক্ট করো', 'warning'); return; }
    const start = new Date().toISOString();
    setSessionStart(start);
    sessionStartRef.current = start;
    setTotalWorkSecs(0);
    setRound(1);
    const endAt = Date.now() + preset.work * 60 * 1000;
    setPhaseEndAt(endAt);
    setSecondsLeft(preset.work * 60);
    setPhase('work');
  }

  function pause() {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setPhaseEndAt(null);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setPhaseEndAt(null);
    setRound(1);
    setTotalWorkSecs(0);
    setSessionStart(null);
    setSecondsLeft(preset.work * 60);
  }

  function changePreset(p) {
    reset();
    setPreset(p);
    presetRef.current = p;
    setTimeout(() => setSecondsLeft(p.work * 60), 20);
  }

  const isRunning = phase !== 'idle';
  const totalSecs = phase === 'break' ? preset.brk * 60 : preset.work * 60;
  const pct       = totalSecs > 0 ? Math.round(((totalSecs - secondsLeft) / totalSecs) * 100) : 0;
  const ringColor = phase === 'work' ? '#ef4444' : phase === 'break' ? '#00ff87' : '#ffffff20';
  const mins      = Math.floor(secondsLeft / 60);
  const secs      = secondsLeft % 60;

  const R = 90, CX = 110, CY = 110, circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;

  return (
    <div className="space-y-5">

      {/* Presets */}
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

      {/* Ring card */}
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
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
            <text x={CX} y={CY - 12} textAnchor="middle" fill="white"
              fontSize="40" fontWeight="800" fontFamily="Inter,monospace">
              {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fill="#ffffff50"
              fontSize="13" fontFamily="Inter,sans-serif">
              {phase === 'work'  ? `${preset.work} min focus`
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Round</p>
          <p className="text-2xl font-bold text-white">{isRunning ? round : 0}/{totalRounds}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/40 mb-1">Focus time</p>
          <p className="text-2xl font-bold text-neon-green">{formatDuration(Math.round(totalWorkSecs / 60))}</p>
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
          ].map((tip, i) => <p key={i} className="text-xs text-white/25">· {tip}</p>)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CUSTOM LOG — manual session entry without timer
// Timer ছাড়াই manually কতক্ষণ পড়লাম, কী পড়লাম সেটা log করো
// ══════════════════════════════════════════════════════════════════
function CustomLog() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const [subject,   setSubject]   = useState('');
  const [chapter,   setChapter]   = useState('');
  const [studyType, setStudyType] = useState('self');
  const [hours,     setHours]     = useState(0);
  const [minutes,   setMinutes]   = useState(30);
  const [notes,     setNotes]     = useState('');
  const [date,      setDate]      = useState(getBSTDateString());

  const { data: recentData } = useQuery({
    queryKey: ['custom-sessions'],
    queryFn:  () => sessionsAPI.getCustom(14).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => sessionsAPI.saveCustom(data),
    onSuccess: () => {
      qc.invalidateQueries(['custom-sessions']);
      qc.invalidateQueries(['weekly-stats']);
      toast('Log save হয়েছে! ✅', 'success');
      setChapter('');
      setNotes('');
      setHours(0);
      setMinutes(30);
    },
    onError: () => toast('Save হয়নি', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sessionsAPI.deleteCustom(id),
    onSuccess:  () => qc.invalidateQueries(['custom-sessions']),
  });

  function handleSave() {
    if (!subject)              { toast('Subject সিলেক্ট করো',         'warning'); return; }
    const dur = hours * 60 + minutes;
    if (dur < 1)               { toast('Duration কমপক্ষে ১ মিনিট দাও', 'warning'); return; }

    const noteStr = [
      studyType === 'online' ? '🖥️ Online Class' : '📖 Self Study',
      chapter ? `📘 ${chapter}` : '',
      notes   ? notes           : '',
    ].filter(Boolean).join(' · ');

    saveMutation.mutate({
      subject,
      date,
      durationMinutes: dur,
      studyType,
      chapter: chapter || null,
      notes:   noteStr || null,
      startTime: null,
      endTime:   null,
    });
  }

  const today = getBSTDateString();

  return (
    <div className="space-y-5">
      {/* ── Form card ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Plus size={16} className="text-neon-green" />
          <h2 className="text-sm font-semibold text-white">নতুন study log যোগ করো</h2>
          <span className="text-xs text-white/30">(timer ছাড়া)</span>
        </div>

        {/* Study type */}
        <div>
          <p className="text-xs text-white/40 mb-2">কীভাবে পড়লে?</p>
          <StudyTypeToggle value={studyType} onChange={setStudyType} />
        </div>

        {/* Subject */}
        <div>
          <p className="text-xs text-white/40 mb-2">Subject</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  subject === s
                    ? 'border-neon-green/40 bg-neon-green/10 text-neon-green'
                    : 'border-white/10 bg-white/[0.04] text-white/40 hover:text-white'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Chapter */}
        <div>
          <p className="text-xs text-white/40 mb-2">Chapter / Topic</p>
          <input className="input text-sm w-full"
            placeholder="যেমন: Newton's Laws, Trigonometry, Cell Division…"
            value={chapter} onChange={e => setChapter(e.target.value)} />
        </div>

        {/* Duration */}
        <div>
          <p className="text-xs text-white/40 mb-2">কতক্ষণ পড়লে?</p>
          <div className="flex gap-3 items-center">
            {/* Hours */}
            <div className="flex-1">
              <p className="text-[10px] text-white/25 mb-1 text-center">ঘণ্টা</p>
              <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl p-2 justify-between border border-white/[0.08]">
                <button onClick={() => setHours(h => Math.max(0, h - 1))}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/10">−</button>
                <span className="text-xl font-bold text-white w-8 text-center">{hours}</span>
                <button onClick={() => setHours(h => Math.min(12, h + 1))}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/10">+</button>
              </div>
            </div>

            <span className="text-white/30 text-lg font-bold mt-4">:</span>

            {/* Minutes */}
            <div className="flex-1">
              <p className="text-[10px] text-white/25 mb-1 text-center">মিনিট</p>
              <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl p-2 justify-between border border-white/[0.08]">
                <button onClick={() => setMinutes(m => Math.max(0, m - 5))}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/10">−</button>
                <span className="text-xl font-bold text-white w-8 text-center">{minutes}</span>
                <button onClick={() => setMinutes(m => Math.min(59, m + 5))}
                  className="w-7 h-7 rounded-lg bg-white/[0.06] text-white/60 hover:bg-white/10">+</button>
              </div>
            </div>
          </div>

          {/* Quick duration presets */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {[30, 45, 60, 90, 120].map(min => (
              <button key={min} onClick={() => { setHours(Math.floor(min/60)); setMinutes(min % 60); }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">
                {min < 60 ? `${min}m` : `${min/60}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs text-white/40 mb-2">
            <CalendarDays size={11} className="inline mr-1" />তারিখ
          </p>
          <input type="date" className="input text-sm w-full"
            value={date} onChange={e => setDate(e.target.value)}
            max={today} />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs text-white/40 mb-2">Note (optional)</p>
          <input className="input text-sm w-full"
            placeholder="কোনো বিশেষ কথা…"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* Summary preview */}
        {subject && (hours * 60 + minutes) >= 1 && (
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
            <p className="text-xs text-white/40 mb-1">Preview</p>
            <p className="text-sm text-white/70">
              <span className="text-neon-green font-medium">{subject}</span>
              {chapter && <span className="text-white/40"> · {chapter}</span>}
              {' — '}
              <span className="text-neon-blue">{formatDuration(hours * 60 + minutes)}</span>
              <span className="text-white/30"> · {date}</span>
              {' · '}
              <span className="text-white/50">{studyType === 'online' ? '🖥️ Online' : '📖 Self'}</span>
            </p>
          </div>
        )}

        {/* Save button */}
        <button onClick={handleSave} disabled={saveMutation.isPending}
          className="w-full py-3 rounded-xl bg-neon-green/15 border border-neon-green/30 text-neon-green font-bold text-sm hover:bg-neon-green/25 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {saveMutation.isPending ? 'Saving…' : 'Log Save করো'}
        </button>
      </div>

      {/* ── Recent logs ── */}
      <div>
        <h2 className="section-heading">সাম্প্রতিক logs (১৪ দিন)</h2>
        {!recentData || recentData.length === 0 ? (
          <div className="card p-6 text-center text-sm text-white/30">এখনো কোনো log নেই</div>
        ) : (
          <div className="space-y-2">
            {recentData.map(s => (
              <div key={s.id} className="card p-3 flex items-center gap-3">
                <SubjectBadge subject={s.subject} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-white/80">{formatDuration(s.durationMinutes)}</p>
                    {s.studyType === 'online' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
                        Online
                      </span>
                    )}
                    {s.chapter && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/40">
                        {s.chapter}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 truncate">
                    {s.date}{s.notes ? ` · ${s.notes}` : ''}
                  </p>
                </div>
                <button onClick={() => deleteMutation.mutate(s.id)}
                  className="text-white/20 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}