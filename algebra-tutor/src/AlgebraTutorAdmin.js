// src/AlgebraTutorAdmin.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import QuestionBank from './components/QuestionBank/QuestionBank';
import QuestionEditor from './components/QuestionEditor/QuestionEditor';
import Results from './components/Results/Results';
import Statistics from './components/Statistics/Statistics';
import Settings from './components/Settings/Settings';
import { AppProvider } from './context/AppContext';
import './AlgebraTutorAdmin.css';

const AlgebraTutorAdmin = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if WordPress is available
        if (typeof wp === 'undefined' || !wp.apiFetch) {
            setError('WordPress API is not available');
            setLoading(false);
            return;
        }

        // Initialize app
        const initApp = async () => {
            try {
                // Any initial data fetching can be done here
                setLoading(false);
            } catch (err) {
                console.error('Failed to initialize app:', err);
                setError('Failed to initialize the application');
                setLoading(false);
            }
        };

        initApp();
    }, []);

    if (loading) {
        return <div className="algebra-tutor-loading">Loading...</div>;
    }

    if (error) {
        return <div className="algebra-tutor-error">{error}</div>;
    }

    return (
        <AppProvider>
            <Router>
                <div className="algebra-tutor-admin">
                    <header className="admin-header">
                        <div className="logo">
                            <h1>Algebra Tutor</h1>
                        </div>
                        <nav className="main-nav">
                            <Link to="/dashboard">Dashboard</Link>
                            <Link to="/questions">Question Bank</Link>
                            <Link to="/add-question">Add Question</Link>
                            <Link to="/results">Results</Link>
                            <Link to="/statistics">Statistics</Link>
                            <Link to="/settings">Settings</Link>
                        </nav>
                    </header>

                    <main className="admin-content">
                        <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/questions" element={<QuestionBank />} />
                            <Route path="/add-question" element={<QuestionEditor />} />
                            <Route path="/edit-question/:id" element={<QuestionEditor />} />
                            <Route path="/results" element={<Results />} />
                            <Route path="/statistics" element={<Statistics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </main>

                    <footer className="admin-footer">
                        <p>Algebra Tutor Admin &copy; {new Date().getFullYear()}</p>
                    </footer>
                </div>
            </Router>
        </AppProvider>
    );
};

export default AlgebraTutorAdmin;