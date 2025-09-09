import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const DetailsForm = ({ details, setDetails, isEditMode }) => {
    const { t } = useTranslation();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    return (
        <div className="card details-form-card">
            <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                    type="text"
                    name="name"
                    value={details.name}
                    onChange={handleInputChange}
                    placeholder={t('signup.name_placeholder')}
                    required
                />
            </div>
            <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input
                    type="email"
                    name="email"
                    value={details.email}
                    onChange={handleInputChange}
                    placeholder={t('signup.email_placeholder')}
                    required
                />
            </div>
            {!isEditMode && (
                <div className="input-with-icon">
                    <FaLock className="input-icon" />
                    <input
                        type="password"
                        name="password"
                        value={details.password}
                        onChange={handleInputChange}
                        placeholder={t('signup.password_placeholder')}
                        required
                    />
                </div>
            )}
        </div>
    );
};

export default DetailsForm;