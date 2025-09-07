import React from 'react';
import { useTranslation } from 'react-i18next'; 
import { FaTimes } from 'react-icons/fa';
import '../../pages/AdminPage.css';

const DataPreviewModal = ({ isOpen, onClose, title, headers, data }) => {
    const { t } = useTranslation(); 

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content data-preview-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
                <h2 className="modal-title">{title}</h2>
                
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                {headers.map((header, index) => (
                                    <th key={index}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex}>{cell}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length} className="no-data-cell">
                                        {t('data_export.no_data_preview')} 
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataPreviewModal;