import React from 'react';
import { useTranslation } from 'react-i18next';
import './InfoCard.css';

const InfoCard = ({ title, practiceCount, tags, onCardClick, tagsLabel }) => {
    const { t } = useTranslation();

    return (
        <button className="info-card-button" onClick={onCardClick}>
            <h3 className="info-card-title">{title}</h3>
            <p className="info-card-stat">
                {t('modal.total_practices')}: <span>{practiceCount}</span>
            </p>
            <div className="info-card-tags-section">
                <h4 className="tags-label">{tagsLabel}:</h4>
                <div className="tags-container">
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="info-card-tag">{tag}</span>
                    ))}
                    {tags.length > 3 && (
                        <span className="info-card-tag more-tag">+{tags.length - 3} more</span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default InfoCard;