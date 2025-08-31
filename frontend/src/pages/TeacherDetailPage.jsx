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
import { FaDownload, FaEye, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';

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
    const [isDeleting, setIsDeleting] = useState(false);
    
    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/admin/teachers/${teacherId}`);
            setDetails(response.data);
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
        if (!details || newRole === details.teacher.role) {
            return; 
        }
        
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

    const handleDeleteTeacher = async () => {
        if (window.confirm(`Are you sure you want to permanently delete ${details.teacher.teacher_name} and all their data? This cannot be undone.`)) {
            try {
                await apiClient.delete(`/admin/teachers/${teacherId}`);
                alert("Teacher deleted successfully.");
                navigate('/admin');
            } catch (error) {
                console.error("Failed to delete teacher", error);
                alert("Could not delete the teacher.");
            }
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
        } catch (err) {
            console.error("File download failed", err);
        }
    };

    const handleDeletePractice = (practice) => {
        setPracticeToDelete(practice);
    };

    const handleConfirmDeletePractice = async () => {
        if (!practiceToDelete) return;
        setIsDeleting(true);
        try {
            await apiClient.delete(`/admin/practices/${practiceToDelete.practice_id}`);
            fetchDetails();
            setPracticeToDelete(null);
        } catch (err) {
            console.error("Failed to delete practice", err);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <p>Loading teacher details...</p>;
    if (!details) return <p>Teacher not found.</p>;

    return (
        <>
            <div className="teacher-detail-container">
                <button onClick={() => navigate(-1)} className="back-button">
                    <FaArrowLeft /> Back to Admin Panel
                </button>
                <div className="teacher-detail-header">
                    <h1>{details.teacher.teacher_name}</h1>
                    <p>{details.teacher.email}</p>
                    
                    <div className="teacher-detail-actions">
                        <Link to={`/admin/edit-teacher/${teacherId}`}>
                            <button className="action-btn edit-btn">Edit Teacher</button>
                        </Link>
                        
                        <InteractiveToggle 
                            options={['teacher', 'admin']}
                            activeOption={details.teacher.role}
                            onToggle={handleToggleRole}
                        />

                        <button className="action-btn delete-btn" onClick={handleDeleteTeacher}>Delete Teacher</button>
                    </div>
                </div>

                <h2 className="detail-section-title">Weekly Schedule</h2>
                <div className="workspace-card">
                     <WorkspaceSchedule scheduleData={details.schedule} />
                </div>
                
                <h2 className="detail-section-title">Subjects & Groups</h2>
                <div className="lists-container-quadrant">
                    <div className="workspace-card">
                        <div className="card-header"><h2>{t('workspace.subjects_title')}</h2></div>
                        <div className="card-items-list">
                            {details.subjects.map(s => <button key={s.subject_id} className="item-button" onClick={() => setSelectedSubjectId(s.subject_id)}>{s.subject_name}</button>)}
                        </div>
                    </div>
                    <div className="workspace-card">
                        <div className="card-header"><h2>{t('workspace.groups_title')}</h2></div>
                        <div className="card-items-list">
                            {details.groups.map(g => <button key={g.group_id} className="item-button" onClick={() => setSelectedGroupId(g.group_id)}>{g.group_name}</button>)}
                        </div>
                    </div>
                </div>

                <h2 className="detail-section-title">Registered Practices</h2>
                <div className="practices-grid">
                    {details.practices.map(practice => (
                        <div key={practice.practice_id} className="practice-card">
                            <div className="card-content">
                                <h3 className="practice-title">{practice.title}</h3>
                                <p className="practice-detail">
                                    <span className="detail-label">{t('consult_practices.header_subject')}:</span> {practice.subject_name}
                                </p>
                            </div>
                            <div className="card-actions">
                                <button onClick={() => handleVisualizePractice(practice.practice_id)}><FaEye /></button>
                                <Link to={`/admin/edit-practice/${practice.practice_id}`}><button><FaEdit /></button></Link>
                                <button onClick={() => handleDownloadPractice(practice.practice_id)}><FaDownload /></button>
                                <button className="delete-button" onClick={() => handleDeletePractice(practice)}><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                    {details.practices.length === 0 && <p>This teacher has not registered any practices.</p>}
                </div>
            </div>

            {selectedSubjectId && <SubjectDetailModal subjectId={selectedSubjectId} onClose={() => setSelectedSubjectId(null)} teacherIdForAdmin={teacherId} />}
            {selectedGroupId && <GroupDetailModal groupId={selectedGroupId} onClose={() => setSelectedGroupId(null)} teacherIdForAdmin={teacherId} />}
            {isPracticeModalOpen && <PracticeDetailModal details={selectedPractice} onClose={() => setIsPracticeModalOpen(false)} isAdminMode={true} />}
            {practiceToDelete && <DeleteConfirmationModal practice={practiceToDelete} onConfirm={handleConfirmDeletePractice} onClose={() => setPracticeToDelete(null)} isDeleting={isDeleting} />}
        </>
    );
};

export default TeacherDetailPage;