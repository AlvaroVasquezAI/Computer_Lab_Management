import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

import { 
  FaArrowLeft, FaLanguage, FaHome, FaUserTie, FaEnvelope, 
  FaCheckCircle, FaDesktop, FaCog, FaMoon 
} from "react-icons/fa";
import { FaRegSun } from "react-icons/fa6";

const Sidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
  };

  const handleToggleClick = () => {
    if (window.innerWidth <= 768) { 
      onMobileClose();
    } else {
      onToggle();
    }
  };

  const sidebarClasses = [
    'sidebar',
    isCollapsed ? 'collapsed' : '',
    isMobileOpen ? 'mobile-open' : ''
  ].join(' ');


  return (
    <aside className={sidebarClasses}>
      <div className="sidebar-top">
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="sidebar-title">
              <span>{t('sidebar.title_line1')}</span>
              <span>{t('sidebar.title_line2')}</span>
            </div>
          )}
          <button onClick={handleToggleClick} className="toggle-button">
            <FaArrowLeft />
          </button>
        </div>

        {user && (
          <div className="user-info">
            <div className="user-details">
              <div className="user-detail-row">
                <FaUserTie className="user-icon" />
                {!isCollapsed && <span className="user-name">{user.name}</span>}
              </div>
              <div className="user-detail-row">
                <FaEnvelope className="user-icon" />
                {!isCollapsed && <span className="user-email">{user.email}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/home" className="nav-link">
          <FaHome className="nav-icon" />
          <span className="nav-text">{t('sidebar.home')}</span>
        </NavLink>
        <NavLink to="/workspace" className="nav-link">
          <FaDesktop className="nav-icon" />
          <span className="nav-text">{t('sidebar.workspace')}</span>
        </NavLink>
        <NavLink to="/status" className="nav-link">
          <FaCheckCircle className="nav-icon" />
          <span className="nav-text">{t('sidebar.status')}</span>
        </NavLink>
        
        {user?.role === 'admin' && (
          <NavLink to="/admin" className="nav-link">
            <FaCog className="nav-icon" />
            <span className="nav-text">{t('sidebar.administration')}</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-button">
          <span className="nav-text">{t('sidebar.logout')}</span>
        </button>
        <div className="footer-icons">
          <button className="sidebar-icon-button" onClick={changeLanguage}>
            <FaLanguage />
          </button>
          <button className="sidebar-icon-button" onClick={toggleTheme}>
            {theme === 'light' ? <FaRegSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;