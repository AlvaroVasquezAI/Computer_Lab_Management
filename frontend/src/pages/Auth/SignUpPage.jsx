import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext'; 
import './SignUpPage.css';
import DetailsForm from '../../components/specific/DetailsForm';
import SubjectManager from '../../components/specific/SubjectManager';
import SubjectList from '../../components/specific/SubjectList';
import GroupTags from '../../components/specific/GroupTags';

const SignUpPage = ({ isEditMode = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth(); 
    const { teacherId } = useParams(); 

    const [teacherDetails, setTeacherDetails] = useState({ name: '', email: '', password: '', role: 'teacher' });
    const [subjects, setSubjects] = useState([]);
    
    const [existingSubjects, setExistingSubjects] = useState([]);
    const [existingGroups, setExistingGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [editingSubjectIndex, setEditingSubjectIndex] = useState(null);
    const [editingSubjectData, setEditingSubjectData] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const subjectsPromise = apiClient.get('/data/subjects');
                const groupsPromise = apiClient.get('/data/groups');
                const [subjectsRes, groupsRes] = await Promise.all([subjectsPromise, groupsPromise]);
                setExistingSubjects(subjectsRes.data);
                setExistingGroups(groupsRes.data);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }
        };
        fetchInitialData();
        
        if (isEditMode && teacherId) {
            setLoading(true);
            apiClient.get(`/admin/teachers/${teacherId}/onboarding-data`)
                .then(res => {
                    const { teacher_name, email, role, subjects } = res.data;
                    setTeacherDetails({ name: teacher_name, email, role });
                    setSubjects(subjects);
                })
                .catch(err => console.error("Failed to fetch teacher data for editing", err))
                .finally(() => setLoading(false));
        }
    }, [isEditMode, teacherId]);

    const handleAddOrUpdateSubject = (subjectData) => {
        if (editingSubjectIndex !== null) {
            const updatedSubjects = subjects.map((subj, index) => 
                index === editingSubjectIndex ? subjectData : subj
            );
            setSubjects(updatedSubjects);
        } else {
            setSubjects([...subjects, subjectData]);
        }
        setEditingSubjectIndex(null);
        setEditingSubjectData(null);
    };

    const handleDeleteSubject = (indexToDelete) => {
        if (window.confirm("Are you sure you want to delete this subject and all its groups?")) {
            setSubjects(subjects.filter((_, index) => index !== indexToDelete));
        }
    };

    const handleEditSubject = (indexToEdit) => {
        setEditingSubjectIndex(indexToEdit);
        setEditingSubjectData(subjects[indexToEdit]);
    };

    const handleSubmit = async () => {
        setLoading(true);
        if (isEditMode) {
            const payload = {
                teacher_name: teacherDetails.name,
                email: teacherDetails.email,
                role: teacherDetails.role,
                subjects: subjects
            };
            try {
                await apiClient.put(`/admin/teachers/${teacherId}`, payload);
                alert("Teacher updated successfully!");
                navigate(`/admin/teacher/${teacherId}`);
            } catch (error) {
                 alert(`Failed to update teacher: ${error.response?.data?.detail || "Unknown error"}`);
            } finally {
                setLoading(false);
            }
        } else {
            const payload = {
                teacher_name: teacherDetails.name,
                email: teacherDetails.email,
                password: teacherDetails.password,
                subjects: subjects,
            };
            try {
                await apiClient.post('/onboarding/teacher', payload);
                const loginResponse = await apiClient.post('/auth/login', {
                    email: teacherDetails.email,
                    password: teacherDetails.password,
                });
                login(loginResponse.data.access_token);
                navigate('/home'); 
            } catch (error) {
                alert(`Failed to create account: ${error.response?.data?.detail || "Unknown error"}`);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="signup-page">
            <header className="signup-header">
                <h1>{isEditMode ? `Edit ${teacherDetails.name}` : t('signup.title')}</h1>
            </header>
            <div className="signup-grid">
                <div className="left-column">
                    <DetailsForm details={teacherDetails} setDetails={setTeacherDetails} isEditMode={isEditMode} />
                    <div className="card">
                        <h3>{t('signup.subjects')}</h3>
                        <SubjectList 
                            subjects={subjects} 
                            onDelete={handleDeleteSubject} 
                            onEdit={handleEditSubject}
                        />
                    </div>
                    <div className="card">
                        <h3>{t('signup.all_groups')}</h3>
                        <GroupTags subjects={subjects} />
                    </div>
                </div>
                <div className="right-column">
                    <SubjectManager 
                        key={editingSubjectIndex} 
                        existingSubjects={existingSubjects}
                        existingGroups={existingGroups}
                        onAddSubject={handleAddOrUpdateSubject}
                        initialData={editingSubjectData} 
                    />
                </div>
            </div>
            <footer className="signup-footer">
                <button onClick={handleSubmit} className="submit-button" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? "Save Changes" : t('signup.save_changes_button'))}
                </button>
                {!isEditMode && (
                    <p className="tertiary-action">
                        {t('signup.go_to_login_prompt')}{' '}
                        <Link to="/login" className="form-link">{t('signup.go_to_login_link')}</Link>
                    </p>
                )}
            </footer>
        </div>
    );
};

export default SignUpPage;