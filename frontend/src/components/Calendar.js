import React, { useState } from 'react';

const DAYS_FI = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
const MONTHS_FI = [
  'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu',
  'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu',
];

function Calendar({ tasks }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const firstDay = new Date(currentYear, currentMonth, 1);
  // Monday=0 adjustment (JS: Sunday=0)
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const todayStr = today.toISOString().split('T')[0];

  // Build map: date string -> tasks
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (task.due_date) {
      if (!tasksByDate[task.due_date]) {
        tasksByDate[task.due_date] = [];
      }
      tasksByDate[task.due_date].push(task);
    }
  });

  const cells = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasksByDate[dateStr] || [];
    const isToday = dateStr === todayStr;
    const hasOverdue = dayTasks.some((t) => t.is_overdue);
    const hasDone = dayTasks.some((t) => t.status === 'done');
    const hasPending = dayTasks.some((t) => t.status !== 'done' && !t.is_overdue);

    cells.push(
      <div
        key={day}
        className={`calendar-cell ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
      >
        <span className="day-number">{day}</span>
        <div className="day-dots">
          {hasOverdue && <span className="dot dot-overdue" title="Myöhässä" />}
          {hasPending && <span className="dot dot-pending" title="Tulossa" />}
          {hasDone && <span className="dot dot-done" title="Valmis" />}
        </div>
        {dayTasks.length > 0 && (
          <div className="day-tasks-tooltip">
            {dayTasks.map((t) => (
              <div
                key={t.id}
                className={`tooltip-task ${t.is_overdue ? 'overdue' : t.status}`}
              >
                {t.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth}>‹</button>
        <h3>{MONTHS_FI[currentMonth]} {currentYear}</h3>
        <button className="calendar-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="calendar-grid">
        {DAYS_FI.map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
        {cells}
      </div>
      <div className="calendar-legend">
        <span><span className="dot dot-overdue" /> Myöhässä</span>
        <span><span className="dot dot-pending" /> Tulossa</span>
        <span><span className="dot dot-done" /> Valmis</span>
      </div>
    </div>
  );
}

export default Calendar;
