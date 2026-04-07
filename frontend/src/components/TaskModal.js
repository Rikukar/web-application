import React, { useState } from 'react';

function TaskModal({ task, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [dueDate, setDueDate] = useState(task?.due_date || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, status, due_date: dueDate || null });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{task ? 'Muokkaa tehtävää' : 'Uusi tehtävä'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Otsikko</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Kuvaus</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Tila</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="todo">Tehtävä</option>
              <option value="in_progress">Käynnissä</option>
              <option value="done">Valmis</option>
            </select>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Peruuta
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              Tallenna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
