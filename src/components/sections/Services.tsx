import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SERVICES } from '../../data/services';

export default function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

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
          <span className="tag">Serviços</span>
          <h2>
            Tudo o que precisa<br />
            <span className="gradient-text">num único lugar</span>
          </h2>
          <p>
            Oferecemos uma gama completa de serviços de formação e administração,
            adaptados às necessidades de empresas e particulares.
          </p>
        </motion.div>

        <div className="services__grid">
          {SERVICES.map((s, i) => (
            <motion.div
              key={i}
              className="service-card"
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 + 0.15, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="service-card__glow" />
              <div className="service-card__icon">{s.icon}</div>
              <h3 className="service-card__title">{s.title}</h3>
              <p className="service-card__desc">{s.desc}</p>
              <div className="service-card__arrow">
                Saber mais <ArrowRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
