import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, CheckCircle2, Trash2, Filter, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { mistakesAPI } from '../lib/api';
import { getBSTDateString } from '../lib/schedule';
import { LoadingCard } from '../components/ui/Shared';
import MathKeyboard from '../components/ui/MathKeyboard';   // ← new import
import { useUIStore } from '../store';

const MISTAKE_TYPES = [
  { key: 'Concept',     label: 'Concept',     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    emoji: '🧠' },
  { key: 'Formula',     label: 'Formula',     color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', emoji: '📐' },
  { key: 'Calculation', label: 'Calculation', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', emoji: '🔢' },
  { key: 'Silly',       label: 'Silly',       color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   emoji: '😅' },
  { key: 'Memory',      label: 'Memory',      color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', emoji: '💭' },
];

const SOURCES = ['Practice', 'Exam', 'QB', 'Homework', 'Other'];

const SUBJECTS = ['Physics', 'Chemistry', 'Math', 'Botany', 'Zoology', 'English', 'Bangla', 'ICT'];

const SUBJECT_COLORS = {
  Physics:   'text-sky-400',    Chemistry: 'text-emerald-400',
  Math:      'text-violet-400', Botany:    'text-green-400',
  Zoology:   'text-amber-400',  English:   'text-pink-400',
  Bangla:    'text-orange-400', ICT:       'text-cyan-400',
};

const TABS = [
  { key: 'list',  label: '📋 সব Mistakes'  },
  { key: 'add',   label: '➕ নতুন Add করো'  },
  { key: 'stats', label: '📊 Statistics'    },
];

export default function MistakePage() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Mistake Log</h2>
        <p className="text-xs text-white/40 mt-1">ভুলগুলো track করো, pattern বোঝো, আর repeat করো না</p>
      </div>

      <div className="flex gap-1 bg-navy-700/40 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-red-500/15 text-red-400'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'list'  && <MistakeList />}
      {activeTab === 'add'   && <AddMistake onDone={() => setActiveTab('list')} />}
      {activeTab === 'stats' && <MistakeStats />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 1 — List  (unchanged)
// ══════════════════════════════════════════════════════════════════
function MistakeList() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();
  const [filterSubject,  setFilterSubject]  = useState('');
  const [filterType,     setFilterType]     = useState('');
  const [filterResolved, setFilterResolved] = useState('false');
  const [expanded, setExpanded] = useState({});

  const { data: mistakes, isLoading } = useQuery({
    queryKey: ['mistakes', filterSubject, filterResolved],
    queryFn:  () => mistakesAPI.getAll({
      subject:  filterSubject  || undefined,
      resolved: filterResolved === 'all' ? undefined : filterResolved,
      days:     90,
    }).then(r => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolved }) => mistakesAPI.update(id, { resolved }),
    onSuccess:  () => qc.invalidateQueries(['mistakes']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mistakesAPI.delete(id),
    onSuccess:  () => { qc.invalidateQueries(['mistakes']); qc.invalidateQueries(['mistake-stats']); toast('Deleted', 'info'); },
  });

  const filtered = (mistakes || []).filter(m =>
    (!filterType || m.mistakeType === filterType)
  );

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="text-white/40" />
          <span className="text-xs text-white/40">Filter</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="select text-xs py-1.5 w-auto"
            value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">সব Subject</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select text-xs py-1.5 w-auto"
            value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">সব Type</option>
            {MISTAKE_TYPES.map(t => <option key={t.key}>{t.key}</option>)}
          </select>
          <div className="flex gap-1">
            {[['false', 'Unresolved'], ['true', 'Resolved'], ['all', 'সব']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterResolved(val)}
                className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                  filterResolved === val
                    ? val === 'false' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : val === 'true'  ? 'bg-neon-green/15 text-neon-green border-neon-green/30'
                    : 'bg-white/10 text-white border-white/20'
                    : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <LoadingCard rows={4} /> : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle2 size={28} className="text-neon-green/30 mx-auto mb-2" />
          <p className="text-sm text-white/30">কোনো mistake নেই এই filter এ!</p>
          <p className="text-xs text-white/20 mt-1">ভালো কাজ, অথবা filter বদলাও</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-white/30">{filtered.length}টা mistake</p>
          {filtered.map(m => {
            const typeInfo = MISTAKE_TYPES.find(t => t.key === m.mistakeType) || MISTAKE_TYPES[0];
            const isOpen   = expanded[m.id];
            return (
              <div key={m.id} className={`card overflow-hidden transition-all ${m.resolved ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => resolveMutation.mutate({ id: m.id, resolved: !m.resolved })}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      m.resolved
                        ? 'bg-neon-green/20 border-neon-green text-neon-green'
                        : 'border-white/20 text-transparent hover:border-neon-green/50'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold ${SUBJECT_COLORS[m.subject] || 'text-white/60'}`}>{m.subject}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/50 truncate">{m.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color} border ${typeInfo.border}`}>
                        {typeInfo.emoji} {typeInfo.label}
                      </span>
                      {m.source && <span className="text-[11px] text-white/25">{m.source}</span>}
                      <span className="text-[11px] text-white/20 ml-auto">{m.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))} className="text-white/25 hover:text-white/60 p-1">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(m.id)} className="text-white/20 hover:text-red-400 p-1 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/[0.05] space-y-3 pt-3 animate-fade-in">
                    <div>
                      <p className="text-[11px] text-white/30 mb-1">কী ভুল হয়েছিল</p>
                      <p className="text-sm text-white/70 leading-relaxed">{m.description}</p>
                    </div>
                    {m.correction && (
                      <div>
                        <p className="text-[11px] text-neon-green/50 mb-1">✓ সঠিক উত্তর / পদ্ধতি</p>
                        <p className="text-sm text-neon-green/80 leading-relaxed bg-neon-green/5 rounded-lg p-3 border border-neon-green/10">
                          {m.correction}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2 — Add mistake  ← Math keyboard integrated here
// ══════════════════════════════════════════════════════════════════
function AddMistake({ onDone }) {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const [form, setForm] = useState({
    subject:     '',
    topic:       '',
    mistakeType: '',
    description: '',
    correction:  '',
    source:      '',
  });

  // ── Math keyboard cursor tracking ──────────────────────────────
  // Which textarea is active: 'description' | 'correction' | null
  const activeFieldRef = useRef(null);
  // Saved cursor position { start, end }
  const cursorRef      = useRef({ start: 0, end: 0 });
  // Refs to the two textareas
  const descRef        = useRef(null);
  const corrRef        = useRef(null);

  /** Save which field is focused + cursor position */
  const handleTextareaFocus = (field) => {
    activeFieldRef.current = field;
  };

  /** Update cursor position on every key/click/select */
  const handleCursorUpdate = (field, e) => {
    activeFieldRef.current = field;
    cursorRef.current = {
      start: e.target.selectionStart ?? 0,
      end:   e.target.selectionEnd   ?? 0,
    };
  };

  /** Insert symbol at last-known cursor position */
  const handleMathInsert = useCallback((text) => {
    const field = activeFieldRef.current;
    if (!field) return;

    const { start, end } = cursorRef.current;
    const current  = form[field] || '';
    const newValue = current.slice(0, start) + text + current.slice(end);
    const newCursor = start + text.length;

    // Update form state
    setForm(f => ({ ...f, [field]: newValue }));

    // Restore cursor after React re-render
    const ref = field === 'description' ? descRef : corrRef;
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(newCursor, newCursor);
      }
      // Save new cursor position for the next insert
      cursorRef.current = { start: newCursor, end: newCursor };
    });
  }, [form]);
  // ───────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: (data) => mistakesAPI.create(data),
    onSuccess:  () => {
      qc.invalidateQueries(['mistakes']);
      qc.invalidateQueries(['mistake-stats']);
      toast('Mistake লগ হয়েছে! এবার এটা আর repeat করো না। 💪', 'success');
      onDone();
    },
    onError: (err) => toast(err.response?.data?.error || 'Error', 'error'),
  });

  const valid = form.subject && form.topic && form.mistakeType && form.description;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={16} className="text-red-400" />
        <h3 className="text-sm font-semibold text-white">নতুন Mistake লগ করো</h3>
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs text-white/40 mb-2 block">Subject *</label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setForm(f => ({ ...f, subject: s }))}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                form.subject === s
                  ? 'bg-red-500/15 border-red-500/30 text-red-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="text-xs text-white/40 mb-1.5 block">Topic / Chapter *</label>
        <input className="input text-sm" placeholder="যেমন: Circular Motion, Chemical Bonding..."
          value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
      </div>

      {/* Mistake type */}
      <div>
        <label className="text-xs text-white/40 mb-2 block">Mistake এর ধরন *</label>
        <div className="grid grid-cols-3 gap-2">
          {MISTAKE_TYPES.map(t => (
            <button key={t.key} onClick={() => setForm(f => ({ ...f, mistakeType: t.key }))}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                form.mistakeType === t.key
                  ? `${t.bg} ${t.border} ${t.color}`
                  : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white'
              }`}
            >
              <p className="text-base mb-0.5">{t.emoji}</p>
              <p className="text-xs font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Description textarea ── */}
      <div>
        <label className="text-xs text-white/40 mb-1.5 block">কী ভুল হয়েছিল? *</label>
        <textarea
          ref={descRef}
          className="input resize-none text-sm"
          rows={3}
          placeholder="ভুলটা বিস্তারিত লেখো। যেমন: Tension এর formula এ mg বাদ দিয়েছিলাম..."
          value={form.description}
          onChange={e  => { setForm(f => ({ ...f, description: e.target.value })); handleCursorUpdate('description', e); }}
          onFocus={()  => handleTextareaFocus('description')}
          onClick={e   => handleCursorUpdate('description', e)}
          onKeyUp={e   => handleCursorUpdate('description', e)}
          onSelect={e  => handleCursorUpdate('description', e)}
        />
      </div>

      {/* ── Correction textarea ── */}
      <div>
        <label className="text-xs text-neon-green/50 mb-1.5 block">✓ সঠিক উত্তর / পদ্ধতি (optional কিন্তু important)</label>
        <textarea
          ref={corrRef}
          className="input resize-none text-sm border-neon-green/15 focus:border-neon-green/30"
          rows={3}
          placeholder="সঠিক approach কী ছিল? এটা লিখলে পরে review করতে সহজ হবে..."
          value={form.correction}
          onChange={e  => { setForm(f => ({ ...f, correction: e.target.value })); handleCursorUpdate('correction', e); }}
          onFocus={()  => handleTextareaFocus('correction')}
          onClick={e   => handleCursorUpdate('correction', e)}
          onKeyUp={e   => handleCursorUpdate('correction', e)}
          onSelect={e  => handleCursorUpdate('correction', e)}
        />
      </div>

      {/* ── Math Keyboard ── */}
      <MathKeyboard
        onInsert={handleMathInsert}
        activeField={activeFieldRef.current}
      />

      {/* Source */}
      <div>
        <label className="text-xs text-white/40 mb-2 block">কোথায় ভুল হয়েছিল?</label>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(s => (
            <button key={s} onClick={() => setForm(f => ({ ...f, source: f.source === s ? '' : s }))}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                form.source === s
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      <button
        onClick={() => mutation.mutate({ ...form, date: getBSTDateString() })}
        disabled={mutation.isPending || !valid}
        className="btn-primary w-full text-sm"
        style={{ background: valid ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined }}
      >
        {mutation.isPending ? 'সেভ হচ্ছে...' : '⚠️ Mistake Log করো'}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3 — Stats  (unchanged)
// ══════════════════════════════════════════════════════════════════
function MistakeStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['mistake-stats'],
    queryFn:  () => mistakesAPI.getStats().then(r => r.data),
  });

  const { data: mistakes } = useQuery({
    queryKey: ['mistakes', '', 'false'],
    queryFn:  () => mistakesAPI.getAll({ days: 90 }).then(r => r.data),
  });

  if (isLoading) return <LoadingCard rows={5} />;
  if (!stats) return null;

  const total      = stats.total || 0;
  const unresolved = stats.unresolved || 0;
  const resolved   = total - unresolved;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center border-red-500/15">
          <p className="text-xs text-white/40 mb-1">মোট</p>
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-[11px] text-white/30 mt-1">mistakes</p>
        </div>
        <div className="card p-4 text-center border-red-500/25 bg-red-500/5">
          <p className="text-xs text-white/40 mb-1">Unresolved</p>
          <p className="text-2xl font-bold text-red-400">{unresolved}</p>
          <p className="text-[11px] text-white/30 mt-1">সমাধান হয়নি</p>
        </div>
        <div className="card p-4 text-center border-neon-green/15">
          <p className="text-xs text-white/40 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-neon-green">{resolved}</p>
          <p className="text-[11px] text-white/30 mt-1">✓ শিখেছো</p>
        </div>
      </div>

      {Object.keys(stats.bySubject || {}).length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-red-400" />
            <h3 className="text-sm font-semibold text-white">Subject-wise Mistakes</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.bySubject)
              .sort(([,a], [,b]) => b - a)
              .map(([subj, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={subj}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${SUBJECT_COLORS[subj] || 'text-white/60'}`}>{subj}</span>
                      <span className="text-white/40">{count} mistakes ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-red-400/70 transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {Object.keys(stats.byType || {}).length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Mistake Type Distribution</h3>
          <div className="grid grid-cols-2 gap-2">
            {MISTAKE_TYPES.map(t => {
              const count = stats.byType?.[t.key] || 0;
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={t.key} className={`p-3 rounded-xl border ${t.bg} ${t.border} flex items-center gap-3`}>
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${t.color}`}>{t.label}</p>
                    <p className="text-sm font-bold text-white">{count} <span className="text-xs text-white/30">({pct}%)</span></p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-white/25 mt-4">
            💡 সবচেয়ে বেশি {Object.entries(stats.byType || {}).sort(([,a],[,b]) => b-a)[0]?.[0] || '?'} type এর mistake — এই ধরনের ভুলে বেশি মনোযোগ দাও
          </p>
        </div>
      )}
    </div>
  );
}