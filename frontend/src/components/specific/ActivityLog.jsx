import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { FaPlusCircle, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';

const LogIcon = ({ type }) => {
    if (type === 'CREATED') return <FaPlusCircle className="log-icon created" />;
    if (type === 'EDITED') return <FaPencilAlt className="log-icon edited" />;
    if (type === 'DELETED') return <FaTrashAlt className="log-icon deleted" />;
    return null;
};

const ActivityLog = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        apiClient.get('/dashboard/activity-log')
            .then(res => setLogs(res.data))
            .catch(err => console.error("Failed to fetch activity log", err));
    }, []);

    const logMessages = {
        CREATED: t('dashboard.log_created'),
        EDITED: t('dashboard.log_edited'),
        DELETED: t('dashboard.log_deleted'),
    };

    return (
        <ul className="activity-log-list">
            {logs.map(log => (
                <li key={log.log_id} className="log-item">
                    <LogIcon type={log.activity_type} />
                    <div className="log-text">
                        <p className="log-action-text">
                            {logMessages[log.activity_type]}
                        </p>
                        <p className="log-practice-title">
                            {log.practice_title}
                        </p>
                        <span className="log-timestamp">
                            {new Date(log.timestamp).toLocaleString()}
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ActivityLog;