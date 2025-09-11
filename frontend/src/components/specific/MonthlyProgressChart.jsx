import React from 'react';
import './MonthlyProgressChart.css';

const MonthlyProgressChart = ({ subject, completed, total, onClick }) => { 
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <button className="progress-chart-card" onClick={onClick}> 
            <div className="chart-container">
                <svg viewBox="0 0 100 100" className="donut-chart">
                    <circle className="donut-background" cx="50" cy="50" r="45"></circle>
                    <circle
                        className="donut-progress"
                        cx="50" cy="50" r="45"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    ></circle>
                </svg>
                <div className="chart-text">
                    <span className="chart-percentage">{percentage}%</span>
                    <span className="chart-ratio">{completed}/{total}</span>
                </div>
            </div>
            <h4 className="chart-subject-name">{subject}</h4>
        </button> 
    );
};

export default MonthlyProgressChart;