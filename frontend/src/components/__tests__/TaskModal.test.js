import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskModal from '../TaskModal';

describe('TaskModal', () => {
  const defaultProps = {
    task: null,
    onSave: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderöi uuden tehtävän lomakkeen', () => {
    render(<TaskModal {...defaultProps} />);
    expect(screen.getByText('Uusi tehtävä')).toBeInTheDocument();
    expect(screen.getByText('Otsikko')).toBeInTheDocument();
  });

  test('renderöi muokkauslomakkeen olemassa olevalle tehtävälle', () => {
    const task = {
      title: 'Testi',
      description: 'Kuvaus',
      status: 'in_progress',
      priority: 'high',
      due_date: '2026-12-01',
    };
    render(<TaskModal {...defaultProps} task={task} />);
    expect(screen.getByText('Muokkaa tehtävää')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Testi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Kuvaus')).toBeInTheDocument();
  });

  test('kutsuu onSave oikeilla tiedoilla', async () => {
    const { container } = render(<TaskModal {...defaultProps} />);
    const user = userEvent.setup();

    const titleInput = container.querySelector('input[type="text"]');
    await user.type(titleInput, 'Uusi');
    await user.click(screen.getByRole('button', { name: 'Tallenna' }));

    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Uusi',
      })
    );
  });

  test('kutsuu onClose peruutusnapilla', async () => {
    render(<TaskModal {...defaultProps} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Peruuta' }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
