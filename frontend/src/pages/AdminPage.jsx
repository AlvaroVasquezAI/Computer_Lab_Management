import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { FaUsersCog, FaDoorOpen, FaPlus, FaTrash, FaIdBadge, FaUserShield, FaEdit, FaTimes } from 'react-icons/fa';
import {FaComputer} from 'react-icons/fa6';
import DeleteRoomModal from '../components/specific/DeleteRoomModal';
import './AdminPage.css';

const AdminPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(20);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false); 

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, roomsRes] = await Promise.all([
        apiClient.get('/admin/teachers'),
        apiClient.get('/admin/rooms')
      ]);
      setTeachers(teachersRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      await apiClient.post('/admin/rooms', { room_name: newRoomName, capacity: newRoomCapacity });
      setNewRoomName('');
      setNewRoomCapacity(20);
      fetchData();
    } catch (error) {
      console.error("Failed to add room", error);
      alert(t('admin_page.add_room_error'));
    }
  };

  const handleDeleteRoom = (room) => {
    setRoomToDelete(room);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/rooms/${roomToDelete.room_id}`);
      fetchData(); 
    } catch (error) {
      console.error("Failed to delete room", error);
      alert(t('admin_page.delete_room_error'));
    } finally {
      setIsDeleting(false);
      setRoomToDelete(null); 
    }
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom({ ...room });
  };

  const handleCloseEditModal = () => {
    setEditingRoom(null);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const capacityAsNumber = parseInt(editingRoom.capacity, 10);
    if (isNaN(capacityAsNumber) || capacityAsNumber <= 0) {
      alert("Please enter a valid capacity.");
      return;
    }
    try {
      await apiClient.put(`/admin/rooms/${editingRoom.room_id}`, {
        room_name: editingRoom.room_name,
        capacity: capacityAsNumber
      });
      handleCloseEditModal();
      fetchData();
    } catch (error) {
      console.error("Failed to update room", error);
      alert(t('admin_page.update_room_error'));
    }
  };

  if (loading) return <p>{t('admin_page.loading')}</p>;

  return (
    <>
      <div className="admin-page-container">
        <h1>{t('admin_page.title')}</h1>
        <div className="admin-sections-grid">
          <div className="admin-card">
            <h2 className="admin-card-title"><FaUsersCog /> {t('admin_page.teacher_management_title')}</h2>
            <div className="teachers-grid">
              {teachers.map(teacher => (
                <button key={teacher.teacher_id} className="teacher-card" onClick={() => navigate(`/admin/teacher/${teacher.teacher_id}`)}>
                  <h3>{teacher.teacher_name}</h3>
                  <p className="teacher-email">{teacher.email}</p>
                  <div className="teacher-details">
                    <span><FaIdBadge /> {t('admin_page.teacher_id')}: {teacher.teacher_id}</span>
                    <span><FaUserShield /> {t('admin_page.teacher_role')}: {teacher.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title"><FaDoorOpen /> {t('admin_page.room_management_title')}</h2>
            <div className="rooms-grid">
              {rooms.map(room => (
                <div key={room.room_id} className="room-card">
                  <div className="room-icon"><FaComputer /></div>
                  <p className="room-id">{t('admin_page.teacher_id')}: {room.room_id}</p>
                  <h4 className="room-card-name">{room.room_name}</h4>
                  <p className="room-capacity">
                    {room.capacity ? `${room.capacity} ${t('admin_page.people')}` : `N/A ${t('admin_page.people')}`}
                  </p>
                  <div className="room-actions">
                    <button className="action-btn edit" onClick={() => handleOpenEditModal(room)}><FaEdit /></button>
                    <button className="action-btn delete" onClick={() => handleDeleteRoom(room)}><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddRoom} className="add-room-form">
              <h3>{t('admin_page.add_room_title')}</h3>
              <input type="text" placeholder={t('admin_page.room_name_placeholder')} value={newRoomName} onChange={e => setNewRoomName(e.target.value)} required />
              <input type="number" placeholder={t('admin_page.capacity_placeholder')} value={newRoomCapacity} onChange={e => setNewRoomCapacity(parseInt(e.target.value, 10))} min="1" required />
              <button type="submit" className="add-room-btn"><FaPlus /> {t('admin_page.add_room_button')}</button>
            </form>
          </div>
        </div>
      </div>

      {editingRoom && (
        <div className="edit-modal-overlay" onClick={handleCloseEditModal}>
          <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseEditModal}><FaTimes /></button>
            <h3>{t('admin_page.edit_room_title')}</h3>
            <form onSubmit={handleUpdateRoom}>
              <div className="form-group">
                <label htmlFor="edit-room-name">{t('admin_page.room_name_label')}</label>
                <input id="edit-room-name" type="text" value={editingRoom.room_name} onChange={(e) => setEditingRoom({...editingRoom, room_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label htmlFor="edit-room-capacity">{t('admin_page.capacity_label')}</label>
                <input id="edit-room-capacity" type="number" value={editingRoom.capacity || ''} onChange={(e) => { const value = e.target.value; setEditingRoom({ ...editingRoom, capacity: value === '' ? '' : parseInt(value, 10) }); }} min="1" required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="save-btn">{t('admin_page.save_changes_button')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roomToDelete && (
        <DeleteRoomModal
          room={roomToDelete}
          onConfirm={handleConfirmDeleteRoom}
          onClose={() => setRoomToDelete(null)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};

export default AdminPage;