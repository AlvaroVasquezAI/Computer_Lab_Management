import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { FaLanguage, FaRegSun, FaMoon } from 'react-icons/fa';
import './LandingPage.css';

import logoLight from '../assets/images/logo-light.png';
import logoDark from '../assets/images/logo-dark.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
  };

  return (
    <div className="landing-container">
      <header className="landing-header"></header>
      <main className="landing-content">
        <div className="landing-title">
          <img 
            src={theme === 'light' ? logoLight : logoDark}
            alt="Ctrl+LAB Logo"
            className="landing-logo"
          />
        </div>
        <div className="landing-action">
          <button onClick={() => navigate('/login')} className="start-button">
            {t('landing.start_button')}
          </button>
        </div>
      </main>
      <footer className="landing-footer">
        <button className="icon-button" onClick={changeLanguage}>
          <FaLanguage />
        </button>
        <button className="icon-button" onClick={toggleTheme}>
          {theme === 'light' ? <FaRegSun /> : <FaMoon />}
        </button>
      </footer>
    </div>
  );
};

export default LandingPage;