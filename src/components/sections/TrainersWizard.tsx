import { useState } from 'react';
import AnimatedSection from '../ui/AnimatedSection';

const STEPS = [
  {
    key: 'personal',
    title: 'Dados Pessoais',
    fields: [
      { name: 'fullName', label: 'Nome completo', type: 'text', required: true },
      { name: 'email', label: 'Email profissional', type: 'email', required: true },
      { name: 'phone', label: 'Telefone', type: 'tel', required: true },
      { name: 'nif', label: 'NIF', type: 'text', required: true },
      { name: 'birthDate', label: 'Data de nascimento', type: 'date', required: true },
    ],
  },
  {
    key: 'professional',
    title: 'Perfil Profissional',
    fields: [
      { name: 'area', label: 'Área de formação', type: 'text', required: true },
      { name: 'qualifications', label: 'Habilitações', type: 'text', required: true },
      { name: 'cap', label: 'CAP / CCP', type: 'text', required: true },
      { name: 'experience', label: 'Anos de experiência', type: 'number', required: true },
    ],
  },
  {
    key: 'availability',
    title: 'Disponibilidade',
    fields: [
      { name: 'days', label: 'Dias disponíveis', type: 'text', required: true },
      { name: 'hours', label: 'Horários (ex: 09h-13h, 17h-20h)', type: 'text', required: true },
      {
        name: 'modality',
        label: 'Modalidade',
        type: 'select',
        options: ['Presencial', 'Online', 'Híbrida'],
        required: true,
      },
      { name: 'message', label: 'Mensagem', type: 'textarea', required: false },
    ],
  },
];

const INITIAL_DATA = STEPS.flatMap(step => step.fields).reduce<Record<string, string>>((acc, field) => {
  acc[field.name] = '';
  return acc;
}, {});

export default function TrainersWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStep = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateFields = (fields: typeof activeStep.fields) => {
    const nextErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.name].trim()) {
        nextErrors[field.name] = `${field.label} é obrigatório.`;
      } else if (field.name === 'email' && formData[field.name]) {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.name]);
        if (!valid) nextErrors[field.name] = 'O email parece inválido.';
      }
    });
    setErrors(prev => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateFields(activeStep.fields)) return;
    setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const allFields = STEPS.flatMap(step => step.fields);
    setErrors({});
    if (!validateFields(allFields)) {
      event.preventDefault();
      setCurrentStep(0);
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  return (
    <section className="section trainers" id="formadores">
      <div className="container">
        <AnimatedSection direction="left" delay={0.15}>
          <div className="trainers__intro">
            <span className="tag">Formadores</span>
            <h2>Página de inscrições para formadores</h2>
            <p>
              Preenche o wizard e chega de forma estruturada. Cada passo valida os campos essenciais e
              carregamos para o Netlify Forms à medida que completas o pedido.
            </p>
          </div>
        </AnimatedSection>
        <AnimatedSection direction="right" delay={0.2}>
          <form
            name="formadores"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value="formadores" />
            <input type="hidden" name="bot-field" aria-hidden="true" />
            <div className="wizard">
              <div className="wizard__indicator">
                {STEPS.map((step, index) => (
                  <button
                    key={step.key}
                    type="button"
                    className={`wizard__step${index === currentStep ? ' is-active' : ''}`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <span>{index + 1}</span>
                    <strong>{step.title}</strong>
                  </button>
                ))}
              </div>
              <div className="wizard__progress">
                <div className="wizard__progress-value" style={{ width: `${progress}%` }} />
              </div>
              <div className="wizard__steps">
                {STEPS.map((step, index) => (
                  <div
                    key={step.key}
                    className={`wizard__panel ${index === currentStep ? 'is-active' : ''}`}
                    aria-hidden={index !== currentStep}
                  >
                    <h3>{step.title}</h3>
                    <div className="wizard__fields">
                      {step.fields.map(field => (
                        <label key={field.name} className="wizard__field">
                          {field.label}
                          {field.type === 'textarea' ? (
                            <textarea
                              name={field.name}
                              value={formData[field.name]}
                              onChange={event => handleChange(field.name, event.target.value)}
                              rows={3}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              name={field.name}
                              value={formData[field.name]}
                              onChange={event => handleChange(field.name, event.target.value)}
                            >
                              <option value="">Escolhe...</option>
                              {field.options?.map(option => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              name={field.name}
                              type={field.type}
                              value={formData[field.name]}
                              onChange={event => handleChange(field.name, event.target.value)}
                            />
                          )}
                          {errors[field.name] && (
                            <span className="wizard__error">{errors[field.name]}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="wizard__actions">
                <button type="button" className="btn btn--outline" onClick={handlePrev} disabled={currentStep === 0}>
                  Voltar
                </button>
                {currentStep < STEPS.length - 1 ? (
                  <button type="button" className="btn btn--primary" onClick={handleNext}>
                    Próximo passo
                  </button>
                ) : (
                  <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                    {isSubmitting ? 'A submeter...' : 'Enviar inscrição'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </AnimatedSection>
      </div>
    </section>
  );
}
