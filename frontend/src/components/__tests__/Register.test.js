import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api');

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const getInputByLabel = (container, labelText) => {
    const labels = [...container.querySelectorAll('label')];
    const label = labels.find(l => l.textContent === labelText);
    return label.parentElement.querySelector('input');
  };

  test('renderöi rekisteröitymislomakkeen', () => {
    const { container } = renderRegister();
    expect(screen.getByRole('heading', { name: 'Rekisteröidy' })).toBeInTheDocument();
    expect(getInputByLabel(container, 'Käyttäjänimi')).toBeInTheDocument();
    expect(getInputByLabel(container, 'Salasana')).toBeInTheDocument();
    expect(getInputByLabel(container, 'Vahvista salasana')).toBeInTheDocument();
  });

  test('sisältää linkin kirjautumiseen', () => {
    renderRegister();
    expect(screen.getByText('Kirjaudu sisään')).toHaveAttribute('href', '/login');
  });

  test('rekisteröityminen onnistuu', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'test-token', username: 'newuser' }
    });

    const { container } = renderRegister();
    const user = userEvent.setup();

    await user.type(getInputByLabel(container, 'Käyttäjänimi'), 'newuser');
    await user.type(getInputByLabel(container, 'Salasana'), 'password123');
    await user.type(getInputByLabel(container, 'Vahvista salasana'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Rekisteröidy' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        password: 'password123'
      });
    });
  });

  test('näyttää virheen kun salasanat eivät täsmää', async () => {
    const { container } = renderRegister();
    const user = userEvent.setup();

    await user.type(getInputByLabel(container, 'Käyttäjänimi'), 'newuser');
    await user.type(getInputByLabel(container, 'Salasana'), 'password1');
    await user.type(getInputByLabel(container, 'Vahvista salasana'), 'password2');
    await user.click(screen.getByRole('button', { name: 'Rekisteröidy' }));

    expect(screen.getByText('Salasanat eivät täsmää')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test('näyttää palvelimen virheilmoituksen', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Käyttäjänimi on jo käytössä' } }
    });

    const { container } = renderRegister();
    const user = userEvent.setup();

    await user.type(getInputByLabel(container, 'Käyttäjänimi'), 'existing');
    await user.type(getInputByLabel(container, 'Salasana'), 'password123');
    await user.type(getInputByLabel(container, 'Vahvista salasana'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Rekisteröidy' }));

    await waitFor(() => {
      expect(screen.getByText('Käyttäjänimi on jo käytössä')).toBeInTheDocument();
    });
  });
});
