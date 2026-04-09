import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Settings() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // Account deletion
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ text: '', type: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'Uudet salasanat eivät täsmää', type: 'error' });
      return;
    }

    try {
      const res = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg({ text: res.data.message, type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordMsg({
        text: err.response?.data?.error || 'Salasanan vaihto epäonnistui',
        type: 'error',
      });
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMsg({ text: '', type: '' });

    if (!deleteConfirm) {
      setDeleteMsg({ text: 'Vahvista tilin poisto rastittamalla ruutu', type: 'error' });
      return;
    }

    try {
      await api.delete('/auth/delete-account', {
        data: { password: deletePassword },
      });
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteMsg({
        text: err.response?.data?.error || 'Tilin poisto epäonnistui',
        type: 'error',
      });
    }
  };

  return (
    <>
      <header className="header">
        <h1>Tehtävienhallinta</h1>
        <div className="header-right">
          <span>{username}</span>
          <Link to="/" className="btn-back">← Takaisin</Link>
        </div>
      </header>

      <div className="settings-page">
        <h2>Asetukset</h2>

        <div className="settings-section">
          <h3>Vaihda salasana</h3>
          <form onSubmit={handlePasswordChange}>
            {passwordMsg.text && (
              <div className={`settings-msg ${passwordMsg.type}`}>{passwordMsg.text}</div>
            )}
            <div className="form-group">
              <label>Nykyinen salasana</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Uusi salasana</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Vahvista uusi salasana</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
              Vaihda salasana
            </button>
          </form>
        </div>

        <div className="settings-section settings-danger">
          <h3>Poista tili</h3>
          <p className="danger-warning">
            Tämä toiminto poistaa tilisi ja kaikki tehtäväsi pysyvästi. Tätä ei voi peruuttaa.
          </p>
          <form onSubmit={handleDeleteAccount}>
            {deleteMsg.text && (
              <div className={`settings-msg ${deleteMsg.type}`}>{deleteMsg.text}</div>
            )}
            <div className="form-group">
              <label>Vahvista salasanalla</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                />
                Ymmärrän, että tilini ja kaikki tietoni poistetaan pysyvästi
              </label>
            </div>
            <button type="submit" className="btn btn-danger" style={{ width: 'auto' }}>
              Poista tili
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Settings;
