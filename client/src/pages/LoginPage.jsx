import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock } from 'lucide-react';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const [pin, setPin]       = useState(['', '', '', '']);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const refs   = [useRef(), useRef(), useRef(), useRef()];
  const login  = useAuthStore((s) => s.login);
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthed) navigate('/', { replace: true });
    else refs[0].current?.focus();
  }, [isAuthed]);

  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError('');
    if (value && index < 3) refs[index + 1].current?.focus();
    if (value && index === 3) {
      // Auto-submit when last digit entered
      const fullPin = [...next.slice(0, 3), value].join('');
      if (fullPin.length === 4) submitPin(fullPin);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  async function submitPin(fullPin) {
    setLoading(true);
    setError('');
    try {
      const { data } = await authAPI.login(fullPin || pin.join(''));
      login(data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect PIN');
      setPin(['', '', '', '']);
      setTimeout(() => refs[0].current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-900 px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/20 mb-5">
            <Zap size={28} className="text-neon-green" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ZYNTRA</h1>
          <p className="text-sm text-white/40 mt-1">Study Tracker OS</p>
        </div>

        {/* PIN card */}
        <div className="card p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={14} className="text-white/30" />
            <span className="text-xs text-white/40 uppercase tracking-widest">Enter your PIN</span>
          </div>

          {/* PIN boxes */}
          <div className="flex gap-3 justify-center mb-6">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className={`
                  w-14 h-14 text-center text-xl font-bold rounded-xl
                  bg-navy-700/60 border transition-all duration-150
                  focus:outline-none caret-transparent
                  ${digit ? 'border-neon-green/50 text-neon-green' : 'border-white/10 text-white'}
                  ${error ? 'border-red-500/40 shake' : ''}
                  focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/30
                  disabled:opacity-50
                `}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-red-400 mb-4 animate-fade-in">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={() => submitPin()}
            disabled={loading || pin.some(d => !d)}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying…' : 'Unlock →'}
          </button>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          BUET Prep 2027 · For Saiful only
        </p>
      </div>
    </div>
  );
}
