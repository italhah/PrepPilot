import { cn } from '@/lib/utils';

export function Logo({ className, showText = true, size = 'md' }: { className?: string; showText?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dims = {
    sm: { box: 'h-7 w-7', icon: 'h-4 w-4', text: 'text-base' },
    md: { box: 'h-9 w-9', icon: 'h-5 w-5', text: 'text-lg' },
    lg: { box: 'h-11 w-11', icon: 'h-6 w-6', text: 'text-xl' },
  }[size];

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className={cn('flex items-center justify-center rounded-xl bg-primary shadow-sm', dims.box)}>
        <svg viewBox="0 0 24 24" fill="none" className={cn('text-primary-foreground', dims.icon)} xmlns="http://www.w3.org/2000/svg">
          {/* Chat bubble — represents the interview conversation */}
          <path
            d="M4 5.5a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5v-3.5H6.5A2.5 2.5 0 0 1 4 12.5v-7z"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* AI sparkle — represents the AI interviewer */}
          <path
            d="M12 6.5c.3 1.2.8 1.7 2 2-1.2.3-1.7.8-2 2-.3-1.2-.8-1.7-2-2 1.2-.3 1.7-.8 2-2z"
            fill="currentColor"
          />
          {/* Small sparkle accent */}
          <path
            d="M15.5 10.5c.15.6.4.85 1 1-.6.15-.85.4-1 1-.15-.6-.4-.85-1-1 .6-.15.85-.4 1-1z"
            fill="currentColor"
            fillOpacity="0.7"
          />
          {/* Chat dots — represents Q&A dialogue */}
          <circle cx="8" cy="9.5" r="0.8" fill="currentColor" />
          <circle cx="11" cy="9.5" r="0.8" fill="currentColor" fillOpacity="0.5" />
        </svg>
      </span>
      {showText && <span className={cn('font-bold tracking-tight', dims.text)}>IntervueAI</span>}
    </span>
  );
}
