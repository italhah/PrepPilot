# PrepPilot

**Practice interviews. Improve every answer.**

PrepPilot is a full-stack SaaS application that lets users practice technical interviews with an AI interviewer. Users configure their role, experience, topics, difficulty, and duration, then answer AI-generated questions and receive a personalized performance report and study plan.

## Overview

PrepPilot helps developers prepare for technical interviews through AI-powered practice sessions. The platform adapts to your skill level, provides detailed feedback on your answers, and generates personalized study plans to help you improve in areas where you need it most.

## Key Features

- **AI-Powered Interviews** — dynamically generated questions using Google Gemini API
- **Adaptive Difficulty** — questions adjust based on real-time performance and experience level
- **Detailed Reports** — overall score, topic breakdown, strengths, weaknesses, and per-question analysis
- **Personalized Study Plans** — a day-by-day improvement plan generated from your weakest areas
- **Progress Tracking** — score history, topic performance, and improvement trends over time
- **Authentication** — Supabase email/password authentication with protected routes
- **Theme Support** — light, dark, and system mode with persistence
- **Fully Responsive** — optimized for desktop, tablet, and mobile devices
- **Multiple Interview Types** — Web Developer, App Developer, and AI Developer roles
- **Technical & Behavioral Modes** — practice both technical skills and soft skills

## Tech Stack

### Frontend
- **Next.js 13** — React framework with App Router
- **React 18** — UI library
- **TypeScript** — Type-safe JavaScript
- **Tailwind CSS** — Utility-first CSS framework
- **shadcn/ui** — High-quality React components built on Radix UI
- **Lucide React** — Beautiful icon library
- **Recharts** — Chart library for progress visualization

### Backend
- **Supabase** — PostgreSQL database, authentication, and edge functions
- **Google Gemini API** — AI model for question generation and answer evaluation

### Development Tools
- **ESLint** — Code linting
- **PostCSS** — CSS processing
- **Autoprefixer** — CSS vendor prefixing

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── layout.tsx                # Root layout with metadata
├── login/                    # Login page
├── signup/                   # Signup page
├── forgot-password/          # Password reset page
├── dashboard/                # Dashboard with stats and quick actions
├── interview/
│   ├── new/                  # Create interview configuration form
│   ├── run/[id]/             # Live interview screen with Q&A
│   └── [id]/                 # Interview report with detailed feedback
├── interviews/               # Interview history list
├── progress/                 # Progress tracking with charts
├── study-plan/               # View and manage study plans
└── settings/                 # User settings and profile

components/
├── ui/                       # shadcn/ui components
├── layout/                   # App shell components
├── navbar/                   # Landing page navbar
├── sidebar/                  # App sidebar navigation
├── shared/                   # Reusable components (Logo, EmptyState, StatCard, etc.)
├── auth-provider.tsx         # Authentication context
└── theme-provider.tsx        # Theme context

lib/
├── supabase/                 # Supabase client configurations
├── ai/                       # AI integration utilities
├── constants.ts              # App constants and configurations
└── utils.ts                  # Utility functions

hooks/                        # Custom React hooks
types/                        # TypeScript type definitions
supabase/functions/           # Supabase Edge Functions
```

## Environment Variables

PrepPilot requires the following environment variables. Copy `.env.example` to `.env` and fill in your values:

```env
# Supabase (public — safe for client)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API key (server-side only — never exposed to client)
GEMINI_API_KEY=your-gemini-api-key
```

### Getting Your Keys

1. **Supabase Credentials**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your project URL and anon key

2. **Google Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Add this key as a Supabase Edge Function secret named `GEMINI_API_KEY`

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Interview-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase and Gemini API credentials.

### 4. Set up the database

Run the Supabase migration to create the required tables:

```bash
# Apply the migration in your Supabase dashboard
# or use the Supabase CLI if configured
supabase db push
```

### 5. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Build for production

```bash
npm run build
```

### 7. Start the production server

```bash
npm start
```

## How the AI Integration Works

The AI functionality is implemented through a Supabase Edge Function (`ai-interview`) that acts as a secure proxy to the Google Gemini API. This architecture ensures the Gemini API key never reaches the client browser.

The Edge Function handles three main actions:

1. **`generate-question`** — Generates a new interview question based on:
   - User's role (Web Developer, App Developer, AI Developer)
   - Experience level (Junior, Mid, Senior)
   - Selected topics (e.g., React, Python, Machine Learning)
   - Difficulty setting (Easy, Medium, Hard, Adaptive)
   - Previous questions and scores (for adaptive difficulty)

2. **`evaluate-answer`** — Evaluates the user's answer on:
   - Technical correctness
   - Depth of understanding
   - Relevance to the question
   - Communication clarity
   - Returns a structured score and detailed feedback

3. **`generate-report`** — Produces a comprehensive report with:
   - Overall performance score
   - Topic-wise breakdown
   - Identified strengths and weaknesses
   - A personalized 7-day study plan

To add support for another AI provider, modify `lib/ai/gemini.ts` and the edge function in `supabase/functions/ai-interview/index.ts`.

## Database Schema

The application uses six PostgreSQL tables with Row Level Security (RLS) enabled to ensure data privacy:

| Table | Purpose |
|---|---|
| `profiles` | User profile information (full name, avatar URL) |
| `interviews` | Interview sessions with configuration and results |
| `interview_questions` | Questions asked during an interview session |
| `interview_answers` | User answers with scores and AI evaluations |
| `study_plans` | Personalized study plans generated from interviews |
| `study_plan_items` | Individual tasks within a study plan (markable as completed) |

All tables are owner-scoped — users can only access their own data via `auth.uid()` RLS policies, ensuring complete data isolation between users.

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add the following environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy the Edge Function separately via Supabase CLI or dashboard
4. Push to trigger automatic deployment

### Other Platforms

The project can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

Ensure you add the required environment variables and deploy the Supabase Edge Function separately.

## Development

### Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type checking

### Code Style

The project uses ESLint with Next.js configuration. Run `npm run lint` to check for code quality issues.

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.
