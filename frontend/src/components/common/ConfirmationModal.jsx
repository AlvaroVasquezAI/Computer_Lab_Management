import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isConfirming = false
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        <div className="confirmation-header">
          <FaExclamationTriangle className="warning-icon" />
          <h2 className="modal-title">{title}</h2>
        </div>
        
        <p className="confirmation-message">{message}</p>

        <div className="confirmation-actions">
          <button className="cancel-button" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </button>
          <button className="confirm-button" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? "..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;