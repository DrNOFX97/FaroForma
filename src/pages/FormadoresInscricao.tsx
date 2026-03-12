import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Calendar, Hash,
  Briefcase, GraduationCap, Globe,
  CalendarDays, Monitor, Shuffle, MessageSquare,
  ChevronRight, ChevronLeft, Send, CheckCircle, Check,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface WizardData {
  // Step 1
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  nif: string;
  // Step 2
  areas: string[];
  habilitacoes: string;
  capCcp: string;
  experiencia: string;
  linkedin: string;
  // Step 3
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
  { value: 'presencial', label: 'Presencial', icon: <CalendarDays size={22} /> },
  { value: 'online',     label: 'Online',     icon: <Monitor size={22} />     },
  { value: 'hibrida',    label: 'Híbrida',    icon: <Shuffle size={22} />     },
];

const STEPS = [
  { number: 1, label: 'Dados Pessoais'   },
  { number: 2, label: 'Perfil'           },
  { number: 3, label: 'Disponibilidade'  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function encodeForm(data: Record<string, string>) {
  return Object.entries(data)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
}

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
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

  // Field updates
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

  // Per-step validation
  const validate = (s: number): boolean => {
    const e: WizardErrors = {};
    if (s === 1) {
      if (!data.nome.trim())    e.nome    = 'Nome obrigatório.';
      if (!data.email.trim())   e.email   = 'Email obrigatório.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Email inválido.';
      if (!data.telefone.trim()) e.telefone = 'Telefone obrigatório.';
    }
    if (s === 2) {
      if (data.areas.length === 0) e.areas = 'Selecione pelo menos uma área.';
      if (!data.habilitacoes)  e.habilitacoes = 'Habilitações obrigatórias.';
      if (!data.capCcp)        e.capCcp = 'Indique se possui CAP/CCP.';
    }
    if (s === 3) {
      if (data.dias.length === 0)    e.dias    = 'Selecione pelo menos um dia.';
      if (data.periodos.length === 0) e.periodos = 'Selecione pelo menos um período.';
      if (!data.modalidade)          e.modalidade = 'Selecione a modalidade.';
      if (!data.motivacao.trim())    e.motivacao  = 'Partilhe a sua motivação.';
      if (!data.termos)              e.termos     = 'Deve aceitar os termos.';
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
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeForm({
          'form-name':    'inscricao-formadores',
          'bot-field':    '',
          nome:           data.nome,
          email:          data.email,
          telefone:       data.telefone,
          dataNascimento: data.dataNascimento,
          nif:            data.nif,
          areas:          data.areas.join(', '),
          habilitacoes:   data.habilitacoes,
          capCcp:         data.capCcp,
          experiencia:    data.experiencia,
          linkedin:       data.linkedin,
          dias:           data.dias.join(', '),
          periodos:       data.periodos.join(', '),
          modalidade:     data.modalidade,
          motivacao:      data.motivacao,
        }),
      });
      setSuccess(true);
    } catch {
      setSubmitErr('Erro ao enviar. Por favor tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="formadores-page">
        <div className="container">
          <div className="wizard">
            <div className="wizard__card">
              <div className="wizard__success">
                <motion.div
                  className="wizard__success-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 180 }}
                >
                  <CheckCircle size={44} />
                </motion.div>
                <motion.h2
                  className="wizard__step-title"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Candidatura enviada!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '2rem' }}
                >
                  Obrigado, <strong>{data.nome.split(' ')[0]}</strong>! Recebemos a sua candidatura
                  e entraremos em contacto pelo email <strong>{data.email}</strong> em breve.
                </motion.p>
                <motion.button
                  className="btn btn--outline"
                  onClick={onNavigateHome}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Voltar ao início
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────

  return (
    <div className="formadores-page">
      <div className="container">

        {/* Page hero */}
        <motion.div
          className="formadores-hero"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className="tag">Junte-se a nós</span>
          <h1 className="formadores-hero__title">
            Inscrição de <span className="gradient-text">Formadores</span>
          </h1>
          <p className="formadores-hero__sub">
            Faça parte da nossa equipa e partilhe o seu conhecimento com quem mais precisa.
          </p>
        </motion.div>

        <div className="wizard">

          {/* Step indicators */}
          <motion.div
            className="wizard__steps"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            {STEPS.map((s, i) => (
              <div key={s.number} style={{ display: 'contents' }}>
                <div className="wizard__step-item">
                  <motion.div
                    className={[
                      'wizard__step-circle',
                      step === s.number ? 'wizard__step-circle--active' : '',
                      step > s.number  ? 'wizard__step-circle--done'   : '',
                    ].join(' ')}
                    animate={{ scale: step === s.number ? 1.12 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {step > s.number ? <Check size={14} /> : s.number}
                  </motion.div>
                  <span className={`wizard__step-label${step === s.number ? ' wizard__step-label--active' : ''}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`wizard__step-line${step > s.number ? ' wizard__step-line--done' : ''}`} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Card */}
          <motion.div
            className="wizard__card"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <AnimatePresence mode="wait" custom={dir}>
              {step === 1 && (
                <motion.div key="s1" custom={dir} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>
                  <Step1 data={data} errors={errors} onChange={set} />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="s2" custom={dir} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>
                  <Step2 data={data} errors={errors} onChange={set} onToggle={toggle} />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="s3" custom={dir} variants={slide}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>
                  <Step3 data={data} errors={errors} onChange={set} onToggle={toggle} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="wizard__nav">
              <button className="btn btn--outline btn--sm" onClick={step === 1 ? onNavigateHome : back}>
                <ChevronLeft size={16} />
                {step === 1 ? 'Início' : 'Anterior'}
              </button>
              <span className="wizard__step-counter">{step} / {STEPS.length}</span>
              {step < 3 ? (
                <button className="btn btn--primary btn--sm" onClick={next}>
                  Seguinte <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn--primary btn--sm" onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <><span className="btn-spinner" /> A enviar…</>
                    : <><Send size={16} /> Enviar candidatura</>
                  }
                </button>
              )}
            </div>

            {submitErr && (
              <p className="wizard__error" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                {submitErr}
              </p>
            )}
          </motion.div>
        </div>
      </div>
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

// CheckItem helper
function CheckItem({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`wizard__check-item${selected ? ' wizard__check-item--selected' : ''}`} onClick={onClick}>
      <span className="wizard__check-icon">
        {selected
          ? <Check size={13} />
          : <span className="wizard__check-box" />
        }
      </span>
      {children}
    </button>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ data, errors, onChange }: StepProps) {
  return (
    <>
      <h2 className="wizard__step-title">Dados Pessoais</h2>
      <p className="wizard__step-sub">Informações básicas de contacto.</p>

      <div className="form__grid">
        <div className="form__group form__group--full">
          <label className="form__label" htmlFor="ff-nome">
            <User size={14} className="form__label-icon" /> Nome completo <span>*</span>
          </label>
          <input id="ff-nome" type="text" className={`form__input${errors.nome ? ' error' : ''}`}
            placeholder="O seu nome completo"
            value={data.nome} onChange={e => onChange('nome', e.target.value)} autoComplete="name" />
          {errors.nome && <p className="wizard__error">{errors.nome}</p>}
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="ff-email">
            <Mail size={14} className="form__label-icon" /> Email <span>*</span>
          </label>
          <input id="ff-email" type="email" className={`form__input${errors.email ? ' error' : ''}`}
            placeholder="email@exemplo.com"
            value={data.email} onChange={e => onChange('email', e.target.value)} autoComplete="email" />
          {errors.email && <p className="wizard__error">{errors.email}</p>}
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="ff-tel">
            <Phone size={14} className="form__label-icon" /> Telefone <span>*</span>
          </label>
          <input id="ff-tel" type="tel" className={`form__input${errors.telefone ? ' error' : ''}`}
            placeholder="9XX XXX XXX"
            value={data.telefone} onChange={e => onChange('telefone', e.target.value)} autoComplete="tel" />
          {errors.telefone && <p className="wizard__error">{errors.telefone}</p>}
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="ff-nasc">
            <Calendar size={14} className="form__label-icon" /> Data de Nascimento
          </label>
          <input id="ff-nasc" type="date" className="form__input"
            value={data.dataNascimento} onChange={e => onChange('dataNascimento', e.target.value)} />
        </div>

        <div className="form__group">
          <label className="form__label" htmlFor="ff-nif">
            <Hash size={14} className="form__label-icon" /> NIF
          </label>
          <input id="ff-nif" type="text" className="form__input"
            placeholder="Número de Identificação Fiscal"
            value={data.nif} onChange={e => onChange('nif', e.target.value)} />
        </div>
      </div>
    </>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({ data, errors, onChange, onToggle }: StepProps) {
  return (
    <>
      <h2 className="wizard__step-title">Perfil Profissional</h2>
      <p className="wizard__step-sub">Qualificações e experiência de formação.</p>

      {/* Areas */}
      <div className="form__group">
        <p className="wizard__section-label">Áreas de Formação *</p>
        <div className="wizard__check-grid">
          {AREAS.map(area => (
            <CheckItem key={area} selected={data.areas.includes(area)} onClick={() => onToggle?.('areas', area)}>
              {area}
            </CheckItem>
          ))}
        </div>
        {errors.areas && <p className="wizard__error">{errors.areas}</p>}
      </div>

      <div className="form__grid">
        {/* Habilitações */}
        <div className="form__group form__group--full">
          <label className="form__label" htmlFor="ff-hab">
            <GraduationCap size={14} className="form__label-icon" /> Habilitações Académicas <span>*</span>
          </label>
          <div className="form__select-wrap">
            <select id="ff-hab" className={`form__input${errors.habilitacoes ? ' error' : ''}`}
              value={data.habilitacoes} onChange={e => onChange('habilitacoes', e.target.value)}>
              <option value="">Selecionar…</option>
              <option value="12ano">12.º Ano</option>
              <option value="licenciatura">Licenciatura</option>
              <option value="mestrado">Mestrado</option>
              <option value="doutoramento">Doutoramento</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          {errors.habilitacoes && <p className="wizard__error">{errors.habilitacoes}</p>}
        </div>

        {/* CAP/CCP */}
        <div className="form__group form__group--full">
          <p className="wizard__section-label">Possui CAP / CCP? *</p>
          <div className="wizard__inline-checks">
            {[{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }, { v: 'processo', l: 'Em processo' }].map(({ v, l }) => (
              <CheckItem key={v} selected={data.capCcp === v} onClick={() => onChange('capCcp', v)}>
                {l}
              </CheckItem>
            ))}
          </div>
          {errors.capCcp && <p className="wizard__error">{errors.capCcp}</p>}
        </div>

        {/* Experiência */}
        <div className="form__group">
          <label className="form__label" htmlFor="ff-exp">
            <Briefcase size={14} className="form__label-icon" /> Anos de Experiência
          </label>
          <div className="form__select-wrap">
            <select id="ff-exp" className="form__input"
              value={data.experiencia} onChange={e => onChange('experiencia', e.target.value)}>
              <option value="">Selecionar…</option>
              <option value="menos1">Menos de 1 ano</option>
              <option value="1-3">1 a 3 anos</option>
              <option value="3-5">3 a 5 anos</option>
              <option value="5-10">5 a 10 anos</option>
              <option value="mais10">Mais de 10 anos</option>
            </select>
          </div>
        </div>

        {/* LinkedIn */}
        <div className="form__group">
          <label className="form__label" htmlFor="ff-li">
            <Globe size={14} className="form__label-icon" /> LinkedIn / Website
          </label>
          <input id="ff-li" type="url" className="form__input"
            placeholder="https://linkedin.com/in/…"
            value={data.linkedin} onChange={e => onChange('linkedin', e.target.value)} />
        </div>
      </div>
    </>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────

function Step3({ data, errors, onChange, onToggle }: StepProps) {
  return (
    <>
      <h2 className="wizard__step-title">Disponibilidade</h2>
      <p className="wizard__step-sub">Quando e como prefere trabalhar?</p>

      {/* Days */}
      <div className="form__group">
        <p className="wizard__section-label">Dias Disponíveis *</p>
        <div className="wizard__check-grid wizard__check-grid--3col">
          {DIAS.map(dia => (
            <CheckItem key={dia} selected={data.dias.includes(dia)} onClick={() => onToggle?.('dias', dia)}>
              {dia}
            </CheckItem>
          ))}
        </div>
        {errors.dias && <p className="wizard__error">{errors.dias}</p>}
      </div>

      {/* Periods */}
      <div className="form__group">
        <p className="wizard__section-label">Período Preferido *</p>
        <div className="wizard__inline-checks">
          {PERIODOS.map(p => (
            <CheckItem key={p} selected={data.periodos.includes(p)} onClick={() => onToggle?.('periodos', p)}>
              {p}
            </CheckItem>
          ))}
        </div>
        {errors.periodos && <p className="wizard__error">{errors.periodos}</p>}
      </div>

      {/* Modality */}
      <div className="form__group">
        <p className="wizard__section-label">Modalidade *</p>
        <div className="wizard__radio-grid">
          {MODALIDADES.map(m => (
            <button key={m.value} type="button"
              className={`wizard__radio-item${data.modalidade === m.value ? ' wizard__radio-item--selected' : ''}`}
              onClick={() => onChange('modalidade', m.value)}>
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
        {errors.modalidade && <p className="wizard__error">{errors.modalidade}</p>}
      </div>

      {/* Motivation */}
      <div className="form__group form__group--full">
        <label className="form__label" htmlFor="ff-mot">
          <MessageSquare size={14} className="form__label-icon" /> Carta de Motivação <span>*</span>
        </label>
        <textarea id="ff-mot" className={`form__textarea${errors.motivacao ? ' error' : ''}`}
          placeholder="Apresente-se brevemente e explique o que o motiva a ser formador(a) na FaroForma…"
          value={data.motivacao} onChange={e => onChange('motivacao', e.target.value)}
          style={{ minHeight: 110 }} />
        {errors.motivacao && <p className="wizard__error">{errors.motivacao}</p>}
      </div>

      {/* Terms */}
      <CheckItem selected={data.termos} onClick={() => onChange('termos', !data.termos)}>
        Aceito que os meus dados sejam utilizados para efeitos desta candidatura
      </CheckItem>
      {errors.termos && <p className="wizard__error">{errors.termos}</p>}
    </>
  );
}
