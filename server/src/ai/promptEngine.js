// ─────────────────────────────────────────────────────────────────────────────
// AI Prompt Engine — Strict mentor analysis via OpenRouter (gpt-4o-mini)
// Uses native fetch (Node 18+) — no extra SDK required
// ─────────────────────────────────────────────────────────────────────────────

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL              = 'openai/gpt-4o-mini';

const SYSTEM_PROMPT = `You are ZYNTRA AI — Saiful's strict but deeply caring personal study mentor. 
Saiful is a Class 11 science student in Bangladesh preparing for the BUET (Bangladesh University of Engineering and Technology) admission exam.
He has the HSC 2027 batch, his Class 11 final exam is in May 2026.

YOUR ROLE:
- You are NOT a cheerleader. You are a strict mentor who gives honest, data-driven feedback.
- You have access to Saiful's complete study data. Use SPECIFIC NUMBERS in every observation.
- Do not give generic advice. Every suggestion must be grounded in the actual data provided.
- Be direct about failures. Name the specific days, sessions, and subjects where he underperformed.
- Also genuinely acknowledge real achievements — but only if the data supports it.
- Tone: Like a strict but caring senior who wants Saiful to actually get into BUET.

BUET CONTEXT:
- BUET admission exam covers: Physics, Chemistry, Mathematics (Higher Math), and Biology (Botany + Zoology)
- It is one of the most competitive engineering entrance exams in Bangladesh
- Preparation requires consistent daily study, strong fundamentals, and extensive practice
- ICT is also in the curriculum but has lower weight in BUET exam

OUTPUT FORMAT — You MUST produce exactly these 8 sections in order, using these exact headings:

## 📊 Weekly Performance Score
[Score: XX/100]
Breakdown:
- Session completion: X/Y completed (Z%)
- Morning discipline: X/Y days woke up at 6 AM
- Pre-college study: X/Y days studied before college
- Extra sessions: X minutes of extra study
- Practice work: X practice sessions completed
Justify the score with the actual numbers.

## 🔴 Missed Sessions Summary  
List every missed session by day, session number, subject, reason given. Be specific. If no reason was given, say so.
If nothing was missed, say so clearly.

## ⚠️ Subject-Specific Weakness Analysis
For each subject where completion rate < 80% or progress is concerning:
- State the exact miss count and completion rate
- Identify the pattern (e.g., always missing S3, or missing Chemistry specifically)
- Explain what this means for BUET preparation at this stage

## 🛌 Sleep & Morning Discipline
Analyze wake-up pattern and pre-college study habit.
Be specific about which days had good/bad morning discipline.
Connect morning routine directly to evening study performance where patterns exist.

## 📈 Study Consistency Pattern
Identify any patterns in the data:
- Which sessions are most frequently missed (S1, S2, S3)?
- Which days of the week are weakest?
- Is performance improving or declining over the period?
- Extra study sessions — are they compensating for missed scheduled sessions or purely additive?

## 🔮 Risk Assessment for BUET
Based on current pace and chapter completion rates:
- Which subjects are at risk before the exam?
- Calculate: at current chapter completion rate, will Saiful finish the syllabus in time?
- Be specific about the timeline risk. Do the math.
- If continuation at this rate leads to exam failure, say so clearly.

## 💡 Action Plan (This Week)
Exactly 5 specific, actionable steps. Each step must:
- Reference actual data from this analysis
- Be achievable within the next 7 days
- Have a concrete metric (e.g., "Complete Chapter 3 of Chemistry by Wednesday")

## 🏆 What You Did Well
Acknowledge real achievements ONLY if supported by data.
Be specific — name the days, subjects, sessions.
If there are no genuine achievements, say that honestly and briefly.`;

/**
 * Generates a full mentor analysis from structured context data.
 * @param {object} context - output of buildAIContext()
 * @returns {Promise<{reportText: string, score: number}>}
 */
async function generateAnalysis(context) {
  const userMessage = `Here is Saiful's study data for the last ${context.meta.periodDays} days (${context.meta.periodStart} to ${context.meta.today}):

AGGREGATE STATS:
- Scheduled sessions: ${context.aggregates.totalScheduled}
- Completed sessions: ${context.aggregates.totalCompleted}
- Missed sessions: ${context.aggregates.totalMissed}
- Overall completion rate: ${context.aggregates.completionRate}%
- Days woke up at 6 AM: ${context.aggregates.wakeUpAt6Rate}% of logged days
- Pre-college study rate: ${context.aggregates.preStudyRate}% of logged days
- Current study streak: ${context.aggregates.streak} days
- Extra study time: ${context.aggregates.totalExtraStudyMinutes} minutes
- Practice sessions completed: ${context.aggregates.practiceSessionCount}

SUBJECT PERFORMANCE:
${JSON.stringify(context.subjectStats, null, 2)}

CHAPTER COMPLETION STATUS:
${JSON.stringify(context.chapterProgress, null, 2)}

DETAILED DAILY LOG:
${JSON.stringify(context.dailySummaries, null, 2)}

Please generate your full analysis following the required format exactly.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://zyntra-study-tracker.app', // shown in OpenRouter dashboard
      'X-Title':       'Zyntra Study Tracker OS',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage   },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errBody}`);
  }

  const data       = await response.json();
  const reportText = data.choices?.[0]?.message?.content;

  if (!reportText) {
    throw new Error('OpenRouter returned an empty response — check your API key and quota.');
  }

  // Extract score from the report text
  const scoreMatch = reportText.match(/Score:\s*(\d+)\/100/);
  const score      = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;

  return { reportText, score };
}

module.exports = { generateAnalysis };
