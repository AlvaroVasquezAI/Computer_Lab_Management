import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';

const AnnouncementItem = ({ announcement, onUpdate, onDelete }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(announcement.description);
    const [isSaving, setIsSaving] = useState(false);

    const isOwner = user?.id === announcement.teacher_id;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await apiClient.put(`/announcements/${announcement.announcement_id}`, { description: editedText });
            onUpdate(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update announcement", error);
            alert("Could not save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(t('announcements_page.delete_confirm'))) {
            try {
                await apiClient.delete(`/announcements/${announcement.announcement_id}`);
                onDelete(announcement.announcement_id);
            } catch (error) {
                console.error("Failed to delete announcement", error);
                alert("Could not delete the announcement.");
            }
        }
    };

    return (
        <div className="announcement-item">
            {isEditing ? (
                <div className="announcement-edit-area">
                    <div className="announcement-header">
                        <span className="announcement-author">{announcement.teacher.teacher_name}</span>
                        <span className="announcement-date">{new Date(announcement.created_at).toLocaleString()}</span>
                    </div>
                    <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="edit-textarea"
                    />
                    <div className="edit-controls">
                        <button onClick={() => setIsEditing(false)} className="cancel-btn">
                            {t('announcements_page.cancel_button')}
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="save-btn">
                            {isSaving ? '...' : t('announcements_page.save_button')}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="announcement-header">
                        <span className="announcement-author">{announcement.teacher.teacher_name}</span>
                        <span className="announcement-date">{new Date(announcement.created_at).toLocaleString()}</span>
                    </div>

                    <div className="announcement-body">
                        <p>{announcement.description}</p>
                    </div>

                    <div className="announcement-footer">
                        <div className="announcement-tags">
                            {announcement.group && <div className="mini-tag">{announcement.group.group_name}</div>}
                            {announcement.room && <div className="mini-tag">{announcement.room.room_name}</div>}
                        </div>
                        {isOwner && (
                            <div className="announcement-actions">
                                <button onClick={() => setIsEditing(true)}>{t('announcements_page.edit_button')}</button>
                                <button onClick={handleDelete} className="delete-btn">{t('announcements_page.delete_button')}</button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AnnouncementItem;