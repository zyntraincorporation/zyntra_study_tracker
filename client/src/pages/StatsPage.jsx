import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Pie, Line, Radar, Doughnut } from 'react-chartjs-2';
import { statsAPI, checkinAPI } from '../lib/api';
import { SUBJECT_COLORS, formatDuration, getBSTDateString } from '../lib/schedule';
import { LoadingCard, StatCard } from '../components/ui/Shared';
import {
  TrendingUp, Target, Clock, Flame,
  AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
);

const GRID  = { color: '#ffffff08' };
const TICK  = { color: '#ffffff35', font: { size: 11 } };
const BASE_OPTS = {
  plugins: { legend: { labels: { color: '#ffffff55', font: { size: 11 }, boxWidth: 12, padding: 16 } } },
  scales:  { x: { ticks: TICK, grid: GRID }, y: { ticks: TICK, grid: GRID } },
};

const SUBJECTS = [
  { key: 'Physics',   label: 'Physics',  hex: '#38bdf8' },
  { key: 'Chemistry', label: 'Chem',     hex: '#34d399' },
  { key: 'Math',      label: 'Math',     hex: '#a78bfa' },
  { key: 'Botany',    label: 'Botany',   hex: '#4ade80' },
  { key: 'Zoology',   label: 'Zoology',  hex: '#fbbf24' },
  { key: 'ICT',       label: 'ICT',      hex: '#fb923c' },
];

