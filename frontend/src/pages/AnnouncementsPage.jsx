import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import AnnouncementItem from '../components/specific/AnnouncementItem';
import './AnnouncementsPage.css';

const AnnouncementsPage = () => {
    const { t } = useTranslation();
    const [announcements, setAnnouncements] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [timeFilter, setTimeFilter] = useState('all');
    const [teacherFilter, setTeacherFilter] = useState('');

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (timeFilter) params.append('time_filter', timeFilter);
            if (teacherFilter) params.append('teacher_id', teacherFilter);

            const response = await apiClient.get(`/announcements/?${params.toString()}`);
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    }, [timeFilter, teacherFilter]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    useEffect(() => {
        apiClient.get('/data/teachers')
            .then(res => setTeachers(res.data))
            .catch(err => console.error("Failed to fetch teachers", err));
    }, []);

    const handleUpdate = (updatedAnnouncement) => {
        setAnnouncements(prev => 
            prev.map(ann => ann.announcement_id === updatedAnnouncement.announcement_id ? updatedAnnouncement : ann)
        );
    };

    const handleDelete = (deletedId) => {
        setAnnouncements(prev => prev.filter(ann => ann.announcement_id !== deletedId));
    };

    return (
        <div className="announcements-page-container">
            <h1>{t('sidebar.announcements')}</h1>

            <div className="filters-container">
                <div className="filter-group">
                    <label htmlFor="time-filter">{t('announcements_page.filter_by_time')}</label>
                    <select id="time-filter" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                        <option value="all">{t('announcements_page.all')}</option>
                        <option value="month">{t('announcements_page.this_month')}</option>
                        <option value="day">{t('announcements_page.today')}</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label htmlFor="teacher-filter">{t('announcements_page.filter_by_teacher')}</label>
                    <select id="teacher-filter" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                        <option value="">{t('announcements_page.all_teachers')}</option>
                        {teachers.map(teacher => (
                            <option key={teacher.teacher_id} value={teacher.teacher_id}>{teacher.teacher_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="announcements-list-container">
                {loading ? (
                    <p>Loading...</p>
                ) : announcements.length > 0 ? (
                    announcements.map(ann => (
                        <AnnouncementItem 
                            key={ann.announcement_id} 
                            announcement={ann}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <p className="no-announcements-message">{t('announcements_page.no_announcements')}</p>
                )}
            </div>
        </div>
    );
};

export default AnnouncementsPage;