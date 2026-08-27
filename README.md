# IntervueAI

**Practice interviews. Improve every answer.**

IntervueAI is a full-stack SaaS application that lets users practice technical interviews with an AI interviewer. Users configure their role, experience, topics, difficulty, and duration, then answer AI-generated questions and receive a personalized performance report and study plan.

## Features

- **AI-Powered Interviews** — dynamically generated questions using Google Gemini
- **Adaptive Difficulty** — questions adjust based on real-time performance
- **Detailed Reports** — overall score, topic breakdown, strengths, weaknesses, and per-question analysis
- **Personalized Study Plans** — a day-by-day improvement plan generated from your weakest areas
- **Progress Tracking** — score history, topic performance, and improvement trends
- **Authentication** — Supabase email/password auth with protected routes
- **Themes** — light, dark, and system mode with persistence
- **Fully Responsive** — desktop, tablet, and mobile layouts

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide React
- **Backend:** Supabase (PostgreSQL, Authentication, Edge Functions)
- **AI:** Google Gemini API (via Supabase Edge Function proxy)
- **Charts:** Recharts

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
# Supabase (public — safe for client)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API key (server-side only — never exposed to client)
GEMINI_API_KEY=your-gemini-api-key
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are found in your Supabase project settings (API section).
- `GEMINI_API_KEY` is obtained from [Google AI Studio](https://aistudio.google.com/apikey). This key must be added as a Supabase Edge Function secret named `GEMINI_API_KEY`.

### 3. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Build for production

```bash
npm run build
```

## How the AI Integration Works

The AI runs through a single Supabase Edge Function (`ai-interview`) that proxies requests to the Google Gemini API. This keeps the Gemini API key server-side and never exposed to the browser.

The function handles three actions:

1. **`generate-question`** — generates a new interview question based on role, experience, topics, difficulty, and previous questions/scores (for adaptive difficulty)
2. **`evaluate-answer`** — evaluates the user's answer on correctness, technical depth, relevance, and communication
3. **`generate-report`** — produces a final report with topic scores, strengths, weaknesses, and a 7-day study plan

To add another AI provider, modify `lib/ai/gemini.ts` and the edge function in `supabase/functions/ai-interview/index.ts`.

## Database Schema

The app uses six tables with Row Level Security (RLS) enabled:

| Table | Purpose |
|---|---|
| `profiles` | User profile info (name, avatar) |
| `interviews` | Interview sessions with config and results |
| `interview_questions` | Questions asked during an interview |
| `interview_answers` | User answers with scores and evaluations |
| `study_plans` | Personalized study plans |
| `study_plan_items` | Individual items in a study plan |

All tables are owner-scoped — users can only access their own data via `auth.uid()` RLS policies.

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── login/                    # Login
├── signup/                   # Signup
├── forgot-password/          # Password reset
├── dashboard/                # Dashboard with stats
├── interview/
│   ├── new/                  # Create interview form
│   ├── run/[id]/             # Live interview screen
│   └── [id]/                 # Interview report
├── interviews/               # Interview history
├── progress/                 # Progress tracking
├── study-plan/               # Study plan
└── settings/                 # Settings

components/
├── ui/                       # shadcn/ui components
├── layout/                   # App shell
├── navbar/                   # Landing navbar
├── sidebar/                  # App sidebar
├── shared/                   # Reusable components (EmptyState, StatCard, etc.)
├── auth-provider.tsx         # Auth context
└── theme-provider.tsx        # Theme context

lib/
├── supabase/                 # Supabase clients
├── ai/                       # AI integration
├── constants.ts              # App constants
└── utils.ts                  # Utilities

hooks/                        # Custom hooks
types/                        # TypeScript types
supabase/functions/           # Edge functions
```

## Deployment

The project is compatible with Vercel. Connect your repository and add the environment variables in the Vercel dashboard. The Supabase Edge Function is deployed separately via the Supabase MCP tools.
