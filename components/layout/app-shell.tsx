'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { LoadingState } from '@/components/shared/loading-state';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return <LoadingState message="Loading your workspace..." className="min-h-screen" />;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-8 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
