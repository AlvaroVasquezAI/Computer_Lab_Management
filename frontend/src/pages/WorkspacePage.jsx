import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import SubjectDetailModal from '../components/specific/SubjectDetailModal';
import GroupDetailModal from '../components/specific/GroupDetailModal';
import './WorkspacePage.css';

const WorkspacePage = () => {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setLoading(true);
        const subjectsPromise = apiClient.get('/workspace/subjects');
        const groupsPromise = apiClient.get('/workspace/groups');
        const statsPromise = apiClient.get('/workspace/stats/practices-per-subject');

        const [subjectsRes, groupsRes, statsRes] = await Promise.all([
          subjectsPromise,
          groupsPromise,
          statsPromise,
        ]);

        setSubjects(subjectsRes.data);
        setGroups(groupsRes.data);
        setStats(statsRes.data);
        setError(null);
      } catch (err) {
        setError(t('workspace.error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaceData();
  }, [t]);

  const totalPractices = stats.reduce((sum, item) => sum + item.practice_count, 0);
  
  const pieSegments = useMemo(() => {
    let cumulativePercentage = 0;
    return stats.map((item, index) => {
      const percentage = totalPractices > 0 ? (item.practice_count / totalPractices) * 100 : 0;
      const start = cumulativePercentage;
      cumulativePercentage += percentage;
      return {
        ...item,
        percentage,
        color: `hsl(${index * 60}, 70%, 70%)`,
        startAngle: start,
        endAngle: cumulativePercentage,
      };
    });
  }, [stats, totalPractices]);

  if (loading) return <div>{t('workspace.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  const conicGradient = pieSegments.map(seg => `${seg.color} ${seg.startAngle}% ${seg.endAngle}%`).join(', ');

  return (
    <>
      <div className="workspace-container">
        <h1 className="workspace-title">{t('workspace.title')}</h1>
        
        <div className="workspace-grid">
          <section className="workspace-card">
            <h2 className="section-title">{t('workspace.actions_title')}</h2>
            <div className="action-buttons">
              <Link to="/workspace/register-practice" className="action-button">{t('workspace.register_practice')}</Link>
              <Link to="/workspace/consult-practices" className="action-button">{t('workspace.consult_practices')}</Link>
              <Link to="/workspace/visualize-activities" className="action-button">{t('workspace.visualize_activities')}</Link>
            </div>
          </section>

          <section className="workspace-card">
            <h2 className="section-title">{t('workspace.subjects_title')}</h2>
            <div className="subject-list">
              {subjects.map(subject => (
                <button 
                  key={subject.subject_id} 
                  className="subject-button"
                  onClick={() => setSelectedSubjectId(subject.subject_id)}
                >
                  {subject.subject_name}
                </button>
              ))}
               {subjects.length === 0 && <p>{t('workspace.subjects_empty')}</p>}
            </div>
          </section>

          <section className="workspace-card stats-card">
            <h2 className="section-title">{t('workspace.statistics_title')}</h2>
            <p className="stats-subtitle">{t('workspace.stats_subtitle')}</p>
            
            {totalPractices > 0 ? (
                <div className="stats-content">
                    <div className="pie-chart-container">
                        <div className="pie-chart" style={{ background: `conic-gradient(${conicGradient})` }}>
                            <div className="pie-chart-center">
                                <span>{totalPractices}</span>
                                Total
                            </div>
                        </div>
                    </div>
                    <div className="stats-legend">
                        {pieSegments.map(seg => (
                            <div key={seg.subject_name} className="legend-item">
                                <span className="legend-color-dot" style={{ backgroundColor: seg.color }}></span>
                                <span className="legend-label">{seg.subject_name}</span>
                                <span className="legend-value">{seg.practice_count} ({seg.percentage.toFixed(0)}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p>{t('workspace.stats_empty')}</p>
            )}
          </section>

          <section className="workspace-card">
            <h2 className="section-title">{t('workspace.groups_title')}</h2>
            <div className="group-tags">
              {groups.map(group => (
                <button 
                  key={group.group_id} 
                  className="group-tag"
                  onClick={() => setSelectedGroupId(group.group_id)}
                >
                  {group.group_name}
                </button>
              ))}
              {groups.length === 0 && <p>{t('workspace.groups_empty')}</p>}
            </div>
          </section>
        </div>
      </div>

      {selectedSubjectId && (
        <SubjectDetailModal 
          subjectId={selectedSubjectId} 
          onClose={() => setSelectedSubjectId(null)} 
        />
      )}
      {selectedGroupId && (
        <GroupDetailModal 
          groupId={selectedGroupId} 
          onClose={() => setSelectedGroupId(null)} 
        />
      )}
    </>
  );
};

export default WorkspacePage;