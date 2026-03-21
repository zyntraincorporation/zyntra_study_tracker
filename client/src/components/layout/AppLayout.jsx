import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Timer, BarChart2,
  BookOpen, Sparkles, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { getBSTDayName, getBSTTime } from '../../lib/schedule';
import { useTimerStore } from '../../store';
import { formatElapsed } from '../../lib/schedule';

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/checkin',  icon: CheckSquare,     label: 'Check-in'  },
  { to: '/timer',    icon: Timer,           label: 'Study Timer' },
  { to: '/stats',    icon: BarChart2,       label: 'Weekly Stats' },
  { to: '/chapters', icon: BookOpen,        label: 'Chapters'  },
  { to: '/ai',       icon: Sparkles,        label: 'AI Mentor' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logout   = useAuthStore((s) => s.logout);
  const day      = getBSTDayName();
  const { hour } = getBSTTime();
  const isRunning = useTimerStore((s) => s.isRunning);
  const elapsed   = useTimerStore((s) => s.elapsed);
  const subject   = useTimerStore((s) => s.subject);

  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col
          bg-navy-800 border-r border-white/[0.06]
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-neon-green/15 flex items-center justify-center">
            <Zap size={16} className="text-neon-green" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-white">ZYNTRA</div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Study OS</div>
          </div>
          <button
            className="ml-auto lg:hidden text-white/40 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="text-xs text-white/40">{greeting}</div>
          <div className="text-sm font-semibold text-white mt-0.5">Saiful 👋</div>
          <div className="text-[11px] text-white/30 mt-1">{day} · BUET Prep 2027</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${isActive
                  ? 'bg-neon-green/10 text-neon-green font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`
              }
            >
              <Icon size={16} />
              {label}
              {label === 'Study Timer' && isRunning && (
                <span className="ml-auto text-[10px] font-mono text-neon-green animate-pulse-slow">
                  {formatElapsed(elapsed)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Active timer banner */}
        {isRunning && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg bg-neon-green/10 border border-neon-green/20 animate-glow-green">
            <div className="text-[10px] text-neon-green/70 uppercase tracking-wider">Studying now</div>
            <div className="text-sm font-semibold text-neon-green">{subject}</div>
            <div className="text-xl font-mono text-neon-green mt-0.5">{formatElapsed(elapsed)}</div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06] bg-navy-800/50 backdrop-blur-sm lg:px-6">
          <button
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <PageTitle />
          <div className="ml-auto flex items-center gap-2">
            <BSTClock />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  const titles = {
    '/':         'Dashboard',
    '/checkin':  'Session Check-in',
    '/timer':    'Study Timer',
    '/stats':    'Weekly Statistics',
    '/chapters': 'Chapter Progress',
    '/ai':       'AI Mentor Analysis',
  };
  return (
    <h1 className="text-sm font-semibold text-white/80">
      {titles[location.pathname] || 'Zyntra'}
    </h1>
  );
}

function BSTClock() {
  const [time, setTime] = useState(() => {
    const { hour, minute } = getBSTTime();
    return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  });

  // Update every minute
  useState(() => {
    const tick = () => {
      const { hour, minute } = getBSTTime();
      setTime(`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
    };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  });

  return (
    <div className="text-xs font-mono text-white/30" title="Bangladesh Standard Time">
      {time} BST
    </div>
  );
}
