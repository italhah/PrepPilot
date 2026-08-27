'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/shared/score-ring';
import { Logo } from '@/components/shared/logo';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { supabase } from '@/lib/supabase/client';
import { generateReport } from '@/lib/ai/gemini';
import type { Database, AnswerEvaluation } from '@/types/database';
import { toast } from 'sonner';

type Interview = Database['public']['Tables']['interviews']['Row'];
type Question = Database['public']['Tables']['interview_questions']['Row'];
type Answer = Database['public']['Tables']['interview_answers']['Row'];

interface ReportData {
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

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  useEffect(() => {
    if (!interviewId) return;
    let active = true;

    (async () => {
      const [intRes, qRes, aRes] = await Promise.all([
        supabase.from('interviews').select('*').eq('id', interviewId).maybeSingle(),
        supabase.from('interview_questions').select('*').eq('interview_id', interviewId).order('question_number', { ascending: true }),
        supabase.from('interview_answers').select('*').eq('interview_id', interviewId).order('created_at', { ascending: true }),
      ]);

      const intData = intRes.data as Interview | null;
      const qData = qRes.data as Question[] | null;
      const aData = aRes.data as Answer[] | null;

      if (!active) return;
      if (intRes.error || !intData) {
        setError('Interview not found.');
        setLoading(false);
        return;
      }
      setInterview(intData);
      setQuestions(qData || []);
      setAnswers(aData || []);
      setLoading(false);

      // If completed and has a study plan already, load existing report data from study plan
      if (intData.status === 'completed') {
        const { data: existingPlanRaw } = await supabase
          .from('study_plans')
          .select('*')
          .eq('interview_id', interviewId)
          .maybeSingle();
        const existingPlan = existingPlanRaw as Database['public']['Tables']['study_plans']['Row'] | null;

        if (existingPlan && active) {
          const { data: itemsRaw } = await supabase
            .from('study_plan_items')
            .select('*')
            .eq('study_plan_id', existingPlan.id)
            .order('created_at', { ascending: true });
          const items = itemsRaw as Database['public']['Tables']['study_plan_items']['Row'][] | null;

          // Reconstruct report from stored data
          // We need to compute topic scores from answers
          const topicMap: Record<string, number[]> = {};
          (aData || []).forEach((a) => {
            const q = (qData || []).find((qq) => qq.id === a.question_id);
            const topic = q?.topic || 'general';
            if (a.score !== null) {
              if (!topicMap[topic]) topicMap[topic] = [];
              topicMap[topic].push(a.score * 10);
            }
          });
          const topicScores = Object.entries(topicMap).map(([topic, scores]) => ({
            topic,
            score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          }));

          const allEvals = (aData || []).map((a) => a.evaluation as AnswerEvaluation | null).filter(Boolean) as AnswerEvaluation[];
          const strengths = Array.from(new Set(allEvals.flatMap((e) => e.strengths))).slice(0, 5);
          const weaknesses = Array.from(new Set(allEvals.flatMap((e) => e.weaknesses))).slice(0, 5);

          setReport({
            overallScore: intData.overall_score || 0,
            topicScores,
            strengths,
            weaknesses,
            summary: existingPlan.description,
            studyPlan: {
              title: existingPlan.title,
              description: existingPlan.description,
              items: (items || []).map((it) => ({ title: it.title, description: it.description })),
            },
          });
          generatedRef.current = true;
        }
      }
    })();

    return () => { active = false; };
  }, [interviewId]);

