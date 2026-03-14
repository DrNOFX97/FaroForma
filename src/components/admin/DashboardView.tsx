import { motion } from 'framer-motion';
import { Users, GraduationCap, MessageSquare, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import type { RawData } from '../../services/api';

interface DashboardViewProps {
  data: RawData | null;
  error: string;
}

export function DashboardView({ data, error }: DashboardViewProps) {
  // Stats
  const stats = {
    formadores: Math.max(0, (data?.formadores?.length || 1) - 1),
    alunos: Math.max(0, (data?.alunos?.length || 1) - 1),
    contactos: Math.max(0, (data?.contactos?.length || 1) - 1),
  };

  // ── Data Processing ─────────────────────────────────────────────────────────

  // 1. Trend Data (Registrations by Month)
  const getTrendData = () => {
    if (!data) return [];
    const allDates: string[] = [
      ...(data.formadores?.slice(1).map(r => r[0]) || []),
      ...(data.alunos?.slice(1).map(r => r[0]) || []),
    ];

    const months: Record<string, number> = {};
    const now = new Date();
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }

    allDates.forEach(dateStr => {
      try {
        const d = new Date(dateStr);
        const key = d.toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
        if (months[key] !== undefined) months[key]++;
      } catch (e) { /* ignore invalid dates */ }
    });

    return Object.entries(months).map(([name, total]) => ({ name, total }));
  };

  // 2. Area Distribution (Formadores)
  const getAreaData = () => {
    if (!data?.formadores) return [];
    const areaCounts: Record<string, number> = {};
    data.formadores.slice(1).forEach(row => {
      const areas = row[6]?.split(',').map((a: string) => a.trim()) || [];
      areas.forEach((a: string) => {
        if (a) areaCounts[a] = (areaCounts[a] || 0) + 1;
      });
    });

    return Object.entries(areaCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  };

  const trendData = getTrendData();
  const areaData = getAreaData();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <StatCard label="Formadores" val={stats.formadores} icon={<Users size={20} />} desc="Total de candidaturas" />
        <StatCard label="Alunos" val={stats.alunos} icon={<GraduationCap size={20} />} desc="Novas inscrições" />
        <StatCard label="Contactos" val={stats.contactos} icon={<MessageSquare size={20} />} desc="Mensagens recebidas" />
      </div>

      <div className="dashboard-charts-grid">
        {/* Growth Chart */}
        <motion.div 
          className="glass chart-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="chart-header">
            <TrendingUp size={18} className="text-accent" />
            <h4>Crescimento (Últimos 6 meses)</h4>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--accent)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Areas Chart */}
        <motion.div 
          className="glass chart-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <PieChartIcon size={18} className="text-accent" />
            <h4>Top 5 Áreas (Formadores)</h4>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={areaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {areaData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      <motion.div 
        className="glass" 
        style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginTop: '2rem' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 style={{ marginBottom: '1.5rem' }}>Estado do Sistema</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!data && !error && <div className="spinner spinner--small"></div>}
          <p style={{ color: 'var(--text-muted)' }}>
            {data ? 'Ligação às Google Sheets ativa.' : (error ? `Erro: ${error}` : 'A sincronizar com Google Sheets...')}
          </p>
        </div>
      </motion.div>

      <style>{DASHBOARD_CHART_STYLES}</style>
    </div>
  );
}

function StatCard({ label, val, icon, desc }: any) {
  return (
    <div className="stat-card">
      <div className="stat-card__header"><span>{label}</span>{icon}</div>
      <div className="stat-card__val">{val}</div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{desc}</p>
    </div>
  );
}

const DASHBOARD_CHART_STYLES = `
  .dashboard-charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 2rem; }
  .chart-container { padding: 2rem; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 1.5rem; }
  .chart-header { display: flex; align-items: center; gap: 0.75rem; }
  .chart-header h4 { font-size: 1rem; font-weight: 700; margin: 0; }

  @media (max-width: 1024px) {
    .dashboard-charts-grid { grid-template-columns: 1fr; }
  }
`;
