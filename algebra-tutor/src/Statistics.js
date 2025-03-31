// src/components/Statistics/Statistics.js
import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Cell
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import './Statistics.css';

const Statistics = () => {
    const { addNotification } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState({
        totalQuestions: 0,
        totalCategories: 0,
        totalAttempts: 0,
        totalStudents: 0,
        successRate: 0
    });
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [dailyActivity, setDailyActivity] = useState([]);
    const [difficultyDistribution, setDifficultyDistribution] = useState([]);
    const [popularQuestions, setPopularQuestions] = useState([]);
    const [topStudents, setTopStudents] = useState([]);

    // Color schemes for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const DIFFICULTY_COLORS = {
        easy: '#4CAF50',
        medium: '#FF9800',
        hard: '#F44336'
    };

    // Fetch statistics on component mount
    useEffect(() => {
        fetchStatistics();
    }, []);

    // Fetch statistics from the server
    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_statistics&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                // Process and set data
                setOverview(data.data.overview);
                setCategoryPerformance(data.data.categoryPerformance);
                setDailyActivity(data.data.dailyActivity);
                setDifficultyDistribution(data.data.difficultyDistribution);
                setPopularQuestions(data.data.popularQuestions);
                setTopStudents(data.data.topStudents);
            } else {
                throw new Error(data.data.message || 'Failed to fetch statistics');
            }
        } catch (err) {
            console.error('Error fetching statistics:', err);
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="statistics-page">
            <h1>Statistics</h1>

            {loading ? (
                <div className="loading-indicator">Loading statistics...</div>
            ) : (
                <>
                    {/* Overview Section */}
                    <div className="stats-overview">
                        <div className="stats-section">
                            <h2>Overview</h2>

                            <div className="stats-boxes">
                                <div className="stats-box">
                                    <span className="stats-number">{overview.totalAttempts}</span>
                                    <span className="stats-label">Total Attempts</span>
                                </div>

                                <div className="stats-box">
                                    <span className="stats-number">{overview.successRate}%</span>
                                    <span className="stats-label">Overall Success Rate</span>
                                </div>

                                <div className="stats-box">
                                    <span className="stats-number">{overview.totalCategories}</span>
                                    <span className="stats-label">Categories</span>
                                </div>

                                <div className="stats-box">
                                    <span className="stats-number">{overview.totalQuestions}</span>
                                    <span className="stats-label">Total Questions</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Statistics Sections */}
                    <div className="stats-container">
                        <div className="stats-row">
                            {/* Category Performance */}
                            <div className="stats-column">
                                <div className="stats-card">
                                    <h3>Category Performance</h3>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={categoryPerformance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="category" />
                                                <YAxis yAxisId="left" orientation="left" />
                                                <YAxis yAxisId="right" orientation="right" />
                                                <Tooltip />
                                                <Legend />
                                                <Bar yAxisId="left" name="Success Rate (%)" dataKey="successRate" fill="#8884d8" />
                                                <Bar yAxisId="right" name="Attempts" dataKey="attempts" fill="#82ca9d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Question Difficulty Distribution */}
                            <div className="stats-column">
                                <div className="stats-card">
                                    <h3>Question Difficulty Distribution</h3>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={difficultyDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="count"
                                                    nameKey="difficulty"
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {difficultyDistribution.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={DIFFICULTY_COLORS[entry.difficulty] || COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value, name) => [value, name]} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="stats-row">
                            {/* Daily Activity */}
                            <div className="stats-column stats-column-full">
                                <div className="stats-card">
                                    <h3>Daily Activity (Last 30 Days)</h3>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={dailyActivity}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="attempts"
                                                    name="Number of Attempts"
                                                    stroke="#8884d8"
                                                    activeDot={{ r: 8 }}
                                                    strokeWidth={2}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="stats-row">
                            {/* Popular Questions */}
                            <div className="stats-column">
                                <div className="stats-card">
                                    <h3>Most Popular Questions</h3>
                                    <div className="data-table-container">
                                        <table className="wp-list-table widefat fixed striped">
                                            <thead>
                                            <tr>
                                                <th>Question</th>
                                                <th>Category</th>
                                                <th>Attempts</th>
                                                <th>Success Rate</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {popularQuestions.length > 0 ? (
                                                popularQuestions.map((question, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            {/* Truncate question text if too long */}
                                                            {question.question.length > 50
                                                                ? `${question.question.substring(0, 50)}...`
                                                                : question.question}
                                                        </td>
                                                        <td>{question.category}</td>
                                                        <td>{question.attempts}</td>
                                                        <td>
                                                            {question.successRate}%
                                                            <span className={`success-indicator ${
                                                                question.successRate >= 70 ? 'high' :
                                                                    question.successRate >= 40 ? 'medium' : 'low'
                                                            }`}></span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4">No data available</td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Top Students */}
                            <div className="stats-column">
                                <div className="stats-card">
                                    <h3>Top Students</h3>
                                    <div className="data-table-container">
                                        <table className="wp-list-table widefat fixed striped">
                                            <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Attempts</th>
                                                <th>Correct</th>
                                                <th>Success Rate</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {topStudents.length > 0 ? (
                                                topStudents.map((student, index) => (
                                                    <tr key={index}>
                                                        <td>{student.name}</td>
                                                        <td>{student.attempts}</td>
                                                        <td>{student.correct}</td>
                                                        <td>
                                                            {student.successRate}%
                                                            <span className={`success-indicator ${
                                                                student.successRate >= 70 ? 'high' :
                                                                    student.successRate >= 40 ? 'medium' : 'low'
                                                            }`}></span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4">No data available</td>
                                                </tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Statistics;