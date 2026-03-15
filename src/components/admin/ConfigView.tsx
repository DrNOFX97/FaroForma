import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { apiService } from '../../services/api';

export function ConfigView() {
  const [config, setConfig] = useState<any>({ title: '', description: '', keywords: '', contactEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [admins, setAdmins] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    Promise.all([fetchConfig(), fetchAdmins()]);
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await apiService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const emails = await apiService.getAdmins();
      setAdmins(emails);
    } catch (err) {
      console.error(err);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await apiService.saveConfig(config);
      setMsg('Configurações guardadas!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Erro ao guardar.');
    } finally {
      setSaving(false);
    }
  };

  const saveAdmins = async (list: string[]) => {
    setAdminSaving(true);
    setAdminMsg('');
    try {
      await apiService.saveAdmins(list);
      setAdminMsg('Guardado!');
      setTimeout(() => setAdminMsg(''), 2000);
    } catch (err) {
      setAdminMsg('Erro ao guardar.');
    } finally {
      setAdminSaving(false);
    }
  };

  const addAdmin = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || admins.includes(email)) return;
    const updated = [...admins, email];
    setAdmins(updated);
    setNewEmail('');
    await saveAdmins(updated);
  };

  const removeAdmin = async (email: string) => {
    const updated = admins.filter(e => e !== email);
    setAdmins(updated);
    await saveAdmins(updated);
  };

  if (loading) return <div className="glass" style={{ padding: '2rem' }}>A carregar configurações...</div>;

  return (
    <div className="admin-config-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '2rem' }}>Definições do Site</h3>
        <div className="form__grid" style={{ maxWidth: 600 }}>
          <div className="form__group form__group--full"><label className="form__label">Título do Site</label><input type="text" className="form__input" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} /></div>
          <div className="form__group form__group--full"><label className="form__label">Descrição (SEO)</label><textarea className="form__textarea" value={config.description} onChange={e => setConfig({...config, description: e.target.value})} rows={3} /></div>
          <div className="form__group"><label className="form__label">Keywords</label><input type="text" className="form__input" value={config.keywords} onChange={e => setConfig({...config, keywords: e.target.value})} /></div>
          <div className="form__group"><label className="form__label">Email de Contacto</label><input type="email" className="form__input" value={config.contactEmail} onChange={e => setConfig({...config, contactEmail: e.target.value})} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn--primary" onClick={save} disabled={saving}>{saving ? 'A Guardar...' : 'Guardar Alterações'}</button>
            {msg && <span style={{ fontSize: '0.85rem', color: msg.includes('Erro') ? '#ef4444' : 'var(--accent)' }}>{msg}</span>}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Administradores</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Emails com acesso ao backoffice e que recebem notificações de novas submissões.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', maxWidth: 480 }}>
          {admins.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum administrador definido.</p>
          )}
          {admins.map(email => (
            <div key={email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '0.9rem' }}>{email}</span>
              <button
                onClick={() => removeAdmin(email)}
                disabled={adminSaving}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7, padding: 4, display: 'flex' }}
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', maxWidth: 480 }}>
          <input
            type="email"
            className="form__input"
            placeholder="novo@email.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addAdmin(); }}
            style={{ flex: 1 }}
          />
          <button className="btn btn--primary" onClick={addAdmin} disabled={adminSaving || !newEmail.trim()}>
            <Plus size={16} /> Adicionar
          </button>
        </div>
        {adminMsg && <p style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: adminMsg.includes('Erro') ? '#ef4444' : 'var(--accent)' }}>{adminMsg}</p>}
      </div>
    </div>
  );
}
