import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      token:     null,
      isAuthed:  false,

      login: (token) => {
        localStorage.setItem('zyntra_token', token);
        set({ token, isAuthed: true });
      },
      logout: () => {
        localStorage.removeItem('zyntra_token');
        set({ token: null, isAuthed: false });
      },
    }),
    { name: 'zyntra-auth', partialize: (s) => ({ token: s.token, isAuthed: s.isAuthed }) }
  )
);

// ── Timer store (custom study session in progress) ────────────────────────────
export const useTimerStore = create((set, get) => ({
  isRunning:    false,
  subject:      null,
  startTime:    null,   // ISO string
  startedAtMs:  null,   // Date.now() when started
  elapsed:      0,      // ms — updated by AppLayout ticker

  start: (subject) => {
    const now = Date.now();
    set({
      isRunning:   true,
      subject,
      startTime:   new Date(now).toISOString(),
      startedAtMs: now,
      elapsed:     0,
    });
  },

  tick: () => {
    const { startedAtMs, isRunning } = get();
    if (isRunning && startedAtMs) {
      set({ elapsed: Date.now() - startedAtMs });
    }
  },

  stop: () => {
    const { subject, startTime, elapsed } = get();
    const endTime         = new Date().toISOString();
    const durationMinutes = Math.round(elapsed / 60000);
    set({ isRunning: false, subject: null, startTime: null, startedAtMs: null, elapsed: 0 });
    return { subject, startTime, endTime, durationMinutes };
  },

  reset: () => {
    set({ isRunning: false, subject: null, startTime: null, startedAtMs: null, elapsed: 0 });
  },
}));
// ── UI store (toasts, modal state) ────────────────────────────────────────────
export const useUIStore = create((set, get) => ({
  toasts:     [],
  modals:     {},

  toast: (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  openModal:  (name) => set((s) => ({ modals: { ...s.modals, [name]: true  } })),
  closeModal: (name) => set((s) => ({ modals: { ...s.modals, [name]: false } })),
  isOpen:     (name) => get().modals[name] || false,
}));
