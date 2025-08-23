import React from 'react';
import { useTranslation } from 'react-i18next';
import './SubjectDetailModal.css'; 
import { FaTimes } from 'react-icons/fa';

const PracticeSummaryModal = ({ summary, onClose }) => {
    const { t } = useTranslation();

    if (!summary) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}><FaTimes /></button>

                <h2 className="modal-title">{t('register_practice.success_message')}</h2>
                
                <div className="summary-section">
                    <h4>{summary.practiceName}</h4>
                    <p><strong>{t('register_practice.subject')}:</strong> {summary.subjectName}</p>
                    <p><strong>{t('register_practice.objective')}:</strong> {summary.practiceObjective}</p>
                    <p><strong>{t('register_practice.summary_file')}:</strong> {summary.fileName}</p>
                </div>
                
                <h3 className="modal-subtitle">{t('register_practice.summary_booked_sessions')}</h3>
                {summary.bookings.map(booking => (
                    <div key={booking.group_id} className="group-schedule-card">
                        <p>
                            <strong>{t('register_practice.summary_group')} {booking.groupName}</strong>: 
                            {` ${booking.date} ${t('register_practice.summary_from')} ${booking.start_time.substring(0,5)} ${t('register_practice.summary_to')} ${booking.end_time.substring(0,5)} ${t('register_practice.summary_in')} ${booking.roomName}`}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PracticeSummaryModal;