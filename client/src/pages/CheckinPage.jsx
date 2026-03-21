import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { checkinAPI, sessionsAPI } from '../lib/api';
import { getBSTDateString, getBSTDayName, WEEKLY_SCHEDULE, SESSION_SLOTS, MISS_REASONS, SUBJECTS, isPracticeDay } from '../lib/schedule';
import { SubjectBadge, LoadingCard } from '../components/ui/Shared';
import { useUIStore } from '../store';

export default function CheckinPage() {
  const day      = getBSTDayName();
  const today    = getBSTDateString();
  const isBreak  = isPracticeDay(day);
  const toast    = useUIStore(s => s.toast);
  const qc       = useQueryClient();

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['sessions-today'],
    queryFn:  () => checkinAPI.getSessionsToday().then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">{day}, {today}</h2>
        <p className="text-sm text-white/40 mt-0.5">
          {isBreak ? 'Practice day — log your QB and reading sessions' : 'Log your scheduled study sessions'}
        </p>
      </div>

      {isLoading ? (
        <LoadingCard rows={4} />
      ) : isBreak ? (
        <PracticeLogger day={day} today={today} />
      ) : (
        <SessionLogger sessions={todayData?.schedule || []} today={today} day={day} />
      )}
    </div>
  );
}

// ── Session Logger (Mon–Thu, Sun) ─────────────────────────────────────────────

function SessionLogger({ sessions, today, day }) {
  return (
    <div className="space-y-4">
      {sessions.map(session => (
        <SessionLogCard key={session.sessionNumber} session={session} today={today} day={day} />
      ))}
      {sessions.length === 0 && (
        <div className="card p-8 text-center text-white/30 text-sm">No sessions scheduled</div>
      )}
    </div>
  );
}

function SessionLogCard({ session, today, day }) {
  const qc    = useQueryClient();
  const toast = useUIStore(s => s.toast);
  const slot  = SESSION_SLOTS[session.sessionNumber];
  const log   = session.log;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reason: '', didInstead: '', actualMinutes: 0, notes: '' });

  const mutation = useMutation({
    mutationFn: (data) => checkinAPI.saveSession(data),
    onSuccess: () => {
      qc.invalidateQueries(['sessions-today']);
      qc.invalidateQueries(['pending-sessions']);
      qc.invalidateQueries(['weekly-stats']);
      toast('Session logged!', 'success');
      setShowForm(false);
    },
    onError: (err) => toast(err.response?.data?.error || 'Error', 'error'),
  });

  function saveCompleted() {
    mutation.mutate({
      date: today, dayOfWeek: day,
      sessionNumber: session.sessionNumber,
      subject: session.subjects[0],
      completed: true,
      actualMinutes: session.sessionNumber === 2 ? 150 : 120,
    });
  }

  function saveMissed() {
    mutation.mutate({
      date: today, dayOfWeek: day,
      sessionNumber: session.sessionNumber,
      subject: session.subjects[0],
      completed: false,
      actualMinutes: Number(form.actualMinutes) || 0,
      reasonMissed: form.reason,
      didInstead: form.didInstead,
      notes: form.notes,
    });
  }

  return (
    <div className={`card p-5 ${log?.completed ? 'border-neon-green/15' : log ? 'border-red-500/15' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold text-white/40">{slot.label}</span>
            <span className="text-xs text-white/30">{slot.display}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.subjects.map(s => <SubjectBadge key={s} subject={s} />)}
          </div>
        </div>
        {log && (
          <div className="shrink-0">
            {log.completed
              ? <span className="badge-green">✓ Completed</span>
              : <span className="badge-red">✗ Missed</span>}
          </div>
        )}
      </div>

      {/* Already logged — show summary */}
      {log && (
        <div className="text-xs text-white/40 mt-2">
          {log.completed
            ? `Logged at ${new Date(log.loggedAt).toLocaleTimeString('en-BD', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })}`
            : `Missed · Reason: ${log.reasonMissed || 'N/A'}`}
          {' '}
          <button
            onClick={() => setShowForm(true)}
            className="text-neon-blue/60 hover:text-neon-blue ml-1"
          >
            Edit
          </button>
        </div>
      )}

      {/* Not logged — show action buttons */}
      {!log && !showForm && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={saveCompleted}
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-medium hover:bg-neon-green/15 transition-all"
          >
            <CheckCircle size={15} /> Yes, completed
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-all"
          >
            <XCircle size={15} /> Missed it
          </button>
        </div>
      )}

      {/* Miss form */}
      {showForm && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <select className="select" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
            <option value="">Reason missed…</option>
            {MISS_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <input className="input" placeholder="What did you do instead?" value={form.didInstead} onChange={e => setForm(f => ({ ...f, didInstead: e.target.value }))} />
          <input type="number" min="0" className="input" placeholder="Minutes actually studied (0)" value={form.actualMinutes} onChange={e => setForm(f => ({ ...f, actualMinutes: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Cancel</button>
            <button onClick={saveMissed} disabled={mutation.isPending || !form.reason} className="btn-danger flex-1 text-sm">
              {mutation.isPending ? 'Saving…' : 'Log missed'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Practice Logger (Fri/Sat) ─────────────────────────────────────────────────

function PracticeLogger({ day, today }) {
  const qc    = useQueryClient();
  const toast = useUIStore(s => s.toast);
  const [form, setForm] = useState({ subject: '', durationMinutes: '', type: 'QB', notes: '' });

  const mutation = useMutation({
    mutationFn: (data) => sessionsAPI.savePractice(data),
    onSuccess: () => {
      qc.invalidateQueries(['weekly-stats']);
      toast('Practice session logged! 📚', 'success');
      setForm({ subject: '', durationMinutes: '', type: 'QB', notes: '' });
    },
    onError: (err) => toast(err.response?.data?.error || 'Error', 'error'),
  });

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen size={17} className="text-neon-purple" />
        <h3 className="text-sm font-semibold text-white">
          {day === 'Friday' ? 'Friday Practice + QB' : 'Saturday QB Practice'}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-white/40 mb-1 block">Subject</label>
          <select className="select" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
            <option value="">Select subject…</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">Session type</label>
          <div className="flex gap-2">
            {['QB', 'Reading', 'Mixed'].map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  form.type === t
                    ? 'bg-neon-purple/15 text-purple-300 border-purple-500/30'
                    : 'bg-white/[0.04] text-white/40 border-white/10 hover:border-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">Duration (minutes)</label>
          <input
            type="number" min="5" max="480"
            className="input"
            placeholder="e.g. 90"
            value={form.durationMinutes}
            onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs text-white/40 mb-1 block">Notes</label>
          <textarea className="input resize-none" rows={2} placeholder="Topics covered, chapters practiced…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <button
          onClick={() => mutation.mutate({ ...form, date: today, durationMinutes: Number(form.durationMinutes) })}
          disabled={mutation.isPending || !form.subject || !form.durationMinutes}
          className="btn-primary w-full"
        >
          {mutation.isPending ? 'Saving…' : 'Log practice session'}
        </button>
      </div>
    </div>
  );
}
