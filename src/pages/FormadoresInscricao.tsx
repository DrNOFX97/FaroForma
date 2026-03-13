import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Hash,
  Briefcase, GraduationCap, Globe,
  CalendarDays, Monitor, Shuffle, MessageSquare,
  ChevronRight, ChevronLeft, Send, CheckCircle, Check,
  X, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface WizardData {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  nif: string;
  areas: string[];
  habilitacoes: string;
  capCcp: string;
  experiencia: string;
  linkedin: string;
  dias: string[];
  periodos: string[];
  modalidade: string;
  motivacao: string;
  termos: boolean;
}

interface WizardErrors { [key: string]: string }

interface Props { onNavigateHome: () => void }

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY: WizardData = {
  nome: '', email: '', telefone: '', dataNascimento: '', nif: '',
  areas: [], habilitacoes: '', capCcp: '', experiencia: '', linkedin: '',
  dias: [], periodos: [], modalidade: '', motivacao: '', termos: false,
};

const AREAS_LIST = [
  { pt: 'Formações Empresariais', en: 'Business Training' },
  { pt: 'Línguas Estrangeiras', en: 'Foreign Languages' },
  { pt: 'TI e Informática', en: 'IT and Informatics' },
  { pt: 'Saúde e Bem-Estar', en: 'Health and Wellbeing' },
  { pt: 'Artes e Criatividade', en: 'Arts and Creativity' },
  { pt: 'Ciências e Tecnologia', en: 'Science and Technology' },
  { pt: 'Explicações (secundário)', en: 'Tutoring (Secondary)' },
  { pt: 'Explicações (universitário)', en: 'Tutoring (University)' },
];

const DIAS_LIST = [
  { pt: 'Segunda', en: 'Monday' },
  { pt: 'Terça', en: 'Tuesday' },
  { pt: 'Quarta', en: 'Wednesday' },
  { pt: 'Quinta', en: 'Thursday' },
  { pt: 'Sexta', en: 'Friday' },
  { pt: 'Sábado', en: 'Saturday' },
];

const PERIODOS_LIST = [
  { pt: 'Manhã (09h–13h)', en: 'Morning (09h–13h)' },
  { pt: 'Tarde (13h–18h)', en: 'Afternoon (13h–18h)' },
  { pt: 'Noite (18h–21h)', en: 'Evening (18h–21h)' },
];

const MODALIDADES_LIST = [
  { value: 'presencial', label: { pt: 'Presencial', en: 'In-person' }, icon: <CalendarDays className="w-5 h-5" /> },
  { value: 'online',     label: { pt: 'Online', en: 'Online' },     icon: <Monitor className="w-5 h-5" />      },
  { value: 'hibrida',    label: { pt: 'Híbrida', en: 'Hybrid' },    icon: <Shuffle className="w-5 h-5" />      },
];

