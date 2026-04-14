import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import TaskModal from './TaskModal';
import Calendar from './Calendar';
import Sidebar from './Sidebar';
import { useTheme } from '../context/ThemeContext';

const STATUS_LABELS = {
  todo: 'Tehtävä',
  in_progress: 'Käynnissä',
  done: 'Valmis',
};

const NEXT_STATUS = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

const PRIORITY_LABELS = {
  low: 'Matala',
  normal: 'Normaali',
  high: 'Korkea',
};

function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [view, setView] = useState('board'); // 'board' or 'calendar'
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDeadline, setFilterDeadline] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { username, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch {
      // handled by interceptor
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSave = async (taskData) => {
    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, taskData);
    } else {
      await api.post('/tasks', taskData);
    }
    setModalOpen(false);
    fetchTasks();
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Haluatko varmasti poistaa tämän tehtävän?')) {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    }
  };

  const handleStatusChange = async (task) => {
    const newStatus = NEXT_STATUS[task.status];
    await api.put(`/tasks/${task.id}`, { status: newStatus });
    fetchTasks();
  };

  const getTasksByStatus = (status) => {
    const query = searchQuery.toLowerCase();
    return tasks.filter((t) => {
      if (t.status !== status) return false;
      if (query && !t.title.toLowerCase().includes(query) && !t.description.toLowerCase().includes(query)) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterDeadline === 'overdue' && !t.is_overdue) return false;
      if (filterDeadline === 'today') {
        const today = new Date().toISOString().split('T')[0];
        if (t.due_date !== today) return false;
      }
      if (filterDeadline === 'week') {
        if (!t.due_date) return false;
        const now = new Date();
        const weekLater = new Date(now);
        weekLater.setDate(now.getDate() + 7);
        const d = new Date(t.due_date + 'T00:00:00');
        if (d < now || d > weekLater) return false;
      }
      if (filterDeadline === 'no_date' && t.due_date) return false;
      return true;
    });
  };

  const hasActiveFilters = searchQuery || filterPriority !== 'all' || filterDeadline !== 'all';

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTaskId) return;

    const task = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTasks();
    } catch {
      fetchTasks();
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
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
          <Link to="/dashboard" className="btn-settings">Dashboard</Link>
          <Link to="/settings" className="btn-settings">Asetukset</Link>
          <button className="btn-logout" onClick={handleLogout}>
            Kirjaudu ulos
          </button>
        </div>
      </header>

      <div className="main-layout">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Piilota sivupalkki' : 'Näytä sivupalkki'}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
          <Sidebar tasks={tasks} />
        </div>
        <div className="task-board">
        <div className="board-header">
          <h2>Tehtävät</h2>
          <div className="board-header-actions">
            <div className="view-toggle">
              <button
                className={`btn-toggle ${view === 'board' ? 'active' : ''}`}
                onClick={() => setView('board')}
              >
                Taulu
              </button>
              <button
                className={`btn-toggle ${view === 'calendar' ? 'active' : ''}`}
                onClick={() => setView('calendar')}
              >
                Kalenteri
              </button>
            </div>
            <button className="btn btn-new-task" onClick={handleCreate}>
              + Uusi tehtävä
            </button>
          </div>
        </div>

        {view === 'calendar' ? (
          <Calendar tasks={tasks} />
        ) : (
        <>
        <div className="filter-bar">
          <div className="filter-search">
            <input
              type="text"
              placeholder="Hae tehtäviä..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-selects">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">Kaikki prioriteetit</option>
              <option value="high">Korkea</option>
              <option value="normal">Normaali</option>
              <option value="low">Matala</option>
            </select>
            <select
              value={filterDeadline}
              onChange={(e) => setFilterDeadline(e.target.value)}
              className="filter-select"
            >
              <option value="all">Kaikki deadlinet</option>
              <option value="overdue">Myöhässä</option>
              <option value="today">Tänään</option>
              <option value="week">Seuraavat 7 päivää</option>
              <option value="no_date">Ei deadlinea</option>
            </select>
            {hasActiveFilters && (
              <button
                className="btn-clear-filters"
                onClick={() => { setSearchQuery(''); setFilterPriority('all'); setFilterDeadline('all'); }}
              >
                Tyhjennä
              </button>
            )}
          </div>
        </div>
        <div className="columns">
          {['todo', 'in_progress', 'done'].map((status) => (
            <div
              key={status}
              className={`column column-${status === 'in_progress' ? 'progress' : status} ${dragOverColumn === status ? 'column-drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h3>
                {STATUS_LABELS[status]} ({getTasksByStatus(status).length})
              </h3>
              {getTasksByStatus(status).map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${task.is_overdue ? 'task-overdue' : ''} ${draggedTaskId === task.id ? 'task-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="task-card-header">
                    <h4>{task.title}</h4>
                    <div className="task-badges">
                      <span className={`badge-priority priority-${task.priority}`}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      {task.is_overdue && <span className="badge-overdue">Myöhässä</span>}
                    </div>
                  </div>
                  {task.description && <p>{task.description}</p>}
                  {task.due_date && (
                    <div className={`task-due-date ${task.is_overdue ? 'overdue' : ''}`}>
                      📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('fi-FI')}
                    </div>
                  )}
                  <div className="task-actions">
                    <button className="btn-status" onClick={() => handleStatusChange(task)}>
                      → {STATUS_LABELS[NEXT_STATUS[task.status]]}
                    </button>
                    <button className="btn-edit" onClick={() => handleEdit(task)}>
                      Muokkaa
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(task.id)}>
                      Poista
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        </>
        )}
      </div>

      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

export default TaskBoard;
