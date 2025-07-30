import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: email,
        password: password,
      });
      login(response.data.access_token);
      navigate('/home');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        <h2 className="form-title">{t('login.welcome')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-card">
            <div className="form-group">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={t('login.email_placeholder')} 
                required 
              />
            </div>
            <div className="form-group">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={t('login.password_placeholder')} 
                required 
              />
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '...' : t('login.login_button')}
          </button>
        </form>

      
        <Link to="/forgot-password" className="secondary-button-link">
          <button className="secondary-button">
            {t('login.forgot_password')}
          </button>
        </Link>
        
        <p className="tertiary-action">
          {t('login.new_user')} <Link to="/signup" className="signup-link">{t('login.signup')}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;