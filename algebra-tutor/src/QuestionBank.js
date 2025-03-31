// src/components/QuestionBank/QuestionBank.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import QuestionPreview from '../QuestionPreview/QuestionPreview';
import './QuestionBank.css';

const QuestionBank = () => {
    const { fetchQuestions, categories, loading, addNotification } = useAppContext();
    const [questions, setQuestions] = useState([]);
    const [filters, setFilters] = useState({
        category: '',
        difficulty: '',
        type: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        perPage: 20,
        totalItems: 0
    });
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [previewQuestion, setPreviewQuestion] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Question types and difficulty levels
    const questionTypes = {
        multiple: 'Multiple Choice',
        fill: 'Fill-in-the-blank'
    };

    const difficultyLevels = {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard'
    };

    // Load questions on component mount and filter changes
    useEffect(() => {
        const getQuestions = async () => {
            try {
                const response = await fetch(
                    `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_questions&nonce=${algebraTutorData.nonce}&page=${pagination.currentPage}&per_page=${pagination.perPage}&category=${filters.category}&difficulty=${filters.difficulty}&type=${filters.type}&search=${filters.search}`
                );
                const data = await response.json();

                if (data.success) {
                    setQuestions(data.data.questions);
                    setPagination({
                        ...pagination,
                        totalPages: Math.ceil(data.data.total / pagination.perPage),
                        totalItems: data.data.total
                    });
                } else {
                    throw new Error(data.data.message || 'Failed to fetch questions');
                }
            } catch (err) {
                console.error('Error fetching questions:', err);
                addNotification(`Error: ${err.message}`, 'error');
            }
        };

        getQuestions();
    }, [filters, pagination.currentPage, pagination.perPage]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        // Filter is automatically applied by the useEffect
    };

    // Handle bulk selection
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedQuestions(questions.map(q => q.id));
        } else {
            setSelectedQuestions([]);
        }
    };

    // Handle individual question selection
    const handleSelectQuestion = (e, questionId) => {
        if (e.target.checked) {
            setSelectedQuestions(prev => [...prev, questionId]);
        } else {
            setSelectedQuestions(prev => prev.filter(id => id !== questionId));
        }
    };

    // Handle bulk actions
    const handleBulkAction = async (e) => {
        e.preventDefault();
        const action = e.target.question_action.value;

        if (action === 'delete' && selectedQuestions.length > 0) {
            if (window.confirm(`Are you sure you want to delete the selected ${selectedQuestions.length} questions? This action cannot be undone.`)) {
                try {
                    const response = await fetch(algebraTutorData.ajaxUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            action: 'algebra_tutor_bulk_delete_questions',
                            nonce: algebraTutorData.nonce,
                            question_ids: JSON.stringify(selectedQuestions)
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Refresh the question list
                        setSelectedQuestions([]);
                        fetchQuestions({
                            page: pagination.currentPage,
                            per_page: pagination.perPage,
                            ...filters
                        });
                        addNotification(`${selectedQuestions.length} questions have been deleted.`, 'success');
                    } else {
                        throw new Error(data.data.message || 'Failed to delete questions');
                    }
                } catch (err) {
                    console.error('Error deleting questions:', err);
                    addNotification(`Error: ${err.message}`, 'error');
                }
            }
        }
    };

    // Handle question preview
    const handlePreview = async (questionId) => {
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_question&nonce=${algebraTutorData.nonce}&question_id=${questionId}`
            );
            const data = await response.json();

            if (data.success) {
                setPreviewQuestion(data.data);
                setShowPreviewModal(true);
            } else {
                throw new Error(data.data.message || 'Failed to fetch question details');
            }
        } catch (err) {
            console.error('Error fetching question details:', err);
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    // Handle question deletion
    const handleDelete = async (questionId) => {
        if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
            try {
                const response = await fetch(algebraTutorData.ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        action: 'algebra_tutor_delete_question',
                        nonce: algebraTutorData.nonce,
                        question_id: questionId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Remove the deleted question from the list
                    setQuestions(questions.filter(q => q.id !== questionId));
                    addNotification('Question deleted successfully.', 'success');
                } else {
                    throw new Error(data.data.message || 'Failed to delete question');
                }
            } catch (err) {
                console.error('Error deleting question:', err);
                addNotification(`Error: ${err.message}`, 'error');
            }
        }
    };

    // Pagination controls
    const handlePageChange = (page) => {
        setPagination({ ...pagination, currentPage: page });
    };

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

    return (
        <div className="question-bank">
            <h1 className="wp-heading-inline">Question Bank</h1>
            <Link to="/add-question" className="page-title-action">Add New Question</Link>

            <hr className="wp-header-end" />

            {/* Filters */}
            <div className="tablenav top">
                <form method="get" onSubmit={handleSearch}>
                    <div className="alignleft actions">
                        <select
                            name="category"
                            id="filter_category"
                            value={filters.category}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <select
                            name="difficulty"
                            id="filter_difficulty"
                            value={filters.difficulty}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Difficulties</option>
                            {Object.entries(difficultyLevels).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <select
                            name="type"
                            id="filter_type"
                            value={filters.type}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Types</option>
                            {Object.entries(questionTypes).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <input type="submit" className="button" value="Filter" />
                    </div>

                    <div className="alignright actions">
                        <label htmlFor="search" className="screen-reader-text">Search Questions</label>
                        <input
                            type="search"
                            id="search"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search questions..."
                        />
                        <input type="submit" className="button" value="Search" />
                    </div>
                </form>
            </div>

            {/* Bulk Actions */}
            <form onSubmit={handleBulkAction}>
                <div className="tablenav top">
                    <div className="alignleft actions bulkactions">
                        <label htmlFor="bulk-action-selector-top" className="screen-reader-text">Select bulk action</label>
                        <select name="question_action" id="bulk-action-selector-top">
                            <option value="-1">Bulk Actions</option>
                            <option value="delete">Delete</option>
                        </select>
                        <input type="submit" id="doaction" className="button action" value="Apply" />
                    </div>

                    {/* Pagination (top) */}
                    {renderPagination()}
                </div>

                {/* Questions Table */}
                <table className="wp-list-table widefat fixed striped questions-table">
                    <thead>
                    <tr>
                        <td className="manage-column column-cb check-column">
                            <input
                                type="checkbox"
                                id="cb-select-all-1"
                                onChange={handleSelectAll}
                                checked={selectedQuestions.length === questions.length && questions.length > 0}
                            />
                        </td>
                        <th scope="col" className="manage-column column-id">ID</th>
                        <th scope="col" className="manage-column column-question">Question</th>
                        <th scope="col" className="manage-column column-type">Type</th>
                        <th scope="col" className="manage-column column-category">Category</th>
                        <th scope="col" className="manage-column column-difficulty">Difficulty</th>
                        <th scope="col" className="manage-column column-actions">Actions</th>
                    </tr>
                    </thead>

                    <tbody id="the-list">
                    {loading ? (
                        <tr>
                            <td colSpan="7">Loading questions...</td>
                        </tr>
                    ) : questions.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center' }}>No questions found.</td>
                        </tr>
                    ) : (
                        questions.map(question => (
                            <tr key={question.id}>
                                <th scope="row" className="check-column">
                                    <input
                                        type="checkbox"
                                        name="question_ids[]"
                                        value={question.id}
                                        checked={selectedQuestions.includes(question.id)}
                                        onChange={(e) => handleSelectQuestion(e, question.id)}
                                    />
                                </th>
                                <td className="column-id">{question.id}</td>
                                <td className="column-question">
                                    {/* Truncate question text if too long */}
                                    {question.question.length > 80 ? `${question.question.substring(0, 80)}...` : question.question}
                                </td>
                                <td className="column-type">
                                    {questionTypes[question.question_type] || question.question_type}
                                </td>
                                <td className="column-category">{question.category}</td>
                                <td className="column-difficulty">
                    <span className={`difficulty-badge difficulty-${question.difficulty}`}>
                      {difficultyLevels[question.difficulty] || question.difficulty}
                    </span>
                                </td>
                                <td className="column-actions">
                                    <Link
                                        to={`/edit-question/${question.id}`}
                                        className="button button-small"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(question.id)}
                                        className="button button-small delete-question"
                                        data-question-id={question.id}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => handlePreview(question.id)}
                                        className="button button-small preview-question"
                                        data-question-id={question.id}
                                    >
                                        Preview
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>

                    <tfoot>
                    <tr>
                        <td className="manage-column column-cb check-column">
                            <input
                                type="checkbox"
                                id="cb-select-all-2"
                                onChange={handleSelectAll}
                                checked={selectedQuestions.length === questions.length && questions.length > 0}
                            />
                        </td>
                        <th scope="col" className="manage-column column-id">ID</th>
                        <th scope="col" className="manage-column column-question">Question</th>
                        <th scope="col" className="manage-column column-type">Type</th>
                        <th scope="col" className="manage-column column-category">Category</th>
                        <th scope="col" className="manage-column column-difficulty">Difficulty</th>
                        <th scope="col" className="manage-column column-actions">Actions</th>
                    </tr>
                    </tfoot>
                </table>

                {/* Pagination (bottom) */}
                <div className="tablenav bottom">
                    <div className="alignleft actions bulkactions">
                        <label htmlFor="bulk-action-selector-bottom" className="screen-reader-text">Select bulk action</label>
                        <select name="question_action" id="bulk-action-selector-bottom">
                            <option value="-1">Bulk Actions</option>
                            <option value="delete">Delete</option>
                        </select>
                        <input type="submit" id="doaction2" className="button action" value="Apply" />
                    </div>

                    {renderPagination()}
                </div>
            </form>

            {/* Question Preview Modal */}
            {showPreviewModal && previewQuestion && (
                <QuestionPreview
                    question={previewQuestion}
                    onClose={() => setShowPreviewModal(false)}
                />
            )}
        </div>
    );
};

export default QuestionBank;