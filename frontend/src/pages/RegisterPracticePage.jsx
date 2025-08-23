import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import './RegisterPracticePage.css';
import { FaCalendarAlt, FaUpload } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PracticeSummaryModal from '../components/specific/PracticeSummaryModal';

const GroupScheduler = ({ group, onGroupDataChange, allRooms, existingBookings }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [scheduleForDate, setScheduleForDate] = useState(null);

  const checkAvailability = useCallback(async (date, schedule) => {
    if (!date || !schedule) return;
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await apiClient.post('/practices/availability', {
        practice_date: formattedDate,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      });
      setAvailableRooms(response.data);
    } catch (error) {
      console.error('Failed to check room availability', error);
      setAvailableRooms([]);
    }
  }, []);

  const highlightDates = useMemo(() => {
    const dates = [];
    const scheduledDaysOfWeek = group.schedules.map(s => s.day_of_week);
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      if (scheduledDaysOfWeek.includes(date.getDay())) {
        dates.push(date);
      }
    }
    return dates;
  }, [group.schedules]);
  
  const excludedDates = useMemo(() => {
    return existingBookings
      .filter(booking => booking.group_id === group.group_id)
      .map(booking => {
          const [year, month, day] = booking.date.split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day));
      });
  }, [existingBookings, group.group_id]);


  const handleDateChange = (date) => {
    setSelectedDate(date);
    const dayOfWeek = date.getDay();
    const schedule = group.schedules.find(s => s.day_of_week === dayOfWeek);
    setScheduleForDate(schedule);
    setSelectedRoomId('');
    setAvailableRooms([]);
    checkAvailability(date, schedule);
  };
  
  const handleRoomChange = (e) => {
    setSelectedRoomId(e.target.value);
  };

  useEffect(() => {
    if (selectedDate && scheduleForDate && selectedRoomId) {
      const selectedRoom = allRooms.find(r => r.room_id === parseInt(selectedRoomId));
      onGroupDataChange(group.group_id, {
        group_id: group.group_id,
        groupName: group.group_name,
        date: selectedDate.toISOString().split('T')[0],
        start_time: scheduleForDate.start_time,
        end_time: scheduleForDate.end_time,
        room_id: parseInt(selectedRoomId),
        roomName: selectedRoom ? selectedRoom.room_name : 'Unknown Room'
      });
    } else {
      onGroupDataChange(group.group_id, null);
    }
  }, [selectedDate, scheduleForDate, selectedRoomId, group.group_id, group.group_name, onGroupDataChange, allRooms]);

  const today = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14);

  return (
    <div className="group-card">
      <h4 className="group-name">{group.group_name}</h4>
      <div className="date-picker-wrapper">
        <label>{t('register_practice.date')}</label>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          highlightDates={highlightDates}
          excludeDates={excludedDates}
          minDate={today}
          maxDate={twoWeeksFromNow}
          placeholderText="mm/dd/yyyy"
          dateFormat="MM/dd/yyyy"
          className="custom-datepicker-input"
          filterDate={(date) => {
            const day = date.getDay();
            return group.schedules.some(s => s.day_of_week === day);
          }}
          dayClassName={date =>
            date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth()
              ? "custom-today-date"
              : undefined
          }
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
            disabled={availableRooms.length === 0}
          >
            <option value="">{t('register_practice.select_room')}</option>
            {availableRooms.map(room => (
              <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
            ))}
          </select>
          {availableRooms.length === 0 && <p className="error-text">{t('register_practice.no_rooms_available')}</p>}
        </div>
      )}
    </div>
  );
};

const RegisterPracticePage = () => {
    const { t } = useTranslation();
    const [teacherSubjects, setTeacherSubjects] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [groupsForSubject, setGroupsForSubject] = useState([]);
    const [existingBookings, setExistingBookings] = useState([]);
    
    const [practiceName, setPracticeName] = useState('');
    const [practiceObjective, setPracticeObjective] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [groupBookings, setGroupBookings] = useState({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summaryData, setSummaryData] = useState(null);

    const filePreviewUrl = useMemo(() => {
        if (selectedFile) {
            return URL.createObjectURL(selectedFile);
        }
        return null;
    }, [selectedFile]);

    useEffect(() => {
        apiClient.get('/workspace/subjects')
            .then(response => setTeacherSubjects(response.data))
            .catch(err => console.error("Failed to fetch subjects", err));
        
        apiClient.post('/practices/availability', { practice_date: '1970-01-01', start_time: '00:00', end_time: '00:01' })
            .then(res => setAllRooms(res.data))
            .catch(err => console.error("Failed to fetch rooms", err));
    }, []);

    useEffect(() => {
        if (!selectedSubjectId) {
            setGroupsForSubject([]);
            setExistingBookings([]);
            setGroupBookings({});
            return;
        }

        const fetchGroupData = async () => {
            try {
                const groupsPromise = apiClient.get(`/practices/subjects/${selectedSubjectId}/groups`);
                const bookingsPromise = apiClient.get(`/practices/subjects/${selectedSubjectId}/bookings`);
                const [groupsRes, bookingsRes] = await Promise.all([groupsPromise, bookingsPromise]);
                
                setGroupsForSubject(groupsRes.data);
                setExistingBookings(bookingsRes.data);
                setGroupBookings({});
            } catch (err) {
                console.error("Failed to fetch group data", err);
            }
        };
        fetchGroupData();
    }, [selectedSubjectId]);

    const handleGroupDataChange = useCallback((groupId, data) => {
        setGroupBookings(prev => ({ ...prev, [groupId]: data }));
    }, []);

    const isFormValid = useMemo(() => {
        const bookings = Object.values(groupBookings).filter(Boolean);
        return practiceName && 
               practiceObjective && 
               selectedSubjectId && 
               selectedFile && 
               groupsForSubject.length > 0 && 
               bookings.length === groupsForSubject.length;
    }, [practiceName, practiceObjective, selectedSubjectId, selectedFile, groupBookings, groupsForSubject.length]);
    
    const resetForm = () => {
        setSelectedSubjectId('');
        setGroupsForSubject([]);
        setExistingBookings([]);
        setPracticeName('');
        setPracticeObjective('');
        setSelectedFile(null);
        setGroupBookings({});
        setError('');
        setSummaryData(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) {
            alert("Please fill in all fields and schedule all displayed groups.");
            return;
        }
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('name', practiceName);
        formData.append('objective', practiceObjective);
        formData.append('subject_id', selectedSubjectId);
        formData.append('file', selectedFile);
        
        const validBookings = Object.values(groupBookings).filter(Boolean);
        formData.append('bookings_data', JSON.stringify(validBookings));

        try {
            await apiClient.post('/practices/practices', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const subjectName = teacherSubjects.find(s => s.subject_id === parseInt(selectedSubjectId))?.subject_name;
            setSummaryData({
                practiceName,
                practiceObjective,
                subjectName,
                fileName: selectedFile.name,
                bookings: validBookings,
            });
        } catch (err) {
            const errorMsg = err.response?.data?.detail || t('register_practice.error_message');
            setError(errorMsg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="register-practice-container">
                <h1 className="page-title">{t('register_practice.title')}</h1>
                <form onSubmit={handleSubmit} className="practice-form">
                    <div className="form-top-section">
                        <div className="form-details">
                            <div className="form-field">
                                <label htmlFor="subject">{t('register_practice.subject')}:</label>
                                <select id="subject" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} required>
                                    <option value="">{t('register_practice.select_subject_placeholder')}</option>
                                    {teacherSubjects.map(sub => <option key={sub.subject_id} value={sub.subject_id}>{sub.subject_name}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="name">{t('register_practice.name')}:</label>
                                <input type="text" id="name" value={practiceName} onChange={e => setPracticeName(e.target.value)} placeholder={t('register_practice.name_placeholder')} required />
                            </div>
                            <div className="form-field">
                                <label htmlFor="objective">{t('register_practice.objective')}:</label>
                                <input type="text" id="objective" value={practiceObjective} onChange={e => setPracticeObjective(e.target.value)} placeholder={t('register_practice.objective_placeholder')} required />
                            </div>
                        </div>
                        <div className="form-upload">
                            <label htmlFor="file-upload" className="file-upload-label">
                                {filePreviewUrl ? (
                                    <embed 
                                        src={filePreviewUrl} 
                                        type="application/pdf"
                                        className="pdf-preview-embed"
                                    />
                                ) : (
                                    <>
                                        <FaUpload />
                                        <span>{t('register_practice.upload_file')}</span>
                                    </>
                                )}
                            </label>
                            <input id="file-upload" type="file" onChange={e => setSelectedFile(e.target.files[0])} accept=".pdf" required />
                            <p className="file-name">{selectedFile ? `${t('register_practice.file_selected')} ${selectedFile.name}` : t('register_practice.no_file_selected')}</p>
                        </div>
                    </div>

                    <div className="form-groups-section">
                        <h3 className="groups-title">{t('register_practice.groups_title')}</h3>
                        <div className="groups-grid">
                            {groupsForSubject.length > 0 ? (
                                groupsForSubject.map(group => (
                                    <GroupScheduler 
                                        key={group.group_id} 
                                        group={group} 
                                        onGroupDataChange={handleGroupDataChange} 
                                        allRooms={allRooms}
                                        existingBookings={existingBookings}
                                    />
                                ))
                            ) : (
                                selectedSubjectId && <p>{t('register_practice.no_groups_for_subject')}</p>
                            )}
                        </div>
                    </div>
                    
                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="submit-button" disabled={loading || !isFormValid}>
                        {loading ? t('register_practice.registering_button') : t('register_practice.register_button')}
                    </button>
                </form>
            </div>
            {summaryData && <PracticeSummaryModal summary={summaryData} onClose={resetForm} />}
        </>
    );
};
export default RegisterPracticePage;