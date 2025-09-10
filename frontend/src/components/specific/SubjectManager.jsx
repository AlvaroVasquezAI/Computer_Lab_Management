import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit } from 'react-icons/fa';
import apiClient from '../../services/api';

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
    schedule_type: 'CLASS',
    isPracticeSlotAvailable: true
}));

const isTimeOverlapping = (startTime, endTime, busySlots = []) => {
    if (!startTime || !endTime) return false;
    const slotStart = new Date(`1970-01-01T${startTime}`);
    const slotEnd = new Date(`1970-01-01T${endTime}`);
    for (const busySlot of busySlots) {
        const busyStart = new Date(`1970-01-01T${busySlot.start_time}`);
        const busyEnd = new Date(`1970-01-01T${busySlot.end_time}`);
        if (slotStart < busyEnd && slotEnd > busyStart) {
            return true;
        }
    }
    return false;
};

const SubjectManager = ({ existingSubjects, existingGroups, onAddSubject, initialData, teacherIdForEdit, teacherTempSchedule }) => {
    const { t } = useTranslation();
    
    const [subjectName, setSubjectName] = useState(initialData ? initialData.subject_name : '');
    const [groupsForSubject, setGroupsForSubject] = useState(initialData ? initialData.groups : []);
    const [currentGroupName, setCurrentGroupName] = useState('');
    const [schedule, setSchedule] = useState(initialSchedule);
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);
    
    const [groupDbSchedule, setGroupDbSchedule] = useState({ group_busy_slots: {}, teacher_busy_slots: {} });
    const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
    const scheduleFetchTimeout = useRef(null);

    const otherTeacherBusySlots = useMemo(() => {
        if (editingGroupIndex === null) {
            return teacherTempSchedule;
        }
        const groupBeingEdited = groupsForSubject[editingGroupIndex];
        if (!groupBeingEdited) {
            return teacherTempSchedule;
        }
        const scheduleToExclude = groupBeingEdited.schedule.map(s => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
        }));
        const filteredSchedule = JSON.parse(JSON.stringify(teacherTempSchedule));
        scheduleToExclude.forEach(excludedSlot => {
            const daySlots = filteredSchedule[excludedSlot.day_of_week];
            if (daySlots) {
                const indexToRemove = daySlots.findIndex(
                    slot => slot.start_time === excludedSlot.start_time && slot.end_time === excludedSlot.end_time
                );
                if (indexToRemove > -1) {
                    daySlots.splice(indexToRemove, 1);
                }
            }
        });
        return filteredSchedule;
    }, [teacherTempSchedule, editingGroupIndex, groupsForSubject]);

    useEffect(() => {
        if (initialData) {
            setSubjectName(initialData.subject_name);
            setGroupsForSubject(initialData.groups);
        }
    }, [initialData]);

    useEffect(() => {
        if (currentGroupName.trim() === '') {
            setGroupDbSchedule({ group_busy_slots: {}, teacher_busy_slots: {} });
            return;
        }
        clearTimeout(scheduleFetchTimeout.current);
        setIsFetchingSchedule(true);
        scheduleFetchTimeout.current = setTimeout(async () => {
            try {
                const params = { group_name: currentGroupName };
                if (teacherIdForEdit) {
                    params.teacher_id_to_exclude = teacherIdForEdit;
                }
                const response = await apiClient.get('/schedules/availability', { params });
                setGroupDbSchedule(response.data);
            } catch (error) {
                console.error("Failed to fetch schedule availability", error);
            } finally {
                setIsFetchingSchedule(false);
            }
        }, 500);
    }, [currentGroupName, teacherIdForEdit]);

    const handleScheduleChange = useCallback(async (dayId, field, value) => {
        let newSchedule = schedule.map(day => {
            if (day.day_of_week === dayId) {
                const updatedDay = { ...day, [field]: value };
                if (field === 'start_time') {
                    updatedDay.end_time = '';
                }
                if (field !== 'schedule_type') {
                    updatedDay.isPracticeSlotAvailable = true;
                }
                return updatedDay;
            }
            return day;
        });

        const changedDay = newSchedule.find(d => d.day_of_week === dayId);
        if (changedDay.start_time && changedDay.end_time) {
            const durationMinutes = (new Date(`1970-01-01T${changedDay.end_time}`) - new Date(`1970-01-01T${changedDay.start_time}`)) / 60000;
            if (durationMinutes > 90) {
                changedDay.schedule_type = 'CLASS';
                changedDay.isPracticeSlotAvailable = false;
            } else {
                try {
                    const response = await apiClient.get('/onboarding/check-practice-availability', {
                        params: { day_of_week: changedDay.day_of_week, start_time: changedDay.start_time, end_time: changedDay.end_time }
                    });
                    changedDay.isPracticeSlotAvailable = response.data.is_available;
                } catch (error) {
                    console.error("Availability check failed:", error);
                    changedDay.isPracticeSlotAvailable = false;
                }
            }
        }

        if (field === 'schedule_type' && value === 'PRACTICE') {
            newSchedule = newSchedule.map(day => {
                if (day.day_of_week !== dayId && day.schedule_type === 'PRACTICE') {
                    return { ...day, schedule_type: 'CLASS' };
                }
                return day;
            });
        }
        
        setSchedule(newSchedule);
    }, [schedule]);

    const handleEditGroup = (indexToEdit) => {
        const groupToEdit = groupsForSubject[indexToEdit];
        setEditingGroupIndex(indexToEdit);
        setCurrentGroupName(groupToEdit.group_name);

        const populatedSchedule = initialSchedule.map(day => {
            const scheduledDay = groupToEdit.schedule.find(s => s.day_of_week === day.day_of_week);
            if (scheduledDay) {
                return {
                    ...day,
                    start_time: scheduledDay.start_time.substring(0, 5),
                    end_time: scheduledDay.end_time.substring(0, 5),
                    schedule_type: scheduledDay.schedule_type || 'CLASS' 
                };
            }
            return day;
        });

        const runValidation = async (scheduleToValidate) => {
            const validationPromises = scheduleToValidate.map(async (day) => {
                const updatedDay = { ...day };
                if (updatedDay.start_time && updatedDay.end_time) {
                    const durationMinutes = (new Date(`1970-01-01T${updatedDay.end_time}`) - new Date(`1970-01-01T${updatedDay.start_time}`)) / 60000;
                    if (durationMinutes > 90) {
                        updatedDay.isPracticeSlotAvailable = false;
                    } else {
                        try {
                            const response = await apiClient.get('/onboarding/check-practice-availability', {
                                params: { 
                                    day_of_week: updatedDay.day_of_week, 
                                    start_time: updatedDay.start_time, 
                                    end_time: updatedDay.end_time 
                                }
                            });
                            updatedDay.isPracticeSlotAvailable = response.data.is_available;
                        } catch (error) {
                            console.error("Availability check failed on edit load:", error);
                            updatedDay.isPracticeSlotAvailable = false;
                        }
                    }
                }
                return updatedDay;
            });
            const finalSchedule = await Promise.all(validationPromises);
            setSchedule(finalSchedule);
        };
        
        setSchedule(populatedSchedule);
        runValidation(populatedSchedule);
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
                start_time: `${start_time}:00`,
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

    const getEndTimeOptions = (dayId, startTime) => {
        if (!startTime) return [];
        const allBusySlotsForDay = [
            ...(otherTeacherBusySlots[dayId] || []),
            ...(groupDbSchedule.teacher_busy_slots[dayId] || []),
            ...(groupDbSchedule.group_busy_slots[dayId] || [])
        ];
        const startIndex = timeSlots.indexOf(startTime);
        const potentialEndTimes = timeSlots.slice(startIndex + 1);
        const validEndTimes = [];
        for (const endTime of potentialEndTimes) {
            if (isTimeOverlapping(startTime, endTime, allBusySlotsForDay)) {
                break;
            }
            validEndTimes.push(endTime);
        }
        return validEndTimes;
    };

    const isSlotDisabled = (dayId, time) => {
        const endTime = new Date(new Date(`1970-01-01T${time}`).getTime() + 30 * 60000).toTimeString().substring(0, 5);
        const allBusySlotsForDay = [
            ...(otherTeacherBusySlots[dayId] || []),
            ...(groupDbSchedule.teacher_busy_slots[dayId] || []),
            ...(groupDbSchedule.group_busy_slots[dayId] || [])
        ];
        return isTimeOverlapping(time, endTime, allBusySlotsForDay);
    };
    
    const isAddGroupDisabled = useMemo(() => {
        const hasValidScheduleEntry = schedule.some(day => day.start_time && day.end_time);
        return !currentGroupName.trim() || !hasValidScheduleEntry;
    }, [currentGroupName, schedule]);

    const isAddSubjectDisabled = useMemo(() => {
        return !subjectName.trim() || groupsForSubject.length === 0;
    }, [subjectName, groupsForSubject]);

    const isGroupSchedulerDisabled = useMemo(() => {
        return !subjectName.trim();
    }, [subjectName]);
    
    const isGroupNameEntered = currentGroupName.trim() !== '';

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

            <div className={`sub-card group-schedule-container ${isGroupSchedulerDisabled ? 'disabled' : ''}`}>
                <h3>{t('signup.add_group_schedule')}</h3>
                <div className="group-schedule-builder">
                    <div className="group-selector">
                        <input className="group-input" list="groups-datalist" value={currentGroupName}
                            onChange={(e) => setCurrentGroupName(e.target.value)} placeholder={t('signup.group_name_placeholder')}
                            disabled={isGroupSchedulerDisabled} />
                        <datalist id="groups-datalist">
                            {existingGroups.map(g => <option key={g.group_id} value={g.group_name} />)}
                        </datalist>
                    </div>

                    <div className="schedule-table">
                        {schedule.map(day => {
                            const start = day.start_time ? new Date(`1970-01-01T${day.start_time}`) : null;
                            const end = day.end_time ? new Date(`1970-01-01T${day.end_time}`) : null;
                            const durationMinutes = (start && end) ? (end - start) / (1000 * 60) : 0;
                            
                            const isDurationTooLong = durationMinutes > 90;
                            const isEnabled = day.start_time && day.end_time;
                            
                            const isPracticeDisabled = !isEnabled || isDurationTooLong || !day.isPracticeSlotAvailable;

                            let tooltip = '';
                            if (isEnabled) {
                                if (isDurationTooLong) {
                                    tooltip = t('signup.practice_duration_limit_tooltip');
                                } else if (!day.isPracticeSlotAvailable) {
                                    tooltip = t('signup.no_labs_available_tooltip');
                                }
                            }

                            return (
                                <div key={day.day_of_week} className="schedule-row">
                                    <div className="schedule-day-type-column">
                                        <button
                                            className={`type-toggle ${day.schedule_type === 'PRACTICE' ? 'practice-active' : ''}`}
                                            onClick={() => {
                                                const newType = day.schedule_type === 'CLASS' ? 'PRACTICE' : 'CLASS';
                                                handleScheduleChange(day.day_of_week, 'schedule_type', newType);
                                            }}
                                            disabled={isPracticeDisabled && day.schedule_type === 'CLASS'}
                                            title={tooltip}
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
                                    
                                    <select value={day.start_time} onChange={(e) => handleScheduleChange(day.day_of_week, 'start_time', e.target.value)}
                                        disabled={!isGroupNameEntered}>
                                        <option value="">--:--</option>
                                        {timeSlots.map(time => (
                                            <option key={`start-${time}`} value={time}
                                                disabled={isSlotDisabled(day.day_of_week, time)}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <select value={day.end_time} onChange={(e) => handleScheduleChange(day.day_of_week, 'end_time', e.target.value)} disabled={!day.start_time}>
                                        <option value="">--:--</option>
                                        {getEndTimeOptions(day.day_of_week, day.start_time).map(time => (
                                            <option key={`end-${time}`} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={handleAddOrUpdateGroup} className="button-secondary" disabled={isAddGroupDisabled}>
                        {editingGroupIndex !== null ? t('signup.update_group') : t('signup.add_group_button')}
                    </button>
                </div>
            </div>

            <div className="add-subject-footer">
                <button onClick={handleAddSubjectToForm} className="button-primary" disabled={isAddSubjectDisabled}>
                    {initialData ? t('signup.update_subject') : t('signup.add_button')}
                </button>
            </div>
        </div>
    );
};

export default SubjectManager;