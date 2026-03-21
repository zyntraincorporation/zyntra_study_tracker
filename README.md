# ZYNTRA Study Tracker OS

> Personal study accountability system for Saiful — BUET admission prep 2027

A full-stack SaaS-grade study tracker with session logging, AI mentor analysis, chapter progress tracking, and weekly statistics. Built with React + Express + PostgreSQL + Claude AI.

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, React Query, Zustand |
| Backend  | Node.js, Express.js                             |
| Database | PostgreSQL via Neon serverless, Prisma ORM      |
| AI       | Anthropic Claude API (claude-sonnet-4-20250514) |
| Hosting  | Netlify (frontend) + Render (backend)           |
| Auth     | PIN-based, JWT tokens (30-day expiry)           |

---

## Project Structure

```
zyntra-study-tracker/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Route-level pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CheckinPage.jsx
│   │   │   ├── TimerPage.jsx
│   │   │   ├── StatsPage.jsx
│   │   │   ├── ChaptersPage.jsx
│   │   │   └── AIReportPage.jsx
│   │   ├── components/
│   │   │   ├── layout/AppLayout.jsx
│   │   │   ├── checkin/      # Session + morning modals
│   │   │   └── ui/           # Shared UI primitives
│   │   ├── lib/
│   │   │   ├── api.js        # Axios client + all API helpers
│   │   │   └── schedule.js   # BST helpers + timetable constants
│   │   ├── store/index.js    # Zustand: auth, timer, UI
│   │   └── App.jsx           # Router + PIN guard
│   ├── index.html
│   └── vite.config.js
│
├── server/                   # Express API
│   ├── src/
│   │   ├── index.js          # Entry point, middleware setup
│   │   ├── routes/           # auth, checkin, sessions, chapters, stats, ai
│   │   ├── db/
│   │   │   ├── client.js     # Prisma singleton
│   │   │   └── seed.js       # Chapter data seeder
│   │   ├── lib/
│   │   │   └── schedule.js   # Server-side BST + timetable logic
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT PIN middleware
│   │   └── ai/
│   │       ├── contextBuilder.js  # Aggregates DB data for Claude
│   │       └── promptEngine.js    # Claude API + strict mentor prompt
│   └── prisma/
│       └── schema.prisma     # 6-table PostgreSQL schema
│
├── .env.example              # All required environment variables
├── netlify.toml              # Netlify deploy config
├── render.yaml               # Render deploy config
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Node.js >= 18
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- An [Anthropic API key](https://console.anthropic.com/keys)

### 1. Clone and install

```bash
git clone <your-repo>
cd zyntra-study-tracker

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure environment

```bash
# In /server — create .env from example
cp ../.env.example server/.env
# Edit server/.env with your real values

# In /client — create .env
echo 'VITE_API_BASE_URL=http://localhost:3001' > client/.env
```

### 3. Set up the database

```bash
cd server

# Push schema to Neon (creates all tables)
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed chapter data (run once)
npm run db:seed
```

### 4. Run development servers

```bash
# Terminal 1 — backend (port 3001)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` and enter your PIN.

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. Set **Root Directory** to `server`
5. **Build command**: `npm install && npx prisma generate && npx prisma migrate deploy`
6. **Start command**: `npm start`
7. Add environment variables in Render dashboard:
   - `DATABASE_URL` — Neon pooled connection string
   - `DIRECT_URL` — Neon direct (non-pooled) connection string
   - `ANTHROPIC_API_KEY`
   - `APP_PIN` — your chosen PIN
   - `JWT_SECRET` — 64-char random hex
   - `CLIENT_ORIGIN` — your Netlify URL (e.g. `https://zyntra.netlify.app`)
   - `NODE_ENV=production`

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → New site from Git
2. Connect your repo
3. **Base directory**: `client`
4. **Build command**: `npm run build`
5. **Publish directory**: `client/dist`
6. Add environment variable:
   - `VITE_API_BASE_URL` — your Render backend URL (e.g. `https://zyntra-api.onrender.com`)

---

## API Reference

All endpoints require `Authorization: Bearer <token>` except `POST /api/auth/login`.

### Auth
| Method | Path               | Body                | Description          |
|--------|--------------------|---------------------|----------------------|
| POST   | `/api/auth/login`  | `{ pin: "1234" }`   | Returns JWT token    |

