import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store';

const ICONS = {
  success: <CheckCircle size={16} className="text-neon-green" />,
  error:   <AlertCircle size={16} className="text-red-400" />,
  info:    <Info        size={16} className="text-neon-blue" />,
  warning: <AlertCircle size={16} className="text-yellow-400" />,
};

const BORDERS = {
  success: 'border-neon-green/20',
  error:   'border-red-500/20',
  info:    'border-neon-blue/20',
  warning: 'border-yellow-500/20',
};

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-start gap-3
            bg-navy-700 border ${BORDERS[t.type] || BORDERS.info}
            rounded-xl px-4 py-3 shadow-xl
            animate-slide-up max-w-sm
          `}
        >
          <span className="mt-0.5 shrink-0">{ICONS[t.type] || ICONS.info}</span>
          <p className="text-sm text-white/80 leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
