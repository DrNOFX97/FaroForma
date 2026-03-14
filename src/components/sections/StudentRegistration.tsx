import { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import AnimatedSection from '../ui/AnimatedSection';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { auth, googleProvider } from '../../config/firebase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

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

  const fillWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setForm(f => ({
        ...f,
        fullName: result.user.displayName ?? f.fullName,
        email: result.user.email ?? f.email,
      }));
      await signOut(auth);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setSubmitErr(language === 'pt' ? 'Não foi possível ligar ao Google.' : 'Could not connect to Google.');
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitErr('');
    try {
      await apiService.submitStudent(form);
      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err: any) {
      setSubmitErr(err.message || (language === 'pt' ? 'Ocorreu um erro técnico. Tente novamente.' : 'A technical error occurred. Please try again.'));
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
            <>
              <button type="button" onClick={fillWithGoogle} className="btn btn--google" style={{ marginBottom: '1.5rem' }}>
                <GoogleIcon /> {language === 'pt' ? 'Preencher com Google' : 'Fill with Google'}
              </button>
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
                    min={new Date().toISOString().split('T')[0]}
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
            </>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
}
