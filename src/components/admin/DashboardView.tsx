import { 
  Users, GraduationCap, MessageSquare, TrendingUp, 
  PieChart as PieChartIcon, Clock, MousePointer2,
  Calendar, FileText, PlusCircle, ArrowRight, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { apiService } from '../../services/api';
import type { RawData } from '../../services/api';
import { useState, useEffect } from 'react';

interface DashboardViewProps {
  data: RawData | null;
}

export function DashboardView({ data }: DashboardViewProps) {
  const [analytics, setAnalytics] = useState<any>({ total: 0, hourly: {} });

  useEffect(() => {
    apiService.getAnalytics().then(setAnalytics).catch(console.error);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    formadores: Math.max(0, (data?.formadores?.length || 1) - 1),
    alunos: Math.max(0, (data?.alunos?.length || 1) - 1),
    contactos: Math.max(0, (data?.contactos?.length || 1) - 1),
    visitantes: analytics.total || 0,
  };

  // ── Activity Feed ──────────────────────────────────────────────────────────
  const getActivityFeed = () => {
    if (!data) return [];
    const feed: any[] = [];
    
    data.alunos?.slice(1).forEach(r => feed.push({ type: 'aluno', name: r[1], date: new Date(r[0]), desc: `Inscrição em ${r[4]}` }));
    data.formadores?.slice(1).forEach(r => feed.push({ type: 'formador', name: r[1], date: new Date(r[0]), desc: `Candidatura: ${r[6]?.split(',')[0]}` }));
    data.contactos?.slice(1).forEach(r => feed.push({ type: 'contacto', name: r[1], date: new Date(r[0]), desc: `Mensagem: ${r[4]}` }));

    return feed.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  };

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const getTrendData = () => {
    if (!data) return [];
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }
    [...(data.formadores?.slice(1) || []), ...(data.alunos?.slice(1) || [])].forEach(r => {
      try {
        const key = new Date(r[0]).toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
        if (months[key] !== undefined) months[key]++;
      } catch (e) { /* ignore */ }
    });
    return Object.entries(months).map(([name, total]) => ({ name, total }));
  };

  const getAreaData = () => {
    if (!data?.formadores) return [];
    const areaCounts: Record<string, number> = {};
    data.formadores.slice(1).forEach(row => {
      row[6]?.split(',').forEach((a: string) => {
        const clean = a.trim();
        if (clean) areaCounts[clean] = (areaCounts[clean] || 0) + 1;
      });
    });
    return Object.entries(areaCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const feed = getActivityFeed();
  const trendData = getTrendData();
  const areaData = getAreaData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="command-center">
      {/* Top Stats */}
      <div className="stats-row">
        <StatCard label="Formadores" val={stats.formadores} icon={<Users size={20} />} trend="+12%" color="emerald" />
        <StatCard label="Alunos" val={stats.alunos} icon={<GraduationCap size={20} />} trend="+5%" color="blue" />
        <StatCard label="Visitantes Hoje" val={stats.visitantes} icon={<MousePointer2 size={20} />} trend="Live" color="amber" />
        <StatCard label="Contactos" val={stats.contactos} icon={<MessageSquare size={20} />} trend="Novos" color="violet" />
      </div>

      <div className="dashboard-main-grid">
        {/* Left: Charts */}
        <div className="dashboard-column charts-col">
          <div className="glass card">
            <div className="card-header">
              <div className="header-info">
                <TrendingUp size={18} className="text-accent" />
                <h4>Tendência de Crescimento</h4>
              </div>
            </div>
            <div style={{ width: '100%', height: 300, marginTop: '1.5rem' }}>
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="charts-sub-grid">
            <div className="glass card">
              <div className="card-header">
                <div className="header-info">
                  <PieChartIcon size={18} className="text-accent" />
                  <h4>Top Áreas</h4>
                </div>
              </div>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={areaData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {areaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass card quick-actions-card">
              <div className="card-header"><div className="header-info"><Activity size={18} className="text-accent" /><h4>Ações Rápidas</h4></div></div>
              <div className="quick-actions-list">
                <QuickAction icon={<Calendar size={16} />} label="Agenda Hoje" />
                <QuickAction icon={<PlusCircle size={16} />} label="Novo Curso" />
                <QuickAction icon={<FileText size={16} />} label="Exportar Alunos" />
                <QuickAction icon={<ArrowRight size={16} />} label="Ver Contactos" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="dashboard-column feed-col">
          <div className="glass card activity-card">
            <div className="card-header">
              <div className="header-info">
                <Clock size={18} className="text-accent" />
                <h4>Atividade Recente</h4>
              </div>
            </div>
            <div className="activity-feed">
              {feed.map((item, i) => (
                <div key={i} className="feed-item">
                  <div className={`feed-icon ${item.type}`}>
                    {item.type === 'aluno' && <GraduationCap size={14} />}
                    {item.type === 'formador' && <Users size={14} />}
                    {item.type === 'contacto' && <MessageSquare size={14} />}
                  </div>
                  <div className="feed-content">
                    <div className="feed-user">{item.name}</div>
                    <div className="feed-desc">{item.desc}</div>
                    <div className="feed-time">{item.date.toLocaleDateString()} · {item.date.getHours()}h{item.date.getMinutes().toString().padStart(2, '0')}</div>
                  </div>
                </div>
              ))}
              {feed.length === 0 && <div className="empty-feed">Sem atividade recente.</div>}
            </div>
          </div>
        </div>
      </div>

      <style>{DASHBOARD_STYLES}</style>
    </div>
  );
}

function StatCard({ label, val, icon, trend, color }: any) {
  return (
    <div className={`stat-card-v2 ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-info">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
          <span className="stat-value">{val}</span>
          <span className="stat-trend">{trend}</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: any) {
  return (
    <button className="quick-action-btn">
      <div className="qa-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

const DASHBOARD_STYLES = `
  .command-center { display: flex; flex-direction: column; gap: 2rem; }
  
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
  .stat-card-v2 { padding: 1.5rem; border-radius: var(--radius-lg); background: var(--bg-1); border: 1px solid var(--border); display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s; }
  .stat-card-v2:hover { transform: translateY(-4px); }
  .stat-card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-2); color: var(--accent); }
  
  .stat-card-v2.emerald .stat-card-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .stat-card-v2.blue .stat-card-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .stat-card-v2.amber .stat-card-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  .stat-card-v2.violet .stat-card-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

  .stat-card-info { display: flex; flex-direction: column; gap: 0.25rem; }
  .stat-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em; }
  .stat-value-row { display: flex; align-items: baseline; gap: 0.75rem; }
  .stat-value { font-size: 1.75rem; font-weight: 800; }
  .stat-trend { font-size: 0.75rem; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px; }

  .dashboard-main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
  .dashboard-column { display: flex; flex-direction: column; gap: 2rem; }
  
  .card { padding: 1.75rem; border-radius: var(--radius-lg); height: 100%; }
  .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; }
  .header-info { display: flex; align-items: center; gap: 0.75rem; }
  .header-info h4 { margin: 0; font-size: 1.1rem; font-weight: 700; }

  .charts-sub-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; }

  /* Activity Feed */
  .activity-card { height: 100%; display: flex; flex-direction: column; }
  .activity-feed { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; overflow-y: auto; max-height: 600px; padding-right: 0.5rem; }
  .feed-item { display: flex; gap: 1rem; position: relative; }
  .feed-item::before { content: ''; position: absolute; left: 16px; top: 32px; bottom: -12px; width: 2px; background: var(--border); opacity: 0.5; }
  .feed-item:last-child::before { display: none; }
  
  .feed-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--bg-2); border: 2px solid var(--bg-1); flex-shrink: 0; z-index: 1; }
  .feed-icon.aluno { color: #3b82f6; }
  .feed-icon.formador { color: #10b981; }
  .feed-icon.contacto { color: #8b5cf6; }

  .feed-content { display: flex; flex-direction: column; gap: 0.15rem; }
  .feed-user { font-size: 0.9rem; font-weight: 700; color: var(--text); }
  .feed-desc { font-size: 0.8rem; color: var(--text-muted); }
  .feed-time { font-size: 0.7rem; color: var(--text-dim); margin-top: 0.25rem; }

  .quick-actions-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
  .quick-action-btn { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-2); color: var(--text); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; text-align: left; }
  .quick-action-btn:hover { background: var(--bg-1); border-color: var(--accent); color: var(--accent); transform: translateX(4px); }
  .qa-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-1); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }

  @media (max-width: 1200px) {
    .dashboard-main-grid { grid-template-columns: 1fr; }
    .feed-col { order: 2; }
    .charts-col { order: 1; }
  }
`;
