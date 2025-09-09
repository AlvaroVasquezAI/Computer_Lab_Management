import React, { useState } from 'react';
import { FaPen, FaTrash } from 'react-icons/fa';
import GroupScheduleModal from './GroupScheduleModal';
import '../../pages/Auth/SignUpPage.css';

const SubjectSummaryCard = ({ subject, index, onEdit, onDelete, healthStatus }) => {
    const [selectedGroup, setSelectedGroup] = useState(null);

    const getHealthClass = () => {
        if (healthStatus.isActive) return 'active-edit';
        if (healthStatus.status === 'error') return 'health-error';
        if (healthStatus.status === 'ok') return 'health-ok';
        return '';
    };

    const handleOpenModal = (group) => {
        setSelectedGroup(group);
    };

    const handleCloseModal = () => {
        setSelectedGroup(null);
    };
    
    return (
        <>
            <div className={`subject-summary-card ${getHealthClass()}`}>
                <div className="card-header">
                    <h3>{subject.subject_name}</h3>
                </div>

                <div className="card-body">
                    <div className="group-button-list">
                        {subject.groups && subject.groups.map((group, groupIndex) => (
                            <button key={groupIndex} onClick={() => handleOpenModal(group)}>
                                {group.group_name}
                            </button>
                        ))}
                    </div>
                    <div className="card-actions">
                        <button onClick={() => onEdit(index)} className="action-btn edit" aria-label="Edit Subject">
                            <FaPen />
                        </button>
                        <button onClick={() => onDelete(index)} className="action-btn delete" aria-label="Delete Subject">
                            <FaTrash />
                        </button>
                    </div>
                </div>
                
                {healthStatus.status === 'error' && (
                    <div className="card-footer-error">
                        <p>{healthStatus.message}</p>
                    </div>
                )}
            </div>

            {selectedGroup && (
                <GroupScheduleModal 
                    subjectName={subject.subject_name}
                    group={selectedGroup} 
                    onClose={handleCloseModal} 
                />
            )}
        </>
    );
};

export default SubjectSummaryCard;