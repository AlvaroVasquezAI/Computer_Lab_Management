import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';

const TopSubjectsCard = () => {
    const { t } = useTranslation();
    const [topSubjects, setTopSubjects] = useState([]);

    useEffect(() => {
        apiClient.get('/dashboard/top-subjects')
            .then(res => setTopSubjects(res.data))
            .catch(err => console.error("Failed to fetch top subjects", err));
    }, []);

    return (
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
    );
};

export default TopSubjectsCard;