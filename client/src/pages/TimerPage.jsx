import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock, Plus } from 'lucide-react';
import { sessionsAPI } from '../lib/api';
import { SUBJECTS, formatElapsed, formatDuration, getBSTDateString } from '../lib/schedule';
import { useTimerStore, useUIStore } from '../store';
import { SubjectBadge } from '../components/ui/Shared';

export default function TimerPage() {
  const isRunning = useTimerStore(s => s.isRunning);
  const elapsed   = useTimerStore(s => s.elapsed);
  const subject   = useTimerStore(s => s.subject);
  const start     = useTimerStore(s => s.start);
  const stop      = useTimerStore(s => s.stop);
  const toast     = useUIStore(s => s.toast);
  const qc        = useQueryClient();

  const [selectedSubject, setSelectedSubject] = useState('');
  const [savedNotes, setSavedNotes]           = useState('');

  const { data: recentData, refetch } = useQuery({
    queryKey: ['custom-sessions'],
    queryFn:  () => sessionsAPI.getCustom(7).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => sessionsAPI.saveCustom(data),
    onSuccess:  () => {
      qc.invalidateQueries(['custom-sessions']);
      qc.invalidateQueries(['weekly-stats']);
      toast('Study session saved! 🎯', 'success');
      setSavedNotes('');
    },
    onError: (err) => toast(err.response?.data?.error || 'Failed to save', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sessionsAPI.deleteCustom(id),
    onSuccess:  () => { qc.invalidateQueries(['custom-sessions']); },
  });

  function handleStart() {
    if (!selectedSubject) {
      toast('Please select a subject first', 'warning');
      return;
    }
    start(selectedSubject);
  }

  function handleStop() {
    const result = stop();
    if (result.durationMinutes < 1) {
      toast('Session too short (< 1 minute)', 'warning');
      return;
    }
    saveMutation.mutate({
      subject:         result.subject,
      startTime:       result.startTime,
      endTime:         result.endTime,
      durationMinutes: result.durationMinutes,
      notes:           savedNotes || null,
      date:            getBSTDateString(),
    });
  }

  const totalToday = (recentData || [])
    .filter(s => s.date === getBSTDateString())
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* ── Timer card ────────────────────────────────────────────── */}
      <div className="card p-8 text-center">
        {/* Clock display */}
        <div className="mb-6">
          <div className={`text-7xl font-mono font-bold tracking-tight transition-colors ${
            isRunning ? 'text-neon-green' : 'text-white/20'
          }`}>
            {formatElapsed(elapsed)}
          </div>
          {isRunning && subject && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-sm text-neon-green/80">Studying: <strong>{subject}</strong></span>
            </div>
          )}
        </div>

        {/* Subject picker (only when not running) */}
        {!isRunning && (
          <div className="mb-6">
            <p className="text-xs text-white/40 mb-3">Select subject to study</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUBJECTS.filter(s => s !== 'Other').map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSubject(s)}
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
        )}

        {/* Notes when running */}
        {isRunning && (
          <div className="mb-6">
            <input
              className="input text-center text-sm"
              placeholder="What are you studying? (optional)"
              value={savedNotes}
              onChange={e => setSavedNotes(e.target.value)}
            />
          </div>
        )}

        {/* Control button */}
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={!selectedSubject}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-neon-green text-navy-900 font-bold text-lg hover:bg-neon-green/90 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-neon"
          >
            <Play size={22} fill="currentColor" />
            START STUDY
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-red-500/15 border-2 border-red-500/30 text-red-400 font-bold text-lg hover:bg-red-500/25 transition-all active:scale-95"
          >
            <Square size={22} fill="currentColor" />
            STOP & SAVE
          </button>
        )}
      </div>

      {/* ── Today's total ──────────────────────────────────────────── */}
      {totalToday > 0 && (
        <div className="card p-4 flex items-center gap-3">
          <Clock size={16} className="text-neon-blue" />
          <div>
            <p className="text-sm font-medium text-white">
              Extra study today: <span className="text-neon-blue">{formatDuration(totalToday)}</span>
            </p>
            <p className="text-xs text-white/30">
              {(recentData || []).filter(s => s.date === getBSTDateString()).length} session(s)
            </p>
          </div>
        </div>
      )}

      {/* ── Recent sessions ────────────────────────────────────────── */}
      <div>
        <h2 className="section-heading">Recent extra sessions (7 days)</h2>
        {!recentData || recentData.length === 0 ? (
          <div className="card p-6 text-center text-sm text-white/30">
            No custom study sessions yet. Hit START STUDY above!
          </div>
        ) : (
          <div className="space-y-2">
            {recentData.map(session => (
              <div key={session.id} className="card p-3 flex items-center gap-3">
                <SubjectBadge subject={session.subject} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{formatDuration(session.durationMinutes)}</p>
                  <p className="text-xs text-white/30">{session.date}
                    {session.notes && ` · ${session.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(session.id)}
                  className="text-white/20 hover:text-red-400 text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
