import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit } from 'react-icons/fa';

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 7; h < 22; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
        slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
};
const timeSlots = generateTimeSlots();

const daysOfWeek = [
    { id: 1, name: 'monday' }, { id: 2, name: 'tuesday' }, { id: 3, name: 'wednesday' },
    { id: 4, name: 'thursday' }, { id: 5, name: 'friday' }
];

const initialSchedule = daysOfWeek.map(day => ({ 
    day_of_week: day.id, 
    day_name: day.name, 
    start_time: '', 
    end_time: '',
    schedule_type: 'CLASS' 
}));

const SubjectManager = ({ existingSubjects, existingGroups, onAddSubject, initialData }) => {
    const { t } = useTranslation();
    
    const [subjectName, setSubjectName] = useState(initialData ? initialData.subject_name : '');
    const [groupsForSubject, setGroupsForSubject] = useState(initialData ? initialData.groups : []);
    
    const [currentGroupName, setCurrentGroupName] = useState('');
    const [schedule, setSchedule] = useState(initialSchedule);
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);

    useEffect(() => {
        if (initialData) {
            setSubjectName(initialData.subject_name);
            setGroupsForSubject(initialData.groups);
        }
    }, [initialData]);

    const handleScheduleChange = (dayId, field, value) => {
        const newSchedule = schedule.map(day => {
            if (day.day_of_week === dayId) {
                const updatedDay = { ...day, [field]: value };
                if (field === 'start_time') {
                    updatedDay.end_time = ''; 
                }
                if (updatedDay.start_time && updatedDay.end_time) {
                    const start = new Date(`1970-01-01T${updatedDay.start_time}`);
                    const end = new Date(`1970-01-01T${updatedDay.end_time}`);
                    const durationMinutes = (end - start) / (1000 * 60);
                    if (durationMinutes > 90) {
                        updatedDay.schedule_type = 'CLASS';
                    }
                }
                return updatedDay;
            }
            return day;
        });
        setSchedule(newSchedule);
    };

    const handleAddOrUpdateGroup = () => {
        if (!currentGroupName.trim()) {
            alert("Please enter a group name.");
            return;
        }
        const validScheduleEntries = schedule.filter(day => day.start_time && day.end_time);
        if (validScheduleEntries.length === 0) {
            alert("Please set at least one time slot for the group.");
            return;
        }
        const practiceSessions = schedule.filter(s => s.start_time && s.end_time && s.schedule_type === 'PRACTICE');
        if (practiceSessions.length > 1) {
            alert("A group can only have one practice session per week for this subject.");
            return;
        }
        const newGroup = {
            group_name: currentGroupName,
            schedule: validScheduleEntries.map(({ day_of_week, start_time, end_time, schedule_type }) => ({ 
                day_of_week, 
                start_time, 
                end_time: `${end_time}:00`,
                schedule_type 
            }))
        };
        let updatedGroups;
        if (editingGroupIndex !== null) {
            updatedGroups = groupsForSubject.map((group, index) => index === editingGroupIndex ? newGroup : group);
        } else {
            updatedGroups = [...groupsForSubject, newGroup];
        }
        setGroupsForSubject(updatedGroups);
        setCurrentGroupName('');
        setSchedule(initialSchedule);
        setEditingGroupIndex(null);
    };

    const handleEditGroup = (indexToEdit) => {
        const groupToEdit = groupsForSubject[indexToEdit];
        setEditingGroupIndex(indexToEdit);
        setCurrentGroupName(groupToEdit.group_name);
        const newSchedule = initialSchedule.map(day => {
            const scheduledDay = groupToEdit.schedule.find(s => s.day_of_week === day.day_of_week);
            if (scheduledDay) {
                return { 
                    ...day, 
                    start_time: scheduledDay.start_time.substring(0, 5), 
                    end_time: scheduledDay.end_time.substring(0, 5),
                    schedule_type: scheduledDay.schedule_type
                };
            }
            return day;
        });
        setSchedule(newSchedule);
    };
    
    const handleAddSubjectToForm = () => {
        if (!subjectName.trim() || groupsForSubject.length === 0) {
            alert("Please provide a subject name and add at least one group.");
            return;
        }
        
        const existingSubject = existingSubjects.find(s => s.subject_name.toLowerCase() === subjectName.trim().toLowerCase());
        
        const newSubjectData = {
            subject_id: existingSubject ? existingSubject.subject_id : null, 
            subject_name: subjectName,
            groups: groupsForSubject,
        };

        onAddSubject(newSubjectData);
    };

    const getEndTimeOptions = (startTime) => {
        if (!startTime) return [];
        const startIndex = timeSlots.indexOf(startTime);
        return timeSlots.slice(startIndex + 1);
    };

    return (
        <div className="card main-manager-card">
            <div className="sub-card">
                <h3>{initialData ? t('signup.edit_subject') : t('signup.add_subject')}</h3>
                <div className="add-subject-controls">
                    <input className="subject-input" list="subjects-datalist" value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)} placeholder={t('signup.subject_placeholder')} />
                    <datalist id="subjects-datalist">
                        {existingSubjects.map(s => <option key={s.subject_id} value={s.subject_name} />)}
                    </datalist>
                </div>
            </div>

            <div className="sub-card">
                <h3 className="groups-title">{t('signup.groups')}</h3>
                <div className="group-tags">
                    {groupsForSubject.map((group, index) => (
                        <div key={index} className="tag-with-edit">
                            <span className="tag">{group.group_name}</span>
                            <button onClick={() => handleEditGroup(index)} className="edit-tag-button"><FaEdit /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sub-card">
                <h3>{t('signup.add_group_schedule')}</h3>
                <div className="group-schedule-builder">
                    <div className="group-selector">
                        <input className="group-input" list="groups-datalist" value={currentGroupName}
                            onChange={(e) => setCurrentGroupName(e.target.value)} placeholder={t('signup.group_name_placeholder')} />
                        <datalist id="groups-datalist">
                            {existingGroups.map(g => <option key={g.group_id} value={g.group_name} />)}
                        </datalist>
                    </div>

                    <div className="schedule-table">
                        {schedule.map(day => {
                            const start = day.start_time ? new Date(`1970-01-01T${day.start_time}`) : null;
                            const end = day.end_time ? new Date(`1970-01-01T${day.end_time}`) : null;
                            const durationMinutes = (start && end) ? (end - start) / (1000 * 60) : 0;
                            const isPracticeDisabled = durationMinutes > 90;
                            
                            const isEnabled = day.start_time && day.end_time;

                            return (
                                <div key={day.day_of_week} className="schedule-row">
                                    <div className="schedule-day-type-column">
                                        <button
                                            className={`type-toggle ${day.schedule_type === 'PRACTICE' ? 'practice-active' : ''}`}
                                            onClick={() => {
                                                if (isPracticeDisabled) return;
                                                const newType = day.schedule_type === 'CLASS' ? 'PRACTICE' : 'CLASS';
                                                handleScheduleChange(day.day_of_week, 'schedule_type', newType);
                                            }}
                                            disabled={!isEnabled || (day.schedule_type === 'CLASS' && isPracticeDisabled)}
                                            title={isPracticeDisabled ? t('signup.practice_duration_limit_tooltip', 'Practice must be 90 minutes or less') : ''}
                                        >
                                            <span className="toggle-thumb"></span>
                                            <span className="toggle-label">
                                                {day.schedule_type === 'CLASS' 
                                                    ? t('signup.schedule_type.class', 'Class') 
                                                    : t('signup.schedule_type.practice', 'Practice')}
                                            </span>
                                        </button>
                                        <span className="day-name">{t(`signup.days.${day.day_name}`)}</span>
                                    </div>
                                    
                                    <select value={day.start_time} onChange={(e) => handleScheduleChange(day.day_of_week, 'start_time', e.target.value)}>
                                        <option value="">--:--</option>
                                        {timeSlots.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                                    </select>
                                    
                                    <select value={day.end_time} onChange={(e) => handleScheduleChange(day.day_of_week, 'end_time', e.target.value)} disabled={!day.start_time}>
                                        <option value="">--:--</option>
                                        {getEndTimeOptions(day.start_time).map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                                    </select>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={handleAddOrUpdateGroup} className="button-secondary">
                        {editingGroupIndex !== null ? t('signup.update_group') : t('signup.add_group_button')}
                    </button>
                </div>
            </div>

            <div className="add-subject-footer">
                <button onClick={handleAddSubjectToForm} className="button-primary">
                    {initialData ? t('signup.update_subject') : t('signup.add_button')}
                </button>
            </div>
        </div>
    );
};

export default SubjectManager;