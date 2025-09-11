import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import MonthlyProgressChart from './MonthlyProgressChart';
import './ProgressDetailModal.css';

const ProgressDetailModal = ({ isOpen, onClose, subjectData }) => {
    const { t } = useTranslation();

    if (!isOpen || !subjectData) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content progress-detail-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                <h2 className="modal-title">{subjectData.subject_name}</h2>

                <div className="group-charts-container">
                    {subjectData.groups_progress.map(group => (
                        <MonthlyProgressChart
                            key={group.group_name}
                            subject={group.group_name}
                            completed={group.completed_count}
                            total={group.total_goal}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressDetailModal;