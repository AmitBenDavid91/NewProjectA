// src/components/Results/Results.js
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import './Results.css';

const Results = () => {
    const { addNotification } = useAppContext();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        user_id: '',
        category: '',
        date_from: '',
        date_to: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        perPage: 20,
        totalItems: 0
    });
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [statistics, setStatistics] = useState({
        totalAttempts: 0,
        successRate: 0
    });

    // Fetch results on component mount and filter changes
    useEffect(() => {
        fetchResults();
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Fetch categories and users for filters
    useEffect(() => {
        fetchCategories();
        fetchUsers();
    }, []);

    // Fetch results from the server
    const fetchResults = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                action: 'algebra_tutor_get_results',
                nonce: algebraTutorData.nonce,
                page: pagination.currentPage,
                per_page: pagination.perPage,
                ...filters
            });

            const response = await fetch(`${algebraTutorData.ajaxUrl}?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setResults(data.data.results);
                setPagination({
                    ...pagination,
                    totalPages: Math.ceil(data.data.total / pagination.perPage),
                    totalItems: data.data.total
                });
                setStatistics({
                    totalAttempts: data.data.total,
                    successRate: data.data.success_rate
                });
            } else {
                throw new Error(data.data.message || 'Failed to fetch results');
            }
        } catch (err) {
            console.error('Error fetching results:', err);
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories for filter
    const fetchCategories = async () => {
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_categories&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                setCategories(data.data);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Fetch users with results
    const fetchUsers = async () => {
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_users_with_results&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                setUsers(data.data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
    };

    // Apply filters
    const applyFilters = (e) => {
        e.preventDefault();
        fetchResults();
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            user_id: '',
            category: '',
            date_from: '',
            date_to: ''
        });
    };

    // Pagination controls
    const handlePageChange = (page) => {
        setPagination({ ...pagination, currentPage: page });
    };

    // Render pagination controls
    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        return (
            <div className="tablenav-pages">
        <span className="displaying-num">
          {pagination.totalItems} items
        </span>
                <span className="pagination-links">
          <button
              className="first-page button"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(1)}
          >
            «
          </button>
          <button
              className="prev-page button"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            ‹
          </button>
          <span className="paging-input">
            <span className="tablenav-paging-text">
              {pagination.currentPage} of <span className="total-pages">{pagination.totalPages}</span>
            </span>
          </span>
          <button
              className="next-page button"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            ›
          </button>
          <button
              className="last-page button"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.totalPages)}
          >
            »
          </button>
        </span>
            </div>
        );
    };

    // Format user answer for display
    const formatUserAnswer = (answer, questionType) => {
        if (!answer) return '';

        if (questionType === 'fill') {
            // For fill-in-the-blank questions
            try {
                const answers = JSON.parse(answer);
                return Array.isArray(answers) ? answers.join(', ') : answer;
            } catch (e) {
                return answer;
            }
        }

        return answer;
    };

    return (
        <div className="results-page">
            <h1>Student Results</h1>

            <div className="results-filters">
                <form method="get" onSubmit={applyFilters}>
                    {/* Filters */}
                    <div className="filter-row">
                        <div className="filter-field">
                            <label htmlFor="user_id">Student:</label>
                            <select
                                name="user_id"
                                id="user_id"
                                value={filters.user_id}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Students</option>
                                {users.map((user, index) => (
                                    <option key={index} value={user.ID}>
                                        {user.display_name || `Guest User #${user.ID}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-field">
                            <label htmlFor="category">Category:</label>
                            <select
                                name="category"
                                id="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Categories</option>
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-field">
                            <label htmlFor="date_from">Date From:</label>
                            <input
                                type="date"
                                id="date_from"
                                name="date_from"
                                value={filters.date_from}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="filter-field">
                            <label htmlFor="date_to">Date To:</label>
                            <input
                                type="date"
                                id="date_to"
                                name="date_to"
                                value={filters.date_to}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="filter-actions">
                            <button type="submit" className="button button-primary">Apply Filters</button>
                            <button type="button" className="button" onClick={resetFilters}>Reset Filters</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Results Summary */}
            <div className="results-summary">
                <h2>Results Summary</h2>

                <div className="summary-stats">
                    <div className="stat-box">
                        <span className="stat-number">{statistics.totalAttempts}</span>
                        <span className="stat-label">Total Attempts</span>
                    </div>

                    <div className="stat-box">
                        <span className="stat-number">{statistics.successRate}%</span>
                        <span className="stat-label">Success Rate</span>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="results-table-container">
                {loading ? (
                    <div className="loading-indicator">Loading results...</div>
                ) : results.length === 0 ? (
                    <div className="no-results">
                        <p>No results found.</p>
                    </div>
                ) : (
                    <>
                        <table className="wp-list-table widefat fixed striped results-table">
                            <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Student</th>
                                <th>Question</th>
                                <th>Category</th>
                                <th>Difficulty</th>
                                <th>Answer</th>
                                <th>Result</th>
                            </tr>
                            </thead>
                            <tbody>
                            {results.map((result, index) => (
                                <tr key={index}>
                                    <td>{result.timestamp}</td>
                                    <td>
                                        {result.user_id > 0 ? (
                                            <a href="#" onClick={(e) => {
                                                e.preventDefault();
                                                setFilters({ ...filters, user_id: result.user_id });
                                            }}>
                                                {result.display_name || `User #${result.user_id}`}
                                            </a>
                                        ) : (
                                            'Guest User'
                                        )}
                                    </td>
                                    <td>
                                        {/* Truncate question text if too long */}
                                        {result.question.length > 100
                                            ? `${result.question.substring(0, 100)}...`
                                            : result.question}
                                    </td>
                                    <td>
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            setFilters({ ...filters, category: result.category });
                                        }}>
                                            {result.category}
                                        </a>
                                    </td>
                                    <td>
                      <span className={`difficulty difficulty-${result.difficulty}`}>
                        {result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1)}
                      </span>
                                    </td>
                                    <td>
                                        {formatUserAnswer(result.user_answer, result.question_type)}
                                    </td>
                                    <td>
                      <span className={`result-status status-${result.is_correct ? 'correct' : 'incorrect'}`}>
                        {result.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="tablenav">
                            {renderPagination()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Results;