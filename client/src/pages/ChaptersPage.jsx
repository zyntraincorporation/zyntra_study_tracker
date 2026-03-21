import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, RefreshCw } from 'lucide-react';
import { chaptersAPI } from '../lib/api';
import { LoadingCard } from '../components/ui/Shared';
import { useUIStore } from '../store';

const STATUS_CONFIG = {
  not_started:  { label: 'Not started',  color: 'text-white/30',    bg: 'bg-white/[0.04]',       border: 'border-white/10',        icon: Circle },
  in_progress:  { label: 'In progress',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',      border: 'border-yellow-500/20',   icon: Clock },
  completed:    { label: 'Completed',    color: 'text-neon-green',  bg: 'bg-neon-green/10',      border: 'border-neon-green/20',   icon: CheckCircle2 },
  revised:      { label: 'Revised',      color: 'text-neon-blue',   bg: 'bg-neon-blue/10',       border: 'border-neon-blue/20',    icon: RefreshCw },
};

const SUBJECT_META = {
  Physics:    { color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     emoji: '⚡' },
  Chemistry:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', emoji: '🧪' },
  HigherMath: { color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  emoji: '📐' },
  Botany:     { color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20',   emoji: '🌿' },
  Zoology:    { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   emoji: '🦋' },
  ICT:        { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  emoji: '💻' },
};

const STATUS_CYCLE = ['not_started', 'in_progress', 'completed', 'revised'];

export default function ChaptersPage() {
  const [expanded, setExpanded] = useState({ Physics: true });
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn:  () => chaptersAPI.getAll().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => chaptersAPI.update(id, { status }),
    onSuccess:  () => {
      qc.invalidateQueries(['chapters']);
    },
    onError: (err) => toast('Failed to update chapter', 'error'),
  });

  function cycleStatus(chapter) {
    const idx  = STATUS_CYCLE.indexOf(chapter.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    mutation.mutate({ id: chapter.id, status: next });
  }

  function toggleSubject(subject) {
    setExpanded(e => ({ ...e, [subject]: !e[subject] }));
  }

  if (isLoading) return <div className="space-y-3"><LoadingCard rows={3} /><LoadingCard rows={4} /></div>;

  const summary = data?.summary || [];

  // Overall progress
  const totalChapters   = summary.reduce((s, d) => s + d.total, 0);
  const totalCompleted  = summary.reduce((s, d) => s + d.completed + d.revised, 0);
  const overallPct      = totalChapters > 0 ? Math.round((totalCompleted / totalChapters) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall progress banner */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">Overall Syllabus Progress</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {totalCompleted} of {totalChapters} chapters completed or revised
            </p>
          </div>
          <div className="text-3xl font-bold text-gradient">{overallPct}%</div>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill bg-gradient-to-r from-neon-green to-neon-blue"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Subject grid overview */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {summary.map(({ subject, total, completed, revised, inProgress }) => {
          const meta   = SUBJECT_META[subject] || SUBJECT_META.Physics;
          const done   = completed + revised;
          const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={subject}
              onClick={() => { toggleSubject(subject); document.getElementById(`subj-${subject}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="card p-4 text-left hover:border-white/15 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{meta.emoji}</span>
                <span className={`text-sm font-semibold ${meta.color}`}>
                  {subject === 'HigherMath' ? 'Higher Math' : subject}
                </span>
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {done}<span className="text-sm text-white/30 font-normal">/{total}</span>
              </div>
              <div className="progress-bar mb-1">
                <div className={`progress-fill ${pct >= 80 ? 'bg-neon-green' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-white/30">
                {inProgress > 0 ? `${inProgress} in progress` : `${pct}% done`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Chapter lists per subject */}
      {summary.map(({ subject, chapters }) => {
        const meta    = SUBJECT_META[subject] || {};
        const isOpen  = expanded[subject];
        const displayName = subject === 'HigherMath' ? 'Higher Math' : subject;

        return (
          <div key={subject} id={`subj-${subject}`} className="card overflow-hidden">
            {/* Subject header */}
            <button
              onClick={() => toggleSubject(subject)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-xl">{meta.emoji}</span>
              <div className="flex-1 text-left">
                <span className={`text-sm font-bold ${meta.color}`}>{displayName}</span>
                <span className="text-xs text-white/30 ml-2">
                  {chapters.filter(c => c.status === 'completed' || c.status === 'revised').length}/{chapters.length} done
                </span>
              </div>
              {isOpen ? <ChevronDown size={16} className="text-white/30" /> : <ChevronRight size={16} className="text-white/30" />}
            </button>

            {/* Chapter list */}
            {isOpen && (
              <div className="border-t border-white/[0.06]">
                {chapters.map((chapter) => {
                  const cfg   = STATUS_CONFIG[chapter.status];
                  const Icon  = cfg.icon;
                  return (
                    <div
                      key={chapter.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] last:border-0"
                    >
                      <span className="text-xs font-mono text-white/20 w-6 shrink-0">{chapter.chapterNumber}</span>
                      <span className="flex-1 text-sm text-white/70 min-w-0 truncate">{chapter.chapterName}</span>
                      <button
                        onClick={() => cycleStatus(chapter)}
                        disabled={mutation.isPending}
                        title={`Click to cycle: ${STATUS_CYCLE.join(' → ')}`}
                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all hover:opacity-80 active:scale-95 ${cfg.bg} ${cfg.color} ${cfg.border}`}
                      >
                        <Icon size={11} />
                        {cfg.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-white/20 text-center pb-4">
        Tap any status badge to cycle through: Not started → In progress → Completed → Revised
      </p>
    </div>
  );
}
