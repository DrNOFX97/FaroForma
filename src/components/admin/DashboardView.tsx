import {
  Users, GraduationCap, MessageSquare, TrendingUp,
  PieChart as PieChartIcon, Clock, MousePointer2,
  Calendar, FileText, PlusCircle, ArrowRight, Activity, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { apiService } from '../../services/api';
import type { RawData } from '../../services/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { F } from '../../config/sheetsSchema';

interface DashboardViewProps {
  data: RawData | null;
  onNavigate?: (tab: string) => void;
}

export function DashboardView({ data, onNavigate }: DashboardViewProps) {
  const [analytics, setAnalytics] = useState<any>({ total: 0 });
  const [visitorPopup, setVisitorPopup] = useState(false);

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

  // ── Month-over-month trend ─────────────────────────────────────────────────
  const getMonthTrend = (rows: any[][] | undefined): { label: string; positive: boolean } => {
    if (!rows || rows.length <= 1) return { label: '—', positive: true };
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    let cur = 0, prev = 0;
    rows.slice(1).forEach(r => {
      try {
        const d = new Date(r[F.TIMESTAMP] || r[0]); // Use F.TIMESTAMP for formadores, fallback for others
        if (isNaN(d.getTime())) return;
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) cur++;
        else if (d.getFullYear() === curYear && d.getMonth() === curMonth - 1) prev++;
        else if (curMonth === 0 && d.getFullYear() === curYear - 1 && d.getMonth() === 11) prev++;
      } catch { /* ignore */ }
    });
    if (prev === 0 && cur === 0) return { label: '—', positive: true };
    if (prev === 0) return { label: `+${cur} novo${cur > 1 ? 's' : ''}`, positive: true };
    const pct = Math.round(((cur - prev) / prev) * 100);
    return { label: `${pct >= 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  };

  const trends = {
    formadores: getMonthTrend(data?.formadores),
    alunos: getMonthTrend(data?.alunos),
    contactos: getMonthTrend(data?.contactos),
  };

  // ── Activity Feed ──────────────────────────────────────────────────────────
  const getActivityFeed = () => {
    if (!data) return [];
    const feed: any[] = [];
    
    data.alunos?.slice(1).forEach(r => feed.push({ type: 'aluno', name: r[1], date: new Date(r[0]), desc: `Inscrição em ${r[4]}` }));
    // Using F schema for formadores
    data.formadores?.slice(1).forEach(r => feed.push({ type: 'formador', name: r[F.NOME], date: new Date(r[F.TIMESTAMP]), desc: `Candidatura: ${r[F.AREAS]?.split(',')[0]}` }));
    data.contactos?.slice(1).forEach(r => feed.push({ type: 'contacto', name: r[1], date: new Date(r[0]), desc: `Mensagem: ${r[4]}` }));

    return feed.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  };

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const getTrendData = () => {
    if (!data) return [];
    const keys: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(d.toLocaleString('pt-PT', { month: 'short', year: '2-digit' }));
    }
    const months: Record<string, { formadores: number; alunos: number }> = {};
    keys.forEach(k => { months[k] = { formadores: 0, alunos: 0 }; });

    data.formadores?.slice(1).forEach(r => {
      try {
        const key = new Date(r[F.TIMESTAMP]).toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
        if (months[key]) months[key].formadores++;
      } catch { /* ignore */ }
    });
    data.alunos?.slice(1).forEach(r => {
      try {
        const key = new Date(r[0]).toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
        if (months[key]) months[key].alunos++;
      } catch { /* ignore */ }
    });
    return keys.map(name => ({ name, ...months[name] }));
  };

  const getAreaData = () => {
    if (!data?.formadores) return [];
    const areaCounts: Record<string, number> = {};
    data.formadores.slice(1).forEach(row => {
      row[F.AREAS]?.split(',').forEach((a: string) => {
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
        <StatCard label="Formadores" val={stats.formadores} icon={<Users size={18} />} trend={trends.formadores.label} trendPositive={trends.formadores.positive} color="emerald" onClick={() => onNavigate?.('formadores')} />
        <StatCard label="Alunos" val={stats.alunos} icon={<GraduationCap size={18} />} trend={trends.alunos.label} trendPositive={trends.alunos.positive} color="blue" onClick={() => onNavigate?.('alunos')} />
        <StatCard label="Visitantes Hoje" val={stats.visitantes} icon={<MousePointer2 size={18} />} trend="Hoje" trendPositive={true} color="amber" onClick={() => setVisitorPopup(true)} />
        <StatCard label="Contactos" val={stats.contactos} icon={<MessageSquare size={18} />} trend={trends.contactos.label} trendPositive={trends.contactos.positive} color="violet" onClick={() => onNavigate?.('contactos')} />
      </div>

      <AnimatePresence>
        {visitorPopup && (
          <VisitorPopup total={stats.visitantes} hourly={analytics.hourly || {}} log={analytics.log || []} onClose={() => setVisitorPopup(false)} />
        )}
      </AnimatePresence>

      <div className="dashboard-main-grid">
        {/* Left: Charts */}
        <div className="dashboard-column charts-col">
          <div className="glass card">
            <div className="card-header">
              <div className="header-info">
                <TrendingUp size={18} className="text-accent" />
                <h4>Tendência de Crescimento</h4>
              </div>
              <div className="chart-legend">
                <span className="legend-dot" style={{ background: '#10b981' }} />
                <span>Formadores</span>
                <span className="legend-dot" style={{ background: '#3b82f6' }} />
                <span>Alunos</span>
              </div>
            </div>
            <div style={{ width: '100%', height: 300, marginTop: '1.5rem' }}>
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorFormadores" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAlunos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '12px' }}
                    formatter={(value: any, name: any) => [value, name === 'formadores' ? 'Formadores' : 'Alunos']}
                  />
                  <Area type="monotone" dataKey="formadores" stroke="#10b981" fillOpacity={1} fill="url(#colorFormadores)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="alunos" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAlunos)" strokeWidth={2.5} />
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
                {areaData.length > 0 && (
                  <span className="areas-total-badge">{areaData.reduce((s, d) => s + d.value, 0)} formadores</span>
                )}
              </div>
              {areaData.length === 0 ? (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem dados de áreas.</div>
              ) : (
                <div className="area-chart-wrapper">
                  <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={areaData} cx="50%" cy="50%" innerRadius={44} outerRadius={65} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                          {areaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.8rem' }}
                          formatter={(value: any, _: any, props: any) => [value, props.payload.name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="area-legend">
                    {(() => {
                      const total = areaData.reduce((s, d) => s + d.value, 0);
                      return areaData.map((item, i) => {
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div key={i} className="area-legend-item">
                            <span className="area-legend-swatch" style={{ background: COLORS[i % COLORS.length] }} />
                            <div className="area-legend-body">
                              <div className="area-legend-top">
                                <span className="area-legend-name" title={item.name}>{item.name}</span>
                                <span className="area-legend-count">{item.value}</span>
                              </div>
                              <div className="area-legend-track">
                                <div className="area-legend-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="glass card quick-actions-card">
              <div className="card-header"><div className="header-info"><Activity size={18} className="text-accent" /><h4>Ações Rápidas</h4></div></div>
              <div className="quick-actions-list">
                <QuickAction icon={<Calendar size={16} />} label="Agenda Hoje" onClick={() => onNavigate?.('agenda')} />
                <QuickAction icon={<PlusCircle size={16} />} label="Novo Curso" onClick={() => onNavigate?.('cursos')} />
                <QuickAction icon={<FileText size={16} />} label="Ver Alunos" onClick={() => onNavigate?.('alunos')} />
                <QuickAction icon={<ArrowRight size={16} />} label="Ver Contactos" onClick={() => onNavigate?.('contactos')} />
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

function StatCard({ label, val, icon, trend, trendPositive, color, onClick }: any) {
  return (
    <button className={`stat-card-v2 ${color}`} onClick={onClick} title={`Ver ${label}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-info">
        <span className="stat-label">{label}</span>
        <div className="stat-value-row">
          <span className="stat-value">{val}</span>
          {trend !== '—' && (
            <span className={`stat-trend ${trendPositive ? 'positive' : 'negative'}`} title="vs mês anterior">
              {trend}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function VisitorPopup({ total, hourly, log, onClose }: { total: number; hourly: Record<string, number>; log: string[]; onClose: () => void }) {
  // Build 24-hour bar chart data
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    h: `${h}h`,
    n: hourly[h.toString()] || 0,
  }));

  // Format log entries newest-first
  const logEntries = [...log].reverse().map(ts => {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? ts : d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const peakHour = hourlyData.reduce((a, b) => b.n > a.n ? b : a, { h: '—', n: 0 });

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="glass visitor-popup"
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="visitor-popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-card-icon amber" style={{ width: 36, height: 36, borderRadius: 10 }}><MousePointer2 size={16} /></div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Visitantes Hoje</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
          <button className="admin-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="vp-body">
          {/* Summary row */}
          <div className="vp-summary">
            <div className="vp-stat">
              <span className="vp-stat-val" style={{ color: '#f59e0b' }}>{total}</span>
              <span className="vp-stat-label">visitas</span>
            </div>
            <div className="vp-divider" />
            <div className="vp-stat">
              <span className="vp-stat-val">{peakHour.n > 0 ? peakHour.h : '—'}</span>
              <span className="vp-stat-label">hora de pico</span>
            </div>
            <div className="vp-divider" />
            <div className="vp-stat">
              <span className="vp-stat-val">{logEntries.length > 0 ? logEntries[0] : '—'}</span>
              <span className="vp-stat-label">última visita</span>
            </div>
          </div>

          {/* Hourly bar chart */}
          <div className="vp-section-title">Acessos por hora</div>
          <div style={{ width: '100%', height: 110 }}>
            <ResponsiveContainer>
              <BarChart data={hourlyData} barSize={8} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="h" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem' }}
                  formatter={(v: any) => [v, 'visitas']}
                  cursor={{ fill: 'rgba(245,158,11,0.08)' }}
                />
                <Bar dataKey="n" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Access log */}
          <div className="vp-section-title" style={{ marginTop: '1rem' }}>
            Log de acessos
            <span className="vp-log-count">{logEntries.length}</span>
          </div>
          <div className="vp-log">
            {logEntries.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.75rem 0' }}>Sem registos hoje.</div>
            ) : (
              logEntries.map((t, i) => (
                <div key={i} className="vp-log-entry">
                  <span className="vp-log-dot" />
                  <span className="vp-log-time">{t}</span>
                  {i === 0 && <span className="vp-log-badge">agora</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ icon, label, onClick, danger }: any) {
  return (
    <button className={`quick-action-btn${danger ? ' danger' : ''}`} onClick={onClick}>
      <div className="qa-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

const DASHBOARD_STYLES = `
  .command-center { display: flex; flex-direction: column; gap: 2rem; }

  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; }
  .stat-card-v2 { padding: 0.875rem 1rem; border-radius: var(--radius-lg); background: var(--bg-1); border: 1px solid var(--border); display: flex; align-items: center; gap: 0.875rem; transition: all 0.2s; cursor: pointer; text-align: left; width: 100%; }
  .stat-card-v2:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-color: var(--accent); }
  .stat-card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--bg-2); color: var(--accent); flex-shrink: 0; }

  .stat-card-v2.emerald .stat-card-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .stat-card-v2.blue .stat-card-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .stat-card-v2.amber .stat-card-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  .stat-card-v2.violet .stat-card-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

  .stat-card-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
  .stat-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; }
  .stat-value-row { display: flex; align-items: baseline; gap: 0.5rem; }
  .stat-value { font-size: 1.5rem; font-weight: 800; }
  .stat-trend { font-size: 0.7rem; font-weight: 700; padding: 1px 5px; border-radius: 4px; white-space: nowrap; }
  .stat-trend.positive { color: #10b981; background: rgba(16, 185, 129, 0.1); }
  .stat-trend.negative { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

  /* Visitor Popup */
  .visitor-popup { width: 100%; max-width: 420px; border-radius: var(--radius-xl); overflow: hidden; }
  .visitor-popup-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid var(--border); }
  .stat-card-icon.amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

  .vp-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0; }
  .vp-summary { display: flex; align-items: center; justify-content: space-around; padding: 0.75rem 0 1.25rem; }
  .vp-stat { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
  .vp-stat-val { font-size: 1.4rem; font-weight: 800; color: var(--text); line-height: 1; }
  .vp-stat-label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .vp-divider { width: 1px; height: 32px; background: var(--border); }

  .vp-section-title { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
  .vp-log-count { background: var(--bg-2); border: 1px solid var(--border); border-radius: 20px; padding: 1px 7px; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }

  .vp-log { display: flex; flex-direction: column; gap: 0; max-height: 180px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.25rem 0; background: var(--bg-2); }
  .vp-log-entry { display: flex; align-items: center; gap: 0.6rem; padding: 0.3rem 0.75rem; }
  .vp-log-entry:hover { background: var(--bg-1); }
  .vp-log-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }
  .vp-log-time { font-size: 0.8rem; font-family: monospace; color: var(--text); font-weight: 600; flex: 1; }
  .vp-log-badge { font-size: 0.62rem; font-weight: 700; background: rgba(245,158,11,0.15); color: #f59e0b; padding: 1px 6px; border-radius: 20px; }

  .dashboard-main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
  .dashboard-column { display: flex; flex-direction: column; gap: 2rem; }
  
  .card { padding: 1.75rem; border-radius: var(--radius-lg); height: 100%; }
  .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; }
  .header-info { display: flex; align-items: center; gap: 0.75rem; }
  .header-info h4 { margin: 0; font-size: 1.1rem; font-weight: 700; }

  .chart-legend { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  .charts-sub-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; }

  /* Top Áreas legend */
  .areas-total-badge { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); background: var(--bg-2); padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border); }
  .area-chart-wrapper { display: flex; align-items: center; gap: 1rem; margin-top: 1.25rem; }
  .area-legend { display: flex; flex-direction: column; gap: 0.65rem; flex: 1; min-width: 0; }
  .area-legend-item { display: flex; align-items: center; gap: 0.6rem; }
  .area-legend-swatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .area-legend-body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .area-legend-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .area-legend-name { font-size: 0.75rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .area-legend-count { font-size: 0.72rem; font-weight: 800; color: var(--text-muted); flex-shrink: 0; }
  .area-legend-track { height: 4px; border-radius: 99px; background: var(--border); overflow: hidden; }
  .area-legend-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }

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