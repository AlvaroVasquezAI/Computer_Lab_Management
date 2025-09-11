import React from 'react';
import { useTranslation } from 'react-i18next';
import './SubjectDetailModal.css'; 
import { FaTimes, FaClock, FaUsers, FaChalkboardTeacher } from 'react-icons/fa';

const ScheduleDetailModal = ({ details, onClose }) => {
  const { t } = useTranslation();

  if (!details) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        <h2 className="modal-title">{details.subject_name}</h2>
        
        <div className="group-schedule-card">
          <p><FaUsers /> <strong>{t('modal.group_header', 'Group')}:</strong> {details.group_name}</p>
          <p><FaClock /> <strong>{t('modal.time_header', 'Time')}:</strong> {details.start_time.substring(0, 5)} - {details.end_time.substring(0, 5)}</p>
          <p>
            <FaChalkboardTeacher /> 
            <strong>{t('modal.type_header', 'Type')}:</strong> 
            <span className={`type-tag-modal ${details.schedule_type.toLowerCase()}`}>
            {details.schedule_type === 'PRACTICE' 
                ? t('signup.schedule_type.practice', 'Practice') 
                : t('signup.schedule_type.class', 'Class')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailModal;