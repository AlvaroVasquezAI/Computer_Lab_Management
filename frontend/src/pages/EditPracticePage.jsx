import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import './RegisterPracticePage.css';
import { FaCalendarAlt, FaUpload, FaFilePdf, FaArrowLeft} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const GroupScheduler = ({ group, onGroupDataChange, allRooms, existingBookings, initialBooking }) => {
    const { t } = useTranslation();
    
    const initialDate = useMemo(() => 
        initialBooking ? new Date(initialBooking.practice_date + 'T00:00:00') : null,
        [initialBooking]
    );
    
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(initialBooking ? initialBooking.room_id : '');
    const [scheduleForDate, setScheduleForDate] = useState(null);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    const checkAvailability = useCallback(async (date, schedule) => {
        if (!date || !schedule) return;
        setIsLoadingRooms(true);
        try {
            const formattedDate = date.toISOString().split('T')[0];
            const response = await apiClient.post('/practices/availability', {
                practice_date: formattedDate,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
            });
            let finalRooms = response.data;
            if (initialBooking && date?.getTime() === initialDate?.getTime()) {
                const isInitialRoomAvailable = response.data.some(room => room.room_id === initialBooking.room_id);
                if (!isInitialRoomAvailable) {
                    const initialRoom = allRooms.find(r => r.room_id === initialBooking.room_id);
                    if (initialRoom) finalRooms = [initialRoom, ...response.data];
                }
            }
            setAvailableRooms(finalRooms);
        } catch (error) {
            console.error('Failed to check room availability', error);
            setAvailableRooms([]);
        } finally {
            setIsLoadingRooms(false);
        }
    }, [initialBooking, allRooms]);

    useEffect(() => {
        if (initialDate) {
            const dayOfWeek = initialDate.getDay(); 
            const schedule = group.schedules.find(s => s.day_of_week === dayOfWeek);
            setScheduleForDate(schedule);
            if (schedule) {
                checkAvailability(initialDate, schedule);
            }
        }
    }, [initialDate, group.schedules, checkAvailability]);

    useEffect(() => {
        if (initialBooking && availableRooms.length > 0) {
            const initialRoomExists = availableRooms.some(r => r.room_id === initialBooking.room_id);
            if (initialRoomExists) {
                setSelectedRoomId(initialBooking.room_id);
            }
        }
    }, [availableRooms, initialBooking]);

    const highlightDates = useMemo(() => {
        const dates = [];
        const scheduledDaysOfWeek = group.schedules.map(s => s.day_of_week);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        for (let i = 0; i < 15; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i); 

            if (scheduledDaysOfWeek.includes(futureDate.getDay())) { 
                dates.push(futureDate);
            }
        }
        return dates;
    }, [group.schedules]);


    const excludedDates = useMemo(() => {
        return existingBookings
            .filter(booking => booking.group_id === group.group_id && (!initialBooking || booking.date !== initialBooking.practice_date))
            .map(booking => {
                return new Date(booking.date + 'T00:00:00');
            });
    }, [existingBookings, group.group_id, initialBooking]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        const dayOfWeek = date.getDay(); 
        const schedule = group.schedules.find(s => s.day_of_week === dayOfWeek);
        setScheduleForDate(schedule);
        setSelectedRoomId('');
        setAvailableRooms([]);
        if (date && schedule) checkAvailability(date, schedule);
    };
  
    const handleRoomChange = (e) => setSelectedRoomId(e.target.value);

    useEffect(() => {
        if (selectedDate && scheduleForDate && selectedRoomId) {
            const selectedRoom = allRooms.find(r => r.room_id === parseInt(selectedRoomId));
            onGroupDataChange(group.group_id, { group_id: group.group_id, groupName: group.group_name, practice_date: selectedDate.toISOString().split('T')[0], start_time: scheduleForDate.start_time, end_time: scheduleForDate.end_time, room_id: parseInt(selectedRoomId), roomName: selectedRoom ? selectedRoom.room_name : 'Unknown Room' });
        } else {
            onGroupDataChange(group.group_id, null);
        }
    }, [selectedDate, scheduleForDate, selectedRoomId, group.group_id, group.group_name, onGroupDataChange, allRooms]);

    useEffect(() => {
        if (initialBooking && availableRooms.length > 0) {
            const initialRoomExists = availableRooms.some(r => r.room_id === initialBooking.room_id);
            if (initialRoomExists) {
                setSelectedRoomId(initialBooking.room_id);
            }
        }
    }, [availableRooms, initialBooking]);
    
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const isPast = initialBooking && new Date(initialBooking.practice_date + 'T' + initialBooking.end_time) < new Date();

    if (isPast) {
        return (
            <div className="group-card is-disabled">
                <h4 className="group-name">{group.group_name}</h4>
                <p>{initialDate.toLocaleDateString()}</p>
                <p>{initialBooking.start_time.substring(0,5)} - {initialBooking.end_time.substring(0,5)}</p>
                <p className="session-passed-text">{t('edit_practice.session_passed')}</p>
            </div>
        );
    }

    return (
        <div className="group-card">
            <h4 className="group-name">{group.group_name}</h4>
            <div className="date-picker-wrapper">
                <label>{t('register_practice.date')}</label>
                <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    excludeDates={excludedDates}
                    minDate={today}
                    maxDate={twoWeeksFromNow}
                    placeholderText="mm/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                    className="custom-datepicker-input"
                    filterDate={(date) => {
                        const day = date.getDay();
                        return group.schedules.some(s => s.day_of_week === day && s.schedule_type === 'PRACTICE');
                    }}
                    dayClassName={date => {
                        const classNames = [];
                        const today = new Date();
                        
                        if (date.toDateString() === today.toDateString()) {
                            classNames.push("custom-today-date");
                        }
                        
                        const isPracticeDayOfWeek = group.schedules.some(
                            s => s.day_of_week === date.getDay() && s.schedule_type === 'PRACTICE'
                        );

                        const isExcluded = excludedDates.some(
                            excludedDate => excludedDate.toDateString() === date.toDateString()
                        );

                        if (isPracticeDayOfWeek && !isExcluded) {
                            classNames.push('react-datepicker__day--highlighted');
                        }

                        return classNames.join(' ');
                    }}
                />
                {scheduleForDate && (
                    <div className="schedule-time-display">
                        {scheduleForDate.start_time.substring(0, 5)} - {scheduleForDate.end_time.substring(0, 5)}
                    </div>
                )}
            </div>
      
            {selectedDate && !scheduleForDate && (
                <p className="error-text">No class scheduled for this group on the selected day.</p>
            )}

            {selectedDate && scheduleForDate && (
                <div className="room-selector-wrapper">
                    <label htmlFor={`room-${group.group_id}`}>{t('register_practice.room_lab')}</label>
                    <select 
                        id={`room-${group.group_id}`} 
                        value={selectedRoomId} 
                        onChange={handleRoomChange}
                        disabled={!selectedDate || isLoadingRooms}
                    >
                        <option value="">{isLoadingRooms ? 'Loading...' : t('register_practice.select_room')}</option>
                        {availableRooms.map(room => (
                            <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
                        ))}
                    </select>
                    {selectedDate && !isLoadingRooms && availableRooms.length === 0 && <p className="error-text">{t('register_practice.no_rooms_available')}</p>}
                </div>
            )}
        </div>
    );
};

