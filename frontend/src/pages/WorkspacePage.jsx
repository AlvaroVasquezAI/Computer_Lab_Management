import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import SubjectDetailModal from '../components/specific/SubjectDetailModal';
import GroupDetailModal from '../components/specific/GroupDetailModal';
import WorkspaceSchedule from '../components/specific/WorkspaceSchedule';
import MonthlyProgressChart from '../components/specific/MonthlyProgressChart';
import ProgressDetailModal from '../components/specific/ProgressDetailModal';
import InfoCard from '../components/specific/InfoCard';
import { FaPlus, FaSearch, FaCalendarDay, FaCalendarAlt, FaUsers, FaBook, FaChartPie } from 'react-icons/fa';
import './WorkspacePage.css';

const WorkspacePage = () => {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedSubjectData, setSelectedSubjectData] = useState(null);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setLoading(true);

        const [subjectsRes, groupsRes, scheduleRes, statsRes] = await Promise.all([
          apiClient.get('/workspace/subjects'),
          apiClient.get('/workspace/groups'),
          apiClient.get('/workspace/schedule'),
          apiClient.get('/workspace/monthly-progress'),
        ]);

        const detailedSubjectsPromise = subjectsRes.data.map(s => 
          apiClient.get(`/workspace/subjects/${s.subject_id}`)
        );
        const detailedGroupsPromise = groupsRes.data.map(g => 
          apiClient.get(`/workspace/groups/${g.group_id}`)
        );

        const detailedSubjectsResponses = await Promise.all(detailedSubjectsPromise);
        const detailedGroupsResponses = await Promise.all(detailedGroupsPromise);

        setSubjects(detailedSubjectsResponses.map(res => res.data));
        setGroups(detailedGroupsResponses.map(res => res.data));
        setWeeklySchedule(scheduleRes.data);
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

  const handleChartClick = (subjectData) => {
    setSelectedSubjectData(subjectData);
    setIsProgressModalOpen(true);
  };

  if (loading) return <div>{t('workspace.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <>
      <div className="workspace-container">
        <h1 className="workspace-title">{t('workspace.title')}</h1>
        
        <div className="workspace-grid">
          <div className="q1-actions actions-container">
            <div className="actions-title-card">
              <h2>{t('workspace.actions_title')}</h2>
            </div>
            <Link to="/workspace/register-practice" className="action-button-card">
              <FaPlus /> <span>{t('workspace.register_practice')}</span>
            </Link>
            <Link to="/workspace/consult-practices" className="action-button-card">
              <FaSearch /> <span>{t('workspace.consult_practices')}</span>
            </Link>
            <Link to="/workspace/visualize-activities" className="action-button-card">
              <FaCalendarDay /> <span>{t('workspace.visualize_activities')}</span>
            </Link>
          </div>

          <div className="q2-schedule workspace-card">
            <div className="card-header">
              <FaCalendarAlt />
              <h2>{t('workspace.schedule_title', 'Weekly Schedule')}</h2>
            </div>
            <WorkspaceSchedule scheduleData={weeklySchedule} />
          </div>

          <div className="q3-stats workspace-card">
            <div className="card-header">
              <FaChartPie />
              <h2>{t('workspace.stats_subtitle', 'Monthly Progress')}</h2>
            </div>
            <div className="progress-charts-container">
              {stats.length > 0 ? (
                stats.map(item => (
                  <MonthlyProgressChart
                    key={item.subject_name}
                    subject={item.subject_name}
                    completed={item.total_completed} 
                    total={item.total_goal}
                    onClick={() => handleChartClick(item)} 
                  />
                ))
              ) : (
                <p className="stats-empty-message">{t('workspace.stats_empty')}</p>
              )}
            </div>
          </div>
          
          <div className="q4-lists lists-container-quadrant">
            <div className="workspace-card">
              <div className="card-header">
                <FaBook />
                <h2>{t('workspace.subjects_title')}</h2>
              </div>
              <div className="card-items-grid">
                {subjects.length > 0 ? subjects.map(subject => (
                  <InfoCard
                    key={subject.subject_id}
                    title={subject.subject_name}
                    practiceCount={subject.total_practice_count}
                    tags={subject.groups.map(g => g.group_name)}
                    tagsLabel={t('signup.groups')}
                    onCardClick={() => setSelectedSubjectId(subject.subject_id)}
                  />
                )) : <p>{t('workspace.subjects_empty')}</p>}
              </div>
            </div>
            <div className="workspace-card">
                <div className="card-header">
                    <FaUsers />
                    <h2>{t('workspace.groups_title')}</h2>
                </div>
                <div className="card-items-grid">
                    {groups.length > 0 ? groups.map(group => (
                        <InfoCard
                            key={group.group_id}
                            title={group.group_name}
                            practiceCount={group.total_practice_count}
                            tags={group.subjects.map(s => s.subject_name)}
                            tagsLabel={t('signup.subjects')}
                            onCardClick={() => setSelectedGroupId(group.group_id)}
                        />
                    )) : <p>{t('workspace.groups_empty')}</p>}
                </div>
            </div>
          </div>

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
      {isProgressModalOpen && (
        <ProgressDetailModal
          isOpen={isProgressModalOpen}
          onClose={() => setIsProgressModalOpen(false)}
          subjectData={selectedSubjectData}
        />
      )}
    </>
  );
};

export default WorkspacePage;