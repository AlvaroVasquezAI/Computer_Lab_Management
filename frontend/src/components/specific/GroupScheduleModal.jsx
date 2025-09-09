import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import './SubjectDetailModal.css'; 

const DayOfWeek = ({ dayNumber }) => {
    const { t } = useTranslation();
    const dayMap = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
    return t(`signup.days.${dayMap[dayNumber]}`, { defaultValue: `Day ${dayNumber}` });
};

const GroupScheduleModal = ({ subjectName, group, onClose }) => {
    const { t } = useTranslation();

    if (!group) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                <h2 className="modal-title">{subjectName}</h2>
                <div className="group-schedule-card">
                    <h4>{group.group_name}</h4>
                    <div className="schedule-table">
                        {group.schedule.map(sch => (
                            <div key={sch.day_of_week} className="schedule-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                                <div><DayOfWeek dayNumber={sch.day_of_week} /></div>
                                <div>{sch.start_time.substring(0, 5)}</div>
                                <div>{sch.end_time.substring(0, 5)}</div>
                                <div>
                                    <span className={`type-tag-modal ${sch.schedule_type.toLowerCase()}`}>
                                        {sch.schedule_type === 'PRACTICE'
                                        ? t('signup.schedule_type.practice', 'Practice') 
                                        : t('signup.schedule_type.class', 'Class')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupScheduleModal;