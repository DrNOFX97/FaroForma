import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Layout, 
  Info, 
  Briefcase, 
  GraduationCap, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { apiService } from '../../services/api';
import { ImageUploader } from './ImageUploader';
import toast from 'react-hot-toast';

type Section = 'hero' | 'about' | 'services' | 'tutoring';

const SECTION_DEFAULTS: Record<Section, any> = {
  hero: {
    title: {
      pt: 'Formação em Faro\nque potencia o seu futuro.',
      en: 'Training in Faro\nthat boosts your future.',
    },
    subtitle: {
      pt: 'FaroForma oferece formações personalizadas, apoio administrativo e explicações do secundário à universidade. Excelência e proximidade em Faro.',
      en: 'FaroForma offers tailored training, administrative support, and tutoring from secondary school to university. Excellence and proximity in Faro.',
    },
    buttonCursos: 'Ver Cursos',
    buttonServicos: 'Ver Serviços',
  },
  about: {
    title: {
      pt: 'Um novo conceito de\naprendizagem em Faro',
      en: 'A new concept of\nlearning in Faro',
    },
    features: [
      { title: { pt: 'Abordagem centrada no cliente', en: 'Client-centric approach' }, desc: { pt: 'Soluções adaptadas às necessidades específicas de cada projeto.', en: 'Tailored solutions adapted to the specific needs of each project.' } },
      { title: { pt: 'Equipa dedicada e qualificada', en: 'Dedicated and qualified team' }, desc: { pt: 'Profissionais apaixonados por formação e dedicados ao sucesso dos alunos.', en: 'Professionals passionate about training and dedicated to student success.' } },
      { title: { pt: 'Localização privilegiada em Faro', en: 'Prime location in Faro' }, desc: { pt: 'No coração da cidade, de fácil acesso a toda a região.', en: 'In the heart of the city, with easy access to the entire region.' } },
      { title: { pt: 'Resultados eficazes e duradouros', en: 'Effective and lasting results' }, desc: { pt: 'Metodologias comprovadas que geram valor real e mensurável.', en: 'Proven methodologies that generate real and measurable value.' } },
    ],
  },
  services: {
    items: [
      { icon: 'GraduationCap', title: { pt: 'Formações Personalizadas em Faro', en: 'Customised Training in Faro' }, desc: { pt: 'Formações adaptadas às necessidades específicas dos nossos clientes em Faro, com conteúdos e metodologias personalizadas para máxima eficácia.', en: 'Training adapted to the specific needs of our clients in Faro, with personalised content and methodologies for maximum effectiveness.' } },
      { icon: 'Users', title: { pt: 'Aluguer de Sala de Reuniões em Faro', en: 'Meeting Room Hire in Faro' }, desc: { pt: 'Espaços modernos e bem equipados para reuniões de negócios no centro de Faro, com acesso a todo o equipamento audiovisual necessário.', en: 'Modern and well-equipped spaces for business meetings in Faro city centre, with access to all necessary audiovisual equipment.' } },
      { icon: 'Building2', title: { pt: 'Aluguer de Sala de Formação em Faro', en: 'Training Room Hire in Faro' }, desc: { pt: 'Salas confortáveis e tecnicamente preparadas em Faro para hospedar as suas formações e eventos educacionais com total apoio logístico.', en: 'Comfortable and technically prepared rooms in Faro to host your training sessions and educational events with full logistical support.' } },
      { icon: 'Briefcase', title: { pt: 'Administração de Empresas em Faro', en: 'Business Administration in Faro' }, desc: { pt: 'Serviços especializados de administração em Faro que ajudam na organização eficiente das operações empresariais e na tomada de decisões.', en: 'Specialised administration services in Faro that help in the efficient organisation of business operations and decision-making.' } },
      { icon: 'FileText', title: { pt: 'Serviços Administrativos em Faro', en: 'Administrative Services in Faro' }, desc: { pt: 'Apoio completo em gestão administrativa, documentação e processos burocráticos para empresas em Faro, poupando tempo e recursos.', en: 'Full support in administrative management, documentation and business bureaucratic processes in Faro, saving time and resources.' } },
    ],
  },
  tutoring: {
    title: {
      pt: 'Explicações em Faro\npersonalizadas e eficazes',
      en: 'Tutoring in Faro\npersonalised and effective',
    },
    description: {
      pt: 'Oferecemos explicações desde o secundário até à universidade, com aulas personalizadas e metodologias adaptadas ao nível e objetivos de cada aluno. Os nossos professores são especialistas nas suas áreas.',
      en: 'We offer tutoring from secondary school to university, with personalised classes and methodologies adapted to the level and goals of each student. Our teachers are specialists in their fields.',
    },
    subjects: [
      { emoji: '∫', label: { pt: 'Matemática', en: 'Maths' } },
      { emoji: '🇬🇧', label: { pt: 'Inglês', en: 'English' } },
      { emoji: '🇫🇷', label: { pt: 'Francês', en: 'French' } },
      { emoji: '🇪🇸', label: { pt: 'Espanhol', en: 'Spanish' } },
      { emoji: '📊', label: { pt: 'Economia & Gestão', en: 'Economics & Management' } },
      { emoji: '🔬', label: { pt: 'Ciências', en: 'Sciences' } },
      { emoji: '📖', label: { pt: 'Português', en: 'Portuguese' } },
      { emoji: '🌍', label: { pt: 'História & Geografia', en: 'History & Geography' } },
    ],
    levels: [
      { title: { pt: 'Secundário', en: 'Secondary' }, desc: { pt: '10.º ao 12.º ano · Preparação para exames nacionais', en: 'Year 10 to 12 · Preparation for national exams' } },
      { title: { pt: 'Universitário', en: 'University' }, desc: { pt: 'Apoio em unidades curriculares e dissertações', en: 'Support in curricular units and dissertations' } },
      { title: { pt: 'Intensivos', en: 'Intensives' }, desc: { pt: 'Preparação focada para datas específicas', en: 'Focused preparation for specific dates' } },
      { title: { pt: 'Online & Presencial', en: 'Online & In-person' }, desc: { pt: 'Flexibilidade para todas as necessidades', en: 'Flexibility for all needs' } },
    ],
  },
};

