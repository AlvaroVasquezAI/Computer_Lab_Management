import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash } from 'react-icons/fa';

const SubjectList = ({ subjects, onDelete, onEdit }) => {
    const { t } = useTranslation();

    return (
        <div className="subjects-list-table">
            <div className="list-table-header">
                <span>{t('signup.id')}</span>
                <span>{t('signup.name')}</span>
                <span>{t('signup.action')}</span>
            </div>
            {subjects.length === 0 && <div className="empty-list-message">No subjects added yet.</div>}
            {subjects.map((subject, index) => (
                <div key={index} className="list-table-row">
                    <span>
                        {subject.subject_id 
                            ? String(subject.subject_id).padStart(2, '0') 
                            : '##'}
                    </span>
                    <span>{subject.subject_name}</span>
                    <div className="action-buttons">
                        <button onClick={() => onEdit(index)}><FaEdit /></button>
                        <button onClick={() => onDelete(index)}><FaTrash /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SubjectList;