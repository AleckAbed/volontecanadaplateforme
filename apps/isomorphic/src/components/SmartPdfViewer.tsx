'use client';

/**
 * SmartPdfViewer — sélectionne automatiquement le viewer le plus adapté au PDF :
 *  - Adobe Embed API si NEXT_PUBLIC_ADOBE_CLIENT_ID est défini ET que le PDF est
 *    détecté comme XFA dynamique (typique des formulaires MIFI/IRCC LiveCycle).
 *  - XfaPdfViewer (pdf.js) sinon — gère bien les AcroForm classiques.
 *
 * Permet aussi à l'utilisateur de basculer manuellement entre les deux viewers
 * en cas de bug — utile quand le PDF est borderline (parfois XFA partiellement
 * détecté).
 */

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PiSparkleDuotone, PiFileTextDuotone, PiWarningDuotone } from 'react-icons/pi';

const XfaPdfViewer = dynamic(() => import('./XfaPdfViewer'), { ssr: false });
const AdobePdfViewer = dynamic(() => import('./AdobePdfViewer'), { ssr: false });

interface SmartPdfViewerProps {
  filePromise: Promise<ArrayBuffer>;
  fileName?: string;
  readOnly?: boolean;
  onSave?: (pdfBytes: Uint8Array, formData: Record<string, any>) => Promise<void>;
  initialFormData?: Record<string, any>;
  /** Force un viewer particulier (utile pour les tests). Sinon auto-détection. */
  forceViewer?: 'xfa' | 'adobe';
}

type Engine = 'xfa' | 'adobe';

/**
 * Détecte la présence d'un formulaire XFA dynamique dans les premiers octets du PDF.
 * On scanne le buffer pour les marqueurs « /XFA » ou « <xdp:xdp ».
 */
async function detectXfa(filePromise: Promise<ArrayBuffer>): Promise<boolean> {
  try {
    const buf = await filePromise;
    // Inspecte les 1 Mo premier — suffisant pour repérer le marqueur XFA dans le catalog
    const head = new Uint8Array(buf, 0, Math.min(buf.byteLength, 1024 * 1024));
    const text = new TextDecoder('latin1').decode(head);
    return text.includes('/XFA') || text.includes('<xdp:xdp');
  } catch {
    return false;
  }
}

export default function SmartPdfViewer(props: SmartPdfViewerProps) {
  const { filePromise, forceViewer, ...rest } = props;
  const hasAdobeKey = !!process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID;
  const [engine, setEngine] = useState<Engine | null>(forceViewer ?? null);
  const [isXfa, setIsXfa] = useState<boolean | null>(null);

  // Auto-détection au mount (sauf si forceViewer)
  useEffect(() => {
    if (forceViewer) { setEngine(forceViewer); return; }
    let cancelled = false;
    detectXfa(filePromise).then((xfa) => {
      if (cancelled) return;
      setIsXfa(xfa);
      // Si on a une clé Adobe ET que c'est du XFA → Adobe (meilleur sur XFA)
      // Sinon → pdf.js (Adobe ne supporte pas toutes les fonctions sans clé)
      const chosen: Engine = xfa && hasAdobeKey ? 'adobe' : 'xfa';
      setEngine(chosen);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le même filePromise ne peut être consommé qu'une fois (ArrayBuffer transferable).
  // On le clone pour permettre le switch entre viewers à chaud.
  const cachedBuffer = useMemo(() => filePromise.then((b) => b.slice(0)), [filePromise]);

  const promiseForChild = useMemo(() => cachedBuffer.then((b) => b.slice(0)), [cachedBuffer, engine]);

  if (engine === null) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center text-sm text-gray-500">
          <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p>Analyse du PDF…</p>
        </div>
      </div>
    );
  }

  const tryOtherEngine = () => setEngine((e) => (e === 'xfa' ? 'adobe' : 'xfa'));

  return (
    <div className="flex h-full flex-col">
      {/* Bandeau de switch (visible seulement si on a la clé Adobe) */}
      {hasAdobeKey && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            {engine === 'adobe' ? (
              <>
                <PiSparkleDuotone className="h-4 w-4 text-indigo-600" />
                <span>Viewer <strong>Adobe</strong> (meilleur support XFA)</span>
              </>
            ) : (
              <>
                <PiFileTextDuotone className="h-4 w-4 text-blue-600" />
                <span>Viewer <strong>pdf.js</strong> (standard)</span>
              </>
            )}
            {isXfa !== null && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500">
                {isXfa ? '📄 XFA détecté' : '📄 AcroForm'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={tryOtherEngine}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            title="Si le PDF s'affiche mal ou que les champs disparaissent, essayez l'autre viewer"
          >
            <PiWarningDuotone className="h-3.5 w-3.5" />
            Essayer {engine === 'xfa' ? 'Adobe' : 'pdf.js'}
          </button>
        </div>
      )}

      {/* Le viewer choisi */}
      <div className="flex-1 overflow-hidden">
        {engine === 'adobe' ? (
          <AdobePdfViewer
            key="adobe"
            filePromise={promiseForChild}
            {...rest}
          />
        ) : (
          <XfaPdfViewer
            key="xfa"
            filePromise={promiseForChild}
            {...rest}
          />
        )}
      </div>
    </div>
  );
}
