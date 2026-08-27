'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, Circle, Plus, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStudyPlan } from '@/hooks/use-interviews';
import { cn } from '@/lib/utils';

export default function StudyPlanPage() {
  const { plan, items, loading, toggleItem } = useStudyPlan();
  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Study Plan"
        description="Your personalized improvement plan based on interview performance."
        action={<Button asChild><Link href="/interview/new"><Plus className="mr-2 h-4 w-4" /> New Interview</Link></Button>}
      />

      <div className="mt-8">
        {loading ? (
          <LoadingState message="Loading study plan..." />
        ) : !plan ? (
          <EmptyState
            icon={BookOpen}
            title="No study plan yet"
            description="Your study plan will appear after your first interview."
            action={<Button asChild><Link href="/interview/new"><Plus className="mr-2 h-4 w-4" /> Start Interview</Link></Button>}
          />
        ) : (
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{plan.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{progress}%</span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {completedCount} of {items.length} items completed
                </p>
              </CardContent>
            </Card>

            {/* Study Items */}
            <div className="space-y-3">
              {items.map((item, i) => (
                <Card key={item.id} className={cn('transition-colors', item.completed && 'bg-muted/30')}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <button
                      onClick={() => toggleItem(item.id, !item.completed)}
                      className="mt-0.5 flex-shrink-0"
                      aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <h3 className={cn('font-semibold', item.completed && 'text-muted-foreground line-through')}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
