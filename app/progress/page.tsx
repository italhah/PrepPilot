'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, Plus, Target, Award } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState, StatsSkeleton } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInterviews } from '@/hooks/use-interviews';

export default function ProgressPage() {
  const { interviews, loading, error, refetch } = useInterviews();

  const completed = useMemo(() => interviews.filter((i) => i.status === 'completed' && i.overall_score !== null), [interviews]);

  const stats = useMemo(() => {
    const scores = completed.map((i) => i.overall_score!);
    return {
      total: completed.length,
      avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      best: scores.length ? Math.max(...scores) : null,
    };
  }, [completed]);

  const scoreHistory = useMemo(() => {
    return [...completed]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((i, idx) => ({
        name: `#${idx + 1}`,
        score: i.overall_score!,
        date: new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
  }, [completed]);

  const topicPerformance = useMemo(() => {
    const topicMap: Record<string, number[]> = {};
    completed.forEach((i) => {
      i.topics.forEach((t) => {
        if (!topicMap[t]) topicMap[t] = [];
        topicMap[t].push(i.overall_score!);
      });
    });
    return Object.entries(topicMap)
      .map(([topic, scores]) => ({ topic, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
      .sort((a, b) => b.avg - a.avg);
  }, [completed]);

  const chartData = topicPerformance.map((t) => ({ name: t.topic, score: t.avg }));

  if (loading) return <AppShell><PageHeader title="Progress" /><div className="mt-8"><StatsSkeleton /></div></AppShell>;
  if (error) return <AppShell><PageHeader title="Progress" /><ErrorState message={error} onRetry={refetch} className="mt-8" /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title="Progress"
        description="Track your performance and improvement over time."
        action={<Button asChild><Link href="/interview/new"><Plus className="mr-2 h-4 w-4" /> New Interview</Link></Button>}
      />

      {completed.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={TrendingUp}
            title="No progress data yet"
            description="Complete your first interview to start tracking your progress."
            action={<Button asChild><Link href="/interview/new"><Plus className="mr-2 h-4 w-4" /> Start Interview</Link></Button>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Target} label="Total Interviews" value={stats.total} />
            <StatCard icon={TrendingUp} label="Average Score" value={stats.avg !== null ? `${stats.avg}/100` : '—'} />
            <StatCard icon={Award} label="Best Score" value={stats.best !== null ? `${stats.best}/100` : '—'} />
          </div>

          {/* Score History */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Score History</CardTitle></CardHeader>
            <CardContent>
              {scoreHistory.length < 2 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Complete at least 2 interviews to see your score trend.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Topic Performance */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Topic Performance</CardTitle></CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No topic data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Strongest & Weakest */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Strongest Areas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topicPerformance.slice(0, 5).map((t) => (
                  <div key={t.topic} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.topic}</span>
                    <Badge variant={t.avg >= 80 ? 'default' : 'secondary'}>{t.avg}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Weakest Areas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topicPerformance.slice(-5).reverse().map((t) => (
                  <div key={t.topic} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.topic}</span>
                    <Badge variant={t.avg >= 50 ? 'secondary' : 'outline'}>{t.avg}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
