import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/api';
import { FaPaperPlane } from 'react-icons/fa';
import './ChatPage.css';
import { useAuth } from '../context/AuthContext'; 

const ChatPage = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth(); 
    const [messages, setMessages] = useState([]); 
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage = { sender: 'user', text: input };
        // Create the new history BEFORE the API call
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/chat', {
                message: input,
                history: updatedMessages, 
                lang: i18n.language
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
        <div className={`chat-page-container ${hasStarted ? 'started' : 'initial'}`}>
            {!hasStarted && (
                <div className="welcome-header">
                    <h1>{t('chat.welcome_header', { name: user?.name.split(' ')[0] || 'User' })}</h1>
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
    );
};

export default ChatPage;