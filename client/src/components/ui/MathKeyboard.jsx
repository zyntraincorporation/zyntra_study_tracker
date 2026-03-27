import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// All symbol categories: Math / Physics / Chemistry
// Each key: d = display label, v = value to insert
// ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
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
      // Superscripts
      { d: 'x²',   v: '²'   }, { d: 'x³',  v: '³'  }, { d: 'x⁴',  v: '⁴'  },
      { d: 'x⁵',   v: '⁵'   }, { d: 'x⁶',  v: '⁶'  }, { d: 'x⁷',  v: '⁷'  },
      { d: 'x⁸',   v: '⁸'   }, { d: 'x⁹',  v: '⁹'  }, { d: 'xⁿ',  v: 'ⁿ'  },
      { d: 'x⁻¹',  v: '⁻¹'  }, { d: 'x⁻ⁿ', v: '⁻ⁿ' }, { d: 'x⁺',  v: '⁺'  },
      // Subscripts
      { d: 'x₀',   v: '₀'   }, { d: 'x₁',  v: '₁'  }, { d: 'x₂',  v: '₂'  },
      { d: 'x₃',   v: '₃'   }, { d: 'x₄',  v: '₄'  }, { d: 'x₅',  v: '₅'  },
      { d: 'x₆',   v: '₆'   }, { d: 'x₇',  v: '₇'  }, { d: 'x₈',  v: '₈'  },
      { d: 'x₉',   v: '₉'   }, { d: 'xₙ',  v: 'ₙ'  }, { d: 'xₐ',  v: 'ₐ'  },
      { d: 'xₑ',   v: 'ₑ'   }, { d: 'xₒ',  v: 'ₒ'  },
      // Roots & power operators
      { d: '√(',   v: '√('  }, { d: '∛(',  v: '∛(' }, { d: '∜(',  v: '∜(' },
      { d: '^',    v: '^'   }, { d: '_',   v: '_'  },
    ],
  },
  {
    id: 'calculus',
    label: 'Calculus',
    emoji: '∫',
    keys: [
      { d: '∫',        v: '∫'        }, { d: '∬',       v: '∬'       }, { d: '∭',      v: '∭'     },
      { d: '∮',        v: '∮'        }, { d: '∂',        v: '∂'       }, { d: '∇',       v: '∇'     },
      { d: 'd/dx',     v: 'd/dx'     }, { d: 'dy/dx',    v: 'dy/dx'   }, { d: 'd²y/dx²', v: 'd²y/dx²' },
      { d: '∂/∂x',     v: '∂/∂x'    }, { d: '∂²/∂x²',   v: '∂²/∂x²' }, { d: 'lim',     v: 'lim'   },
      { d: 'x→0',      v: 'x→0'     }, { d: 'x→∞',      v: 'x→∞'    }, { d: 'n→∞',     v: 'n→∞'   },
      { d: 'h→0',      v: 'h→0'     }, { d: 'Σ',         v: 'Σ'       }, { d: 'Π',        v: 'Π'     },
      { d: 'Δ',        v: 'Δ'       }, { d: '→',         v: '→'       }, { d: ' dx',      v: ' dx'   },
      { d: ' dy',      v: ' dy'     }, { d: ' dt',       v: ' dt'     }, { d: ' dθ',      v: ' dθ'   },
      { d: "f'(x)",    v: "f'(x)"   }, { d: "f''(x)",   v: "f''(x)" },
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
      { d: 'π',     v: 'π'     }, { d: '2π',     v: '2π'    }, { d: 'π/2',   v: 'π/2'  },
      { d: 'π/4',   v: 'π/4'   }, { d: 'e',      v: 'e'     }, { d: 'eˣ',    v: 'eˣ'   },
    ],
  },
  {
    id: 'fractions',
    label: 'Fractions',
    emoji: '½',
    keys: [
      { d: '½',  v: '½' }, { d: '⅓',  v: '⅓' }, { d: '⅔',  v: '⅔' },
      { d: '¼',  v: '¼' }, { d: '¾',  v: '¾' }, { d: '⅕',  v: '⅕' },
      { d: '⅖',  v: '⅖' }, { d: '⅗',  v: '⅗' }, { d: '⅘',  v: '⅘' },
      { d: '⅙',  v: '⅙' }, { d: '⅚',  v: '⅚' }, { d: '⅛',  v: '⅛' },
      { d: '⅜',  v: '⅜' }, { d: '⅝',  v: '⅝' }, { d: '⅞',  v: '⅞' },
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
      { d: '→',        v: '→'       }, { d: '⇌',      v: '⇌'     }, { d: '⇒',      v: '⇒'    },
      { d: '↑',        v: '↑'       }, { d: '↓',       v: '↓'     }, { d: '°C',     v: '°C'   },
      { d: 'ΔH',       v: 'ΔH'      }, { d: 'ΔG',      v: 'ΔG'    }, { d: 'ΔS',     v: 'ΔS'   },
      { d: 'ΔE',       v: 'ΔE'      }, { d: 'Ea',      v: 'Ea'    }, { d: 'Kₑq',    v: 'Kₑq'  },
      { d: 'Ka',       v: 'Ka'      }, { d: 'Kb',      v: 'Kb'    }, { d: 'Ksp',    v: 'Ksp'  },
      { d: 'pH',       v: 'pH'      }, { d: 'pOH',     v: 'pOH'   }, { d: 'pKa',    v: 'pKa'  },
      { d: 'mol',      v: 'mol'     }, { d: 'M',       v: 'M'     }, { d: 'Å',      v: 'Å'    },
      { d: 'H₂O',      v: 'H₂O'    }, { d: 'CO₂',     v: 'CO₂'   }, { d: 'O₂',     v: 'O₂'   },
      { d: 'H₂',       v: 'H₂'     }, { d: 'N₂',      v: 'N₂'    }, { d: 'Cl₂',    v: 'Cl₂'  },
      { d: 'NH₃',      v: 'NH₃'    }, { d: 'H₂SO₄',   v: 'H₂SO₄' }, { d: 'HCl',    v: 'HCl'  },
      { d: 'NaOH',     v: 'NaOH'   }, { d: 'CaCO₃',   v: 'CaCO₃' }, { d: 'CH₄',    v: 'CH₄'  },
      { d: 'C₂H₅OH',  v: 'C₂H₅OH' }, { d: 'C₆H₁₂O₆', v: 'C₆H₁₂O₆' },
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
      { d: 'Nₐ',   v: 'Nₐ'  }, { d: 'c',     v: 'c'   }, { d: 'g',    v: 'g'   },
      { d: '×10³',  v: '×10³' }, { d: '×10⁶',  v: '×10⁶'}, { d: '×10⁹', v: '×10⁹'},
      { d: '×10⁻³', v: '×10⁻³'}, { d: '×10⁻⁶', v: '×10⁻⁶'}, { d: '×10⁻⁹',v: '×10⁻⁹'},
      { d: 'N',     v: 'N'    }, { d: 'J',    v: 'J'   }, { d: 'W',    v: 'W'   },
      { d: 'Pa',    v: 'Pa'   }, { d: 'T',    v: 'T'   }, { d: 'Hz',   v: 'Hz'  },
      { d: 'eV',    v: 'eV'   }, { d: 'N/C',  v: 'N/C' }, { d: 'V/m',  v: 'V/m' },
      { d: 'Wb',    v: 'Wb'   }, { d: 'H',    v: 'H'   }, { d: 'F',    v: 'F'   },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Props:
//   onInsert(text)  — called with the symbol/text to insert
//   activeField     — 'description' | 'correction' | null
// ─────────────────────────────────────────────────────────────────
export default function MathKeyboard({ onInsert, activeField }) {
  const [open,      setOpen]      = useState(false);
  const [activeCat, setActiveCat] = useState('basic');

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
          <div className="flex gap-0.5 overflow-x-auto px-2 pt-2 pb-1 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCat(cat.id)}
                className={`
                  shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                  transition-all whitespace-nowrap
                  ${activeCat === cat.id
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'text-white/35 hover:text-white/65 border border-transparent'
                  }
                `}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* ── Keys ── */}
          <div className="p-2 pt-1.5">
            <div className="flex flex-wrap gap-1">
              {currentCat.keys.map((k, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={e => {
                    // prevent textarea blur before insert
                    e.preventDefault();
                    onInsert(k.v);
                  }}
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
                : `✏️ Cursor এর জায়গায় insert হবে — typing continue করো`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}