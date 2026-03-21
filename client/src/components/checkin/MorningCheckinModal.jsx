import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sun } from 'lucide-react';
import { checkinAPI } from '../../lib/api';
import { SUBJECTS } from '../../lib/schedule';
import { useUIStore } from '../../store';

export default function MorningCheckinModal() {
  const isOpen     = useUIStore((s) => s.isOpen('morning'));
  const closeModal = useUIStore((s) => s.closeModal);
  const toast      = useUIStore((s) => s.toast);
  const qc         = useQueryClient();

  const [form, setForm] = useState({
    wokeUpAt6:            false,
    studiedBeforeCollege: false,
    preCollegeSubject:    '',
    preCollegeMinutes:    '',
    notes:                '',
  });

  const mutation = useMutation({
    mutationFn: (data) => checkinAPI.saveMorning(data),
    onSuccess: () => {
      qc.invalidateQueries(['morning-today']);
      qc.invalidateQueries(['weekly-stats']);
      toast('Morning routine logged! 🌅', 'success');
      closeModal('morning');
    },
    onError: (err) => toast(err.response?.data?.error || 'Failed to save', 'error'),
  });

  function submit() {
    mutation.mutate({
      ...form,
      preCollegeSubject:  form.studiedBeforeCollege ? form.preCollegeSubject : null,
      preCollegeMinutes:  form.studiedBeforeCollege && form.preCollegeMinutes
                          ? Number(form.preCollegeMinutes) : null,
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm card p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Sun size={18} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Morning Check-in</h2>
            <p className="text-xs text-white/40">How was your morning?</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Wake up */}
          <ToggleRow
            label="Did you wake up at 6:00 AM?"
            value={form.wokeUpAt6}
            onChange={(v) => setForm(f => ({ ...f, wokeUpAt6: v }))}
          />

          {/* Pre-college study */}
          <ToggleRow
            label="Did you study before college?"
            value={form.studiedBeforeCollege}
            onChange={(v) => setForm(f => ({ ...f, studiedBeforeCollege: v, preCollegeSubject: '', preCollegeMinutes: '' }))}
          />

          {/* Subject if studied */}
          {form.studiedBeforeCollege && (
            <div className="ml-4 space-y-2 animate-fade-in">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Which subject?</label>
                <select
                  className="select"
                  value={form.preCollegeSubject}
                  onChange={e => setForm(f => ({ ...f, preCollegeSubject: e.target.value }))}
                >
                  <option value="">Select subject…</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">How many minutes?</label>
                <input
                  type="number"
                  min="1" max="180"
                  className="input"
                  placeholder="e.g. 45"
                  value={form.preCollegeMinutes}
                  onChange={e => setForm(f => ({ ...f, preCollegeMinutes: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Anything else about your morning…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => closeModal('morning')}
            className="btn-secondary flex-1"
          >
            Skip
          </button>
          <button
            onClick={submit}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === true
              ? 'bg-neon-green/15 text-neon-green border border-neon-green/30'
              : 'bg-white/[0.04] text-white/40 border border-white/10 hover:border-white/20'
          }`}
        >
          YES
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            value === false
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : 'bg-white/[0.04] text-white/40 border border-white/10 hover:border-white/20'
          }`}
        >
          NO
        </button>
      </div>
    </div>
  );
}