  // Generate report if interview is completed but no report yet
  useEffect(() => {
    if (!interview || generatedRef.current || loading) return;
    if (interview.status !== 'completed') {
      router.push(`/interview/run/${interviewId}`);
      return;
    }
    if (answers.length === 0) return;

    generatedRef.current = true;
    setGenerating(true);

    (async () => {
      try {
        const qaPairs = questions.map((q) => {
          const a = answers.find((aa) => aa.question_id === q.id);
          return {
            question: q.question,
            answer: a?.answer || '',
            topic: q.topic,
            score: a?.score ?? undefined,
            evaluation: a?.evaluation as AnswerEvaluation | undefined,
          };
        });

        const result = await generateReport(qaPairs, interview.role);
        setReport(result);

        // Save study plan
        const planInsert = {
          user_id: interview.user_id,
          interview_id: interviewId,
          title: result.studyPlan.title,
          description: result.summary || result.studyPlan.description,
        } as Database['public']['Tables']['study_plans']['Insert'];
        const { data: planDataRaw } = await supabase.from('study_plans').insert(planInsert as never).select().single();
        const planData = planDataRaw as Database['public']['Tables']['study_plans']['Row'] | null;

        if (planData && result.studyPlan.items.length > 0) {
          const itemsInsert = result.studyPlan.items.map((item) => ({
            study_plan_id: planData.id,
            title: item.title,
            description: item.description,
          })) as Database['public']['Tables']['study_plan_items']['Insert'][];
          await supabase.from('study_plan_items').insert(itemsInsert as never);
        }

        // Update overall score if AI gives a different one
        if (result.overallScore && result.overallScore !== interview.overall_score) {
          await supabase.from('interviews').update({ overall_score: result.overallScore } as never).eq('id', interviewId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to generate report.';
        setError(msg);
        toast.error(msg);
      } finally {
        setGenerating(false);
      }
    })();
  }, [interview, answers, questions, interviewId, router, loading]);

  if (loading) return <LoadingState message="Loading interview..." className="min-h-screen" />;
  if (error) return <ErrorState message={error} className="mt-20" />;

  if (generating && !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Logo size="lg" showText={false} />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-semibold">Generating your interview report</p>
          <p className="text-sm text-muted-foreground">Analyzing your answers and building a study plan...</p>
        </div>
      </div>
    );
  }

  if (!report || !interview) return <ErrorState className="mt-20" />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>

        {/* Overall Score */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-center sm:gap-10">
            <ScoreRing score={report.overallScore} size={140} label="Overall Score" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{interview.role} Interview Report</h1>
              <p className="mt-1 text-sm text-muted-foreground capitalize">
                {interview.experience_level} · {interview.mode} · {interview.style}
              </p>
              {report.summary && <p className="mt-4 text-sm text-muted-foreground">{report.summary}</p>}
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {interview.topics.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Scores */}
        {report.topicScores.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Topic Scores</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {report.topicScores.map((ts) => (
                <div key={ts.topic}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{ts.topic}</span>
                    <span className="font-semibold">{ts.score}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${ts.score >= 80 ? 'bg-success' : ts.score >= 50 ? 'bg-warning' : 'bg-destructive'}`}
                      style={{ width: `${ts.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-success" /> Strengths</CardTitle></CardHeader>
            <CardContent>
              {report.strengths.length === 0 ? (
                <p className="text-sm text-muted-foreground">No specific strengths identified.</p>
              ) : (
                <ul className="space-y-2">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingDown className="h-5 w-5 text-destructive" /> Weaknesses</CardTitle></CardHeader>
            <CardContent>
              {report.weaknesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No specific weaknesses identified.</p>
              ) : (
                <ul className="space-y-2">
                  {report.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Analysis */}
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Question Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, i) => {
              const a = answers.find((aa) => aa.question_id === q.id);
              const eval_ = a?.evaluation as AnswerEvaluation | null;
              return (
                <div key={q.id} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline">Q{i + 1} · {q.topic}</Badge>
                    {eval_ && (
                      <Badge variant={eval_.score >= 7 ? 'default' : 'secondary'}>
                        <Star className="mr-1 h-3 w-3" /> {eval_.score}/10
                      </Badge>
                    )}
                  </div>
                  <p className="mb-2 font-medium text-sm">{q.question}</p>
                  <p className="mb-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">{a?.answer || 'No answer provided'}</p>
                  {eval_ && (
                    <div className="space-y-1.5 text-sm">
                      <p>{eval_.feedback}</p>
                      {eval_.improvementSuggestion && (
                        <p className="text-muted-foreground"><span className="font-medium">Improvement:</span> {eval_.improvementSuggestion}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Study Plan */}
        {report.studyPlan.items.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                {report.studyPlan.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{report.studyPlan.description}</p>
              {report.studyPlan.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href="/study-plan">Go to Study Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/interview/new">Practice Again</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
