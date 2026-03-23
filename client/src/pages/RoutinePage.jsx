import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Target, BookOpen, ChevronDown, ChevronRight,
         CheckCircle2, Circle, Plus, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { targetsAPI } from '../lib/api';
import { getBSTDayName } from '../lib/schedule';
import { useUIStore } from '../store';
import { LoadingCard } from '../components/ui/Shared';

// ── Weekly Schedule (fixed) ────────────────────────────────────────────────────
const WEEKLY = [
  { day: 'রবিবার',     eng: 'Sunday',    sessions: [
    { slot: 'S1', time: '৫:০০–৭:০০ PM',   subjects: ['Botany'],              color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20'   },
    { slot: 'S2', time: '৭:৩০–১০:০০ PM',  subjects: ['Physics'],             color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
    { slot: 'S3', time: '১১:০০–১:০০ AM',  subjects: ['Math','Physics'],      color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  ]},
  { day: 'সোমবার',     eng: 'Monday',    sessions: [
    { slot: 'S1', time: '৫:০০–৭:০০ PM',   subjects: ['Physics'],             color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
    { slot: 'S2', time: '৭:৩০–১০:০০ PM',  subjects: ['Math'],                color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
    { slot: 'S3', time: '১১:০০–১:০০ AM',  subjects: ['Chemistry','Math'],    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ]},
  { day: 'মঙ্গলবার',  eng: 'Tuesday',   sessions: [
    { slot: 'S1', time: '৫:০০–৭:০০ PM',   subjects: ['Chemistry'],           color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { slot: 'S2', time: '৭:৩০–১০:০০ PM',  subjects: ['Zoology'],             color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
    { slot: 'S3', time: '১১:০০–১:০০ AM',  subjects: ['Physics','Chemistry'], color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
  ]},
  { day: 'বুধবার',     eng: 'Wednesday', sessions: [
    { slot: 'S1', time: '৫:০০–৭:০০ PM',   subjects: ['Botany'],              color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20'   },
    { slot: 'S2', time: '৭:৩০–১০:০০ PM',  subjects: ['Math'],                color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
    { slot: 'S3', time: '১১:০০–১:০০ AM',  subjects: ['Math','Chemistry'],    color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20'  },
  ]},
  { day: 'বৃহস্পতিবার', eng: 'Thursday', sessions: [
    { slot: 'S1', time: '৫:০০–৭:০০ PM',   subjects: ['Chemistry'],           color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { slot: 'S2', time: '৭:৩০–১০:০০ PM',  subjects: ['Physics'],             color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
    { slot: 'S3', time: '১১:০০–১:০০ AM',  subjects: ['Physics','Chemistry'], color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20'     },
  ]},
  { day: 'শুক্রবার',   eng: 'Friday',    practice: 'QB solving + Non-academic reading' },
  { day: 'শনিবার',    eng: 'Saturday',  practice: 'Admission QB solving' },
];

// ── Monthly plan (full schedule from conversation) ────────────────────────────
const MONTHLY_PLAN = {
  '2026-04': [
    { subject: 'Physics',    chapterNumber: 4,  chapterName: 'Newtonian Mechanics',                  difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 3,  chapterName: 'Periodic Properties and Chemical Bonding', difficulty: 'medium' },
    { subject: 'Chemistry',  chapterNumber: 4,  chapterName: 'Chemical Changes',                     difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 2,  chapterName: 'Vector (1st Paper)',                   difficulty: 'medium' },
    { subject: 'HigherMath', chapterNumber: 3,  chapterName: 'Straight Line',                        difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 1,  chapterName: 'Cell and Its Structure',               difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 2,  chapterName: 'Cell Division',                        difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 3,  chapterName: 'Cell Chemistry',                       difficulty: 'medium' },
    { subject: 'ICT',        chapterNumber: 4,  chapterName: 'Web Design & HTML',                    difficulty: 'easy'   },
    { subject: 'ICT',        chapterNumber: 5,  chapterName: 'Programming Language',                 difficulty: 'medium' },
  ],
  '2026-05': [
    { subject: 'Physics',    chapterNumber: 5,  chapterName: 'Work, Energy and Power',               difficulty: 'medium' },
    { subject: 'Physics',    chapterNumber: 6,  chapterName: 'Gravitation and Gravity',              difficulty: 'medium' },
    { subject: 'Chemistry',  chapterNumber: 4,  chapterName: 'Chemical Changes',                     difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 5,  chapterName: 'Economic/Applied Chemistry (1st)',     difficulty: 'easy'   },
    { subject: 'HigherMath', chapterNumber: 4,  chapterName: 'Circle',                               difficulty: 'medium' },
    { subject: 'HigherMath', chapterNumber: 5,  chapterName: 'Permutation and Combination (1st)',    difficulty: 'hard'   },
    { subject: 'Botany',     chapterNumber: 4,  chapterName: 'Microorganisms',                       difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 5,  chapterName: 'Algae and Fungi',                      difficulty: 'medium' },
  ],
  '2026-06': [
    { subject: 'Physics',    chapterNumber: 7,  chapterName: 'Structural Properties of Matter',      difficulty: 'medium' },
    { subject: 'Physics',    chapterNumber: 8,  chapterName: 'Periodic Motion',                      difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 6,  chapterName: 'Environmental Chemistry',              difficulty: 'medium' },
    { subject: 'Chemistry',  chapterNumber: 7,  chapterName: 'Organic Chemistry',                    difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 5,  chapterName: 'Permutation and Combination (1st)',    difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 6,  chapterName: 'Trigonometric Ratios',                 difficulty: 'medium' },
    { subject: 'HigherMath', chapterNumber: 8,  chapterName: 'Functions and Graphs',                 difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 6,  chapterName: 'Bryophytes and Pteridophytes',         difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 7,  chapterName: 'Naked and Covered Seeded Plants',      difficulty: 'medium' },
  ],
  '2026-07': [
    { subject: 'Physics',    chapterNumber: 9,  chapterName: 'Waves',                                difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 7,  chapterName: 'Organic Chemistry',                    difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 9,  chapterName: 'Differentiation',                      difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 10, chapterName: 'Integration',                          difficulty: 'hard'   },
    { subject: 'Botany',     chapterNumber: 8,  chapterName: 'Tissue and Tissue System',             difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 9,  chapterName: 'Plant Physiology',                     difficulty: 'medium' },
  ],
  '2026-08': [
    { subject: 'Physics',    chapterNumber: 10, chapterName: 'Ideal Gas and Gas Laws',               difficulty: 'medium' },
    { subject: 'Physics',    chapterNumber: 11, chapterName: 'Thermal Dynamics',                     difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 7,  chapterName: 'Organic Chemistry',                    difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 8,  chapterName: 'Quantitative Chemistry',               difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 10, chapterName: 'Integration',                          difficulty: 'hard'   },
    { subject: 'Botany',     chapterNumber: 10, chapterName: 'Plant Reproduction',                   difficulty: 'medium' },
    { subject: 'Botany',     chapterNumber: 11, chapterName: 'Biotechnology',                        difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 1,  chapterName: 'Animal Diversity and Classification',  difficulty: 'medium' },
  ],
  '2026-09': [
    { subject: 'Physics',    chapterNumber: 12, chapterName: 'Static Electricity',                   difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 8,  chapterName: 'Quantitative Chemistry',               difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 9,  chapterName: 'Electrochemistry',                     difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 11, chapterName: 'Real Numbers & Inequalities',          difficulty: 'medium' },
    { subject: 'HigherMath', chapterNumber: 12, chapterName: 'Vector (2nd Paper)',                   difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 2,  chapterName: 'Animal Introduction',                  difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 3,  chapterName: 'Digestion and Absorption',             difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 4,  chapterName: 'Blood and Circulation',                difficulty: 'medium' },
  ],
  '2026-10': [
    { subject: 'Physics',    chapterNumber: 13, chapterName: 'Current Electricity',                  difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 9,  chapterName: 'Electrochemistry',                     difficulty: 'hard'   },
    { subject: 'Chemistry',  chapterNumber: 10, chapterName: 'Economic/Industrial Chemistry (2nd)',  difficulty: 'easy'   },
    { subject: 'HigherMath', chapterNumber: 13, chapterName: 'Complex Number',                       difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 14, chapterName: 'Polynomials',                          difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 5,  chapterName: 'Breathing and Respiration',            difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 6,  chapterName: 'Waste and Elimination',                difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 7,  chapterName: 'Movement and Locomotion',              difficulty: 'medium' },
  ],
  '2026-11': [
    { subject: 'Physics',    chapterNumber: 14, chapterName: 'Magnetic Effects of Current & Magnetism', difficulty: 'hard' },
    { subject: 'Physics',    chapterNumber: 15, chapterName: 'Electromagnetic Induction & Alternating Current', difficulty: 'hard' },
    { subject: 'HigherMath', chapterNumber: 15, chapterName: 'Permutation & Combination (2nd)',      difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 16, chapterName: 'Conics',                               difficulty: 'hard'   },
    { subject: 'Zoology',    chapterNumber: 8,  chapterName: 'Coordination and Control',             difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 9,  chapterName: 'Continuity of Human Life',             difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 10, chapterName: 'Defense of Human Body',                difficulty: 'medium' },
    { subject: 'Zoology',    chapterNumber: 11, chapterName: 'Genetics and Evolution',               difficulty: 'hard'   },
  ],
  '2026-12': [
    { subject: 'Physics',    chapterNumber: 15, chapterName: 'Electromagnetic Induction & Alternating Current', difficulty: 'hard' },
    { subject: 'Physics',    chapterNumber: 16, chapterName: 'Geometrical Optics',                   difficulty: 'hard'   },
    { subject: 'Physics',    chapterNumber: 17, chapterName: 'Physical Optics',                      difficulty: 'medium' },
    { subject: 'Physics',    chapterNumber: 18, chapterName: 'Modern Physics',                       difficulty: 'medium' },
    { subject: 'HigherMath', chapterNumber: 16, chapterName: 'Conics',                               difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 17, chapterName: 'Inverse Trigonometric Functions',      difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 18, chapterName: 'Statics',                              difficulty: 'hard'   },
  ],
  '2027-01': [
    { subject: 'Physics',    chapterNumber: 19, chapterName: 'Atomic Model & Nuclear Physics',       difficulty: 'medium' },
    { subject: 'Physics',    chapterNumber: 20, chapterName: 'Semiconductor & Electronics',          difficulty: 'medium' },
    { subject: 'Physics',    chapterNumber: 21, chapterName: 'Astronomy & Space',                    difficulty: 'easy'   },
    { subject: 'HigherMath', chapterNumber: 18, chapterName: 'Statics',                              difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 19, chapterName: 'Dynamics (2nd Paper)',                 difficulty: 'hard'   },
    { subject: 'HigherMath', chapterNumber: 20, chapterName: 'Probability',                          difficulty: 'medium' },
  ],
};

const SUBJECT_META = {
  Physics:    { label: 'Physics',    emoji: '⚡', color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     buet: true  },
  Chemistry:  { label: 'Chemistry',  emoji: '🧪', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', buet: true  },
  HigherMath: { label: 'Math',       emoji: '📐', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  buet: true  },
  Botany:     { label: 'Botany',     emoji: '🌿', color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20',   buet: false },
  Zoology:    { label: 'Zoology',    emoji: '🦋', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   buet: false },
  ICT:        { label: 'ICT',        emoji: '💻', color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    buet: false },
};

const DIFF_CONFIG = {
  easy:   { label: 'সহজ',   color: 'text-neon-green', bg: 'bg-neon-green/10',  border: 'border-neon-green/20'  },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
  hard:   { label: 'কঠিন',  color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/20'    },
};

const MONTH_NAMES = {
  '2026-04': 'এপ্রিল ২০২৬', '2026-05': 'মে ২০২৬ ⚠️', '2026-06': 'জুন ২০২৬',
  '2026-07': 'জুলাই ২০২৬',  '2026-08': 'আগস্ট ২০২৬', '2026-09': 'সেপ্টেম্বর ২০২৬',
  '2026-10': 'অক্টোবর ২০২৬','2026-11': 'নভেম্বর ২০২৬','2026-12': 'ডিসেম্বর ২০২৬ 🎯',
  '2027-01': 'জানুয়ারি ২০২৭','2027-02': 'ফেব্রুয়ারি ২০২৭','2027-03': 'মার্চ ২০২৭ 🎓',
};

function getCurrentMonth() {
  const d = new Date(Date.now() + 6 * 3600000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const TABS = [
  { key: 'monthly', label: '🎯 মাসিক Target' },
  { key: 'weekly',  label: '📅 সাপ্তাহিক Routine' },
  { key: 'plan',    label: '🗺️ Full Plan' },
];

export default function RoutinePage() {
  const [activeTab, setActiveTab] = useState('monthly');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Routine & Target Tracker</h2>
        <p className="text-xs text-white/40 mt-1">মাসিক chapter target track করো, routine দেখো, full plan দেখো</p>
      </div>
      <div className="flex gap-1 bg-navy-700/40 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key ? 'bg-neon-green/15 text-neon-green' : 'text-white/40 hover:text-white'
            }`}>{t.label}</button>
        ))}
      </div>
      {activeTab === 'monthly' && <MonthlyTargetTab />}
      {activeTab === 'weekly'  && <WeeklyRoutineTab />}
      {activeTab === 'plan'    && <FullPlanTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 1 — Monthly Target Tracker
// ══════════════════════════════════════════════════════════════════
function MonthlyTargetTab() {
  const toast = useUIStore(s => s.toast);
  const qc    = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['targets', selectedMonth],
    queryFn:  () => targetsAPI.getByMonth(selectedMonth).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, completed }) => targetsAPI.update(id, { completed }),
    onSuccess:  () => qc.invalidateQueries(['targets', selectedMonth]),
    onError:    () => toast('Update হয়নি', 'error'),
  });

  const seedMutation = useMutation({
    mutationFn: ({ month, targets }) => targetsAPI.seedMonth(month, targets),
    onSuccess:  () => {
      qc.invalidateQueries(['targets', selectedMonth]);
      toast('এই মাসের target load হয়েছে! ✅', 'success');
    },
    onError: () => toast('Load হয়নি', 'error'),
  });

  const targets   = data?.targets || [];
  const summary   = data?.summary || [];
  const hasData   = targets.length > 0;
  const planData  = MONTHLY_PLAN[selectedMonth];

  const totalChapters   = targets.length;
  const completedCount  = targets.filter(t => t.completed).length;
  const completionPct   = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  // Track status
  const now         = new Date(Date.now() + 6 * 3600000);
  const dayOfMonth  = now.getUTCDate();
  const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
  const timeElapsed = Math.round((dayOfMonth / daysInMonth) * 100);
  const onTrack     = completionPct >= timeElapsed - 10;

  return (
    <div className="space-y-4">

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(MONTH_NAMES).map(([key, label]) => (
          <button key={key} onClick={() => setSelectedMonth(key)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              selectedMonth === key
                ? 'bg-neon-green/15 border-neon-green/30 text-neon-green'
                : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* Load plan button if no data */}
      {!hasData && planData && (
        <div className="card p-5 text-center border-dashed border-white/20">
          <Target size={28} className="text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/50 mb-1">{MONTH_NAMES[selectedMonth]} এর target এখনো load হয়নি</p>
          <p className="text-xs text-white/30 mb-4">{planData.length}টা chapter এই মাসে target করা আছে</p>
          <button
            onClick={() => seedMutation.mutate({ month: selectedMonth, targets: planData })}
            disabled={seedMutation.isPending}
            className="btn-primary mx-auto"
          >
            {seedMutation.isPending ? 'Loading...' : '📥 এই মাসের Target Load করো'}
          </button>
        </div>
      )}

      {!hasData && !planData && (
        <div className="card p-6 text-center">
          <p className="text-sm text-white/30">এই মাসের কোনো plan নেই</p>
        </div>
      )}

      {isLoading && <LoadingCard rows={4} />}

      {hasData && (
        <>
          {/* Progress bar */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">{MONTH_NAMES[selectedMonth]}</p>
                <p className="text-xs text-white/40 mt-0.5">{completedCount}/{totalChapters} chapters সম্পন্ন</p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${completionPct >= 80 ? 'text-neon-green' : completionPct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {completionPct}%
                </p>
                <p className={`text-[11px] mt-0.5 ${onTrack ? 'text-neon-green' : 'text-red-400'}`}>
                  {onTrack ? '✓ target এ আছো' : '⚠️ পিছিয়ে আছো'}
                </p>
              </div>
            </div>
            <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  completionPct >= 80 ? 'bg-neon-green' : completionPct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {/* Time elapsed marker */}
            <div className="relative mt-1">
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-white/20 rounded-full" style={{ width: `${timeElapsed}%` }} />
              </div>
              <p className="text-[10px] text-white/20 mt-1">মাসের {timeElapsed}% সময় গেছে</p>
            </div>
          </div>

          {/* Subject-wise breakdown */}
          {summary.map(({ subject, total, completed, chapters }) => {
            const meta = SUBJECT_META[subject] || {};
            const pct  = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={subject} className="card overflow-hidden">
                {/* Subject header */}
                <div className={`flex items-center gap-3 p-4 ${meta.bg} border-b ${meta.border}`}>
                  <span className="text-lg">{meta.emoji}</span>
                  <div className="flex-1">
                    <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
                    {meta.buet && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">BUET</span>}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${pct === 100 ? 'text-neon-green' : pct >= 50 ? 'text-yellow-400' : 'text-white/60'}`}>
                      {completed}/{total}
                    </span>
                    <span className="text-xs text-white/30 ml-1">({pct}%)</span>
                  </div>
                </div>

                {/* Chapters */}
                {chapters.map(ch => {
                  const diff = DIFF_CONFIG[ch.difficulty] || DIFF_CONFIG.medium;
                  return (
                    <div key={ch.id}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 transition-all ${
                        ch.completed ? 'opacity-60' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => updateMutation.mutate({ id: ch.id, completed: !ch.completed })}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          ch.completed
                            ? 'bg-neon-green/20 border-neon-green text-neon-green'
                            : 'border-white/20 hover:border-neon-green/50'
                        }`}
                      >
                        {ch.completed && <CheckCircle2 size={13} />}
                      </button>

                      <span className="text-xs font-mono text-white/20 w-5 shrink-0">{ch.chapterNumber}</span>

                      <span className={`flex-1 text-sm truncate ${ch.completed ? 'line-through text-white/30' : 'text-white/70'}`}>
                        {ch.chapterName}
                      </span>

                      {/* Difficulty badge */}
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${diff.bg} ${diff.color} ${diff.border}`}>
                        {diff.label}
                      </span>

                      {/* Completed date */}
                      {ch.completed && ch.completedAt && (
                        <span className="text-[10px] text-white/20 shrink-0">
                          {new Date(ch.completedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2 — Weekly Routine
// ══════════════════════════════════════════════════════════════════
function WeeklyRoutineTab() {
  const today = getBSTDayName();

  return (
    <div className="space-y-3">
      <div className="card p-4 border-white/[0.06]">
        <p className="text-xs text-white/40 mb-3">Session times</p>
        <div className="space-y-2">
          {[
            { slot: 'S1', time: '৫:০০ PM – ৭:০০ PM',  dur: '২ ঘণ্টা' },
            { slot: 'S2', time: '৭:৩০ PM – ১০:০০ PM', dur: '২.৫ ঘণ্টা' },
            { slot: 'S3', time: '১১:০০ PM – ১:০০ AM', dur: '২ ঘণ্টা' },
          ].map(s => (
            <div key={s.slot} className="flex items-center gap-3 text-sm">
              <span className="font-mono font-bold text-white/50 w-8">{s.slot}</span>
              <span className="text-white/70">{s.time}</span>
              <span className="text-white/30 text-xs ml-auto">{s.dur}</span>
            </div>
          ))}
        </div>
      </div>

      {WEEKLY.map(({ day, eng, sessions, practice }) => {
        const isToday = eng === today;
        return (
          <div key={day} className={`card overflow-hidden ${isToday ? 'border-neon-blue/30 shadow-active' : ''}`}>
            <div className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] ${isToday ? 'bg-neon-blue/5' : ''}`}>
              <span className={`text-sm font-bold ${isToday ? 'text-neon-blue' : 'text-white/70'}`}>{day}</span>
              {isToday && <span className="text-[10px] bg-neon-blue/15 text-neon-blue border border-neon-blue/20 rounded-full px-2 py-0.5">আজ</span>}
              {practice && <span className="ml-auto text-xs text-neon-purple/70">Practice Day</span>}
            </div>

            {practice ? (
              <div className="px-4 py-3">
                <p className="text-sm text-white/50">{practice}</p>
                <p className="text-xs text-neon-purple/50 mt-1">QB solving + Timer দিয়ে extra পড়া</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {sessions.map(s => (
                  <div key={s.slot} className="flex items-center gap-3 px-4 py-3">
                    <span className={`text-xs font-mono font-bold w-8 ${s.color}`}>{s.slot}</span>
                    <span className="text-xs text-white/30 w-32 shrink-0">{s.time}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {s.subjects.map(sub => (
                        <span key={sub} className={`text-xs px-2 py-0.5 rounded-md border ${s.bg} ${s.color} ${s.border}`}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3 — Full Plan Overview
// ══════════════════════════════════════════════════════════════════
function FullPlanTab() {
  const [expanded, setExpanded] = useState({ [getCurrentMonth()]: true });

  return (
    <div className="space-y-3">
      {/* Warning box */}
      <div className="card p-4 border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-red-300 font-semibold">Critical warnings</p>
            <p className="text-xs text-white/50">⚠️ Chemistry Organic (Ch7) একাই জুন-আগস্ট ৩ মাস নেবে</p>
            <p className="text-xs text-white/50">⚠️ Math Integration (Ch10) সবচেয়ে কঠিন — জুলাই-আগস্ট</p>
            <p className="text-xs text-white/50">⚠️ Physics 2nd paper (Ch11-18) = BUET এর core — slip করা যাবে না</p>
          </div>
        </div>
      </div>

      {Object.entries(MONTHLY_PLAN).map(([month, chapters]) => {
        const isOpen    = expanded[month];
        const isCurrent = month === getCurrentMonth();
        const buetChs   = chapters.filter(c => ['Physics','Chemistry','HigherMath'].includes(c.subject));
        const otherChs  = chapters.filter(c => !['Physics','Chemistry','HigherMath'].includes(c.subject));

        return (
          <div key={month} className={`card overflow-hidden ${isCurrent ? 'border-neon-green/30' : ''}`}>
            <button
              onClick={() => setExpanded(e => ({ ...e, [month]: !e[month] }))}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 text-left">
                <span className={`text-sm font-bold ${isCurrent ? 'text-neon-green' : 'text-white/70'}`}>
                  {MONTH_NAMES[month]}
                  {isCurrent && <span className="ml-2 text-[10px] bg-neon-green/15 text-neon-green border border-neon-green/20 rounded-full px-2 py-0.5">এখন</span>}
                </span>
                <p className="text-xs text-white/30 mt-0.5">
                  {buetChs.length}টা PCM + {otherChs.length}টা অন্যান্য = মোট {chapters.length}টা chapter
                </p>
              </div>
              {isOpen ? <ChevronDown size={15} className="text-white/30" /> : <ChevronRight size={15} className="text-white/30" />}
            </button>

            {isOpen && (
              <div className="border-t border-white/[0.06] p-4 space-y-3">
                {/* PCM first */}
                {['Physics','Chemistry','HigherMath'].map(subject => {
                  const chs  = chapters.filter(c => c.subject === subject);
                  const meta = SUBJECT_META[subject];
                  if (!chs.length) return null;
                  return (
                    <div key={subject}>
                      <p className={`text-xs font-semibold mb-2 ${meta.color}`}>{meta.emoji} {meta.label}</p>
                      <div className="space-y-1.5">
                        {chs.map(ch => {
                          const diff = DIFF_CONFIG[ch.difficulty];
                          return (
                            <div key={ch.chapterNumber} className="flex items-center gap-2 pl-4">
                              <span className="text-xs font-mono text-white/20 w-4">{ch.chapterNumber}</span>
                              <span className="text-xs text-white/65 flex-1 truncate">{ch.chapterName}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${diff.bg} ${diff.color} ${diff.border} shrink-0`}>
                                {diff.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Others */}
                {otherChs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-white/40">HSC (Timer)</p>
                    <div className="space-y-1.5">
                      {otherChs.map(ch => {
                        const meta = SUBJECT_META[ch.subject] || {};
                        const diff = DIFF_CONFIG[ch.difficulty];
                        return (
                          <div key={`${ch.subject}-${ch.chapterNumber}`} className="flex items-center gap-2 pl-4">
                            <span className="text-xs">{meta.emoji}</span>
                            <span className={`text-xs font-medium w-16 shrink-0 ${meta.color}`}>{meta.label}</span>
                            <span className="text-xs text-white/50 flex-1 truncate">{ch.chapterName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${diff.bg} ${diff.color} ${diff.border} shrink-0`}>
                              {diff.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}