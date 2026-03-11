import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AnimatedSection from '../ui/AnimatedSection';
import { ABOUT_FEATURES } from '../../data/about';
import sala1 from '../../assets/images/Sala1.jpg';
import sala2 from '../../assets/images/Sala2.jpg';

const ROOM_IMAGES = [sala1, sala2];
const IMAGE_ROTATION_INTERVAL = 3000;

export default function About() {
  const [activeRoom, setActiveRoom] = useState(0);

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
                <div className="about__image-badge-label">Anos de<br />Experiência</div>
              </div>
            </div>
          </AnimatedSection>

          {/* Content */}
          <AnimatedSection direction="right" delay={0.2}>
            <span className="tag about__tag">Sobre Nós</span>
            <h2 className="about__title">
              O seu parceiro no<br />
              <span className="gradient-text">desenvolvimento e sucesso</span>
            </h2>
            <p className="about__text">
              FaroForma é uma instituição dedicada ao desenvolvimento
              pessoal e profissional, oferecendo serviços de qualidade em formações
              personalizadas, aluguer de salas e apoio administrativo.
            </p>
            <p className="about__text">
              Com uma abordagem centrada no cliente, adaptamos as nossas soluções às
              necessidades específicas de cada projeto, garantindo resultados eficazes e
              duradouros para indivíduos e empresas.
            </p>

            <div className="about__features">
              {ABOUT_FEATURES.map((f, i) => (
                <div className="about__feature" key={i}>
                  <CheckCircle2 className="about__feature-icon" size={20} strokeWidth={2} />
                  <p className="about__feature-text">
                    <strong>{f.title}</strong> — {f.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="about__cta">
              <button
                className="btn btn--primary"
                onClick={() => document.querySelector('#contactos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Saber mais
              </button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
