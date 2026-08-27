'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, Send, Square, Brain, Loader2, AlertCircle, Sparkles, Mic, MicOff, Volume2, VolumeX, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Logo } from '@/components/shared/logo';
import { supabase } from '@/lib/supabase/client';
import { generateQuestion, evaluateAnswer } from '@/lib/ai/gemini';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';
import type { Database, AnswerEvaluation } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Interview = Database['public']['Tables']['interviews']['Row'];
type Question = Database['public']['Tables']['interview_questions']['Row'];

interface QaPair {
  question: Question;
  answer: string;
  evaluation: AnswerEvaluation | null;
}

export default function InterviewRunPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [answer, setAnswer] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'evaluating' | 'done'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [qaPairs, setQaPairs] = useState<QaPair[]>([]);
  const [finishing, setFinishing] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const previousQuestionsRef = useRef<string[]>([]);
  const previousScoresRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenQuestionRef = useRef<string>('');

  const voice = useVoiceAssistant();

  // Load interview
  useEffect(() => {
    if (!interviewId) return;
    let active = true;
    (async () => {
      const { data: rawData, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .maybeSingle();
      const data = rawData as Interview | null;
      if (!active) return;
      if (error || !data) {
        setError('Interview not found.');
        setLoading(false);
        return;
      }
      if (data.status === 'completed') {
        router.push(`/interview/${interviewId}`);
        return;
      }
      setInterview(data);
      setTimeLeft(data.duration * 60);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [interviewId, router]);

  // Timer
  useEffect(() => {
    if (loading || !interview) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, interview]);

  // Speak question when it arrives (if voice mode + auto-speak enabled)
  useEffect(() => {
    if (voiceMode && autoSpeak && currentQuestion && currentQuestion !== spokenQuestionRef.current && aiStatus === 'idle') {
      spokenQuestionRef.current = currentQuestion;
      voice.speak(currentQuestion);
    }
  }, [voiceMode, autoSpeak, currentQuestion, aiStatus, voice]);

  // Sync voice transcript into answer textarea
  useEffect(() => {
    if (voiceMode && (voice.transcript || voice.interimTranscript)) {
      const combined = voice.transcript + voice.interimTranscript;
      setAnswer(combined.trim());
    }
  }, [voiceMode, voice.transcript, voice.interimTranscript]);

  // Generate first question
  const askNextQuestion = useCallback(async () => {
    if (!interview) return;
    setAiStatus('thinking');
    setAnswer('');
    try {
      const result = await generateQuestion({
        role: interview.role,
        experience: interview.experience_level,
        topics: interview.topics,
        difficulty: interview.difficulty,
        mode: interview.mode,
        style: interview.style,
        previousQuestions: previousQuestionsRef.current,
        previousScores: previousScoresRef.current,
        questionNumber: questionNumber + 1,
      });

      const { data: qRawData, error: qErr } = await supabase
        .from('interview_questions')
        .insert({
          interview_id: interviewId,
          question: result.question,
          topic: result.topic || interview.topics[0] || 'general',
          difficulty: interview.difficulty,
          question_number: questionNumber + 1,
        } as never)
        .select()
        .single();
      const qData = qRawData as Question | null;

      if (qErr || !qData) throw new Error('Failed to save question.');

      setCurrentQuestion(result.question);
      setCurrentTopic(result.topic || interview.topics[0] || 'general');
      setQuestionNumber((prev) => prev + 1);
      previousQuestionsRef.current.push(result.question);
      setAiStatus('idle');
    } catch (err) {
      setAiStatus('idle');
      const msg = err instanceof Error ? err.message : 'Failed to generate question.';
      setError(msg);
      toast.error(msg);
    }
  }, [interview, interviewId, questionNumber]);

  // Auto-start first question
  useEffect(() => {
    if (interview && questionNumber === 0 && aiStatus === 'idle' && !currentQuestion) {
      askNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !interview || aiStatus !== 'idle') return;

    setAiStatus('evaluating');
    voice.stopSpeaking();
    voice.stopListening();

    // Find the current question record
    const { data: qRecordRaw } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('interview_id', interviewId)
      .order('question_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const qRecord = qRecordRaw as Question | null;

    if (!qRecord) {
      toast.error('Question not found. Please try again.');
      setAiStatus('idle');
      return;
    }

    try {
      const evaluation = await evaluateAnswer(currentQuestion, answer, currentTopic);

      const { data: aData } = await supabase.from('interview_answers').insert({
        interview_id: interviewId,
        question_id: qRecord.id,
        answer,
        score: evaluation.score,
        evaluation,
      } as never).select().single();

      setQaPairs((prev) => [...prev, { question: qRecord, answer, evaluation }]);
      previousScoresRef.current.push(evaluation.score);

      setAiStatus('done');

      if (voiceMode && autoSpeak) {
        voice.speak(`Your score: ${evaluation.score} out of 10. ${evaluation.feedback}`, () => {
          setTimeout(() => askNextQuestion(), 500);
        });
      } else {
        setTimeout(() => askNextQuestion(), 1500);
      }
    } catch (err) {
      setAiStatus('idle');
      const msg = err instanceof Error ? err.message : 'Failed to evaluate answer.';
      toast.error(msg);
    }
  };

  const handleFinish = async (autoFinish = false) => {
    if (finishing) return;
    setFinishing(true);
    if (timerRef.current) clearInterval(timerRef.current);
    voice.stopSpeaking();
    voice.stopListening();

    try {
      const scores = previousScoresRef.current;
      const overallScore = scores.length
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10)
        : 0;

      await supabase
        .from('interviews')
        .update({
          status: 'completed',
          overall_score: overallScore,
          completed_at: new Date().toISOString(),
        } as never)
        .eq('id', interviewId);

      if (autoFinish) toast.info('Time is up! Generating your report...');
      router.push(`/interview/${interviewId}`);
    } catch {
      toast.error('Could not finish the interview.');
      setFinishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMicToggle = () => {
    if (voice.state === 'listening') {
      voice.stopListening();
    } else {
      setAnswer('');
      voice.startListening();
    }
  };

  const handleSpeakQuestion = () => {
    if (currentQuestion) {
      voice.speak(currentQuestion);
    }
  };

  if (loading) return <LoadingState message="Loading interview..." className="min-h-screen" />;
  if (error) return <ErrorState message={error} className="mt-20" />;

  const lowTime = timeLeft <= 60;
  const voiceDisabled = aiStatus !== 'idle';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div>
              <p className="text-sm font-semibold">{interview?.role}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {interview?.experience_level} · {interview?.mode} · {interview?.style}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Voice mode toggle */}
            <button
              onClick={() => {
                if (!voiceMode) voice.stopSpeaking();
                setVoiceMode(!voiceMode);
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3',
                voiceMode
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
              title="Toggle voice assistant mode"
            >
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </button>
            <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold sm:px-3 ${lowTime ? 'bg-destructive/10 text-destructive animate-pulse-soft' : 'bg-muted'}`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <Button variant="outline" size="sm" onClick={() => handleFinish(false)} disabled={finishing}>
              <Square className="mr-1.5 h-4 w-4" />
              End
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-3">
          <Badge variant="secondary">Question {questionNumber}</Badge>
          {qaPairs.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {qaPairs.length} answered · avg score{' '}
              {previousScoresRef.current.length
                ? (previousScoresRef.current.reduce((a, b) => a + b, 0) / previousScoresRef.current.length).toFixed(1)
                : '—'}
            </span>
          )}
        </div>

        {/* Voice status banner */}
        {voiceMode && !voice.supported && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Voice assistant is not supported in this browser. You can still type your answers.
          </div>
        )}

        {voiceMode && voice.supported && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Voice state indicator */}
            <div className="flex items-center gap-2">
              {voice.state === 'listening' && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="voice-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                  Listening...
                </div>
              )}
              {voice.state === 'speaking' && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  Speaking...
                </div>
              )}
              {voice.state === 'idle' && voiceMode && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
                  <Headphones className="h-4 w-4" />
                  Voice mode active
                </div>
              )}
              {voice.state === 'error' && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Voice error. Try again.
                </div>
              )}
            </div>

            {/* Auto-speak toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                autoSpeak ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
              title="Toggle automatic text-to-speech for questions"
            >
              {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              Auto-speak {autoSpeak ? 'on' : 'off'}
            </button>

            {/* Speak question button */}
            <button
              onClick={handleSpeakQuestion}
              disabled={!currentQuestion || voice.state === 'speaking'}
              className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              title="Read the current question aloud"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Read question
            </button>
          </div>
        )}

        {/* Current Question */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {aiStatus === 'thinking' ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">AI is preparing your next question...</span>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">AI Interviewer</span>
                  {currentTopic && <Badge variant="outline" className="text-xs">{currentTopic}</Badge>}
                </div>
                <p className="text-lg font-medium leading-relaxed">{currentQuestion || 'Preparing question...'}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Answer Area */}
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={voiceMode && voice.state === 'listening' ? 'Listening to your voice...' : 'Type your answer here...'}
            className="min-h-[160px] resize-y"
            disabled={aiStatus !== 'idle'}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/* Mic button (only in voice mode) */}
              {voiceMode && voice.supported && (
                <button
                  onClick={handleMicToggle}
                  disabled={voiceDisabled}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50',
                    voice.state === 'listening'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary'
                  )}
                  title={voice.state === 'listening' ? 'Stop recording' : 'Start voice input'}
                >
                  {voice.state === 'listening' ? (
                    <><MicOff className="h-4 w-4" /> Stop</>
                  ) : (
                    <><Mic className="h-4 w-4" /> Speak</>
                  )}
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                {aiStatus === 'evaluating' ? 'Evaluating your answer...' : aiStatus === 'done' ? 'Answer evaluated! Next question coming up...' : voice.state === 'listening' ? 'Speak your answer, then press Stop' : 'Take your time and explain your thinking.'}
              </p>
            </div>
            <Button onClick={handleSubmitAnswer} disabled={!answer.trim() || aiStatus !== 'idle'} className="sm:flex-shrink-0">
              {aiStatus === 'evaluating' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Submit Answer</>
              )}
            </Button>
          </div>
        </div>

        {/* Previous Q&A */}
        {qaPairs.length > 0 && (
          <div className="mt-10 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Previous Answers</h3>
            {qaPairs.slice().reverse().map((qa, i) => (
              <Card key={qa.question.id}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Q{qa.question.question_number} · {qa.question.topic}
                    </Badge>
                    {qa.evaluation && (
                      <Badge variant={qa.evaluation.score >= 7 ? 'default' : 'secondary'}>
                        Score: {qa.evaluation.score}/10
                      </Badge>
                    )}
                  </div>
                  <p className="mb-2 text-sm font-medium">{qa.question.question}</p>
                  <p className="mb-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">{qa.answer}</p>
                  {qa.evaluation && (
                    <div className="space-y-1.5 text-sm">
                      <p className="text-foreground">{qa.evaluation.feedback}</p>
                      {qa.evaluation.improvementSuggestion && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Improvement:</span> {qa.evaluation.improvementSuggestion}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {finishing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your report...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