const STEPS_LABELS = [
  { number: 1, label: { pt: 'Perfil', en: 'Profile' }, icon: <User className="w-4 h-4" /> },
  { number: 2, label: { pt: 'Expertise', en: 'Expertise' }, icon: <Briefcase className="w-4 h-4" /> },
  { number: 3, label: { pt: 'Agenda', en: 'Schedule' }, icon: <Calendar className="w-4 h-4" /> },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function FormadoresInscricao({ onNavigateHome }: Props) {
  const { language, t } = useLanguage();
  const [step, setStep]         = useState(1);
  const [dir, setDir]           = useState(1);
  const [data, setData]         = useState<WizardData>(EMPTY);
  const [errors, setErrors]     = useState<WizardErrors>({});
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const set = (field: keyof WizardData, value: WizardData[keyof WizardData]) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggle = (field: 'areas' | 'dias' | 'periodos', val: string) => {
    setData(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (s: number): boolean => {
    const e: WizardErrors = {};
    if (s === 1) {
      if (!data.nome.trim())    e.nome    = language === 'pt' ? 'Nome é necessário' : 'Name is required';
      if (!data.email.trim())   e.email   = language === 'pt' ? 'Email é necessário' : 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = language === 'pt' ? 'Email inválido' : 'Invalid email';
      if (!data.telefone.trim()) e.telefone = language === 'pt' ? 'Telefone é necessário' : 'Phone is required';
    }
    if (s === 2) {
      if (data.areas.length === 0) e.areas = language === 'pt' ? 'Selecione pelo menos uma área' : 'Select at least one area';
      if (!data.habilitacoes)  e.habilitacoes = language === 'pt' ? 'Selecione as habilitações' : 'Select qualifications';
      if (!data.capCcp)        e.capCcp = language === 'pt' ? 'Indique se possui CAP/CCP' : 'Indicate if you have CAP/CCP';
    }
    if (s === 3) {
      if (data.dias.length === 0)    e.dias    = language === 'pt' ? 'Selecione a disponibilidade' : 'Select availability';
      if (data.periodos.length === 0) e.periodos = language === 'pt' ? 'Selecione o período' : 'Select period';
      if (!data.modalidade)          e.modalidade = language === 'pt' ? 'Escolha a modalidade' : 'Choose modality';
      if (!data.motivacao.trim())    e.motivacao  = language === 'pt' ? 'Escreva brevemente a sua motivação' : 'Briefly write your motivation';
      if (!data.termos)              e.termos     = language === 'pt' ? 'Aceitação obrigatória' : 'Mandatory acceptance';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (!validate(step)) return; setDir(1);  setStep(s => s + 1); };
  const back = () => {                                setDir(-1); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    setLoading(true);
    setSubmitErr('');
    try {
      const response = await fetch('/api/inscricao-formadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setSuccess(true);
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

  if (success) {
    return (
      <div className="formadores-page">
        <div className="container container--narrow">
          <motion.div 
            className="success-card glass"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <div className="success-card__icon-wrap">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="success-card__icon"
              >
                <CheckCircle className="w-12 h-12 text-accent" />
              </motion.div>
            </div>
            <h2 className="gradient-text">{language === 'pt' ? 'Candidatura Enviada!' : 'Application Sent!'}</h2>
            <p>
              {language === 'pt' ? (
                <>Obrigado, <strong>{data.nome.split(' ')[0]}</strong>. <br />Recebemos os seus dados e entraremos em contacto muito em breve para agendar uma conversa.</>
              ) : (
                <>Thank you, <strong>{data.nome.split(' ')[0]}</strong>. <br />We have received your details and will be in touch very soon to schedule a chat.</>
              )}
            </p>
            <button className="btn btn--primary" onClick={onNavigateHome}>
              {t('trainer.nav.back')}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="formadores-page">
      <div className="container">
        {/* Header Section */}
        <motion.div 
          className="formadores-hero"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.span variants={itemVariants} className="tag">{language === 'pt' ? 'Recrutamento Especializado' : 'Specialised Recruitment'}</motion.span>
          <motion.h1 variants={itemVariants} className="formadores-hero__title">
            {language === 'pt' ? (
              <>Faça parte da nossa rede de <span className="gradient-text">Formadores</span></>
            ) : (
              <>Join our network of <span className="gradient-text">Trainers</span></>
            )}
          </motion.h1>
          <motion.p variants={itemVariants} className="formadores-hero__sub">
            {language === 'pt' 
              ? 'Valorizamos a expertise e o compromisso com a excelência. Preencha o formulário em 3 minutos.'
              : 'We value expertise and commitment to excellence. Complete the form in 3 minutes.'}
          </motion.p>
        </motion.div>

        {/* Wizard UI */}
        <div className="wizard-container">
          {/* Progress Bar */}
          <div className="wizard-progress">
            <div className="wizard-progress__track">
              <motion.div 
                className="wizard-progress__fill"
                animate={{ width: `${(step / STEPS_LABELS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="wizard-progress__steps">
              {STEPS_LABELS.map((s) => (
                <div key={s.number} className={`wizard-progress__step ${step >= s.number ? 'is-active' : ''}`}>
                  <div className="wizard-progress__step-dot">
                    {step > s.number ? <Check className="w-3 h-3" /> : s.icon}
                  </div>
                  <span className="wizard-progress__step-label">{(s.label as any)[language]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <motion.div 
            className="wizard-card glass"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <form onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  initial={{ opacity: 0, x: dir > 0 ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir > 0 ? -20 : 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {step === 1 && <Step1 data={data} errors={errors} onChange={set} language={language} />}
                  {step === 2 && <Step2 data={data} errors={errors} onChange={set} onToggle={toggle} language={language} />}
                  {step === 3 && <Step3 data={data} errors={errors} onChange={set} onToggle={toggle} language={language} />}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="wizard-nav">
                <button 
                  type="button" 
                  className="btn btn--outline" 
                  onClick={step === 1 ? onNavigateHome : back}
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {step === 1 ? (language === 'pt' ? 'Cancelar' : 'Cancel') : (language === 'pt' ? 'Anterior' : 'Previous')}
                </button>

                <div className="wizard-nav__dots">
                  {STEPS_LABELS.map((s) => (
                    <div key={s.number} className={`wizard-nav__dot ${step === s.number ? 'is-active' : ''}`} />
                  ))}
                </div>

                {step < 3 ? (
                  <button type="button" className="btn btn--primary" onClick={next}>
                    {language === 'pt' ? 'Próximo' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn--primary" 
                    onClick={handleSubmit} 
                    disabled={loading}
                  >
                    {loading ? (language === 'pt' ? 'A Enviar...' : 'Sending...') : (language === 'pt' ? 'Finalizar Inscrição' : 'Complete Registration')} 
                    {loading ? null : <Send className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {submitErr && (
                <motion.div 
                  className="wizard-error-msg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <X className="w-4 h-4" /> {submitErr}
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </div>

      <style>{FORMADORES_STYLES}</style>
    </div>
  );
}

// ── Step sub-components ────────────────────────────────────────────────────────

interface StepProps {
  data: WizardData;
  errors: WizardErrors;
  onChange: (field: keyof WizardData, value: WizardData[keyof WizardData]) => void;
  onToggle?: (field: 'areas' | 'dias' | 'periodos', val: string) => void;
  language: 'pt' | 'en';
}

function Step1({ data, errors, onChange, language }: StepProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="wizard-step-title">{language === 'pt' ? 'Dados Pessoais' : 'Personal Details'}</h2>
      <p className="wizard-step-sub">{language === 'pt' ? 'Conte-nos um pouco sobre si para podermos começar.' : 'Tell us a bit about yourself so we can get started.'}</p>

      <div className="form__grid">
        <div className="form__group form__group--full">
          <label className="form__label"><User size={14} /> {language === 'pt' ? 'Nome Completo' : 'Full Name'}</label>
          <input 
            type="text" 
            className={`form__input ${errors.nome ? 'error' : ''}`}
            placeholder={language === 'pt' ? 'Ex: Maria Santos' : 'e.g. Maria Santos'}
            value={data.nome}
            onChange={(e) => onChange('nome', e.target.value)}
          />
          {errors.nome && <span className="wizard-error">{errors.nome}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Mail size={14} /> Email</label>
          <input 
            type="email" 
            className={`form__input ${errors.email ? 'error' : ''}`}
            placeholder="email@example.com"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
          {errors.email && <span className="wizard-error">{errors.email}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Phone size={14} /> {language === 'pt' ? 'Telefone' : 'Phone'}</label>
          <input 
            type="tel" 
            className={`form__input ${errors.telefone ? 'error' : ''}`}
            placeholder="9XX XXX XXX"
            value={data.telefone}
            onChange={(e) => onChange('telefone', e.target.value)}
          />
          {errors.telefone && <span className="wizard-error">{errors.telefone}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Calendar size={14} /> {language === 'pt' ? 'Nascimento' : 'Date of Birth'}</label>
          <input 
            type="date" 
            className="form__input"
            value={data.dataNascimento}
            onChange={(e) => onChange('dataNascimento', e.target.value)}
          />
        </div>

        <div className="form__group">
          <label className="form__label"><Hash size={14} /> NIF</label>
          <input 
            type="text" 
            className="form__input"
            placeholder="123 456 789"
            value={data.nif}
            onChange={(e) => onChange('nif', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Step2({ data, errors, onChange, onToggle, language }: StepProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="wizard-step-title">{language === 'pt' ? 'Perfil & Expertise' : 'Profile & Expertise'}</h2>
      <p className="wizard-step-sub">{language === 'pt' ? 'Quais são as suas áreas de domínio e experiência?' : 'What are your areas of expertise and experience?'}</p>

      <div className="form__group">
        <label className="form__label">{language === 'pt' ? 'Áreas de Atuação (Selecione as aplicáveis)' : 'Areas of Expertise (Select all that apply)'}</label>
        <div className="wizard-check-grid">
          {AREAS_LIST.map(area => (
            <button 
              key={area.pt}
              type="button"
              className={`wizard-check-item ${data.areas.includes(area[language]) ? 'is-selected' : ''}`}
              onClick={() => onToggle?.('areas', area[language])}
            >
              <div className="wizard-check-box">
                {data.areas.includes(area[language]) && <Check size={12} />}
              </div>
              {area[language]}
            </button>
          ))}
        </div>
        {errors.areas && <span className="wizard-error">{errors.areas}</span>}
      </div>

      <div className="form__grid">
        <div className="form__group">
          <label className="form__label"><GraduationCap size={14} /> {language === 'pt' ? 'Habilitações' : 'Qualifications'}</label>
          <select 
            className={`form__input ${errors.habilitacoes ? 'error' : ''}`}
            value={data.habilitacoes}
            onChange={(e) => onChange('habilitacoes', e.target.value)}
          >
            <option value="">{language === 'pt' ? 'Selecionar...' : 'Select...'}</option>
            <option value="12ano">{language === 'pt' ? '12.º Ano' : 'Secondary Education'}</option>
            <option value="licenciatura">{language === 'pt' ? 'Licenciatura' : "Bachelor's Degree"}</option>
            <option value="mestrado">{language === 'pt' ? 'Mestrado' : "Master's Degree"}</option>
            <option value="doutoramento">{language === 'pt' ? 'Doutoramento' : 'PhD'}</option>
            <option value="outro">{language === 'pt' ? 'Outro' : 'Other'}</option>
          </select>
          {errors.habilitacoes && <span className="wizard-error">{errors.habilitacoes}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><ShieldCheck size={14} /> CAP / CCP</label>
          <select 
            className={`form__input ${errors.capCcp ? 'error' : ''}`}
            value={data.capCcp}
            onChange={(e) => onChange('capCcp', e.target.value)}
          >
            <option value="">{language === 'pt' ? 'Selecionar...' : 'Select...'}</option>
            <option value="sim">{language === 'pt' ? 'Possuo Certificado' : 'I have a certificate'}</option>
            <option value="nao">{language === 'pt' ? 'Não Possuo' : 'I do not have one'}</option>
            <option value="processo">{language === 'pt' ? 'Em Processo' : 'In process'}</option>
          </select>
          {errors.capCcp && <span className="wizard-error">{errors.capCcp}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Briefcase size={14} /> {language === 'pt' ? 'Experiência (Anos)' : 'Experience (Years)'}</label>
          <input 
            type="number" 
            className="form__input"
            placeholder="e.g. 5"
            value={data.experiencia}
            onChange={(e) => onChange('experiencia', e.target.value)}
          />
        </div>

        <div className="form__group">
          <label className="form__label"><Globe size={14} /> LinkedIn ({language === 'pt' ? 'Opcional' : 'Optional'})</label>
          <input 
            type="url" 
            className="form__input"
            placeholder="linkedin.com/in/profile"
            value={data.linkedin}
            onChange={(e) => onChange('linkedin', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Step3({ data, errors, onChange, onToggle, language }: StepProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="wizard-step-title">{language === 'pt' ? 'Disponibilidade' : 'Availability'}</h2>
      <p className="wizard-step-sub">{language === 'pt' ? 'Como e quando prefere colaborar connosco?' : 'How and when do you prefer to collaborate with us?'}</p>

      <div className="form__group">
        <label className="form__label">{language === 'pt' ? 'Dias de Preferência' : 'Preferred Days'}</label>
        <div className="wizard-check-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {DIAS_LIST.map(dia => (
            <button 
              key={dia.pt}
              type="button"
              className={`wizard-check-item ${data.dias.includes(dia[language]) ? 'is-selected' : ''}`}
              onClick={() => onToggle?.('dias', dia[language])}
            >
              <div className="wizard-check-box">
                {data.dias.includes(dia[language]) && <Check size={12} />}
              </div>
              {dia[language]}
            </button>
          ))}
        </div>
        {errors.dias && <span className="wizard-error">{errors.dias}</span>}
      </div>

      <div className="form__group">
        <label className="form__label">{language === 'pt' ? 'Períodos Disponíveis' : 'Available Periods'}</label>
        <div className="wizard-check-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {PERIODOS_LIST.map(periodo => (
            <button
              key={periodo.pt}
              type="button"
              className={`wizard-check-item ${data.periodos.includes(periodo[language]) ? 'is-selected' : ''}`}
              onClick={() => onToggle?.('periodos', periodo[language])}
            >
              <div className="wizard-check-box">
                {data.periodos.includes(periodo[language]) && <Check size={12} />}
              </div>
              {periodo[language]}
            </button>
          ))}
        </div>
        {errors.periodos && <span className="wizard-error">{errors.periodos}</span>}
      </div>

      <div className="form__group">
        <label className="form__label">{language === 'pt' ? 'Modalidade Predileta' : 'Preferred Modality'}</label>
        <div className="wizard-radio-grid">
          {MODALIDADES_LIST.map(m => (
            <button 
              key={m.value}
              type="button"
              className={`wizard-radio-item ${data.modalidade === m.value ? 'is-selected' : ''}`}
              onClick={() => onChange('modalidade', m.value)}
            >
              {m.icon}
              <span>{m.label[language]}</span>
            </button>
          ))}
        </div>
        {errors.modalidade && <span className="wizard-error">{errors.modalidade}</span>}

        <AnimatePresence>
          {(data.modalidade === 'online' || data.modalidade === 'hibrida') && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="setup-checklist glass"
            >
              <h4 className="setup-checklist__title">
                <Monitor className="w-4 h-4 text-accent" /> {language === 'pt' ? 'Checklist de Setup Necessário' : 'Required Setup Checklist'}
              </h4>
              <ul className="setup-checklist__list">
                <li><Check className="w-4 h-4 text-accent" /> {language === 'pt' ? 'Computador com câmara e microfone' : 'Computer with camera and microphone'}</li>
                <li><Check className="w-4 h-4 text-accent" /> {language === 'pt' ? 'Câmara HD/4K (Preferencial)' : 'HD/4K Camera (Preferred)'}</li>
                <li><Check className="w-4 h-4 text-accent" /> {language === 'pt' ? 'Auscultadores com microfone (Headset)' : 'Headset with microphone'}</li>
                <li><Check className="w-4 h-4 text-accent" /> {language === 'pt' ? 'Ligação estável à Internet' : 'Stable internet connection'}</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="form__group form__group--full">
        <label className="form__label"><MessageSquare size={14} /> {language === 'pt' ? 'Motivação' : 'Motivation'}</label>
        <textarea 
          className={`form__textarea ${errors.motivacao ? 'error' : ''}`}
          placeholder={language === 'pt' ? 'O que o motiva a ser formador na FaroForma?' : 'What motivates you to be a trainer at FaroForma?'}
          rows={4}
          value={data.motivacao}
          onChange={(e) => onChange('motivacao', e.target.value)}
        />
        {errors.motivacao && <span className="wizard-error">{errors.motivacao}</span>}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button 
          type="button" 
          className={`wizard-check-item ${data.termos ? 'is-selected' : ''}`}
          onClick={() => onChange('termos', !data.termos)}
          style={{ width: '100%', border: data.termos ? '' : errors.termos ? '1px solid #ef4444' : '' }}
        >
          <div className="wizard-check-box">
            {data.termos && <Check size={12} />}
          </div>
          <span style={{ fontSize: '0.85rem' }}>
            {language === 'pt' ? 'Aceito o processamento dos meus dados para fins de recrutamento.' : 'I accept the processing of my data for recruitment purposes.'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}

const FORMADORES_STYLES = `
  .formadores-page { padding: 8rem 0 6rem; background: radial-gradient(circle at 0% 0%, var(--bg-1) 0%, var(--bg) 50%); min-height: 100vh; }
  .formadores-hero { text-align: center; max-width: 800px; margin: 0 auto 4rem; }
  .formadores-hero__title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; letter-spacing: -0.04em; margin: 1.5rem 0; line-height: 1.1; }
  .formadores-hero__sub { font-size: 1.15rem; color: var(--text-muted); max-width: 500px; margin: 0 auto; }
  .wizard-container { max-width: 720px; margin: 0 auto; }
  .wizard-progress { margin-bottom: 3rem; position: relative; }
  .wizard-progress__track { height: 4px; background: var(--border); border-radius: 2px; position: absolute; top: 18px; left: 10%; right: 10%; z-index: 0; }
  .wizard-progress__fill { height: 100%; background: var(--accent); border-radius: 2px; }
  .wizard-progress__steps { display: flex; justify-content: space-between; position: relative; z-index: 1; }
  .wizard-progress__step { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
  .wizard-progress__step-dot { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-2); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-dim); transition: all 0.3s var(--ease-smooth); }
  .wizard-progress__step.is-active .wizard-progress__step-dot { background: var(--accent); border-color: var(--accent); color: white; box-shadow: 0 0 20px var(--accent-glow); }
  .wizard-progress__step-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); }
  .wizard-progress__step.is-active .wizard-progress__step-label { color: var(--text); }
  .wizard-card { padding: 3rem; border-radius: var(--radius-xl); }
  .wizard-step-title { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
  .wizard-step-sub { color: var(--text-muted); margin-bottom: 2.5rem; font-size: 0.95rem; }
  .wizard-nav { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .wizard-nav__dots { display: flex; gap: 0.5rem; }
  .wizard-nav__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: all 0.3s; }
  .wizard-nav__dot.is-active { background: var(--accent); width: 20px; border-radius: 3px; }
  .wizard-error-msg { margin-top: 1.5rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.75rem 1rem; border-radius: var(--radius); font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
  .wizard-error { color: #ef4444; font-size: 0.75rem; margin-top: 0.35rem; font-weight: 500; }
  .wizard-check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin: 1.5rem 0; }
  .wizard-check-item { padding: 0.85rem 1rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-1); color: var(--text-muted); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s; text-align: left; }
  .wizard-check-item:hover { border-color: var(--accent); background: var(--bg-2); }
  .wizard-check-item.is-selected { border-color: var(--accent); background: rgba(16, 185, 129, 0.1); color: var(--text); }
  .wizard-check-box { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .is-selected .wizard-check-box { background: var(--accent); border-color: var(--accent); color: white; }
  .wizard-radio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; }
  .wizard-radio-item { padding: 1.5rem 1rem; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--bg-1); display: flex; flex-direction: column; align-items: center; gap: 0.75rem; font-weight: 600; color: var(--text-muted); transition: all 0.3s; }
  .wizard-radio-item.is-selected { border-color: var(--accent); background: rgba(16, 185, 129, 0.08); color: var(--accent); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1); transform: translateY(-2px); }
  .success-card { text-align: center; padding: 5rem 3rem; border-radius: var(--radius-xl); }
  .success-card__icon-wrap { margin-bottom: 2rem; display: flex; justify-content: center; }
  .success-card__icon { width: 100px; height: 100px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; }
  .success-card h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; }
  .success-card p { color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; max-width: 440px; margin: 0 auto 3rem; }
  .setup-checklist { background: rgba(16, 185, 129, 0.05); border: 1px dashed var(--accent); padding: 1.25rem; border-radius: var(--radius); overflow: hidden; }
  .setup-checklist__title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--text); margin-bottom: 0.75rem; }
  .setup-checklist__list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; }
  .setup-checklist__list li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); }

  @media (max-width: 640px) {
    .wizard-card { padding: 1.5rem; }
    .wizard-radio-grid { grid-template-columns: 1fr; }
    .wizard-progress__step-label { display: none; }
    .wizard-progress__track { left: 5%; right: 5%; }
  }
`;
