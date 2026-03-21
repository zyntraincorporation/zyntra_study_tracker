import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, RefreshCw, Calendar, TrendingUp, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { aiAPI } from '../lib/api';
import { useUIStore } from '../store';
import { LoadingCard } from '../components/ui/Shared';

export default function AIReportPage() {
  const [period, setPeriod]     = useState(7);
  const [generating, setGen]    = useState(false);
  const toast  = useUIStore(s => s.toast);
  const qc     = useQueryClient();

  // Latest report
  const { data: latest, isLoading: loadingLatest } = useQuery({
    queryKey: ['ai-report-latest'],
    queryFn:  () => aiAPI.getLatest().then(r => r.data),
  });

  // All reports list
  const { data: reports } = useQuery({
    queryKey: ['ai-reports'],
    queryFn:  () => aiAPI.getReports().then(r => r.data),
  });

  const [activeReportId, setActiveReportId] = useState(null);
  const { data: activeReport } = useQuery({
    queryKey: ['ai-report', activeReportId],
    queryFn:  () => aiAPI.getReport(activeReportId).then(r => r.data),
    enabled:  !!activeReportId,
  });

  const analyzeMutation = useMutation({
    mutationFn: (days) => aiAPI.analyze(days),
    onMutate:   () => setGen(true),
    onSuccess:  (res) => {
      qc.invalidateQueries(['ai-report-latest']);
      qc.invalidateQueries(['ai-reports']);
      setActiveReportId(null);
      toast('AI analysis complete! 🧠', 'success');
      setGen(false);
    },
    onError: (err) => {
      toast(err.response?.data?.error || 'AI analysis failed', 'error');
      setGen(false);
    },
  });

  const displayReport = activeReport || latest;

  return (
    <div className="space-y-6">
      {/* ── Header + trigger ────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-neon-purple/10 flex items-center justify-center shrink-0">
            <Sparkles size={22} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-white">AI Mentor Analysis</h2>
            <p className="text-xs text-white/40 mt-1">
              Strict, data-driven feedback from your AI mentor. Uses all your study logs, missed sessions, morning habits, and chapter progress.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          {/* Period picker */}
          <div className="flex gap-1 bg-navy-700/50 rounded-lg p-1">
            {[7, 30].map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-all ${
                  period === d ? 'bg-neon-purple/20 text-purple-300' : 'text-white/40 hover:text-white'
                }`}
              >
                {d} day analysis
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={() => analyzeMutation.mutate(period)}
            disabled={generating}
            className="flex-1 sm:flex-none btn-primary justify-center sm:px-6 bg-neon-purple text-white hover:bg-neon-purple/90"
            style={{ background: generating ? undefined : 'linear-gradient(135deg, #bf5af2, #9333ea)' }}
          >
            {generating ? (
              <><RefreshCw size={15} className="animate-spin" /> Analysing…</>
            ) : (
              <><Sparkles size={15} /> Generate Analysis</>
            )}
          </button>
        </div>

        {generating && (
          <div className="mt-4 p-3 rounded-lg bg-neon-purple/5 border border-purple-500/15">
            <p className="text-xs text-purple-300/70 animate-pulse">
              🧠 GPT-4o mini is analysing your last {period} days of data — sessions, habits, chapters, patterns…
            </p>
          </div>
        )}
      </div>

      {/* ── Past reports list ────────────────────────────────────────── */}
      {reports && reports.length > 0 && (
        <div>
          <h3 className="section-heading">Past reports</h3>
          <div className="flex gap-2 flex-wrap">
            {reports.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveReportId(r.id === activeReportId ? null : r.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${
                  r.id === (activeReportId || latest?.id)
                    ? 'bg-neon-purple/15 border-purple-500/30 text-purple-300'
                    : 'bg-white/[0.04] border-white/10 text-white/50 hover:text-white'
                }`}
              >
                <ScoreDot score={r.score} />
                <span>{r.date}</span>
                <span className="text-white/30">{r.score}/100</span>
                <span className="text-white/20">· {r.periodDays}d</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Report display ────────────────────────────────────────────── */}
      {loadingLatest ? (
        <LoadingCard rows={6} />
      ) : !displayReport ? (
        <div className="card p-10 text-center">
          <Sparkles size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40">No analysis yet.</p>
          <p className="text-xs text-white/25 mt-1">Click "Generate Analysis" to get your first mentor feedback.</p>
        </div>
      ) : (
        <div className="card p-6">
          {/* Report header */}
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/[0.06]">
            <div>
              <p className="text-xs text-white/30 mb-1">Analysis for {displayReport.date} · {displayReport.periodDays} days</p>
              <div className="flex items-center gap-3">
                <ScoreRing score={displayReport.score} />
                <div>
                  <p className="text-2xl font-bold text-white">{displayReport.score}<span className="text-sm text-white/40 font-normal">/100</span></p>
                  <p className={`text-xs font-medium ${
                    displayReport.score >= 80 ? 'text-neon-green' :
                    displayReport.score >= 60 ? 'text-yellow-400' :
                    displayReport.score >= 40 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {displayReport.score >= 80 ? 'Excellent week' :
                     displayReport.score >= 60 ? 'Decent, needs work' :
                     displayReport.score >= 40 ? 'Below target' : 'Needs urgent improvement'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-white/30">
                <Clock size={11} />
                {new Date(displayReport.generatedAt).toLocaleString('en-BD', {
                  timeZone: 'Asia/Dhaka',
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Markdown report content */}
          <div className="prose-report">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-white mt-6 mb-3 flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                    {children}
                  </h2>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-white/70 leading-relaxed mb-3">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1.5 mb-3">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-white/70 flex items-start gap-2">
                    <span className="text-neon-green/60 mt-1 shrink-0">·</span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="text-white font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-yellow-400/80 not-italic">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="pl-4 border-l-2 border-neon-blue/30 text-white/50 italic my-3">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {displayReport.reportText}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Score indicator dot ────────────────────────────────────────────────────────
function ScoreDot({ score }) {
  const color = score >= 80 ? 'bg-neon-green' : score >= 60 ? 'bg-yellow-400' : score >= 40 ? 'bg-orange-400' : 'bg-red-400';
  return <div className={`w-2 h-2 rounded-full ${color}`} />;
}

// ── Score ring (circular) ─────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 80 ? '#00ff87' : score >= 60 ? '#fbbf24' : score >= 40 ? '#fb923c' : '#ef4444';
  const r = 20, cx = 24, cy = 24;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff10" strokeWidth="3" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}
