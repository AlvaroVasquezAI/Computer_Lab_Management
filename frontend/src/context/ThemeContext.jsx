import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the context
export const ThemeContext = createContext();

// Function to get the initial theme from localStorage or system preference
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  // Optional: Check user's system preference
  // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  //   return 'dark';
  // }
  return 'light'; // Default to light mode
};

// 2. Create the provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // 3. This effect runs whenever the theme changes
  useEffect(() => {
    // Update the data-theme attribute on the body element
    document.body.setAttribute('data-theme', theme);
    // Save the theme preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 4. Custom hook for easy access to the context
export const useTheme = () => {
  return useContext(ThemeContext);
};