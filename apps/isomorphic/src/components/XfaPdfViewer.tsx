'use client';

import { useEffect, useRef, useState } from 'react';

interface XfaPdfViewerProps {
  /** Promise that resolves to the PDF bytes */
  filePromise: Promise<ArrayBuffer>;
  fileName?: string;
  /** Read-only preview (no form filling, no save) */
  readOnly?: boolean;
  /** Initial form values to restore (key → value map from a previous save) */
  initialFormData?: Record<string, any>;
  /**
   * Called when user clicks save. Receives both the PDF bytes AND the form
   * values map so callers can persist either or both.
   */
  onSave?: (pdfBytes: Uint8Array, formData: Record<string, any>) => Promise<void>;
  className?: string;
}

/**
 * XFA-capable PDF viewer using Mozilla's PDF.js prebuilt viewer in an iframe.
 *
 * Save strategy: PDF.js renders XFA forms as HTML inputs inside `.xfaLayer`
 * divs. Pages are virtualized — only visible pages exist in the DOM at any
 * given time. To never lose values, we install a MutationObserver that
 * attaches input/change listeners to fields as they appear, accumulating
 * values into an in-memory map that survives page re-renders.
 */
export default function XfaPdfViewer({
  filePromise,
  fileName = 'document.pdf',
  readOnly = false,
  initialFormData,
  onSave,
  className = '',
}: XfaPdfViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  // Authoritative form state — persists across PDF.js virtual-scroll re-renders.
  const formValuesRef = useRef<Record<string, any>>({});
  const observerRef = useRef<MutationObserver | null>(null);
  const seenInputsRef = useRef<WeakSet<Element>>(new WeakSet());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugSnapshot, setDebugSnapshot] = useState<Record<string, any>>({});

  useEffect(() => {
    let cancelled = false;
    formValuesRef.current = { ...(initialFormData || {}) };

    (async () => {
      try {
        const buffer = await filePromise;
        if (cancelled) return;

        const blob = new Blob([buffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        const viewerBase = '/pdfjs/web/viewer.html';
        const params = new URLSearchParams({ file: blobUrl });
        const url = `${viewerBase}?${params.toString()}#pagemode=none`;

        if (iframeRef.current) {
          iframeRef.current.src = url;
        }

        // Wait for the viewer to start rendering form inputs, then install the
        // continuous tracker AND force all pages to render so virtualization
        // doesn't drop fields out of the DOM.
        waitForViewerReady(iframeRef.current!)
          .then((win) => {
            if (initialFormData) {
              restoreAnnotationStorage(win, initialFormData);
            }
            installInputTracker(win, formValuesRef, seenInputsRef.current, observerRef);

            // Kick off render-all in the background — don't block applyDom on it.
            renderAllPages(win).catch(() => {});

            // Push values into the actual DOM inputs (PDF.js doesn't display
            // annotationStorage values in XFA mode). Retry repeatedly because
            // PDF.js re-renders pages and wipes our changes.
            if (initialFormData && Object.keys(initialFormData).length > 0) {
              const applyAndLog = () => {
                try {
                  const applied = applyAnnotationsToDom(win, initialFormData);
                  if (applied > 0) {
                    console.log('[XfaPdfViewer] applied', applied, 'values to DOM inputs');
                  }
                } catch (e) {
                  console.warn('[XfaPdfViewer] apply error:', e);
                }
              };
              applyAndLog();
              [200, 500, 1000, 2000, 4000, 8000].forEach((d) => setTimeout(applyAndLog, d));

              // Also re-apply on any DOM mutation (new pages, re-renders)
              try {
                const MO = (win as any).MutationObserver || MutationObserver;
                const reapplyObs = new MO(() => applyAndLog());
                reapplyObs.observe(win.document.body, { childList: true, subtree: true });
                setTimeout(() => reapplyObs.disconnect(), 30000);
              } catch {}
            }
          })
          .catch((e) => console.warn('[XfaPdfViewer] setup failed:', e));
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement du PDF');
      }
    })();

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [filePromise, initialFormData]);

  const handleSave = async () => {
    if (!onSave) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    try {
      setSaving(true);
      const win = iframe.contentWindow as any;
      const PDFViewerApplication = win.PDFViewerApplication;
      if (!PDFViewerApplication?.pdfDocument) {
        throw new Error('Viewer non initialisé — attendez le chargement complet du PDF');
      }

      // Sweep currently-rendered fields one final time to catch any unfocused values
      sweepCurrentInputs(win, formValuesRef.current);

      // Pull PDF.js internal annotation storage — for XFA forms this is the
      // source of truth (it contains values from ALL pages, not just rendered ones).
      mergeAnnotationStorage(win, formValuesRef.current);

      const formData = { ...formValuesRef.current };
      const data: Uint8Array = await PDFViewerApplication.pdfDocument.saveDocument();

      console.log('[XfaPdfViewer] saving', {
        pdfBytes: data.length,
        formFields: Object.keys(formData).length,
        sample: Object.entries(formData).slice(0, 8).map(([k, v]) => `${k}=${JSON.stringify(v)}`),
      });

      await onSave(data, formData);
    } catch (e: any) {
      console.error('[XfaPdfViewer] save error:', e);
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-red-50 p-8 ${className}`}>
        <div className="text-center">
          <div className="mb-2 text-3xl">⚠</div>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full w-full flex-col ${className}`}>
      <iframe
        ref={iframeRef}
        title={fileName}
        className="h-full w-full flex-1 border-0"
      />
      {!readOnly && onSave && (
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2">
          <button
            type="button"
            onClick={() => {
              setDebugSnapshot({ ...formValuesRef.current });
              setShowDebug((s) => !s);
            }}
            className="text-xs text-gray-500 underline hover:text-gray-800"
          >
            🔍 {showDebug ? 'Masquer' : 'Voir'} les valeurs capturées ({Object.keys(formValuesRef.current).length})
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer le formulaire'}
          </button>
        </div>
      )}
      {showDebug && (
        <div className="max-h-60 overflow-auto border-t border-gray-200 bg-gray-900 p-3 font-mono text-xs text-gray-100">
          <pre>{JSON.stringify(debugSnapshot, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** CSS selector that scopes to PDF form layers, NOT viewer chrome. */
const FORM_FIELD_SELECTOR =
  '.xfaLayer input, .xfaLayer textarea, .xfaLayer select, ' +
  '.annotationLayer input, .annotationLayer textarea, .annotationLayer select';

/**
 * Restore previously-saved values into PDF.js's annotationStorage so that
 * XFA-rendered fields pick them up on draw, regardless of which page
 * gets rendered first.
 */
function restoreAnnotationStorage(win: any, values: Record<string, any>): void {
  try {
    const storage = win?.PDFViewerApplication?.pdfDocument?.annotationStorage;
    if (!storage || typeof storage.setValue !== 'function') return;
    let restored = 0;
    Object.entries(values).forEach(([key, value]) => {
      if (!key.startsWith('__as__')) return;
      const realKey = key.slice('__as__'.length);
      try {
        storage.setValue(realKey, value);
        restored++;
      } catch {}
    });
    if (restored > 0) {
      console.log('[XfaPdfViewer] restored', restored, 'values to annotationStorage');
    }
  } catch (e) {
    console.warn('[XfaPdfViewer] restoreAnnotationStorage error:', e);
  }
}

/**
 * Apply saved annotationStorage values DIRECTLY to the DOM inputs.
 * PDF.js's XFA renderer ignores annotationStorage updates for display
 * ("XFA-editing not implemented"), so we must set the values on the
 * actual HTML inputs to make them visible to the user.
 *
 * Mapping strategy: for each `__as__KEY` entry, the KEY is typically
 * an XFA element id like "FamilyName30877". We try several DOM
 * lookups: id match, name match, and partial id match.
 */
function applyAnnotationsToDom(win: any, values: Record<string, any>): number {
  let applied = 0;
  try {
    const doc: Document = win.document;
    if (!doc) return 0;

    Object.entries(values).forEach(([rawKey, raw]) => {
      if (!rawKey.startsWith('__as__')) return;
      const key = rawKey.slice('__as__'.length);

      // PDF.js value objects are typically: { value: 'X' } or { value: true } or { value: ['a','b'] }
      const value = (raw && typeof raw === 'object' && 'value' in raw) ? (raw as any).value : raw;

      // 1. Try direct id match (most common: input id = annotation key)
      let el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null =
        doc.getElementById(key) as any;

      // 2. Try data-element-id attribute
      if (!el) {
        el = doc.querySelector(`[data-element-id="${cssEscape(key)}"]`) as any;
      }

      // 3. Try name attribute (XFA SOM expression sometimes matches)
      if (!el) {
        el = doc.querySelector(
          `${FORM_FIELD_SELECTOR.split(',').map(s => `${s}[name="${cssEscape(key)}"]`).join(',')}`,
        ) as any;
      }

      // 4. Last resort: id ends-with the key (PDF.js sometimes prefixes ids)
      if (!el) {
        const candidates = doc.querySelectorAll<HTMLInputElement>(FORM_FIELD_SELECTOR);
        for (const c of Array.from(candidates)) {
          if (c.id?.endsWith(key) || c.name === key) {
            el = c as any;
            break;
          }
        }
      }

      if (!el) return;
      try {
        applyFieldValue(el as any, value);
        applied++;
      } catch {}
    });
  } catch (e) {
    console.warn('[XfaPdfViewer] applyAnnotationsToDom error:', e);
  }
  return applied;
}

function cssEscape(s: string): string {
  return s.replace(/(["\\])/g, '\\$1');
}

/**
 * Read PDF.js's internal annotation storage — for XFA forms, this is where
 * the user's values live (they don't always reach DOM event handlers).
 * Keys are prefixed with `__as__` to distinguish them from DOM-derived keys.
 */
function mergeAnnotationStorage(win: any, store: Record<string, any>): void {
  try {
    const doc = win?.PDFViewerApplication?.pdfDocument;
    const storage = doc?.annotationStorage;
    if (!storage) return;

    let entries: any[] = [];
    // Try several APIs depending on PDF.js version
    if (typeof storage.getAll === 'function') {
      const all = storage.getAll();
      if (all && typeof all.forEach === 'function') {
        all.forEach((value: any, key: string) => entries.push([key, value]));
      } else if (all && typeof all === 'object') {
        entries = Object.entries(all);
      }
    }
    if (entries.length === 0 && (storage as any).serializable) {
      const ser = (storage as any).serializable;
      if (ser && typeof ser.forEach === 'function') {
        ser.forEach((value: any, key: string) => entries.push([key, value]));
      } else if (ser && typeof ser === 'object') {
        entries = Object.entries(ser);
      }
    }

    let added = 0;
    entries.forEach(([key, value]) => {
      // Skip obvious non-form keys (PDF.js sometimes stores UI state too)
      if (typeof key !== 'string') return;
      try {
        store[`__as__${key}`] = JSON.parse(JSON.stringify(value));
        added++;
      } catch {}
    });
    if (added > 0) {
      console.log('[XfaPdfViewer] merged', added, 'values from annotationStorage');
    }
  } catch (e) {
    console.warn('[XfaPdfViewer] mergeAnnotationStorage error:', e);
  }
}

/**
 * Force PDF.js to render every page so all form fields are present in the DOM
 * simultaneously. Required because PDF.js virtualizes pages by default and
 * unloads off-screen ones.
 */
function renderAllPages(win: any): Promise<void> {
  return new Promise<void>((resolve) => {
    try { _renderAllPagesImpl(win); } catch (e) { console.warn('[XfaPdfViewer]', e); }
    resolve();
  });
}

function _renderAllPagesImpl(win: any): void {
  try {
    const app = win?.PDFViewerApplication;
    const viewer = app?.pdfViewer;
    const numPages = app?.pdfDocument?.numPages ?? 0;
    if (!viewer || numPages === 0) return;

    console.log('[XfaPdfViewer] forcing render of', numPages, 'pages');

    // Trigger draws in parallel, swallow errors per-page (other pages may
    // already be rendering and PDF.js throws "Page N is currently rendering").
    const draws: Promise<any>[] = [];
    for (let i = 0; i < numPages; i++) {
      const pv = viewer.getPageView(i);
      if (!pv || typeof pv.draw !== 'function') continue;
      try {
        const p = pv.draw();
        if (p && typeof p.then === 'function') {
          draws.push(p.catch(() => {}));
        }
      } catch {}
    }
    Promise.allSettled(draws).then(() => {
      try { viewer.update?.(); } catch {}
      console.log('[XfaPdfViewer] all pages rendered');
    });
  } catch (e) {
    console.warn('[XfaPdfViewer] renderAllPages error:', e);
  }
}

/** Wait until viewer has rendered at least one form field. */
function waitForViewerReady(iframe: HTMLIFrameElement, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const win = iframe.contentWindow as any;
      const app = win?.PDFViewerApplication;
      if (app?.pdfDocument && win.document?.querySelector(FORM_FIELD_SELECTOR)) {
        resolve(win);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Viewer load timeout'));
        return;
      }
      setTimeout(check, 250);
    };
    check();
  });
}

/** Stable key for a form field — name (XFA SOM expr) preferred for radios groups. */
function fieldKey(el: Element): string {
  // For radios, use name+value so each radio in the group is distinct
  const tag = el.tagName.toLowerCase();
  const inputEl = el as HTMLInputElement;
  if (tag === 'input' && inputEl.type === 'radio') {
    const n = inputEl.name?.trim() || inputEl.id?.trim() || '';
    const v = inputEl.value?.trim() || '';
    return `${n}|${v}`;
  }
  return inputEl.id?.trim() || inputEl.name?.trim() || '';
}

/** Read a single field's current value into a form-data-friendly shape. */
function readFieldValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): any {
  const tag = el.tagName.toLowerCase();
  if (tag === 'select') {
    const sel = el as HTMLSelectElement;
    if (sel.multiple) return Array.from(sel.selectedOptions).map((o) => o.value);
    return sel.value;
  }
  const input = el as HTMLInputElement;
  if (input.type === 'checkbox' || input.type === 'radio') {
    return input.checked;
  }
  return input.value;
}

/** Apply a saved value back to a field (no event dispatch). */
function applyFieldValue(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: any,
): void {
  const tag = el.tagName.toLowerCase();
  try {
    if (tag === 'select') {
      const sel = el as HTMLSelectElement;
      if (sel.multiple && Array.isArray(value)) {
        Array.from(sel.options).forEach((o) => {
          o.selected = value.includes(o.value);
        });
      } else {
        sel.value = String(value ?? '');
      }
      return;
    }
    const input = el as HTMLInputElement;
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = Boolean(value);
      return;
    }
    input.value = String(value ?? '');
  } catch {}
}

/** Restore a field's value from the in-memory store, if present. */
function restoreFieldFromStore(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  store: Record<string, any>,
): void {
  const key = fieldKey(el);
  if (!key) return;

  // Radios: key includes "name|value", we look it up
  const tag = el.tagName.toLowerCase();
  const inputEl = el as HTMLInputElement;
  if (tag === 'input' && inputEl.type === 'radio') {
    if (Object.prototype.hasOwnProperty.call(store, key)) {
      applyFieldValue(el, store[key]);
    }
    return;
  }
  if (Object.prototype.hasOwnProperty.call(store, key)) {
    applyFieldValue(el, store[key]);
  }
}

/**
 * Sweep currently-rendered form fields. Only WRITES to store, never erases:
 * a field that is not currently in DOM keeps its previously-captured value.
 * For text fields, an empty value on a freshly-mounted (but never-edited)
 * field is also treated as "no change" so we don't wipe stored values.
 */
function sweepCurrentInputs(win: any, store: Record<string, any>): void {
  try {
    const fields = win.document.querySelectorAll<HTMLInputElement>(FORM_FIELD_SELECTOR);
    fields.forEach((el) => {
      const key = fieldKey(el);
      if (!key) return;
      const tag = el.tagName.toLowerCase();
      const v = readFieldValue(el);
      // Only overwrite store with a non-empty/checked value, OR if we already
      // had something stored for this key (in which case echo current state).
      if (tag === 'input' && (el.type === 'checkbox' || el.type === 'radio')) {
        // Always reflect checked state if key is already known
        if (Object.prototype.hasOwnProperty.call(store, key) || el.checked) {
          store[key] = el.checked;
        }
        return;
      }
      if (Object.prototype.hasOwnProperty.call(store, key)) {
        store[key] = v;
      } else if (v !== '' && v != null) {
        store[key] = v;
      }
    });
  } catch (e) {
    console.warn('[XfaPdfViewer] sweep error:', e);
  }
}

/**
 * Continuously track form field changes by attaching listeners as PDF.js
 * mounts new fields on virtual-scrolled pages. New fields also get their
 * previously-saved value restored from the in-memory store.
 */
function installInputTracker(
  win: any,
  storeRef: { current: Record<string, any> },
  seen: WeakSet<Element>,
  observerRef: { current: MutationObserver | null },
): void {
  const doc: Document = win.document;
  if (!doc) return;

  const onChange = (evt: Event) => {
    const el = evt.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!el || !(el as Element).matches?.(FORM_FIELD_SELECTOR)) return;
    const key = fieldKey(el);
    if (!key) return;
    storeRef.current[key] = readFieldValue(el as any);
  };

  const attachToField = (el: Element) => {
    if (seen.has(el)) return;
    seen.add(el);
    el.addEventListener('input', onChange as any, true);
    el.addEventListener('change', onChange as any, true);
    // Restore previously-saved value, if any
    restoreFieldFromStore(el as any, storeRef.current);
  };

  // Initial pass over already-rendered fields
  doc.querySelectorAll<HTMLElement>(FORM_FIELD_SELECTOR).forEach(attachToField);

  // Observe future mutations (PDF.js renders pages on-demand)
  const MO = (win as any).MutationObserver || MutationObserver;
  const obs = new MO((mutations: MutationRecord[]) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.(FORM_FIELD_SELECTOR)) {
          attachToField(node);
        }
        const nested = node.querySelectorAll?.(FORM_FIELD_SELECTOR);
        nested?.forEach((el: Element) => attachToField(el));
      });
    });
  });
  obs.observe(doc.body, { childList: true, subtree: true });
  observerRef.current = obs;

  console.log('[XfaPdfViewer] tracker installed, initial fields:',
    doc.querySelectorAll(FORM_FIELD_SELECTOR).length);
}
