import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, Users, Award, Target } from 'lucide-react';
import AnimatedSection from '../ui/AnimatedSection';
import { COURSE_INFO } from '../../data/courses';
import type { CourseHighlight } from '../../data/courses';

export default function Courses() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    level: COURSE_INFO.schedule[0].turma,
  });
  const [formSuccess, setFormSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(true);
  };

  return (
    <section className="section section--alt" id="cursos">
      <div className="container">
        <motion.div
          ref={ref}
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="tag">Cursos</span>
          <h2>
            {COURSE_INFO.title}<br />
            <span className="gradient-text">{COURSE_INFO.subtitle}</span>
          </h2>
          <p>
            {COURSE_INFO.description}<br />
            <strong>{COURSE_INFO.status}</strong>
          </p>
        </motion.div>

        <div className="courses__grid">
          <AnimatedSection direction="left" delay={0.15}>
              <div className="courses__highlights">
                {COURSE_INFO.highlights.map((item: CourseHighlight) => (
                  <div key={item.text} className="courses__highlight">
                    <span className="courses__highlight-icon">
                      {{
                        MessageCircle: <MessageCircle size={16} />,
                        Users: <Users size={16} />,
                        Award: <Award size={16} />,
                        Bullseye: <Target size={16} />,
                      }[item.icon]}
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            <div className="courses__contact">
              <div className="courses__cta">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={() => {
                    setModalOpen(true);
                    setFormSuccess(false);
                  }}
                >
                  Inscrever-me
                </button>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right" delay={0.25}>
            <div className="courses__schedule">
              <h3>Horários das Turmas</h3>
              <div className="courses__table">
                <div className="courses__row is-header">
                  <span>Turma</span>
                  <span>Período</span>
                  <span>Horário</span>
                  <span>Dias</span>
                </div>
                {COURSE_INFO.schedule.map(slot => (
                  <div key={slot.turma} className="courses__row">
                    <span>{slot.turma}</span>
                    <span>{slot.período}</span>
                    <span>{slot.horário}</span>
                    <span>{slot.dias}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
        {modalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar formulário"
              >
                ×
              </button>
              <h3>Formulário de Inscrição</h3>
              {formSuccess ? (
                <div className="modal-success">
                  <p>Obrigado! Recebemos a sua inscrição e em breve entraremos em contacto.</p>
                  <button type="button" className="btn btn--primary" onClick={() => setModalOpen(false)}>
                    Fechar
                  </button>
                </div>
              ) : (
                <form className="modal-form" onSubmit={handleSubmit}>
                  <label>
                    Nome completo
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Telemóvel
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    Turma
                    <select name="level" value={formData.level} onChange={handleChange}>
                      {COURSE_INFO.schedule.map(slot => (
                        <option key={slot.turma} value={slot.turma}>
                          {slot.turma} · {slot.período}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn btn--primary btn--lg">
                    Enviar inscrição
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
