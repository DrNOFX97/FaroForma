import { useState, useEffect } from 'react';
import { Navbar, Footer } from './components/layout';
import { Hero, About, Services, Tutoring, Contact, Courses } from './components/sections';
import FormadoresInscricao from './pages/FormadoresInscricao';
import Admin from './pages/Admin';
import { Toaster } from 'react-hot-toast';
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
    if (page === 'admin') return;

    const pageMeta = page === 'formadores'
      ? {
          title: 'Candidatura de Formadores | FaroForma — Faro',
          description: 'Candidate-se como formador no FaroForma em Faro. Junte-se à nossa equipa de formadores certificados e contribua para a formação e ensino na região do Algarve.',
          canonical: 'https://www.faroforma.pt/formadores',
        }
      : {
          title: meta.title,
          description: meta.description,
          canonical: 'https://www.faroforma.pt/',
        };

    document.title = pageMeta.title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', pageMeta.description);

    const keywords = document.querySelector('meta[name="keywords"]');
    if (keywords && page === 'home') keywords.setAttribute('content', meta.keywords);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', pageMeta.canonical);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', pageMeta.canonical);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageMeta.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pageMeta.description);
  }, [meta, page]);

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
    return (
      <>
        <Admin />
        <Toaster position="bottom-right" toastOptions={{ className: 'glass', style: { background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '0.9rem', padding: '12px 20px', borderRadius: 'var(--radius)' } }} />
      </>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{ className: 'glass', style: { background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '0.9rem', padding: '12px 20px', borderRadius: 'var(--radius)' } }} />
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
          <Courses />
          <Services />
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
