'use client';

import { useState, useMemo } from 'react';
import { History, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { InterviewCard } from '@/components/shared/interview-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInterviews } from '@/hooks/use-interviews';

export default function HistoryPage() {
  const { interviews, loading, error, refetch } = useInterviews();
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('recent');

  const completed = useMemo(() => interviews.filter((i) => i.status === 'completed'), [interviews]);

  const roles = useMemo(() => Array.from(new Set(completed.map((i) => i.role))), [completed]);

  const filtered = useMemo(() => {
    let result = completed;
    if (roleFilter !== 'all') result = result.filter((i) => i.role === roleFilter);
    if (sortFilter === 'recent') result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortFilter === 'oldest') result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortFilter === 'highest') result = [...result].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
    else if (sortFilter === 'lowest') result = [...result].sort((a, b) => (a.overall_score || 0) - (b.overall_score || 0));
    return result;
  }, [completed, roleFilter, sortFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Interview History"
        description="Review all your completed practice interviews."
        action={
          <Button asChild>
            <Link href="/interview/new"><Plus className="mr-2 h-4 w-4" /> New Interview</Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortFilter} onValueChange={setSortFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Score</SelectItem>
            <SelectItem value="lowest">Lowest Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="mt-8">
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <LoadingState message="Loading interviews..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No interviews yet"
            description="Complete your first interview to start building your history."
            action={<Button asChild><Link href="/interview/new"><Plus className="mr-2 h-4 w-4" /> Start Interview</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
