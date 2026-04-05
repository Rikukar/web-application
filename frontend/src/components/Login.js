import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Kirjautuminen epäonnistui');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Kirjaudu sisään</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Käyttäjänimi</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Salasana</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Kirjaudu</button>
        <div className="auth-link">
          Ei tiliä? <Link to="/register">Rekisteröidy</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
