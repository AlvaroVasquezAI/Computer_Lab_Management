import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaTrash, FaPaperPlane, FaPlusCircle, FaUsers } from 'react-icons/fa';
import apiClient from '../../services/api';
import '../../pages/AdminPage.css';

const EmailExportModal = ({ isOpen, onClose, allTeachers, exportType, selectedId, selectedItemLabel }) => {
    const { t, i18n } = useTranslation();
    const [recipients, setRecipients] = useState([]);
    const [teacherToAdd, setTeacherToAdd] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleAddRecipient = () => {
        if (!teacherToAdd) return;
        const teacher = allTeachers.find(t => t.teacher_id == teacherToAdd);
        if (teacher && !recipients.some(r => r.teacher_id === teacher.teacher_id)) {
            setRecipients([...recipients, teacher]);
        }
        setTeacherToAdd('');
    };

    const handleAddAll = () => {
        setRecipients(allTeachers);
    };

    const handleRemoveRecipient = (teacherId) => {
        setRecipients(recipients.filter(r => r.teacher_id !== teacherId));
    };

    const handleSend = async () => {
        if (recipients.length === 0) {
            alert(t('data_export.no_recipients_error'));
            return;
        }
        setIsSending(true);

        const payload = {
            recipients: recipients.map(r => r.email),
            export_title: selectedItemLabel(), 
            lang: i18n.language
        };
        
        const params = new URLSearchParams({
            by: selectedId === 'all' ? 'all' : exportType,
        });
        if (selectedId !== 'all') {
            params.append('id', selectedId);
        }

        try {
            await apiClient.post(`/export/practices/send-email?${params.toString()}`, payload);
            onClose();
            setRecipients([]);
        } catch (error) {
            console.error("Failed to send export email", error);
            alert(error.response?.data?.detail || "Failed to send email.");
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
                <h3>{t('data_export.email_modal_title')}</h3>
                <div className="form-group">
                    <label>{t('data_export.email_modal_recipients')}</label>
                    <div className="recipients-list">
                        {recipients.map(teacher => (
                            <div key={teacher.teacher_id} className="recipient-tag">
                                {teacher.teacher_name}
                                <button onClick={() => handleRemoveRecipient(teacher.teacher_id)}><FaTimes /></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <div className="add-recipient-controls">
                        <select value={teacherToAdd} onChange={(e) => setTeacherToAdd(e.target.value)}>
                            <option value="">{t('data_export.email_modal_select_teacher')}</option>
                            {allTeachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.teacher_name}</option>)}
                        </select>
                        <button onClick={handleAddRecipient} className="add-btn"><FaPlusCircle /></button>
                    </div>
                    <button onClick={handleAddAll} className="add-all-btn"><FaUsers /> {t('data_export.email_modal_add_all')}</button>
                </div>
                <div className="modal-actions">
                    <button className="save-btn" onClick={handleSend} disabled={isSending}>
                        <FaPaperPlane /> {isSending ? t('data_export.email_modal_sending_button') : t('data_export.email_modal_send_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailExportModal;