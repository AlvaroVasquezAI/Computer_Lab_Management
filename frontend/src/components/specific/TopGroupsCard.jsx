import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';

const TopGroupsCard = () => {
    const { t } = useTranslation();
    const [topGroups, setTopGroups] = useState([]);

    useEffect(() => {
        apiClient.get('/dashboard/top-groups')
            .then(res => setTopGroups(res.data))
            .catch(err => console.error("Failed to fetch top groups", err));
    }, []);

    return (
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
    );
};

export default TopGroupsCard;