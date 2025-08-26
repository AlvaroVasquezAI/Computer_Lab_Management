import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import DatePicker from 'react-datepicker';
import { getMonth, getYear } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

const DashboardCalendar = () => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date()); 
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        const fetchActivities = async () => {
            const year = getYear(currentDate);
            const month = getMonth(currentDate) + 1;
            try {
                const response = await apiClient.get(`/activities/calendar?year=${year}&month=${month}`);
                setMonthlyData(response.data);
            } catch (err) {
                console.error("Failed to fetch calendar activities", err);
            }
        };
        fetchActivities();
    }, [currentDate]);

    const busyDays = useMemo(() => {
        return monthlyData.map(day => new Date(day.date + 'T00:00:00'));
    }, [monthlyData]);

    const activitiesForSelectedDay = useMemo(() => {
        const offset = selectedDate.getTimezoneOffset();
        const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
        const selectedDayString = localDate.toISOString().split('T')[0];
        const dayData = monthlyData.find(d => d.date === selectedDayString);
        return dayData ? dayData.bookings : [];
    }, [selectedDate, monthlyData]);

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="dashboard-calendar-wrapper">
            <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                onMonthChange={(date) => setCurrentDate(date)}
                highlightDates={busyDays}
                dayClassName={date => isToday(date) ? "custom-today-date" : undefined}
                formatWeekDay={nameOfDay => nameOfDay.substring(0, 2)}
                inline
            />
            <div className="calendar-info-box">
                <h4>{t('dashboard.activities_for_date')} {selectedDate.toLocaleDateString()}</h4>
                <div className="info-box-content">
                    {activitiesForSelectedDay.length > 0 ? (
                        activitiesForSelectedDay.map((booking, index) => (
                            <div key={index} className="info-box-item">
                                <span><strong>{booking.group_name}</strong> {t('dashboard.calendar_session_in')} {booking.room_name}</span>
                                <span>{booking.start_time.substring(0,5)} - {booking.end_time.substring(0,5)}</span>
                            </div>
                        ))
                    ) : (
                        <p className="no-activities-message">{t('dashboard.no_activities_today')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardCalendar;