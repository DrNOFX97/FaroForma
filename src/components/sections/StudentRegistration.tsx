import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, GraduationCap, Calendar,
  MessageSquare, Check, ChevronRight, ChevronLeft,
  Send, CheckCircle, X, Truck
} from 'lucide-react';
import AnimatedSection from '../ui/AnimatedSection';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { auth } from '../../config/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  program: string;
  turma: string;
  startDate: string;
  contactPreference: string;
  needsTransport: boolean;
  notes: string;
  termos: boolean;
}

interface Errors { [key: string]: string }

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY: FormData = {
  fullName: '', email: '', phone: '',
  program: '', turma: '', startDate: '',
  contactPreference: '',
  needsTransport: false, notes: '', termos: false,
};

const CONTACT_PREFS = [
  { pt: 'Telefone', en: 'Phone' },
  { pt: 'Email', en: 'Email' },
  { pt: 'WhatsApp', en: 'WhatsApp' },
];

const STEPS_LABELS = [
  { number: 1, label: { pt: 'Dados', en: 'Details' } },
  { number: 2, label: { pt: 'Curso', en: 'Course' } },
  { number: 3, label: { pt: 'Extra', en: 'Extra' } },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any, staggerChildren: 0.08 } },
};
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

// ── Main component ─────────────────────────────────────────────────────────────

