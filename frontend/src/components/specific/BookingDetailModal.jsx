import React from 'react';
import { useTranslation } from 'react-i18next';
import './SubjectDetailModal.css'; 
import { FaTimes, FaUser, FaUsers } from 'react-icons/fa';

const BookingDetailModal = ({ details, onClose }) => {
  const { t } = useTranslation(); 

  if (!details) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        <h2 className="modal-title">{details.practice.title}</h2>
        
        <div className="group-schedule-card">
            <p><FaUser /> <strong>{t('status_page.modal_teacher')}:</strong> {details.practice.teacher.teacher_name}</p>
            <p><FaUsers /> <strong>{t('status_page.modal_group')}:</strong> {details.group.group_name}</p>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;