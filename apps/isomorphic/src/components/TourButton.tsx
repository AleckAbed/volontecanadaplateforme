'use client';

import { useEffect } from 'react';
import { driver, type Driver, type Config } from 'driver.js';
import { PiPlayCircleDuotone } from 'react-icons/pi';
import 'driver.js/dist/driver.css';

/**
 * Bouton « Faire visiter cette page » qui lance un tour guidé interactif.
 * Utilise driver.js : overlay sombre + spotlight sur la cible + bulle d'aide.
 *
 * Utilisation :
 *   <TourButton steps={[
 *     { element: '#dossier-header', popover: { title: 'En-tête', description: '...' } },
 *     { element: '#docs-ircc', popover: { title: 'IRCC', description: '...' } },
 *   ]} />
 */
export default function TourButton({
  steps,
  label = 'Faire visiter cette page',
  storageKey,
}: {
  steps: Config['steps'];
  label?: string;
  /** Si fourni, le tour se déclenche automatiquement la première fois (clé localStorage). */
  storageKey?: string;
}) {
  // Auto-déclenchement à la première visite si storageKey fourni
  useEffect(() => {
    if (!storageKey) return;
    try {
      const seen = localStorage.getItem(storageKey);
      if (seen === '1') return;
      // Petit délai pour laisser le DOM se monter complètement
      const t = setTimeout(() => {
        startTour(steps, storageKey);
      }, 800);
      return () => clearTimeout(t);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={() => startTour(steps, storageKey)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
      title="Visite guidée interactive de cette page"
    >
      <PiPlayCircleDuotone className="h-4 w-4" />
      {label}
    </button>
  );
}

function startTour(steps: Config['steps'], storageKey?: string): Driver {
  const d = driver({
    showProgress: true,
    progressText: 'Étape {{current}} sur {{total}}',
    nextBtnText: 'Suivant →',
    prevBtnText: '← Précédent',
    doneBtnText: 'Terminer ✓',
    showButtons: ['next', 'previous', 'close'],
    overlayOpacity: 0.6,
    overlayColor: 'rgb(15, 23, 42)',
    steps,
    onDestroyed: () => {
      if (storageKey) {
        try { localStorage.setItem(storageKey, '1'); } catch {}
      }
    },
  });
  d.drive();
  return d;
}
