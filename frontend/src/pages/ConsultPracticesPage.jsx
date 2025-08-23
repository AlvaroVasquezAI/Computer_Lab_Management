import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; 
import apiClient from '../services/api';
import './ConsultPracticesPage.css';
import { FaDownload, FaEye, FaEdit } from 'react-icons/fa'; 
import PracticeDetailModal from '../components/specific/PracticeDetailModal';

const ConsultPracticesPage = () => {
    const { t } = useTranslation();
    const [practices, setPractices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [selectedPractice, setSelectedPractice] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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


    if (loading) return <div>{t('consult_practices.loading')}</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <>
            <div className="consult-practices-container">
                <h1 className="page-title">{t('consult_practices.title')}</h1>

                <div className="practices-list-table">
                    <div className="list-table-header">
                        <span>{t('consult_practices.header_name')}</span>
                        <span>{t('consult_practices.header_subject')}</span>
                        <span>{t('consult_practices.header_date')}</span>
                        <span>{t('consult_practices.header_actions')}</span>
                    </div>
                    {practices.length === 0 ? (
                        <div className="empty-list-message">{t('consult_practices.empty_message')}</div>
                    ) : (
                        practices.map((practice) => (
                            <div key={practice.practice_id} className="list-table-row">
                                <div className="practice-title-mobile">{practice.title}</div>
                                <div><span className="mobile-label">{t('consult_practices.header_subject')}: </span>{practice.subject_name}</div>
                                <div><span className="mobile-label">{t('consult_practices.header_date')}: </span>{new Date(practice.created_at).toLocaleDateString()}</div>
                                <div className="action-buttons-wrapper">
                                    <span className="mobile-label">{t('consult_practices.header_actions')}: </span>
                                    <div className="action-buttons">
                                        <button onClick={() => handleVisualize(practice.practice_id)} title={t('consult_practices.visualize_tooltip')}><FaEye /></button>
                                        
                                        <Link to={`/workspace/edit-practice/${practice.practice_id}`}>
                                            <button title={t('edit_practice.edit_tooltip')} disabled={!practice.is_editable}>
                                                <FaEdit />
                                            </button>
                                        </Link>

                                        <button onClick={() => handleDownloadOrPreview(practice.practice_id, false)} title={t('consult_practices.download_tooltip')}><FaDownload /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {isModalOpen && (
                <PracticeDetailModal 
                    details={selectedPractice} 
                    onClose={() => setIsModalOpen(false)}
                    onPreview={() => handleDownloadOrPreview(selectedPractice.practice_id, true)}
                />
            )}
        </>
    );
};

export default ConsultPracticesPage;