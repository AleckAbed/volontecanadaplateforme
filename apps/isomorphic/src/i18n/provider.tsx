'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Lazy-mounts react-i18next's `I18nextProvider` on the client only.
 *
 * Why : Next.js 15 + React 19 + react-i18next 15 combine badly during static
 * prerender of auto-generated error pages — `useContext` resolves to null and
 * the build fails with `Cannot read properties of null (reading 'useContext')`.
 *
 * Solution : import the provider via `useState` + dynamic `import()` so the
 * react-i18next module is never pulled into the SSR / prerender graph. During
 * the initial server pass we return children as-is; `useTranslation()` returns
 * the keys as fallback for the very first render only.
 */
export default function I18nProvider({ children }: { children: ReactNode }) {
  const [bundle, setBundle] = useState<null | {
    Provider: any;
    instance: any;
  }>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ I18nextProvider }, mod] = await Promise.all([
        import('react-i18next'),
        import('./index'),
      ]);
      if (cancelled) return;
      const instance = mod.default;
      const lang = mod.getCurrentLanguage();
      if (instance.language !== lang) {
        try { await instance.changeLanguage(lang); } catch {}
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
      setBundle({ Provider: I18nextProvider, instance });
    })();
    return () => { cancelled = true; };
  }, []);

  if (!bundle) return <>{children}</>;
  const { Provider, instance } = bundle;
  return <Provider i18n={instance}>{children}</Provider>;
}
