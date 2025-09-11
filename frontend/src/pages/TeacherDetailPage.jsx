import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import InteractiveToggle from '../components/common/InteractiveToggle';
import WorkspaceSchedule from '../components/specific/WorkspaceSchedule';
import SubjectDetailModal from '../components/specific/SubjectDetailModal';
import GroupDetailModal from '../components/specific/GroupDetailModal';
import PracticeDetailModal from '../components/specific/PracticeDetailModal';
import DeleteConfirmationModal from '../components/specific/DeleteConfirmationModal';
import DeleteTeacherModal from '../components/specific/DeleteTeacherModal';
import MonthlyProgressChart from '../components/specific/MonthlyProgressChart';
import ProgressDetailModal from '../components/specific/ProgressDetailModal';
import './WorkspacePage.css';
import InfoCard from '../components/specific/InfoCard';
import { FaArrowLeft, FaUserCircle, FaPencilAlt, FaTrash, FaCalendarAlt, FaBook, FaUsers, FaClipboardList, FaDownload, FaEye, FaEdit, FaChartPie } from 'react-icons/fa';

import './TeacherDetailPage.css';
import '../pages/WorkspacePage.css';
import '../pages/ConsultPracticesPage.css';


const TeacherDetailPage = () => {
    const { t } = useTranslation();
    const { teacherId } = useParams();
    const navigate = useNavigate();

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [selectedPractice, setSelectedPractice] = useState(null);
    const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
    const [practiceToDelete, setPracticeToDelete] = useState(null);
    const [teacherToDelete, setTeacherToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [progressStats, setProgressStats] = useState([]);

    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedSubjectData, setSelectedSubjectData] = useState(null);
    
    const fetchDetails = async () => {
        try {
            setLoading(true);
            const [detailsResponse, progressResponse] = await Promise.all([
                apiClient.get(`/admin/teachers/${teacherId}`),
                apiClient.get(`/admin/teachers/${teacherId}/monthly-progress`)
            ]);
            
            setDetails(detailsResponse.data);
            setProgressStats(progressResponse.data); 
        } catch (error) {
            console.error("Failed to fetch teacher details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [teacherId]);
    
    const handleToggleRole = async (newRole) => {
        if (!details || newRole === details.teacher.role) return;
        try {
            const response = await apiClient.patch(`/admin/teachers/${teacherId}/role`, { role: newRole });
            setDetails(prevDetails => ({
                ...prevDetails,
                teacher: { ...prevDetails.teacher, role: response.data.role }
            }));
        } catch (error) {
            console.error("Failed to update role", error);
            alert("Could not update the user's role.");
        }
    };

    const handleDeleteTeacher = () => {
        setTeacherToDelete(details.teacher);
    };

    const handleConfirmDeleteTeacher = async () => {
        if (!teacherToDelete) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`/admin/teachers/${teacherToDelete.teacher_id}`);
            navigate('/admin');
        } catch (error) {
            console.error("Failed to delete teacher", error);
            alert("Could not delete the teacher.");
        } finally {
            setIsDeleting(false);
            setTeacherToDelete(null);
        }
    };

    const handleVisualizePractice = async (practiceId) => {
        try {
            const response = await apiClient.get(`/admin/practices/${practiceId}`);
            setSelectedPractice(response.data);
            setIsPracticeModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch practice details", err);
        }
    };

    const handleDownloadPractice = async (practiceId) => {
        try {
            const response = await apiClient.get(`/admin/practices/${practiceId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'practice.pdf';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch.length === 2) fileName = fileNameMatch[1];
            }
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { console.error("File download failed", err); }
    };

    const handleDeletePractice = (practice) => { setPracticeToDelete(practice); };

    const handleConfirmDeletePractice = async () => {
        if (!practiceToDelete) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`/admin/practices/${practiceToDelete.practice_id}`);
            fetchDetails();
            setPracticeToDelete(null);
        } catch (err) {
            console.error("Failed to delete practice", err);
        } finally { setIsDeleting(false); }
    };

    const handleChartClick = (subjectData) => {
        setSelectedSubjectData(subjectData);
        setIsProgressModalOpen(true);
    };

    if (loading) return <p>Loading teacher details...</p>;
    if (!details) return <p>Teacher not found.</p>;

    return (
        <>
            <div className="teacher-detail-page">
                <button onClick={() => navigate('/admin')} className="back-button">
                    <FaArrowLeft /> {t('teacher_detail_page.back_to_admin')}
                </button>

                <header className="teacher-header-card">
                    <div className="teacher-info">
                        <FaUserCircle className="teacher-avatar" />
                        <div className="teacher-name-email">
                            <h2>{details.teacher.teacher_name}</h2>
                            <p>{details.teacher.email}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Link to={`/admin/edit-teacher/${teacherId}`}>
                            <button className="action-button edit" title={t('teacher_detail_page.edit_teacher')}>
                                <FaPencilAlt />
                            </button>
                        </Link>
                        
                        <button className="action-button delete" onClick={handleDeleteTeacher} title={t('teacher_detail_page.delete_teacher')}>
                            <FaTrash />
                        </button>

                        <InteractiveToggle 
                            options={['teacher', 'admin']}
                            activeOption={details.teacher.role}
                            onToggle={handleToggleRole}
                        />
                    </div>
                </header>

                <main className="teacher-detail-grid">
                    <div className="grid-col-left">
                        <section className="detail-section-card">
                            <h3 className="detail-section-title"><FaCalendarAlt /> {t('teacher_detail_page.weekly_schedule')}</h3>
                            <WorkspaceSchedule scheduleData={details.schedule} />
                        </section>
                        <section className="detail-section-card">
                            <h3 className="detail-section-title"><FaClipboardList /> {t('teacher_detail_page.registered_practices')}</h3>
                            {details.practices.length > 0 ? (
                                <div className="practices-grid">
                                    {details.practices.map(practice => (
                                        <div key={practice.practice_id} className="practice-card">
                                            <div className="card-content">
                                                <h3 className="practice-title">{practice.title}</h3>
                                                <p className="practice-detail"><span className="detail-label">{t('consult_practices.header_subject')}:</span> {practice.subject_name}</p>
                                            </div>
                                            <div className="card-actions">
                                                <button onClick={() => handleVisualizePractice(practice.practice_id)}><FaEye /></button>
                                                <Link to={`/admin/edit-practice/${practice.practice_id}`}><button><FaEdit /></button></Link>
                                                <button onClick={() => handleDownloadPractice(practice.practice_id)}><FaDownload /></button>
                                                <button className="delete-button" onClick={() => handleDeletePractice(practice)}><FaTrash /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-practices-message">{t('teacher_detail_page.no_practices')}</p>
                            )}
                        </section>
                    </div>
                    <div className="grid-col-right">
                        <section className="detail-section-card">
                            <h3 className="detail-section-title"><FaBook /> {t('teacher_detail_page.subjects')}</h3>
                            <div className="card-items-grid">
                                {details.subjects && details.subjects.map(subject => (
                                    <InfoCard
                                        key={subject.subject_id}
                                        title={subject.subject_name}
                                        practiceCount={subject.total_practice_count}
                                        tags={subject.groups.map(g => g.group_name)}
                                        tagsLabel={t('signup.groups')}
                                        onCardClick={() => setSelectedSubjectId(subject.subject_id)}
                                    />
                                ))}
                            </div>
                        </section>
                        <section className="detail-section-card">
                            <h3 className="detail-section-title"><FaUsers /> {t('teacher_detail_page.groups')}</h3>
                            <div className="card-items-grid">
                                {details.groups && details.groups.map(group => (
                                    <InfoCard
                                        key={group.group_id}
                                        title={group.group_name}
                                        practiceCount={group.total_practice_count}
                                        tags={group.subjects.map(s => s.subject_name)}
                                        tagsLabel={t('signup.subjects')}
                                        onCardClick={() => setSelectedGroupId(group.group_id)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="detail-section-card">
                            <h3 className="detail-section-title"><FaChartPie /> {t('workspace.stats_subtitle', 'Monthly Progress')}</h3>
                            <div className="progress-charts-container">
                                {progressStats.length > 0 ? (
                                    progressStats.map(item => (
                                        <MonthlyProgressChart
                                            key={item.subject_name}
                                            subject={item.subject_name}
                                            completed={item.total_completed}
                                            total={item.total_goal}
                                            onClick={() => handleChartClick(item)}
                                        />
                                    ))
                                ) : (
                                    <p className="no-practices-message">{t('workspace.stats_empty')}</p>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {selectedSubjectId && <SubjectDetailModal subjectId={selectedSubjectId} onClose={() => setSelectedSubjectId(null)} teacherIdForAdmin={teacherId} />}
            {selectedGroupId && <GroupDetailModal groupId={selectedGroupId} onClose={() => setSelectedGroupId(null)} teacherIdForAdmin={teacherId} />}
            {isPracticeModalOpen && <PracticeDetailModal details={selectedPractice} onClose={() => setIsPracticeModalOpen(false)} isAdminMode={true} />}
            {practiceToDelete && <DeleteConfirmationModal practice={practiceToDelete} onConfirm={handleConfirmDeletePractice} onClose={() => setPracticeToDelete(null)} isDeleting={isDeleting} />}
            {teacherToDelete && (
                <DeleteTeacherModal
                    teacher={teacherToDelete}
                    onConfirm={handleConfirmDeleteTeacher}
                    onClose={() => setTeacherToDelete(null)}
                    isDeleting={isDeleting}
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

export default TeacherDetailPage;