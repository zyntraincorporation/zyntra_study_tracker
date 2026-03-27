import { useState, useRef } from 'react';
import { Calculator, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Fraction Builder — stacked numerator / denominator widget
// ─────────────────────────────────────────────────────────────────
function FractionBuilder({ onInsert }) {
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');
  const denRef = useRef(null);

  const insert = () => {
    if (!num && !den) return;
    const n = num || '□';
    const d = den || '□';
    onInsert(`(${n})/(${d})`);
    setNum('');
    setDen('');
  };

  // Enter on numerator → jump to denominator
  const onNumKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); denRef.current?.focus(); }
  };
  // Enter on denominator → insert
  const onDenKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); insert(); }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Visual stacked fraction builder */}
      <div className="flex items-center gap-4">
        {/* The fraction visual */}
        <div className="flex flex-col items-stretch gap-0 min-w-[160px]">
          {/* Numerator */}
          <input
            type="text"
            value={num}
            onChange={e => setNum(e.target.value)}
            onKeyDown={onNumKey}
            placeholder="Numerator"
            // prevent stealing focus from active textarea tracking
            onMouseDown={e => e.stopPropagation()}
            className="
              bg-white/[0.06] border border-white/[0.12] rounded-t-lg
              text-center text-sm text-white/80 font-mono
              px-3 py-2 outline-none
              focus:border-violet-500/50 focus:bg-violet-500/[0.08]
              placeholder:text-white/20
              transition-colors
            "
          />
          {/* Fraction line */}
          <div className="h-[2px] bg-white/50 w-full" />
          {/* Denominator */}
          <input
            ref={denRef}
            type="text"
            value={den}
            onChange={e => setDen(e.target.value)}
            onKeyDown={onDenKey}
            placeholder="Denominator"
            onMouseDown={e => e.stopPropagation()}
            className="
              bg-white/[0.06] border border-white/[0.12] rounded-b-lg
              text-center text-sm text-white/80 font-mono
              px-3 py-2 outline-none
              focus:border-violet-500/50 focus:bg-violet-500/[0.08]
              placeholder:text-white/20
              transition-colors
            "
          />
        </div>

        {/* Preview + Insert */}
        <div className="flex flex-col items-start gap-2">
          {/* Live preview */}
          <div className="text-[11px] text-white/30 mb-0.5">Preview:</div>
          <div className="font-mono text-sm text-white/70 bg-white/[0.04] rounded-lg px-3 py-1.5 border border-white/[0.06] min-w-[80px] text-center">
            {num || den
              ? <span><span className="text-violet-300">{num || '□'}</span><span className="text-white/40">/</span><span className="text-violet-300">{den || '□'}</span></span>
              : <span className="text-white/20 text-xs">...</span>
            }
          </div>
          {/* Insert button */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); insert(); }}
            disabled={!num && !den}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-violet-500/20 border border-violet-500/30 text-violet-300
              hover:bg-violet-500/30 active:scale-95
              disabled:opacity-30 disabled:pointer-events-none
              transition-all duration-75
            "
          >
            <CornerDownLeft size={11} />
            Insert
          </button>
        </div>
      </div>

      {/* Common fraction templates */}
      <div>
        <p className="text-[10px] text-white/25 mb-1.5">Common fractions — click to insert:</p>
        <div className="flex flex-wrap gap-1">
          {[
            { n: '1',   d: '2'  }, { n: '1',   d: '3'  }, { n: '2',   d: '3'  },
            { n: '1',   d: '4'  }, { n: '3',   d: '4'  }, { n: '1',   d: 'n'  },
            { n: 'a',   d: 'b'  }, { n: 'p',   d: 'q'  }, { n: 'x',   d: 'y'  },
            { n: 'm',   d: 'n'  }, { n: 'Δy',  d: 'Δx' }, { n: 'f(x)','d': 'g(x)' },
            { n: 'dy',  d: 'dx' }, { n: 'd²y', d: 'dx²'}, { n: '∂f',  d: '∂x' },
            { n: '∂²f', d: '∂x²'}, { n: '1',   d: 'x'  }, { n: 'x',   d: 'x+1'},
            { n: 'sin θ', d: 'cos θ' }, { n: '1', d: 'sin θ' },
          ].map(({ n, d }, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); onInsert(`(${n})/(${d})`); }}
              className="
                flex flex-col items-center px-2 py-1 rounded-lg
                bg-white/[0.04] border border-white/[0.07]
                hover:bg-violet-500/20 hover:border-violet-500/30
                active:scale-95 transition-all duration-75
                select-none
              "
            >
              <span className="text-[10px] font-mono text-white/70 leading-tight">{n}</span>
              <span className="w-full border-t border-white/40 my-0.5" />
              <span className="text-[10px] font-mono text-white/70 leading-tight">{d}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-white/20 px-0.5">
        💡 Numerator লিখে Enter চাপো → Denominator এ যাবে → আবার Enter = Insert
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Symbol categories
// ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'fraction',
    label: 'Fraction',
    emoji: '⊟',          // placeholder — rendered specially
    isFractionBuilder: true,
  },
  {
    id: 'basic',
    label: 'Basic',
    emoji: '±',
    keys: [
      { d: '÷',   v: '÷'  }, { d: '×',   v: '×'  }, { d: '±',   v: '±'  },
      { d: '≠',   v: '≠'  }, { d: '≈',   v: '≈'  }, { d: '≤',   v: '≤'  },
      { d: '≥',   v: '≥'  }, { d: '∞',   v: '∞'  }, { d: '∝',   v: '∝'  },
      { d: '°',   v: '°'  }, { d: '⊥',   v: '⊥'  }, { d: '∥',   v: '∥'  },
      { d: '∠',   v: '∠'  }, { d: '△',   v: '△'  }, { d: '·',   v: '·'  },
      { d: '≡',   v: '≡'  }, { d: '∴',   v: '∴'  }, { d: '∵',   v: '∵'  },
      { d: '⟹',  v: '⟹' }, { d: '⟺',  v: '⟺' }, { d: '∈',   v: '∈'  },
      { d: '∉',   v: '∉'  }, { d: '⊂',   v: '⊂'  }, { d: '⊃',   v: '⊃'  },
      { d: '∪',   v: '∪'  }, { d: '∩',   v: '∩'  }, { d: '∅',   v: '∅'  },
    ],
  },
  {
    id: 'supsubroot',
    label: 'Sup/Sub',
    emoji: 'xⁿ',
    keys: [
      { d: 'x²',   v: '²'   }, { d: 'x³',  v: '³'  }, { d: 'x⁴',  v: '⁴'  },
      { d: 'x⁵',   v: '⁵'   }, { d: 'x⁶',  v: '⁶'  }, { d: 'x⁷',  v: '⁷'  },
      { d: 'x⁸',   v: '⁸'   }, { d: 'x⁹',  v: '⁹'  }, { d: 'xⁿ',  v: 'ⁿ'  },
      { d: 'x⁻¹',  v: '⁻¹'  }, { d: 'x⁻ⁿ', v: '⁻ⁿ' }, { d: 'x⁺',  v: '⁺'  },
      { d: 'x₀',   v: '₀'   }, { d: 'x₁',  v: '₁'  }, { d: 'x₂',  v: '₂'  },
      { d: 'x₃',   v: '₃'   }, { d: 'x₄',  v: '₄'  }, { d: 'x₅',  v: '₅'  },
      { d: 'x₆',   v: '₆'   }, { d: 'x₇',  v: '₇'  }, { d: 'x₈',  v: '₈'  },
      { d: 'x₉',   v: '₉'   }, { d: 'xₙ',  v: 'ₙ'  }, { d: 'xₐ',  v: 'ₐ'  },
      { d: 'xₑ',   v: 'ₑ'   }, { d: 'xₒ',  v: 'ₒ'  },
      { d: '√(',   v: '√('  }, { d: '∛(',  v: '∛(' }, { d: '∜(',  v: '∜(' },
      { d: '^',    v: '^'   }, { d: '_',   v: '_'  },
    ],
  },
  {
    id: 'calculus',
    label: 'Calculus',
    emoji: '∫',
    keys: [
      { d: '∫',      v: '∫'     }, { d: '∬',    v: '∬'    }, { d: '∭',   v: '∭'  },
      { d: '∮',      v: '∮'     }, { d: '∂',    v: '∂'    }, { d: '∇',   v: '∇'  },
      { d: 'lim',    v: 'lim'   }, { d: 'x→0',  v: 'x→0'  }, { d: 'x→∞', v: 'x→∞'},
      { d: 'n→∞',    v: 'n→∞'  }, { d: 'h→0',  v: 'h→0'  }, { d: 'Σ',   v: 'Σ'  },
      { d: 'Π',      v: 'Π'     }, { d: 'Δ',    v: 'Δ'    }, { d: '→',   v: '→'  },
      { d: ' dx',    v: ' dx'   }, { d: ' dy',  v: ' dy'  }, { d: ' dt', v: ' dt'},
      { d: ' dθ',    v: ' dθ'   }, { d: "f'(x)",v:"f'(x)" },{ d:"f''(x)",v:"f''(x)"},
    ],
  },
  {
    id: 'logtrig',
    label: 'Log/Trig',
    emoji: 'sinθ',
    keys: [
      { d: 'log',    v: 'log'   }, { d: 'log₁₀', v: 'log₁₀' }, { d: 'log₂',  v: 'log₂' },
      { d: 'logₐ',  v: 'logₐ'  }, { d: 'ln',     v: 'ln'    }, { d: 'exp',   v: 'exp'  },
      { d: 'sin',   v: 'sin'   }, { d: 'cos',    v: 'cos'   }, { d: 'tan',   v: 'tan'  },
      { d: 'cot',   v: 'cot'   }, { d: 'sec',    v: 'sec'   }, { d: 'csc',   v: 'csc'  },
      { d: 'sin⁻¹', v: 'sin⁻¹' }, { d: 'cos⁻¹',  v: 'cos⁻¹' }, { d: 'tan⁻¹', v: 'tan⁻¹'},
      { d: 'sinh',  v: 'sinh'  }, { d: 'cosh',   v: 'cosh'  }, { d: 'tanh',  v: 'tanh' },
      { d: 'π',     v: 'π'     }, { d: '2π',     v: '2π'    }, { d: 'e',     v: 'e'    },
      { d: 'eˣ',    v: 'eˣ'   },
    ],
  },
  {
    id: 'greek',
    label: 'Greek',
    emoji: 'αβ',
    keys: [
      { d: 'α', v: 'α' }, { d: 'β', v: 'β' }, { d: 'γ', v: 'γ' }, { d: 'δ', v: 'δ' },
      { d: 'ε', v: 'ε' }, { d: 'ζ', v: 'ζ' }, { d: 'η', v: 'η' }, { d: 'θ', v: 'θ' },
      { d: 'ι', v: 'ι' }, { d: 'κ', v: 'κ' }, { d: 'λ', v: 'λ' }, { d: 'μ', v: 'μ' },
      { d: 'ν', v: 'ν' }, { d: 'ξ', v: 'ξ' }, { d: 'π', v: 'π' }, { d: 'ρ', v: 'ρ' },
      { d: 'σ', v: 'σ' }, { d: 'τ', v: 'τ' }, { d: 'υ', v: 'υ' }, { d: 'φ', v: 'φ' },
      { d: 'χ', v: 'χ' }, { d: 'ψ', v: 'ψ' }, { d: 'ω', v: 'ω' },
      { d: 'Γ', v: 'Γ' }, { d: 'Δ', v: 'Δ' }, { d: 'Θ', v: 'Θ' }, { d: 'Λ', v: 'Λ' },
      { d: 'Ξ', v: 'Ξ' }, { d: 'Π', v: 'Π' }, { d: 'Σ', v: 'Σ' }, { d: 'Υ', v: 'Υ' },
      { d: 'Φ', v: 'Φ' }, { d: 'Ψ', v: 'Ψ' }, { d: 'Ω', v: 'Ω' },
    ],
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    emoji: '⚗️',
    keys: [
      { d: '→',       v: '→'      }, { d: '⇌',     v: '⇌'    }, { d: '⇒',     v: '⇒'   },
      { d: '↑',       v: '↑'      }, { d: '↓',      v: '↓'    }, { d: '°C',    v: '°C'  },
      { d: 'ΔH',      v: 'ΔH'    }, { d: 'ΔG',     v: 'ΔG'   }, { d: 'ΔS',    v: 'ΔS'  },
      { d: 'ΔE',      v: 'ΔE'    }, { d: 'Ea',     v: 'Ea'   }, { d: 'Kₑq',   v: 'Kₑq' },
      { d: 'Ka',      v: 'Ka'    }, { d: 'Kb',     v: 'Kb'   }, { d: 'Ksp',   v: 'Ksp' },
      { d: 'pH',      v: 'pH'    }, { d: 'pOH',    v: 'pOH'  }, { d: 'pKa',   v: 'pKa' },
      { d: 'mol',     v: 'mol'   }, { d: 'M',      v: 'M'    }, { d: 'Å',     v: 'Å'   },
      { d: 'H₂O',     v: 'H₂O'  }, { d: 'CO₂',    v: 'CO₂'  }, { d: 'O₂',    v: 'O₂'  },
      { d: 'H₂',      v: 'H₂'   }, { d: 'N₂',     v: 'N₂'   }, { d: 'Cl₂',   v: 'Cl₂' },
      { d: 'NH₃',     v: 'NH₃'  }, { d: 'H₂SO₄',  v: 'H₂SO₄'}, { d: 'HCl',   v: 'HCl' },
      { d: 'NaOH',    v: 'NaOH' }, { d: 'CaCO₃',  v: 'CaCO₃'}, { d: 'CH₄',   v: 'CH₄' },
      { d: 'C₂H₅OH', v: 'C₂H₅OH'}, { d: 'C₆H₁₂O₆', v: 'C₆H₁₂O₆' },
    ],
  },
  {
    id: 'physics',
    label: 'Physics',
    emoji: '⚡',
    keys: [
      { d: 'F⃗',    v: 'F⃗'   }, { d: 'v⃗',    v: 'v⃗'   }, { d: 'a⃗',    v: 'a⃗'   },
      { d: 'B⃗',    v: 'B⃗'   }, { d: 'E⃗',    v: 'E⃗'   }, { d: 'p⃗',    v: 'p⃗'   },
      { d: 'Ω',     v: 'Ω'    }, { d: 'μ₀',   v: 'μ₀'  }, { d: 'ε₀',   v: 'ε₀'  },
      { d: 'ℏ',     v: 'ℏ'    }, { d: 'ħ',    v: 'ħ'   }, { d: 'kB',   v: 'kB'  },
      { d: 'Nₐ',   v: 'Nₐ'   }, { d: 'c',    v: 'c'   }, { d: 'g',    v: 'g'   },
      { d: '×10³',  v: '×10³' }, { d: '×10⁶', v: '×10⁶'}, { d: '×10⁹', v: '×10⁹'},
      { d: '×10⁻³', v: '×10⁻³'}, { d: '×10⁻⁶',v: '×10⁻⁶'}, { d: '×10⁻⁹',v: '×10⁻⁹'},
      { d: 'N',     v: 'N'    }, { d: 'J',    v: 'J'   }, { d: 'W',    v: 'W'   },
      { d: 'Pa',    v: 'Pa'   }, { d: 'T',    v: 'T'   }, { d: 'Hz',   v: 'Hz'  },
      { d: 'eV',    v: 'eV'   }, { d: 'N/C',  v: 'N/C' }, { d: 'V/m',  v: 'V/m' },
      { d: 'Wb',    v: 'Wb'   }, { d: 'H',    v: 'H'   }, { d: 'F',    v: 'F'   },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Main MathKeyboard component
// Props:
//   onInsert(text)  — called with the text to insert
//   activeField     — 'description' | 'correction' | null
// ─────────────────────────────────────────────────────────────────
export default function MathKeyboard({ onInsert, activeField }) {
  const [open,      setOpen]      = useState(false);
  const [activeCat, setActiveCat] = useState('fraction');

  const currentCat = CATEGORIES.find(c => c.id === activeCat) || CATEGORIES[0];

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-navy-800/60">

      {/* ── Toggle bar ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calculator size={14} className="text-violet-400" />
          <span className="text-xs font-medium text-white/60">Math Keyboard</span>
          {activeField && open && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
              ✎ {activeField === 'description' ? 'ভুলের বিবরণ' : 'সঠিক উত্তর'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!open && (
            <span className="text-[11px] text-white/20 font-mono hidden sm:block tracking-wider">
              ∫ √ α Σ →
            </span>
          )}
          {open
            ? <ChevronUp   size={13} className="text-white/35" />
            : <ChevronDown size={13} className="text-white/35" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.06]">

          {/* ── Category tabs ── */}
          <div
            className="flex gap-0.5 overflow-x-auto px-2 pt-2 pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCat(cat.id)}
                className={`
                  shrink-0 px-2.5 py-1.5 rounded-lg font-medium
                  transition-all whitespace-nowrap
                  ${cat.isFractionBuilder ? 'text-[12px]' : 'text-[11px]'}
                  ${activeCat === cat.id
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-white/35 hover:text-white/65 border border-transparent'
                  }
                `}
              >
                {/* Fraction tab: render a mini stacked visual */}
                {cat.isFractionBuilder ? (
                  <span className="inline-flex flex-col items-center leading-none gap-[1px] relative top-[1px]">
                    <span className="text-[9px] leading-none">a</span>
                    <span className="block w-3 border-t border-current" />
                    <span className="text-[9px] leading-none">b</span>
                  </span>
                ) : (
                  <>{cat.emoji} {cat.label}</>
                )}
                {cat.isFractionBuilder && (
                  <span className="ml-1 text-[11px]">Fraction</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Content area ── */}
          {currentCat.isFractionBuilder ? (
            <FractionBuilder onInsert={onInsert} />
          ) : (
            <div className="p-2 pt-1.5">
              <div className="flex flex-wrap gap-1">
                {currentCat.keys.map((k, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); onInsert(k.v); }}
                    className="
                      min-w-[42px] px-2 py-2 rounded-lg
                      bg-white/[0.04] border border-white/[0.07]
                      text-white/70 text-xs font-mono
                      hover:bg-violet-500/20 hover:border-violet-500/30 hover:text-violet-200
                      active:scale-95 active:bg-violet-500/30
                      transition-all duration-75
                      select-none leading-none
                    "
                  >
                    {k.d}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-white/20 mt-2 px-0.5">
                {!activeField
                  ? '💡 নিচের textarea তে click করো — তারপর এখান থেকে symbol insert হবে'
                  : `✏️ Cursor এর জায়গায় insert হবে`
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}