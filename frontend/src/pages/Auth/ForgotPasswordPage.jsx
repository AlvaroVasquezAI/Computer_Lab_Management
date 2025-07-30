import React, { useState } from 'react';
import apiClient from '../../services/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import './LoginPage.css'; 

const ForgotPasswordPage = () => {
  const { t } = useTranslation(); 
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setMessage(t('forgot_password.success_message'));
    } catch (err) {
      setError(t('forgot_password.error_message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        <h2 className="form-title">{t('forgot_password.title')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-card">
            <p className="form-description">
              {t('forgot_password.description')}
            </p>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('forgot_password.email_placeholder')}
                required
              />
            </div>
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? t('forgot_password.submit_button_loading') : t('forgot_password.submit_button')}
          </button>
        </form>
        
        <p className="tertiary-action">
          {t('forgot_password.remembered_password')} <Link to="/login" className="signup-link">{t('forgot_password.login_link')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;