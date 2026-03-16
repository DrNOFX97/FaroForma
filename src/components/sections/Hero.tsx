import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { HERO_STATS } from '../../data/hero';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { useState, useEffect } from 'react';

const ease = [0.4, 0, 0.2, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial:    { opacity: 0, y: 30 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  } as const;
}

export default function Hero() {
  const { language, t } = useLanguage();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiService.getCMS('hero').then(setData).catch(() => {});
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const titlePT = <>Formação em <span className="gradient-text">Faro</span><br />que potencia o seu futuro.</>;
  const titleEN = <>Training in <span className="gradient-text">Faro</span><br />that boosts your future.</>;

  const displayTitle = data?.title?.[language] ? (
    <div dangerouslySetInnerHTML={{ __html: data.title[language].replace('Faro', '<span class="gradient-text">Faro</span>').replace('\n', '<br/>') }} />
  ) : (language === 'pt' ? titlePT : titleEN);

  const displaySubtitle = data?.subtitle?.[language] || (language === 'pt' 
    ? 'FaroForma oferece formações personalizadas, apoio administrativo e explicações do secundário à universidade. Excelência e proximidade em Faro.'
    : 'FaroForma offers tailored training, administrative support, and tutoring from secondary school to university. Excellence and proximity in Faro.');

  return (
    <section className="hero" id="hero">
      <div className="hero__bg">
        <div className="hero__grid" />
        <div className="hero__mesh" />
      </div>

      <div className="hero__inner container">
        <div className="hero__content">
          <motion.div className="hero__eyebrow" {...fadeUp(0)}>
            <div className="hero__eyebrow-line" />
            <span className="hero__eyebrow-text">
              <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
              Faro, Portugal
            </span>
          </motion.div>

          <motion.h1 className="hero__title" {...fadeUp(0.12)}>
            {displayTitle}
          </motion.h1>

          <motion.p className="hero__subtitle" {...fadeUp(0.24)}>
            {displaySubtitle}
          </motion.p>

          <motion.div className="hero__actions" {...fadeUp(0.36)}>
            <button className="btn btn--gold btn--lg" onClick={() => scrollTo('#cursos')}>
              {data?.buttonCursos || t('hero.ver_cursos')}
            </button>
            <button className="btn btn--primary btn--lg" onClick={() => scrollTo('#servicos')}>
              {data?.buttonServicos || t('hero.ver_servicos')}
            </button>
            <button className="btn btn--outline btn--lg" onClick={() => scrollTo('#contactos')}>
              {t('hero.falar_connosco')}
            </button>
          </motion.div>

          {HERO_STATS.length > 0 && (
            <motion.div className="hero__stats" {...fadeUp(0.48)}>
              {HERO_STATS.map((s, i) => (
                <div key={i}>
                  <div className="hero__stat-value">
                    {s.value}<span>{s.suffix}</span>
                  </div>
                  <div className="hero__stat-label">{(s.label as any)[language]}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <button className="hero__scroll" onClick={() => scrollTo('#sobre')} aria-label={language === 'pt' ? 'Scroll para baixo' : 'Scroll down'}>
        <div className="hero__scroll-arrow" />
        <span>{language === 'pt' ? 'Descobrir' : 'Discover'}</span>
      </button>
    </section>
  );
}
