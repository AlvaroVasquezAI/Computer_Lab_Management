import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import DatePicker from 'react-datepicker';
import { getMonth, getYear } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import './StatusPage.css';
import BookingDetailModal from '../components/specific/BookingDetailModal';

const generateTimeSlots = (startHour, endHour, intervalMinutes) => {
    const slots = [];
    let currentTime = new Date();
    currentTime.setHours(startHour, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(endHour, 0, 0, 0);
    while (currentTime < endTime) {
      const nextTime = new Date(currentTime.getTime() + intervalMinutes * 60000);
      slots.push({
          start: currentTime.toTimeString().substring(0, 5),
          end: nextTime.toTimeString().substring(0, 5),
          isBusy: false,
          bookingDetails: null
      });
      currentTime = nextTime;
    }
    return slots;
};

const TimeSlot = ({ slot, onSlotClick }) => {
    const isBusy = slot.isBusy;
    const slotClass = `time-slot ${isBusy ? 'busy' : 'free'}`;
    const handleClick = () => {
        if (isBusy && onSlotClick) {
            onSlotClick(slot.bookingDetails);
        }
    };
    return (
        <button className={slotClass} onClick={handleClick} disabled={!isBusy}>
            <span className="time-label">{slot.start} - {slot.end}</span>
            <div className="status-bar">
                {isBusy ? slot.bookingDetails.practice.title : ''}
            </div>
        </button>
    );
};

const LabStatusCard = ({ room, onSlotClick }) => {
  const { t } = useTranslation(); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [bookings, setBookings] = useState([]);
  const [monthlyAvailability, setMonthlyAvailability] = useState({});
  const [loading, setLoading] = useState(false);

  const TOTAL_SLOTS_PER_DAY = 30;

  useEffect(() => {
    setLoading(true);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    apiClient.get(`/rooms/${room.room_id}/bookings?target_date=${dateString}`)
      .then(response => setBookings(response.data))
      .catch(error => console.error(`[${room.room_name}] Failed to fetch daily bookings`, error))
      .finally(() => setLoading(false));
  }, [room.room_id, selectedDate]);
  
  useEffect(() => {
    const year = getYear(currentDate);
    const month = getMonth(currentDate) + 1;
    apiClient.get(`/rooms/${room.room_id}/monthly-availability?year=${year}&month=${month}`)
      .then(response => setMonthlyAvailability(response.data))
      .catch(error => console.error(`[${room.room_name}] Failed to fetch monthly availability`, error));
  }, [room.room_id, getYear(currentDate), getMonth(currentDate)]);

  const highlightedDates = useMemo(() => {
    const high = [];
    const medium = [];
    const low = [];

    const year = getYear(currentDate);
    const month = getMonth(currentDate);

    for (const day in monthlyAvailability) {
        const busySlots = monthlyAvailability[day];
        const percentageBusy = (busySlots / TOTAL_SLOTS_PER_DAY) * 100;
        
        const date = new Date(year, month, parseInt(day));

        if (percentageBusy > 66) {
            high.push(date);
        } else if (percentageBusy > 33) {
            medium.push(date);
        } else if (busySlots > 0) {
            low.push(date);
        }
    }

    return [
        { "react-datepicker__day--availability-high": high },
        { "react-datepicker__day--availability-medium": medium },
        { "react-datepicker__day--availability-low": low },
    ];
  }, [monthlyAvailability, currentDate]);

  const timeline = useMemo(() => {
    const slots = generateTimeSlots(7, 22, 30);
    bookings.forEach(booking => {
        const bookingStart = booking.start_time;
        const bookingEnd = booking.end_time;
        slots.forEach(slot => {
            if (slot.start < bookingEnd && slot.end > bookingStart) {
                slot.isBusy = true;
                slot.bookingDetails = booking;
            }
        });
    });
    return slots;
  }, [bookings]);

  return (
      <div className="lab-status-card">
          <div className="lab-header">
            <h2>{room.room_name}</h2>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              onMonthChange={(date) => setCurrentDate(date)}
              highlightDates={highlightedDates}
              inline
            />
          </div>
          <div className="timeline-container">
            {loading ? <p>{t('status_page.loading_timeline')}</p> : timeline.map(slot => (
              <TimeSlot key={slot.start} slot={slot} onSlotClick={onSlotClick} />
            ))}
          </div>
      </div>
  );
};

const StatusPage = () => {
    const { t } = useTranslation();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalDetails, setModalDetails] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await apiClient.get('/data/rooms');
                setRooms(response.data);
            } catch (err) {
                setError(t('status_page.error_labs'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [t]);

    const handleSlotClick = (details) => {
        setModalDetails(details);
    };

    if (loading) return <p>{t('status_page.loading_labs')}</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <>
            <div className="status-page-container">
                <h1 className="status-page-title">{t('sidebar.status')}</h1>
                <div className="labs-grid">
                    {rooms.map(room => (
                        <LabStatusCard key={room.room_id} room={room} onSlotClick={handleSlotClick} />
                    ))}
                </div>
            </div>
            {modalDetails && (
                <BookingDetailModal
                    details={modalDetails}
                    onClose={() => setModalDetails(null)}
                />
            )}
        </>
    );
};

export default StatusPage;