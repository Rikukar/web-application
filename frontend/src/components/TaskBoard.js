import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import TaskModal from './TaskModal';
import Calendar from './Calendar';

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

function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [view, setView] = useState('board'); // 'board' or 'calendar'
  const { username, logout } = useAuth();
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

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <>
      <header className="header">
        <h1>Tehtävienhallinta</h1>
        <div className="header-right">
          <span>{username}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Kirjaudu ulos
          </button>
        </div>
      </header>

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
        <div className="columns">
          {['todo', 'in_progress', 'done'].map((status) => (
            <div
              key={status}
              className={`column column-${status === 'in_progress' ? 'progress' : status}`}
            >
              <h3>
                {STATUS_LABELS[status]} ({getTasksByStatus(status).length})
              </h3>
              {getTasksByStatus(status).map((task) => (
                <div key={task.id} className={`task-card ${task.is_overdue ? 'task-overdue' : ''}`}>
                  <div className="task-card-header">
                    <h4>{task.title}</h4>
                    {task.is_overdue && <span className="badge-overdue">Myöhässä</span>}
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
        )}
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
