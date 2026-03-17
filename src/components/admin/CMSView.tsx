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
    title: { pt: 'Formação em Faro\nque potencia o seu futuro.', en: '' },
    subtitle: { pt: 'FaroForma oferece formações personalizadas, apoio administrativo e explicações do secundário à universidade.', en: '' },
    buttonCursos: { pt: 'Ver Cursos', en: '' },
    buttonServicos: { pt: 'Ver Serviços', en: '' },
  },
  about: {
    title: { pt: 'Um novo conceito de\naprendizagem em Faro', en: '' },
    features: [
      { title: { pt: 'Abordagem centrada no cliente', en: '' }, desc: { pt: 'Soluções adaptadas às necessidades específicas de cada projeto.', en: '' } },
      { title: { pt: 'Equipa dedicada e qualificada', en: '' }, desc: { pt: 'Profissionais apaixonados por formação.', en: '' } },
    ],
  },
  services: {
    items: [
      { icon: 'GraduationCap', title: { pt: 'Formações Personalizadas', en: '' }, desc: { pt: 'Conteúdos e metodologias personalizadas para máxima eficácia.', en: '' } },
    ],
  },
  tutoring: {
    title: { pt: 'Explicações em Faro\npersonalizadas e eficazes', en: '' },
    description: { pt: 'Oferecemos explicações desde o secundário até à universidade.', en: '' },
    subjects: [
      { emoji: '∫', label: { pt: 'Matemática', en: '' } },
    ],
    levels: [
      { title: { pt: 'Secundário', en: '' }, desc: { pt: 'Preparação para exames nacionais', en: '' } },
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
  const [previewLang, setPreviewLang] = useState<'pt' | 'en'>('pt');

  useEffect(() => { loadSection(activeTab); }, [activeTab]);

  const loadSection = async (section: Section) => {
    setLoading(true);
    try {
      const res = await apiService.getCMS(section);
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
      toast.success('Alterações publicadas! A tradução automática está a ser processada.');
    } catch (err) {
      toast.error('Erro ao publicar.');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (section: Section) => {
    if (isDirty) {
      if (!confirm('Alterações não guardadas serão perdidas. Continuar?')) return;
    }
    setActiveTab(section);
    setIsDirty(false);
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

  if (loading && !data) return <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>;

  return (
    <div className="cms-container">
      <div className="cms-tabs">
        <TabItem active={activeTab === 'hero'} icon={<Layout size={18} />} label="Início (Hero)" onClick={() => handleTabChange('hero')} />
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
              <span className="cms-preview-title">Visualização do Site</span>
              <div className="preview-lang-toggle">
                <button className={previewLang === 'pt' ? 'is-active' : ''} onClick={() => setPreviewLang('pt')}>PT</button>
                <button className={previewLang === 'en' ? 'is-active' : ''} onClick={() => setPreviewLang('en')}>EN</button>
              </div>
            </div>
            <div className="cms-preview-body">
              {savedData ? (
                <SectionPreview section={activeTab} data={savedData} lang={previewLang} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem dados.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="cms-footer glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Info size={14} /> Os textos serão traduzidos para inglês automaticamente ao guardar.
        </div>
        <button className="btn btn--primary btn--lg" onClick={saveSection} disabled={saving || !isDirty}>
          {saving ? 'A publicar...' : <><Save size={18} /> Publicar Alterações</>}
        </button>
      </div>

      <style>{CMS_STYLES}</style>
    </div>
  );
}

function SectionPreview({ section, data, lang }: any) {
  const L = lang;
  return (
    <div className="preview-section">
      <PreviewField label="Título" value={data.title?.[L]} />
      {section === 'hero' && <PreviewField label="Subtítulo" value={data.subtitle?.[L]} muted />}
      {section === 'hero' && <div className="preview-row"><PreviewChip label={data.buttonCursos?.[L]} /><PreviewChip label={data.buttonServicos?.[L]} /></div>}
      {section === 'about' && (data.features || []).map((f: any, i: number) => <div key={i} className="preview-list-item"><span>• {f.title?.[L]}</span></div>)}
      {section === 'services' && (data.items || []).map((f: any, i: number) => <div key={i} className="preview-list-item"><span>• {f.title?.[L]}</span></div>)}
      {section === 'tutoring' && <PreviewField label="Descrição" value={data.description?.[L]} muted />}
    </div>
  );
}

function PreviewField({ label, value, muted }: any) {
  if (!value) return null;
  return (
    <div className="preview-field">
      <span className="preview-field-label">{label}</span>
      <span className={`preview-field-value ${muted ? 'muted' : ''}`}>{value}</span>
    </div>
  );
}

function PreviewChip({ label }: any) { return label ? <span className="preview-chip">{label}</span> : null; }

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
      <h4>Conteúdo Inicial</h4>
      <div className="editor-grid">
        <ImageUploader label="Imagem de Fundo" value={data?.backgroundImage} folder="hero" onChange={(v: string) => onChange(['backgroundImage'], v)} />
        <I18nField label="Título Principal" value={data?.title} onChange={(v: any) => onChange(['title'], v)} isTextArea />
        <I18nField label="Subtítulo" value={data?.subtitle} onChange={(v: any) => onChange(['subtitle'], v)} isTextArea />
        <div className="form__grid">
          <I18nField label="Texto Botão Cursos" value={data?.buttonCursos} onChange={(v: any) => onChange(['buttonCursos'], v)} />
          <I18nField label="Texto Botão Serviços" value={data?.buttonServicos} onChange={(v: any) => onChange(['buttonServicos'], v)} />
        </div>
      </div>
    </div>
  );
}

function AboutEditor({ data, onChange }: any) {
  return (
    <div className="editor-stack">
      <div className="editor-card glass">
        <h4>Sobre a FaroForma</h4>
        <div className="form__grid">
          <ImageUploader label="Imagem Sala 1" value={data?.imageSala1} folder="about" onChange={(v: string) => onChange(['imageSala1'], v)} />
          <ImageUploader label="Imagem Sala 2" value={data?.imageSala2} folder="about" onChange={(v: string) => onChange(['imageSala2'], v)} />
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <I18nField label="Título da Secção" value={data?.title} onChange={(v: any) => onChange(['title'], v)} />
        </div>
      </div>
      <ListEditor title="Destaques (Características)" items={data?.features || []} onChange={(items: any[]) => onChange(['features'], items)} type="feature" />
    </div>
  );
}

function TutoringEditor({ data, onChange }: any) {
  return (
    <div className="editor-stack">
      <div className="editor-card glass">
        <h4>Explicações e Apoio</h4>
        <div className="form__grid">
          <ImageUploader label="Imagem 1" value={data?.image1} folder="tutoring" onChange={(v: string) => onChange(['image1'], v)} />
          <ImageUploader label="Imagem 2" value={data?.image2} folder="tutoring" onChange={(v: string) => onChange(['image2'], v)} />
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <I18nField label="Título" value={data?.title} onChange={(v: any) => onChange(['title'], v)} />
          <I18nField label="Descrição Longa" value={data?.description} onChange={(v: any) => onChange(['description'], v)} isTextArea />
        </div>
      </div>
      <ListEditor title="Disciplinas" items={data?.subjects || []} onChange={(items: any[]) => onChange(['subjects'], items)} type="subject" />
      <ListEditor title="Níveis" items={data?.levels || []} onChange={(items: any[]) => onChange(['levels'], items)} type="level" />
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

  return (
    <div className="editor-card glass">
      <div className="card-header-with-action">
        <h4>{title}</h4>
        <button className="btn btn--outline btn--small" onClick={addItem}><Plus size={14} /> Adicionar</button>
      </div>
      <div className="items-list">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="list-item-card glass">
            <div className="item-actions">
              <button onClick={() => { const ni = [...items]; [ni[idx], ni[idx-1]] = [ni[idx-1], ni[idx]]; onChange(ni); }} disabled={idx === 0}><ChevronUp size={14} /></button>
              <button onClick={() => { const ni = [...items]; [ni[idx], ni[idx+1]] = [ni[idx+1], ni[idx]]; onChange(ni); }} disabled={idx === items.length - 1}><ChevronDown size={14} /></button>
              <button onClick={() => onChange(items.filter((_: any, i: number) => i !== idx))} className="delete"><Trash2 size={14} /></button>
            </div>
            <div className="item-content">
              {type === 'subject' ? (
                <div className="subject-row">
                  <input className="emoji-input" value={item.emoji} onChange={e => { const ni = [...items]; ni[idx].emoji = e.target.value; onChange(ni); }} />
                  <I18nField value={item.label} onChange={(v: any) => { const ni = [...items]; ni[idx].label = v; onChange(ni); }} hideLabel />
                </div>
              ) : (
                <div className="complex-item-grid">
                  <IconSelector value={item.icon} onChange={(v: string) => { const ni = [...items]; ni[idx].icon = v; onChange(ni); }} />
                  <div className="fields" style={{ flex: 1 }}>
                    <I18nField label="Título" value={item.title} onChange={(v: any) => { const ni = [...items]; ni[idx].title = v; onChange(ni); }} />
                    <I18nField label="Descrição" value={item.desc} onChange={(v: any) => { const ni = [...items]; ni[idx].desc = v; onChange(ni); }} isTextArea />
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
    <div className="form__group">
      {!hideLabel && <label className="form__label">{label}</label>}
      {isTextArea ? (
        <textarea className="form__textarea" value={value?.pt || ''} onChange={e => onChange({ pt: e.target.value, en: '' })} rows={2} placeholder="Escreva em Português..." />
      ) : (
        <input className="form__input" value={value?.pt || ''} onChange={e => onChange({ pt: e.target.value, en: '' })} placeholder="Escreva em Português..." />
      )}
    </div>
  );
}

function IconSelector({ value, onChange }: any) {
  const [open, setOpen] = useState(false);
  const commonIcons = ['GraduationCap', 'Users', 'Briefcase', 'Building2', 'FileText', 'Award', 'Target', 'MessageCircle', 'ShieldCheck', 'Globe'];
  return (
    <div className="icon-selector-wrap">
      <button className="icon-preview-btn" onClick={() => setOpen(!open)}>{(LucideIcons as any)[value] ? React.createElement((LucideIcons as any)[value], { size: 24 }) : <ImageIcon size={24} />}</button>
      {open && <div className="icon-dropdown glass">{commonIcons.map(name => <button key={name} onClick={() => { onChange(name); setOpen(false); }} className={value === name ? 'is-active' : ''}>{React.createElement((LucideIcons as any)[name], { size: 18 })}</button>)}</div>}
    </div>
  );
}

const CMS_STYLES = `
  .cms-container { display: flex; flex-direction: column; gap: 2rem; }
  .cms-tabs { display: flex; gap: 0.5rem; background: var(--bg-1); padding: 0.4rem; border-radius: var(--radius); border: 1px solid var(--border); width: fit-content; }
  .cms-tab { padding: 0.6rem 1.25rem; border-radius: calc(var(--radius) - 2px); border: none; background: transparent; color: var(--text-muted); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
  .cms-tab.is-active { background: var(--bg); color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

  .cms-workspace { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
  .cms-preview-col { position: sticky; top: 80px; }
  .cms-preview-panel { border-radius: var(--radius-lg); overflow: hidden; }
  .cms-preview-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-2); }
  .cms-preview-title { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
  .preview-lang-toggle { display: flex; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .preview-lang-toggle button { padding: 4px 10px; font-size: 0.7rem; font-weight: 800; border: none; background: transparent; color: var(--text-muted); cursor: pointer; }
  .preview-lang-toggle button.is-active { background: var(--accent); color: #fff; }
  
  .cms-preview-body { padding: 1.5rem; }
  .preview-field { margin-bottom: 1rem; }
  .preview-field-label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.25rem; }
  .preview-field-value { font-size: 0.85rem; color: var(--text); line-height: 1.5; }
  .preview-field-value.muted { color: var(--text-muted); }
  .preview-chip { font-size: 0.7rem; background: var(--bg-2); padding: 2px 8px; border-radius: 100px; border: 1px solid var(--border); margin-right: 0.4rem; }

  .editor-card { padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem; }
  .editor-card h4 { margin: 0 0 1.5rem; font-size: 1.1rem; }
  .card-header-with-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

  .items-list { display: flex; flex-direction: column; gap: 1.5rem; }
  .list-item-card { padding: 1.5rem; display: flex; gap: 1.5rem; }
  .item-actions { display: flex; flex-direction: column; gap: 0.5rem; border-right: 1px solid var(--border); padding-right: 1rem; }
  .item-actions button { background: none; border: none; color: var(--text-muted); cursor: pointer; }
  .item-actions button.delete:hover { color: #ef4444; }

  .complex-item-grid { display: flex; gap: 1.5rem; align-items: flex-start; }
  .icon-preview-btn { width: 50px; height: 50px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-2); color: var(--accent); cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .icon-dropdown { position: absolute; top: 60px; left: 0; width: 200px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; padding: 0.75rem; z-index: 100; }
  .icon-dropdown button { padding: 8px; border-radius: 6px; background: transparent; border: none; cursor: pointer; color: var(--text-muted); }
  .icon-dropdown button.is-active { background: rgba(var(--accent-rgb), 0.1); color: var(--accent); }

  .subject-row { display: grid; grid-template-columns: 60px 1fr; gap: 1.5rem; align-items: flex-start; }
  .emoji-input { height: 44px; font-size: 1.5rem; text-align: center; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; }

  .cms-footer { position: sticky; bottom: 0; background: var(--bg-1); padding: 1.5rem 2rem; border-top: 1px solid var(--border); margin-top: 2rem; display: flex; justify-content: space-between; align-items: center; border-radius: var(--radius-lg); }

  @media (max-width: 1024px) {
    .cms-workspace { grid-template-columns: 1fr; }
    .cms-preview-col { display: none; }
  }
`;
