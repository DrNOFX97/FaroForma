import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '../ui/AnimatedSection';
import { ABOUT_FEATURES as DEFAULT_FEATURES } from '../../data/about';
import sala1 from '../../assets/images/Sala1.jpg';
import sala2 from '../../assets/images/Sala2.jpg';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';

const DEFAULT_ROOM_IMAGES = [sala1, sala2];
const IMAGE_ROTATION_INTERVAL = 7000;

export default function About() {
  const [activeRoom, setActiveRoom] = useState(0);
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiService.getCMS('about').then(setData).catch(() => {});
    
    const timer = setInterval(() => {
      setActiveRoom(prev => (prev + 1) % 2);
    }, IMAGE_ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const titlePT = <>Um novo conceito de<br /><span className="gradient-text">aprendizagem em Faro</span></>;
  const titleEN = <>A new concept of<br /><span className="gradient-text">learning in Faro</span></>;

  const displayTitle = data?.title?.[language] ? (
    <div dangerouslySetInnerHTML={{ __html: data.title[language].replace('aprendizagem em Faro', '<span class="gradient-text">aprendizagem em Faro</span>').replace('learning in Faro', '<span class="gradient-text">learning in Faro</span>').replace('\n', '<br/>') }} />
  ) : (language === 'pt' ? titlePT : titleEN);

  const features = data?.features || DEFAULT_FEATURES;
  const roomImages = data?.imageSala1 || data?.imageSala2 
    ? [data.imageSala1 || sala1, data.imageSala2 || sala2]
    : DEFAULT_ROOM_IMAGES;

  return (
    <section className="section section--alt" id="sobre">
      <div className="container">
        <div className="about__grid">
          {/* Image */}
          <AnimatedSection direction="left" delay={0.1}>
            <div className="about__image-wrap">
              <div className="about__image-deco" />
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <AnimatePresence>
                  <motion.img
                    key={activeRoom}
                    className="about__image"
                    src={roomImages[activeRoom]}
                    alt="Sala de formação moderna FaroForma"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </AnimatePresence>
              </div>
            </div>
          </AnimatedSection>

          {/* Content */}
          <AnimatedSection direction="right" delay={0.2}>
            <span className="tag about__tag">{language === 'pt' ? 'Sobre Nós' : 'About Us'}</span>
            <h2 className="about__title">
              {displayTitle}
            </h2>
            <p className="about__text">
              {language === 'pt' 
                ? 'FaroForma nasce com a missão de elevar o padrão do development pessoal e profissional, oferecendo serviços de excelência em formações personalizadas, aluguer de salas e apoio administrativo.'
                : 'FaroForma was born with the mission to raise the standard of personal and professional development, offering excellence in customised training, room hire, and administrative support.'}
            </p>
            <p className="about__text">
              {language === 'pt'
                ? 'Privilegiamos a proximidade e a inovação, adaptando as nossas soluções a cada aluno e empresa para garantir um crescimento real e sustentado.'
                : 'We prioritise proximity and innovation, adapting our solutions to each student and company to ensure real and sustained growth.'}
            </p>

            <div className="about__features">
              {features.map((f: any, i: number) => (
                <div className="about__feature" key={i}>
                  <CheckCircle2 className="about__feature-icon" size={20} strokeWidth={2} />
                  <p className="about__feature-text">
                    <strong>{(f.title as any)[language]}</strong> — {(f.desc as any)[language]}
                  </p>
                </div>
              ))}
            </div>

            <div className="about__cta">
              <button
                className="btn btn--primary"
                onClick={() => document.querySelector('#contactos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {language === 'pt' ? 'Saber mais' : 'Learn more'}
              </button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
