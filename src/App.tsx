import { useState, useEffect } from 'react';
import { Navbar, Footer } from './components/layout';
import { Hero, About, Services, Tutoring, Contact, Courses } from './components/sections';
import FormadoresInscricao from './pages/FormadoresInscricao';

export type Page = 'home' | 'formadores';

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [page, setPage] = useState<Page>(() =>
    window.location.pathname === '/formadores' ? 'formadores' : 'home'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const navigate = (p: Page) => {
    setPage(p);
    window.history.pushState({}, '', p === 'home' ? '/' : `/${p}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPop = () =>
      setPage(window.location.pathname === '/formadores' ? 'formadores' : 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      <Navbar
        isDark={isDark}
        onThemeToggle={() => setIsDark(v => !v)}
        currentPage={page}
        onNavigate={navigate}
      />
      {page === 'home' ? (
        <main>
          <Hero />
          <About />
          <Services />
          <Courses />
          <Tutoring />
          <Contact />
        </main>
      ) : (
        <FormadoresInscricao onNavigateHome={() => navigate('home')} />
      )}
      <Footer />
    </>
  );
}
