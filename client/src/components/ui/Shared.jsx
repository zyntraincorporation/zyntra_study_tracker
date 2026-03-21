import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-white/40 ${className}`} />;
}

export function LoadingCard({ rows = 3 }) {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`h-3 rounded-full bg-white/[0.06] ${i === 0 ? 'w-2/3' : i === rows - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
        <Icon size={22} className="text-white/20" />
      </div>
      <h3 className="text-sm font-medium text-white/50">{title}</h3>
      {description && <p className="text-xs text-white/30 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card p-6 flex flex-col items-center gap-3 text-center">
      <AlertCircle size={24} className="text-red-400" />
      <p className="text-sm text-white/60">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button className="btn-secondary text-xs" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export function StatCard({ label, value, sub, color = 'text-white', icon: Icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 mb-1">{label}</p>
          <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
          {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
            <Icon size={15} className="text-white/30" />
          </div>
        )}
      </div>
    </div>
  );
}

export function SubjectBadge({ subject }) {
  const colors = {
    Physics:   'bg-sky-500/15 text-sky-400 border-sky-500/20',
    Chemistry: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    Math:      'bg-violet-500/15 text-violet-400 border-violet-500/20',
    Botany:    'bg-green-500/15 text-green-400 border-green-500/20',
    Zoology:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
    ICT:       'bg-orange-500/15 text-orange-400 border-orange-500/20',
  };
  const cls = colors[subject] || 'bg-white/10 text-white/50 border-white/10';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${cls}`}>
      {subject}
    </span>
  );
}
