import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { FaPlusCircle } from 'react-icons/fa';

const AnnouncementsCard = () => {
    const { t } = useTranslation();
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const [rooms, setRooms] = useState([]);
    const [teacherGroups, setTeacherGroups] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    
    const fetchAnnouncements = () => {
        apiClient.get('/dashboard/announcements')
            .then(res => setAnnouncements(res.data))
            .catch(err => console.error("Failed to fetch announcements", err));
    };

    useEffect(() => {
        fetchAnnouncements();
        apiClient.get('/data/rooms')
            .then(res => setRooms(res.data))
            .catch(err => console.error("Failed to fetch rooms", err));
        apiClient.get('/workspace/groups')
            .then(res => setTeacherGroups(res.data))
            .catch(err => console.error("Failed to fetch teacher groups", err));
    }, []);

    const handlePost = async () => {
        if (!newAnnouncement.trim()) return;
        setIsPosting(true);

        const payload = {
            description: newAnnouncement,
        };
        if (selectedRoomId) {
            payload.room_id = parseInt(selectedRoomId, 10);
        }
        if (selectedGroupId) {
            payload.group_id = parseInt(selectedGroupId, 10);
        }

        try {
            await apiClient.post('/dashboard/announcements', payload);
            setNewAnnouncement('');
            setSelectedRoomId('');
            setSelectedGroupId('');
            fetchAnnouncements(); 
        } catch (err) {
            console.error("Failed to post announcement", err);
            alert("Could not post the announcement. Please try again.");
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="announcements-container">
            <div className="announcement-list">
                {announcements.map(ad => {
                    const truncatedDesc = ad.description.length > 100 
                        ? ad.description.substring(0, 100) + '...' 
                        : ad.description;

                    return (
                        <div key={ad.announcement_id} className="announcement-item">
                            <div className="announcement-header">
                                <span className="announcement-author">{ad.teacher.teacher_name}</span>
                                <span className="announcement-date">{new Date(ad.created_at).toLocaleString()}</span>
                            </div>

                            <div className="announcement-body">
                                <p>{truncatedDesc}</p>
                            </div>

                            {(ad.group || ad.room) && (
                                <div className="announcement-footer">
                                    {ad.group && <div className="mini-tag">{ad.group.group_name}</div>}
                                    {ad.room && <div className="mini-tag">{ad.room.room_name}</div>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="announcement-input-area">
                <textarea
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder={t('dashboard.announcements_placeholder')}
                />
                <div className="input-controls">
                    <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}>
                        <option value="">{t('dashboard.select_room_optional')}</option>
                        {rooms.map(room => (
                            <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
                        ))}
                    </select>
                    <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                        <option value="">{t('dashboard.select_group_optional')}</option>
                        {teacherGroups.map(group => (
                            <option key={group.group_id} value={group.group_id}>{group.group_name}</option>
                        ))}
                    </select>
                </div>
                <button onClick={handlePost} disabled={isPosting}>
                    <FaPlusCircle />
                </button>
            </div>
        </div>
    );
};

export default AnnouncementsCard;