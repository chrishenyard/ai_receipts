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
    <div className="min-h-screen bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]">
      <header className="p-8 text-center text-white">
        <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold md:text-[2.5rem]">AI Receipts Scanner</h1>
            <p className="text-[1.1rem] opacity-90">Upload a receipt image to extract and manage receipt data</p>
          </div>

          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium
                       backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-4 focus:ring-white/20"
            aria-label="Toggle dark mode"
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

      <main className="mx-auto max-w-[1400px] p-8 md:p-8">
        <ReceiptScanner />
      </main>
    </div>
  );
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m9.9 9.9 1.414 1.414M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 0 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
    </svg>
  );
}

export default App;
