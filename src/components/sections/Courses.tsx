import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, Users, Award, Target } from 'lucide-react';
import AnimatedSection from '../ui/AnimatedSection';
import { COURSE_INFO } from '../../data/courses';
import type { CourseHighlight } from '../../data/courses';
import { useLanguage } from '../../context/LanguageContext';

export default function Courses() {
  const { language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    level: (COURSE_INFO.schedule[0].turma as any)[language],
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
          <span className="tag">{language === 'pt' ? 'Cursos' : 'Courses'}</span>
          <h2>
            {COURSE_INFO.title[language]}<br />
            <span className="gradient-text">{COURSE_INFO.subtitle[language]}</span>
          </h2>
          <p>
            {COURSE_INFO.description[language]}<br />
            <strong>{COURSE_INFO.status[language]}</strong>
          </p>
        </motion.div>

        <div className="courses__grid">
          <AnimatedSection direction="left" delay={0.15}>
              <div className="courses__highlights">
                {COURSE_INFO.highlights.map((item: CourseHighlight, i: number) => (
                  <div key={i} className="courses__highlight">
                    <span className="courses__highlight-icon">
                      {{
                        MessageCircle: <MessageCircle size={16} />,
                        Users: <Users size={16} />,
                        Award: <Award size={16} />,
                        Bullseye: <Target size={16} />,
                      }[item.icon]}
                    </span>
                    <span>{item.text[language]}</span>
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
                  {language === 'pt' ? 'Inscrever-me' : 'Enrol now'}
                </button>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right" delay={0.25}>
            <div className="courses__schedule">
              <h3>{language === 'pt' ? 'Horários das Turmas' : 'Class Schedules'}</h3>
              <div className="courses__table">
                <div className="courses__row is-header">
                  <span>{language === 'pt' ? 'Turma' : 'Class'}</span>
                  <span>{language === 'pt' ? 'Período' : 'Period'}</span>
                  <span>{language === 'pt' ? 'Horário' : 'Schedule'}</span>
                  <span>{language === 'pt' ? 'Dias' : 'Days'}</span>
                </div>
                {COURSE_INFO.schedule.map((slot, i) => (
                  <div key={i} className="courses__row">
                    <span>{(slot.turma as any)[language]}</span>
                    <span>{(slot.período as any)[language]}</span>
                    <span>{slot.horário}</span>
                    <span>{(slot.dias as any)[language]}</span>
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
                aria-label={language === 'pt' ? 'Fechar formulário' : 'Close form'}
              >
                ×
              </button>
              <h3>{language === 'pt' ? 'Formulário de Inscrição' : 'Enrolment Form'}</h3>
              {formSuccess ? (
                <div className="modal-success">
                  <p>
                    {language === 'pt' 
                      ? 'Obrigado! Recebemos a sua inscrição e em breve entraremos em contacto.'
                      : 'Thank you! We have received your enrolment and will be in touch soon.'}
                  </p>
                  <button type="button" className="btn btn--primary" onClick={() => setModalOpen(false)}>
                    {language === 'pt' ? 'Fechar' : 'Close'}
                  </button>
                </div>
              ) : (
                <form className="modal-form" onSubmit={handleSubmit}>
                  <label>
                    {language === 'pt' ? 'Nome completo' : 'Full name'}
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    {language === 'pt' ? 'Email' : 'Email'}
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    {language === 'pt' ? 'Telemóvel' : 'Mobile'}
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    {language === 'pt' ? 'Turma' : 'Class'}
                    <select name="level" value={formData.level} onChange={handleChange}>
                      {COURSE_INFO.schedule.map((slot, i) => (
                        <option key={i} value={(slot.turma as any)[language]}>
                          {(slot.turma as any)[language]} · {(slot.período as any)[language]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn btn--primary btn--lg">
                    {language === 'pt' ? 'Enviar inscrição' : 'Send enrolment'}
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
