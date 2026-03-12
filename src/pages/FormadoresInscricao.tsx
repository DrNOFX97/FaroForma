import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Hash,
  Briefcase, GraduationCap, Globe,
  CalendarDays, Monitor, Shuffle, MessageSquare,
  ChevronRight, ChevronLeft, Send, CheckCircle, Check,
  X, ShieldCheck
} from 'lucide-react';

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

const AREAS = [
  'Formações Empresariais', 'Línguas Estrangeiras',
  'TI e Informática', 'Saúde e Bem-Estar',
  'Artes e Criatividade', 'Ciências e Tecnologia',
  'Explicações (secundário)', 'Explicações (universitário)',
];

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const PERIODOS = ['Manhã (09h–13h)', 'Tarde (13h–18h)', 'Noite (18h–21h)'];

const MODALIDADES = [
  { value: 'presencial', label: 'Presencial', icon: <CalendarDays className="w-5 h-5" /> },
  { value: 'online',     label: 'Online',     icon: <Monitor className="w-5 h-5" />      },
  { value: 'hibrida',    label: 'Híbrida',    icon: <Shuffle className="w-5 h-5" />      },
];

const STEPS = [
  { number: 1, label: 'Perfil', icon: <User className="w-4 h-4" /> },
  { number: 2, label: 'Expertise', icon: <Briefcase className="w-4 h-4" /> },
  { number: 3, label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
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
      if (!data.nome.trim())    e.nome    = 'Nome é necessário';
      if (!data.email.trim())   e.email   = 'Email é necessário';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Email inválido';
      if (!data.telefone.trim()) e.telefone = 'Telefone é necessário';
    }
    if (s === 2) {
      if (data.areas.length === 0) e.areas = 'Selecione pelo menos uma área';
      if (!data.habilitacoes)  e.habilitacoes = 'Selecione as habilitações';
      if (!data.capCcp)        e.capCcp = 'Indique se possui CAP/CCP';
    }
    if (s === 3) {
      if (data.dias.length === 0)    e.dias    = 'Selecione a disponibilidade';
      if (data.periodos.length === 0) e.periodos = 'Selecione o período';
      if (!data.modalidade)          e.modalidade = 'Escolha a modalidade';
      if (!data.motivacao.trim())    e.motivacao  = 'Escreva brevemente a sua motivação';
      if (!data.termos)              e.termos     = 'Aceitação obrigatória';
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
        setSubmitErr((body as { error?: string }).error ?? 'Ocorreu um erro técnico. Tente novamente.');
      }
    } catch {
      setSubmitErr('Ocorreu um erro técnico. Tente novamente.');
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
            <h2 className="gradient-text">Candidatura Enviada!</h2>
            <p>
              Obrigado, <strong>{data.nome.split(' ')[0]}</strong>. <br />
              Recebemos os seus dados e entraremos em contacto muito em breve para agendar uma conversa.
            </p>
            <button className="btn btn--primary" onClick={onNavigateHome}>
              Voltar à Página Principal
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
          <motion.span variants={itemVariants} className="tag">Recrutamento Especializado</motion.span>
          <motion.h1 variants={itemVariants} className="formadores-hero__title">
            Faça parte da nossa rede de <span className="gradient-text">Formadores</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="formadores-hero__sub">
            Valorizamos a expertise e o compromisso com a excelência. 
            Preencha o formulário em 3 minutos.
          </motion.p>
        </motion.div>

        {/* Wizard UI */}
        <div className="wizard-container">
          {/* Progress Bar */}
          <div className="wizard-progress">
            <div className="wizard-progress__track">
              <motion.div 
                className="wizard-progress__fill"
                animate={{ width: `${(step / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="wizard-progress__steps">
              {STEPS.map((s) => (
                <div key={s.number} className={`wizard-progress__step ${step >= s.number ? 'is-active' : ''}`}>
                  <div className="wizard-progress__step-dot">
                    {step > s.number ? <Check className="w-3 h-3" /> : s.icon}
                  </div>
                  <span className="wizard-progress__step-label">{s.label}</span>
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
                  {step === 1 && <Step1 data={data} errors={errors} onChange={set} />}
                  {step === 2 && <Step2 data={data} errors={errors} onChange={set} onToggle={toggle} />}
                  {step === 3 && <Step3 data={data} errors={errors} onChange={set} onToggle={toggle} />}
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
                  {step === 1 ? 'Cancelar' : 'Anterior'}
                </button>

                <div className="wizard-nav__dots">
                  {STEPS.map((s) => (
                    <div key={s.number} className={`wizard-nav__dot ${step === s.number ? 'is-active' : ''}`} />
                  ))}
                </div>

                {step < 3 ? (
                  <button type="button" className="btn btn--primary" onClick={next}>
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn--primary" 
                    onClick={handleSubmit} 
                    disabled={loading}
                  >
                    {loading ? 'A Enviar...' : 'Finalizar Inscrição'} 
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

      <style>{`
        .formadores-page {
          padding: 8rem 0 6rem;
          background: radial-gradient(circle at 0% 0%, var(--bg-1) 0%, var(--bg) 50%);
          min-height: 100vh;
        }

        .formadores-hero {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 4rem;
        }

        .formadores-hero__title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          margin: 1.5rem 0;
          line-height: 1.1;
        }

        .formadores-hero__sub {
          font-size: 1.15rem;
          color: var(--text-muted);
          max-width: 500px;
          margin: 0 auto;
        }

        .wizard-container {
          max-width: 720px;
          margin: 0 auto;
        }

        .wizard-progress {
          margin-bottom: 3rem;
          position: relative;
        }

        .wizard-progress__track {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          position: absolute;
          top: 18px;
          left: 10%;
          right: 10%;
          z-index: 0;
        }

        .wizard-progress__fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
        }

        .wizard-progress__steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .wizard-progress__step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .wizard-progress__step-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-2);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          transition: all 0.3s var(--ease-smooth);
        }

        .wizard-progress__step.is-active .wizard-progress__step-dot {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
          box-shadow: 0 0 20px var(--accent-glow);
        }

        .wizard-progress__step-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dim);
        }

        .wizard-progress__step.is-active .wizard-progress__step-label {
          color: var(--text);
        }

        .wizard-card {
          padding: 3rem;
          border-radius: var(--radius-xl);
        }

        .wizard-step-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .wizard-step-sub {
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          font-size: 0.95rem;
        }

        .wizard-nav {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .wizard-nav__dots {
          display: flex;
          gap: 0.5rem;
        }

        .wizard-nav__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border);
          transition: all 0.3s;
        }

        .wizard-nav__dot.is-active {
          background: var(--accent);
          width: 20px;
          border-radius: 3px;
        }

        .wizard-error-msg {
          margin-top: 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.75rem 1rem;
          border-radius: var(--radius);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .wizard-error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.35rem;
          font-weight: 500;
        }

        /* CheckGrid Styling */
        .wizard-check-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
          margin: 1.5rem 0;
        }

        .wizard-check-item {
          padding: 0.85rem 1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-1);
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s;
          text-align: left;
        }

        .wizard-check-item:hover {
          border-color: var(--accent);
          background: var(--bg-2);
        }

        .wizard-check-item.is-selected {
          border-color: var(--accent);
          background: rgba(16, 185, 129, 0.1);
          color: var(--text);
        }

        .wizard-check-box {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .is-selected .wizard-check-box {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        /* RadioGrid Styling */
        .wizard-radio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .wizard-radio-item {
          padding: 1.5rem 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          background: var(--bg-1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.3s;
        }

        .wizard-radio-item.is-selected {
          border-color: var(--accent);
          background: rgba(16, 185, 129, 0.08);
          color: var(--accent);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);
          transform: translateY(-2px);
        }

        .success-card {
          text-align: center;
          padding: 5rem 3rem;
          border-radius: var(--radius-xl);
        }

        .success-card__icon-wrap {
          margin-bottom: 2rem;
          display: flex;
          justify-content: center;
        }

        .success-card__icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-card h2 {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
        }

        .success-card p {
          color: var(--text-muted);
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 440px;
          margin: 0 auto 3rem;
        }

        .setup-checklist {
          background: rgba(16, 185, 129, 0.05);
          border: 1px dashed var(--accent);
          padding: 1.25rem;
          border-radius: var(--radius);
          overflow: hidden;
        }

        .setup-checklist__title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.75rem;
        }

        .setup-checklist__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.5rem;
        }

        .setup-checklist__list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .wizard-card {
            padding: 1.5rem;
          }
          .wizard-radio-grid {
            grid-template-columns: 1fr;
          }
          .wizard-progress__step-label {
            display: none;
          }
          .wizard-progress__track {
            left: 5%;
            right: 5%;
          }
        }
      `}</style>
    </div>
  );
}

// ── Step sub-components ────────────────────────────────────────────────────────

interface StepProps {
  data: WizardData;
  errors: WizardErrors;
  onChange: (field: keyof WizardData, value: WizardData[keyof WizardData]) => void;
  onToggle?: (field: 'areas' | 'dias' | 'periodos', val: string) => void;
}

function Step1({ data, errors, onChange }: StepProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="wizard-step-title">Dados Pessoais</h2>
      <p className="wizard-step-sub">Conte-nos um pouco sobre si para podermos começar.</p>

      <div className="form__grid">
        <div className="form__group form__group--full">
          <label className="form__label"><User size={14} /> Nome Completo</label>
          <input 
            type="text" 
            className={`form__input ${errors.nome ? 'error' : ''}`}
            placeholder="Ex: Maria Santos"
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
            placeholder="maria@exemplo.pt"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
          {errors.email && <span className="wizard-error">{errors.email}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Phone size={14} /> Telefone</label>
          <input 
            type="tel" 
            className={`form__input ${errors.telefone ? 'error' : ''}`}
            placeholder="912 345 678"
            value={data.telefone}
            onChange={(e) => onChange('telefone', e.target.value)}
          />
          {errors.telefone && <span className="wizard-error">{errors.telefone}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Calendar size={14} /> Nascimento</label>
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

function Step2({ data, errors, onChange, onToggle }: StepProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="wizard-step-title">Perfil & Expertise</h2>
      <p className="wizard-step-sub">Quais são as suas áreas de domínio e experiência?</p>

      <div className="form__group">
        <label className="form__label">Áreas de Atuação (Selecione as aplicáveis)</label>
        <div className="wizard-check-grid">
          {AREAS.map(area => (
            <button 
              key={area}
              type="button"
              className={`wizard-check-item ${data.areas.includes(area) ? 'is-selected' : ''}`}
              onClick={() => onToggle?.('areas', area)}
            >
              <div className="wizard-check-box">
                {data.areas.includes(area) && <Check size={12} />}
              </div>
              {area}
            </button>
          ))}
        </div>
        {errors.areas && <span className="wizard-error">{errors.areas}</span>}
      </div>

      <div className="form__grid">
        <div className="form__group">
          <label className="form__label"><GraduationCap size={14} /> Habilitações</label>
          <select 
            className={`form__input ${errors.habilitacoes ? 'error' : ''}`}
            value={data.habilitacoes}
            onChange={(e) => onChange('habilitacoes', e.target.value)}
          >
            <option value="">Selecionar...</option>
            <option value="12ano">12.º Ano</option>
            <option value="licenciatura">Licenciatura</option>
            <option value="mestrado">Mestrado</option>
            <option value="doutoramento">Doutoramento</option>
            <option value="outro">Outro</option>
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
            <option value="">Selecionar...</option>
            <option value="sim">Possuo Certificado</option>
            <option value="nao">Não Possuo</option>
            <option value="processo">Em Processo</option>
          </select>
          {errors.capCcp && <span className="wizard-error">{errors.capCcp}</span>}
        </div>

        <div className="form__group">
          <label className="form__label"><Briefcase size={14} /> Experiência (Anos)</label>
          <input 
            type="number" 
            className="form__input"
            placeholder="Ex: 5"
            value={data.experiencia}
            onChange={(e) => onChange('experiencia', e.target.value)}
          />
        </div>

        <div className="form__group">
          <label className="form__label"><Globe size={14} /> LinkedIn (Opcional)</label>
          <input 
            type="url" 
            className="form__input"
            placeholder="linkedin.com/in/perfil"
            value={data.linkedin}
            onChange={(e) => onChange('linkedin', e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Step3({ data, errors, onChange, onToggle }: StepProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <h2 className="wizard-step-title">Disponibilidade</h2>
      <p className="wizard-step-sub">Como e quando prefere colaborar connosco?</p>

      <div className="form__group">
        <label className="form__label">Dias de Preferência</label>
        <div className="wizard-check-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {DIAS.map(dia => (
            <button 
              key={dia}
              type="button"
              className={`wizard-check-item ${data.dias.includes(dia) ? 'is-selected' : ''}`}
              onClick={() => onToggle?.('dias', dia)}
            >
              <div className="wizard-check-box">
                {data.dias.includes(dia) && <Check size={12} />}
              </div>
              {dia}
            </button>
          ))}
        </div>
        {errors.dias && <span className="wizard-error">{errors.dias}</span>}
      </div>

      <div className="form__group">
        <label className="form__label">Períodos Disponíveis</label>
        <div className="wizard-check-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {PERIODOS.map(periodo => (
            <button
              key={periodo}
              type="button"
              className={`wizard-check-item ${data.periodos.includes(periodo) ? 'is-selected' : ''}`}
              onClick={() => onToggle?.('periodos', periodo)}
            >
              <div className="wizard-check-box">
                {data.periodos.includes(periodo) && <Check size={12} />}
              </div>
              {periodo}
            </button>
          ))}
        </div>
        {errors.periodos && <span className="wizard-error">{errors.periodos}</span>}
      </div>

      <div className="form__group">
        <label className="form__label">Modalidade Predileta</label>
        <div className="wizard-radio-grid">
          {MODALIDADES.map(m => (
            <button 
              key={m.value}
              type="button"
              className={`wizard-radio-item ${data.modalidade === m.value ? 'is-selected' : ''}`}
              onClick={() => onChange('modalidade', m.value)}
            >
              {m.icon}
              <span>{m.label}</span>
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
                <Monitor className="w-4 h-4 text-accent" /> Checklist de Setup Necessário
              </h4>
              <ul className="setup-checklist__list">
                <li><Check className="w-4 h-4 text-accent" /> Computador com câmara e microfone</li>
                <li><Check className="w-4 h-4 text-accent" /> Câmara HD/4K (Preferencial)</li>
                <li><Check className="w-4 h-4 text-accent" /> Auscultadores com microfone (Headset)</li>
                <li><Check className="w-4 h-4 text-accent" /> Ligação estável à Internet</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="form__group form__group--full">
        <label className="form__label"><MessageSquare size={14} /> Motivação</label>
        <textarea 
          className={`form__textarea ${errors.motivacao ? 'error' : ''}`}
          placeholder="O que o motiva a ser formador na FaroForma?"
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
          <span style={{ fontSize: '0.85rem' }}>Aceito o processamento dos meus dados para fins de recrutamento.</span>
        </button>
      </div>
    </motion.div>
  );
}