const EditPracticePage = ({ isAdminMode = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { practiceId } = useParams();

    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [practiceName, setPracticeName] = useState('');
    const [practiceObjective, setPracticeObjective] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [subjectName, setSubjectName] = useState('');
    const [groupsForSubject, setGroupsForSubject] = useState([]);
    const [existingBookings, setExistingBookings] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [initialBookings, setInitialBookings] = useState([]);
    const [groupBookings, setGroupBookings] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [ownerTeacherId, setOwnerTeacherId] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const practiceDetailsUrl = isAdminMode
                    ? `/admin/practices/${practiceId}`
                    : `/practices/practices/${practiceId}`;
                
                const practiceRes = await apiClient.get(practiceDetailsUrl);
                const practiceData = practiceRes.data;
                
                setPracticeName(practiceData.title);
                setPracticeObjective(practiceData.description);
                setSelectedSubjectId(practiceData.subject_id);
                setSubjectName(practiceData.subject_name);
                setInitialBookings(practiceData.bookings);
                
                const ownerId = practiceData.teacher_id;
                setOwnerTeacherId(ownerId);
                const subjectId = practiceData.subject_id;

                const groupsUrl = isAdminMode
                    ? `/admin/teachers/${ownerId}/subjects/${subjectId}/groups`
                    : `/practices/subjects/${subjectId}/groups`;
                
                const fileDownloadUrl = isAdminMode
                    ? `/admin/practices/${practiceId}/download`
                    : `/practices/practices/${practiceId}/download`;
                
                const groupsPromise = apiClient.get(groupsUrl);
                const existingBookingsPromise = apiClient.get(`/practices/subjects/${subjectId}/bookings`);
                const roomsPromise = apiClient.post('/practices/availability', { practice_date: '1970-01-01', start_time: '00:00', end_time: '00:01' });
                const filePromise = apiClient.get(`${fileDownloadUrl}?v=${new Date().getTime()}`, { responseType: 'blob' });

                const [groupsRes, bookingsRes, roomsRes, fileResponse] = await Promise.all([groupsPromise, existingBookingsPromise, roomsPromise, filePromise]);

                setGroupsForSubject(groupsRes.data);
                setExistingBookings(bookingsRes.data);
                setAllRooms(roomsRes.data);
                setFilePreviewUrl(URL.createObjectURL(new Blob([fileResponse.data], { type: 'application/pdf' })));
                
                const initialBookingsMap = {};
                practiceData.bookings.forEach(b => {
                    const group = groupsRes.data.find(g => g.group_name === b.group_name);
                    if (group) {
                        initialBookingsMap[group.group_id] = { ...b, group_id: group.group_id };
                    }
                });
                setGroupBookings(initialBookingsMap);

            } catch (err) {
                console.error("Failed to load edit page data", err);
                setError("Could not load practice data. It may no longer be editable.");
            } finally {
                setPageLoading(false);
            }
        };

        fetchAllData();
    }, [practiceId, isAdminMode]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
            setFilePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGroupDataChange = useCallback((groupId, data) => {
        setGroupBookings(prev => ({ ...prev, [groupId]: data }));
    }, []);
    
    const isFormValid = useMemo(() => {
        if (!practiceName || !practiceObjective || !selectedSubjectId) {
            return false;
        }
        const bookings = Object.values(groupBookings).filter(Boolean);
        return bookings.length > 0;
    }, [practiceName, practiceObjective, selectedSubjectId, groupBookings]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            alert("Please ensure all fields are filled and at least one group is scheduled.");
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        const bookingsToSend = Object.values(groupBookings).filter(Boolean).map(b => ({
            group_id: b.group_id,
            room_id: b.room_id,
            practice_date: b.practice_date,
            start_time: b.start_time,
            end_time: b.end_time,
        }));
        
        const updatePayload = {
            name: practiceName,
            objective: practiceObjective,
            subject_id: parseInt(selectedSubjectId),
            bookings: bookingsToSend 
        };
        formData.append('update_data_str', JSON.stringify(updatePayload));
        
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            const updateUrl = isAdminMode
                ? `/admin/practices/${practiceId}`
                : `/practices/practices/${practiceId}`;
            
            await apiClient.put(updateUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(t('edit_practice.success_message'));
            const returnPath = isAdminMode ? `/admin/teacher/${ownerTeacherId}` : '/workspace/consult-practices';
            setTimeout(() => navigate(returnPath), 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || t('edit_practice.error_message');
            setError(errorMsg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

  
    if (pageLoading) return <div>{t('edit_practice.loading')}</div>;
    
    return (
        <div className="register-practice-container">
            <div className="page-header-container">
                <div className="back-button-wrapper">
                    <button onClick={() => navigate(-1)} className="back-button">
                        <FaArrowLeft /> {t('common.go_back')}
                    </button>
                </div>
                <h1 className="page-title">{t('edit_practice.title')}</h1>
            </div>
            <form onSubmit={handleSubmit} className="practice-form">
                <div className="form-top-section">
                    <div className="form-details">
                        <div className="form-field">
                            <label htmlFor="subject">{t('register_practice.subject')}:</label>
                            <select id="subject" value={selectedSubjectId} readOnly disabled>
                                <option value={selectedSubjectId}>{subjectName}</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="name">{t('register_practice.name')}:</label>
                            <input type="text" id="name" value={practiceName} onChange={e => setPracticeName(e.target.value)} required />
                        </div>
                        <div className="form-field">
                            <label htmlFor="objective">{t('register_practice.objective')}:</label>
                            <input type="text" id="objective" value={practiceObjective} onChange={e => setPracticeObjective(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-upload">
                        <label htmlFor="file-upload" className="file-upload-label">
                            {filePreviewUrl ? (
                                <embed src={filePreviewUrl} type="application/pdf" className="pdf-preview-embed"/>
                            ) : (
                                <div className="existing-file-preview">
                                    <FaFilePdf />
                                    <p>Loading Preview...</p>
                                </div>
                            )}
                        </label>
                        <input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf" />
                        <p className="file-name">{selectedFile ? selectedFile.name : "Current file"}</p>
                    </div>
                </div>
                <div className="form-groups-section">
                    <h3 className="groups-title">{t('register_practice.groups_title')}</h3>
                    <div className="groups-grid">
                        {groupsForSubject.map(group => {
                            const initialBookingForGroup = initialBookings.find(b => b.group_name === group.group_name);
                            return (
                                <GroupScheduler 
                                    key={group.group_id} 
                                    group={group} 
                                    onGroupDataChange={handleGroupDataChange} 
                                    allRooms={allRooms}
                                    existingBookings={existingBookings}
                                    initialBooking={initialBookingForGroup}
                                />
                            );
                        })}
                    </div>
                </div>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <button type="submit" className="submit-button" disabled={loading || !isFormValid}>
                    {t('edit_practice.save_changes_button')}
                </button>
            </form>
        </div>
    );
};
export default EditPracticePage;