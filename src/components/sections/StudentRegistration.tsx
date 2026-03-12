import { useState } from 'react';
import AnimatedSection from '../ui/AnimatedSection';

const PROGRAMS = [
  'Formações Personalizadas Business',
  'Explicações Secundário e Universidade',
  'Administração e Apoio Administrativo',
  'Cursos de Português para Estrangeiros (PLA)',
];

const CONTACT_PREFERENCES = ['Telefone', 'Email', 'WhatsApp'];

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  program: PROGRAMS[0],
  startDate: '',
  contactPreference: CONTACT_PREFERENCES[0],
  notes: '',
};

export default function StudentRegistration() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Como te queres chamar?';
    if (!form.email.trim()) nextErrors.email = 'Precisamos de um email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      nextErrors.email = 'O email parece inválido.';
    if (!form.phone.trim()) nextErrors.phone = 'Um número facilita a marcação.';
    if (!form.startDate) nextErrors.startDate = 'Escolhe uma data preferida.';
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
        setSubmitErr((body as { error?: string }).error ?? 'Ocorreu um erro técnico. Tente novamente.');
      }
    } catch {
      setSubmitErr('Ocorreu um erro técnico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section registration" id="inscricoes">
      <div className="container">
        <AnimatedSection direction="left" delay={0.1}>
          <div className="registration__intro">
            <span className="tag">Inscrições</span>
            <h2>Nova inscrição de aluno</h2>
            <p>
              Estamos a aceitar alunos até ao final do trimestre. Preenche o formulário abaixo com os dados
              essenciais, descreve as tuas expectativas e damos-te resposta em até 24h úteis.
            </p>
          </div>
        </AnimatedSection>
        <AnimatedSection direction="right" delay={0.2}>
          {success ? (
            <div className="registration__success">
              <p>Inscrição enviada com sucesso! Receberás confirmação por email em breve.</p>
              <button className="btn btn--outline btn--sm" onClick={() => setSuccess(false)}>
                Nova inscrição
              </button>
            </div>
          ) : (
            <form className="registration__form" onSubmit={handleSubmit} noValidate>
              <div className="registration__grid">
                <label className="registration__field">
                  Nome completo*
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    aria-invalid={Boolean(errors.fullName)}
                  />
                  {errors.fullName && <span className="registration__error">{errors.fullName}</span>}
                </label>
                <label className="registration__field">
                  Email profissional ou pessoal*
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && <span className="registration__error">{errors.email}</span>}
                </label>
                <label className="registration__field">
                  Telemóvel / Contacto*
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && <span className="registration__error">{errors.phone}</span>}
                </label>
                <label className="registration__field">
                  Programa desejado
                  <select value={form.program} onChange={handleChange('program')}>
                    {PROGRAMS.map(program => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="registration__field">
                  Data de início preferida*
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={handleChange('startDate')}
                    aria-invalid={Boolean(errors.startDate)}
                  />
                  {errors.startDate && <span className="registration__error">{errors.startDate}</span>}
                </label>
                <label className="registration__field">
                  Preferes ser contactado por
                  <select value={form.contactPreference} onChange={handleChange('contactPreference')}>
                    {CONTACT_PREFERENCES.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="registration__field registration__field--full">
                  Como podemos ajudar?
                  <textarea value={form.notes} onChange={handleChange('notes')} rows={4} />
                </label>
              </div>
              <div className="registration__actions">
                <button className="btn btn--primary btn--lg" type="submit" disabled={loading}>
                  {loading ? 'Registando...' : 'Enviar inscrição'}
                </button>
                <p className="registration__hint">Recebes confirmação com os próximos passos dentro de 24h úteis.</p>
                {submitErr && <p className="registration__error">{submitErr}</p>}
              </div>
            </form>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
}
