import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, RefreshCw } from 'lucide-react';
import { chaptersAPI } from '../lib/api';
import { LoadingCard } from '../components/ui/Shared';
import { useUIStore } from '../store';

const STATUS_CONFIG = {
  not_started: { label: 'Not started', color: 'text-white/30',   bg: 'bg-white/[0.04]',   border: 'border-white/10',      icon: Circle       },
  in_progress: { label: 'In progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20', icon: Clock        },
  completed:   { label: 'Completed',   color: 'text-neon-green', bg: 'bg-neon-green/10',  border: 'border-neon-green/20', icon: CheckCircle2 },
  revised:     { label: 'Revised',     color: 'text-neon-blue',  bg: 'bg-neon-blue/10',   border: 'border-neon-blue/20',  icon: RefreshCw    },
};
const STATUS_CYCLE = ['not_started', 'in_progress', 'completed', 'revised'];

// ── Paper definitions — which chapter numbers belong to which paper ───────────
const PAPER_MAP = {
  Physics:    [
    { paper: '1st Paper', range: [1, 10],  label: 'Physics 1st Paper'     },
    { paper: '2nd Paper', range: [11, 21], label: 'Physics 2nd Paper'     },
  ],
  Chemistry:  [
    { paper: '1st Paper', range: [1, 5],   label: 'Chemistry 1st Paper'   },
    { paper: '2nd Paper', range: [6, 10],  label: 'Chemistry 2nd Paper'   },
  ],
  HigherMath: [
    { paper: '1st Paper', range: [1, 10],  label: 'Higher Math 1st Paper' },
    { paper: '2nd Paper', range: [11, 20], label: 'Higher Math 2nd Paper' },
  ],
  Botany:     [{ paper: '1st Paper', range: [1, 11], label: 'Botany' }],
  Zoology:    [{ paper: '1st Paper', range: [1, 11], label: 'Zoology' }],
  English1:   [{ paper: '1st Paper', range: [1, 17], label: 'English 1st Paper' }],
  English2:   [{ paper: '2nd Paper', range: [1, 16], label: 'English 2nd Paper' }],
  Bangla1:    [{ paper: '1st Paper', range: [1, 26], label: 'Bangla 1st Paper'  }],
  Bangla2:    [{ paper: '2nd Paper', range: [1, 12], label: 'Bangla 2nd Paper'  }],
  ICT:        [{ paper: '1st Paper', range: [1, 6],  label: 'ICT'              }],
};

const SUBJECT_META = {
  Physics:    { label: 'Physics',      emoji: '⚡', color: 'text-sky-400',     section: 'PCMB', buet: true  },
  Chemistry:  { label: 'Chemistry',    emoji: '🧪', color: 'text-emerald-400', section: 'PCMB', buet: true  },
  HigherMath: { label: 'Higher Math',  emoji: '📐', color: 'text-violet-400',  section: 'PCMB', buet: true  },
  Botany:     { label: 'Botany',       emoji: '🌿', color: 'text-green-400',   section: 'PCMB', buet: false },
  Zoology:    { label: 'Zoology',      emoji: '🦋', color: 'text-amber-400',   section: 'PCMB', buet: false },
  English1:   { label: 'English 1st',  emoji: '📖', color: 'text-pink-400',    section: 'EBI',  buet: false },
  English2:   { label: 'English 2nd',  emoji: '✍️', color: 'text-rose-400',    section: 'EBI',  buet: false },
  Bangla1:    { label: 'Bangla 1st',   emoji: '📚', color: 'text-orange-400',  section: 'EBI',  buet: false },
  Bangla2:    { label: 'Bangla 2nd',   emoji: '🖊️', color: 'text-yellow-400',  section: 'EBI',  buet: false },
  ICT:        { label: 'ICT',          emoji: '💻', color: 'text-cyan-400',    section: 'EBI',  buet: false },
};

const PCMB_KEYS = ['Physics','Chemistry','HigherMath','Botany','Zoology'];
const EBI_KEYS  = ['English1','English2','Bangla1','Bangla2','ICT'];

