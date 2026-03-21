import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { checkinAPI } from '../../lib/api';
import { MISS_REASONS, getBSTDateString, getBSTDayName, SESSION_SLOTS } from '../../lib/schedule';
import { SubjectBadge } from '../ui/Shared';
import { useUIStore } from '../../store';

export default function PendingSessionModal({ pending = [] }) {
  const isOpen     = useUIStore((s) => s.isOpen('pending-session'));
  const closeModal = useUIStore((s) => s.closeModal);
  const toast      = useUIStore((s) => s.toast);
  const qc         = useQueryClient();

  const [index, setIndex] = useState(0);
  const [step,  setStep]  = useState('question'); // 'question' | 'miss-form'
  const [form,  setForm]  = useState({ reason: '', didInstead: '', actualMinutes: 0, notes: '' });

  const mutation = useMutation({
    mutationFn: (data) => checkinAPI.saveSession(data),
    onSuccess:  () => {
      qc.invalidateQueries(['sessions-today']);
      qc.invalidateQueries(['pending-sessions']);
      qc.invalidateQueries(['weekly-stats']);
      next();
    },
    onError: (err) => toast(err.response?.data?.error || 'Failed to save', 'error'),
  });

  function next() {
    if (index < pending.length - 1) {
      setIndex(i => i + 1);
      setStep('question');
      setForm({ reason: '', didInstead: '', actualMinutes: 0, notes: '' });
    } else {
      toast('All sessions logged! 🎯', 'success');
      closeModal('pending-session');
      setIndex(0);
      setStep('question');
    }
  }

  function logCompleted() {
    const session = pending[index];
    mutation.mutate({
      date:          getBSTDateString(),
      dayOfWeek:     getBSTDayName(),
      sessionNumber: session.sessionNumber,
      subject:       session.subjects[0],
      completed:     true,
      actualMinutes: SESSION_SLOTS[session.sessionNumber].endHour < 12
                     ? 120 : session.sessionNumber === 2 ? 150 : 120,
    });
  }

  function logMissed() {
    const session = pending[index];
    mutation.mutate({
      date:          getBSTDateString(),
      dayOfWeek:     getBSTDayName(),
      sessionNumber: session.sessionNumber,
      subject:       session.subjects[0],
      completed:     false,
      actualMinutes: Number(form.actualMinutes) || 0,
      reasonMissed:  form.reason || 'Not provided',
      didInstead:    form.didInstead,
      notes:         form.notes,
    });
  }

  if (!isOpen || pending.length === 0) return null;

  const session = pending[index];
  const slot    = SESSION_SLOTS[session.sessionNumber];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md card p-6 animate-slide-up">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-5">
          {pending.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < index ? 'bg-neon-green' : i === index ? 'bg-neon-blue' : 'bg-white/10'
              }`}
            />
          ))}
          <span className="text-xs text-white/30 ml-1 shrink-0">{index + 1}/{pending.length}</span>
        </div>

        {step === 'question' ? (
          <>
            {/* Session info */}
            <div className="mb-5">
              <div className="text-xs font-mono text-white/30 mb-1">
                {slot.label} · {slot.display}
              </div>
              <h2 className="text-base font-semibold text-white mb-2">
                Did you complete this session?
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {session.subjects.map(s => <SubjectBadge key={s} subject={s} />)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={logCompleted}
                disabled={mutation.isPending}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neon-green/10 border border-neon-green/20 hover:bg-neon-green/15 transition-all"
              >
                <CheckCircle size={24} className="text-neon-green" />
                <span className="text-sm font-semibold text-neon-green">YES</span>
                <span className="text-[11px] text-neon-green/60">Completed it</span>
              </button>

              <button
                onClick={() => setStep('miss-form')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-all"
              >
                <XCircle size={24} className="text-red-400" />
                <span className="text-sm font-semibold text-red-400">NO</span>
                <span className="text-[11px] text-red-400/60">Didn't study</span>
              </button>
            </div>

            <button
              onClick={next}
              className="w-full mt-3 btn-ghost text-xs text-white/30"
            >
              Skip for now
            </button>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-white mb-4">
              What happened? (Session {slot.label})
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Why didn't you study? *</label>
                <select
                  className="select"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                >
                  <option value="">Select reason…</option>
                  {MISS_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">What did you do instead?</label>
                <input
                  className="input"
                  placeholder="e.g. Was on phone, went to sleep…"
                  value={form.didInstead}
                  onChange={e => setForm(f => ({ ...f, didInstead: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Minutes actually studied (0 if none)</label>
                <input
                  type="number" min="0" max="180"
                  className="input"
                  value={form.actualMinutes}
                  onChange={e => setForm(f => ({ ...f, actualMinutes: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Notes (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Anything else…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep('question')} className="btn-secondary flex-none px-3">
                ← Back
              </button>
              <button
                onClick={logMissed}
                disabled={mutation.isPending || !form.reason}
                className="btn-danger flex-1"
              >
                {mutation.isPending ? 'Saving…' : 'Log missed session'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
