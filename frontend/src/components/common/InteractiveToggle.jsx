import React from 'react';
import './InteractiveToggle.css';

const InteractiveToggle = ({ options, activeOption, onToggle }) => {
    const activeIndex = options.findIndex(opt => opt === activeOption);

    const containerClass = `interactive-toggle active-index-${activeIndex}`;

    return (
        <div className={containerClass}>
            <div className="toggle-glider"></div>
  
            {options.map((option, index) => (
                <button
                    key={option}
                    className={`toggle-option ${activeIndex === index ? 'active' : ''}`}
                    onClick={() => onToggle(option)}
                    aria-pressed={activeIndex === index}
                >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
            ))}
        </div>
    );
};

export default InteractiveToggle;