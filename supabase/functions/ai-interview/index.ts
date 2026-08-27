import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

type Action = 'generate-question' | 'evaluate-answer' | 'generate-report';

interface RequestBody {
  action: Action;
  // generate-question
  role?: string;
  experience?: string;
  topics?: string[];
  difficulty?: string;
  mode?: string;
  style?: string;
  previousQuestions?: string[];
  previousScores?: number[];
  questionNumber?: number;
  // evaluate-answer
  question?: string;
  answer?: string;
  topic?: string;
  // generate-report
  qaPairs?: Array<{ question: string; answer: string; topic: string; score?: number; evaluation?: any }>;
  roleContext?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service is not configured. Add the GEMINI_API_KEY secret.' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { action } = body;

    let prompt = '';
    let parseJson = true;

    if (action === 'generate-question') {
      prompt = buildQuestionPrompt(body);
    } else if (action === 'evaluate-answer') {
      prompt = buildEvaluationPrompt(body);
    } else if (action === 'generate-report') {
      prompt = buildReportPrompt(body);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `AI request failed (${geminiResponse.status})`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parseJson = false;
      parsed = { raw: text };
    }

    return new Response(
      JSON.stringify({ data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildQuestionPrompt(body: RequestBody): string {
  const {
    role = 'Web Developer',
    experience = 'junior',
    topics = [],
    difficulty = 'adaptive',
    mode = 'technical',
    style = 'professional',
    previousQuestions = [],
    previousScores = [],
    questionNumber = 1,
  } = body;

  const avgScore = previousScores.length
    ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length
    : null;

  let adaptiveHint = '';
  if (difficulty === 'adaptive' && avgScore !== null) {
    if (avgScore >= 8) adaptiveHint = 'The candidate is performing well — ask a harder, more in-depth question.';
    else if (avgScore < 5) adaptiveHint = 'The candidate is struggling — ask a simpler, more foundational question.';
    else adaptiveHint = 'Ask a question of moderate difficulty.';
  }

  const avoidRepeat = previousQuestions.length
    ? `Do NOT repeat or closely paraphrase these previously asked questions:\n${previousQuestions.map((q) => `- ${q}`).join('\n')}`
    : '';

  return `You are an expert technical interviewer conducting a ${mode} interview for a ${role} role.
Candidate experience level: ${experience}.
Topics to cover: ${topics.length ? topics.join(', ') : 'general topics relevant to the role'}.
Interview style: ${style}.
Question number: ${questionNumber}.
${adaptiveHint}
${avoidRepeat}

Generate ONE interview question appropriate for this context. The question should be clear, specific, and answerable in 1-3 minutes.

Return ONLY valid JSON in this exact shape:
{
  "question": "the question text",
  "topic": "the primary topic this question tests",
  "difficulty": "easy | medium | hard",
  "rationale": "brief reason for asking this"
}`;
}

function buildEvaluationPrompt(body: RequestBody): string {
  const { question = '', answer = '', topic = '' } = body;
  return `You are an expert technical interviewer evaluating a candidate's answer.

Question: ${question}
Topic: ${topic}
Candidate's answer: ${answer}

Evaluate the answer on these dimensions, each from 0 to 1:
- correctness: factual and technical accuracy
- technicalDepth: depth of understanding demonstrated
- relevance: how well the answer addresses the question
- communication: clarity and structure of the explanation

Also give an overall score from 0 to 10 (integer), list specific strengths and weaknesses, provide concise feedback, and an improvement suggestion.

Return ONLY valid JSON in this exact shape:
{
  "score": 0,
  "correctness": 0.0,
  "technicalDepth": 0.0,
  "relevance": 0.0,
  "communication": 0.0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "feedback": "...",
  "improvementSuggestion": "..."
}`;
}

function buildReportPrompt(body: RequestBody): string {
  const { qaPairs = [], roleContext = '' } = body;
  const transcript = qaPairs
    .map(
      (qa, i) =>
        `Q${i + 1} [${qa.topic}]: ${qa.question}\nA: ${qa.answer}\nScore: ${qa.score ?? 'N/A'}`
    )
    .join('\n\n');

  return `You are an expert interviewer generating a final report for a ${roleContext} interview.

Transcript:
${transcript}

Generate a comprehensive report. Calculate topic scores (0-100) by averaging the scores of questions in each topic. Identify overall strengths and weaknesses. Produce a 7-day study plan based on the weakest areas.

Return ONLY valid JSON in this exact shape:
{
  "overallScore": 0,
  "topicScores": [{ "topic": "...", "score": 0 }],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "summary": "...",
  "studyPlan": {
    "title": "7-Day Improvement Plan",
    "description": "...",
    "items": [{ "title": "Day 1 - ...", "description": "..." }]
  }
}`;
}
