import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './WorkspaceStats.css';

const WorkspaceStats = ({ stats }) => {
    const { t } = useTranslation();

    const totalPractices = useMemo(() => 
        stats.reduce((sum, item) => sum + item.practice_count, 0),
        [stats]
    );

    const pieSegments = useMemo(() => {
        let cumulativePercentage = 0;
        const colors = ["#831843", "#3b82f6", "#ca8a04", "#16a34a", "#db2777"];
        return stats.map((item, index) => {
            const percentage = totalPractices > 0 ? (item.practice_count / totalPractices) * 100 : 0;
            const start = cumulativePercentage;
            cumulativePercentage += percentage;
            return {
                ...item,
                percentage,
                color: colors[index % colors.length],
                startAngle: start,
                endAngle: cumulativePercentage,
            };
        });
    }, [stats, totalPractices]);

    if (totalPractices === 0) {
        return <p className="stats-empty-message">{t('workspace.stats_empty', 'No practices uploaded yet.')}</p>;
    }

    const conicGradient = pieSegments.map(seg => `${seg.color} ${seg.startAngle}% ${seg.endAngle}%`).join(', ');

    return (
        <div className="stats-scroll-wrapper">
            <div className="stats-content-container">
                <div className="pie-chart-container">
                    <div className="pie-chart" style={{ background: `conic-gradient(${conicGradient})` }}>
                    </div>
                </div>
                <div className="stats-legend">
                    {pieSegments.map(seg => (
                        <div key={seg.subject_name} className="legend-item">
                            <span className="legend-value">{seg.practice_count}</span>
                            <span className="legend-percentage">{seg.percentage.toFixed(0)}%</span>
                            <span className="legend-label">{seg.subject_name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkspaceStats;