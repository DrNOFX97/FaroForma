import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { ShieldCheck, Info, MessageSquare, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export function ConfigView() {
  const [config, setConfig] = useState<any>({ 
    title: '', 
    description: '', 
    keywords: '', 
    contactEmail: '',
    gbpDescription: '', // For Google Business Profile (750 chars)
    gbpCategories: '',
    gbpAttributes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await apiService.getConfig();
      setConfig((prev: any) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiService.saveConfig(config);
      toast.success('Configurações de SEO e Site guardadas!');
    } catch (err) {
      toast.error('Erro ao guardar.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Prompt copiado!');
  };

  if (loading) return <div className="glass" style={{ padding: '2rem' }}>A carregar configurações...</div>;

  return (
    <div className="admin-config-view">
      <div className="config-grid">
        
        {/* Site Meta & SEO */}
        <div className="glass config-section">
          <div className="section-header">
            <Info size={18} className="text-accent" />
            <h3>Meta-Tags do Site</h3>
          </div>
          <div className="form__grid">
            <div className="form__group form__group--full">
              <label className="form__label">Título do Site (SEO)</label>
              <input type="text" className="form__input" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} />
            </div>
            <div className="form__group form__group--full">
              <label className="form__label">Descrição do Site (Google Search)</label>
              <textarea className="form__textarea" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} rows={3} />
            </div>
            <div className="form__group">
              <label className="form__label">Keywords (Separadas por vírgula)</label>
              <input type="text" className="form__input" value={config.keywords} onChange={e => setConfig({...config, keywords: e.target.value})} />
            </div>
            <div className="form__group">
              <label className="form__label">Email de Contacto Público</label>
              <input type="email" className="form__input" value={config.contactEmail} onChange={e => setConfig({...config, contactEmail: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Local SEO / GBP Optimization (From claude_seo.md) */}
        <div className="glass config-section seo-local-section">
          <div className="section-header">
            <ShieldCheck size={18} style={{ color: '#3b82f6' }} />
            <h3>Google Business Profile (SEO Local)</h3>
          </div>
          <div className="form__grid">
            <div className="form__group form__group--full">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form__label">Descrição Google Maps (Máx. 750)</label>
                <span style={{ fontSize: '0.7rem', color: (config.gbpDescription?.length || 0) > 750 ? '#ef4444' : 'var(--text-muted)' }}>
                  {config.gbpDescription?.length || 0} / 750
                </span>
              </div>
              <textarea
                className="form__textarea"
                value={config.gbpDescription}
                onChange={e => setConfig({...config, gbpDescription: e.target.value})}
                rows={4}
                maxLength={750}
                placeholder="Escreva a descrição focada em Faro e keywords locais..."
              />
            </div>
            <div className="form__group">
              <label className="form__label">Categorias GBP</label>
              <input 
                type="text" className="form__input" 
                value={config.gbpCategories} onChange={e => setConfig({...config, gbpCategories: e.target.value})} 
                placeholder="Ex: Centro de Formação, Professor Particular"
              />
            </div>
            <div className="form__group">
              <label className="form__label">Atributos (Labels)</label>
              <input 
                type="text" className="form__input" 
                value={config.gbpAttributes} onChange={e => setConfig({...config, gbpAttributes: e.target.value})} 
                placeholder="Ex: Gerido por mulheres, Entrada acessível"
              />
            </div>
          </div>
        </div>

        {/* Claude Prompt Library (Shortcut) */}
        <div className="glass config-section prompts-section">
          <div className="section-header">
            <MessageSquare size={18} style={{ color: '#8b5cf6' }} />
            <h3>Biblioteca de Prompts (Lançamento & Growth)</h3>
          </div>
          <div className="prompt-list">
            <PromptItem 
              title="Auditoria de Configuração Inicial" 
              desc="Analise o que os líderes de Faro fazem para copiar o sucesso."
              prompt={`Analisa os top 3 concorrentes para 'Formação em Faro' e 'Explicações em Faro' no Google Maps. Identifica as categorias (principal e secundárias) e atributos (ex: gerido por mulheres, estacionamento, etc.) que eles usam. Cria uma lista de verificação para o meu novo perfil ser competitivo desde o dia 1.`}
              onCopy={copyToClipboard}
            />
            <PromptItem 
              title="Escrita de Descrição de Alta Conversão" 
              desc="Gera descrições focadas em atrair os primeiros alunos."
              prompt={`Atua como um especialista em SEO Local. Escreve 3 versões de descrição (máx 750 chars) para a FaroForma em Faro. Versão 1: Focada em Keywords ('Explicações', 'Formação', 'Apoio Administrativo'). Versão 2: Focada em Autoridade/Confiança. Versão 3: Equilibrada. Inclui estas áreas: [Inserir Áreas de Especialidade].`}
              onCopy={copyToClipboard}
            />
            <PromptItem 
              title="Plano de Conteúdo de Lançamento" 
              desc="4 semanas de posts para sinalizar atividade ao Google."
              prompt={`Cria um calendário de posts de 4 semanas para o lançamento do meu Google Business Profile em Faro. Foca em: Apresentar as Salas (1 e 2), destacar a expertise dos formadores e explicar os benefícios das explicações personalizadas. Escreve o copy dos primeiros 8 posts, sempre incluindo 'Faro' e um CTA para contacto.`}
              onCopy={copyToClipboard}
            />
            <PromptItem 
              title="Estratégia para Primeiras Avaliações" 
              desc="Como pedir feedback aos primeiros parceiros/alunos."
              prompt={`Cria um guião curto e profissional (para WhatsApp e Email) para pedir as primeiras avaliações no Google a parceiros ou aos primeiros alunos. O objetivo é que eles mencionem especificamente 'Formação' ou 'Explicações' e a cidade de 'Faro' no texto da avaliação.`}
              onCopy={copyToClipboard}
            />
          </div>
        </div>

      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn--primary btn--lg" onClick={save} disabled={saving}>
          {saving ? 'A Guardar...' : 'Guardar Todas as Definições'}
        </button>
      </div>

      <style>{CONFIG_STYLES}</style>
    </div>
  );
}

function PromptItem({ title, desc, prompt, onCopy }: any) {
  return (
    <div className="prompt-item">
      <div className="prompt-info">
        <strong>{title}</strong>
        <span>{desc}</span>
      </div>
      <button className="admin-action-btn" onClick={() => onCopy(prompt)} title="Copiar Prompt">
        <Copy size={14} />
      </button>
    </div>
  );
}

const CONFIG_STYLES = `
  .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
  .config-section { padding: 2rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 1.5rem; }
  .section-header { display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 0.5rem; }
  .section-header h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
  
  .prompt-list { display: flex; flex-direction: column; gap: 1rem; }
  .prompt-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-2); border-radius: var(--radius); border: 1px solid var(--border); }
  .prompt-info { display: flex; flex-direction: column; gap: 0.25rem; }
  .prompt-info strong { font-size: 0.85rem; color: var(--text); }
  .prompt-info span { font-size: 0.75rem; color: var(--text-muted); }

  @media (max-width: 768px) {
    .config-grid { grid-template-columns: 1fr; }
  }
`;
