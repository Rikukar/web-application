import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../Sidebar';

const makeTasks = (overrides = []) => {
  const baseTasks = [
    { id: 1, title: 'Todo 1', status: 'todo', priority: 'normal', due_date: null, is_overdue: false },
    { id: 2, title: 'Käynnissä', status: 'in_progress', priority: 'high', due_date: null, is_overdue: false },
    { id: 3, title: 'Valmis', status: 'done', priority: 'low', due_date: null, is_overdue: false },
  ];
  return [...baseTasks, ...overrides];
};

describe('Sidebar', () => {
  test('näyttää tilastokortit oikein', () => {
    render(<Sidebar tasks={makeTasks()} />);
    
    expect(screen.getByText('Yhteenveto')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // yhteensä
    expect(screen.getByText('Valmiit')).toBeInTheDocument();
    expect(screen.getByText('Käynnissä')).toBeInTheDocument();
    expect(screen.getByText('Odottaa')).toBeInTheDocument();
  });

  test('näyttää edistymisprosentin', () => {
    render(<Sidebar tasks={makeTasks()} />);
    // 1/3 done = 33%
    expect(screen.getByText('33% valmis')).toBeInTheDocument();
  });

  test('näyttää 0% kun ei tehtäviä', () => {
    render(<Sidebar tasks={[]} />);
    expect(screen.getByText('0% valmis')).toBeInTheDocument();
  });

  test('näyttää tyhjän viestin kun ei tehtäviä', () => {
    render(<Sidebar tasks={[]} />);
    expect(screen.getByText('Ei tehtäviä vielä.')).toBeInTheDocument();
  });

  test('näyttää myöhässä-varoituksen', () => {
    const tasks = makeTasks([
      { id: 4, title: 'Myöhässä', status: 'todo', priority: 'normal', due_date: '2020-01-01', is_overdue: true }
    ]);
    render(<Sidebar tasks={tasks} />);
    expect(screen.getByText('1 myöhässä')).toBeInTheDocument();
  });

  test('näyttää korkean prioriteetin varoituksen', () => {
    const tasks = [
      { id: 1, title: 'Tärkeä', status: 'todo', priority: 'high', due_date: null, is_overdue: false },
      { id: 2, title: 'Tärkeä 2', status: 'in_progress', priority: 'high', due_date: null, is_overdue: false },
    ];
    render(<Sidebar tasks={tasks} />);
    expect(screen.getByText('2 korkea prioriteetti')).toBeInTheDocument();
  });

  test('ei näytä huomio-osiota ilman varoituksia', () => {
    const tasks = [
      { id: 1, title: 'OK', status: 'done', priority: 'normal', due_date: null, is_overdue: false },
    ];
    render(<Sidebar tasks={tasks} />);
    expect(screen.queryByText('Huomio')).not.toBeInTheDocument();
  });

  test('näyttää myöhässä-osion', () => {
    const tasks = [
      { id: 1, title: 'Myöhässä tehtävä', status: 'todo', priority: 'high', due_date: '2020-06-15', is_overdue: true },
    ];
    render(<Sidebar tasks={tasks} />);
    expect(screen.getByText('Myöhässä tehtävä')).toBeInTheDocument();
    expect(screen.getByText('Korkea')).toBeInTheDocument();
  });

  test('ei laske valmiita korkeaa prioriteettia varoitukseksi', () => {
    const tasks = [
      { id: 1, title: 'Done high', status: 'done', priority: 'high', due_date: null, is_overdue: false },
    ];
    render(<Sidebar tasks={tasks} />);
    expect(screen.queryByText('korkea prioriteetti')).not.toBeInTheDocument();
  });

  test('näyttää 100% kun kaikki valmiita', () => {
    const tasks = [
      { id: 1, title: 'A', status: 'done', priority: 'normal', due_date: null, is_overdue: false },
      { id: 2, title: 'B', status: 'done', priority: 'normal', due_date: null, is_overdue: false },
    ];
    render(<Sidebar tasks={tasks} />);
    expect(screen.getByText('100% valmis')).toBeInTheDocument();
  });
});
