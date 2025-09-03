import React from 'react';
import './CustomIcon.css';

const CustomIcon = ({ iconName, className = '' }) => {
    const fullClassName = `custom-icon ${iconName}-icon ${className}`;
   
    return <div className={fullClassName}></div>;
};

export default CustomIcon;