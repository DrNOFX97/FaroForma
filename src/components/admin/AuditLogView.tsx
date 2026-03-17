import { useState, useEffect } from 'react';
import { Clock, User, Activity, Search } from 'lucide-react';
import { TableSkeleton } from './TableSkeleton';

export function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-log', {
        headers: {
          'Authorization': `Bearer ${await (window as any).firebaseAuthToken()}`
        }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.target?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <TableSkeleton />;

  return (
    <div className="audit-log-container glass">
      <div className="audit-header">
        <div className="audit-title-group">
          <Activity size={20} className="text-accent" />
          <h4>Histórico de Alterações</h4>
        </div>
        <div className="audit-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar utilizador, ação ou alvo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="audit-list">
        {filteredLogs.length === 0 ? (
          <div className="audit-empty">Sem registos encontrados.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="audit-item">
              <div className="audit-time">
                <Clock size={12} />
                <span>{new Date(log.timestamp).toLocaleString('pt-PT')}</span>
              </div>
              <div className="audit-user">
                <User size={12} />
                <strong>{log.userName}</strong>
                <span className="text-muted">({log.userEmail})</span>
              </div>
              <div className="audit-action">
                <span className={`badge-action ${log.action.toLowerCase()}`}>{log.action}</span>
                <span className="audit-target">em <strong>{log.target}</strong></span>
              </div>
              {log.details && (
                <div className="audit-details">
                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style>{AUDIT_STYLES}</style>
    </div>
  );
}

const AUDIT_STYLES = `
  .audit-log-container { padding: 0; overflow: hidden; }
  .audit-header { padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .audit-title-group { display: flex; align-items: center; gap: 0.75rem; }
  .audit-title-group h4 { margin: 0; font-size: 1.1rem; }
  
  .audit-search { position: relative; width: 100%; max-width: 350px; }
  .audit-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .audit-search input { width: 100%; padding: 0.6rem 1rem 0.6rem 2.5rem; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.85rem; }

  .audit-list { display: flex; flex-direction: column; max-height: 70vh; overflow-y: auto; }
  .audit-item { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: grid; grid-template-columns: 180px 1fr auto; gap: 1rem; align-items: center; transition: background 0.2s; }
  .audit-item:hover { background: rgba(var(--accent-rgb), 0.02); }
  .audit-item:last-child { border-bottom: none; }

  .audit-time { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted); }
  .audit-user { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; overflow: hidden; }
  .audit-user strong { color: var(--text); }
  .audit-user span { font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .audit-action { display: flex; align-items: center; gap: 0.75rem; }
  .badge-action { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: var(--bg-2); color: var(--text-muted); }
  .badge-action.update_course, .badge-action.create_course { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .badge-action.delete_course, .badge-action.delete_row { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
  .badge-action.update_cms { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  
  .audit-target { font-size: 0.8rem; color: var(--text); }
  .audit-details { grid-column: 1 / -1; background: var(--bg-2); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border); margin-top: 0.5rem; }
  .audit-details pre { margin: 0; font-size: 0.75rem; color: var(--text-muted); white-space: pre-wrap; font-family: monospace; }

  .audit-empty { padding: 4rem; text-align: center; color: var(--text-muted); }

  @media (max-width: 768px) {
    .audit-item { grid-template-columns: 1fr; gap: 0.5rem; }
  }
`;