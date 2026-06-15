'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PiQuestionDuotone, PiXBold, PiBookOpenDuotone } from 'react-icons/pi';

interface TutorialButtonProps {
  /** Titre court du tutoriel (affiché dans le drawer). */
  title: string;
  /** Description courte affichée sous le titre. */
  description?: string;
  /** Étapes ou paragraphes explicatifs. */
  steps?: { title: string; body: string }[];
  /** ID du tutoriel sur la page index (ex: /tutoriels#dossiers). */
  fullGuideAnchor?: string;
}

/**
 * Bouton « ? » à placer en haut des pages fonctionnelles.
 * Ouvre un drawer latéral avec un mini-tutoriel inline et un lien vers le guide complet.
 */
export default function TutorialButton({
  title, description, steps, fullGuideAnchor,
}: TutorialButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        title="Voir le tutoriel de cette page"
      >
        <PiQuestionDuotone className="h-4 w-4" />
        Tutoriel
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-[9999] flex h-screen w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <PiBookOpenDuotone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">{title}</h3>
                  {description && (
                    <p className="mt-1 text-xs leading-snug opacity-90">{description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <PiXBold className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {(steps && steps.length > 0) ? (
                <ol className="space-y-4">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {i + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{s.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                  Le tutoriel détaillé est en cours de rédaction. Consultez la page des tutoriels pour plus d&apos;informations.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-5 py-3">
              <Link
                href={fullGuideAnchor ? `/tutoriels${fullGuideAnchor}` : '/tutoriels'}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
              >
                <PiBookOpenDuotone className="h-4 w-4" />
                Voir le guide complet
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
