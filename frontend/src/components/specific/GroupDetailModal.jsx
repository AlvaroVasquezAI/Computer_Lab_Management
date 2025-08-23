import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import './SubjectDetailModal.css'; 
import { FaTimes } from 'react-icons/fa';

const DayOfWeek = ({ dayNumber }) => {
    const { t } = useTranslation();
    const dayMap = {
        1: 'monday', 2: 'tuesday', 3: 'wednesday',
        4: 'thursday', 5: 'friday'
    };
    return t(`signup.days.${dayMap[dayNumber]}`, { defaultValue: `Day ${dayNumber}` });
};

const GroupDetailModal = ({ groupId, onClose }) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/workspace/groups/${groupId}`);
        setDetails(response.data);
      } catch (err) {
        setError('Failed to load group details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [groupId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        {loading && <p>{t('modal.loading_details')}</p>}
        {error && <p className="error-message">{error}</p>}

        {details && (
          <>
            <h2 className="modal-title">{details.group_name}</h2>
            <div className="modal-stat">
              {t('modal.total_practices')}: <span>{details.total_practice_count}</span>
            </div>

            <h3 className="modal-subtitle">{t('modal.subjects_and_schedules')}</h3>
            {details.subjects.length > 0 ? (
                details.subjects.map(subject => (
                    <div key={subject.subject_name} className="group-schedule-card">
                        <h4>{subject.subject_name}</h4>
                        <div className="schedule-table">
                            <div className="schedule-header">
                                <div>{t('modal.day_header')}</div>
                                <div>{t('modal.start_time_header')}</div>
                                <div>{t('modal.end_time_header')}</div>
                            </div>
                            {subject.schedules.map(sch => (
                                <div key={sch.day_of_week} className="schedule-row">
                                    <div><DayOfWeek dayNumber={sch.day_of_week} /></div>
                                    <div>{sch.start_time.substring(0, 5)}</div>
                                    <div>{sch.end_time.substring(0, 5)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <p>{t('modal.no_subjects_scheduled')}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupDetailModal;