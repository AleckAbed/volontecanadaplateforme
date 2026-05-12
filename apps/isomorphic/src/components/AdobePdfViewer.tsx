'use client';

import { useEffect, useRef, useId } from 'react';

interface AdobePdfViewerProps {
  /** ArrayBuffer or fetch Promise that resolves to ArrayBuffer */
  filePromise: Promise<ArrayBuffer>;
  fileName?: string;
  /** Read-only preview (no form filling, no save) */
  readOnly?: boolean;
  /** Called with the PDF bytes when the user saves */
  onSave?: (pdfBytes: Uint8Array) => Promise<void>;
  className?: string;
}

declare global {
  interface Window {
    AdobeDC?: any;
    adobeDCViewSdkReady?: boolean;
  }
}

function loadAdobeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.AdobeDC) { resolve(); return; }
    const existing = document.querySelector('script[data-adobe-pdf-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
    script.setAttribute('data-adobe-pdf-sdk', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger Adobe PDF SDK'));
    document.head.appendChild(script);
  });
}

export default function AdobePdfViewer({
  filePromise,
  fileName = 'document.pdf',
  readOnly = false,
  onSave,
  className = '',
}: AdobePdfViewerProps) {
  const uid = useId().replace(/:/g, '');
  const divId = `adobe-pdf-${uid}`;
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadAdobeScript();

        // Wait for AdobeDC to be available
        await new Promise<void>((resolve) => {
          if (window.AdobeDC) { resolve(); return; }
          document.addEventListener('adobe_dc_view_sdk.ready', () => resolve(), { once: true });
        });

        if (cancelled) return;

        const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || 'YOUR_CLIENT_ID';

        const view = new window.AdobeDC.View({ clientId, divId });
        viewerRef.current = view;

        const previewConfig: Record<string, any> = {
          embedMode: 'FULL_WINDOW',
          showDownloadPDF: true,
          showPrintPDF: !readOnly,
          showAnnotationTools: !readOnly,
          enableFormFilling: !readOnly,
        };

        if (!readOnly && onSave) {
          previewConfig.showSaveButton = true;
          view.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.SAVE_API,
            async (_metaData: any, content: Uint8Array) => {
              try {
                await onSave(content);
                return { code: window.AdobeDC.View.Enum.ApiResponseCode.SUCCESS };
              } catch {
                return { code: window.AdobeDC.View.Enum.ApiResponseCode.FAIL };
              }
            },
            {}
          );
        }

        const buffer = await filePromise;
        if (cancelled) return;

        view.previewFile(
          {
            content: { promise: Promise.resolve(buffer) },
            metaData: { fileName },
          },
          previewConfig
        );
      } catch (e) {
        console.error('AdobePdfViewer error:', e);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  return <div id={divId} className={`h-full w-full ${className}`} />;
}
