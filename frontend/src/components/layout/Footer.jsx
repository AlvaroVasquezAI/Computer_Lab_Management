import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';
import { FaSchool, FaEnvelope } from 'react-icons/fa'; 

const Footer = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p className="footer-copyright">
                    {t('footer.copyright', { year: currentYear })}
                </p>
                <div className="footer-social-links">
                    <a 
                        href="https://www.upiit.ipn.mx/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Official School Page"
                    >
                        <FaSchool />
                    </a>
                    <a 
                        href="mailto:contact@yourschool.edu" 
                        aria-label="Email"
                    >
                        <FaEnvelope />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;