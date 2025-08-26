import React from 'react';
import { useTranslation } from 'react-i18next';

const PieChart = ({ percentage, label, color }) => {
    const circumference = 2 * Math.PI * 45; 
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="pie-chart-stat">
            <div className="pie-chart-container">
                <svg viewBox="0 0 100 100" className="pie-chart">
                    <circle className="pie-background" cx="50" cy="50" r="45"></circle>
                    <circle
                        className="pie-progress"
                        cx="50" cy="50" r="45"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ stroke: color }} 
                    ></circle>
                </svg>
                <div className="pie-text">{percentage}%</div>
            </div>
            <small>{label}</small>
        </div>
    );
};

const NumberStat = ({ number, label }) => {
    return (
        <div className="number-stat">
            <span className="number-stat-value">{number}</span>
            <small>{label}</small>
        </div>
    );
};


const PositionCard = ({ stats, loading }) => {
    const { t } = useTranslation();

    if (loading) return <p>Loading stats...</p>;
    if (!stats) return <p>Could not load position data.</p>;

    const overallPercentage = stats.total_completed_sessions > 0
        ? Math.round((stats.my_completed_sessions / stats.total_completed_sessions) * 100)
        : 0;
    
    const weeklyPercentage = stats.total_weekly_sessions > 0
        ? Math.round((stats.my_weekly_sessions / stats.total_weekly_sessions) * 100)
        : 0;

    const monthlyPercentage = stats.total_monthly_sessions > 0
        ? Math.round((stats.my_monthly_sessions / stats.total_monthly_sessions) * 100)
        : 0;

    return (
        <div className="position-container">
            <div className="position-charts-grid">
                <PieChart percentage={monthlyPercentage} label={t('dashboard.chart_label_month')} color="#3b82f6" />
                <PieChart percentage={weeklyPercentage} label={t('dashboard.chart_label_week')} color="#ca8a04" />
                <PieChart percentage={overallPercentage} label={t('dashboard.chart_label_overall')} color="var(--background-card-main)" />
                <NumberStat number={stats.my_completed_sessions} label={t('dashboard.chart_label_number')} />
            </div>
            <div className="position-text">
                <p>{t('dashboard.position_subtitle', { percent: overallPercentage })}</p>
                <h4>{t('dashboard.position_rank', { rank: stats.rank })}</h4>
            </div>
        </div>
    );
};

export default PositionCard;