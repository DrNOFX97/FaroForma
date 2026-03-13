import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '../ui/AnimatedSection';
import { TUTORING_SUBJECTS, TUTORING_LEVELS } from '../../data/tutoring';
import { useLanguage } from '../../context/LanguageContext';

import img1 from '../../assets/images/explicacoes1.png';
import img2 from '../../assets/images/explicacoes2.png';

const IMAGES = [img1, img2];

export default function Tutoring() {
  const { language, t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % IMAGES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="section section--alt" id="explicacoes">
      <div className="container">
        <div className="tutoring__grid">
          {/* Content */}
          <AnimatedSection direction="left" delay={0.1}>
            <span className="tag tutoring__tag">{language === 'pt' ? 'Explicações' : 'Tutoring'}</span>
            <h2 className="tutoring__title">
              {language === 'pt' ? (
                <>Apoio académico<br /><span className="gradient-text">personalizado e eficaz</span></>
              ) : (
                <>Academic support<br /><span className="gradient-text">personalised and effective</span></>
              )}
            </h2>
            <p className="tutoring__text">
              {language === 'pt'
                ? 'Oferecemos explicações desde o secundário até à universidade, com aulas personalizadas e metodologias adaptadas ao nível e objetivos de cada aluno. Os nossos professores são especialistas nas suas áreas.'
                : 'We offer tutoring from secondary school to university, with personalised classes and methodologies adapted to the level and goals of each student. Our teachers are specialists in their fields.'}
            </p>

            {/* Subjects */}
            <div className="tutoring__subjects">
              {TUTORING_SUBJECTS.map((s, i) => (
                <span key={i} className={`tutoring__subject${i === 0 ? ' tutoring__subject--active' : ''}`}>
                  <span>{s.emoji}</span>
                  {(s.label as any)[language]}
                </span>
              ))}
            </div>

            {/* Levels */}
            <div className="tutoring__levels">
              {TUTORING_LEVELS.map((l, i) => (
                <div key={i} className="tutoring__level">
                  <div className="tutoring__level-title">{(l.title as any)[language]}</div>
                  <div className="tutoring__level-desc">{(l.desc as any)[language]}</div>
                </div>
              ))}
            </div>

            <button
              className="btn btn--primary"
              onClick={() => document.querySelector('#contactos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('tutoring.mark')}
            </button>
          </AnimatedSection>

          {/* Image */}
          <AnimatedSection direction="right" delay={0.25}>
            <div className="tutoring__image-wrap">
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <AnimatePresence>
                  <motion.img
                    key={currentIdx}
                    src={IMAGES[currentIdx]}
                    alt={language === 'pt' ? 'Sessão de explicações personalizada' : 'Personalised tutoring session'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="tutoring__image"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </AnimatePresence>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
