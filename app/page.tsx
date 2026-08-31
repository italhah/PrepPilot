'use client';

import Link from 'next/link';
import {
  Sparkles,
  TrendingUp,
  Target,
  BookOpen,
  Users,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  FileText,
  Repeat,
} from 'lucide-react';
import { LandingNavbar } from '@/components/navbar/landing-navbar';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Interviews',
    description: 'Practice with dynamically generated interview questions tailored to your role and experience.',
  },
  {
    icon: TrendingUp,
    title: 'Adaptive Difficulty',
    description: 'Questions adjust according to your experience level and real-time performance.',
  },
  {
    icon: FileText,
    title: 'Detailed Feedback',
    description: 'Understand what you did well and what needs improvement with structured evaluations.',
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description: 'Track your performance across multiple interviews and watch your scores improve.',
  },
  {
    icon: BookOpen,
    title: 'Personalized Study Plans',
    description: 'Get recommendations based on your weaknesses with a day-by-day improvement plan.',
  },
  {
    icon: Users,
    title: 'Multiple Roles',
    description: 'Practice Web, App, and AI development interviews across technical and behavioral modes.',
  },
];

const steps = [
  { icon: Target, title: 'Configure your interview', description: 'Choose your role, experience, topics, and difficulty.' },
  { icon: MessageSquare, title: 'Answer AI-generated questions', description: 'Respond to dynamic questions in a realistic interview flow.' },
  { icon: FileText, title: 'Receive your performance report', description: 'Get scores, feedback, and a detailed breakdown of every answer.' },
  { icon: Repeat, title: 'Improve and practice again', description: 'Follow your study plan and track progress over time.' },
];

const interviewTypes = [
  { role: 'Web Developer', topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'TypeScript'], color: 'text-primary' },
  { role: 'App Developer', topics: ['React Native', 'Flutter', 'Dart', 'APIs', 'State Management'], color: 'text-success' },
  { role: 'AI Developer', topics: ['Python', 'Machine Learning', 'LLMs', 'RAG', 'AI Agents'], color: 'text-warning' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered interview practice
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Practice Interviews.{' '}
              <span className="text-primary">Improve Every Answer.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              Practice realistic technical interviews with an AI interviewer and receive personalized
              feedback based on your actual performance.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">
                  Start Free Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['No credit card required', 'Real AI interviews', 'Detailed feedback'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to ace your next interview</h2>
            <p className="mt-4 text-muted-foreground">
              From your first practice round to your final preparation, PrepPilot adapts to your level and helps you improve.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Four steps to better interview performance.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-sm font-semibold text-primary">Step {i + 1}</div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Types */}
      <section id="interview-types" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Interview types</h2>
            <p className="mt-4 text-muted-foreground">Practice across the most in-demand developer roles.</p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {interviewTypes.map((type) => (
              <Card key={type.role} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className={`mb-2 text-sm font-semibold ${type.color}`}>{type.role}</div>
                  <h3 className="mb-4 text-lg font-bold">{type.role} Interview</h3>
                  <div className="flex flex-wrap gap-2">
                    {type.topics.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-6 p-10 text-center lg:p-16">
              <Logo size="lg" showText={false} />
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to practice?</h2>
                <p className="mt-3 text-muted-foreground">
                  Start your first AI-powered interview today and get a personalized improvement plan.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">Practice interviews. Improve every answer.</p>
        </div>
      </footer>
    </div>
  );
}
