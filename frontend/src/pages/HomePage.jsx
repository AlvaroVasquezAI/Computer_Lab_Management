import React, { useState, useEffect, useCallback } from 'react'; 
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaChartBar, FaHistory, FaBullhorn, FaTrophy, FaFilePdf } from 'react-icons/fa';
import apiClient from '../services/api'; 
import DashboardCalendar from '../components/specific/DashboardCalendar';
import ActivityLog from '../components/specific/ActivityLog';
import AnnouncementsCard from '../components/specific/AnnouncementsCard';
import TopSubjectsCard from '../components/specific/TopSubjectsCard';
import TopGroupsCard from '../components/specific/TopGroupsCard';
import PositionCard from '../components/specific/PositionCard';
import PdfPreview from '../components/specific/PdfPreview';
import CountdownTimer from '../components/specific/CountdownTimer';
import './HomePage.css';

const HomePage = () => {
    const { t } = useTranslation();

    const [refreshKey, setRefreshKey] = useState(0);
    const [positionStats, setPositionStats] = useState(null);
    const [loadingPosition, setLoadingPosition] = useState(true);
    const loading = loadingPosition; 

    const handleRefresh = () => {
        setRefreshKey(prevKey => prevKey + 1); 
    };

    useEffect(() => {
        setLoadingPosition(true);
        apiClient.get('/dashboard/position-stats')
            .then(res => {
                setPositionStats(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch position stats", err);
            })
            .finally(() => {
                setLoadingPosition(false);
            });
    }, []);

    return (
        <div className="homepage-container">
            <h1>{t('dashboard.title')}</h1>
            <div className="dashboard-grid quadrant-layout">

                {/* --- QUADRANT 1 (Top-Left) --- */}
                <div className="quadrant quadrant-one">
                    <div className="dashboard-card activity-card">
                         <div className="card-header">
                            <FaHistory />
                            <h2>{t('dashboard.activity_log_title')}</h2>
                        </div>
                        <ActivityLog />
                    </div>
                    <div className="dashboard-card calendar-card">
                        <div className="card-header">
                            <FaCalendarAlt />
                            <h2>{t('dashboard.calendar_title')}</h2>
                        </div>
                        <DashboardCalendar />
                        <Link to="/workspace/visualize-activities" className="details-button">
                            {t('dashboard.see_details_button')}
                        </Link>
                    </div>
                </div>

                {/* --- QUADRANT 2 (Top-Right) --- */}
                <div className="quadrant quadrant-two">
                    <div className="dashboard-card countdown-card">
                        <div className="card-header">
                            <FaClock />
                            <h2>{t('dashboard.next_practice_title')}</h2>
                        </div>
                        <CountdownTimer key={refreshKey} onTimerEnd={handleRefresh} />
                    </div>
                    <div className="stats-row">
                        <div className="dashboard-card stats-card">
                            <TopSubjectsCard />
                        </div>
                        <div className="dashboard-card stats-card">
                            <TopGroupsCard />
                        </div>
                    </div>
                </div>

                {/* --- QUADRANT 3 (Bottom-Left) --- */}
                <div className="quadrant quadrant-three">
                    <div className="dashboard-card announcements-card">
                        <div className="card-header">
                            <FaBullhorn />
                            <h2>{t('dashboard.announcements_title')}</h2>
                        </div>
                        <AnnouncementsCard />
                        <Link to="/announcements" className="details-button announcements-button">
                            {t('dashboard.see_all_announcements')}
                        </Link>
                    </div>
                </div>

                {/* --- QUADRANT 4 (Bottom-Right) --- */}
                <div className="quadrant quadrant-four">
                    <div className="dashboard-card position-card">
                        <div className="card-header">
                            <FaTrophy />
                            <h2>{t('dashboard.position_title')}</h2>
                        </div>
                        <PositionCard stats={positionStats} loading={loading} />
                    </div>
                    <div className="dashboard-card pdf-card">
                        <div className="card-header">
                            <FaFilePdf />
                            <h2>{t('dashboard.pdf_preview_title')}</h2>
                        </div>
                        <PdfPreview file="/InstituteCalendar.pdf" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HomePage;