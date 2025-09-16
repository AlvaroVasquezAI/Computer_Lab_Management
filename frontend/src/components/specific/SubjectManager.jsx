import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
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
    
    const [schedule, setSchedule] = useState([]);
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);
    
    const [groupDbSchedule, setGroupDbSchedule] = useState({ group_busy_slots: {}, teacher_busy_slots: {} });
    const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);
    const scheduleFetchTimeout = useRef(null);

    const hasExistingPractice = useMemo(() => {
        if (!groupDbSchedule || !groupDbSchedule.group_busy_slots) {
            return false;
        }
        for (const day in groupDbSchedule.group_busy_slots) {
            for (const slot of groupDbSchedule.group_busy_slots[day]) {
                if (slot.schedule_type === 'PRACTICE' && slot.subject_name === subjectName) {
                    return true; 
                }
            }
        }
        return false;
    }, [groupDbSchedule, subjectName]);

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

    const tempBusySlotsForThisSubject = useMemo(() => {
        const busySlots = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        
        groupsForSubject.forEach((group, index) => {
            if (editingGroupIndex !== null && index === editingGroupIndex) {
                return;
            }

            group.schedule.forEach(slot => {
                if (busySlots[slot.day_of_week]) {
                    busySlots[slot.day_of_week].push({
                        start_time: slot.start_time,
                        end_time: slot.end_time
                    });
                }
            });
        });
        return busySlots;
    }, [groupsForSubject, editingGroupIndex]);

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

    const addScheduleRow = () => {
        setSchedule(prev => [...prev, { day_of_week: 1, start_time: '', end_time: '', schedule_type: 'CLASS', isPracticeSlotAvailable: true }]);
    };
    
    const deleteScheduleRow = (indexToDelete) => {
        setSchedule(prev => prev.filter((_, index) => index !== indexToDelete));
    };

    const handleScheduleChange = useCallback(async (index, field, value) => {
        let newSchedule = [...schedule];
        let updatedDay = { ...newSchedule[index], [field]: value };

        if (field === 'start_time') {
            updatedDay.end_time = ''; 
        }

        if (field === 'schedule_type' && value === 'PRACTICE') {
            newSchedule = newSchedule.map((day, i) => {
                if (i === index) return { ...day, schedule_type: 'PRACTICE' }; 
                if (day.schedule_type === 'PRACTICE') return { ...day, schedule_type: 'CLASS' }; 
                return day;
            });
            updatedDay = newSchedule[index];
        }

        if (updatedDay.start_time && updatedDay.end_time) {
            const durationMinutes = (new Date(`1970-01-01T${updatedDay.end_time}`) - new Date(`1970-01-01T${updatedDay.start_time}`)) / 60000;
            if (durationMinutes > 90) {
                updatedDay.schedule_type = 'CLASS';
                updatedDay.isPracticeSlotAvailable = false;
            } else {
                try {
                    const response = await apiClient.get('/onboarding/check-practice-availability', {
                        params: { day_of_week: updatedDay.day_of_week, start_time: updatedDay.start_time, end_time: updatedDay.end_time }
                    });
                    updatedDay.isPracticeSlotAvailable = response.data.is_available;
                } catch (error) {
                    console.error("Availability check failed:", error);
                    updatedDay.isPracticeSlotAvailable = false;
                }
            }
        }
        
        newSchedule[index] = updatedDay;
        setSchedule(newSchedule);
    }, [schedule, groupsForSubject, editingGroupIndex]);

    const handleEditGroup = (indexToEdit) => {
        const groupToEdit = groupsForSubject[indexToEdit];
        setEditingGroupIndex(indexToEdit);
        setCurrentGroupName(groupToEdit.group_name);
        const populatedSchedule = groupToEdit.schedule.map(s => ({
            ...s,
            start_time: s.start_time.substring(0, 5),
            end_time: s.end_time.substring(0, 5),
            isPracticeSlotAvailable: true 
        }));
        setSchedule(populatedSchedule);
    };

    const handleAddOrUpdateGroup = () => {
        if (!currentGroupName.trim()) {
            alert("Please enter a group name.");
            return;
        }
        const validScheduleEntries = schedule.filter(day => day.start_time && day.end_time);
        if (validScheduleEntries.length === 0) {
            alert("Please add at least one valid time slot for the group.");
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
        setSchedule([]); 
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

    const getCombinedBusySlots = (dayId, currentIndex) => {
        const internalBusySlotsForDay = schedule
            .filter((slot, index) => index !== currentIndex && slot.day_of_week === dayId)
            .map(s => ({ start_time: s.start_time, end_time: s.end_time }));

        return [
            ...(otherTeacherBusySlots[dayId] || []),
            ...(groupDbSchedule.teacher_busy_slots[dayId] || []),
            ...(groupDbSchedule.group_busy_slots[dayId] || []),
            ...(tempBusySlotsForThisSubject[dayId] || []),
            ...internalBusySlotsForDay
        ];
    };

    const getEndTimeOptions = (dayId, startTime, currentIndex) => {
        if (!startTime) return [];
        const allBusySlotsForDay = getCombinedBusySlots(dayId, currentIndex);
        const startIndex = timeSlots.indexOf(startTime);
        const potentialEndTimes = timeSlots.slice(startIndex + 1);
        const validEndTimes = [];
        for (const endTime of potentialEndTimes) {
            if (isTimeOverlapping(startTime, endTime, allBusySlotsForDay)) break;
            validEndTimes.push(endTime);
        }
        return validEndTimes;
    };

    const isSlotDisabled = (dayId, time, currentIndex) => {
        const endTime = new Date(new Date(`1970-01-01T${time}`).getTime() + 30 * 60000).toTimeString().substring(0, 5);
        const allBusySlotsForDay = getCombinedBusySlots(dayId, currentIndex);
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
                        onChange={(e) => setSubjectName(e.target.value.toUpperCase())} placeholder={t('signup.subject_placeholder')} />
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
                <h3>{editingGroupIndex !== null ? t('signup.edit_group_button') : t('signup.add_group_schedule')}</h3>
                <div className="group-schedule-builder">
                    <div className="group-selector">
                        <input className="group-input" list="groups-datalist" value={currentGroupName}
                            onChange={(e) => setCurrentGroupName(e.target.value.toUpperCase())} placeholder={t('signup.group_name_placeholder')}
                            disabled={isGroupSchedulerDisabled} />
                        <datalist id="groups-datalist">
                            {existingGroups.map(g => <option key={g.group_id} value={g.group_name} />)}
                        </datalist>
                    </div>

                    <div className="schedule-table">
                        {schedule.map((slot, index) => {
                            const durationMinutes = (slot.start_time && slot.end_time) ? (new Date(`1970-01-01T${slot.end_time}`) - new Date(`1970-01-01T${slot.start_time}`)) / 60000 : 0;
                            const isDurationTooLong = durationMinutes > 90;
                            const isEnabled = slot.start_time && slot.end_time;
                            const isPracticeDisabled = !isEnabled || isDurationTooLong || !slot.isPracticeSlotAvailable || hasExistingPractice;
                            let tooltip = '';
                            if (isEnabled) {
                                if (hasExistingPractice) tooltip = t('signup.practice_already_exists_tooltip');
                                else if (isDurationTooLong) tooltip = t('signup.practice_duration_limit_tooltip');
                                else if (!slot.isPracticeSlotAvailable) tooltip = t('signup.no_labs_available_tooltip');
                            }

                            return (
                                <div key={index} className="schedule-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 2fr auto' }}>
                                    <select value={slot.day_of_week} onChange={(e) => handleScheduleChange(index, 'day_of_week', parseInt(e.target.value))}>
                                        {daysOfWeek.map(d => <option key={d.id} value={d.id}>{t(`signup.days.${d.name}`)}</option>)}
                                    </select>
                                    
                                    <select value={slot.start_time} onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)} disabled={!isGroupNameEntered}>
                                        <option value="">--:--</option>
                                        {timeSlots.map(time => (
                                            <option 
                                                key={`start-${index}-${time}`} 
                                                value={time} 
                                                disabled={isSlotDisabled(slot.day_of_week, time, index)}
                                            >
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <select value={slot.end_time} onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)} disabled={!slot.start_time}>
                                        <option value="">--:--</option>
                                        {getEndTimeOptions(slot.day_of_week, slot.start_time, index).map(time => (
                                            <option key={`end-${index}-${time}`} value={time}>{time}</option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        className={`type-toggle ${slot.schedule_type === 'PRACTICE' ? 'practice-active' : ''}`}
                                        onClick={() => handleScheduleChange(index, 'schedule_type', slot.schedule_type === 'CLASS' ? 'PRACTICE' : 'CLASS')}
                                        disabled={isPracticeDisabled && slot.schedule_type === 'CLASS'}
                                        title={tooltip}
                                    >
                                        <span className="toggle-thumb"></span>
                                        <span className="toggle-label">{slot.schedule_type === 'CLASS' ? t('signup.schedule_type.class') : t('signup.schedule_type.practice')}</span>
                                    </button>
                                    
                                    <button type="button" onClick={() => deleteScheduleRow(index)} className="action-btn-delete">
                                        <FaTrash />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    
                    <button type="button" onClick={addScheduleRow} className="button-secondary" disabled={!isGroupNameEntered} style={{marginTop: '1rem'}}>
                        <FaPlus /> {t('signup.add_time_slot', 'Add Time Slot')}
                    </button>
                    
                    <button onClick={handleAddOrUpdateGroup} className="button-secondary" disabled={isAddGroupDisabled} style={{marginTop: '1rem'}}>
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