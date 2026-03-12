import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ArrowLeft, UserCheck } from 'lucide-react';
import { NAV_LINKS } from '../../data/navLinks';
import logo from '../../assets/images/logo.png';
import type { Page } from '../../App';

interface NavbarProps {
  isDark: boolean;
  onThemeToggle: () => void;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navbar({ isDark, onThemeToggle, currentPage, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    if (currentPage !== 'home') { onNavigate('home'); setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 400); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const goHome = () => { setMobileOpen(false); onNavigate('home'); };
  const goFormadores = () => { setMobileOpen(false); onNavigate('formadores'); };

  return (
    <motion.header
      className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="container navbar__inner">
        {/* Logo */}
        <button className="navbar__logo" onClick={goHome}>
          <img src={logo} alt="FaroForma" className="navbar__logo-img" />
        </button>

        {/* Desktop nav */}
        <nav className="navbar__links">
          {currentPage === 'home' ? (
            <>
              {NAV_LINKS.map(link => (
                <button key={link.href} className="navbar__link" onClick={() => scrollTo(link.href)}>
                  {link.label}
                </button>
              ))}
              <button className="btn btn--gold btn--sm" onClick={goFormadores} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={15} />
                Inscrição Formadores
              </button>
              <button className="btn btn--primary btn--sm" onClick={() => scrollTo('#contactos')}>
                Contacte-nos
              </button>
            </>
          ) : (
            <button className="navbar__link" onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={16} />
              Voltar ao início
            </button>
          )}
        </nav>

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={onThemeToggle} aria-label={isDark ? 'Modo claro' : 'Modo escuro'}>
          <motion.div
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.div>
        </button>

        {/* Mobile toggle */}
        <button className="navbar__hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="navbar__mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentPage === 'home' ? (
              <>
                {NAV_LINKS.map((link, i) => (
                  <motion.button key={link.href} className="navbar__mobile-link" onClick={() => scrollTo(link.href)}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.05 }}>
                    {link.label}
                  </motion.button>
                ))}
                <div style={{ padding: '0.75rem 2rem' }}>
                  <button className="btn btn--gold" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }} onClick={goFormadores}>
                    <UserCheck size={16} /> Inscrição Formadores
                  </button>
                  <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => scrollTo('#contactos')}>
                    Contacte-nos
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 2rem 1.25rem' }}>
                <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'center' }} onClick={goHome}>
                  <ArrowLeft size={16} /> Voltar ao início
                </button>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