export default function ChaptersPage() {
  const [activeTab, setActiveTab]   = useState('PCMB');
  const [expanded, setExpanded]     = useState({ Physics: true });
  const [openPaper, setOpenPaper]   = useState({});
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn:  () => chaptersAPI.getAll().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => chaptersAPI.update(id, { status }),
    onSuccess:  () => qc.invalidateQueries(['chapters']),
    onError:    () => toast('আপডেট করা যায়নি', 'error'),
  });

  function cycleStatus(chapter) {
    const idx  = STATUS_CYCLE.indexOf(chapter.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    mutation.mutate({ id: chapter.id, status: next });
  }

  function toggleSubject(subject) {
    setExpanded(e => ({ ...e, [subject]: !e[subject] }));
  }

  function togglePaper(key) {
    setOpenPaper(p => ({ ...p, [key]: !p[key] }));
  }

  if (isLoading) return <div className="space-y-3"><LoadingCard rows={3} /><LoadingCard rows={4} /></div>;

  const summary = data?.summary || [];

  function sectionStats(keys) {
    const subjects = summary.filter(s => keys.includes(s.subject));
    const total = subjects.reduce((a, s) => a + s.total, 0);
    const done  = subjects.reduce((a, s) => a + s.completed + s.revised, 0);
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  const pcmbStats  = sectionStats(PCMB_KEYS);
  const ebiStats   = sectionStats(EBI_KEYS);
  const totalChaps = pcmbStats.total + ebiStats.total;
  const totalDone  = pcmbStats.done  + ebiStats.done;
  const overallPct = totalChaps > 0 ? Math.round((totalDone / totalChaps) * 100) : 0;

  const activeKeys     = activeTab === 'PCMB' ? PCMB_KEYS : EBI_KEYS;
  const activeSubjects = summary.filter(s => activeKeys.includes(s.subject));

  return (
    <div className="space-y-5">

      {/* ── Overall + section progress bars ──────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-white">সামগ্রিক অগ্রগতি</h2>
            <p className="text-xs text-white/40 mt-0.5">{totalDone} / {totalChaps} chapter সম্পন্ন</p>
          </div>
          <span className="text-3xl font-bold text-gradient">{overallPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-blue transition-all duration-700"
            style={{ width: `${overallPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniBar label="PCMB" emoji="🔬" done={pcmbStats.done} total={pcmbStats.total} pct={pcmbStats.pct} color="bg-sky-400" />
          <MiniBar label="EBI"  emoji="📝" done={ebiStats.done}  total={ebiStats.total}  pct={ebiStats.pct}  color="bg-pink-400" />
        </div>
      </div>

      {/* ── PCMB / EBI tab switcher ───────────────────────────────────── */}
      <div className="flex gap-2">
        {[
          { key: 'PCMB', label: '🔬 PCMB', sub: 'Physics · Chemistry · Math · Biology',  activeCls: 'bg-sky-500/15 border-sky-500/30 text-sky-400'  },
          { key: 'EBI',  label: '📝 EBI',  sub: 'English · Bangla · ICT',                activeCls: 'bg-pink-500/15 border-pink-500/30 text-pink-400' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 p-3 rounded-xl border text-left transition-all ${
              activeTab === t.key ? t.activeCls : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            <div className="text-sm font-bold">{t.label}</div>
            <div className="text-xs text-white/30 mt-0.5">{t.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Subject overview cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {activeSubjects.map(({ subject, total, completed, revised, inProgress }) => {
          const meta = SUBJECT_META[subject] || {};
          const done = completed + revised;
          const pct  = total > 0 ? Math.round((done / total) * 100) : 0;
          const bar  = pct >= 80 ? 'bg-neon-green' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
          return (
            <button key={subject} onClick={() => toggleSubject(subject)}
              className="card p-4 text-left hover:border-white/15 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{meta.emoji}</span>
                <span className={`text-xs font-semibold truncate ${meta.color}`}>{meta.label}</span>
                {meta.buet && <span className="ml-auto shrink-0 text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">BUET</span>}
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {done}<span className="text-sm text-white/30 font-normal">/{total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[11px] text-white/30">{inProgress > 0 ? `${inProgress}টা চলছে` : `${pct}% সম্পন্ন`}</p>
            </button>
          );
        })}
      </div>

      {/* ── Subject accordion with paper sub-sections ────────────────── */}
      {activeSubjects.map(({ subject, chapters }) => {
        const meta     = SUBJECT_META[subject] || {};
        const isOpen   = expanded[subject];
        const papers   = PAPER_MAP[subject] || [];
        const done     = chapters.filter(c => c.status === 'completed' || c.status === 'revised').length;

        return (
          <div key={subject} className="card overflow-hidden">

            {/* Subject header */}
            <button onClick={() => toggleSubject(subject)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-lg">{meta.emoji}</span>
              <div className="flex-1 text-left">
                <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
                {meta.buet && <span className="ml-2 text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">BUET Core</span>}
                <span className="text-xs text-white/30 ml-2">{done}/{chapters.length} done</span>
              </div>
              {isOpen ? <ChevronDown size={16} className="text-white/30" /> : <ChevronRight size={16} className="text-white/30" />}
            </button>

            {/* Papers inside subject */}
            {isOpen && (
              <div className="border-t border-white/[0.06]">
                {papers.map(({ paper, range, label }) => {
                  const paperKey      = `${subject}-${paper}`;
                  const isPaperOpen   = openPaper[paperKey] !== false; // default open
                  const paperChapters = chapters.filter(c =>
                    c.chapterNumber >= range[0] && c.chapterNumber <= range[1]
                  );
                  const paperDone = paperChapters.filter(c =>
                    c.status === 'completed' || c.status === 'revised'
                  ).length;
                  const paperPct  = paperChapters.length > 0
                    ? Math.round((paperDone / paperChapters.length) * 100) : 0;

                  return (
                    <div key={paperKey} className="border-b border-white/[0.04] last:border-0">

                      {/* Paper sub-header */}
                      <button
                        onClick={() => togglePaper(paperKey)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="text-xs font-semibold text-white/50">{label}</span>
                        <span className="text-[11px] text-white/25 ml-1">({paperChapters.length} chapters)</span>
                        {/* mini progress */}
                        <div className="flex-1 mx-3 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              paperPct >= 80 ? 'bg-neon-green' : paperPct >= 50 ? 'bg-yellow-400' : 'bg-white/20'
                            }`}
                            style={{ width: `${paperPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white/30 shrink-0">{paperDone}/{paperChapters.length}</span>
                        {isPaperOpen
                          ? <ChevronDown size={13} className="text-white/20 shrink-0" />
                          : <ChevronRight size={13} className="text-white/20 shrink-0" />}
                      </button>

                      {/* Chapter rows */}
                      {isPaperOpen && paperChapters.map(chapter => {
                        const cfg  = STATUS_CONFIG[chapter.status];
                        const Icon = cfg.icon;
                        return (
                          <div key={chapter.id}
                            className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors border-t border-white/[0.03]"
                          >
                            <span className="text-xs font-mono text-white/20 w-5 shrink-0">{chapter.chapterNumber}</span>
                            <span className="flex-1 text-sm text-white/65 min-w-0 truncate" title={chapter.chapterName}>
                              {chapter.chapterName}
                            </span>
                            <button
                              onClick={() => cycleStatus(chapter)}
                              disabled={mutation.isPending}
                              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all hover:opacity-80 active:scale-95 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                            >
                              <Icon size={11} />
                              {cfg.label}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-white/20 text-center pb-4">
        status badge এ ক্লিক করে cycle করো: Not started → In progress → Completed → Revised
      </p>
    </div>
  );
}

function MiniBar({ label, emoji, done, total, pct, color }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-white/60">{emoji} {label}</span>
        <span className="text-xs font-bold text-white">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-white/30 mt-1">{done}/{total} chapters</p>
    </div>
  );
}