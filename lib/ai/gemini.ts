import type {
  AnswerEvaluation,
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewStyle,
} from '@/types/database';

export interface GenerateQuestionInput {
  role: string;
  experience: ExperienceLevel;
  topics: string[];
  difficulty: Difficulty;
  mode: InterviewMode;
  style: InterviewStyle;
  previousQuestions: string[];
  previousScores: number[];
  questionNumber: number;
}

export interface GeneratedQuestion {
  question: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rationale: string;
}

export interface ReportData {
  overallScore: number;
  topicScores: Array<{ topic: string; score: number }>;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  studyPlan: {
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
}

async function callEdgeFunction<T>(payload: unknown): Promise<T> {
  const response = await fetch('/api/ai-interview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error || `Request failed (${response.status})`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json.data as T;
}

export async function generateQuestion(input: GenerateQuestionInput): Promise<GeneratedQuestion> {
  return callEdgeFunction<GeneratedQuestion>({
    action: 'generate-question',
    ...input,
  });
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  topic: string
): Promise<AnswerEvaluation> {
  return callEdgeFunction<AnswerEvaluation>({
    action: 'evaluate-answer',
    question,
    answer,
    topic,
  });
}

export async function generateReport(
  qaPairs: Array<{ question: string; answer: string; topic: string; score?: number; evaluation?: AnswerEvaluation }>,
  roleContext: string
): Promise<ReportData> {
  return callEdgeFunction<ReportData>({
    action: 'generate-report',
    qaPairs,
    roleContext,
  });
}