export default function StudentRegistration() {
  const { language } = useLanguage();
  const [step, setStep]       = useState(1);
  const [dir, setDir]         = useState(1);
  const [form, setForm]       = useState<FormData>(EMPTY);
  const [errors, setErrors]   = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    apiService.getCourses().then(data => { if (data?.length) setCourses(data); }).catch(() => {});
  }, []);

  const set = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (s: number): boolean => {
    const e: Errors = {};
    if (s === 1) {
      if (!form.fullName.trim()) e.fullName = language === 'pt' ? 'Nome é necessário' : 'Name is required';
      if (!form.email.trim())    e.email    = language === 'pt' ? 'Email é necessário' : 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = language === 'pt' ? 'Email inválido' : 'Invalid email';
      if (!form.phone.trim())    e.phone    = language === 'pt' ? 'Telefone é necessário' : 'Phone is required';
    }
    if (s === 2) {
      if (!form.program)   e.program   = language === 'pt' ? 'Escolhe um curso' : 'Choose a course';
      if (!form.startDate) e.startDate = language === 'pt' ? 'Escolhe uma data' : 'Choose a date';
    }
    if (s === 3) {
      if (!form.contactPreference) e.contactPreference = language === 'pt' ? 'Escolhe uma preferência' : 'Choose a preference';
      if (!form.termos)            e.termos            = language === 'pt' ? 'Aceitação obrigatória' : 'Mandatory acceptance';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (!validate(step)) return; setDir(1);  setStep(s => s + 1); };
  const back = () => {                                setDir(-1); setStep(s => s - 1); };

  const fillWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      let phone = result.user.phoneNumber ?? '';
      if (accessToken) {
        try {
          const resp = await fetch('https://people.googleapis.com/v1/people/me?personFields=phoneNumbers', { headers: { Authorization: `Bearer ${accessToken}` } });
          const person = await resp.json();
          if (!phone && person.phoneNumbers?.[0]?.value) phone = person.phoneNumbers[0].value;
        } catch { /* non-critical */ }
      }
      setForm(prev => ({
        ...prev,
        fullName: result.user.displayName ?? prev.fullName,
        email:    result.user.email    ?? prev.email,
        ...(phone ? { phone } : {}),
      }));
      await signOut(auth);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setSubmitErr(language === 'pt' ? 'Não foi possível ligar ao Google.' : 'Could not connect to Google.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    setLoading(true);
    setSubmitErr('');
    try {
      await apiService.submitStudent({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        program: form.program,
        turma: form.turma,
        startDate: form.startDate,
        contactPreference: form.contactPreference,
        needsTransport: form.needsTransport,
        notes: form.notes,
      });
      setSuccess(true);
    } catch (err: any) {
      setSubmitErr(err.message || (language === 'pt' ? 'Ocorreu um erro técnico. Tente novamente.' : 'A technical error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Turmas do curso selecionado
  const selectedCourse = courses.find(c => (c.title?.pt || c.title) === form.program);
  const turmaOptions: string[] = selectedCourse?.schedule?.map((s: any) => s.turma?.pt || s.turma).filter(Boolean) || [];

  return (
    <section className="section registration" id="inscricoes">
      <div className="container">
        <AnimatedSection direction="left" delay={0.1}>
          <div className="registration__intro">
            <span className="tag">{language === 'pt' ? 'Inscrições' : 'Registrations'}</span>
            <h2>{language === 'pt' ? 'Garante a tua ' : 'Secure your '}<span className="gradient-text">{language === 'pt' ? 'vaga' : 'spot'}</span></h2>
            <p>{language === 'pt' ? 'Preenche o formulário em menos de 2 minutos. Entraremos em contacto nas 24h seguintes.' : 'Fill in the form in less than 2 minutes. We will get in touch within 24 hours.'}</p>
          </div>
        </AnimatedSection>

        <AnimatedSection direction="right" delay={0.2}>
          {success ? (
            <motion.div
              className="sr-success-card glass"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
              <div className="sr-success-icon">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                  <CheckCircle size={48} className="text-accent" />
                </motion.div>
              </div>
              <h3 className="gradient-text">{language === 'pt' ? 'Inscrição Enviada!' : 'Registration Sent!'}</h3>
              <p>{language === 'pt' ? <>Obrigado, <strong>{form.fullName.split(' ')[0]}</strong>. Receberás uma confirmação por email e entraremos em contacto brevemente.</> : <>Thank you, <strong>{form.fullName.split(' ')[0]}</strong>. You will receive a confirmation email and we will be in touch soon.</>}</p>
              <button className="btn btn--outline" onClick={() => { setSuccess(false); setStep(1); setForm(EMPTY); }}>
                {language === 'pt' ? 'Nova inscrição' : 'New registration'}
              </button>
            </motion.div>
          ) : (
            <div className="sr-wizard">
              {/* Progress */}
              <div className="sr-progress">
                <div className="sr-progress__track">
                  <motion.div className="sr-progress__fill" animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.5, ease: 'easeInOut' }} />
                </div>
                <div className="sr-progress__steps">
                  {STEPS_LABELS.map(s => (
                    <div key={s.number} className={`sr-progress__step ${step >= s.number ? 'is-active' : ''}`}>
                      <div className="sr-progress__dot">
                        {step > s.number ? <Check size={14} /> : <span>{s.number}</span>}
                      </div>
                      <span className="sr-progress__label">{(s.label as any)[language]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card */}
              <div className="sr-card glass">
                <form onSubmit={e => e.preventDefault()}>
                  <AnimatePresence mode="wait" custom={dir}>
                    <motion.div
                      key={step}
                      custom={dir}
                      initial={{ opacity: 0, x: dir > 0 ? 24 : -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: dir > 0 ? -24 : 24 }}
                      transition={{ duration: 0.28, ease: 'easeInOut' }}
                    >
                      {step === 1 && <Step1 form={form} errors={errors} set={set} language={language} onGoogle={fillWithGoogle} />}
                      {step === 2 && <Step2 form={form} errors={errors} set={set} language={language} courses={courses} turmaOptions={turmaOptions} />}
                      {step === 3 && <Step3 form={form} errors={errors} set={set} language={language} />}
                    </motion.div>
                  </AnimatePresence>

                  {/* Nav */}
                  <div className="sr-nav">
                    <button type="button" className="btn btn--outline" onClick={back} disabled={step === 1 || loading}>
                      <ChevronLeft size={16} /> {language === 'pt' ? 'Anterior' : 'Previous'}
                    </button>
                    <div className="sr-nav__dots">
                      {STEPS_LABELS.map(s => <div key={s.number} className={`sr-nav__dot ${step === s.number ? 'is-active' : ''}`} />)}
                    </div>
                    {step < 3 ? (
                      <button type="button" className="btn btn--primary" onClick={next}>
                        {language === 'pt' ? 'Próximo' : 'Next'} <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button type="button" className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? (language === 'pt' ? 'A enviar...' : 'Sending...') : <>{language === 'pt' ? 'Finalizar' : 'Submit'} <Send size={16} /></>}
                      </button>
                    )}
                  </div>

                  {submitErr && (
                    <motion.div className="sr-error-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <X size={14} /> {submitErr}
                    </motion.div>
                  )}
                </form>
              </div>
            </div>
          )}
        </AnimatedSection>
      </div>

      <style>{SR_STYLES}</style>
    </section>
  );
}

// ── Step sub-components ────────────────────────────────────────────────────────

function Step1({ form, errors, set, language, onGoogle }: any) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h3 variants={itemVariants} className="sr-step-title">{language === 'pt' ? 'Dados Pessoais' : 'Personal Details'}</motion.h3>
      <motion.p variants={itemVariants} className="sr-step-sub">{language === 'pt' ? 'Começa por te identificar. Podes usar o Google para preencher automaticamente.' : 'Start by identifying yourself. You can use Google to fill in automatically.'}</motion.p>

      <motion.div variants={itemVariants}>
        <button type="button" onClick={onGoogle} className="btn btn--google" style={{ marginBottom: '1.75rem' }}>
          <GoogleIcon /> {language === 'pt' ? 'Preencher com Google' : 'Fill with Google'}
        </button>
      </motion.div>

      <div className="form__grid">
        <motion.div variants={itemVariants} className="form__group form__group--full">
          <label className="form__label"><User size={13} /> {language === 'pt' ? 'Nome Completo' : 'Full Name'}</label>
          <input type="text" className={`form__input ${errors.fullName ? 'error' : ''}`} placeholder={language === 'pt' ? 'Ex: Maria Santos' : 'e.g. Maria Santos'} value={form.fullName} onChange={e => set('fullName', e.target.value)} />
          {errors.fullName && <span className="sr-error">{errors.fullName}</span>}
        </motion.div>

        <motion.div variants={itemVariants} className="form__group">
          <label className="form__label"><Mail size={13} /> Email</label>
          <input type="email" className={`form__input ${errors.email ? 'error' : ''}`} placeholder="email@exemplo.com" value={form.email} onChange={e => set('email', e.target.value)} />
          {errors.email && <span className="sr-error">{errors.email}</span>}
        </motion.div>

        <motion.div variants={itemVariants} className="form__group">
          <label className="form__label"><Phone size={13} /> {language === 'pt' ? 'Telemóvel' : 'Mobile'}</label>
          <input type="tel" className={`form__input ${errors.phone ? 'error' : ''}`} placeholder="9XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
          {errors.phone && <span className="sr-error">{errors.phone}</span>}
        </motion.div>
      </div>
    </motion.div>
  );
}

function Step2({ form, errors, set, language, courses, turmaOptions }: any) {
  const programOptions: string[] = courses.map((c: any) => c.title?.pt || c.title).filter(Boolean);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h3 variants={itemVariants} className="sr-step-title">{language === 'pt' ? 'Escolha do Curso' : 'Course Selection'}</motion.h3>
      <motion.p variants={itemVariants} className="sr-step-sub">{language === 'pt' ? 'Qual o curso e turma que pretendes?' : 'Which course and class are you interested in?'}</motion.p>

      <div className="form__grid">
        <motion.div variants={itemVariants} className="form__group form__group--full">
          <label className="form__label"><GraduationCap size={13} /> {language === 'pt' ? 'Curso' : 'Course'}</label>
          <select className={`form__input ${errors.program ? 'error' : ''}`} value={form.program} onChange={e => { set('program', e.target.value); set('turma', ''); }}>
            <option value="">{language === 'pt' ? '— selecionar —' : '— select —'}</option>
            {programOptions.map((p: string) => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.program && <span className="sr-error">{errors.program}</span>}
        </motion.div>

        {turmaOptions.length > 0 && (
          <motion.div variants={itemVariants} className="form__group">
            <label className="form__label">{language === 'pt' ? 'Turma' : 'Class'}</label>
            <select className="form__input" value={form.turma} onChange={e => set('turma', e.target.value)}>
              <option value="">{language === 'pt' ? '— qualquer —' : '— any —'}</option>
              {turmaOptions.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="form__group">
          <label className="form__label"><Calendar size={13} /> {language === 'pt' ? 'Data de Início Pretendida' : 'Preferred Start Date'}</label>
          <input type="date" className={`form__input ${errors.startDate ? 'error' : ''}`} value={form.startDate} min={new Date().toISOString().split('T')[0]} onChange={e => set('startDate', e.target.value)} />
          {errors.startDate && <span className="sr-error">{errors.startDate}</span>}
        </motion.div>
      </div>
    </motion.div>
  );
}

function Step3({ form, errors, set, language }: any) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.h3 variants={itemVariants} className="sr-step-title">{language === 'pt' ? 'Preferências' : 'Preferences'}</motion.h3>
      <motion.p variants={itemVariants} className="sr-step-sub">{language === 'pt' ? 'Como preferes que entremos em contacto?' : 'How do you prefer we get in touch?'}</motion.p>

      <motion.div variants={itemVariants} className="form__group">
        <label className="form__label">{language === 'pt' ? 'Contacto Preferido' : 'Preferred Contact'}</label>
        <div className="sr-check-grid">
          {CONTACT_PREFS.map(p => (
            <button key={p.pt} type="button" className={`sr-check-item ${form.contactPreference === p[language as 'pt' | 'en'] ? 'is-selected' : ''}`} onClick={() => set('contactPreference', p[language as 'pt' | 'en'])}>
              <div className="sr-check-box">{form.contactPreference === p[language as 'pt' | 'en'] && <Check size={12} />}</div>
              {p[language as 'pt' | 'en']}
            </button>
          ))}
        </div>
        {errors.contactPreference && <span className="sr-error">{errors.contactPreference}</span>}
      </motion.div>

      <motion.div variants={itemVariants} className="form__group">
        <button type="button" className={`sr-check-item sr-check-item--wide ${form.needsTransport ? 'is-selected' : ''}`} onClick={() => set('needsTransport', !form.needsTransport)}>
          <div className="sr-check-box">{form.needsTransport && <Check size={12} />}</div>
          <Truck size={15} />
          <span>{language === 'pt' ? 'Necessito de transporte (+2,50 € por viagem/dia)' : 'I need transport (+€2.50 per trip/day)'}</span>
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="form__group">
        <label className="form__label"><MessageSquare size={13} /> {language === 'pt' ? 'Notas adicionais (opcional)' : 'Additional notes (optional)'}</label>
        <textarea className="form__textarea" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={language === 'pt' ? 'Alguma informação adicional que queiras partilhar...' : 'Any additional information you would like to share...'} />
      </motion.div>

      <motion.div variants={itemVariants} style={{ marginTop: '0.5rem' }}>
        <button type="button" className={`sr-check-item sr-check-item--wide ${form.termos ? 'is-selected' : ''}`} onClick={() => set('termos', !form.termos)} style={{ border: !form.termos && errors.termos ? '1px solid #ef4444' : '' }}>
          <div className="sr-check-box">{form.termos && <Check size={12} />}</div>
          <span style={{ fontSize: '0.85rem' }}>{language === 'pt' ? 'Aceito o processamento dos meus dados para efeitos de inscrição.' : 'I accept the processing of my data for registration purposes.'}</span>
        </button>
        {errors.termos && <span className="sr-error">{errors.termos}</span>}
      </motion.div>
    </motion.div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const SR_STYLES = `
  .sr-wizard { max-width: 640px; margin: 0 auto; }
  .sr-progress { margin-bottom: 2.5rem; position: relative; }
  .sr-progress__track { height: 3px; background: var(--border); border-radius: 2px; position: absolute; top: 17px; left: 8%; right: 8%; z-index: 0; }
  .sr-progress__fill { height: 100%; background: var(--accent); border-radius: 2px; }
  .sr-progress__steps { display: flex; justify-content: space-between; position: relative; z-index: 1; }
  .sr-progress__step { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .sr-progress__dot { width: 36px; height: 36px; border-radius: 50%; background: var(--bg-2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem; font-weight: 700; transition: all 0.3s; }
  .sr-progress__step.is-active .sr-progress__dot { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 0 16px var(--accent-glow); }
  .sr-progress__label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
  .sr-progress__step.is-active .sr-progress__label { color: var(--text); }
  .sr-card { padding: 2.5rem; border-radius: var(--radius-xl); }
  .sr-step-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.4rem; letter-spacing: -0.02em; }
  .sr-step-sub { color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem; }
  .sr-nav { margin-top: 2.5rem; padding-top: 1.75rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .sr-nav__dots { display: flex; gap: 0.4rem; }
  .sr-nav__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: all 0.3s; }
  .sr-nav__dot.is-active { background: var(--accent); width: 18px; border-radius: 3px; }
  .sr-error { color: #ef4444; font-size: 0.75rem; margin-top: 0.3rem; font-weight: 500; display: block; }
  .sr-error-msg { margin-top: 1.25rem; background: rgba(239,68,68,0.1); color: #ef4444; padding: 0.65rem 1rem; border-radius: var(--radius); font-size: 0.82rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
  .sr-check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.65rem; margin: 1rem 0; }
  .sr-check-item { padding: 0.75rem 1rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-1); color: var(--text-muted); font-size: 0.88rem; font-weight: 500; display: flex; align-items: center; gap: 0.65rem; transition: all 0.2s; text-align: left; cursor: pointer; }
  .sr-check-item:hover { border-color: var(--accent); background: var(--bg-2); }
  .sr-check-item.is-selected { border-color: var(--accent); background: rgba(16,185,129,0.08); color: var(--text); }
  .sr-check-item--wide { width: 100%; }
  .sr-check-box { width: 17px; height: 17px; border-radius: 4px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
  .is-selected .sr-check-box { background: var(--accent); border-color: var(--accent); color: #fff; }
  .sr-success-card { text-align: center; padding: 4rem 2.5rem; border-radius: var(--radius-xl); max-width: 520px; margin: 0 auto; }
  .sr-success-icon { margin-bottom: 1.5rem; display: flex; justify-content: center; }
  .sr-success-card h3 { font-size: 2rem; font-weight: 900; margin-bottom: 1rem; }
  .sr-success-card p { color: var(--text-muted); line-height: 1.6; margin-bottom: 2rem; }
  @media (max-width: 640px) {
    .sr-card { padding: 1.5rem; }
    .sr-progress__label { display: none; }
    .sr-progress__track { left: 4%; right: 4%; }
  }
`;
