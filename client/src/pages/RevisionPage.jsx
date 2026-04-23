import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, CheckCircle2, Clock, ChevronDown, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { revisionsAPI, chaptersAPI } from '../lib/api';
import { LoadingCard } from '../components/ui/Shared';
import { useUIStore } from '../store';

const SUBJECT_META = {
  Physics:    { emoji: '⚡', color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
  Chemistry:  { emoji: '🧪', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  HigherMath: { emoji: '📐', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  Botany:     { emoji: '🌿', color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20'   },
  Zoology:    { emoji: '🦋', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  English1:   { emoji: '📖', color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20'    },
  English2:   { emoji: '✍️', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20'    },
  Bangla1:    { emoji: '📚', color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20'  },
  Bangla2:    { emoji: '🗂️', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20'  },
  ICT:        { emoji: '💻', color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20'    },
};

const TABS = [
  { key: 'due',     label: 'আজ Revision করো', icon: RefreshCw  },
  { key: 'log',     label: 'Revision Log করো', icon: CheckCircle2 },
  { key: 'history', label: 'ইতিহাস',           icon: Calendar    },
];

export default function RevisionPage() {
  const [activeTab, setActiveTab] = useState('due');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Revision Tracker</h2>
        <p className="text-xs text-white/40 mt-1">Spaced repetition: ১ম revision ৭ দিন পর, ২য় ১২ দিন পর, ৩য় ৩০ দিন পর</p>
      </div>

      <div className="flex gap-1 bg-navy-700/40 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? 'bg-neon-green/15 text-neon-green'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'due'     && <DueTab />}
      {activeTab === 'log'     && <LogTab onDone={() => setActiveTab('due')} />}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}

function DueTab() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['revisions-due'],
    queryFn:  () => revisionsAPI.getDue().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (d) => revisionsAPI.logRevision(d),
    onSuccess: (res) => {
      qc.invalidateQueries(['revisions-due']);
      qc.invalidateQueries(['revisions-history']);
      qc.invalidateQueries(['chapters']);
      const next = res.data.nextDueDate;
      toast(next
        ? `Revision লগ হয়েছে! পরের revision: ${next} 📅`
        : `Revision লগ হয়েছে! এই chapter mastered ✅`, 'success');
    },
    onError: () => toast('লগ করা যায়নি', 'error'),
  });

  if (isLoading) return <LoadingCard rows={4} />;

  const due      = data?.dueToday  || [];
  const upcoming = data?.upcoming  || [];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={14} className={due.length > 0 ? 'text-red-400' : 'text-white/30'} />
          <h3 className="text-sm font-semibold text-white">
            আজ revision করতে হবে
            {due.length > 0 && (
              <span className="ml-2 text-xs bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                {due.length}টা
              </span>
            )}
          </h3>
        </div>

        {due.length === 0 ? (
          <div className="card p-6 text-center">
            <CheckCircle2 size={28} className="text-neon-green/40 mx-auto mb-2" />
            <p className="text-sm text-white/40">আজ কোনো chapter revision দরকার নেই 🎉</p>
            <p className="text-xs text-white/20 mt-1">Chapter complete করলে ৭ দিন পর দেখাবে</p>
          </div>
        ) : (
          <div className="space-y-2">
            {due.map(item => (
              <RevisionDueCard key={item.chapterId} item={item}
                onRevise={(notes) => mutation.mutate({ ...item, notes })}
                loading={mutation.isPending} />
            ))}
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-white/70">
              আগামী ৭ দিনে আসছে ({upcoming.length}টা)
            </h3>
          </div>
          <div className="space-y-2">
            {upcoming.map(item => {
              const meta = SUBJECT_META[item.subject] || {};
              return (
                <div key={item.chapterId} className="card p-3 flex items-center gap-3 opacity-60">
                  <span className="text-base shrink-0">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{item.chapterName}</p>
                    <p className="text-xs text-white/30">{item.subject} · {item.revisionCount}বার revision হয়েছে</p>
                  </div>
                  <span className="text-xs text-yellow-400 shrink-0">{item.dueDate}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RevisionDueCard({ item, onRevise, loading }) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote]         = useState('');
  const meta = SUBJECT_META[item.subject] || {};

  return (
    <div className={`card p-4 ${item.overdue ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/20'}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{item.chapterName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${meta.color}`}>{item.subject}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/35">Ch. {item.chapterNumber}</span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/35">{item.revisionCount}বার revision হয়েছে</span>
            {item.overdue && <span className="text-xs text-red-400">⚠️ overdue</span>}
          </div>
        </div>
        <button
          onClick={() => setShowNote(!showNote)}
          className="shrink-0 btn-primary text-xs px-3 py-2"
          disabled={loading}
        >
          <RefreshCw size={12} />
          Revision দিলাম
        </button>
      </div>

      {showNote && (
        <div className="mt-3 space-y-2 animate-fade-in">
          <input
            className="input text-sm"
            placeholder="কোনো note? (optional) যেমন: কঠিন লাগছে, ফর্মূলা মনে নেই..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowNote(false)} className="btn-ghost text-xs">বাদ দাও</button>
            <button
              onClick={() => { onRevise(note || null); setShowNote(false); }}
              disabled={loading}
              className="btn-primary text-xs flex-1"
            >
              {loading ? 'সেভ হচ্ছে...' : 'Revision লগ করো ✅'}
            </button>
          </div>
        </div>
      )}

      {!showNote && (
        <button
          onClick={() => onRevise(null)}
          disabled={loading}
          className="mt-2 w-full py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs hover:bg-neon-green/15 transition-all"
        >
          ✅ Quick revision done (note ছাড়া)
        </button>
      )}
    </div>
  );
}

function LogTab({ onDone }) {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [note, setNote]                        = useState('');
  const [expandedSubj, setExpandedSubj]        = useState('');

  const { data: chapData } = useQuery({
    queryKey: ['chapters'],
    queryFn:  () => chaptersAPI.getAll().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (d) => revisionsAPI.logRevision(d),
    onSuccess: (res) => {
      qc.invalidateQueries(['revisions-due']);
      qc.invalidateQueries(['revisions-history']);
      qc.invalidateQueries(['chapters']);
      const next = res.data.nextDueDate;
      toast(next ? `✅ Revision লগ! পরেরটা: ${next}` : '✅ Chapter mastered!', 'success');
      setSelectedChapter(null);
      setNote('');
      onDone();
    },
    onError: () => toast('লগ করা যায়নি', 'error'),
  });

  const summary  = chapData?.summary || [];
  const subjects = summary.filter(s =>
    ['Physics','Chemistry','HigherMath','Botany','Zoology'].includes(s.subject) ||
    s.chapters?.some(c => c.status === 'completed' || c.status === 'revised')
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/40">যে chapter revision দিলে সেটা সিলেক্ট করো</p>

      {subjects.map(({ subject, chapters }) => {
        const meta     = SUBJECT_META[subject] || {};
        const eligible = chapters.filter(c => c.status === 'completed' || c.status === 'revised');
        if (eligible.length === 0) return null;
        const isOpen = expandedSubj === subject;

        return (
          <div key={subject} className="card overflow-hidden">
            <button
              onClick={() => setExpandedSubj(isOpen ? '' : subject)}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-lg">{meta.emoji}</span>
              <span className={`text-sm font-bold ${meta.color}`}>
                {subject === 'HigherMath' ? 'Higher Math' : subject}
              </span>
              <span className="text-xs text-white/30 ml-1">({eligible.length} chapters)</span>
              <span className="ml-auto">
                {isOpen ? <ChevronDown size={15} className="text-white/30" /> : <ChevronRight size={15} className="text-white/30" />}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-white/[0.06]">
                {eligible.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapter(selectedChapter?.id === ch.id ? null : ch)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/[0.04] last:border-0 transition-all ${
                      selectedChapter?.id === ch.id
                        ? 'bg-neon-green/10 border-l-2 border-l-neon-green'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-xs font-mono text-white/20 w-5 shrink-0">{ch.chapterNumber}</span>
                    <span className="flex-1 text-sm text-white/70 truncate">{ch.chapterName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      ch.status === 'revised'
                        ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                        : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                    }`}>
                      {ch.status === 'revised' ? '↻ revised' : '✓ done'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {selectedChapter && (
        <div className="card p-4 border-neon-green/30 bg-neon-green/5 animate-slide-up">
          <p className="text-sm font-semibold text-neon-green mb-3">
            ✅ নির্বাচিত: {selectedChapter.chapterName}
          </p>
          <input
            className="input text-sm mb-3"
            placeholder="Revision note (optional)..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <button
            onClick={() => mutation.mutate({
              chapterId:     selectedChapter.id,
              subject:       selectedChapter.subject,
              chapterNumber: selectedChapter.chapterNumber,
              chapterName:   selectedChapter.chapterName,
              notes:         note || null,
            })}
            disabled={mutation.isPending}
            className="btn-primary w-full"
          >
            {mutation.isPending ? 'সেভ হচ্ছে...' : 'Revision লগ করো →'}
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryTab() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['revisions-history'],
    queryFn:  () => revisionsAPI.getHistory(30).then(r => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['revisions-stats'],
    queryFn:  () => revisionsAPI.getStats().then(r => r.data),
  });

  if (isLoading) return <LoadingCard rows={5} />;

  const byDate = (logs || []).reduce((acc, log) => {
    const date = log.revisedAt.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {stats && (
        <div className="card p-4">
          <p className="text-xs text-white/40 mb-3">Subject-wise revision count (সব সময়ের)</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(stats.bySubject || {}).map(([subj, count]) => {
              const meta = SUBJECT_META[subj] || {};
              return (
                <div key={subj} className={`flex items-center gap-2 p-2.5 rounded-lg ${meta.bg} border ${meta.border}`}>
                  <span>{meta.emoji}</span>
                  <span className={`text-xs font-medium ${meta.color} truncate`}>
                    {subj === 'HigherMath' ? 'Math' : subj}
                  </span>
                  <span className="ml-auto text-xs font-bold text-white">{count}x</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-white/30 mt-3 text-right">মোট {stats.total}টা revision</p>
        </div>
      )}

      {Object.keys(byDate).length === 0 ? (
        <div className="card p-8 text-center">
          <RefreshCw size={28} className="text-white/10 mx-auto mb-2" />
          <p className="text-sm text-white/30">এখনো কোনো revision লগ নেই</p>
        </div>
      ) : (
        Object.entries(byDate).map(([date, entries]) => (
          <div key={date}>
            <p className="text-xs text-white/30 mb-2 flex items-center gap-2">
              <Calendar size={11} />
              {date}
            </p>
            <div className="space-y-2">
              {entries.map(log => {
                const meta = SUBJECT_META[log.subject] || {};
                return (
                  <div key={log.id} className="card p-3 flex items-center gap-3">
                    <span className="text-base shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 truncate">{log.chapterName}</p>
                      <p className="text-xs text-white/30">
                        {log.subject} · {log.revisionCount}তম revision
                        {log.nextDueDate && ` · পরেরটা: ${log.nextDueDate}`}
                        {!log.nextDueDate && ' · ✅ Mastered'}
                      </p>
                      {log.notes && <p className="text-xs text-yellow-400/60 mt-0.5 truncate">"{log.notes}"</p>}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${meta.bg} ${meta.color} border ${meta.border}`}>
                      #{log.revisionCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
