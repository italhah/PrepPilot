'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Interview = Database['public']['Tables']['interviews']['Row'];
type Answer = Database['public']['Tables']['interview_answers']['Row'];
type StudyPlan = Database['public']['Tables']['study_plans']['Row'];
type StudyPlanItem = Database['public']['Tables']['study_plan_items']['Row'];

export interface DashboardStats {
  totalInterviews: number;
  averageScore: number | null;
  bestScore: number | null;
  currentStreak: number;
}

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setInterviews((data || []) as Interview[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return { interviews, loading, error, refetch: fetchInterviews };
}

export function useDashboardStats() {
  const { interviews, loading, error } = useInterviews();
  const [stats, setStats] = useState<DashboardStats>({
    totalInterviews: 0,
    averageScore: null,
    bestScore: null,
    currentStreak: 0,
  });

  useEffect(() => {
    if (loading) return;
    const completed = interviews.filter((i) => i.status === 'completed' && i.overall_score !== null);
    const scores = completed.map((i) => i.overall_score!);

    // streak: consecutive days with at least one completed interview
    const dates = completed
      .map((i) => new Date(i.completed_at || i.created_at).toDateString())
      .filter((d, idx, arr) => arr.indexOf(d) === idx)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    if (dates.length > 0) {
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const diff = Math.floor((today.getTime() - new Date(dates[i]).getTime()) / (1000 * 60 * 60 * 24));
        if (diff === i) streak++;
        else break;
      }
    }

    setStats({
      totalInterviews: completed.length,
      averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      bestScore: scores.length ? Math.max(...scores) : null,
      currentStreak: streak,
    });
  }, [interviews, loading]);

  return { stats, interviews, loading, error };
}

export function useInterviewDetail(id: string | undefined) {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<Database['public']['Tables']['interview_questions']['Row'][]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    (async () => {
      const [{ data: intData, error: intErr }, { data: qData }, { data: aData }] = await Promise.all([
        supabase.from('interviews').select('*').eq('id', id).maybeSingle(),
        supabase.from('interview_questions').select('*').eq('interview_id', id).order('question_number', { ascending: true }),
        supabase.from('interview_answers').select('*').eq('interview_id', id).order('created_at', { ascending: true }),
      ]);

      if (!active) return;
      if (intErr) setError(intErr.message);
      else setInterview(intData as Interview | null);
      setQuestions((qData || []) as Database['public']['Tables']['interview_questions']['Row'][]);
      setAnswers((aData || []) as Answer[]);
      setLoading(false);
    })();

    return () => { active = false; };
  }, [id]);

  return { interview, questions, answers, loading, error };
}

export function useStudyPlan() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [items, setItems] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    const { data: plans, error: planErr } = await supabase
      .from('study_plans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (planErr) {
      setError(planErr.message);
      setLoading(false);
      return;
    }

    if (!plans || plans.length === 0) {
      setPlan(null);
      setItems([]);
      setLoading(false);
      return;
    }

    const latest = plans[0] as StudyPlan;
    setPlan(latest);
    const { data: itemsData } = await supabase
      .from('study_plan_items')
      .select('*')
      .eq('study_plan_id', latest.id)
      .order('created_at', { ascending: true });
    setItems((itemsData || []) as StudyPlanItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleItem = async (itemId: string, completed: boolean) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, completed } : it)));
    await supabase.from('study_plan_items').update({ completed } as never).eq('id', itemId);
  };

  return { plan, items, loading, error, toggleItem, refetch: fetchPlan };
}
