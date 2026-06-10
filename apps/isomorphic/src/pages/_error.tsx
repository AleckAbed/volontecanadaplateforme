/**
 * Minimal Pages Router error fallback.
 *
 * Next.js 15 auto-generates a default `pages/_error.js` when none is provided,
 * and that auto-generated bundle pulls in modules that crash during static
 * prerender on this codebase (React 19 + react-i18next, `Cannot read
 * properties of null (reading 'useContext')`).
 *
 * Providing this file overrides the auto-generated one with something that
 * has zero hooks / zero context and prerender-safely returns plain HTML.
 *
 * The real 404 / error UI is served from the App Router files
 * (`src/app/not-found.tsx` and `src/app/error.tsx`), which include the
 * branded MaintenanceScreen.
 */

interface ErrorPageProps {
  statusCode?: number;
}

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#fff',
      }}
    >
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, color: '#111' }}>
          {statusCode ?? 'Error'}
        </h1>
        <p style={{ color: '#666', marginTop: '1rem' }}>
          {statusCode === 404
            ? 'Page introuvable / Page not found'
            : 'Une erreur est survenue / An error occurred'}
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            background: '#b91c1c',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '0.375rem',
          }}
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
