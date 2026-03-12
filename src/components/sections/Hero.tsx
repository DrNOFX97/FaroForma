import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { HERO_STATS } from '../../data/hero';

const ease = [0.4, 0, 0.2, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial:    { opacity: 0, y: 30 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  } as const;
}

export default function Hero() {
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="hero">
      {/* Background */}
      <div className="hero__bg">
        <div className="hero__grid" />
        <div className="hero__mesh" />
      </div>

      <div className="hero__inner container">
        <div className="hero__content">
          {/* Eyebrow */}
          <motion.div className="hero__eyebrow" {...fadeUp(0)}>
            <div className="hero__eyebrow-line" />
            <span className="hero__eyebrow-text">
              <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
              Faro, Portugal · Desde 2009
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1 className="hero__title" {...fadeUp(0.12)}>
            Formação que<br />
            <span className="gradient-text">transforma</span><br />
            carreiras.
          </motion.h1>

          {/* Subtitle */}
          <motion.p className="hero__subtitle" {...fadeUp(0.24)}>
            FaroForma oferece formações personalizadas, apoio administrativo e
            explicações do secundário à universidade. Qualidade comprovada, resultados reais.
          </motion.p>

          {/* CTAs */}
          <motion.div className="hero__actions" {...fadeUp(0.36)}>
            <button className="btn btn--gold btn--lg" onClick={() => scrollTo('#cursos')}>
              Ver Cursos
            </button>
            <button className="btn btn--primary btn--lg" onClick={() => scrollTo('#servicos')}>
              Ver Serviços
            </button>
            <button className="btn btn--outline btn--lg" onClick={() => scrollTo('#contactos')}>
              Falar Connosco
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div className="hero__stats" {...fadeUp(0.48)}>
            {HERO_STATS.map((s, i) => (
              <div key={i}>
                <div className="hero__stat-value">
                  {s.value}<span>{s.suffix}</span>
                </div>
                <div className="hero__stat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        className="hero__scroll"
        onClick={() => scrollTo('#sobre')}
        aria-label="Scroll para baixo"
      >
        <div className="hero__scroll-arrow" />
        <span>Descobrir</span>
      </button>
    </section>
  );
}
