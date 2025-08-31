import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import './AdminPage.css';

const AdminPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(20);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const teachersPromise = apiClient.get('/admin/teachers');
      const roomsPromise = apiClient.get('/admin/rooms');
      const [teachersRes, roomsRes] = await Promise.all([teachersPromise, roomsPromise]);
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
    try {
      await apiClient.post('/admin/rooms', { room_name: newRoomName, capacity: newRoomCapacity });
      setNewRoomName('');
      setNewRoomCapacity(20);
      fetchData(); 
    } catch (error) {
      console.error("Failed to add room", error);
      alert("Could not add the new room.");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room and all its bookings? This action cannot be undone.")) {
      try {
        await apiClient.delete(`/admin/rooms/${roomId}`);
        fetchData();
      } catch (error) {
        console.error("Failed to delete room", error);
        alert("Could not delete the room.");
      }
    }
  };

  if (loading) return <p>Loading administration panel...</p>;

  return (
    <div className="admin-page-container">
      <h1>{t('sidebar.administration')}</h1>
      <div className="admin-sections-grid">
        <div className="admin-card">
          <h2>Teacher Management</h2>
          <div className="teachers-list">
            {teachers.map(teacher => (
              <button 
                key={teacher.teacher_id} 
                className="teacher-card-button" 
                onClick={() => navigate(`/admin/teacher/${teacher.teacher_id}`)}
              >
                <h3>{teacher.teacher_name}</h3>
                <p>ID: {teacher.teacher_id}</p>
                <p>{teacher.email}</p>
                <p>Role: {teacher.role}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <h2>Room Management</h2>
          <ul className="rooms-list">
            {rooms.map(room => (
              <li key={room.room_id} className="room-item">
                <span>{room.room_name}</span>
                <button onClick={() => handleDeleteRoom(room.room_id)}>Delete</button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddRoom} className="add-room-form">
            <h3>Add New Room</h3>
            <input 
              type="text" 
              placeholder="New Room Name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              required
            />
            <input 
              type="number" 
              placeholder="Capacity"
              value={newRoomCapacity}
              onChange={e => setNewRoomCapacity(parseInt(e.target.value, 10))}
              required
            />
            <button type="submit">Add Room</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;