export function CMSView() {
  const [activeTab, setActiveTab] = useState<Section>('hero');
  const [data, setData] = useState<any>(null);
  const [savedData, setSavedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadSection(activeTab);
  }, [activeTab]);

  const loadSection = async (section: Section) => {
    setLoading(true);
    try {
      const res = await apiService.getCMS(section);
      // Merge defaults with Firestore data so editor/preview always show current site content
      const merged = { ...SECTION_DEFAULTS[section], ...res };
      setData(merged);
      setSavedData(merged);
    } catch (err) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      await apiService.updateCMS(activeTab, data);
      setSavedData(JSON.parse(JSON.stringify(data)));
      setIsDirty(false);
      toast.success('Alterações publicadas com sucesso!');
    } catch (err) {
      toast.error('Erro ao publicar.');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (section: Section) => {
    if (isDirty && !confirm('Tens alterações não guardadas. Continuar?')) return;
    setIsDirty(false);
    setActiveTab(section);
  };

  const updateField = (path: string[], value: any) => {
    setIsDirty(true);
    const newData = JSON.parse(JSON.stringify(data));
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setData(newData);
  };

  if (loading && !data) return <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;

  return (
    <div className="cms-container">
      <div className="cms-tabs">
        <TabItem active={activeTab === 'hero'} icon={<Layout size={18} />} label="Hero" onClick={() => handleTabChange('hero')} />
        <TabItem active={activeTab === 'about'} icon={<Info size={18} />} label="Sobre Nós" onClick={() => handleTabChange('about')} />
        <TabItem active={activeTab === 'services'} icon={<Briefcase size={18} />} label="Serviços" onClick={() => handleTabChange('services')} />
        <TabItem active={activeTab === 'tutoring'} icon={<GraduationCap size={18} />} label="Explicações" onClick={() => handleTabChange('tutoring')} />
      </div>

      <div className="cms-workspace">
        <div className="cms-editor-col">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === 'hero' && <HeroEditor data={data} onChange={updateField} />}
              {activeTab === 'about' && <AboutEditor data={data} onChange={updateField} />}
              {activeTab === 'services' && <ListEditor title="Lista de Serviços" items={data?.items || []} onChange={(items: any[]) => updateField(['items'], items)} type="service" />}
              {activeTab === 'tutoring' && <TutoringEditor data={data} onChange={updateField} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="cms-preview-col">
          <div className="cms-preview-panel glass">
            <div className="cms-preview-header">
              <span className="cms-preview-badge">Publicado</span>
              <span className="cms-preview-title">Conteúdo atual no site</span>
            </div>
            <div className="cms-preview-body">
              {savedData ? (
                <SectionPreview section={activeTab} data={savedData} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem dados publicados.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="cms-footer">
        <button className="btn btn--primary btn--lg" onClick={saveSection} disabled={saving}>
          {saving ? 'A publicar...' : <><Save size={18} /> Publicar no Site</>}
        </button>
      </div>

      <style>{CMS_STYLES}</style>
    </div>
  );
}

function SectionPreview({ section, data }: { section: Section; data: any }) {
  if (!data) return null;

  if (section === 'hero') return (
    <div className="preview-section">
      {data.backgroundImage && <img src={data.backgroundImage} alt="" className="preview-img" />}
      <PreviewField label="Título PT" value={data.title?.pt} />
      <PreviewField label="Título EN" value={data.title?.en} />
      <PreviewField label="Subtítulo PT" value={data.subtitle?.pt} />
      <PreviewField label="Subtítulo EN" value={data.subtitle?.en} />
      <div className="preview-row">
        <PreviewChip label={data.buttonCursos || '—'} />
        <PreviewChip label={data.buttonServicos || '—'} />
      </div>
    </div>
  );

  if (section === 'about') return (
    <div className="preview-section">
      <div className="preview-img-row">
        {data.imageSala1 && <img src={data.imageSala1} alt="Sala 1" className="preview-img-thumb" />}
        {data.imageSala2 && <img src={data.imageSala2} alt="Sala 2" className="preview-img-thumb" />}
      </div>
      <PreviewField label="Título PT" value={data.title?.pt} />
      <PreviewField label="Título EN" value={data.title?.en} />
      {(data.features || []).length > 0 && (
        <div className="preview-list">
          <span className="preview-list-label">Destaques ({data.features.length})</span>
          {data.features.map((f: any, i: number) => (
            <div key={i} className="preview-list-item">
              <span className="preview-dot" />
              <span>{f.title?.pt || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (section === 'services') return (
    <div className="preview-section">
      {(data.items || []).length === 0
        ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem serviços.</span>
        : (
          <div className="preview-list">
            <span className="preview-list-label">Serviços ({data.items.length})</span>
            {data.items.map((item: any, i: number) => (
              <div key={i} className="preview-list-item">
                {(LucideIcons as any)[item.icon] && React.createElement((LucideIcons as any)[item.icon], { size: 13, style: { flexShrink: 0, color: 'var(--accent)' } })}
                <span>{item.title?.pt || '—'}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );

  if (section === 'tutoring') return (
    <div className="preview-section">
      <div className="preview-img-row">
        {data.image1 && <img src={data.image1} alt="" className="preview-img-thumb" />}
        {data.image2 && <img src={data.image2} alt="" className="preview-img-thumb" />}
      </div>
      <PreviewField label="Título PT" value={data.title?.pt} />
      <PreviewField label="Descrição PT" value={data.description?.pt} muted />
      {(data.subjects || []).length > 0 && (
        <div className="preview-list">
          <span className="preview-list-label">Disciplinas ({data.subjects.length})</span>
          <div className="preview-chips-wrap">
            {data.subjects.map((s: any, i: number) => (
              <PreviewChip key={i} label={`${s.emoji || ''} ${s.label?.pt || '—'}`} />
            ))}
          </div>
        </div>
      )}
      {(data.levels || []).length > 0 && (
        <div className="preview-list">
          <span className="preview-list-label">Níveis ({data.levels.length})</span>
          {data.levels.map((l: any, i: number) => (
            <div key={i} className="preview-list-item">
              <span className="preview-dot" />
              <span>{l.title?.pt || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return null;
}

function PreviewField({ label, value, muted }: { label: string; value?: string; muted?: boolean }) {
  if (!value) return null;
  return (
    <div className="preview-field">
      <span className="preview-field-label">{label}</span>
      <span className={`preview-field-value ${muted ? 'muted' : ''}`}>{value}</span>
    </div>
  );
}

function PreviewChip({ label }: { label: string }) {
  return <span className="preview-chip">{label}</span>;
}

function TabItem({ active, icon, label, onClick }: any) {
  return (
    <button className={`cms-tab ${active ? 'is-active' : ''}`} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  );
}

function HeroEditor({ data, onChange }: any) {
  return (
    <div className="editor-card glass">
      <h4>Conteúdo do Cabeçalho (Hero)</h4>
      <div className="editor-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <ImageUploader label="Imagem de Fundo (Opcional)" value={data?.backgroundImage} folder="hero" onChange={(v: string) => onChange(['backgroundImage'], v)} />
        <div className="editor-stack">
          <I18nField label="Título Principal" value={data?.title} onChange={(v: any) => onChange(['title'], v)} isTextArea />
          <I18nField label="Subtítulo" value={data?.subtitle} onChange={(v: any) => onChange(['subtitle'], v)} isTextArea />
          <div className="i18n-inputs">
            <div className="form__group">
              <label className="form__label">Texto Botão Cursos</label>
              <input className="form__input" value={data?.buttonCursos || ''} onChange={e => onChange(['buttonCursos'], e.target.value)} />
            </div>
            <div className="form__group">
              <label className="form__label">Texto Botão Serviços</label>
              <input className="form__input" value={data?.buttonServicos || ''} onChange={e => onChange(['buttonServicos'], e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutEditor({ data, onChange }: any) {
  return (
    <div className="editor-stack">
      <div className="editor-card glass">
        <h4>Imagens e Textos Gerais</h4>
        <div className="editor-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <ImageUploader label="Imagem da Sala 1" value={data?.imageSala1} folder="about" onChange={(v: string) => onChange(['imageSala1'], v)} />
          <ImageUploader label="Imagem da Sala 2" value={data?.imageSala2} folder="about" onChange={(v: string) => onChange(['imageSala2'], v)} />
        </div>
        <div style={{ marginTop: '2rem' }}>
          <I18nField label="Título da Secção" value={data?.title} onChange={(v: any) => onChange(['title'], v)} />
        </div>
      </div>
      <ListEditor title="Destaques (Features)" items={data?.features || []} onChange={(items: any[]) => onChange(['features'], items)} type="feature" />
    </div>
  );
}

function TutoringEditor({ data, onChange }: any) {
  return (
    <div className="editor-stack">
      <div className="editor-card glass">
        <h4>Conteúdo e Imagens</h4>
        <div className="editor-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <ImageUploader label="Imagem 1" value={data?.image1} folder="tutoring" onChange={(v: string) => onChange(['image1'], v)} />
          <ImageUploader label="Imagem 2" value={data?.image2} folder="tutoring" onChange={(v: string) => onChange(['image2'], v)} />
        </div>
        <div style={{ marginTop: '2rem' }}>
          <I18nField label="Título Principal" value={data?.title} onChange={(v: any) => onChange(['title'], v)} />
          <I18nField label="Descrição" value={data?.description} onChange={(v: any) => onChange(['description'], v)} isTextArea />
        </div>
      </div>
      <ListEditor title="Disciplinas / Matérias" items={data?.subjects || []} onChange={(items: any[]) => onChange(['subjects'], items)} type="subject" />
      <ListEditor title="Níveis de Ensino" items={data?.levels || []} onChange={(items: any[]) => onChange(['levels'], items)} type="level" />
    </div>
  );
}

function ListEditor({ title, items, onChange, type }: any) {
  const addItem = () => {
    const newItem = type === 'subject' 
      ? { label: { pt: '', en: '' }, emoji: '📚' }
      : { title: { pt: '', en: '' }, desc: { pt: '', en: '' }, icon: 'GraduationCap' };
    onChange([...items, newItem]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_: any, i: number) => i !== idx));
  };

  const move = (idx: number, dir: number) => {
    if (idx + dir < 0 || idx + dir >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx+dir]] = [newItems[idx+dir], newItems[idx]];
    onChange(newItems);
  };

  return (
    <div className="editor-card glass">
      <div className="card-header-with-action">
        <h4>{title}</h4>
        <button className="btn btn--outline btn--small" onClick={addItem}><Plus size={14} /> Adicionar Item</button>
      </div>
      <div className="items-list">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="list-item-card glass">
            <div className="item-actions">
              <button onClick={() => move(idx, -1)} disabled={idx === 0}><ChevronUp size={14} /></button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}><ChevronDown size={14} /></button>
              <button onClick={() => removeItem(idx)} className="delete"><Trash2 size={14} /></button>
            </div>
            <div className="item-content">
              {type === 'subject' ? (
                <div className="subject-row">
                  <input className="emoji-input" value={item.emoji} onChange={e => {
                    const ni = [...items]; ni[idx].emoji = e.target.value; onChange(ni);
                  }} />
                  <I18nField value={item.label} onChange={(v: any) => {
                    const ni = [...items]; ni[idx].label = v; onChange(ni);
                  }} hideLabel />
                </div>
              ) : (
                <div className="complex-item-grid">
                  <IconSelector value={item.icon} onChange={(v: string) => {
                    const ni = [...items]; ni[idx].icon = v; onChange(ni);
                  }} />
                  <div className="fields" style={{ flex: 1 }}>
                    <I18nField label="Título" value={item.title} onChange={(v: any) => {
                      const ni = [...items]; ni[idx].title = v; onChange(ni);
                    }} />
                    <I18nField label="Descrição" value={item.desc} onChange={(v: any) => {
                      const ni = [...items]; ni[idx].desc = v; onChange(ni);
                    }} isTextArea />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function I18nField({ label, value, onChange, isTextArea, hideLabel }: any) {
  return (
    <div className="i18n-group">
      {!hideLabel && <label className="form__label">{label}</label>}
      <div className="i18n-inputs">
        <div className="lang-field">
          <span className="lang-tag">PT</span>
          {isTextArea ? (
            <textarea className="form__textarea" value={value?.pt || ''} onChange={e => onChange({...value, pt: e.target.value})} rows={2} />
          ) : (
            <input className="form__input" value={value?.pt || ''} onChange={e => onChange({...value, pt: e.target.value})} />
          )}
        </div>
        <div className="lang-field">
          <span className="lang-tag">EN</span>
          {isTextArea ? (
            <textarea className="form__textarea" value={value?.en || ''} onChange={e => onChange({...value, en: e.target.value})} rows={2} />
          ) : (
            <input className="form__input" value={value?.en || ''} onChange={e => onChange({...value, en: e.target.value})} />
          )}
        </div>
      </div>
    </div>
  );
}

function IconSelector({ value, onChange }: any) {
  const [open, setOpen] = useState(false);
  const commonIcons = ['GraduationCap', 'Users', 'Briefcase', 'Building2', 'FileText', 'Award', 'Target', 'MessageCircle', 'ShieldCheck', 'Globe'];

  return (
    <div className="icon-selector-wrap">
      <button className="icon-preview-btn" onClick={() => setOpen(!open)}>
        {(LucideIcons as any)[value] ? 
          React.createElement((LucideIcons as any)[value], { size: 24 }) : 
          <ImageIcon size={24} />
        }
      </button>
      {open && (
        <div className="icon-dropdown glass">
          {commonIcons.map(name => (
            <button key={name} onClick={() => { onChange(name); setOpen(false); }} className={value === name ? 'is-active' : ''}>
              {React.createElement((LucideIcons as any)[name], { size: 18 })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CMS_STYLES = `
  .cms-container { display: flex; flex-direction: column; gap: 2rem; }
  .cms-tabs { display: flex; gap: 0.5rem; background: var(--bg-1); padding: 0.4rem; border-radius: var(--radius); border: 1px solid var(--border); width: fit-content; }
  .cms-tab { padding: 0.6rem 1.25rem; border-radius: calc(var(--radius) - 2px); border: none; background: transparent; color: var(--text-muted); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
  .cms-tab:hover { color: var(--text); background: var(--bg-2); }
  .cms-tab.is-active { background: var(--bg); color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

  /* Workspace split */
  .cms-workspace { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }
  .cms-editor-col { min-width: 0; }
  .cms-preview-col { position: sticky; top: 80px; }

  /* Preview panel */
  .cms-preview-panel { border-radius: var(--radius-lg); overflow: hidden; }
  .cms-preview-header { padding: 0.875rem 1rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.6rem; background: var(--bg-2); }
  .cms-preview-badge { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; background: rgba(16,185,129,0.15); color: #10b981; padding: 2px 7px; border-radius: 100px; }
  .cms-preview-title { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); }
  .cms-preview-body { padding: 1rem; }

  .preview-section { display: flex; flex-direction: column; gap: 0.875rem; }
  .preview-img { width: 100%; height: 90px; object-fit: cover; border-radius: var(--radius); margin-bottom: 0.25rem; }
  .preview-img-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .preview-img-thumb { width: 100%; height: 60px; object-fit: cover; border-radius: var(--radius); }

  .preview-field { display: flex; flex-direction: column; gap: 0.2rem; }
  .preview-field-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-dim); }
  .preview-field-value { font-size: 0.82rem; color: var(--text); line-height: 1.4; }
  .preview-field-value.muted { color: var(--text-muted); font-size: 0.78rem; }

  .preview-list { display: flex; flex-direction: column; gap: 0.35rem; }
  .preview-list-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-dim); margin-bottom: 0.1rem; }
  .preview-list-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); }
  .preview-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

  .preview-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .preview-chips-wrap { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .preview-chip { font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 100px; background: var(--bg-2); color: var(--text-muted); border: 1px solid var(--border); white-space: nowrap; }

  .editor-stack { display: flex; flex-direction: column; gap: 2rem; }
  .editor-card { padding: 2rem; border-radius: var(--radius-lg); }
  .editor-card h4 { margin: 0 0 1.5rem; font-size: 1rem; font-weight: 700; color: var(--text); }
  .card-header-with-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .card-header-with-action h4 { margin: 0; }

  .editor-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  .i18n-group { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; }
  .i18n-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .lang-field { position: relative; }
  .lang-tag { position: absolute; right: 10px; top: 10px; font-size: 0.6rem; font-weight: 800; color: var(--text-dim); background: var(--bg-2); padding: 2px 4px; border-radius: 4px; z-index: 1; pointer-events: none; }

  .items-list { display: flex; flex-direction: column; gap: 1rem; }
  .list-item-card { padding: 1.5rem; border-radius: var(--radius); display: flex; gap: 1.5rem; position: relative; }
  .item-actions { display: flex; flex-direction: column; gap: 0.5rem; border-right: 1px solid var(--border); padding-right: 1rem; }
  .item-actions button { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; }
  .item-actions button:hover:not(:disabled) { color: var(--text); background: var(--bg-2); }
  .item-actions button.delete:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
  .item-content { flex: 1; }

  .complex-item-grid { display: flex; gap: 1.5rem; }
  .icon-selector-wrap { position: relative; }
  .icon-preview-btn { width: 64px; height: 64px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-2); color: var(--accent); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .icon-preview-btn:hover { border-color: var(--accent); }
  .icon-dropdown { position: absolute; top: 72px; left: 0; width: 200px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; padding: 0.75rem; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
  .icon-dropdown button { padding: 8px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
  .icon-dropdown button:hover { background: var(--bg-2); color: var(--text); }
  .icon-dropdown button.is-active { background: rgba(16, 185, 129, 0.1); color: var(--accent); border-color: var(--accent); }

  .subject-row { display: grid; grid-template-columns: 64px 1fr; gap: 1rem; align-items: flex-start; }
  .emoji-input { height: 44px; font-size: 1.5rem; text-align: center; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); width: 100%; }

  .cms-footer { position: sticky; bottom: 0; background: var(--bg); padding: 1.5rem 0; border-top: 1px solid var(--border); margin-top: 2rem; display: flex; justify-content: flex-end; z-index: 50; }

  @media (max-width: 1200px) {
    .cms-workspace { grid-template-columns: 1fr; }
    .cms-preview-col { position: static; }
    .cms-preview-panel { display: none; }
  }
  @media (max-width: 1024px) {
    .i18n-inputs { grid-template-columns: 1fr; }
    .editor-grid { grid-template-columns: 1fr !important; }
  }
`;
