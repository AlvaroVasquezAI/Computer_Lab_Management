import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaUserCircle } from 'react-icons/fa';
import '../../pages/TeacherDetailPage.css'; 

const DeleteTeacherModal = ({ teacher, onConfirm, onClose, isDeleting }) => {
  const { t } = useTranslation();
  const [nameConfirmation, setNameConfirmation] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');

  if (!teacher) return null;

  const isConfirmationMatch =
    nameConfirmation === teacher.teacher_name &&
    emailConfirmation === teacher.email;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-teacher-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        <h2 className="modal-title warning">{t('delete_teacher_modal.title')}</h2>
        
        <div className="teacher-summary-card">
          <FaUserCircle className="summary-avatar" />
          <div className="summary-info">
            <h4>{teacher.teacher_name}</h4>
            <p>{teacher.email}</p>
          </div>
        </div>

        <p className="confirmation-prompt">
          {t('delete_teacher_modal.prompt_part1')} <strong>({teacher.teacher_name})</strong> {t('delete_teacher_modal.prompt_part2')} <strong>({teacher.email})</strong> {t('delete_teacher_modal.prompt_part3')}
        </p>

        <div className="confirmation-inputs">
          <input
            type="text"
            className="confirmation-input"
            value={nameConfirmation}
            onChange={(e) => setNameConfirmation(e.target.value)}
            placeholder={t('delete_teacher_modal.name_placeholder')}
          />
          <input
            type="email"
            className="confirmation-input"
            value={emailConfirmation}
            onChange={(e) => setEmailConfirmation(e.target.value)}
            placeholder={t('delete_teacher_modal.email_placeholder')}
          />
        </div>

        <button
          className="confirm-delete-button"
          onClick={onConfirm}
          disabled={!isConfirmationMatch || isDeleting}
        >
          {isDeleting ? t('delete_teacher_modal.deleting_button') : t('delete_teacher_modal.confirm_button')}
        </button>
      </div>
    </div>
  );
};

export default DeleteTeacherModal;