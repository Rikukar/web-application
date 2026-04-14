import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

const STATUS_LABELS = { todo: 'Tehtävä', in_progress: 'Käynnissä', done: 'Valmis' };
const PRIORITY_LABELS = { low: 'Matala', normal: 'Normaali', high: 'Korkea' };

const STATUS_COLORS = ['#e74c3c', '#f39c12', '#27ae60'];
const PRIORITY_COLORS = ['#95a5a6', '#4a90d9', '#e74c3c'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { username } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/tasks/stats');
      setStats(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const textColor = dark ? '#ccc' : '#666';
  const gridColor = dark ? '#333' : '#eee';

  if (loading) {
    return (
      <>
        <header className="header">
          <h1>Tehtävienhallinta</h1>
          <div className="header-right">
            <span>{username}</span>
            <Link to="/" className="btn-back">← Takaisin</Link>
          </div>
        </header>
        <div className="dashboard"><p style={{ textAlign: 'center', padding: 40 }}>Ladataan...</p></div>
      </>
    );
  }

  if (!stats) return null;

  const statusData = [
    { name: STATUS_LABELS.todo, value: stats.status.todo },
    { name: STATUS_LABELS.in_progress, value: stats.status.in_progress },
    { name: STATUS_LABELS.done, value: stats.status.done },
  ];

  const priorityData = [
    { name: PRIORITY_LABELS.low, value: stats.priority.low },
    { name: PRIORITY_LABELS.normal, value: stats.priority.normal },
    { name: PRIORITY_LABELS.high, value: stats.priority.high },
  ];

  const completionPercent = stats.total > 0
    ? Math.round((stats.status.done / stats.total) * 100)
    : 0;

  // Yhdistetty viikkodata (luodut + valmistuneet)
  const weeklyData = stats.weekly_done.map((item, i) => ({
    week: item.week,
    Valmistuneet: item.count,
    Luodut: stats.weekly_created[i]?.count || 0,
  }));

  const CUSTOM_TOOLTIP_STYLE = {
    backgroundColor: dark ? '#1e1e1e' : '#fff',
    border: `1px solid ${dark ? '#444' : '#ddd'}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: dark ? '#e0e0e0' : '#333',
  };

  return (
    <>
      <header className="header">
        <h1>Tehtävienhallinta</h1>
        <div className="header-right">
          <span>{username}</span>
          <button className="btn-theme" onClick={toggleTheme} title={dark ? 'Vaalea tila' : 'Tumma tila'}>
            {dark ? '☀️' : '🌙'}
          </button>
          <Link to="/" className="btn-back">← Takaisin</Link>
        </div>
      </header>

      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <p className="dashboard-subtitle">Yhteenveto tehtävistäsi</p>
        </div>

        {/* Yleiskatsaus-kortit */}
        <div className="dash-summary">
          <div className="dash-card dash-card-total">
            <span className="dash-card-number">{stats.total}</span>
            <span className="dash-card-label">Tehtäviä yhteensä</span>
          </div>
          <div className="dash-card dash-card-done">
            <span className="dash-card-number">{stats.status.done}</span>
            <span className="dash-card-label">Valmiita</span>
          </div>
          <div className="dash-card dash-card-progress">
            <span className="dash-card-number">{stats.status.in_progress}</span>
            <span className="dash-card-label">Käynnissä</span>
          </div>
          <div className="dash-card dash-card-overdue">
            <span className="dash-card-number">{stats.overdue}</span>
            <span className="dash-card-label">Myöhässä</span>
          </div>
        </div>

        {/* Edistyminen */}
        <div className="dash-section">
          <div className="dash-progress-card">
            <h3>Kokonaisedistyminen</h3>
            <div className="dash-progress-bar-container">
              <div className="dash-progress-bar">
                <div className="dash-progress-fill" style={{ width: `${completionPercent}%` }} />
              </div>
              <span className="dash-progress-text">{completionPercent}%</span>
            </div>
          </div>
        </div>

        {/* Kaaviot rivi */}
        <div className="dash-charts-row">
          {/* Viikkotilasto */}
          <div className="dash-chart-card">
            <h3>Viikkoaktiivisuus</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: textColor }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: textColor }} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Bar dataKey="Luodut" fill="#4a90d9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Valmistuneet" fill="#27ae60" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tila-jakauma */}
          <div className="dash-chart-card">
            <h3>Tila-jakauma</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 13, color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Toinen kaaviorivi */}
        <div className="dash-charts-row">
          {/* Prioriteettijakauma */}
          <div className="dash-chart-card">
            <h3>Prioriteettijakauma</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 13, color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Valmistumistrendi */}
          <div className="dash-chart-card">
            <h3>Valmistumistrendi</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: textColor }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: textColor }} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="Valmistuneet"
                  stroke="#27ae60"
                  fill="#27ae60"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tämän viikon deadlinet */}
        {stats.deadlines_this_week.length > 0 && (
          <div className="dash-section">
            <div className="dash-deadlines-card">
              <h3>Tämän viikon deadlinet</h3>
              <div className="dash-deadline-list">
                {stats.deadlines_this_week.map((task) => (
                  <div key={task.id} className={`dash-deadline-item ${task.is_overdue ? 'overdue' : ''}`}>
                    <div className="dash-deadline-info">
                      <span className="dash-deadline-title">{task.title}</span>
                      <span className={`badge-priority priority-${task.priority}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                    <span className={`dash-deadline-date ${task.is_overdue ? 'overdue' : ''}`}>
                      📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('fi-FI')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
