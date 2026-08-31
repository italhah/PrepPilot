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
          {/* Paper airplane/pilot — represents guidance and preparation */}
          <path
            d="M3 11l18-4-18 4 7 4 11-8-11 8 7 4-7-4-7 4z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Target/crosshair — represents precision and goal achievement */}
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
          {/* Progress dots — represents improvement tracking */}
          <circle cx="6" cy="18" r="1" fill="currentColor" opacity="0.7" />
          <circle cx="9" cy="18" r="1" fill="currentColor" opacity="0.5" />
          <circle cx="12" cy="18" r="1" fill="currentColor" opacity="0.3" />
        </svg>
      </span>
      {showText && <span className={cn('font-bold tracking-tight', dims.text)}>PrepPilot</span>}
    </span>
  );
}
