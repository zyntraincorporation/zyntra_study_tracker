import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock } from 'lucide-react';
import { sessionsAPI } from '../lib/api';
import { SUBJECTS_TIMER, SUBJECT_COLORS, formatElapsed, formatDuration, getBSTDateString } from '../lib/schedule';
import { useTimerStore, useUIStore } from '../store';
import { SubjectBadge } from '../components/ui/Shared';

// Grouped for UI clarity
const SUBJECT_GROUPS = [
  { label: '🔴 BUET Core',  subjects: ['Physics', 'Chemistry', 'Math']              },
  { label: '🟡 HSC / Other', subjects: ['Botany', 'Zoology', 'English', 'Bangla', 'ICT', 'Other'] },
];

export default function TimerPage() {
  const isRunning = useTimerStore(s => s.isRunning);
  const elapsed   = useTimerStore(s => s.elapsed);
  const subject   = useTimerStore(s => s.subject);
  const start     = useTimerStore(s => s.start);
  const stop      = useTimerStore(s => s.stop);
  const toast     = useUIStore(s => s.toast);
  const qc        = useQueryClient();

  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes]                     = useState('');

  const { data: recentData } = useQuery({
    queryKey: ['custom-sessions'],
    queryFn:  () => sessionsAPI.getCustom(7).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => sessionsAPI.saveCustom(data),
    onSuccess:  () => {
      qc.invalidateQueries(['custom-sessions']);
      qc.invalidateQueries(['weekly-stats']);
      toast('Session save হয়েছে! 🎯', 'success');
      setNotes('');
    },
    onError: (err) => toast(err.response?.data?.error || 'Save হয়নি', 'error'),
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
  const todaySessions = (recentData || []).filter(s => s.date === today);
  const totalToday = todaySessions.reduce((s, x) => s + x.durationMinutes, 0);

  return (
    <div className="space-y-6">

      {/* ── Timer card ─────────────────────────────────────────────────── */}
      <div className="card p-8 text-center">
        <div className={`text-7xl font-mono font-bold tracking-tight mb-6 transition-colors ${
          isRunning ? 'text-neon-green' : 'text-white/20'
        }`}>
          {formatElapsed(elapsed)}
        </div>

        {isRunning && subject && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-sm text-neon-green/80">
              পড়ছি: <strong>{subject}</strong>
            </span>
          </div>
        )}

        {/* Subject picker */}
        {!isRunning && (
          <div className="mb-6">
            <p className="text-xs text-white/40 mb-3">কোন বিষয় পড়বে?</p>
            <div className="space-y-3">
              {SUBJECT_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[11px] text-white/30 mb-2 text-left">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.subjects.map(s => (
                      <button key={s} onClick={() => setSelectedSubject(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                          selectedSubject === s
                            ? 'border-neon-green/40 bg-neon-green/10 text-neon-green'
                            : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes when running */}
        {isRunning && (
          <div className="mb-6">
            <input className="input text-center text-sm"
              placeholder="কী পড়ছো? (optional)"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        )}

        {/* Start / Stop button */}
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

      {/* ── Today summary ───────────────────────────────────────────────── */}
      {totalToday > 0 && (
        <div className="card p-4 flex items-center gap-3">
          <Clock size={16} className="text-neon-blue" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              আজ extra পড়েছো: <span className="text-neon-blue">{formatDuration(totalToday)}</span>
            </p>
            <p className="text-xs text-white/30">{todaySessions.length}টা session</p>
          </div>
          {/* subject breakdown */}
          <div className="flex gap-1 flex-wrap justify-end">
            {Object.entries(
              todaySessions.reduce((acc, s) => {
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

      {/* ── Recent sessions ─────────────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">সাম্প্রতিক extra sessions (৭ দিন)</h2>
        {!recentData || recentData.length === 0 ? (
          <div className="card p-6 text-center text-sm text-white/30">
            এখনো কোনো custom session নেই। উপরে START STUDY চাপো!
          </div>
        ) : (
          <div className="space-y-2">
            {recentData.map(session => (
              <div key={session.id} className="card p-3 flex items-center gap-3">
                <SubjectBadge subject={session.subject} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{formatDuration(session.durationMinutes)}</p>
                  <p className="text-xs text-white/30">
                    {session.date}{session.notes ? ` · ${session.notes}` : ''}
                  </p>
                </div>
                <button onClick={() => deleteMutation.mutate(session.id)}
                  className="text-white/20 hover:text-red-400 text-xs transition-colors shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}