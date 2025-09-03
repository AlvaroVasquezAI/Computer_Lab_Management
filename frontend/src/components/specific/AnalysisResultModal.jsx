import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaLightbulb } from 'react-icons/fa';
import './AnalysisResultModal.css'; 

const AnalysisChart = ({ found, total }) => {
    const percentage = total > 0 ? (found / total) * 100 : 0;
    const circumference = 2 * Math.PI * 54; 
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="analysis-chart-container">
            <svg viewBox="0 0 120 120" className="chart-svg">
                <circle className="chart-background" cx="60" cy="60" r="54" />
                <circle
                    className="chart-progress"
                    cx="60" cy="60" r="54"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <div className="chart-text">
                <span className="chart-score">{found}/{total}</span>
            </div>
        </div>
    );
};

const AnalysisResultModal = ({ result, onClose }) => {
    const { t, i18n } = useTranslation();
    const requiredSections = React.useMemo(() => {
        if (i18n.language === 'es') {
            return [
                "Nombre de la práctica", "Resultados de aprendizaje propuestos", "Objetivo",
                "Introducción", "Desarrollo de la práctica", "Conclusión"
            ];
        }
        return [
            "Practice Name", "Proposed Learning Outcomes", "Objective",
            "Introduction", "Practice Development", "Conclusion"
        ];
    }, [i18n.language]);

    const foundSections = result?.analysis?.found_sections || {};
    const missingSections = result?.analysis?.missing_required_sections || [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content analysis-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                <h2 className="modal-title">{t('analysis_modal.title')}</h2>

                <div className="analysis-summary">
                    <AnalysisChart found={result.stats.found} total={result.stats.total_required} />
                    <h3 className="summary-title">{t('analysis_modal.completeness_score')}</h3>
                </div>

                <div className="sections-container">
                    <h4 className="section-title">{t('analysis_modal.required_sections')}</h4>
                    {requiredSections.map(sectionName => {
                        const sectionData = foundSections[sectionName];
                        const isMissing = missingSections.includes(sectionName);
                        
                        const isTitleSection = sectionName === "Nombre de la práctica" || sectionName === "Practice Name";

                        return (
                            <div key={sectionName} className={`analysis-section ${isMissing ? 'missing' : ''}`}>
                                <div className="section-header">
                                    {isMissing ? <FaExclamationCircle className="status-icon missing" /> : <FaCheckCircle className="status-icon found" />}
                                    <h5>{sectionName}</h5>
                                </div>
                                {sectionData ? (
                                    <>
                                        {!isTitleSection && (
                                            <textarea readOnly defaultValue={sectionData.text}></textarea>
                                        )}
                                        {sectionData.feedback && (
                                            <div className="feedback-box">
                                                <FaLightbulb />
                                                <strong>{t('analysis_modal.quality_feedback')}:</strong>
                                                <span>{sectionData.feedback}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="not-found-text">{t('analysis_modal.not_found')}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AnalysisResultModal;