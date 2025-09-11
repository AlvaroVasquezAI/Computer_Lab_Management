import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ScheduleDetailModal from './ScheduleDetailModal';
import './WorkspaceSchedule.css';

const WorkspaceSchedule = ({ scheduleData }) => {
    const { t } = useTranslation();
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    const handleSessionClick = (session) => {
        setSelectedSchedule(session);
    };

    if (!scheduleData) {
        return <div>{t('workspace.schedule_loading', 'Loading schedule...')}</div>;
    }

    return (
        <>
            <div className="schedule-card-container mobile-scrollable-content">
                {daysOfWeek.map(day => (
                    <div key={day} className="schedule-day-column">
                        <h3 className="day-title">{t(`signup.days.${day}`)}</h3>
                        <div className="sessions-list">
                            {scheduleData[day] && scheduleData[day].length > 0 ? (
                                scheduleData[day].map((session, index) => (
                                    <button
                                        key={index}
                                        className="session-button"
                                        onClick={() => handleSessionClick(session)}
                                    >
                                        <span className="session-group-name">{session.group_name}</span>
                                        <span className={`type-tag ${session.schedule_type.toLowerCase()}`}>
                                            {session.schedule_type === 'PRACTICE' 
                                                ? t('signup.schedule_type.practice', 'Practice') 
                                                : t('signup.schedule_type.class', 'Class')}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="no-sessions-placeholder">
                                    -
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedSchedule && (
                <ScheduleDetailModal
                    details={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                />
            )}
        </>
    );
};

export default WorkspaceSchedule;