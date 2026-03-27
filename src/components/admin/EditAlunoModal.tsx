import { useState, useMemo } from 'react';
import { A } from '../../config/sheetsSchema';
import { toast } from 'react-hot-toast';
import { apiService } from '../../services/api';
import { EditModalShell } from './EditModalShell';
import type { Course } from '../../types/api';

interface EditAlunoModalProps {
  row: { originalIndex: number; cells: any[]; type: string };
  courses?: Course[];
  onClose: () => void;
  onSuccess: () => void;
}

const STYLES = `
  .eam-section { display: flex; flex-direction: column; gap: 0.75rem; }
  .eam-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
  .eam-col-2 { grid-column: span 2; }
  .eam-meta-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.875rem; background: var(--bg-2); border-radius: var(--radius); border: 1px solid var(--border); }
  .eam-meta-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
  .eam-meta-value { font-size: 0.82rem; color: var(--text); }
  @media (max-width: 500px) { .eam-grid { grid-template-columns: 1fr; } .eam-col-2 { grid-column: span 1; } }
`;

export function EditAlunoModal({ row, courses = [], onClose, onSuccess }: EditAlunoModalProps) {
  const [values, setValues] = useState([...row.cells]);
  const [saving, setSaving] = useState(false);

  const updateField = (idx: number, val: string) => {
    setValues(prev => prev.map((v, i) => i === idx ? val : v));
  };

  const programOptions = useMemo(() => courses.map(c => c.title.pt), [courses]);

  const selectedCourse = useMemo(
    () => courses.find(c => c.title.pt === values[A.PROGRAMA]),
    [courses, values[A.PROGRAMA]]
  );

  const turmaOptions = useMemo(
    () => [...new Set((selectedCourse?.schedule ?? []).map(e => e.turma.pt))],
    [selectedCourse]
  );

  const periodoOptions = useMemo(() => {
    const entries = selectedCourse?.schedule ?? [];
    const matching = entries.filter(e => !values[A.TURMA] || e.turma.pt === values[A.TURMA]);
    return [...new Set(matching.map(e => e.período.pt))];
  }, [selectedCourse, values[A.TURMA]]);

  const handleProgramaChange = (val: string) => {
    setValues(prev => {
      const next = [...prev];
      next[A.PROGRAMA] = val;
      next[A.TURMA] = '';
      next[A.DATA_INICIO] = '';
      return next;
    });
  };

  const handleTurmaChange = (val: string) => {
    setValues(prev => {
      const next = [...prev];
      next[A.TURMA] = val;
      next[A.DATA_INICIO] = '';
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateRow('Alunos', row.originalIndex, values);
      toast.success('Aluno atualizado!');
      onSuccess();
    } catch {
      toast.error('Erro ao guardar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const ts = values[A.TIMESTAMP];
  const tsFormatted = ts ? (() => {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  })() : '—';

  return (
    <EditModalShell
      title="Editar Aluno"
      subtitle={`#${row.originalIndex} · ${values[A.NOME] || 'Sem nome'}`}
      avatar={values[A.NOME]?.[0] ?? '?'}
      saving={saving}
      onClose={onClose}
      onSave={handleSave}
      extraStyles={STYLES}
    >
      <div className="eam-section">
        <span className="dm-section-label">Contacto</span>
        <div className="eam-grid">
          <div className="form__group eam-col-2">
            <label className="form__label">Nome</label>
            <input className="form__input" value={values[A.NOME] ?? ''} onChange={e => updateField(A.NOME, e.target.value)} />
          </div>
          <div className="form__group eam-col-2">
            <label className="form__label">Email</label>
            <input className="form__input" type="email" value={values[A.EMAIL] ?? ''} onChange={e => updateField(A.EMAIL, e.target.value)} />
          </div>
          <div className="form__group">
            <label className="form__label">Telefone</label>
            <input className="form__input" type="tel" value={String(values[A.TELEFONE] ?? '').replace(/\.0$/, '')} onChange={e => updateField(A.TELEFONE, e.target.value)} />
          </div>
          <div className="form__group">
            <label className="form__label">Contacto Preferido</label>
            <select className="form__input" value={values[A.PREFERENCIA_CONTACTO] ?? ''} onChange={e => updateField(A.PREFERENCIA_CONTACTO, e.target.value)}>
              <option value="">—</option>
              <option value="Email">Email</option>
              <option value="Telefone">Telefone</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      <div className="eam-section">
        <span className="dm-section-label">Inscrição</span>
        <div className="eam-grid">
          <div className="form__group eam-col-2">
            <label className="form__label">Programa</label>
            {programOptions.length > 0 ? (
              <select className="form__input" value={values[A.PROGRAMA] ?? ''} onChange={e => handleProgramaChange(e.target.value)}>
                {!programOptions.includes(values[A.PROGRAMA]) && values[A.PROGRAMA] && (
                  <option value={values[A.PROGRAMA]}>{values[A.PROGRAMA]}</option>
                )}
                <option value="">— selecionar —</option>
                {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input className="form__input" value={values[A.PROGRAMA] ?? ''} onChange={e => updateField(A.PROGRAMA, e.target.value)} />
            )}
          </div>
          <div className="form__group">
            <label className="form__label">Turma</label>
            {turmaOptions.length > 0 ? (
              <select className="form__input" value={values[A.TURMA] ?? ''} onChange={e => handleTurmaChange(e.target.value)}>
                {!turmaOptions.includes(values[A.TURMA]) && values[A.TURMA] && (
                  <option value={values[A.TURMA]}>{values[A.TURMA]}</option>
                )}
                <option value="">— selecionar —</option>
                {turmaOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input className="form__input" value={values[A.TURMA] ?? ''} onChange={e => updateField(A.TURMA, e.target.value)} />
            )}
          </div>
          <div className="form__group">
            <label className="form__label">Data de Início</label>
            {periodoOptions.length > 0 ? (
              <select className="form__input" value={values[A.DATA_INICIO] ?? ''} onChange={e => updateField(A.DATA_INICIO, e.target.value)}>
                {!periodoOptions.includes(values[A.DATA_INICIO]) && values[A.DATA_INICIO] && (
                  <option value={values[A.DATA_INICIO]}>{values[A.DATA_INICIO]}</option>
                )}
                <option value="">— selecionar —</option>
                {periodoOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input className="form__input" value={values[A.DATA_INICIO] ?? ''} onChange={e => updateField(A.DATA_INICIO, e.target.value)} placeholder="Ex: Janeiro 2025" />
            )}
          </div>
          <div className="form__group">
            <label className="form__label">Transporte</label>
            <select className="form__input" value={values[A.TRANSPORTE] ?? ''} onChange={e => updateField(A.TRANSPORTE, e.target.value)}>
              <option value="">—</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
          <div className="form__group">
            <label className="form__label">Email Confirmado</label>
            <select className="form__input" value={values[A.EMAIL_CONF] ?? ''} onChange={e => updateField(A.EMAIL_CONF, e.target.value)}>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
        </div>
      </div>

      <div className="eam-section">
        <span className="dm-section-label">Notas</span>
        <div className="form__group">
          <textarea className="form__textarea" rows={3} value={values[A.NOTAS] ?? ''} onChange={e => updateField(A.NOTAS, e.target.value)} placeholder="Notas internas..." />
        </div>
      </div>

      <div className="eam-meta-row">
        <span className="eam-meta-label">Inscrito em</span>
        <span className="eam-meta-value">{tsFormatted}</span>
      </div>
    </EditModalShell>
  );
}
