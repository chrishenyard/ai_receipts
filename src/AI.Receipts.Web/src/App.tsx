import { useEffect, useState } from 'react';
import ReceiptScanner from './components/ReceiptScanner';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full
                     bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_60%)]
                     blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_60%)]"
        />
        <div
          className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full
                     bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_60%)]
                     blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_60%)]"
        />
      </div>

      {/* Header */}
      <header className="border-b border-black/5 bg-white/70 backdrop-blur
                         dark:border-white/10 dark:bg-slate-950/50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-8 py-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Receipt Scanner
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Extract, review, and save receipt data.
            </p>
          </div>

          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2
                       text-sm font-medium text-slate-700 shadow-sm transition
                       hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10
                       dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <>
                <SunIcon className="h-5 w-5" /> Light
              </>
            ) : (
              <>
                <MoonIcon className="h-5 w-5" /> Dark
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[1400px] p-8">
        <ReceiptScanner />
      </main>
    </div>
  );
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2m0 14v2m9-9h-2M5 12H3
           m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414
           m0-11.314L7.05 7.05m9.9 9.9 1.414 1.414
           M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.8A8.5 8.5 0 0 1 11.2 3
           a7 7 0 1 0 9.8 9.8Z"
      />
    </svg>
  );
}

export default App;
