import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import SubjectDetailModal from '../components/specific/SubjectDetailModal';
import GroupDetailModal from '../components/specific/GroupDetailModal';
import WorkspaceSchedule from '../components/specific/WorkspaceSchedule';
import WorkspaceStats from '../components/specific/WorkspaceStats';
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

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        setLoading(true);
        const subjectsPromise = apiClient.get('/workspace/subjects');
        const groupsPromise = apiClient.get('/workspace/groups');
        const schedulePromise = apiClient.get('/workspace/schedule');
        const statsPromise = apiClient.get('/workspace/stats/practices-per-subject');

        const [subjectsRes, groupsRes, scheduleRes, statsRes] = await Promise.all([
          subjectsPromise,
          groupsPromise,
          schedulePromise,
          statsPromise,
        ]);

        setSubjects(subjectsRes.data);
        setGroups(groupsRes.data);
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
                <h2>{t('workspace.statistics_title', 'Statistics')}</h2>
            </div>
            <WorkspaceStats stats={stats} />
          </div>
          
          <div className="q4-lists lists-container-quadrant">
            <div className="workspace-card">
                <div className="card-header">
                    <FaBook />
                    <h2>{t('workspace.subjects_title')}</h2>
                </div>
                <div className="card-items-list">
                    {subjects.length > 0 ? subjects.map(subject => (
                        <button 
                            key={subject.subject_id} 
                            className="item-button"
                            onClick={() => setSelectedSubjectId(subject.subject_id)}
                        >
                            {subject.subject_name}
                        </button>
                    )) : <p>{t('workspace.subjects_empty')}</p>}
                </div>
            </div>
            <div className="workspace-card">
                <div className="card-header">
                    <FaUsers />
                    <h2>{t('workspace.groups_title')}</h2>
                </div>
                <div className="card-items-list">
                    {groups.length > 0 ? groups.map(group => (
                        <button 
                            key={group.group_id} 
                            className="item-button"
                            onClick={() => setSelectedGroupId(group.group_id)}
                        >
                            {group.group_name}
                        </button>
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
    </>
  );
};

export default WorkspacePage;