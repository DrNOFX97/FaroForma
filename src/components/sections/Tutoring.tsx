import AnimatedSection from '../ui/AnimatedSection';
import { TUTORING_SUBJECTS, TUTORING_LEVELS } from '../../data/tutoring';

export default function Tutoring() {
  return (
    <section className="section section--alt" id="explicacoes">
      <div className="container">
        <div className="tutoring__grid">
          {/* Content */}
          <AnimatedSection direction="left" delay={0.1}>
            <span className="tag tutoring__tag">Explicações</span>
            <h2 className="tutoring__title">
              Apoio académico<br />
              <span className="gradient-text">personalizado e eficaz</span>
            </h2>
            <p className="tutoring__text">
              Oferecemos explicações desde o secundário até à universidade, com aulas
              personalizadas e metodologias adaptadas ao nível e objetivos de cada aluno.
              Os nossos professores são especialistas nas suas áreas.
            </p>

            {/* Subjects */}
            <div className="tutoring__subjects">
              {TUTORING_SUBJECTS.map((s, i) => (
                <span key={i} className={`tutoring__subject${i === 0 ? ' tutoring__subject--active' : ''}`}>
                  <span>{s.emoji}</span>
                  {s.label}
                </span>
              ))}
            </div>

            {/* Levels */}
            <div className="tutoring__levels">
              {TUTORING_LEVELS.map((l, i) => (
                <div key={i} className="tutoring__level">
                  <div className="tutoring__level-title">{l.title}</div>
                  <div className="tutoring__level-desc">{l.desc}</div>
                </div>
              ))}
            </div>

            <button
              className="btn btn--primary"
              onClick={() => document.querySelector('#contactos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Marcar explicação
            </button>
          </AnimatedSection>

          {/* Image */}
          <AnimatedSection direction="right" delay={0.25}>
            <div className="tutoring__image-wrap">
              <img
                className="tutoring__image"
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b6174?w=800&q=80&auto=format&fit=crop"
                alt="Sessão de explicações personalizada"
                loading="lazy"
              />
              <div className="tutoring__card-float">
                <div className="tutoring__card-float-icon">🎓</div>
                <div className="tutoring__card-float-title">Taxa de Aprovação</div>
                <div className="tutoring__card-float-sub" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.4rem' }}>
                  98%
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> dos alunos</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
