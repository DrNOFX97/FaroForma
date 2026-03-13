import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Send, CheckCircle, Navigation } from 'lucide-react';
import AnimatedSection from '../ui/AnimatedSection';
import { CONTACT_CARDS } from '../../data/contactInfo';
import { useLanguage } from '../../context/LanguageContext';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}


const INITIAL: FormData = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const { language, t } = useLanguage();
  const DEST = 'Rua Conselheiro Sebasti\u00e3o Teles 2A, 8000 Faro, Portugal';

  const openDirections = () => {
    const destEncoded = encodeURIComponent(DEST);
    if (!navigator.geolocation) {
      window.open(`https://www.google.com/maps/dir//${destEncoded}`, '_blank');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = `${coords.latitude},${coords.longitude}`;
        window.open(
          `https://www.google.com/maps/dir/${origin}/${destEncoded}`,
          '_blank',
        );
      },
      () => {
        // Permission denied or error — open without origin
        window.open(`https://www.google.com/maps/dir//${destEncoded}`, '_blank');
      },
    );
  };

  const [form, setForm]       = useState<FormData>(INITIAL);
  const [errors, setErrors]   = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())    e.name    = language === 'pt' ? 'O nome é obrigatório.' : 'Name is required.';
    if (!form.email.trim())   e.email   = language === 'pt' ? 'O email é obrigatório.' : 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              e.email   = language === 'pt' ? 'Email inválido.' : 'Invalid email.';
    if (!form.message.trim()) e.message = language === 'pt' ? 'A mensagem é obrigatória.' : 'Message is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitErr('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setSuccess(true);
        setForm(INITIAL);
      } else {
        const body = await response.json().catch(() => ({}));
        setSubmitErr((body as { error?: string }).error ?? t('contact.form.error'));
      }
    } catch {
      setSubmitErr(t('contact.form.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" id="contactos">
      <div className="container">
        <motion.div
          ref={ref}
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="tag">{language === 'pt' ? 'Contactos' : 'Contacts'}</span>
          <h2>
            {language === 'pt' ? (
              <>Estamos aqui<br /><span className="gradient-text">para o ajudar</span></>
            ) : (
              <>We are here<br /><span className="gradient-text">to help you</span></>
            )}
          </h2>
          <p>{t('contact.subtitle')}</p>
        </motion.div>

        <div className="contact__grid">
          {/* Info */}
          <AnimatedSection direction="left" delay={0.15}>
            <h3 className="contact__info-title">{language === 'pt' ? 'Informação de Contacto' : 'Contact Information'}</h3>
            <p className="contact__info-sub">
              {language === 'pt' 
                ? 'Visite-nos presencialmente, ligue-nos ou envie uma mensagem. A nossa equipa está disponível para o receber.'
                : 'Visit us in person, call us, or send a message. Our team is available to welcome you.'}
            </p>
            <div className="contact__info-cards">
              {CONTACT_CARDS.map((c, i) => (
                <div key={i} className="contact__info-card">
                  <div className="contact__info-card-icon">{c.icon}</div>
                  <div>
                    <div className="contact__info-card-label">{(c.label as any)[language] || c.label}</div>
                    <div className="contact__info-card-value">
                      {c.isLink ? (
                        <a href={c.href} target="_blank" rel="noopener noreferrer">
                          {c.value}
                        </a>
                      ) : (
                        c.value.split('\n').map((line, j) => (
                          <span key={j} style={{ display: 'block' }}>
                            {c.isPhone ? (
                              <a href={`tel:${line.replace(/\s/g, '')}`}>{line}</a>
                            ) : line}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map embed */}
            <div style={{ marginTop: '2rem', position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', height: 200 }}>
              <iframe
                title="Localização FaroForma"
                width="100%"
                height="200"
                style={{ display: 'block' }}
                src="https://maps.google.com/maps?q=Rua+Conselheiro+Sebasti%C3%A3o+Teles+2A,+8000+Faro,+Portugal&output=embed&z=16"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* Directions overlay */}
              <button
                onClick={openDirections}
                style={{
                  position: 'absolute', bottom: '0.75rem', left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.1rem',
                  background: 'rgba(2,6,23,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '100px',
                  color: 'var(--accent)',
                  fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Navigation size={14} />
                {language === 'pt' ? 'Como chegar' : 'Directions'}
              </button>
            </div>
          </AnimatedSection>

          {/* Form */}
          <AnimatedSection direction="right" delay={0.25}>
            <div className="contact__form-wrap">
              {success ? (
                <div className="form__success">
                  <div className="form__success-icon">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="form__success-title">{language === 'pt' ? 'Mensagem enviada!' : 'Message sent!'}</h3>
                  <p className="form__success-sub">
                    {language === 'pt' ? 'Obrigado pelo contacto. Responderemos brevemente.' : 'Thank you for contacting us. We will reply soon.'}
                  </p>
                  <button className="btn btn--outline btn--sm" onClick={() => setSuccess(false)}>
                    {language === 'pt' ? 'Enviar outra mensagem' : 'Send another message'}
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="contact__form-title">{language === 'pt' ? 'Envie-nos uma mensagem' : 'Send us a message'}</h3>
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="form__grid">
                      {/* Name */}
                      <div className="form__group">
                        <label className="form__label" htmlFor="name">
                          {t('contact.form.name')} <span>*</span>
                        </label>
                        <input
                          id="name" name="name" type="text"
                          className={`form__input${errors.name ? ' error' : ''}`}
                          placeholder={language === 'pt' ? 'O seu nome' : 'Your name'}
                          value={form.name}
                          onChange={handleChange}
                          autoComplete="name"
                        />
                        {errors.name && <p className="form__error">{errors.name}</p>}
                      </div>

                      {/* Email */}
                      <div className="form__group">
                        <label className="form__label" htmlFor="email">
                          {t('contact.form.email')} <span>*</span>
                        </label>
                        <input
                          id="email" name="email" type="email"
                          className={`form__input${errors.email ? ' error' : ''}`}
                          placeholder="email@example.com"
                          value={form.email}
                          onChange={handleChange}
                          autoComplete="email"
                        />
                        {errors.email && <p className="form__error">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div className="form__group">
                        <label className="form__label" htmlFor="phone">{t('contact.form.phone')}</label>
                        <input
                          id="phone" name="phone" type="tel"
                          className="form__input"
                          placeholder="9XX XXX XXX"
                          value={form.phone}
                          onChange={handleChange}
                          autoComplete="tel"
                        />
                      </div>

                      {/* Subject */}
                      <div className="form__group">
                        <label className="form__label" htmlFor="subject">{t('contact.form.subject')}</label>
                        <select
                          id="subject" name="subject"
                          className="form__input"
                          value={form.subject}
                          onChange={handleChange}
                          style={{ appearance: 'none' }}
                        >
                          <option value="">{language === 'pt' ? 'Selecionar assunto…' : 'Select subject…'}</option>
                          <option value="formacao">{language === 'pt' ? 'Formações Personalizadas' : 'Customised Training'}</option>
                          <option value="sala-reunioes">{language === 'pt' ? 'Aluguer Sala Reuniões' : 'Meeting Room Hire'}</option>
                          <option value="sala-formacao">{language === 'pt' ? 'Aluguer Sala Formação' : 'Training Room Hire'}</option>
                          <option value="administracao">{language === 'pt' ? 'Administração de Empresas' : 'Business Administration'}</option>
                          <option value="explicacoes">{language === 'pt' ? 'Explicações' : 'Tutoring'}</option>
                          <option value="outro">{language === 'pt' ? 'Outro' : 'Other'}</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div className="form__group form__group--full">
                        <label className="form__label" htmlFor="message">
                          {t('contact.form.message')} <span>*</span>
                        </label>
                        <textarea
                          id="message" name="message"
                          className={`form__textarea${errors.message ? ' error' : ''}`}
                          placeholder={language === 'pt' ? 'Descreva como podemos ajudar…' : 'Describe how we can help…'}
                          value={form.message}
                          onChange={handleChange}
                        />
                        {errors.message && <p className="form__error">{errors.message}</p>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn--primary btn--lg form__submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            animation: 'spin 0.7s linear infinite',
                            display: 'inline-block',
                          }} />
                          {t('contact.form.sending')}
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          {t('contact.form.send')}
                        </>
                      )}
                    </button>

                    {submitErr && (
                      <p className="form__error" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        {submitErr}
                      </p>
                    )}
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </form>
                </>
              )}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
