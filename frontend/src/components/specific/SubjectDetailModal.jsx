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

const SubjectDetailModal = ({ subjectId, onClose, teacherIdForAdmin = null }) => {
  const { t } = useTranslation();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subjectId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = teacherIdForAdmin
          ? `/admin/teachers/${teacherIdForAdmin}/subjects/${subjectId}`
          : `/workspace/subjects/${subjectId}`;
        
        const response = await apiClient.get(apiUrl);
        setDetails(response.data);
      } catch (err) {
        setError('Failed to load subject details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [subjectId, teacherIdForAdmin]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
        
        {loading && <p>{t('modal.loading_details')}</p>}
        {error && <p className="error-message">{error}</p>}

        {details && (
          <>
            <h2 className="modal-title">{details.subject_name}</h2>
            <div className="modal-stat">
              {t('modal.total_practices')}: <span>{details.total_practice_count}</span>
            </div>

            <h3 className="modal-subtitle">{t('modal.groups_and_schedules')}</h3>
            {details.groups.length > 0 ? (
                details.groups.map(group => (
                    <div key={group.group_name} className="group-schedule-card">
                        <h4>{group.group_name}</h4>
                        <div className="schedule-table">
                            {group.schedules.map(sch => (
                                <div key={sch.day_of_week} className="schedule-row">
                                    <div><DayOfWeek dayNumber={sch.day_of_week} /></div>
                                    <div>{sch.start_time.substring(0, 5)}</div>
                                    <div>{sch.end_time.substring(0, 5)}</div>
                                    <div>
                                      <span className={`type-tag-modal ${sch.schedule_type.toLowerCase()}`}>
                                        {sch.schedule_type === 'PRACTICE'
                                          ? t('signup.schedule_type.practice')
                                          : t('signup.schedule_type.class')}
                                      </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <p>{t('modal.no_groups_scheduled')}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubjectDetailModal;