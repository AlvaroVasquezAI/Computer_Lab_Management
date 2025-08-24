import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; 
import apiClient from '../services/api';
import './ConsultPracticesPage.css';
import { useNavigate } from 'react-router-dom';
import { FaDownload, FaEye, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa'; 
import PracticeDetailModal from '../components/specific/PracticeDetailModal';
import DeleteConfirmationModal from '../components/specific/DeleteConfirmationModal';

const ConsultPracticesPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [practices, setPractices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [selectedPractice, setSelectedPractice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [practiceToDelete, setPracticeToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchPractices = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get('/practices/practices');
                setPractices(response.data);
            } catch (err) {
                setError(t('consult_practices.error'));
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPractices();
    }, [t]);

    const getFileNameFromResponse = (response) => {
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const matches = /filename="([^"]*)"/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                return matches[1];
            }
        }
        return 'downloaded-file.pdf';
    };

    const handleDownloadOrPreview = async (practiceId, shouldPreview = false) => {
        try {
            const response = await apiClient.get(
                `/practices/practices/${practiceId}/download`,
                { responseType: 'blob' }
            );
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const fileName = getFileNameFromResponse(response);

            const link = document.createElement('a');
            link.href = fileURL;
            if (shouldPreview) {
                link.target = '_blank';
            } else {
                link.setAttribute('download', fileName);
            }
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(fileURL), 100);
        } catch (err) {
            console.error("File action failed", err);
            alert("Could not retrieve the file.");
        }
    };
    
    const handleVisualize = async (practiceId) => {
        try {
            const response = await apiClient.get(`/practices/practices/${practiceId}`);
            setSelectedPractice(response.data);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch practice details", err);
            alert(t('consult_practices.modal_error'));
        }
    };

    const handleDelete = (practice) => {
        setPracticeToDelete(practice);
    };

    const handleConfirmDelete = async () => {
        if (!practiceToDelete) return;

        setIsDeleting(true);
        try {
            await apiClient.delete(`/practices/practices/${practiceToDelete.practice_id}`);
            setPractices(currentPractices => 
                currentPractices.filter(p => p.practice_id !== practiceToDelete.practice_id)
            );
            setPracticeToDelete(null); 
        } catch (err) {
            console.error("Failed to delete practice", err);
            alert("An error occurred while trying to delete the practice. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div>{t('consult_practices.loading')}</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <>
            <div className="consult-practices-container">
                <div className="page-header-container">
                    <div className="back-button-wrapper">
                        <button onClick={() => navigate(-1)} className="back-button">
                            <FaArrowLeft /> {t('common.go_back')}
                        </button>
                    </div>
                    <h1 className="page-title">{t('consult_practices.title')}</h1>
                </div>

                {practices.length === 0 ? (
                    <div className="empty-list-message">{t('consult_practices.empty_message')}</div>
                ) : (
                    <div className="practices-grid">
                        {practices.map((practice) => {
                            const now = new Date();
                            const is_deletable = practice.earliest_session_start
                                ? new Date(practice.earliest_session_start + 'Z') > now
                                : true;
                            const is_editable = practice.latest_session_end
                                ? new Date(practice.latest_session_end + 'Z') > now
                                : true;

                            return (
                                <div key={practice.practice_id} className="practice-card">
                                    <div className="card-content">
                                        <h3 className="practice-title">{practice.title}</h3>
                                        <p className="practice-detail">
                                            <span className="detail-label">{t('consult_practices.header_subject')}:</span> {practice.subject_name}
                                        </p>
                                        <p className="practice-detail">
                                            <span className="detail-label">{t('consult_practices.header_date')}:</span> {new Date(practice.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="card-actions">
                                        <button onClick={() => handleVisualize(practice.practice_id)} title={t('consult_practices.visualize_tooltip')}><FaEye /></button>
                                        
                                        {is_editable && (
                                            <Link to={`/workspace/edit-practice/${practice.practice_id}`}>
                                                <button title={t('edit_practice.edit_tooltip')}><FaEdit /></button>
                                            </Link>
                                        )}

                                        <button onClick={() => handleDownloadOrPreview(practice.practice_id, false)} title={t('consult_practices.download_tooltip')}><FaDownload /></button>
                                        
                                        {is_deletable && (
                                            <button 
                                                onClick={() => handleDelete(practice)} 
                                                className="delete-button" 
                                                title="Delete Practice"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <PracticeDetailModal 
                    details={selectedPractice} 
                    onClose={() => setIsModalOpen(false)}
                    onPreview={() => handleDownloadOrPreview(selectedPractice.practice_id, true)}
                />
            )}

            {practiceToDelete && (
                <DeleteConfirmationModal
                    practice={practiceToDelete}
                    onConfirm={handleConfirmDelete}
                    onClose={() => setPracticeToDelete(null)}
                    isDeleting={isDeleting}
                />
            )}
        </>
    );
};

export default ConsultPracticesPage;