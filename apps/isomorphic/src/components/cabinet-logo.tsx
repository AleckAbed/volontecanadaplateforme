'use client';

import cn from '@core/utils/class-names';
import type { CabinetBranding } from '@/services/cabinet-profile';

function initials(name: string): string {
  const words = name.replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿ\s]/g, ' ').split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}

/**
 * Logo du cabinet (1.9). Sans logo téléversé : pastille aux initiales, dans la couleur
 * du cabinet, suivie du nom (sauf en mode compact).
 */
export default function CabinetLogo({
  branding,
  compact = false,
  inverted = false,
  className,
}: {
  branding: Pick<CabinetBranding, 'name' | 'logo_url' | 'color'> | null | undefined;
  compact?: boolean;
  /** Fond sombre (menu latéral du cabinet) : texte en blanc. */
  inverted?: boolean;
  className?: string;
}) {
  if (!branding) {
    return <span className={cn('inline-block h-9 w-9 animate-pulse rounded-lg bg-gray-200/60', className)} aria-hidden />;
  }

  if (branding.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.logo_url}
        alt={branding.name}
        className={cn('block h-auto w-auto object-contain', compact ? 'max-h-9 max-w-[40px]' : 'max-h-12 max-w-[160px]', className)}
      />
    );
  }

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <span
        aria-hidden
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: branding.color }}
      >
        {initials(branding.name)}
      </span>
      {compact ? (
        <span className="sr-only">{branding.name}</span>
      ) : (
        <span className={cn('truncate text-base font-semibold', inverted ? 'text-white' : 'text-gray-900')}>{branding.name}</span>
      )}
    </span>
  );
}
