import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import { FaPaperPlane} from 'react-icons/fa'; 
import './ChatPage.css';
import { useAuth } from '../context/AuthContext'; 
import CustomIcon from '../components/common/CustomIcon';
import ConfirmationModal from '../components/common/ConfirmationModal';

const ChatPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth(); 
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [isIndexing, setIsIndexing] = useState(false);
    const [indexStatus, setIndexStatus] = useState('');

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const isFirstMessage = messages.length === 0;
        const newUserMessage = { sender: 'user', text: input };
        const updatedMessages = [...messages, newUserMessage]; 
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/chat', {
                message: input,
                history: updatedMessages.slice(0, -1),
                lang: i18n.language,
                is_first_message: isFirstMessage
            });

            const botMessage = { sender: 'bot', text: response.data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chat API error:", error);
            const errorMessage = { sender: 'bot', text: t('chat.error_message') };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReindexClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmReindex = async () => {
        setIsConfirmModalOpen(false); 
        setIsIndexing(true);
        setIndexStatus("Updating AI knowledge base... This may take a minute.");
        try {
            const response = await apiClient.post('/chat/reindex');
            setIndexStatus(response.data.message + " The chat is now up-to-date.");
        } catch (error) {
            console.error("AI Re-index failed", error);
            setIndexStatus("An error occurred during the update. Please check the server logs.");
        } finally {
            setTimeout(() => {
                setIsIndexing(false);
                setIndexStatus('');
            }, 5000); 
        }
    };

    useEffect(() => {
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.classList.add('chat-active');
        }

        return () => {
            if (contentWrapper) {
                contentWrapper.classList.remove('chat-active');
            }
        };
    }, []);

    const hasStarted = messages.length > 0;

    

    return (
        <>
            <div className={`chat-page-container ${hasStarted ? 'started' : 'initial'}`}>
                {!hasStarted && (
                    <div className="welcome-header">
                        <h1>{t('chat.welcome_header', { name: user?.name.split(' ')[0] || 'User' })}</h1>
                        <div 
                            className="welcome-logo-container" 
                            onClick={handleReindexClick} 
                            title="Update Controly's Knowledge"
                        >
                            <CustomIcon 
                                iconName="controly" 
                                className={`welcome-logo-icon ${isIndexing ? 'spinning' : ''}`}
                            />
                        </div>
                    </div>
                )}
                <div className="chat-window">
                    {hasStarted && (
                        <div className="messages-area">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message-bubble ${msg.sender}`}>
                                    <p>{msg.text}</p>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message-bubble bot typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                    <form className="input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('chat.input_placeholder')}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()}>
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmReindex}
                title={t('chat.confirm_reindex_title')}
                message={t('chat.confirm_reindex_message')}
                confirmText={t('chat.confirm_reindex_button')}
                cancelText={t('chat.cancel_button')}
                isConfirming={isIndexing}
            />
        </>
    );
};

export default ChatPage;