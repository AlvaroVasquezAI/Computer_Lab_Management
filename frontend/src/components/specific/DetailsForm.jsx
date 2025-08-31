import React from 'react';
import { useTranslation } from 'react-i18next';

const DetailsForm = ({ details, setDetails, isEditMode = false }) => {
    const { t } = useTranslation();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="card details-form">
            <h3>{t('signup.details')}</h3>
            <input name="name" value={details.name} onChange={handleChange} placeholder={t('signup.name_placeholder')} />
            <input name="email" value={details.email} onChange={handleChange} placeholder={t('signup.email_placeholder')} type="email" />
            {!isEditMode && (
                <input name="password" value={details.password} onChange={handleChange} placeholder={t('signup.password_placeholder')} type="password" />
            )}
        </div>
    );
};

export default DetailsForm;