'use client';

import Link from 'next/link';
import {
  Plus,
  CheckCircle2,
  Star,
  Target,
  Flame,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { InterviewCard } from '@/components/shared/interview-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState, StatsSkeleton, CardSkeleton } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useDashboardStats } from '@/hooks/use-interviews';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { stats, interviews, loading, error } = useDashboardStats();

  const recentInterviews = useMemo(() => interviews.slice(0, 4), [interviews]);
  const previousSession = useMemo(
    () => interviews.find((i) => i.status === 'completed' && i.overall_score !== null),
    [interviews]
  );

  // topic performance from completed interviews
  const topicPerformance = useMemo(() => {
    const topicMap: Record<string, number[]> = {};
    interviews
      .filter((i) => i.status === 'completed' && i.overall_score !== null)
      .forEach((i) => {
        i.topics.forEach((t) => {
          if (!topicMap[t]) topicMap[t] = [];
          topicMap[t].push(i.overall_score!);
        });
      });
    return Object.entries(topicMap)
      .map(([topic, scores]) => ({
        topic,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [interviews]);

  return (
    <AppShell>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'there'}`}
        description="Here's an overview of your interview practice."
        action={
          <Button asChild>
            <Link href="/interview/new">
              <Plus className="mr-2 h-4 w-4" />
              Start New Interview
            </Link>
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} className="mt-8" />
      ) : loading ? (
        <div className="mt-8 space-y-8">
          <StatsSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={CheckCircle2} label="Interviews Completed" value={stats.totalInterviews} />
            <StatCard icon={TrendingUp} label="Average Score" value={stats.averageScore !== null ? `${stats.averageScore}/100` : '—'} />
            <StatCard icon={Award} label="Best Score" value={stats.bestScore !== null ? `${stats.bestScore}/100` : '—'} />
            <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`} />
          </div>

          {/* Recent Interviews */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Interviews</h2>
              {interviews.length > 0 && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/interviews">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            {recentInterviews.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No interviews yet"
                description="Complete your first interview to start building your progress."
                action={
                  <Button asChild>
                    <Link href="/interview/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Start Interview
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            )}
          </div>

          {/* Previous Session + Progress Overview */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Previous Session */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Previous Session</CardTitle>
              </CardHeader>
              <CardContent>
                {previousSession ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{previousSession.role}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {previousSession.experience_level} · {previousSession.mode}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5">
                        <Star className="h-4 w-4 text-primary" />
                        <span className="font-bold text-primary">{previousSession.overall_score}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Strongest topic</p>
                        <p className="font-medium">{topicPerformance[0]?.topic || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Weakest topic</p>
                        <p className="font-medium">{topicPerformance[topicPerformance.length - 1]?.topic || '—'}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/interview/${previousSession.id}`}>View Full Report</Link>
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    icon={Target}
                    title="No previous session"
                    description="Your latest completed interview will appear here."
                  />
                )}
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {topicPerformance.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No progress data yet"
                    description="Complete interviews to see your topic performance."
                  />
                ) : (
                  <div className="space-y-3">
                    {topicPerformance.slice(0, 5).map((tp) => (
                      <div key={tp.topic}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{tp.topic}</span>
                          <Badge variant={tp.avg >= 80 ? 'default' : tp.avg >= 50 ? 'secondary' : 'outline'}>
                            {tp.avg}%
                          </Badge>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              tp.avg >= 80 ? 'bg-success' : tp.avg >= 50 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${tp.avg}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
