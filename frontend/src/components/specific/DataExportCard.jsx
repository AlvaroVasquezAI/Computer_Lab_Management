import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { FaFileCsv, FaDownload, FaEye, FaEnvelope } from 'react-icons/fa';
import DataPreviewModal from './DataPreviewModal';
import EmailExportModal from './EmailExportModal';

const DataExportCard = () => {
    const { t } = useTranslation();
    const [exportType, setExportType] = useState('teacher');
    const [dataForDropdown, setDataForDropdown] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // States for the preview modal
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [previewHeaders, setPreviewHeaders] = useState([]);
    const [previewTitle, setPreviewTitle] = useState('');

    // State for the email modal
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    // Data for dropdowns
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [teachersRes, roomsRes, subjectsRes, groupsRes] = await Promise.all([
                    apiClient.get('/data/teachers'),
                    apiClient.get('/data/rooms'),
                    apiClient.get('/data/subjects'),
                    apiClient.get('/data/groups')
                ]);
                setTeachers(teachersRes.data);
                setRooms(roomsRes.data);
                setSubjects(subjectsRes.data);
                setGroups(groupsRes.data);
                setDataForDropdown(teachersRes.data);
            } catch (error) {
                console.error("Failed to fetch data for export dropdowns", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        setSelectedId('');
        if (exportType === 'teacher') setDataForDropdown(teachers);
        if (exportType === 'room') setDataForDropdown(rooms);
        if (exportType === 'subject') setDataForDropdown(subjects);
        if (exportType === 'group') setDataForDropdown(groups);
    }, [exportType, teachers, rooms, subjects, groups]);

    const fetchExportDataAsText = async () => {
        const url = selectedId === 'all'
            ? '/export/practices/all'
            : `/export/practices?by=${exportType}&id=${selectedId}`;
        const response = await apiClient.get(url, { responseType: 'text' });
        return response.data;
    };

    const parseCsv = (csvText) => {
        if (!csvText || typeof csvText !== 'string') return { headers: [], data: [] };
        const rows = csvText.trim().split('\n');
        const headers = rows.shift().split(',').map(h => h.trim());
        const data = rows.map(row => row.split(',').map(cell => cell.trim()));
        return { headers, data };
    };

    const handleView = async () => {
        if (!selectedId) {
            alert(t('data_export.alert_select_item'));
            return;
        }
        setIsProcessing(true);
        try {
            const csvText = await fetchExportDataAsText();
            const { headers, data } = parseCsv(csvText);
            
            const selectedItem = dataForDropdown.find(item => getOptionValue(item) == selectedId);
            const title = selectedId === 'all' 
                ? t('data_export.preview_title_all') 
                : t('data_export.preview_title_for', { name: getOptionLabel(selectedItem) });
            
            setPreviewHeaders(headers);
            setPreviewData(data);
            setPreviewTitle(title);
            setIsPreviewModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch data for preview", error);
            alert(t('data_export.alert_download_error'));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDownload = async () => {
        if (!selectedId) {
            alert(t('data_export.alert_select_item'));
            return;
        }
        setIsProcessing(true);
        try {
            const url = selectedId === 'all'
                ? '/export/practices/all'
                : `/export/practices?by=${exportType}&id=${selectedId}`;
            
            const response = await apiClient.get(url, { responseType: 'blob' });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'export.csv';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }
            
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Failed to download CSV", error);
            alert(t('data_export.alert_download_error'));
        } finally {
            setIsProcessing(false);
        }
    };

    const getOptionLabel = (item) => item.teacher_name || item.room_name || item.subject_name || item.group_name;
    const getOptionValue = (item) => item.teacher_id || item.room_id || item.subject_id || item.group_id;
    const getSelectAllLabel = () => t(`data_export.all_${exportType}s`);
    const getSelectPlaceholder = () => t(`data_export.select_${exportType}`);

    return (
        <>
            <div className="admin-card">
                <h2 className="admin-card-title"><FaFileCsv /> {t('data_export.title')}</h2>
                <div className="data-export-form">
                    <div className="export-type-selector">
                        <label>
                            <input type="radio" value="teacher" checked={exportType === 'teacher'} onChange={(e) => setExportType(e.target.value)} />
                            <span>{t('data_export.by_teacher')}</span>
                        </label>
                        <label>
                            <input type="radio" value="room" checked={exportType === 'room'} onChange={(e) => setExportType(e.target.value)} />
                            <span>{t('data_export.by_room')}</span>
                        </label>
                        <label>
                            <input type="radio" value="subject" checked={exportType === 'subject'} onChange={(e) => setExportType(e.target.value)} />
                            <span>{t('data_export.by_subject')}</span>
                        </label>
                        <label>
                            <input type="radio" value="group" checked={exportType === 'group'} onChange={(e) => setExportType(e.target.value)} />
                            <span>{t('data_export.by_group')}</span>
                        </label>
                    </div>
                    
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={isLoading}>
                        <option value="">
                            {isLoading ? t('data_export.loading') : getSelectPlaceholder()}
                        </option>
                        <option value="all">{getSelectAllLabel()}</option>
                        {dataForDropdown.map(item => (
                            <option key={getOptionValue(item)} value={getOptionValue(item)}>
                                {getOptionLabel(item)}
                            </option>
                        ))}
                    </select>
                    
                    <div className="export-actions">
                        <button className="view-btn" onClick={handleView} disabled={!selectedId || isProcessing}>
                            <FaEye />
                            {isProcessing ? t('data_export.processing_button') : t('data_export.view_button')}
                        </button>
                        <button className="download-btn" onClick={() => setIsEmailModalOpen(true)} disabled={!selectedId || isProcessing}>
                        <FaEnvelope />
                        {isProcessing ? t('data_export.processing_button') : t('data_export.send_email_button')}
                        </button>
                    </div>
                    
                    <button className="download-btn" onClick={handleDownload} disabled={!selectedId || isProcessing} style={{marginTop: '1rem', width: '100%'}}>
                        <FaDownload />
                        {isProcessing ? t('data_export.downloading_button') : t('data_export.download_button')}
                    </button>
                </div>
            </div>

            <DataPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title={previewTitle}
                headers={previewHeaders}
                data={previewData}
            />

            <EmailExportModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                allTeachers={teachers}
                exportType={exportType}
                selectedId={selectedId}
                selectedItemLabel={() => {
                    if (selectedId === 'all') {
                        return t(`data_export.all_${exportType}s`);
                    }
                    const foundItem = dataForDropdown.find(item => getOptionValue(item) == selectedId);
                    return foundItem ? getOptionLabel(foundItem) : '';
                }}
            />
        </>
    );
};

export default DataExportCard;