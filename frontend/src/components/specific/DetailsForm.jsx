import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaLock, FaUnlock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const DetailsForm = ({ details, setDetails, isEditMode, validation, onValidate }) => {
    const { t } = useTranslation();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const processedValue = name === 'name' ? value.toUpperCase() : value;
        setDetails(prevDetails => ({
            ...prevDetails,
            [name]: processedValue
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        onValidate(name, value);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prevState => !prevState);
    };

    const ValidationIcon = ({ status }) => {
        if (status === 'valid') {
            return <FaCheckCircle className="validation-icon valid" />;
        }
        if (status === 'invalid') {
            return <FaTimesCircle className="validation-icon invalid" />;
        }
        return null;
    };

    return (
        <div className="card details-form-card">
            <div className="input-group">
                <div className="input-with-icon">
                    <FaUser className="input-icon" />
                    <input
                        type="text"
                        name="name"
                        value={details.name}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder={t('signup.name_placeholder')}
                        required
                    />
                    <ValidationIcon status={validation.name.status} />
                </div>
                {validation.name.status === 'invalid' && <p className="error-text-validation">{validation.name.message}</p>}
            </div>
            <div className="input-group">
                <div className="input-with-icon">
                    <FaEnvelope className="input-icon" />
                    <input
                        type="email"
                        name="email"
                        value={details.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder={t('signup.email_placeholder')}
                        required
                    />
                    <ValidationIcon status={validation.email.status} />
                </div>
                {validation.email.status === 'invalid' && <p className="error-text-validation">{validation.email.message}</p>}
            </div>
            {!isEditMode && (
                <div className="input-group">
                    <div className="input-with-icon">
                        <button type="button" className="input-icon-button" onClick={togglePasswordVisibility}>
                            {isPasswordVisible ? <FaUnlock /> : <FaLock />}
                        </button>
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            name="password"
                            value={details.password}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            placeholder={t('signup.password_placeholder')}
                            required
                        />
                        <ValidationIcon status={validation.password.status} />
                    </div>
                    {validation.password.status === 'invalid' && <p className="error-text-validation">{validation.password.message}</p>}
                </div>
            )}
        </div>
    );
};

export default DetailsForm;