### Check-in
| Method | Path                            | Description                              |
|--------|---------------------------------|------------------------------------------|
| GET    | `/api/checkin/morning/today`    | Today's morning check-in status          |
| POST   | `/api/checkin/morning`          | Save/update morning check-in             |
| GET    | `/api/checkin/morning/history`  | Last N days of morning logs              |
| GET    | `/api/checkin/sessions/today`   | Today's schedule + existing logs         |
| GET    | `/api/checkin/sessions/pending` | Sessions that ended but aren't logged    |
| POST   | `/api/checkin/sessions`         | Save session log (completed or missed)   |
| GET    | `/api/checkin/sessions/history` | Last N days of session logs              |

### Sessions
| Method | Path                     | Description                     |
|--------|--------------------------|---------------------------------|
| POST   | `/api/sessions/custom`   | Save custom timer session       |
| GET    | `/api/sessions/custom`   | List custom sessions            |
| DELETE | `/api/sessions/custom/:id` | Delete a custom session       |
| POST   | `/api/sessions/practice` | Log a practice session (Fri/Sat) |
| GET    | `/api/sessions/practice` | List practice sessions          |

### Chapters
| Method | Path                       | Description                     |
|--------|----------------------------|---------------------------------|
| GET    | `/api/chapters`            | All chapters grouped by subject |
| PATCH  | `/api/chapters/:id`        | Update chapter status           |
| POST   | `/api/chapters/bulk-update`| Update multiple chapters        |

### Stats
| Method | Path                   | Description                                    |
|--------|------------------------|------------------------------------------------|
| GET    | `/api/stats/weekly`    | Full stats package (sessions, charts, scores)  |
| GET    | `/api/stats/heatmap`   | 90-day activity heatmap data                   |

### AI Analysis
| Method | Path                     | Description                         |
|--------|--------------------------|-------------------------------------|
| POST   | `/api/ai/analyze`        | Trigger new AI analysis `{ days: 7 | 30 }` |
| GET    | `/api/ai/reports`        | List all past reports               |
| GET    | `/api/ai/reports/latest` | Most recent full report             |
| GET    | `/api/ai/reports/:id`    | Specific report by ID               |

---

## Features Overview

### 1. Dashboard
- Today's session schedule with live status (Upcoming / Active / Pending / Done / Missed)
- Auto-pops morning check-in modal if not logged today
- Auto-detects sessions that ended without a log → yellow alert banner
- Weekly streak counter and 7-day average productivity score
- Quick action buttons to Timer, Check-in, and AI Analysis

### 2. Session Check-in
- Logs scheduled sessions as completed or missed
- Missed sessions capture: reason, what did instead, actual minutes studied
- Friday/Saturday shows practice logger (QB type, subject, duration)

### 3. Study Timer
- Subject selector + large START STUDY button
- Live stopwatch with elapsed time in sidebar too
- STOP & SAVE writes to `custom_study_sessions` table
- Recent sessions list with delete option

### 4. Weekly Stats
- Bar chart: completed vs missed sessions per day
- Pie chart: subject distribution
- Line chart: daily productivity score (0–100)
- GitHub-style activity heatmap (90 days)
- Missed sessions detail table

### 5. Chapter Progress
- All subjects with progress bars and completion percentages
- Tap any status badge to cycle: Not started → In progress → Completed → Revised
- Collapsible subject sections
- Overall syllabus completion percentage

### 6. AI Mentor Analysis
- 7-day or 30-day analysis options
- Claude receives: all session logs, morning habits, chapter progress, miss reasons, extra sessions
- 8-section structured report: score, missed summary, weak subjects, sleep analysis, patterns, risk assessment, action plan, wins
- Past reports stored and viewable by date
- Score ring visualization per report

---

## Time Zone

All times are **Bangladesh Standard Time (UTC+6)**. The server converts UTC timestamps to BST for all date string comparisons. The client also does BST calculations locally for zero-latency session status detection.

---

## Productivity Score Formula

```
Score = (completed_sessions / scheduled_sessions) × 70
      + woke_up_at_6 × 15
      + studied_before_college × 15
```
Practice days score based on extra session minutes logged.

---

## Development Notes

- PIN is stored only as a plain env var (single-user app, no user table needed)
- JWT tokens last 30 days — Saiful stays logged in across sessions
- Offline writes are queued in `localStorage` and flushed on reconnect
- React Query caches all GET responses for 60 seconds; invalidated on writes
- The AI rate limiter allows 10 analyses per hour to prevent accidental API cost
