import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, GraduationCap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { SERVICES as DEFAULT_SERVICES } from '../../data/services';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';

export default function Services() {
  const { language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiService.getCMS('services').then(setData).catch(() => {});
  }, []);

  const services = data?.items || DEFAULT_SERVICES;

  return (
    <section className="section" id="servicos">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          ref={ref}
        >
          <span className="tag">{language === 'pt' ? 'Serviços' : 'Services'}</span>
          <h2>
            {language === 'pt' ? (
              <>Tudo o que precisa<br /><span className="gradient-text">num único lugar</span></>
            ) : (
              <>Everything you need<br /><span className="gradient-text">in one place</span></>
            )}
          </h2>
          <p>
            {language === 'pt'
              ? 'Oferecemos uma gama completa de serviços de formação e administração, adaptados às necessidades de empresas e particulares.'
              : 'We offer a complete range of training and administration services, adapted to the needs of companies and individuals.'}
          </p>
        </motion.div>

        <div className="services__grid">
          {services.map((s: any, i: number) => (
            <motion.div
              key={i}
              className="service-card"
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 + 0.15, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="service-card__glow" />
              <div className="service-card__icon">
                {s.icon && (LucideIcons as any)[s.icon] ? (
                  React.createElement((LucideIcons as any)[s.icon], { size: 24 })
                ) : (
                  s.icon && typeof s.icon !== 'string' ? s.icon : <GraduationCap size={24} />
                )}
              </div>
              <h3 className="service-card__title">{(s.title as any)[language]}</h3>
              <p className="service-card__desc">{(s.desc as any)[language]}</p>
              <button 
                className="service-card__arrow"
                onClick={() => document.querySelector('#contactos')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {language === 'pt' ? 'Saber mais' : 'Learn more'} <ArrowRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
