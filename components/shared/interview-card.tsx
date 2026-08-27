import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database';

type Interview = Database['public']['Tables']['interviews']['Row'];

interface InterviewCardProps {
  interview: Interview;
  showReportButton?: boolean;
  className?: string;
}

export function InterviewCard({ interview, showReportButton = true, className }: InterviewCardProps) {
  const score = interview.overall_score;
  const date = new Date(interview.completed_at || interview.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className={cn('flex flex-col p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{interview.role}</h3>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {interview.experience_level} · {interview.mode}
          </p>
        </div>
        {score !== null && (
          <div className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
            <Star className="h-3.5 w-3.5" />
            {score}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {interview.topics.slice(0, 4).map((topic) => (
          <Badge key={topic} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {interview.duration} min
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {date}
        </span>
      </div>

      {showReportButton && interview.status === 'completed' && (
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href={`/interview/${interview.id}`}>View Report</Link>
        </Button>
      )}
    </Card>
  );
}
