import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import './PageLayout.css';

const PageLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const containerClasses = [
    'page-container',
    isMobileNavOpen ? 'mobile-nav-is-open' : ''
  ].join(' ');

  return (
    <div className={containerClasses}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleDesktopSidebar}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={toggleMobileNav} 
      />
      
      <div className={`content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <button className="mobile-nav-toggle" onClick={toggleMobileNav}>
          <FaBars />
        </button>
        <main className="content-area">
          <Outlet /> 
        </main>
      </div>

      {isMobileNavOpen && <div className="mobile-overlay" onClick={toggleMobileNav}></div>}
    </div>
  );
};

export default PageLayout;