export default function StatsPage() {
  const [period, setPeriod] = useState(7);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['weekly-stats', period],
    queryFn:  () => statsAPI.getWeekly(period).then(r => r.data),
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap'],
    queryFn:  () => statsAPI.getHeatmap(90).then(r => r.data),
  });

  const { data: historyData } = useQuery({
    queryKey: ['session-history', period],
    queryFn:  () => checkinAPI.getSessionHistory(period).then(r => r.data),
  });

  const summary = statsData?.summary || {};
  const byDay   = statsData?.byDay   || [];
  const subDist = statsData?.subjectDistribution || {};

  const subjectStats = SUBJECTS.map(s => {
    const completed = (historyData || []).filter(l => l.subject === s.key && l.completed).length;
    const missed    = (historyData || []).filter(l => l.subject === s.key && !l.completed).length;
    const total     = completed + missed;
    const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...s, completed, missed, total, rate };
  }).filter(s => s.total > 0);

  const completionRate = summary.totalScheduled > 0
    ? Math.round((summary.totalCompleted / summary.totalScheduled) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Statistics</h2>
        <div className="flex gap-1 bg-navy-700/50 rounded-lg p-1">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === d ? 'bg-neon-green/15 text-neon-green' : 'text-white/40 hover:text-white'
              }`}
            >{d}d</button>
          ))}
        </div>
      </div>

      {/* Top stat cards */}
      {isLoading ? <LoadingCard rows={2} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Completed"   value={summary.totalCompleted || 0} sub="sessions"  color="text-neon-green" icon={Target} />
          <StatCard label="Missed"      value={summary.totalMissed    || 0} sub="sessions"  color="text-red-400"   icon={TrendingUp} />
          <StatCard label="Extra Study" value={formatDuration(summary.totalExtraMin || 0)} sub="ad-hoc" color="text-neon-blue" icon={Clock} />
          <StatCard label="Avg Score"   value={`${summary.avgScore || 0}`} sub="/ 100"      color={summary.avgScore >= 70 ? 'text-neon-green' : 'text-yellow-400'} icon={Flame} />
        </div>
      )}

      {/* ── SUBJECT-WISE COMPARISON ─────────────────────────────────── */}
      {subjectStats.length > 0 && (
        <div>
          <h3 className="section-heading">Subject-wise breakdown</h3>

          {/* Subject cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {subjectStats.map(s => <SubjectCard key={s.key} subject={s} />)}
          </div>

          {/* Completed vs Missed bar */}
          <div className="card p-5 mb-4">
            <h4 className="text-sm font-semibold text-white mb-4">Completed vs Missed — per subject</h4>
            <Bar
              data={{
                labels: subjectStats.map(s => s.label),
                datasets: [
                  {
                    label: 'Completed',
                    data:  subjectStats.map(s => s.completed),
                    backgroundColor: subjectStats.map(s => s.hex + 'aa'),
                    borderColor:     subjectStats.map(s => s.hex),
                    borderWidth: 1, borderRadius: 5,
                  },
                  {
                    label: 'Missed',
                    data:  subjectStats.map(s => s.missed),
                    backgroundColor: '#ef444460',
                    borderColor:     '#ef4444',
                    borderWidth: 1, borderRadius: 5,
                  },
                ],
              }}
              options={{ ...BASE_OPTS, responsive: true }}
              height={130}
            />
          </div>

          {/* Radar + Doughnut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h4 className="text-sm font-semibold text-white mb-4">Subject balance (completion %)</h4>
              <div className="flex justify-center">
                <Radar
                  data={{
                    labels: subjectStats.map(s => s.label),
                    datasets: [{
                      label: 'Completion rate %',
                      data:  subjectStats.map(s => s.rate),
                      backgroundColor:   '#00ff8720',
                      borderColor:       '#00ff87',
                      borderWidth:       2,
                      pointBackgroundColor: subjectStats.map(s => s.hex),
                      pointRadius: 5,
                    }],
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      r: {
                        min: 0, max: 100,
                        ticks:      { color: '#ffffff30', stepSize: 25, font: { size: 10 }, backdropColor: 'transparent' },
                        grid:       { color: '#ffffff10' },
                        angleLines: { color: '#ffffff10' },
                        pointLabels:{ color: '#ffffff70', font: { size: 11 } },
                      },
                    },
                    plugins: { legend: { display: false } },
                  }}
                  height={220}
                />
              </div>
            </div>

            <div className="card p-5">
              <h4 className="text-sm font-semibold text-white mb-4">Time distribution</h4>
              <div className="flex justify-center">
                <Doughnut
                  data={{
                    labels: Object.keys(subDist),
                    datasets: [{
                      data:            Object.values(subDist),
                      backgroundColor: Object.keys(subDist).map(k => (SUBJECT_COLORS[k]?.hex || '#94a3b8') + 'cc'),
                      borderColor:     Object.keys(subDist).map(k =>  SUBJECT_COLORS[k]?.hex || '#94a3b8'),
                      borderWidth: 2, hoverOffset: 6,
                    }],
                  }}
                  options={{
                    cutout: '65%',
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff55', font: { size: 11 }, padding: 12, boxWidth: 10 },
                      },
                    },
                  }}
                  height={210}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY SESSION PERFORMANCE ───────────────────────────────── */}
      {!isLoading && byDay.length > 0 && (
        <div>
          <h3 className="section-heading">Daily performance</h3>
          <div className="card p-5">
            <Bar
              data={{
                labels: byDay.map(d => d.day.slice(0, 3)),
                datasets: [
                  {
                    label: 'Completed',
                    data:  byDay.map(d => d.completedSessions),
                    backgroundColor: '#00ff8780', borderColor: '#00ff87',
                    borderWidth: 1, borderRadius: 4,
                  },
                  {
                    label: 'Missed',
                    data:  byDay.map(d => d.missedSessions),
                    backgroundColor: '#ef444480', borderColor: '#ef4444',
                    borderWidth: 1, borderRadius: 4,
                  },
                  {
                    label: 'Extra (×10 min)',
                    data:  byDay.map(d => Math.round(d.extraStudyMinutes / 10)),
                    backgroundColor: '#00d4ff40', borderColor: '#00d4ff',
                    borderWidth: 1, borderRadius: 4,
                  },
                ],
              }}
              options={{ ...BASE_OPTS, responsive: true }}
              height={130}
            />
          </div>
        </div>
      )}

      {/* ── PRODUCTIVITY SCORE + GAUGE ──────────────────────────────── */}
      {!isLoading && byDay.length > 0 && (
        <div>
          <h3 className="section-heading">Productivity trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="card p-5 flex flex-col items-center justify-center">
              <h4 className="text-sm font-semibold text-white mb-4 self-start">Overall completion</h4>
              <CompletionGauge rate={completionRate} />
            </div>

            <div className="card p-5 lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-4">Daily productivity score (0–100)</h4>
              <Line
                data={{
                  labels: byDay.map(d => d.day.slice(0, 3)),
                  datasets: [{
                    label: 'Score',
                    data:  byDay.map(d => d.productivityScore),
                    borderColor:     '#00d4ff',
                    backgroundColor: '#00d4ff12',
                    fill: true, tension: 0.4,
                    pointBackgroundColor: byDay.map(d =>
                      d.productivityScore >= 70 ? '#00ff87' :
                      d.productivityScore >= 50 ? '#fbbf24' : '#ef4444'),
                    pointRadius: 5, pointHoverRadius: 7,
                  }],
                }}
                options={{
                  ...BASE_OPTS,
                  responsive: true,
                  scales: {
                    x: { ticks: TICK, grid: GRID },
                    y: { ticks: { ...TICK, stepSize: 25 }, grid: GRID, min: 0, max: 100 },
                  },
                  plugins: { legend: { display: false } },
                }}
                height={155}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MORNING DISCIPLINE ──────────────────────────────────────── */}
      {!isLoading && byDay.length > 0 && (
        <div>
          <h3 className="section-heading">Morning discipline</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            <div className="card p-5">
              <h4 className="text-sm font-semibold text-white mb-4">Wake-up at 6 AM — daily</h4>
              <div className="space-y-2">
                {byDay.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-white/40 w-8 shrink-0">{d.day.slice(0,3)}</span>
                    <div className="flex-1 h-7 rounded-md overflow-hidden bg-white/[0.04] flex items-center px-3">
                      {d.wakeUpAt6
                        ? <><CheckCircle size={13} className="text-neon-green mr-2 shrink-0" /><span className="text-xs text-neon-green">Woke at 6 AM ✓</span></>
                        : d.isBreakDay
                        ? <span className="text-xs text-white/20">Practice day</span>
                        : <><XCircle size={13} className="text-red-400 mr-2 shrink-0" /><span className="text-xs text-red-400/70">Missed wake-up</span></>
                      }
                    </div>
                    {d.preStudy && (
                      <span className="badge-green text-[10px] shrink-0">Pre-study ✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h4 className="text-sm font-semibold text-white mb-4">Discipline summary</h4>
              <div className="space-y-4">
                <MiniStat label="Woke at 6 AM"        count={byDay.filter(d => d.wakeUpAt6).length}           total={byDay.filter(d => !d.isBreakDay).length} color="#00ff87" />
                <MiniStat label="Pre-college study"   count={byDay.filter(d => d.preStudy).length}            total={byDay.filter(d => !d.isBreakDay).length} color="#00d4ff" />
                <MiniStat label="All sessions done"   count={byDay.filter(d => d.completedSessions === d.scheduledSessions && d.scheduledSessions > 0).length} total={byDay.filter(d => !d.isBreakDay).length} color="#bf5af2" />
                <MiniStat label="Zero-miss days"      count={byDay.filter(d => d.missedSessions === 0 && !d.isBreakDay).length} total={byDay.filter(d => !d.isBreakDay).length} color="#fbbf24" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEATMAP ─────────────────────────────────────────────────── */}
      {heatmapData && (
        <div>
          <h3 className="section-heading">Activity heatmap (90 days)</h3>
          <div className="card p-5">
            <Heatmap data={heatmapData} />
          </div>
        </div>
      )}

      {/* ── MISSED SESSIONS TABLE ────────────────────────────────────── */}
      {statsData?.missedDetail?.length > 0 && (
        <div>
          <h3 className="section-heading">Missed sessions detail</h3>
          <div className="card p-5">
            <div className="space-y-2">
              {statsData.missedDetail.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                  <AlertTriangle size={13} className="text-red-400 shrink-0" />
                  <span className="text-xs font-mono text-white/30 shrink-0">{m.date}</span>
                  <span className="text-xs text-white/50 shrink-0">{m.day} S{m.session}</span>
                  <span className={`text-xs font-medium shrink-0 ${SUBJECT_COLORS[m.subject]?.text || 'text-white/60'}`}>{m.subject}</span>
                  <span className="text-xs text-white/30 ml-auto truncate">{m.reason || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Subject card ───────────────────────────────────────────────────────────────
function SubjectCard({ subject: s }) {
  const statusColor = s.rate >= 80 ? 'text-neon-green' : s.rate >= 60 ? 'text-yellow-400' : s.rate >= 40 ? 'text-orange-400' : 'text-red-400';
  const barColor    = s.rate >= 80 ? 'bg-neon-green'   : s.rate >= 60 ? 'bg-yellow-400'   : s.rate >= 40 ? 'bg-orange-400'   : 'bg-red-400';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.hex }} />
          <span className="text-sm font-semibold text-white">{s.key}</span>
        </div>
        <span className={`text-lg font-bold tabular-nums ${statusColor}`}>{s.rate}%</span>
      </div>
      <div className="progress-bar mb-2">
        <div className={`progress-fill ${barColor}`} style={{ width: `${s.rate}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-white/35">
        <span>✓ {s.completed} done</span>
        <span>✗ {s.missed} missed</span>
      </div>
    </div>
  );
}

