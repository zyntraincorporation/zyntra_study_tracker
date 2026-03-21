// ─────────────────────────────────────────────────────────────────────────────
// Zyntra DB Seed — Run with: npm run db:seed
// Populates chapter_progress with Saiful's curriculum
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const prisma = require('./client');

const CHAPTERS = [
  // ── Physics (22 chapters) ──────────────────────────────────────────────────
  { subject: 'Physics', chapterNumber: 1,  chapterName: 'Physical World', status: 'completed' },
  { subject: 'Physics', chapterNumber: 2,  chapterName: 'Units and Measurement', status: 'completed' },
  { subject: 'Physics', chapterNumber: 3,  chapterName: 'Motion in a Straight Line', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 4,  chapterName: 'Motion in a Plane', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 5,  chapterName: 'Laws of Motion', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 6,  chapterName: 'Work, Energy and Power', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 7,  chapterName: 'System of Particles and Rotational Motion', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 8,  chapterName: 'Gravitation', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 9,  chapterName: 'Mechanical Properties of Solids', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 10, chapterName: 'Mechanical Properties of Fluids', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 11, chapterName: 'Thermal Properties of Matter', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 12, chapterName: 'Thermodynamics', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 13, chapterName: 'Kinetic Theory', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 14, chapterName: 'Oscillations', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 15, chapterName: 'Waves', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 16, chapterName: 'Electric Charges and Fields', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 17, chapterName: 'Electrostatic Potential and Capacitance', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 18, chapterName: 'Current Electricity', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 19, chapterName: 'Moving Charges and Magnetism', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 20, chapterName: 'Magnetism and Matter', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 21, chapterName: 'Electromagnetic Induction', status: 'not_started' },
  { subject: 'Physics', chapterNumber: 22, chapterName: 'Alternating Current', status: 'not_started' },

  // ── Chemistry (10 chapters) ───────────────────────────────────────────────
  { subject: 'Chemistry', chapterNumber: 1,  chapterName: 'Some Basic Concepts of Chemistry', status: 'completed' },
  { subject: 'Chemistry', chapterNumber: 2,  chapterName: 'Structure of Atom', status: 'completed' },
  { subject: 'Chemistry', chapterNumber: 3,  chapterName: 'Classification of Elements', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 4,  chapterName: 'Chemical Bonding and Molecular Structure', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 5,  chapterName: 'States of Matter', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 6,  chapterName: 'Thermodynamics', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 7,  chapterName: 'Equilibrium', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 8,  chapterName: 'Redox Reactions', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 9,  chapterName: 'Hydrogen', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 10, chapterName: 'The s-Block Elements', status: 'not_started' },

  // ── Higher Math (20 chapters) ─────────────────────────────────────────────
  { subject: 'HigherMath', chapterNumber: 1,  chapterName: 'Matrix and Determinant', status: 'completed' },
  { subject: 'HigherMath', chapterNumber: 2,  chapterName: 'Vectors', status: 'completed' },
  { subject: 'HigherMath', chapterNumber: 3,  chapterName: 'Geometry', status: 'completed' },
  { subject: 'HigherMath', chapterNumber: 4,  chapterName: 'Algebra', status: 'completed' },
  { subject: 'HigherMath', chapterNumber: 5,  chapterName: 'Trigonometry', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 6,  chapterName: 'Complex Numbers', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 7,  chapterName: 'Functions and Graphs', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 8,  chapterName: 'Limits and Continuity', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 9,  chapterName: 'Differentiation', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 10, chapterName: 'Integration', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 11, chapterName: 'Differential Equations', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 12, chapterName: 'Sequences and Series', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 13, chapterName: 'Permutations and Combinations', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 14, chapterName: 'Binomial Theorem', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 15, chapterName: 'Probability', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 16, chapterName: 'Statistics', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 17, chapterName: 'Conic Sections', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 18, chapterName: '3D Geometry', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 19, chapterName: 'Linear Programming', status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 20, chapterName: 'Mathematical Reasoning', status: 'not_started' },

  // ── Botany (8 chapters) ───────────────────────────────────────────────────
  { subject: 'Botany', chapterNumber: 1, chapterName: 'Living World', status: 'completed' },
  { subject: 'Botany', chapterNumber: 2, chapterName: 'Biological Classification', status: 'not_started' },
  { subject: 'Botany', chapterNumber: 3, chapterName: 'Plant Kingdom', status: 'not_started' },
  { subject: 'Botany', chapterNumber: 4, chapterName: 'Morphology of Flowering Plants', status: 'not_started' },
  { subject: 'Botany', chapterNumber: 5, chapterName: 'Anatomy of Flowering Plants', status: 'not_started' },
  { subject: 'Botany', chapterNumber: 6, chapterName: 'Cell Biology', status: 'not_started' },
  { subject: 'Botany', chapterNumber: 7, chapterName: 'Cell Division', status: 'not_started' },
  { subject: 'Botany', chapterNumber: 8, chapterName: 'Biomolecules', status: 'not_started' },

  // ── Zoology (8 chapters) ──────────────────────────────────────────────────
  { subject: 'Zoology', chapterNumber: 1, chapterName: 'Animal Kingdom', status: 'completed' },
  { subject: 'Zoology', chapterNumber: 2, chapterName: 'Structural Organisation in Animals', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 3, chapterName: 'Digestion and Absorption', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 4, chapterName: 'Breathing and Gas Exchange', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 5, chapterName: 'Body Fluids and Circulation', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 6, chapterName: 'Excretory Products and Elimination', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 7, chapterName: 'Locomotion and Movement', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 8, chapterName: 'Neural Control and Coordination', status: 'not_started' },

  // ── ICT (6 chapters) ──────────────────────────────────────────────────────
  { subject: 'ICT', chapterNumber: 1, chapterName: 'Information and Communication Technology', status: 'completed' },
  { subject: 'ICT', chapterNumber: 2, chapterName: 'Communication Systems and Networks', status: 'completed' },
  { subject: 'ICT', chapterNumber: 3, chapterName: 'Number Systems and Digital Devices', status: 'completed' },
  { subject: 'ICT', chapterNumber: 4, chapterName: 'Web Design and HTML', status: 'not_started' },
  { subject: 'ICT', chapterNumber: 5, chapterName: 'Programming Concepts (C)', status: 'not_started' },
  { subject: 'ICT', chapterNumber: 6, chapterName: 'Database Management', status: 'not_started' },
];

async function seed() {
  console.log('🌱 Seeding Zyntra database...');

  // Upsert chapters — safe to re-run
  let upserted = 0;
  for (const chapter of CHAPTERS) {
    await prisma.chapterProgress.upsert({
      where: { subject_chapterNumber: { subject: chapter.subject, chapterNumber: chapter.chapterNumber } },
      update: {},
      create: chapter,
    });
    upserted++;
  }

  console.log(`✅ Seeded ${upserted} chapters across 6 subjects`);
  console.log('🎉 Database ready for Saiful!');
}

seed()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
