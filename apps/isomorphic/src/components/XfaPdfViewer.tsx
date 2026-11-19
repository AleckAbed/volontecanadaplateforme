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
  /** Appelé à chaque changement d'un champ du PDF (correspondance : relier une case en cliquant). */
  onFieldChange?: (info: PdfFieldChange) => void;
  className?: string;
}

/** Champ du PDF qui vient de changer, avec ce qu'il faut pour le reproduire au préremplissage. */
export interface PdfFieldChange {
  kind: 'checkbox' | 'radio' | 'select' | 'text';
  /** Clé du champ dans les valeurs du visualiseur (sans préfixe). */
  domKey: string;
  /** Clé du stockage pdf.js (à préfixer par __as__), si le champ en a une. */
  storageKey: string | null;
  checked: boolean;
  /** Valeur que pdf.js enregistre pour ce champ coché ou cette option. */
  storageValue: any;
  value: string;
  label: string;
  /** « focus » : le champ vient d'être cliqué ; « change » : sa valeur a changé. */
  event: 'focus' | 'change';
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
  onFieldChange,
  className = '',
}: XfaPdfViewerProps) {
  const onFieldChangeRef = useRef(onFieldChange);
  onFieldChangeRef.current = onFieldChange;
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
        // On attend la page qui porte CE fichier : si le PDF change (nouveau rendu), l'ancienne
        // page reste prête un instant et on y installerait le suivi et le préremplissage.
        waitForViewerReady(iframeRef.current!, params.toString())
          .then((win) => {
            if (cancelled) return;
            if (initialFormData) {
              restoreAnnotationStorage(win, initialFormData);
            }
            installInputTracker(win, formValuesRef, seenInputsRef.current, observerRef, onFieldChangeRef);

            // Kick off render-all in the background — don't block applyDom on it.
            renderAllPages(win).catch(() => {});

            // Push values into the actual DOM inputs (PDF.js doesn't display
            // annotationStorage values in XFA mode). Retry repeatedly because
            // PDF.js re-renders pages and wipes our changes.
            if (initialFormData && Object.keys(initialFormData).length > 0) {
              const applyAndLog = () => {
                // Dès que l'utilisateur a modifié un champ, on ne réapplique plus rien.
                if ((win as any).__xfaUserEdited) return;
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
          .catch((e: any) => console.warn('[XfaPdfViewer] setup failed:', e));
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

      const formData = sanitizeFormData({ ...formValuesRef.current });
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
 * Nettoie le payload avant de le sauvegarder OU avant de le réinjecter
 * dans pdf.js. Stratégie :
 *  - On garde les valeurs lisibles (clés sans préfixe ou avec préfixe `pdfjs_internal_id_`)
 *  - On garde les __as__KEY mais on RETIRE `borderColor` qui déclenche
 *    `ColorConverters["RGB_HTML"] is not a function` (bug pdf.js) et casse
 *    la couche d'annotations au prochain rendu.
 *  - On retire aussi `formattedValue` qui n'apporte rien et peut interférer.
 */
function sanitizeFormData(input: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      // Copie sans borderColor ni formattedValue (champs problématiques)
      const cleaned: Record<string, any> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k === 'borderColor' || k === 'formattedValue') continue;
        cleaned[k] = v;
      }
      out[key] = cleaned;
    } else {
      out[key] = raw;
    }
  }
  return out;
}

/**
 * Restore previously-saved values into PDF.js's annotationStorage so that
 * XFA-rendered fields pick them up on draw, regardless of which page
 * gets rendered first.
 */
function restoreAnnotationStorage(win: any, values: Record<string, any>): void {
  try {
    const storage = win?.PDFViewerApplication?.pdfDocument?.annotationStorage;
    if (!storage || typeof storage.setValue !== 'function') return;
    // Sanitize avant injection : élimine les borderColor qui crashent pdf.js
    const clean = sanitizeFormData(values);
    let restored = 0;
    Object.entries(clean).forEach(([key, value]) => {
      if (!key.startsWith('__as__')) return;
      const realKey = key.slice('__as__'.length);
      try {
        // Liste préremplie : l'option exacte est choisie plus tard, d'après ses libellés.
        storage.setValue(realKey, value && typeof value === 'object' && Array.isArray((value as any).choices) ? { value: (value as any).value } : value);
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
    const storage = win?.PDFViewerApplication?.pdfDocument?.annotationStorage;

    Object.entries(values).forEach(([rawKey, raw]) => {
      if (!rawKey.startsWith('__as__')) return;
      const key = rawKey.slice('__as__'.length);

      // PDF.js value objects are typically: { value: 'X' } or { value: true } or { value: ['a','b'] }
      const value = (raw && typeof raw === 'object' && 'value' in raw) ? (raw as any).value : raw;

      // Valeur déjà changée dans le stockage (saisie de l'utilisateur, option déjà choisie) : on n'y touche plus.
      try {
        const current = storage?.getValue?.(key, { value: undefined })?.value;
        if (current !== undefined && JSON.stringify(current) !== JSON.stringify(value)) return;
      } catch {}

      const el = findFieldElement(doc, key);
      if (!el) return;
      try {
        const tag = el.tagName.toLowerCase();
        const input = el as HTMLInputElement;
        if (raw && typeof raw === 'object' && Array.isArray((raw as any).choices) && tag === 'select') {
          const option = matchOption(el as HTMLSelectElement, (raw as any).choices);
          if (option === null) return;
          (el as HTMLSelectElement).value = option;
          storage?.setValue?.(key, { value: option });
        } else if (tag === 'input' && (input.type === 'checkbox' || input.type === 'radio') && input.hasAttribute('xfaOn')) {
          // XFA : la case est cochée si la valeur est celle « cochée » de cette case.
          input.checked = String(value) === input.getAttribute('xfaOn');
        } else {
          applyFieldValue(el as any, value);
        }
        applied++;
      } catch {}
    });
  } catch (e) {
    console.warn('[XfaPdfViewer] applyAnnotationsToDom error:', e);
  }
  return applied;
}

/**
 * Élément de saisie d'une clé du stockage pdf.js : id, attribut « fieldid » (XFA),
 * « data-element-id » (AcroForm ; en XFA il est sur le conteneur du champ), ou nom.
 */
function findFieldElement(doc: Document, key: string): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
  const isField = (n: Element | null) => !!n && n.matches(FORM_FIELD_SELECTOR);
  const byId = doc.getElementById(key);
  if (isField(byId)) return byId as any;
  const k = cssEscape(key);
  const byFieldId = doc.querySelector(`.xfaLayer [fieldid="${k}"]`);
  if (isField(byFieldId)) return byFieldId as any;
  const byElementId = doc.querySelector(`[data-element-id="${k}"]`);
  if (isField(byElementId)) return byElementId as any;
  const inner = byElementId?.querySelector('input, textarea, select');
  if (inner && isField(inner)) return inner as any;
  return doc.querySelector(FORM_FIELD_SELECTOR.split(',').map((s) => `${s}[name="${k}"]`).join(',')) as any;
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
function waitForViewerReady(iframe: HTMLIFrameElement, expectedQuery?: string, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const win = iframe.contentWindow as any;
      const app = win?.PDFViewerApplication;
      let current = true;
      try { current = !expectedQuery || String(win?.location?.search ?? '').includes(expectedQuery); } catch { current = false; }
      if (current && app?.pdfDocument && win.document?.querySelector(FORM_FIELD_SELECTOR)) {
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
    // Préremplissage d'une liste : { choices: [valeur, libellés…] }.
    if (value && typeof value === 'object' && Array.isArray(value.choices)) {
      if (tag === 'select') {
        const option = matchOption(el as HTMLSelectElement, value.choices);
        if (option !== null) (el as HTMLSelectElement).value = option;
      } else if ((el as HTMLInputElement).type !== 'checkbox' && (el as HTMLInputElement).type !== 'radio') {
        el.value = String(value.choices[0] ?? '');
      }
      return;
    }
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

const normalizeLabel = (s: string) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Option d'une liste qui correspond à l'une des valeurs (code ou libellé), sans tenir compte
 * de la casse ni des accents : valeur exacte, puis texte exact, puis mot entier du texte
 * (« Male » dans « M Male »).
 */
export function matchOption(sel: HTMLSelectElement, candidates: string[]): string | null {
  const options = Array.from(sel.options);
  const wanted = candidates.map(normalizeLabel).filter(Boolean);
  for (const c of wanted) {
    const o = options.find((opt) => normalizeLabel(opt.value) === c);
    if (o) return o.value;
  }
  for (const c of wanted) {
    const o = options.find((opt) => normalizeLabel(opt.textContent ?? '') === c);
    if (o) return o.value;
  }
  for (const c of wanted.filter((w) => w.length >= 3)) {
    const o = options.find((opt) => ` ${normalizeLabel(opt.textContent ?? '')} `.includes(` ${c} `));
    if (o) return o.value;
  }
  return null;
}

/** Décrit un champ qui vient de changer (voir PdfFieldChange). */
function describeField(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, event: 'focus' | 'change' = 'change'): PdfFieldChange {
  const tag = el.tagName.toLowerCase();
  const xfa = !!el.closest('.xfaLayer');
  // AcroForm : « data-element-id » sur le champ ; XFA : « fieldid ».
  const storageKey = el.getAttribute('data-element-id') || el.getAttribute('fieldid');
  const base = { domKey: fieldKey(el), storageKey, checked: false, value: '', label: '', event };
  if (tag === 'select') {
    const sel = el as HTMLSelectElement;
    const opt = sel.options[sel.selectedIndex];
    return { ...base, kind: 'select', value: sel.value, label: opt?.textContent?.trim() ?? '', storageValue: { value: sel.value } };
  }
  const input = el as HTMLInputElement;
  if (input.type === 'checkbox' || input.type === 'radio') {
    // XFA : pdf.js enregistre la valeur « cochée » propre à la case ; AcroForm : true.
    const on = xfa ? input.getAttribute('xfaOn') : true;
    return { ...base, kind: input.type, checked: input.checked, value: String(on ?? ''), storageValue: { value: on } };
  }
  return { ...base, kind: 'text', value: input.value, storageValue: { value: input.value } };
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
    const fields: NodeListOf<HTMLInputElement> = win.document.querySelectorAll(FORM_FIELD_SELECTOR);
    fields.forEach((el: HTMLInputElement) => {
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
  changeRef?: { current: ((info: PdfFieldChange) => void) | undefined },
): void {
  const doc: Document = win.document;
  if (!doc) return;

  const onChange = (evt: Event) => {
    const el = evt.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!el || !(el as Element).matches?.(FORM_FIELD_SELECTOR)) return;
    if (evt.isTrusted) (win as any).__xfaUserEdited = true;
    // Un seul signal par changement (« input » et « change » arrivent tous deux).
    // Avant le test de la clé : en XFA, les champs n'ont souvent ni id ni nom (clé « fieldid »).
    if (evt.type === 'change' && changeRef?.current) {
      try { changeRef.current(describeField(el)); } catch {}
    }
    const key = fieldKey(el);
    if (!key) return;
    storeRef.current[key] = readFieldValue(el as any);
  };

  const attachToField = (el: Element) => {
    if (seen.has(el)) return;
    seen.add(el);
    el.addEventListener('input', onChange as any, true);
    el.addEventListener('change', onChange as any, true);
    el.addEventListener('focus', () => {
      if (changeRef?.current) {
        try { changeRef.current(describeField(el as any, 'focus')); } catch {}
      }
    });
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
        // Pas « instanceof Element » : les nœuds de l'iframe viennent d'un autre contexte JS.
        if (node.nodeType !== 1) return;
        const added = node as Element;
        if (added.matches?.(FORM_FIELD_SELECTOR)) {
          attachToField(added);
        }
        const nested = added.querySelectorAll?.(FORM_FIELD_SELECTOR);
        nested?.forEach((el: Element) => attachToField(el));
      });
    });
  });
  obs.observe(doc.body, { childList: true, subtree: true });
  observerRef.current = obs;

  console.log('[XfaPdfViewer] tracker installed, initial fields:',
    doc.querySelectorAll(FORM_FIELD_SELECTOR).length);
}
