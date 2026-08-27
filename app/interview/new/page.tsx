'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import {
  ROLE_OPTIONS,
  EXPERIENCE_OPTIONS,
  TOPIC_OPTIONS,
  DURATION_OPTIONS,
  DIFFICULTY_OPTIONS,
  MODE_OPTIONS,
  STYLE_OPTIONS,
  getRoleCategory,
} from '@/lib/constants';
import type {
  Database,
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewStyle,
} from '@/types/database';

export default function CreateInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('Web Developer');
  const [customRole, setCustomRole] = useState('');
  const [experience, setExperience] = useState<ExperienceLevel>('junior');
  const [topics, setTopics] = useState<string[]>([]);
  const [duration, setDuration] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('adaptive');
  const [mode, setMode] = useState<InterviewMode>('technical');
  const [style, setStyle] = useState<InterviewStyle>('professional');

  const category = getRoleCategory(role);
  const availableTopics = TOPIC_OPTIONS[category] || [];
  const effectiveRole = role === 'Custom Role' ? customRole || 'General' : role;

  const toggleTopic = (topic: string) => {
    setTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
  };

  const handleSubmit = async () => {
    if (role === 'Custom Role' && !customRole.trim()) {
      toast.error('Please enter a custom role name.');
      return;
    }
    if (topics.length === 0) {
      toast.error('Please select at least one topic.');
      return;
    }

    setLoading(true);
    const insertPayload = {
        role: effectiveRole,
        category,
        experience_level: experience,
        topics,
        duration,
        difficulty,
        mode,
        style,
        status: 'in_progress',
    } as Database['public']['Tables']['interviews']['Insert'];
    const { data: rawData, error } = await supabase
      .from('interviews')
      .insert(insertPayload as never)
      .select()
      .single();
    const data = rawData as Database['public']['Tables']['interviews']['Row'] | null;

    setLoading(false);
    if (error || !data) {
      toast.error('Could not start the interview. Please try again.');
      return;
    }
    router.push(`/interview/run/${data.id}`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Create Interview"
        description="Configure your interview and start practicing."
      />

      <div className="mt-8 mx-auto max-w-3xl space-y-8">
        {/* Role */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Role</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRole(opt.value);
                    setTopics([]);
                  }}
                  className={cn(
                    'rounded-lg border p-4 text-left text-sm font-medium transition-all hover:border-primary',
                    role === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                  )}
                >
                  {opt.value}
                </button>
              ))}
            </div>
            {role === 'Custom Role' && (
              <div className="mt-4">
                <Label htmlFor="customRole">Custom Role Name</Label>
                <Input
                  id="customRole"
                  placeholder="e.g. Data Engineer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Experience Level</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setExperience(opt.value)}
                  className={cn(
                    'rounded-lg border p-4 text-left text-sm font-medium transition-all hover:border-primary',
                    experience === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-1 font-semibold">Topics</h3>
            <p className="mb-4 text-sm text-muted-foreground">Select one or more topics to focus on.</p>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    topics.includes(topic)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary'
                  )}
                >
                  {topic}
                </button>
              ))}
            </div>
            {topics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Duration</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={cn(
                    'rounded-lg border p-4 text-left text-sm font-medium transition-all hover:border-primary',
                    duration === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Difficulty</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-all hover:border-primary',
                    difficulty === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mode & Style */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold">Interview Mode</h3>
              <div className="space-y-2">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary',
                      mode === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4 font-semibold">Interview Style</h3>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStyle(opt.value)}
                    className={cn(
                      'rounded-lg border p-3 text-sm font-medium transition-all hover:border-primary',
                      style === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button asChild variant="outline">
            <span>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </span>
          </Button>
          <Button onClick={handleSubmit} disabled={loading} size="lg">
            {loading ? 'Starting...' : 'Start Interview'}
            {!loading && <Sparkles className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
