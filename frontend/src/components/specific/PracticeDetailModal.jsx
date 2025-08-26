import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import './SubjectDetailModal.css'; 
import { FaTimes, FaFilePdf, FaArrowLeft } from 'react-icons/fa';

const PracticeDetailModal = ({ details, onClose, startInPreviewMode = false }) => {
    const { t } = useTranslation();

    const [isPreviewing, setIsPreviewing] = useState(startInPreviewMode);
    const [pdfUrl, setPdfUrl] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(startInPreviewMode);

    const handlePreviewClick = async () => {
        setIsLoadingPreview(true);
        try {
            const response = await apiClient.get(
                `/practices/practices/${details.practice_id}/download?v=${new Date().getTime()}`, 
                { responseType: 'blob' }
            );
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            
            setPdfUrl(fileURL);
            setIsPreviewing(true);
        } catch (err) {
            console.error("Failed to load PDF for preview", err);
            alert("Could not load the file for preview.");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    useEffect(() => {
        if (startInPreviewMode && details?.practice_id) {
            handlePreviewClick();
        }
    }, [startInPreviewMode, details?.practice_id]);

    const handleBackToDetails = () => {
        if (startInPreviewMode) {
            onClose();
            return;
        }

        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
        setIsPreviewing(false);
        setPdfUrl('');
    };

    if (!details) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {isPreviewing ? (
                    <button className="modal-back-button" onClick={handleBackToDetails}>
                        <FaArrowLeft /> {t('consult_practices.modal_back_details')}
                    </button>
                ) : (
                    <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                )}

                {isPreviewing ? (
                    isLoadingPreview ? (
                        <p>Loading preview...</p>
                    ) : (
                        <embed src={pdfUrl} type="application/pdf" className="pdf-preview-embed" />
                    )
                ) : (
                    <>
                        <h2 className="modal-title">{details.title}</h2>
                        <div className="modal-stat">
                            {t('consult_practices.header_subject')}: <span>{details.subject_name}</span>
                        </div>
                        <p><strong>{t('consult_practices.modal_objective')}:</strong> {details.description}</p>
                        
                        <button className="preview-button" onClick={handlePreviewClick} disabled={isLoadingPreview}>
                            <FaFilePdf /> {isLoadingPreview ? "Loading..." : t('consult_practices.modal_preview_button')}
                        </button>

                        <h3 className="modal-subtitle">{t('consult_practices.modal_sessions_title')}</h3>
                        {details.bookings.map((booking, index) => (
                            <div key={index} className="group-schedule-card">
                                <p><strong>{booking.group_name}</strong> {t('consult_practices.modal_session_in')} <strong>{booking.room_name}</strong></p>
                                <p>{new Date(booking.practice_date + 'T00:00:00').toLocaleDateString()} | {booking.start_time.substring(0,5)} - {booking.end_time.substring(0,5)}</p>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default PracticeDetailModal;