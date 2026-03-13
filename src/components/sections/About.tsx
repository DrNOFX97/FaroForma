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
              <div className="about__image-badge">
                <div className="about__image-badge-value">15+</div>
                <div className="about__image-badge-label">
                  {language === 'pt' ? <>Anos de<br />Experiência</> : <>Years of<br />Experience</>}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Content */}
          <AnimatedSection direction="right" delay={0.2}>
            <span className="tag about__tag">{language === 'pt' ? 'Sobre Nós' : 'About Us'}</span>
            <h2 className="about__title">
              {language === 'pt' ? (
                <>O seu parceiro no<br /><span className="gradient-text">desenvolvimento e sucesso</span></>
              ) : (
                <>Your partner in<br /><span className="gradient-text">development and success</span></>
              )}
            </h2>
            <p className="about__text">
              {language === 'pt' 
                ? 'FaroForma é uma instituição dedicada ao desenvolvimento pessoal e profissional, oferecendo serviços de qualidade em formações personalizadas, aluguer de salas e apoio administrativo.'
                : 'FaroForma is an institution dedicated to personal and professional development, offering high-quality services in customised training, room hire, and administrative support.'}
            </p>
            <p className="about__text">
              {language === 'pt'
                ? 'Com uma abordagem centrada no cliente, adaptamos as nossas soluções às necessidades específicas de cada projeto, garantindo resultados eficazes e duradouros para indivíduos e empresas.'
                : 'With a client-centric approach, we adapt our solutions to the specific needs of each project, ensuring effective and lasting results for individuals and companies.'}
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
