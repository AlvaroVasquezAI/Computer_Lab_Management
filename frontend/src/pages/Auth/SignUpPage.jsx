import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './SignUpPage.css';

import DetailsForm from '../../components/specific/DetailsForm'; 
import SubjectManager from '../../components/specific/SubjectManager';
import SubjectSummaryCard from '../../components/specific/SubjectSummaryCard';

const SignUpPage = ({ isEditMode = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { teacherId } = useParams();

    const [teacherDetails, setTeacherDetails] = useState({ name: '', email: '', password: '', role: 'teacher' });

     const [validation, setValidation] = useState({
        name: { status: 'idle', message: '' }, 
        email: { status: 'idle', message: '' },
        password: { status: 'idle', message: '' },
    });

    const emailCheckTimeout = useRef(null);

    const [subjects, setSubjects] = useState([]);
    const [healthStatuses, setHealthStatuses] = useState([]);
    
    const [existingSubjects, setExistingSubjects] = useState([]);
    const [existingGroups, setExistingGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [apiError, setApiError] = useState('');
    
    const [editingSubjectIndex, setEditingSubjectIndex] = useState(null);
    const [editingSubjectData, setEditingSubjectData] = useState(null);
    
    const [managerKey, setManagerKey] = useState(0);

    const teacherBusySlots = useMemo(() => {
        const busySlots = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        subjects.forEach((subject, subjectIndex) => {
            if (isEditMode && subjectIndex === editingSubjectIndex) {
                return;
            }
            subject.groups.forEach(group => {
                group.schedule.forEach(slot => {
                    if (busySlots[slot.day_of_week]) { 
                        busySlots[slot.day_of_week].push({
                            start_time: slot.start_time,
                            end_time: slot.end_time
                        });
                    }
                });
            });
        });
        return busySlots;
    }, [subjects, editingSubjectIndex, isEditMode]);

    const isSubmitDisabled = useMemo(() => {
        const passwordIsValid = isEditMode || validation.password.status === 'valid';

        const detailsAreValid = validation.name.status === 'valid' &&
                                validation.email.status === 'valid' &&
                                passwordIsValid;
        
        const hasSubjects = subjects.length > 0;

        const isEditingSubject = editingSubjectIndex !== null;

        return !detailsAreValid || !hasSubjects || isEditingSubject;
    }, [validation, subjects, isEditMode, editingSubjectIndex]);

    const validateField = useCallback(async (fieldName, value) => {
        let status = 'invalid';
        let message = '';

        if (fieldName === 'name') {
            if (value.trim() === '') {
                message = t('validation.required');
            } else {
                status = 'valid';
            }
        }

        if (fieldName === 'password' && !isEditMode) {
            if (value.length < 4) {
                message = t('validation.password_short');
            } else {
                status = 'valid';
            }
        }

        if (fieldName === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                message = t('validation.email_invalid');
            } else {
                clearTimeout(emailCheckTimeout.current);
                emailCheckTimeout.current = setTimeout(async () => {
                    try {
                        const response = await apiClient.get(`/auth/check-email?email=${value}`);
                        if (response.data.exists) {
                            setValidation(prev => ({ ...prev, email: { status: 'invalid', message: t('validation.email_in_use') } }));
                        } else {
                            setValidation(prev => ({ ...prev, email: { status: 'valid', message: '' } }));
                        }
                    } catch (error) {
                        console.error("Email check failed", error);
                    }
                }, 500);
                status = 'valid'; 
            }
        }
        setValidation(prev => ({ ...prev, [fieldName]: { status, message } }));
    }, [t, isEditMode]);

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
            setPageLoading(true);
            apiClient.get(`/admin/teachers/${teacherId}/onboarding-data`)
                .then(response => {
                    const data = response.data;
                    setTeacherDetails({
                        name: data.teacher_name,
                        email: data.email,
                        password: '', 
                        role: data.role,
                    });
                    setSubjects(data.subjects);

                    setValidation(prev => ({
                        ...prev,
                        name: { status: 'valid', message: '' },
                        email: { status: 'valid', message: '' },
                    }));
                })
                .catch(err => {
                    console.error("Failed to fetch teacher data for editing", err);
                })
                .finally(() => {
                    setPageLoading(false);
                });
        }
    }, [isEditMode, teacherId]);

    useEffect(() => {
        const statuses = subjects.map((subject, index) => {
            let status = 'ok';
            let message = '';

            for (const group of subject.groups) {
                const practiceSessions = group.schedule.filter(s => s.schedule_type === 'PRACTICE');
                if (practiceSessions.length > 1) {
                    status = 'error';
                    message = `Group '${group.group_name}' has more than one practice session.`;
                    break; 
                }
            }
            return { status, message, isActive: index === editingSubjectIndex };
        });
        setHealthStatuses(statuses);
    }, [subjects, editingSubjectIndex]);

    const handleAddOrUpdateSubject = (subjectData) => {
        if (editingSubjectIndex !== null) {
            const updatedSubjects = subjects.map((subj, index) => 
                index === editingSubjectIndex ? subjectData : subj
            );
            setSubjects(updatedSubjects);
        } else {
            setSubjects(prevSubjects => [...prevSubjects, subjectData]);
        }
        setEditingSubjectIndex(null);
        setEditingSubjectData(null);
        setManagerKey(prevKey => prevKey + 1);
    };

    const handleDeleteSubject = (indexToDelete) => {
        setSubjects(subjects.filter((_, index) => index !== indexToDelete));
    };

    const handleEditSubject = (indexToEdit) => {
        setEditingSubjectIndex(indexToEdit);
        setEditingSubjectData(subjects[indexToEdit]);
        setManagerKey(prevKey => prevKey + 1);
        document.querySelector('.right-column').scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        validateField('name', teacherDetails.name);
        validateField('email', teacherDetails.email);
        if (!isEditMode) {
            validateField('password', teacherDetails.password);
        }

        const isFormValid = validation.name.status === 'valid' &&
                            validation.email.status === 'valid' &&
                            (isEditMode || validation.password.status === 'valid');

        if (!isFormValid) {
            setApiError("Please fix the errors before submitting.");
            return;
        }

        if (!teacherDetails.name || !teacherDetails.email) {
            alert("Please fill in teacher's name and email.");
            return;
        }
        if (subjects.length === 0) {
            alert("Please add at least one subject.");
            return;
        }
        setLoading(true);
        setApiError('');

        try {
            if (isEditMode) {
                const updatePayload = {
                    teacher_name: teacherDetails.name,
                    email: teacherDetails.email,
                    role: teacherDetails.role,
                    subjects: subjects,
                };
                await apiClient.put(`/admin/teachers/${teacherId}`, updatePayload);
                navigate(`/admin/teacher/${teacherId}`);
            } else {
                if (!teacherDetails.password) {
                    alert("Please provide a password for the new teacher.");
                    setLoading(false);
                    return;
                }
                const createPayload = {
                    teacher_name: teacherDetails.name,
                    email: teacherDetails.email,
                    password: teacherDetails.password,
                    subjects: subjects,
                };
                await apiClient.post('/onboarding/teacher', createPayload);
                const loginResponse = await apiClient.post('/auth/login', {
                    email: teacherDetails.email,
                    password: teacherDetails.password,
                });
                login(loginResponse.data.access_token);
                navigate('/home'); 
            }
        } catch (error) {
            console.error("Operation failed", error);
            const errorDetail = error.response?.data?.detail;
            
            if (typeof errorDetail === 'object' && errorDetail.key) {
                setApiError(t(errorDetail.key, errorDetail.params));
            } else if (typeof errorDetail === 'string') {
                setApiError(errorDetail);
            } else {
                setApiError("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <p>{t('signup.loading_teacher_data')}</p>;
    }

    return (
        <div className="signup-page">
            <header className="signup-header">
                <h1>
                    {isEditMode 
                        ? t('signup.edit_teacher_title', { name: teacherDetails.name }) 
                        : t('signup.title')}
                </h1>
            </header>
            <div className="signup-grid">
                <div className="left-column">
                    <DetailsForm 
                        details={teacherDetails} 
                        setDetails={setTeacherDetails} 
                        isEditMode={isEditMode}
                        validation={validation}
                        onValidate={validateField} 
                    />
                    
                    <div className="subject-card-list">
                        {subjects.map((subject, index) => (
                            <SubjectSummaryCard
                                key={index}
                                subject={subject}
                                index={index}
                                onEdit={handleEditSubject}
                                onDelete={handleDeleteSubject}
                                healthStatus={healthStatuses[index] || { status: 'ok', message: '', isActive: false }}
                            />
                        ))}
                    </div>
                </div>
                <div className="right-column">
                    <SubjectManager 
                        key={managerKey}
                        existingSubjects={existingSubjects}
                        existingGroups={existingGroups}
                        onAddSubject={handleAddOrUpdateSubject}
                        initialData={editingSubjectData}
                        teacherIdForEdit={isEditMode ? teacherId : null} 
                        teacherTempSchedule={teacherBusySlots} 
                    />
                </div>
            </div>
            <footer className="signup-footer">
                {apiError && <p className="error-message" style={{ marginBottom: '15px' }}>{apiError}</p>}
                
                <button onClick={handleSubmit} className="button-primary submit-button" disabled={loading || isSubmitDisabled}>
                    {loading ? '...' : (isEditMode ? t('admin_page.save_changes_button') : t('signup.save_changes_button'))}
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