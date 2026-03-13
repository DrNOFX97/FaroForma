import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AnimatedSection from '../ui/AnimatedSection';
import { ABOUT_FEATURES } from '../../data/about';
import sala1 from '../../assets/images/Sala1.jpg';
import sala2 from '../../assets/images/Sala2.jpg';
import { useLanguage } from '../../context/LanguageContext';

const ROOM_IMAGES = [sala1, sala2];
const IMAGE_ROTATION_INTERVAL = 7000;

export default function About() {
  const [activeRoom, setActiveRoom] = useState(0);
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveRoom(prev => (prev + 1) % ROOM_IMAGES.length);
    }, IMAGE_ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="section section--alt" id="sobre">
      <div className="container">
        <div className="about__grid">
          {/* Image */}
          <AnimatedSection direction="left" delay={0.1}>
            <div className="about__image-wrap">
              <div className="about__image-deco" />
              <img
                className="about__image"
                src={ROOM_IMAGES[activeRoom]}
                alt="Sala de formação moderna FaroForma"
                loading="lazy"
              />
            </div>
          </AnimatedSection>

          {/* Content */}
          <AnimatedSection direction="right" delay={0.2}>
            <span className="tag about__tag">{language === 'pt' ? 'Sobre Nós' : 'About Us'}</span>
            <h2 className="about__title">
              {language === 'pt' ? (
                <>Um novo conceito de<br /><span className="gradient-text">aprendizagem em Faro</span></>
              ) : (
                <>A new concept of<br /><span className="gradient-text">learning in Faro</span></>
              )}
            </h2>
            <p className="about__text">
              {language === 'pt' 
                ? 'FaroForma nasce com a missão de elevar o padrão do desenvolvimento pessoal e profissional, oferecendo serviços de excelência em formações personalizadas, aluguer de salas e apoio administrativo.'
                : 'FaroForma was born with the mission to raise the standard of personal and professional development, offering excellence in customised training, room hire, and administrative support.'}
            </p>
            <p className="about__text">
              {language === 'pt'
                ? 'Privilegiamos a proximidade e a inovação, adaptando as nossas soluções a cada aluno e empresa para garantir um crescimento real e sustentado.'
                : 'We prioritise proximity and innovation, adapting our solutions to each student and company to ensure real and sustained growth.'}
            </p>

            <div className="about__features">
              {ABOUT_FEATURES.map((f, i) => (
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
