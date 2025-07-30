import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit } from 'react-icons/fa';

// Helper to generate time slots from 7:00 to 21:30 in 30-minute intervals
const generateTimeSlots = () => {
    const slots = [];
    for (let h = 7; h < 22; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
        slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
};
const timeSlots = generateTimeSlots();

// Helper for days of the week, using keys for translation
const daysOfWeek = [
    { id: 1, name: 'monday' }, { id: 2, name: 'tuesday' }, { id: 3, name: 'wednesday' },
    { id: 4, name: 'thursday' }, { id: 5, name: 'friday' }
];

const initialSchedule = daysOfWeek.map(day => ({ day_of_week: day.id, day_name: day.name, start_time: '', end_time: '' }));

const SubjectManager = ({ existingSubjects, existingGroups, onAddSubject, initialData }) => {
    const { t } = useTranslation();
    
    const [subjectName, setSubjectName] = useState(initialData ? initialData.subject_name : '');
    const [groupsForSubject, setGroupsForSubject] = useState(initialData ? initialData.groups : []);
    
    const [currentGroupName, setCurrentGroupName] = useState('');
    const [schedule, setSchedule] = useState(initialSchedule);
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);

    const handleScheduleChange = (dayId, field, value) => {
        const newSchedule = schedule.map(day => {
            if (day.day_of_week === dayId) {
                if (field === 'start_time') {
                    return { ...day, start_time: value, end_time: '' };
                }
                return { ...day, [field]: value };
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

        const newGroup = {
            group_name: currentGroupName,
            schedule: validScheduleEntries.map(({ day_of_week, start_time, end_time }) => ({ day_of_week, start_time, end_time: `${end_time}:00` }))
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
                return { ...day, start_time: scheduledDay.start_time, end_time: scheduledDay.end_time.substring(0, 5) };
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
        
        // Find the subject in the existing list to get its ID
        const existingSubject = existingSubjects.find(s => s.subject_name.toLowerCase() === subjectName.trim().toLowerCase());
        
        const newSubjectData = {
            // If the subject exists, use its ID. Otherwise, use null.
            subject_id: existingSubject ? existingSubject.subject_id : null, 
            subject_name: subjectName,
            groups: groupsForSubject,
        };

        onAddSubject(newSubjectData);
        
        // Reset the manager's state for the next subject
        setSubjectName('');
        setGroupsForSubject([]);
    };

    // --- LOGIC FOR CONDITIONAL END TIME DROPDOWN ---
    const getEndTimeOptions = (startTime) => {
        if (!startTime) return [];
        const startIndex = timeSlots.indexOf(startTime);
        // Return all time slots that are after the selected start time
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
                        <div className="schedule-header">
                            <span>{t('signup.day')}</span>
                            <span>{t('signup.start')}</span>
                            <span>{t('signup.end')}</span>
                        </div>
                        {schedule.map(day => (
                            <div key={day.day_of_week} className="schedule-row">
                                <span>{t(`signup.days.${day.day_name}`)}</span>
                                <select value={day.start_time} onChange={(e) => handleScheduleChange(day.day_of_week, 'start_time', e.target.value)}>
                                    <option value="">--:--</option>
                                    {timeSlots.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                                </select>
                                <select value={day.end_time} onChange={(e) => handleScheduleChange(day.day_of_week, 'end_time', e.target.value)} disabled={!day.start_time}>
                                    <option value="">--:--</option>
                                    {getEndTimeOptions(day.start_time).map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddOrUpdateGroup} className="add-button-secondary">
                        {editingGroupIndex !== null ? t('signup.update_group') : t('signup.add_group_button')}
                    </button>
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

            <div className="add-subject-footer">
                <button onClick={handleAddSubjectToForm} className="add-button-primary">
                    {initialData ? t('signup.update_subject') : t('signup.add_button')}
                </button>
            </div>
        </div>
    );
};

export default SubjectManager;