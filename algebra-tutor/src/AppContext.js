// src/context/AppContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const AppContext = createContext();

// Custom hook for using the context
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [questions, setQuestions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // Fetch categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_categories&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                setCategories(data.data);
            } else {
                throw new Error(data.data.message || 'Failed to fetch categories');
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch questions
    const fetchQuestions = async (filters = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                action: 'algebra_tutor_get_questions',
                nonce: algebraTutorData.nonce,
                ...filters
            });

            const response = await fetch(`${algebraTutorData.ajaxUrl}?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setQuestions(data.data);
            } else {
                throw new Error(data.data.message || 'Failed to fetch questions');
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add notification
    const addNotification = (message, type = 'info', autoClose = true) => {
        const id = Date.now();
        const notification = { id, message, type };
        setNotifications(prev => [...prev, notification]);

        if (autoClose) {
            setTimeout(() => {
                removeNotification(id);
            }, 5000);
        }

        return id;
    };

    // Remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Initial data fetch
    useEffect(() => {
        fetchCategories();
    }, []);

    // Value for the context provider
    const contextValue = {
        questions,
        categories,
        results,
        loading,
        error,
        notifications,
        fetchQuestions,
        fetchCategories,
        setQuestions,
        setCategories,
        setResults,
        setLoading,
        setError,
        addNotification,
        removeNotification
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};