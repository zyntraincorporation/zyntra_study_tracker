require('dotenv').config();
const prisma = require('./client');

const CHAPTERS = [

  // ══════════════════════════════════════════
  // PHYSICS — 21 chapters (1st: 10, 2nd: 11)
  // ══════════════════════════════════════════
  { subject: 'Physics', chapterNumber: 1,  chapterName: 'Physical World and Measurement',                    status: 'not_started' },
  { subject: 'Physics', chapterNumber: 2,  chapterName: 'Vector',                                            status: 'not_started' },
  { subject: 'Physics', chapterNumber: 3,  chapterName: 'Dynamics',                                          status: 'not_started' },
  { subject: 'Physics', chapterNumber: 4,  chapterName: 'Newtonian Mechanics',                               status: 'not_started' },
  { subject: 'Physics', chapterNumber: 5,  chapterName: 'Work, Energy and Power',                            status: 'not_started' },
  { subject: 'Physics', chapterNumber: 6,  chapterName: 'Gravitation and Gravity',                           status: 'not_started' },
  { subject: 'Physics', chapterNumber: 7,  chapterName: 'Structural Properties of Matter',                   status: 'not_started' },
  { subject: 'Physics', chapterNumber: 8,  chapterName: 'Periodic Motion',                                   status: 'not_started' },
  { subject: 'Physics', chapterNumber: 9,  chapterName: 'Waves',                                             status: 'not_started' },
  { subject: 'Physics', chapterNumber: 10, chapterName: 'Ideal Gas and Gas Laws',                            status: 'not_started' },
  { subject: 'Physics', chapterNumber: 11, chapterName: 'Thermal Dynamics',                                  status: 'not_started' },
  { subject: 'Physics', chapterNumber: 12, chapterName: 'Static Electricity',                                status: 'not_started' },
  { subject: 'Physics', chapterNumber: 13, chapterName: 'Current Electricity',                               status: 'not_started' },
  { subject: 'Physics', chapterNumber: 14, chapterName: 'Magnetic Effects of Current & Magnetism',           status: 'not_started' },
  { subject: 'Physics', chapterNumber: 15, chapterName: 'Electromagnetic Induction & Alternating Current',   status: 'not_started' },
  { subject: 'Physics', chapterNumber: 16, chapterName: 'Geometrical Optics',                                status: 'not_started' },
  { subject: 'Physics', chapterNumber: 17, chapterName: 'Physical Optics',                                   status: 'not_started' },
  { subject: 'Physics', chapterNumber: 18, chapterName: 'Modern Physics',                                    status: 'not_started' },
  { subject: 'Physics', chapterNumber: 19, chapterName: 'Atomic Model & Nuclear Physics',                    status: 'not_started' },
  { subject: 'Physics', chapterNumber: 20, chapterName: 'Semiconductor & Electronics',                       status: 'not_started' },
  { subject: 'Physics', chapterNumber: 21, chapterName: 'Astronomy & Space',                                 status: 'not_started' },

  // ══════════════════════════════════════════
  // CHEMISTRY — 10 chapters (1st: 5, 2nd: 5)
  // ══════════════════════════════════════════
  { subject: 'Chemistry', chapterNumber: 1,  chapterName: 'Laboratory Safety and Regulations',   status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 2,  chapterName: 'Qualitative Chemistry',               status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 3,  chapterName: 'Periodic Properties and Chemical Bonding', status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 4,  chapterName: 'Chemical Changes',                    status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 5,  chapterName: 'Economic/Applied Chemistry (1st)',    status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 6,  chapterName: 'Environmental Chemistry',             status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 7,  chapterName: 'Organic Chemistry',                   status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 8,  chapterName: 'Quantitative Chemistry',              status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 9,  chapterName: 'Electrochemistry',                    status: 'not_started' },
  { subject: 'Chemistry', chapterNumber: 10, chapterName: 'Economic/Industrial Chemistry (2nd)', status: 'not_started' },

  // ══════════════════════════════════════════
  // HIGHER MATH — 20 chapters (1st: 10, 2nd: 10)
  // ══════════════════════════════════════════
  { subject: 'HigherMath', chapterNumber: 1,  chapterName: 'Matrix and Determinants',                      status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 2,  chapterName: 'Vector (1st Paper)',                            status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 3,  chapterName: 'Straight Line',                                 status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 4,  chapterName: 'Circle',                                        status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 5,  chapterName: 'Permutation and Combination (1st Paper)',       status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 6,  chapterName: 'Trigonometric Ratios',                          status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 7,  chapterName: 'Trigonometric Ratios of Associated Angles',     status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 8,  chapterName: 'Functions and Graphs',                          status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 9,  chapterName: 'Differentiation',                               status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 10, chapterName: 'Integration',                                   status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 11, chapterName: 'Real Numbers & Inequalities',                   status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 12, chapterName: 'Vector (2nd Paper)',                             status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 13, chapterName: 'Complex Number',                                 status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 14, chapterName: 'Polynomials',                                    status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 15, chapterName: 'Permutation & Combination (2nd Paper)',          status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 16, chapterName: 'Conics',                                         status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 17, chapterName: 'Inverse Trigonometric Functions',                status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 18, chapterName: 'Statics',                                        status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 19, chapterName: 'Dynamics (2nd Paper)',                           status: 'not_started' },
  { subject: 'HigherMath', chapterNumber: 20, chapterName: 'Probability',                                    status: 'not_started' },

  // ══════════════════════════════════════════
  // BOTANY — 11 chapters
  // ══════════════════════════════════════════
  { subject: 'Botany', chapterNumber: 1,  chapterName: 'Cell and Its Structure',               status: 'not_started' },
  { subject: 'Botany', chapterNumber: 2,  chapterName: 'Cell Division',                        status: 'not_started' },
  { subject: 'Botany', chapterNumber: 3,  chapterName: 'Cell Chemistry',                       status: 'not_started' },
  { subject: 'Botany', chapterNumber: 4,  chapterName: 'Microorganisms',                       status: 'not_started' },
  { subject: 'Botany', chapterNumber: 5,  chapterName: 'Algae and Fungi',                      status: 'not_started' },
  { subject: 'Botany', chapterNumber: 6,  chapterName: 'Bryophytes and Pteridophytes',         status: 'not_started' },
  { subject: 'Botany', chapterNumber: 7,  chapterName: 'Naked and Covered Seeded Plants',      status: 'not_started' },
  { subject: 'Botany', chapterNumber: 8,  chapterName: 'Tissue and Tissue System',             status: 'not_started' },
  { subject: 'Botany', chapterNumber: 9,  chapterName: 'Plant Physiology',                     status: 'not_started' },
  { subject: 'Botany', chapterNumber: 10, chapterName: 'Plant Reproduction',                   status: 'not_started' },
  { subject: 'Botany', chapterNumber: 11, chapterName: 'Biotechnology',                        status: 'not_started' },

  // ══════════════════════════════════════════
  // ZOOLOGY — 11 chapters
  // ══════════════════════════════════════════
  { subject: 'Zoology', chapterNumber: 1,  chapterName: 'Animal Diversity and Classification', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 2,  chapterName: 'Animal Introduction (Hydra, Grasshopper, Rui Fish)', status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 3,  chapterName: 'Digestion and Absorption',            status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 4,  chapterName: 'Blood and Circulation',               status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 5,  chapterName: 'Breathing and Respiration',           status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 6,  chapterName: 'Waste and Elimination',               status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 7,  chapterName: 'Movement and Locomotion',             status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 8,  chapterName: 'Coordination and Control',            status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 9,  chapterName: 'Continuity of Human Life',            status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 10, chapterName: 'Defense of Human Body',               status: 'not_started' },
  { subject: 'Zoology', chapterNumber: 11, chapterName: 'Genetics and Evolution',              status: 'not_started' },

  // ══════════════════════════════════════════
  // ICT — 6 chapters
  // ══════════════════════════════════════════
  { subject: 'ICT', chapterNumber: 1, chapterName: 'Information & Communication Technology: World & Bangladesh Perspective', status: 'not_started' },
  { subject: 'ICT', chapterNumber: 2, chapterName: 'Communication Systems & Networking',      status: 'not_started' },
  { subject: 'ICT', chapterNumber: 3, chapterName: 'Number Systems & Digital Devices',        status: 'not_started' },
  { subject: 'ICT', chapterNumber: 4, chapterName: 'Web Design & HTML',                       status: 'not_started' },
  { subject: 'ICT', chapterNumber: 5, chapterName: 'Programming Language',                    status: 'not_started' },
  { subject: 'ICT', chapterNumber: 6, chapterName: 'Database Management System',              status: 'not_started' },

  // ══════════════════════════════════════════
  // ENGLISH 1ST PAPER — 12 Reading + 5 Writing
  // ══════════════════════════════════════════
  { subject: 'English1', chapterNumber: 1,  chapterName: 'Reading: Education and Life',       status: 'not_started' },
  { subject: 'English1', chapterNumber: 2,  chapterName: 'Reading: Art and Craft',            status: 'not_started' },
  { subject: 'English1', chapterNumber: 3,  chapterName: 'Reading: Myths and Literature',     status: 'not_started' },
  { subject: 'English1', chapterNumber: 4,  chapterName: 'Reading: History',                  status: 'not_started' },
  { subject: 'English1', chapterNumber: 5,  chapterName: 'Reading: Human Rights',             status: 'not_started' },
  { subject: 'English1', chapterNumber: 6,  chapterName: 'Reading: Dreams',                   status: 'not_started' },
  { subject: 'English1', chapterNumber: 7,  chapterName: 'Reading: Youthful Achievers',       status: 'not_started' },
  { subject: 'English1', chapterNumber: 8,  chapterName: 'Reading: Relationships',            status: 'not_started' },
  { subject: 'English1', chapterNumber: 9,  chapterName: 'Reading: Adolescence',              status: 'not_started' },
  { subject: 'English1', chapterNumber: 10, chapterName: 'Reading: Lifestyle',                status: 'not_started' },
  { subject: 'English1', chapterNumber: 11, chapterName: 'Reading: Peace and Conflict',       status: 'not_started' },
  { subject: 'English1', chapterNumber: 12, chapterName: 'Reading: Environment and Nature',   status: 'not_started' },
  { subject: 'English1', chapterNumber: 13, chapterName: 'Writing: Paragraph',                status: 'not_started' },
  { subject: 'English1', chapterNumber: 14, chapterName: 'Writing: Completing Story',         status: 'not_started' },
  { subject: 'English1', chapterNumber: 15, chapterName: 'Writing: Informal Letter/Email',    status: 'not_started' },
  { subject: 'English1', chapterNumber: 16, chapterName: 'Writing: Graph and Charts',         status: 'not_started' },
  { subject: 'English1', chapterNumber: 17, chapterName: 'Writing: Rearrange',                status: 'not_started' },

  // ══════════════════════════════════════════
  // ENGLISH 2ND PAPER — 12 Grammar + 4 Writing
  // ══════════════════════════════════════════
  { subject: 'English2', chapterNumber: 1,  chapterName: 'Grammar: Gap filling (Articles)',        status: 'not_started' },
  { subject: 'English2', chapterNumber: 2,  chapterName: 'Grammar: Gap filling (Preposition)',     status: 'not_started' },
  { subject: 'English2', chapterNumber: 3,  chapterName: 'Grammar: Gap filling with clues',        status: 'not_started' },
  { subject: 'English2', chapterNumber: 4,  chapterName: 'Grammar: Completing sentences',          status: 'not_started' },
  { subject: 'English2', chapterNumber: 5,  chapterName: 'Grammar: Right form of verbs',           status: 'not_started' },
  { subject: 'English2', chapterNumber: 6,  chapterName: 'Grammar: Changing sentences',            status: 'not_started' },
  { subject: 'English2', chapterNumber: 7,  chapterName: 'Grammar: Narrative style',               status: 'not_started' },
  { subject: 'English2', chapterNumber: 8,  chapterName: 'Grammar: Pronoun reference',             status: 'not_started' },
  { subject: 'English2', chapterNumber: 9,  chapterName: 'Grammar: Use of modifiers',              status: 'not_started' },
  { subject: 'English2', chapterNumber: 10, chapterName: 'Grammar: Sentence connectors',           status: 'not_started' },
  { subject: 'English2', chapterNumber: 11, chapterName: 'Grammar: Synonym and antonym',           status: 'not_started' },
  { subject: 'English2', chapterNumber: 12, chapterName: 'Grammar: Punctuation',                   status: 'not_started' },
  { subject: 'English2', chapterNumber: 13, chapterName: 'Writing: Formal Letter/Email',           status: 'not_started' },
  { subject: 'English2', chapterNumber: 14, chapterName: 'Writing: Report Writing',                status: 'not_started' },
  { subject: 'English2', chapterNumber: 15, chapterName: 'Writing: Paragraphs',                    status: 'not_started' },
  { subject: 'English2', chapterNumber: 16, chapterName: 'Writing: Composition (200-250 words)',   status: 'not_started' },

  // ══════════════════════════════════════════
  // BANGLA 1ST PAPER
  // ══════════════════════════════════════════
  { subject: 'Bangla1', chapterNumber: 1,  chapterName: 'গদ্য: অপরিচিতা',                         status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 2,  chapterName: 'গদ্য: বিলাসী',                            status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 3,  chapterName: 'গদ্য: মাসি-পিসি',                         status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 4,  chapterName: 'গদ্য: গন্তব্য কাবুল',                     status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 5,  chapterName: 'গদ্য: রেইনকোট',                           status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 6,  chapterName: 'গদ্য: বাংলার নব্য লেখকদিগের প্রতি নিবেদন', status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 7,  chapterName: 'গদ্য: নেকলেস',                            status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 8,  chapterName: 'গদ্য: যৌবনের গান',                        status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 9,  chapterName: 'গদ্য: সাহিত্যের খেলা',                   status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 10, chapterName: 'গদ্য: অর্ধাঙ্গী',                         status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 11, chapterName: 'গদ্য: জীবন ও বৃক্ষ',                     status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 12, chapterName: 'গদ্য: কপিলদাস মুর্মুর শেষ কাজ',           status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 13, chapterName: 'পদ্য: প্রতিদান',                          status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 14, chapterName: 'পদ্য: তাহারেই পড়ে মনে',                  status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 15, chapterName: 'পদ্য: সোনার তরী',                         status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 16, chapterName: 'পদ্য: বিভীষণের প্রতি মেঘনাদ',             status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 17, chapterName: 'পদ্য: বিদ্রোহী',                          status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 18, chapterName: 'পদ্য: আমি কিংবদন্তীর কথা বলছি',           status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 19, chapterName: 'পদ্য: ঋতুবর্ণন',                          status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 20, chapterName: 'পদ্য: প্রত্যাবর্তনের লজ্জা',              status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 21, chapterName: 'পদ্য: ফেব্রুয়ারি ১৯৬৯',                  status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 22, chapterName: 'পদ্য: পদ্মা',                             status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 23, chapterName: 'পদ্য: সুচেতনা',                           status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 24, chapterName: 'পদ্য: সুখ',                               status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 25, chapterName: 'সহপাঠ: লালসালু (উপন্যাস)',                 status: 'not_started' },
  { subject: 'Bangla1', chapterNumber: 26, chapterName: 'সহপাঠ: সিরাজউদ্দৌলা (নাটক)',              status: 'not_started' },

  // ══════════════════════════════════════════
  // BANGLA 2ND PAPER — 12 topics
  // ══════════════════════════════════════════
  { subject: 'Bangla2', chapterNumber: 1,  chapterName: 'উচ্চারণ',                               status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 2,  chapterName: 'বাংলা বানান',                            status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 3,  chapterName: 'ব্যাকরণিক শব্দশ্রেণি',                   status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 4,  chapterName: 'শব্দগঠন (উপসর্গ / সমাস)',                 status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 5,  chapterName: 'বাক্যতত্ত্ব',                             status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 6,  chapterName: 'বাংলা ভাষার অপপ্রয়োগ ও শুদ্ধপ্রয়োগ',   status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 7,  chapterName: 'পারিভাষিক শব্দ বা অনুবাদ',               status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 8,  chapterName: 'দিনলিপি বা প্রতিবেদন',                   status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 9,  chapterName: 'বৈদ্যুতিক চিঠি বা আবেদনপত্র বা চিঠি',   status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 10, chapterName: 'সারাংশ ও সারমর্ম বা ভাবসম্প্রসারণ',      status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 11, chapterName: 'ক্ষুদে গল্প বা সংলাপ',                   status: 'not_started' },
  { subject: 'Bangla2', chapterNumber: 12, chapterName: 'প্রবন্ধ রচনা',                            status: 'not_started' },
];

async function seed() {
  console.log('🌱 Seeding Zyntra chapters...');

  // Clear old chapters first
  await prisma.chapterProgress.deleteMany({});
  console.log('🗑️  Old chapters cleared');

  let count = 0;
  for (const chapter of CHAPTERS) {
    await prisma.chapterProgress.create({ data: chapter });
    count++;
  }

  console.log(`✅ ${count} chapters seeded across 11 subjects`);
  console.log('🎉 Done! PCMB + English + Bangla + ICT all set.');
}

seed()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());