// ── Completion gauge (SVG arc) ─────────────────────────────────────────────────
function CompletionGauge({ rate }) {
  const circ  = Math.PI * 52;
  const dash  = (rate / 100) * circ;
  const color = rate >= 80 ? '#00ff87' : rate >= 60 ? '#fbbf24' : rate >= 40 ? '#fb923c' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="82" viewBox="0 0 140 82">
        <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" stroke="#ffffff10" strokeWidth="10" strokeLinecap="round" />
        <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="70" y="62" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="Inter,sans-serif">{rate}%</text>
        <text x="70" y="77" textAnchor="middle" fill="#ffffff40" fontSize="10" fontFamily="Inter,sans-serif">completion</text>
      </svg>
      <div className="flex gap-3 mt-1 text-[10px] text-white/30">
        <span style={{color:'#00ff87'}}>≥80% great</span>
        <span style={{color:'#fbbf24'}}>60% ok</span>
        <span style={{color:'#ef4444'}}>&lt;40% danger</span>
      </div>
    </div>
  );
}

// ── Mini stat bar ─────────────────────────────────────────────────────────────
function MiniStat({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/60">{label}</span>
        <span className="font-medium tabular-nums" style={{ color }}>
          {count}/{total} <span className="text-white/30">({pct}%)</span>
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Heatmap ────────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const COLORS = ['bg-white/[0.04]','bg-neon-green/20','bg-neon-green/40','bg-neon-green/70','bg-neon-green'];
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-1 min-w-[500px]">
        {data.map((d, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${COLORS[d.level]} transition-colors cursor-default`}
            title={`${d.date} (${d.day}): ${d.completed} sessions${d.extraMin > 0 ? ` + ${d.extraMin}m extra` : ''}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
        <span>Less</span>
        {COLORS.map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}