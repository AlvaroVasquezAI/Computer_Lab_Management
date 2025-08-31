import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaDesktop } from 'react-icons/fa';
import '../../pages/AdminPage.css'; 

const DeleteRoomModal = ({ room, onConfirm, onClose, isDeleting }) => {
  const { t } = useTranslation();
  const [confirmationText, setConfirmationText] = useState('');

  if (!room) return null;

  const isConfirmationMatch = confirmationText === room.room_name;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-room-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        <h2 className="modal-title warning">{t('delete_room_modal.title')}</h2>
        
        <div className="room-summary-card">
          <FaDesktop className="summary-icon" />
          <div className="summary-info">
            <h4>{room.room_name}</h4>
            <p>{room.capacity ? `${room.capacity} ${t('admin_page.people')}` : `N/A ${t('admin_page.people')}`}</p>
          </div>
        </div>

        <p className="confirmation-prompt">
          {t('delete_room_modal.prompt_part1')} <strong>({room.room_name})</strong> {t('delete_room_modal.prompt_part2')}
        </p>

        <input
          type="text"
          className="confirmation-input"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder={t('delete_room_modal.placeholder')}
        />

        <button
          className="confirm-delete-button"
          onClick={onConfirm}
          disabled={!isConfirmationMatch || isDeleting}
        >
          {isDeleting ? t('delete_room_modal.deleting_button') : t('delete_room_modal.confirm_button')}
        </button>
      </div>
    </div>
  );
};

export default DeleteRoomModal;