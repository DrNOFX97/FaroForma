import { useState, useEffect } from 'react';
import { Navbar, Footer } from './components/layout';
import { Hero, About, Services, Tutoring, Contact, Courses } from './components/sections';
import FormadoresInscricao from './pages/FormadoresInscricao';
import Admin from './pages/Admin';
import { getSiteMeta, DEFAULT_SITE_META } from './config/siteMeta';

export type Page = 'home' | 'formadores' | 'admin';

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [meta, setMeta] = useState(DEFAULT_SITE_META);
  const [page, setPage] = useState<Page>(() => {
    const path = window.location.pathname;
    if (path === '/formadores') return 'formadores';
    if (path === '/admin') return 'admin';
    return 'home';
  });

  useEffect(() => {
    getSiteMeta().then(setMeta);
  }, []);

  useEffect(() => {
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);
    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords) keywords.setAttribute('content', meta.keywords);
  }, [meta]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const navigate = (p: Page) => {
    setPage(p);
    window.history.pushState({}, '', p === 'home' ? '/' : `/${p}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (path === '/formadores') setPage('formadores');
      else if (path === '/admin') setPage('admin');
      else setPage('home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Hide Layout for Admin
  if (page === 'admin') {
    return <Admin />;
  }

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
