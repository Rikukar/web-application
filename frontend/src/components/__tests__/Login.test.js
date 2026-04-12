import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api');

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const getInputByLabel = (container, labelText) => {
    const labels = [...container.querySelectorAll('label')];
    const label = labels.find(l => l.textContent === labelText);
    return label.parentElement.querySelector('input');
  };

  test('renderöi kirjautumislomakkeen', () => {
    const { container } = renderLogin();
    expect(screen.getByText('Kirjaudu sisään')).toBeInTheDocument();
    expect(getInputByLabel(container, 'Käyttäjänimi')).toBeInTheDocument();
    expect(getInputByLabel(container, 'Salasana')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kirjaudu' })).toBeInTheDocument();
  });

  test('sisältää linkin rekisteröitymiseen', () => {
    renderLogin();
    expect(screen.getByText('Rekisteröidy')).toHaveAttribute('href', '/register');
  });

  test('kirjautuminen onnistuu', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'test-token', username: 'testuser' }
    });

    const { container } = renderLogin();
    const user = userEvent.setup();

    await user.type(getInputByLabel(container, 'Käyttäjänimi'), 'testuser');
    await user.type(getInputByLabel(container, 'Salasana'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  test('näyttää virheilmoituksen väärillä tunnuksilla', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Virheellinen käyttäjänimi tai salasana' } }
    });

    const { container } = renderLogin();
    const user = userEvent.setup();

    await user.type(getInputByLabel(container, 'Käyttäjänimi'), 'wrong');
    await user.type(getInputByLabel(container, 'Salasana'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));

    await waitFor(() => {
      expect(screen.getByText('Virheellinen käyttäjänimi tai salasana')).toBeInTheDocument();
    });
  });

  test('näyttää yleisen virheen kun palvelin ei vastaa', async () => {
    api.post.mockRejectedValueOnce(new Error('Network Error'));

    const { container } = renderLogin();
    const user = userEvent.setup();

    await user.type(getInputByLabel(container, 'Käyttäjänimi'), 'test');
    await user.type(getInputByLabel(container, 'Salasana'), 'test');
    await user.click(screen.getByRole('button', { name: 'Kirjaudu' }));

    await waitFor(() => {
      expect(screen.getByText('Kirjautuminen epäonnistui')).toBeInTheDocument();
    });
  });
});
