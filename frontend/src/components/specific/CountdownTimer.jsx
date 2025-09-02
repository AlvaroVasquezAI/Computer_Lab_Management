import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/api';
import { FaFilePdf } from 'react-icons/fa';
import PracticeDetailModal from './PracticeDetailModal';

const CountdownTimer = ({ onTimerEnd }) => {
    const { t } = useTranslation();
    const [nextPractice, setNextPractice] = useState(null);
    const [timeLeft, setTimeLeft] = useState({});
    const [loading, setLoading] = useState(true);

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    useEffect(() => {
        apiClient.get('/dashboard/next-practice')
            .then(res => {
                setNextPractice(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch next practice", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!nextPractice) return;

        const timer = setInterval(() => {
            const targetDate = new Date(`${nextPractice.practice_date}T${nextPractice.start_time}`);
            const now = new Date();
            const difference = targetDate - now;

            if (difference > 1000) { 
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
                if (onTimerEnd) {
                    onTimerEnd();
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextPractice, onTimerEnd]);

    const handlePreviewClick = () => {
        setIsPdfModalOpen(true);
    };

    if (loading) return <p>Loading...</p>;
    if (!nextPractice) {
        return (
            <div className="no-practice-container">
                <p>{t('dashboard.no_upcoming_practices')}</p>
            </div>
        );
    }

    const practiceDetailsForModal = {
        practice_id: nextPractice.practice_id, 
        title: nextPractice.title,
        subject_name: '', 
        description: '',
        bookings: []
    };

    return (
        <>
            <div className="countdown-container">
                <div className="countdown-timers">
                    <div className="timer-segment"><span>{timeLeft.days || '0'}</span><small>{t('dashboard.countdown.days')}</small></div>
                    <div className="timer-segment"><span>{timeLeft.hours || '0'}</span><small>{t('dashboard.countdown.hours')}</small></div>
                    <div className="timer-segment"><span>{timeLeft.minutes || '0'}</span><small>{t('dashboard.countdown.minutes')}</small></div>
                    <div className="timer-segment"><span>{timeLeft.seconds || '0'}</span><small>{t('dashboard.countdown.seconds')}</small></div>
                </div>

                <div className="practice-info">
                    <h4>{nextPractice.title}</h4>
                    <p>
                        {t('dashboard.countdown_with_group')} <strong>{nextPractice.group_name}</strong> {t('dashboard.countdown_on_date')} {new Date(nextPractice.practice_date + 'T00:00:00').toLocaleDateString()}
                    </p>
                    <button className="preview-button-countdown" onClick={handlePreviewClick}>
                        <FaFilePdf /> {t('dashboard.preview_file_button')}
                    </button>
                </div>
            </div>

            {isPdfModalOpen && (
                <PracticeDetailModal
                    details={practiceDetailsForModal}
                    onClose={() => setIsPdfModalOpen(false)}
                    startInPreviewMode={true}
                />
            )}
        </>
    );
};

export default CountdownTimer;