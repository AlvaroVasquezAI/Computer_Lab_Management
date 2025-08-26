import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';

const DashboardStats = () => {
    const { t } = useTranslation();
    const [topSubjects, setTopSubjects] = useState([]);
    const [topGroups, setTopGroups] = useState([]);

    useEffect(() => {
        const subjectsPromise = apiClient.get('/dashboard/top-subjects');
        const groupsPromise = apiClient.get('/dashboard/top-groups');
        
        Promise.all([subjectsPromise, groupsPromise])
            .then(([subjectsRes, groupsRes]) => {
                setTopSubjects(subjectsRes.data);
                setTopGroups(groupsRes.data);
            })
            .catch(err => console.error("Failed to fetch stats", err));
    }, []);

    return (
        <div className="stats-container">
            <div className="stats-column">
                <h4>{t('dashboard.top_subjects_subtitle')}</h4>
                <ul>
                    {topSubjects.map(item => (
                        <li key={item.subject_name}>
                            <span>{item.subject_name}</span>
                            <span className="stat-value">{item.practice_count}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="stats-column">
                <h4>{t('dashboard.top_groups_subtitle')}</h4>
                 <ul>
                    {topGroups.map(item => (
                        <li key={item.group_name}>
                            <span>{item.group_name}</span>
                            <span className="stat-value">{item.completed_sessions}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DashboardStats;