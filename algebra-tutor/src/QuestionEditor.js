// src/components/QuestionEditor/QuestionEditor.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import MathEditor from '../MathEditor/MathEditor';
import './QuestionEditor.css';

const QuestionEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { categories, addNotification } = useAppContext();
    const editorRef = useRef(null);
    const [isEditing, setIsEditing] = useState(!!id);
    const [activeTab, setActiveTab] = useState('question-tab');
    const [previewMode, setPreviewMode] = useState('desktop');
    const [autoSaveTimer, setAutoSaveTimer] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        question: '',
        questionType: 'multiple',
        category: '',
        difficulty: 'medium',
        choices: ['', '', '', ''],
        correctAnswer: '0',
        fillAnswers: []
    });
    const [loading, setLoading] = useState(false);
    const [showMathEditor, setShowMathEditor] = useState(false);
    const [mathContent, setMathContent] = useState('');
    const [mathInsertPosition, setMathInsertPosition] = useState(null);

    // Load question data if editing
    useEffect(() => {
        if (id) {
            fetchQuestion(id);
        }
    }, [id]);

    // Setup auto-save
    useEffect(() => {
        // Clear previous timer
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }

        // Set new auto-save timer (every 30 seconds)
        const timer = setInterval(() => {
            saveDraft();
        }, 30000);

        setAutoSaveTimer(timer);

        // Cleanup on component unmount
        return () => {
            if (autoSaveTimer) {
                clearInterval(autoSaveTimer);
            }
        };
    }, [formData]);

    // Initial load - try to restore draft
    useEffect(() => {
        if (!isEditing) {
            loadDraft();
        }
    }, []);

    // Fetch question details
    const fetchQuestion = async (questionId) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_question&nonce=${algebraTutorData.nonce}&question_id=${questionId}`
            );
            const data = await response.json();

            if (data.success) {
                const question = data.data;
                let choices = [];
                let correctAnswer = '0';
                let fillAnswers = [];

                // Parse choices for multiple choice questions
                if (question.question_type === 'multiple' && question.choices) {
                    try {
                        choices = JSON.parse(question.choices);
                    } catch (e) {
                        console.error('Error parsing choices:', e);
                        choices = question.choices.split(',');
                    }
                }

                // Parse correct answers for fill-in-the-blank questions
                if (question.question_type === 'fill' && question.correct_answer) {
                    try {
                        fillAnswers = JSON.parse(question.correct_answer);
                        if (!Array.isArray(fillAnswers)) {
                            fillAnswers = [question.correct_answer];
                        }
                    } catch (e) {
                        console.error('Error parsing fill answers:', e);
                        fillAnswers = [question.correct_answer];
                    }
                } else {
                    correctAnswer = question.correct_answer;
                }

                setFormData({
                    id: question.id,
                    question: question.question,
                    questionType: question.question_type,
                    category: question.category,
                    difficulty: question.difficulty,
                    choices: choices.length > 0 ? choices : ['', '', '', ''],
                    correctAnswer,
                    fillAnswers
                });
            } else {
                throw new Error(data.data.message || 'Failed to fetch question details');
            }
        } catch (err) {
            console.error('Error fetching question:', err);
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Save question draft
    const saveDraft = async () => {
        // Capture current question text from editor
        if (editorRef.current && typeof editorRef.current.getContent === 'function') {
            setFormData(prev => ({
                ...prev,
                question: editorRef.current.getContent()
            }));
        }

        try {
            const response = await fetch(algebraTutorData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'algebra_tutor_save_draft',
                    nonce: algebraTutorData.nonce,
                    draft: formData.question,
                    meta: JSON.stringify({
                        type: formData.questionType,
                        category: formData.category,
                        difficulty: formData.difficulty,
                        choices: formData.choices,
                        correctAnswer: formData.correctAnswer,
                        fillAnswers: formData.fillAnswers
                    })
                })
            });

            const data = await response.json();

            if (data.success) {
                setLastSaved(data.data.time);
            }
        } catch (err) {
            console.error('Error saving draft:', err);
        }
    };

    // Load question draft
    const loadDraft = async () => {
        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_load_draft&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success && data.data.content) {
                const meta = data.data.meta || {};
                setFormData({
                    id: '',
                    question: data.data.content,
                    questionType: meta.type || 'multiple',
                    category: meta.category || '',
                    difficulty: meta.difficulty || 'medium',
                    choices: meta.choices || ['', '', '', ''],
                    correctAnswer: meta.correctAnswer || '0',
                    fillAnswers: meta.fillAnswers || []
                });
            }
        } catch (err) {
            console.error('Error loading draft:', err);
        }
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle question type change
    const handleTypeChange = (e) => {
        const questionType = e.target.value;
        setFormData({ ...formData, questionType });

        // If switching to fill-in-the-blank, update answers
        if (questionType === 'fill') {
            updateFillAnswers();
        }
    };

    // Handle choices change for multiple choice questions
    const handleChoiceChange = (index, value) => {
        const choices = [...formData.choices];
        choices[index] = value;
        setFormData({ ...formData, choices });
    };

    // Handle correct answer change for multiple choice
    const handleCorrectAnswerChange = (e) => {
        setFormData({ ...formData, correctAnswer: e.target.value });
    };

    // Handle fill answer change
    const handleFillAnswerChange = (index, value) => {
        const fillAnswers = [...formData.fillAnswers];
        fillAnswers[index] = value;
        setFormData({ ...formData, fillAnswers });
    };

    // Add answer option for multiple choice
    const addAnswerOption = () => {
        setFormData({
            ...formData,
            choices: [...formData.choices, '']
        });
    };

    // Remove answer option for multiple choice
    const removeAnswerOption = (index) => {
        if (formData.choices.length <= 2) {
            addNotification('You need at least two answer options.', 'error');
            return;
        }

        const choices = formData.choices.filter((_, i) => i !== index);

        // Update correct answer if necessary
        let correctAnswer = formData.correctAnswer;
        const correctIndex = parseInt(correctAnswer, 10);

        if (correctIndex === index) {
            // If we're removing the correct answer, reset it
            correctAnswer = '0';
        } else if (correctIndex > index) {
            // If we're removing an option before the correct answer, adjust the index
            correctAnswer = (correctIndex - 1).toString();
        }

        setFormData({ ...formData, choices, correctAnswer });
    };

    // Shuffle answer options
    const shuffleAnswers = () => {
        const choices = [...formData.choices];
        const correctIndex = parseInt(formData.correctAnswer, 10);
        const correctChoice = choices[correctIndex];

        // Shuffle array
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        // Find the new index of the correct answer
        const newCorrectIndex = choices.indexOf(correctChoice);

        setFormData({
            ...formData,
            choices,
            correctAnswer: newCorrectIndex.toString()
        });
    };

    // Update fill-in-the-blank answers based on question text
    const updateFillAnswers = () => {
        if (!editorRef.current) return;

        const content = editorRef.current.getContent();
        const regex = /_{2,}/g;
        const matches = content.match(regex) || [];

        // Create or update fill answers array
        const fillAnswers = [...formData.fillAnswers];

        // Resize array to match number of blanks
        while (fillAnswers.length < matches.length) {
            fillAnswers.push('');
        }

        setFormData({ ...formData, fillAnswers: fillAnswers.slice(0, matches.length) });
    };

    // Add new category
    const addNewCategory = async () => {
        const newCategoryName = document.getElementById('new-category-name').value.trim();

        if (!newCategoryName) {
            addNotification('Category name is required.', 'error');
            return;
        }

        try {
            const response = await fetch(algebraTutorData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'algebra_tutor_add_category',
                    nonce: algebraTutorData.nonce,
                    category_name: newCategoryName
                })
            });

            const data = await response.json();

            if (data.success) {
                // Set the new category as selected
                setFormData({ ...formData, category: data.data.category_name });

                // Clear input and hide form
                document.getElementById('new-category-name').value = '';
                document.getElementById('add-category-form').style.display = 'none';

                addNotification('Category added successfully!', 'success');
            } else {
                throw new Error(data.data.message || 'Error adding category.');
            }
        } catch (err) {
            console.error('Error adding category:', err);
            addNotification(`Error: ${err.message}`, 'error');
        }
    };

    // Validate form
    const validateForm = () => {
        // Check if editor reference exists
        if (!editorRef.current) {
            addNotification('Editor not initialized.', 'error');
            return false;
        }

        // Get current content from editor
        const questionText = editorRef.current.getContent();

        if (!questionText.trim()) {
            addNotification('Question text is required.', 'error');
            return false;
        }

        if (!formData.category) {
            addNotification('Category is required.', 'error');
            return false;
        }

        // Validate based on question type
        if (formData.questionType === 'multiple') {
            // Check if all choices are filled
            const emptyChoices = formData.choices.some(choice => !choice.trim());
            if (emptyChoices) {
                addNotification('All answer options must be filled in.', 'error');
                return false;
            }

            // Check if a correct answer is selected
            if (formData.correctAnswer === null || formData.correctAnswer === undefined) {
                addNotification('You must select a correct answer.', 'error');
                return false;
            }
        } else if (formData.questionType === 'fill') {
            // Check if the question contains blanks
            if (!questionText.includes('__')) {
                addNotification('Fill-in-the-blank questions must contain at least one blank (__).', 'error');
                return false;
            }

            // Check if all blank answers are filled
            const emptyFillAnswers = formData.fillAnswers.some(answer => !answer.trim());
            if (emptyFillAnswers) {
                addNotification('All blank answers must be filled in.', 'error');
                return false;
            }
        }

        return true;
    };

    // Save question
    const saveQuestion = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Get current content from editor
            const questionText = editorRef.current.getContent();

            const questionData = {
                question: questionText,
                question_type: formData.questionType,
                category: formData.category,
                difficulty: formData.difficulty
            };

            // Add question-type specific data
            if (formData.questionType === 'multiple') {
                questionData.choices = formData.choices;
                questionData.correct_answer = formData.correctAnswer;
            } else if (formData.questionType === 'fill') {
                questionData.correct_answers = formData.fillAnswers;
            }

            // If editing, add question ID
            if (isEditing) {
                questionData.question_id = formData.id;
            }

            const response = await fetch(algebraTutorData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'algebra_tutor_save_question',
                    nonce: algebraTutorData.nonce,
                    data: JSON.stringify(questionData)
                })
            });

            const data = await response.json();

            if (data.success) {
                addNotification(data.data.message, 'success');

                // If adding a new question, clear the form
                if (!isEditing) {
                    clearForm();
                } else {
                    // If editing, update the question ID if needed
                    if (data.data.question_id) {
                        setFormData({ ...formData, id: data.data.question_id });
                    }
                }

                // Clear draft if adding a new question
                if (!isEditing) {
                    clearDraft();
                }
            } else {
                throw new Error(data.data.message || 'Error saving question.');
            }
        } catch (err) {
            console.error('Error saving question:', err);
            addNotification(`Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Clear form
    const clearForm = () => {
        if (window.confirm('Are you sure you want to clear the form?')) {
            // Reset editor content
            if (editorRef.current) {
                editorRef.current.setContent('');
            }

            // Reset form data
            setFormData({
                id: '',
                question: '',
                questionType: 'multiple',
                category: '',
                difficulty: 'medium',
                choices: ['', '', '', ''],
                correctAnswer: '0',
                fillAnswers: []
            });

            // Clear draft
            clearDraft();
        }
    };

    // Clear draft
    const clearDraft = async () => {
        try {
            await fetch(algebraTutorData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'algebra_tutor_save_draft',
                    nonce: algebraTutorData.nonce,
                    draft: '',
                    meta: JSON.stringify({})
                })
            });

            setLastSaved(null);
        } catch (err) {
            console.error('Error clearing draft:', err);
        }
    };

    // Handle tab navigation
    const switchTab = (tabId) => {
        setActiveTab(tabId);

        // Update preview when switching to preview tab
        if (tabId === 'preview-tab') {
            updatePreview();
        }
    };

    // Update preview
    const updatePreview = () => {
        // Logic to update the preview based on current question data
        // This would typically involve rendering the question as it would appear to students
    };

    // Handle editor init
    const handleEditorInit = (editor) => {
        editorRef.current = editor;

        // If in fill-in-the-blank mode, update answers when editor content changes
        editor.on('change', () => {
            if (formData.questionType === 'fill') {
                updateFillAnswers();
            }
        });
    };

    // Open math editor
    const openMathEditor = (displayMode = false) => {
        // Save the current cursor position
        if (editorRef.current) {
            setMathInsertPosition(editorRef.current.selection.getBookmark());
        }

        setMathContent('');
        setShowMathEditor(true);
    };

    // Save math formula
    const saveMathFormula = (latex, displayMode) => {
        if (!editorRef.current) return;

        // Create math element HTML
        const className = displayMode ? 'algebra-tutor-math math-block' : 'algebra-tutor-math math-inline';
        const formula = displayMode ? `\\[${latex}\\]` : `\\(${latex}\\)`;

        const mathHtml = `<span class="${className}" data-latex="${encodeLatex(latex)}">${formula}</span>`;

        // Restore cursor position and insert
        if (mathInsertPosition) {
            editorRef.current.selection.moveToBookmark(mathInsertPosition);
        }

        editorRef.current.insertContent(mathHtml);

        // Close math editor
        setShowMathEditor(false);
    };

    // Encode LaTeX for HTML attributes
    const encodeLatex = (latex) => {
        return latex.replace(/[\u00A0-\u9999<>&]/gim, i => '&#' + i.charCodeAt(0) + ';');
    };

    return (
        <div className="question-editor-container">
            <h1>{isEditing ? 'Edit Question' : 'Add New Question'}</h1>

            {/* Tabs */}
            <div className="nav-tab-wrapper">
                <a
                    href="#question-tab"
                    className={`nav-tab ${activeTab === 'question-tab' ? 'nav-tab-active' : ''}`}
                    onClick={() => switchTab('question-tab')}
                >
                    {isEditing ? 'Edit Question' : 'Add Question'}
                </a>
                <a
                    href="#formulas-tab"
                    className={`nav-tab ${activeTab === 'formulas-tab' ? 'nav-tab-active' : ''}`}
                    onClick={() => switchTab('formulas-tab')}
                >
                    Formula Library
                </a>
                <a
                    href="#preview-tab"
                    className={`nav-tab ${activeTab === 'preview-tab' ? 'nav-tab-active' : ''}`}
                    onClick={() => switchTab('preview-tab')}
                >
                    Preview
                </a>
            </div>

            {/* Question Editor Tab */}
            <div id="question-tab" className={`tab-content ${activeTab === 'question-tab' ? 'active' : ''}`}>
                <form id="add-question-form">
                    <input type="hidden" id="question_id" value={formData.id} />

                    <table className="form-table">
                        {/* Question Text */}
                        <tr>
                            <th scope="row"><label htmlFor="question">Question Text</label></th>
                            <td>
                                {/* TinyMCE Editor would go here */}
                                <div className="editor-container">
                                    {/* This is a placeholder for the TinyMCE editor */}
                                    <textarea
                                        id="question"
                                        name="question"
                                        value={formData.question}
                                        onChange={handleInputChange}
                                        rows={10}
                                        style={{ width: '100%' }}
                                    ></textarea>
                                    <button
                                        type="button"
                                        className="insert-math-button"
                                        onClick={() => openMathEditor(false)}
                                    >
                                        Insert Math Formula
                                    </button>
                                </div>
                                <p className="description">
                                    Enter your question text here. Use the "Math" button to add formulas.
                                    For fill-in-the-blank questions, use "__" (double underscore) to mark blanks.
                                </p>
                            </td>
                        </tr>

                        {/* Question Type */}
                        <tr>
                            <th scope="row">Question Type</th>
                            <td>
                                <div className="question-type-selector">
                                    <label className="question-type-option">
                                        <input
                                            type="radio"
                                            name="questionType"
                                            value="multiple"
                                            checked={formData.questionType === 'multiple'}
                                            onChange={handleTypeChange}
                                        />
                                        <span className="question-type-label">Multiple Choice</span>
                                        <span className="question-type-desc">Question with multiple options, one of which is correct.</span>
                                    </label>
                                    <label className="question-type-option">
                                        <input
                                            type="radio"
                                            name="questionType"
                                            value="fill"
                                            checked={formData.questionType === 'fill'}
                                            onChange={handleTypeChange}
                                        />
                                        <span className="question-type-label">Fill-in-the-blank</span>
                                        <span className="question-type-desc">Question with blanks that the student will fill in.</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        {/* Multiple Choice Answers */}
                        {formData.questionType === 'multiple' && (
                            <tr id="multiple_answers_container">
                                <th scope="row">Answer Options (Multiple Choice)</th>
                                <td>
                                    <div id="multiple-answers-fields" className="multiple-answers-container">
                                        {formData.choices.map((choice, index) => (
                                            <div key={index} className="multiple-answer-row">
                                                <label className="answer-option">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        value={index.toString()}
                                                        checked={formData.correctAnswer === index.toString()}
                                                        onChange={handleCorrectAnswerChange}
                                                    />
                                                    <span className="answer-radio-label">Correct answer</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="answer-text"
                                                    placeholder={`Option ${index + 1}`}
                                                    value={choice}
                                                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="answer-row-action"
                                                    title="Remove option"
                                                    data-action="remove"
                                                    onClick={() => removeAnswerOption(index)}
                                                >
                                                    -
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="answer-options-controls">
                                        <button
                                            type="button"
                                            id="add-answer-option"
                                            className="button"
                                            onClick={addAnswerOption}
                                        >
                                            Add Option
                                        </button>
                                        <button
                                            type="button"
                                            id="shuffle-answers"
                                            className="button"
                                            onClick={shuffleAnswers}
                                        >
                                            Shuffle Options
                                        </button>
                                    </div>
                                    <p className="description">
                                        Select the correct answer by clicking the radio button. You can add, remove, and reorder options.
                                    </p>
                                </td>
                            </tr>
                        )}

                        {/* Fill-in-the-blank Answers */}
                        {formData.questionType === 'fill' && (
                            <tr id="fill_answers_container">
                                <th scope="row"><label>Correct Answers (Fill-in-the-blank)</label></th>
                                <td>
                                    <div id="fill-answers-fields" className="fill-answers-container">
                                        {formData.fillAnswers.length > 0 ? (
                                            formData.fillAnswers.map((answer, index) => (
                                                <div key={index} className="blank-answer-row">
                                                    <div className="blank-number">Blank #{index + 1}:</div>
                                                    <input
                                                        type="text"
                                                        className="blank-answer-text"
                                                        placeholder={`Answer for blank ${index + 1}`}
                                                        value={answer}
                                                        onChange={(e) => handleFillAnswerChange(index, e.target.value)}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="add-alt-answer"
                                                        title="Add alternative answer"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-blanks-message">
                                                <p>No blanks found. Use "__" (double underscore) in your question text to create blanks.</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="description">
                                        Enter the correct answers for each blank in the question.
                                    </p>
                                </td>
                            </tr>
                        )}

                        {/* Category */}
                        <tr>
                            <th scope="row"><label htmlFor="category">Category</label></th>
                            <td>
                                <select
                                    name="category"
                                    id="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.map((cat, index) => (
                                        <option key={index} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <a
                                    href="#"
                                    id="show-add-category"
                                    className="add-new-category"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById('add-category-form').style.display = 'block';
                                    }}
                                >
                                    + Add New Category
                                </a>
                                <div id="add-category-form" style={{ display: 'none', marginTop: '10px' }}>
                                    <input
                                        type="text"
                                        id="new-category-name"
                                        placeholder="New category name"
                                    />
                                    <button
                                        type="button"
                                        id="add-new-category-btn"
                                        className="button"
                                        onClick={addNewCategory}
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        id="cancel-add-category"
                                        className="button"
                                        onClick={() => {
                                            document.getElementById('add-category-form').style.display = 'none';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </td>
                        </tr>

                        {/* Difficulty */}
                        <tr>
                            <th scope="row"><label>Difficulty Level</label></th>
                            <td>
                                <div className="difficulty-selector">
                                    <label className="difficulty-option">
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="easy"
                                            checked={formData.difficulty === 'easy'}
                                            onChange={handleInputChange}
                                        />
                                        <span className="difficulty-level difficulty-easy">Easy</span>
                                    </label>
                                    <label className="difficulty-option">
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="medium"
                                            checked={formData.difficulty === 'medium'}
                                            onChange={handleInputChange}
                                        />
                                        <span className="difficulty-level difficulty-medium">Medium</span>
                                    </label>
                                    <label className="difficulty-option">
                                        <input
                                            type="radio"
                                            name="difficulty"
                                            value="hard"
                                            checked={formData.difficulty === 'hard'}
                                            onChange={handleInputChange}
                                        />
                                        <span className="difficulty-level difficulty-hard">Hard</span>
                                    </label>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={saveQuestion}
                            disabled={loading}
                        >
                            {isEditing ? 'Update Question' : 'Save Question'}
                        </button>
                        <button
                            type="button"
                            id="preview-button"
                            className="button button-secondary"
                            onClick={() => switchTab('preview-tab')}
                        >
                            Preview
                        </button>
                        <button
                            type="button"
                            id="clear-form"
                            className="button button-secondary"
                            onClick={clearForm}
                        >
                            Clear Form
                        </button>
                        <div id="auto-save-status" className="auto-save-status">
                            Last draft saved: <span id="last-saved-time">{lastSaved || '-'}</span>
                        </div>
                    </div>
                </form>
            </div>

            {/* Formula Library Tab */}
            <div id="formulas-tab" className={`tab-content ${activeTab === 'formulas-tab' ? 'active' : ''}`}>
                <div id="math-formulas-library-container" className="math-library-wrapper">
                    {/* Formula library content will be rendered here */}
                    <h2>Math Formula Library</h2>
                    <p>Click on a formula to add it to your question.</p>

                    {/* Formula categories tabs will be here */}
                    <div className="formula-library-categories">
                        {/* Categories with formulas */}
                    </div>
                </div>
            </div>

            {/* Preview Tab */}
            <div id="preview-tab" className={`tab-content ${activeTab === 'preview-tab' ? 'active' : ''}`}>
                <div className="preview-controls">
                    <div className="preview-device-selector">
                        <button
                            type="button"
                            className={`preview-device-btn ${previewMode === 'desktop' ? 'active' : ''}`}
                            data-device="desktop"
                            onClick={() => setPreviewMode('desktop')}
                        >
                            Desktop
                        </button>
                        <button
                            type="button"
                            className={`preview-device-btn ${previewMode === 'tablet' ? 'active' : ''}`}
                            data-device="tablet"
                            onClick={() => setPreviewMode('tablet')}
                        >
                            Tablet
                        </button>
                        <button
                            type="button"
                            className={`preview-device-btn ${previewMode === 'mobile' ? 'active' : ''}`}
                            data-device="mobile"
                            onClick={() => setPreviewMode('mobile')}
                        >
                            Mobile
                        </button>
                    </div>
                    <button
                        type="button"
                        id="refresh-preview"
                        className="button"
                        onClick={updatePreview}
                    >
                        Refresh Preview
                    </button>
                </div>

                <div id="preview-container" className={`preview-container preview-${previewMode}`}>
                    <div className="preview-frame">
                        <div id="question-preview" className="question-preview">
                            <h3>Question Preview</h3>
                            <div id="preview-content" className="preview-content">
                                {/* Question content preview */}
                                <div dangerouslySetInnerHTML={{ __html: formData.question }} />
                            </div>
                            <div id="preview-answers" className="preview-answers">
                                {/* Answers preview */}
                                {formData.questionType === 'multiple' && (
                                    <div className="preview-multiple-choice">
                                        {formData.choices.map((choice, index) => (
                                            <div key={index} className="preview-answer-option">
                                                <label>
                                                    <input type="radio" name="preview_answer" />
                                                    <span>{choice}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" className="preview-submit-btn">Submit Answer</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Math Editor Modal */}
            {showMathEditor && (
                <MathEditor
                    initialLatex={mathContent}
                    onSave={saveMathFormula}
                    onCancel={() => setShowMathEditor(false)}
                />
            )}
        </div>
    );
};

export default QuestionEditor;