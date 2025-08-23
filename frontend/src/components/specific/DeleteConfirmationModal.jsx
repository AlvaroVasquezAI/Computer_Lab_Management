import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SubjectDetailModal.css'; 
import { FaTimes } from 'react-icons/fa';

const DeleteConfirmationModal = ({ practice, onConfirm, onClose, isDeleting }) => {
  const { t } = useTranslation();
  const [confirmationText, setConfirmationText] = useState('');

  if (!practice) return null;

  const isConfirmationMatch = confirmationText === practice.title;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        <h2 className="modal-title warning">{t('delete_modal.title')}</h2>
        
        <div className="practice-summary-card">
          <h4>{practice.title}</h4>
          <p><strong>{t('consult_practices.header_subject')}:</strong> {practice.subject_name}</p>
        </div>

        <p className="confirmation-prompt">
          {t('delete_modal.prompt_part1')} <strong>{practice.title}</strong> {t('delete_modal.prompt_part2')}
        </p>

        <input
          type="text"
          className="confirmation-input"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={t('delete_modal.placeholder')}
        />

        <button
          className="confirm-delete-button"
          onClick={onConfirm}
          disabled={!isConfirmationMatch || isDeleting}
        >
          {isDeleting ? t('delete_modal.deleting_button') : t('delete_modal.confirm_button')}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;