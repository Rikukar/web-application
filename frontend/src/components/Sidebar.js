import React from 'react';

const PRIORITY_LABELS = {
  high: 'Korkea',
  normal: 'Normaali',
  low: 'Matala',
};

function Sidebar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const overdue = tasks.filter((t) => t.is_overdue).length;
  const highPriority = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;
  const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const today = new Date().toISOString().split('T')[0];
  const upcoming = tasks
    .filter((t) => t.due_date && t.status !== 'done' && t.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 6);

  const overdueTasks = tasks
    .filter((t) => t.is_overdue && t.status !== 'done')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' });
  };

  const daysUntil = (dateStr) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Tänään';
    if (diff === 1) return 'Huomenna';
    return `${diff} pv`;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Yhteenveto</h3>
        <div className="stat-cards">
          <div className="stat-card stat-total">
            <span className="stat-number">{total}</span>
            <span className="stat-label">Yhteensä</span>
          </div>
          <div className="stat-card stat-done">
            <span className="stat-number">{done}</span>
            <span className="stat-label">Valmiit</span>
          </div>
          <div className="stat-card stat-progress">
            <span className="stat-number">{inProgress}</span>
            <span className="stat-label">Käynnissä</span>
          </div>
          <div className="stat-card stat-todo">
            <span className="stat-number">{todo}</span>
            <span className="stat-label">Odottaa</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Edistyminen</h3>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="progress-text">{completionPercent}% valmis</span>
        </div>
      </div>

      {(overdue > 0 || highPriority > 0) && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">Huomio</h3>
          <div className="alert-list">
            {overdue > 0 && (
              <div className="alert-item alert-overdue">
                <span className="alert-icon">⚠️</span>
                <span>{overdue} myöhässä</span>
              </div>
            )}
            {highPriority > 0 && (
              <div className="alert-item alert-high">
                <span className="alert-icon">🔴</span>
                <span>{highPriority} korkea prioriteetti</span>
              </div>
            )}
          </div>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title sidebar-title-overdue">Myöhässä</h3>
          <div className="deadline-list">
            {overdueTasks.map((task) => (
              <div key={task.id} className="deadline-item deadline-overdue">
                <div className="deadline-info">
                  <span className="deadline-task-name">{task.title}</span>
                  <span className={`deadline-priority priority-${task.priority}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <span className="deadline-date overdue">
                  📅 {formatDate(task.due_date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">Tulevat deadlinet</h3>
          <div className="deadline-list">
            {upcoming.map((task) => (
              <div key={task.id} className="deadline-item">
                <div className="deadline-info">
                  <span className="deadline-task-name">{task.title}</span>
                  <span className={`deadline-priority priority-${task.priority}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <div className="deadline-meta">
                  <span className="deadline-days">{daysUntil(task.due_date)}</span>
                  <span className="deadline-date">
                    📅 {formatDate(task.due_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="sidebar-empty">
          <p>Ei tehtäviä vielä.</p>
          <p>Luo ensimmäinen tehtävä aloittaaksesi!</p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
