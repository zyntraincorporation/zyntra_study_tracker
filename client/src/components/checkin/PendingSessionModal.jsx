import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { checkinAPI } from '../../lib/api';
import { MISS_REASONS, SESSION_SLOTS } from '../../lib/schedule';
import { SubjectBadge } from '../ui/Shared';
import { useUIStore } from '../../store';

function getDefaultActualMinutes(sessionNumber) {
  return sessionNumber === 2 ? 150 : 120;
}

export default function PendingSessionModal({ pending = [] }) {
  const isOpen = useUIStore((s) => s.isOpen('pending-session'));
  const closeModal = useUIStore((s) => s.closeModal);
  const toast = useUIStore((s) => s.toast);
  const qc = useQueryClient();

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState('question');
  const [form, setForm] = useState({ reason: '', didInstead: '', actualMinutes: 0, notes: '' });

  const mutation = useMutation({
    mutationFn: (data) => checkinAPI.saveSession(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions-today'] });
      qc.invalidateQueries({ queryKey: ['pending-sessions'] });
      qc.invalidateQueries({ queryKey: ['weekly-stats'] });
      next();
    },
    onError: (err) => toast(err.response?.data?.error || 'Failed to save', 'error'),
  });

  function resetStep() {
    setStep('question');
    setForm({ reason: '', didInstead: '', actualMinutes: 0, notes: '' });
  }

  function next() {
    if (index < pending.length - 1) {
      setIndex((i) => i + 1);
      resetStep();
      return;
    }

    toast('All sessions logged!', 'success');
    closeModal('pending-session');
    setIndex(0);
    resetStep();
  }

  function logCompleted() {
    const session = pending[index];
    mutation.mutate({
      date: session.sessionDate,
      dayOfWeek: session.dayOfWeek,
      sessionNumber: session.sessionNumber,
      subject: session.subjects[0],
      completed: true,
      actualMinutes: getDefaultActualMinutes(session.sessionNumber),
      notes: null,
    });
  }

  function logMissed() {
    const session = pending[index];
    mutation.mutate({
      date: session.sessionDate,
      dayOfWeek: session.dayOfWeek,
      sessionNumber: session.sessionNumber,
      subject: session.subjects[0],
      completed: false,
      actualMinutes: Number(form.actualMinutes) || 0,
      reasonMissed: form.reason || 'Other',
      didInstead: form.didInstead,
      notes: form.notes,
    });
  }

  if (!isOpen || pending.length === 0) return null;

  const session = pending[index];
  const slot = SESSION_SLOTS[session.sessionNumber];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md card p-6 animate-slide-up">
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
            <div className="mb-5">
              <div className="text-xs font-mono text-white/30 mb-1">
                {slot.label} - {slot.display}
              </div>
              <h2 className="text-base font-semibold text-white mb-2">Did you complete this session?</h2>
              <p className="text-xs text-white/30 mb-3">
                Scheduled on {session.sessionDate}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {session.subjects.map((subject) => <SubjectBadge key={subject} subject={subject} />)}
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
                <span className="text-[11px] text-red-400/60">Did not study</span>
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
                <label className="text-xs text-white/40 mb-1 block">Why did you miss it? *</label>
                <select
                  className="select"
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                >
                  <option value="">Select reason...</option>
                  {MISS_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">What did you do instead?</label>
                <input
                  className="input"
                  placeholder="e.g. Was on phone, went to sleep..."
                  value={form.didInstead}
                  onChange={(e) => setForm((f) => ({ ...f, didInstead: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Minutes actually studied (0 if none)</label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  className="input"
                  value={form.actualMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, actualMinutes: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1 block">Notes (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Anything else..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep('question')} className="btn-secondary flex-none px-3">
                Back
              </button>
              <button
                onClick={logMissed}
                disabled={mutation.isPending || !form.reason}
                className="btn-danger flex-1"
              >
                {mutation.isPending ? 'Saving...' : 'Log missed session'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
