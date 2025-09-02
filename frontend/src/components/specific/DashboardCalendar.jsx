import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import DatePicker from 'react-datepicker';
import { getMonth, getYear } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { FaRegCalendarCheck, FaClipboardList, FaClock } from 'react-icons/fa';

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
                    {activitiesForSelectedDay.length === 1 ? (
                        <div className="single-activity-details">
                            <p className="single-activity-main">
                                <strong>{activitiesForSelectedDay[0].group_name}</strong> {t('dashboard.calendar_session_in')} <strong>{activitiesForSelectedDay[0].room_name}</strong>
                            </p>
                            <p className="single-activity-time">
                                <FaClock />
                                {activitiesForSelectedDay[0].start_time.substring(0,5)} - {activitiesForSelectedDay[0].end_time.substring(0,5)}
                            </p>
                        </div>

                    ) : activitiesForSelectedDay.length > 1 ? (
                        <div className="calendar-info-message">
                            <FaClipboardList className="info-icon" />
                            <p>
                                {t('dashboard.multiple_activities_today', { count: activitiesForSelectedDay.length })}
                            </p>
                        </div>
                    ) : (
                        <div className="calendar-info-message">
                            <FaRegCalendarCheck className="info-icon" />
                            <p>{t('dashboard.no_activities_today')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardCalendar;