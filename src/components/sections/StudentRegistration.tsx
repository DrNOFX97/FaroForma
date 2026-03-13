import { useState } from 'react';
import AnimatedSection from '../ui/AnimatedSection';
import { useLanguage } from '../../context/LanguageContext';

const PROGRAMS_LIST = [
  { pt: 'Formações Personalizadas Business', en: 'Customised Business Training' },
  { pt: 'Explicações Secundário e Universidade', en: 'Secondary and University Tutoring' },
  { pt: 'Administração e Apoio Administrativo', en: 'Business and Administrative Support' },
  { pt: 'Cursos de Português para Estrangeiros (PLA)', en: 'Portuguese Courses for Foreigners (PLA)' },
];

const CONTACT_PREFERENCES_LIST = [
  { pt: 'Telefone', en: 'Phone' },
  { pt: 'Email', en: 'Email' },
  { pt: 'WhatsApp', en: 'WhatsApp' },
];

export default function StudentRegistration() {
  const { language, t } = useLanguage();
  
  const PROGRAMS = PROGRAMS_LIST.map(p => p[language]);
  const CONTACT_PREFERENCES = CONTACT_PREFERENCES_LIST.map(p => p[language]);

  const INITIAL_FORM = {
    fullName: '',
    email: '',
    phone: '',
    program: PROGRAMS[0],
    startDate: '',
    contactPreference: CONTACT_PREFERENCES[0],
    notes: '',
  };

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = language === 'pt' ? 'Como te queres chamar?' : 'How would you like to be called?';
    if (!form.email.trim()) nextErrors.email = language === 'pt' ? 'Precisamos de um email.' : 'We need an email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = language === 'pt' ? 'O email parece inválido.' : 'The email looks invalid.';
    if (!form.phone.trim()) nextErrors.phone = language === 'pt' ? 'Um número facilita a marcação.' : 'A number makes booking easier.';
    if (!form.startDate) nextErrors.startDate = language === 'pt' ? 'Escolhe uma data preferida.' : 'Choose a preferred date.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange =
    (field: keyof typeof INITIAL_FORM) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: event.target.value }));
      if (errors[field]) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitErr('');
    try {
      const response = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setSuccess(true);
        setForm(INITIAL_FORM);
      } else {
        const body = await response.json().catch(() => ({}));
        setSubmitErr((body as { error?: string }).error ?? (language === 'pt' ? 'Ocorreu um erro técnico. Tente novamente.' : 'A technical error occurred. Please try again.'));
      }
    } catch {
      setSubmitErr(language === 'pt' ? 'Ocorreu um erro técnico. Tente novamente.' : 'A technical error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section registration" id="inscricoes">
      <div className="container">
        <AnimatedSection direction="left" delay={0.1}>
          <div className="registration__intro">
            <span className="tag">{language === 'pt' ? 'Inscrições' : 'Registrations'}</span>
            <h2>{t('student.form.title')}</h2>
            <p>{t('student.form.subtitle')}</p>
          </div>
        </AnimatedSection>
        <AnimatedSection direction="right" delay={0.2}>
          {success ? (
            <div className="registration__success">
              <p>
                {language === 'pt' 
                  ? 'Inscrição enviada com sucesso! Receberás confirmação por email em breve.'
                  : 'Registration sent successfully! You will receive confirmation by email soon.'}
              </p>
              <button className="btn btn--outline btn--sm" onClick={() => setSuccess(false)}>
                {language === 'pt' ? 'Nova inscrição' : 'New registration'}
              </button>
            </div>
          ) : (
            <form className="registration__form" onSubmit={handleSubmit} noValidate>
              <div className="registration__grid">
                <label className="registration__field">
                  {language === 'pt' ? 'Nome completo*' : 'Full name*'}
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    aria-invalid={Boolean(errors.fullName)}
                  />
                  {errors.fullName && <span className="registration__error">{errors.fullName}</span>}
                </label>
                <label className="registration__field">
                  {language === 'pt' ? 'Email profissional ou pessoal*' : 'Professional or personal email*'}
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && <span className="registration__error">{errors.email}</span>}
                </label>
                <label className="registration__field">
                  {language === 'pt' ? 'Telemóvel / Contacto*' : 'Mobile / Contact*'}
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && <span className="registration__error">{errors.phone}</span>}
                </label>
                <label className="registration__field">
                  {t('student.form.program')}
                  <select value={form.program} onChange={handleChange('program')}>
                    {PROGRAMS.map(program => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="registration__field">
                  {t('student.form.start')}*
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={handleChange('startDate')}
                    aria-invalid={Boolean(errors.startDate)}
                  />
                  {errors.startDate && <span className="registration__error">{errors.startDate}</span>}
                </label>
                <label className="registration__field">
                  {t('student.form.preference')}
                  <select value={form.contactPreference} onChange={handleChange('contactPreference')}>
                    {CONTACT_PREFERENCES.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="registration__field registration__field--full">
                  {language === 'pt' ? 'Como podemos ajudar?' : 'How can we help?'}
                  <textarea value={form.notes} onChange={handleChange('notes')} rows={4} />
                </label>
              </div>
              <div className="registration__actions">
                <button className="btn btn--primary btn--lg" type="submit" disabled={loading}>
                  {loading 
                    ? (language === 'pt' ? 'Registando...' : 'Registering...') 
                    : t('student.form.register')}
                </button>
                <p className="registration__hint">
                  {language === 'pt' 
                    ? 'Recebes confirmação com os próximos passos dentro de 24h úteis.'
                    : 'You will receive confirmation with next steps within 24 business hours.'}
                </p>
                {submitErr && <p className="registration__error">{submitErr}</p>}
              </div>
            </form>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
}
