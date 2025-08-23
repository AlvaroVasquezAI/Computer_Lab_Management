import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import DatePicker from 'react-datepicker';
import { getMonth, getYear } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import './VisualizeActivitiesPage.css';

const ActivityCard = ({ booking }) => {
    const { t } = useTranslation();
    return (
        <div className="activity-card">
            <h4 className="activity-card-title">{booking.practice_title}</h4>
            <div className="activity-card-details">
                <p><strong>{t('activities.group')}:</strong> {booking.group_name}</p>
                <p><strong>{t('activities.room')}:</strong> {booking.room_name}</p>
                <p><strong>{t('activities.time')}:</strong> {booking.start_time.substring(0,5)} - {booking.end_time.substring(0,5)}</p>
            </div>
        </div>
    );
};

const VisualizeActivitiesPage = () => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            const year = getYear(currentDate);
            const month = getMonth(currentDate) + 1;
            try {
                const response = await apiClient.get(`/activities/calendar?year=${year}&month=${month}`);
                setMonthlyData(response.data);
            } catch (err) {
                console.error("Failed to fetch activities", err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [currentDate]);

    const busyDays = useMemo(() => {
        return monthlyData.map(day => {
            const [year, month, dayOfMonth] = day.date.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, dayOfMonth));
        });
    }, [monthlyData]);

    const activitiesForSelectedDay = useMemo(() => {
        const selectedDayString = selectedDate.toDateString();
        const dayData = monthlyData.find(d => {
            const [year, month, dayOfMonth] = d.date.split('-').map(Number);
            return new Date(Date.UTC(year, month - 1, dayOfMonth)).toDateString() === selectedDayString;
        });
        return dayData ? dayData.bookings : [];
    }, [selectedDate, monthlyData]);

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="visualize-activities-container">
            <h1 className="page-title">{t('activities.title')}</h1>
            <div className="activities-layout">
                <div className="calendar-container">
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        onMonthChange={(date) => setCurrentDate(date)}
                        highlightDates={busyDays}
                        dayClassName={date => isToday(date) ? "custom-today-date" : undefined}
                        formatWeekDay={nameOfDay => nameOfDay.substring(0, 2)}
                        inline
                    />
                </div>
                <div className="details-container">
                    <div className="activities-section">
                        <h2>{t('activities.for_date')} {selectedDate.toLocaleDateString()}</h2>
                        <div className="activities-list">
                            {loading ? (
                                <p>Loading...</p>
                            ) : activitiesForSelectedDay.length > 0 ? (
                                activitiesForSelectedDay.map((booking, index) => <ActivityCard key={index} booking={booking} />)
                            ) : (
                                <p>{t('activities.none_scheduled')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualizeActivitiesPage;