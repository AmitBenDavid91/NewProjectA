// src/components/Dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import './Dashboard.css';

const Dashboard = () => {
    const { loading, addNotification } = useAppContext();
    const [dashboardData, setDashboardData] = useState({
        stats: {
            totalQuestions: 0,
            totalCategories: 0,
            totalAttempts: 0,
            totalStudents: 0,
            successRate: 0
        },
        activityData: [],
        categoryPerformance: [],
        popularQuestions: [],
        topStudents: [],
        recentActivity: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_dashboard_data&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                setDashboardData(data.data);
            } else {
                throw new Error(data.data.message || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    const refreshDashboard = async () => {
        try {
            await fetchDashboardData();
            addNotification('Dashboard refreshed successfully!', 'success');
        } catch (err) {
            addNotification(`Error refreshing dashboard: ${err.message}`, 'error');
        }
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>

            <div className="dashboard-controls">
                <div className="date-filter">
                    <form>
                        <div className="date-range">
                            <label htmlFor="date_from">From:</label>
                            <input type="date" id="date_from" name="date_from" className="dashboard-date-picker" />

                            <label htmlFor="date_to">To:</label>
                            <input type="date" id="date_to" name="date_to" className="dashboard-date-picker" />

                            <button type="submit" className="button">Filter</button>
                        </div>

                        <div className="quick-filters">
                            <button type="button" className="quick-date-filter" data-period="7days">Last 7 Days</button>
                            <button type="button" className="quick-date-filter" data-period="30days">Last 30 Days</button>
                            <button type="button" className="quick-date-filter" data-period="month">This Month</button>
                            <button type="button" className="quick-date-filter" data-period="quarter">This Quarter</button>
                            <button type="button" className="quick-date-filter" data-period="year">This Year</button>
                        </div>
                    </form>
                </div>

                <div className="dashboard-actions">
                    <button onClick={refreshDashboard} className="button button-primary">Refresh Data</button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="dashboard-overview">
                <div className="stats-boxes">
                    <div className="stats-box">
                        <span id="stat-total-questions" className="stats-number">{dashboardData.stats.totalQuestions}</span>
                        <span className="stats-label">Total Questions</span>
                    </div>

                    <div className="stats-box">
                        <span id="stat-total-categories" className="stats-number">{dashboardData.stats.totalCategories}</span>
                        <span className="stats-label">Categories</span>
                    </div>

                    <div className="stats-box">
                        <span id="stat-total-attempts" className="stats-number">{dashboardData.stats.totalAttempts}</span>
                        <span className="stats-label">Total Attempts</span>
                    </div>

                    <div className="stats-box">
                        <span id="stat-total-students" className="stats-number">{dashboardData.stats.totalStudents}</span>
                        <span className="stats-label">Students</span>
                    </div>

                    <div className="stats-box">
                        <span id="stat-success-rate" className="stats-number">{dashboardData.stats.successRate}%</span>
                        <span className="stats-label">Success Rate</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Widgets */}
            <div className="dashboard-widgets">
                {/* Activity Chart */}
                <div className="dashboard-card" data-widget-id="activity-chart">
                    <div className="card-header">
                        <h3>Activity Last 7 Days</h3>
                    </div>
                    <div className="card-content">
                        <div className="dashboard-chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={dashboardData.activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="attempts" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Category Performance */}
                <div className="dashboard-card" data-widget-id="category-performance">
                    <div className="card-header">
                        <h3>Category Performance</h3>
                    </div>
                    <div className="card-content">
                        <div className="dashboard-chart">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dashboardData.categoryPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="successRate" name="Success Rate (%)" fill="#8884d8" />
                                    <Bar yAxisId="right" dataKey="attempts" name="Attempts" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Popular Questions */}
                <div className="dashboard-card" data-widget-id="popular-questions">
                    <div className="card-header">
                        <h3>Popular Questions</h3>
                    </div>
                    <div className="card-content">
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
                            {dashboardData.popularQuestions.length > 0 ? (
                                dashboardData.popularQuestions.map((question, index) => (
                                    <tr key={index}>
                                        <td>
                                            {question.question}
                                            <div className="row-actions">
                          <span className="edit">
                            <a href={`./edit-question/${question.id}`}>Edit</a>
                          </span>
                                                <span className="view">
                            | <a href="#" className="preview-question" data-question-id={question.id}>Preview</a>
                          </span>
                                            </div>
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
                        <div className="view-all">
                            <a href="./questions" className="button button-small">View All Questions</a>
                        </div>
                    </div>
                </div>

                {/* Top Students */}
                <div className="dashboard-card" data-widget-id="top-students">
                    <div className="card-header">
                        <h3>Top Students</h3>
                    </div>
                    <div className="card-content">
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
                            {dashboardData.topStudents.length > 0 ? (
                                dashboardData.topStudents.map((student, index) => (
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
                        <div className="view-all">
                            <a href="./results" className="button button-small">View All Results</a>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="dashboard-card" data-widget-id="recent-activity">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="card-content">
                        <table id="recent-activity-table" className="wp-list-table widefat fixed striped">
                            <thead>
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Question</th>
                                <th>Result</th>
                            </tr>
                            </thead>
                            <tbody>
                            {dashboardData.recentActivity.length > 0 ? (
                                dashboardData.recentActivity.map((activity, index) => (
                                    <tr key={index}>
                                        <td>{activity.time}</td>
                                        <td>{activity.user}</td>
                                        <td>
                                            {activity.question}
                                            <div className="row-actions">
                          <span className="edit">
                            <a href={`./edit-question/${activity.questionId}`}>Edit</a>
                          </span>
                                            </div>
                                        </td>
                                        <td>
                        <span className={`status-${activity.isCorrect ? 'correct' : 'incorrect'}`}>
                          {activity.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No recent activity</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        <div className="view-all">
                            <a href="./results" className="button button-small">View All Activity</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;