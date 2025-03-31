/**
 * Enhanced Question Editor Interface
 * Implements a modern SPA-like experience without requiring React
 */
(function($) {
    'use strict';

    // Track application state
    const QuestionEditor = {
        state: {
            questionType: 'multiple',
            question: '',
            choices: [],
            correctAnswer: null,
            category: '',
            difficulty: 'medium',
            fillAnswers: [],
            previewMode: false,
            isDirty: false,
            saveInProgress: false,
            lastSaved: null
        },
        
        // Initialize the editor
        init: function() {
            this.cacheElements();
            this.bindEvents();
            this.restoreExistingData();
            this.setupAutoSave();
            this.setupMathEditor();
            
            // Initialize UI components
            this.initTabs();
            this.initSortable();
            this.initDragAndDrop();
            this.updateUI();
            
            // Show welcome message if this is a new question
            if (!$('#question_id').val()) {
                this.showWelcomeGuide();
            }
        },
        
        // Cache DOM elements for better performance
        cacheElements: function() {
            this.$form = $('#add-question-form');
            this.$questionTypeRadios = $('input[name="question_type"]');
            this.$questionTextarea = $('#new_question');
            this.$categorySelect = $('#category');
            this.$difficultyRadios = $('input[name="difficulty"]');
            this.$multipleContainer = $('#multiple_answers_container');
            this.$fillContainer = $('#fill_answers_container');
            this.$answerFields = $('#multiple-answers-fields');
            this.$fillFields = $('#fill-answers-fields');
            this.$previewContent = $('#preview-content');
            this.$previewAnswers = $('#preview-answers');
            this.$saveBtn = $('#submit');
            this.$previewBtn = $('#preview-button');
            this.$lastSavedSpan = $('#last-saved-time');
            this.$tabButtons = $('.nav-tab-wrapper a');
            this.$tabContents = $('.tab-content');
            this.$questionTabs = $('.question-tabs a');
        },
        
        // Bind all event listeners
        bindEvents: function() {
            const self = this;
            
            // Question type selection
            this.$questionTypeRadios.on('change', function() {
                self.state.questionType = $(this).val();
                self.updateQuestionTypeUI();
                self.state.isDirty = true;
            });
            
            // Form field changes
            this.$form.on('change', 'input, select, textarea', function() {
                self.state.isDirty = true;
            });
            
            // Add answer option
            $('#add-answer-option').on('click', function(e) {
                e.preventDefault();
                self.addAnswerOption();
            });
            
            // Remove answer option
            this.$answerFields.on('click', '.answer-row-action[data-action="remove"]', function() {
                self.removeAnswerOption($(this).closest('.multiple-answer-row'));
            });
            
            // Shuffle answers
            $('#shuffle-answers').on('click', function(e) {
                e.preventDefault();
                self.shuffleAnswers();
            });
            
            // Fill blank answers
            this.$fillFields.on('click', '.add-alt-answer', function() {
                self.addAlternateAnswer($(this).closest('.blank-answer-row'));
            });
            
            this.$fillFields.on('click', '.remove-alt-answer', function() {
                $(this).closest('.multiple-answers-input').remove();
            });
            
            // Tab navigation
            this.$tabButtons.on('click', function(e) {
                e.preventDefault();
                self.switchTab($(this).attr('href').substring(1));
            });
            
            // Question tab navigation (within the main question tab)
            this.$questionTabs.on('click', function(e) {
                e.preventDefault();
                self.switchQuestionTab($(this).attr('href').substring(1));
            });
            
            // Preview button
            this.$previewBtn.on('click', function(e) {
                e.preventDefault();
                self.generatePreview();
                self.switchTab('preview-tab');
            });
            
            // Save button
            this.$form.on('submit', function(e) {
                e.preventDefault();
                self.saveQuestion();
            });
            
            // Window beforeunload
            $(window).on('beforeunload', function() {
                if (self.state.isDirty) {
                    return 'You have unsaved changes. Are you sure you want to leave?';
                }
            });
            
            // Add category
            $('#add-new-category-btn').on('click', function(e) {
                e.preventDefault();
                self.addNewCategory();
            });
            
            // Monitor TinyMCE changes
            if (typeof tinyMCE !== 'undefined') {
                setTimeout(function() {
                    const editor = tinyMCE.get('new_question');
                    if (editor) {
                        editor.on('change', function() {
                            self.state.isDirty = true;
                            if (self.state.questionType === 'fill') {
                                self.updateFillBlanks();
                            }
                        });
                    }
                }, 1000);
            }
        },
        
        // Initialize tab navigation
        initTabs: function() {
            // Default to first tab
            this.$tabContents.hide();
            $(this.$tabContents[0]).show();
            
            // Set first question tab active
            $('.question-tab-content').hide();
            $('.question-tab-content:first').show();
            this.$questionTabs.first().addClass('active');
        },
        
        // Switch between main tabs
        switchTab: function(tabId) {
            // Remove active class from tabs
            this.$tabButtons.removeClass('nav-tab-active');
            $(`.nav-tab-wrapper a[href="#${tabId}"]`).addClass('nav-tab-active');
            
            // Hide all tab contents and show the selected one
            this.$tabContents.hide();
            $(`#${tabId}`).show();
            
            // Special handling for specific tabs
            if (tabId === 'preview-tab') {
                this.generatePreview();
            } else if (tabId === 'formulas-tab') {
                this.initFormulaLibrary();
            }
        },
        
        // Switch between question subtabs
        switchQuestionTab: function(tabId) {
            this.$questionTabs.removeClass('active');
            $(`.question-tabs a[href="#${tabId}"]`).addClass('active');
            
            $('.question-tab-content').hide();
            $(`#${tabId}`).show();
        },
        
        // Update UI based on question type
        updateQuestionTypeUI: function() {
            if (this.state.questionType === 'multiple') {
                this.$multipleContainer.show();
                this.$fillContainer.hide();
            } else {
                this.$multipleContainer.hide();
                this.$fillContainer.show();
                this.updateFillBlanks();
            }
        },
        
        // Make answer options sortable
        initSortable: function() {
            if ($.fn.sortable) {
                this.$answerFields.sortable({
                    items: '.multiple-answer-row',
                    handle: '.answer-option',
                    axis: 'y',
                    update: () => this.updateRadioValues()
                });
            }
        },
        
        // Initialize drag-and-drop for images and files
        initDragAndDrop: function() {
            const self = this;
            const $dropArea = $('#question-editor-dropzone');
            
            if (!$dropArea.length) return;
            
            $dropArea.on('dragover', function(e) {
                e.preventDefault();
                $(this).addClass('drag-over');
            });
            
            $dropArea.on('dragleave', function() {
                $(this).removeClass('drag-over');
            });
            
            $dropArea.on('drop', function(e) {
                e.preventDefault();
                $(this).removeClass('drag-over');
                
                const files = e.originalEvent.dataTransfer.files;
                if (files.length > 0) {
                    self.handleFileUpload(files);
                }
            });
        },
        
        // Handle file upload (for images, etc.)
        handleFileUpload: function(files) {
            const file = files[0]; // Only handle first file for now
            
            if (!file.type.match('image.*')) {
                this.showNotice('Only image files are supported for upload.', 'error');
                return;
            }
            
            // Create FormData object
            const formData = new FormData();
            formData.append('action', 'algebra_tutor_upload_image');
            formData.append('nonce', algebraTutorAdmin.nonce);
            formData.append('file', file);
            
            // Show upload progress
            this.showNotice('Uploading image...', 'info');
            
            // Send AJAX request
            $.ajax({
                url: algebraTutorAdmin.ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: (response) => {
                    if (response.success) {
                        // Get the URL of the uploaded image
                        const imageUrl = response.data.url;
                        
                        // Insert the image into the editor
                        if (tinyMCE && tinyMCE.activeEditor) {
                            tinyMCE.activeEditor.execCommand('mceInsertContent', false, 
                                `<img src="${imageUrl}" alt="${file.name}" />`);
                        }
                        
                        this.showNotice('Image uploaded successfully!', 'success');
                    } else {
                        this.showNotice(response.data.message || 'Error uploading image.', 'error');
                    }
                },
                error: () => {
                    this.showNotice('Error uploading image. Please try again.', 'error');
                }
            });
        },
        
        // Set up MathJax and math editing
        setupMathEditor: function() {
            // Make sure MathJax is initialized
            if (typeof MathJax !== 'undefined') {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
            }
            
            // Add convenience methods to insert common math
            $('#quick-math-sqrt').on('click', function() {
                AlgebraTutorMathEditor.insertCommand('\\sqrt{}');
            });
            
            $('#quick-math-frac').on('click', function() {
                AlgebraTutorMathEditor.insertCommand('\\frac{}{}');
            });
            
            $('#quick-math-power').on('click', function() {
                AlgebraTutorMathEditor.insertCommand('^{}');
            });
        },
        
        // Initialize formula library
        initFormulaLibrary: function() {
            if (typeof AlgebraTutorFormulaLibrary !== 'undefined') {
                AlgebraTutorFormulaLibrary.initLibraryView();
            }
        },
        
        // Add a new answer option
        addAnswerOption: function() {
            const rowCount = this.$answerFields.find('.multiple-answer-row').length;
            
            const newRow = $(`
                <div class="multiple-answer-row">
                    <label class="answer-option">
                        <input type="radio" name="correct_answer" value="${rowCount}">
                        <span class="answer-radio-label">${algebraTutorAdmin.i18n.correctAnswer || 'Correct answer'}</span>
                    </label>
                    <input type="text" name="answers[]" class="answer-text" placeholder="${algebraTutorAdmin.i18n.option || 'Option'} ${rowCount + 1}" required>
                    <button type="button" class="answer-row-action" title="${algebraTutorAdmin.i18n.removeOption || 'Remove option'}" data-action="remove">-</button>
                </div>
            `);
            
            this.$answerFields.append(newRow);
            this.state.isDirty = true;
        },
        
        // Remove an answer option
        removeAnswerOption: function($row) {
            if (this.$answerFields.find('.multiple-answer-row').length <= 2) {
                alert(algebraTutorAdmin.i18n.minimumTwoOptions || 'You need at least two answer options.');
                return;
            }
            
            $row.remove();
            this.updateRadioValues();
            this.state.isDirty = true;
        },
        
        // Update radio button values after reordering
        updateRadioValues: function() {
            this.$answerFields.find('.multiple-answer-row').each(function(index) {
                $(this).find('input[type="radio"]').val(index);
            });
        },
        
        // Shuffle answer options
        shuffleAnswers: function() {
            const $rows = this.$answerFields.find('.multiple-answer-row').get();
            const $container = this.$answerFields;
            
            // Save currently selected option
            const selectedValue = $('input[name="correct_answer"]:checked').val();
            let selectedText = '';
            
            if (selectedValue !== undefined) {
                selectedText = $($rows[selectedValue]).find('.answer-text').val();
            }
            
            // Shuffle array
            $rows.sort(() => Math.random() - 0.5);
            
            // Reposition shuffled rows
            $.each($rows, function(index, row) {
                $container.append(row);
                $(row).find('input[type="radio"]').val(index);
                
                // If this was the selected answer, keep it checked
                if ($(row).find('.answer-text').val() === selectedText) {
                    $(row).find('input[type="radio"]').prop('checked', true);
                }
            });
            
            this.state.isDirty = true;
        },
        
        // Update fill-in-the-blank fields based on question text
        updateFillBlanks: function() {
            const editor = tinyMCE.get('new_question');
            const content = editor ? editor.getContent({format: 'text'}) : '';
            const regex = /_{2,}/g;
            const matches = content.match(regex);
            
            this.$fillFields.empty();
            
            if (matches && matches.length > 0) {
                // Create fields for each blank
                matches.forEach((match, index) => {
                    const blankRow = $(`
                        <div class="blank-answer-row">
                            <div class="blank-number">${algebraTutorAdmin.i18n.blank || 'Blank'} #${index + 1}:</div>
                            <input type="text" name="fill_correct_answers[]" class="blank-answer-text" placeholder="${algebraTutorAdmin.i18n.answerForBlank || 'Answer for blank'} ${index + 1}" required>
                            <button type="button" class="add-alt-answer" title="${algebraTutorAdmin.i18n.addAltAnswer || 'Add alternative answer'}">+</button>
                        </div>
                    `);
                    
                    this.$fillFields.append(blankRow);
                });
            } else {
                // Show message if no blanks found
                this.$fillFields.html(`
                    <div class="no-blanks-message">
                        <p>${algebraTutorAdmin.i18n.noBlanksFiller || 'No blanks found. Use "__" (double underscore) in your question text to create blanks for students to fill in.'}</p>
                    </div>
                `);
            }
        },
        
        // Add alternative answer for fill-in-blank
        addAlternateAnswer: function($parentRow) {
            const blankIndex = $parentRow.find('.blank-number').text().match(/\d+/)[0] - 1;
            
            const altAnswerInput = $(`
                <div class="multiple-answers-input">
                    <input type="text" name="fill_correct_answers_alt[${blankIndex}][]" class="blank-alt-answer" placeholder="${algebraTutorAdmin.i18n.alternativeAnswer || 'Alternative answer'}">
                    <button type="button" class="remove-alt-answer" title="${algebraTutorAdmin.i18n.removeAltAnswer || 'Remove alternative answer'}">-</button>
                </div>
            `);
            
            $parentRow.append(altAnswerInput);
            this.state.isDirty = true;
        },
        
        // Generate preview of the question
        generatePreview: function() {
            const editor = tinyMCE.get('new_question');
            if (!editor) return;
            
            const content = editor.getContent();
            const questionType = this.state.questionType;
            
            // Update question content
            this.$previewContent.html(content);
            
            // Update answers preview
            this.$previewAnswers.empty();
            
            if (questionType === 'multiple') {
                // Multiple choice question
                const answersList = $('<div class="preview-multiple-choice"></div>');
                
                $('.multiple-answer-row').each(function() {
                    const answerText = $(this).find('.answer-text').val() || '';
                    const answerOption = $(`
                        <div class="preview-answer-option">
                            <label>
                                <input type="radio" name="preview_answer">
                                <span>${answerText}</span>
                            </label>
                        </div>
                    `);
                    
                    answersList.append(answerOption);
                });
                
                this.$previewAnswers.append(answersList);
            } else if (questionType === 'fill') {
                // Fill-in-the-blank - replace underscores with input fields
                const html = this.$previewContent.html();
                const newHtml = html.replace(/_{2,}/g, '<input type="text" class="preview-fill-blank" placeholder="...">');
                this.$previewContent.html(newHtml);
            }
            
            // Update MathJax
            if (typeof MathJax !== 'undefined') {
                setTimeout(() => {
                    if (MathJax.Hub && MathJax.Hub.Queue) {
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, $('#preview-container')[0]]);
                    } else if (MathJax.typesetPromise) {
                        MathJax.typesetPromise([$('#preview-container')[0]]).catch(err => {
                            console.error('MathJax error:', err);
                        });
                    }
                }, 50);
            }
        },
        
        // Add new category
        addNewCategory: function() {
            const categoryName = $('#new-category-name').val().trim();
            if (!categoryName) {
                this.showNotice(algebraTutorAdmin.i18n.categoryNameRequired || 'Category name is required.', 'error');
                return;
            }
            
            // Show loading state
            $('#add-new-category-btn').prop('disabled', true).addClass('loading');
            
            $.ajax({
                url: algebraTutorAdmin.ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_add_category',
                    nonce: algebraTutorAdmin.nonce,
                    category_name: categoryName
                },
                success: (response) => {
                    if (response.success) {
                        // Add to dropdown
                        this.$categorySelect.append($('<option>', {
                            value: response.data.category_name,
                            text: response.data.category_name
                        }));
                        
                        // Select the new category
                        this.$categorySelect.val(response.data.category_name);
                        
                        // Clear and hide form
                        $('#new-category-name').val('');
                        $('#add-category-form').slideUp();
                        
                        this.showNotice(algebraTutorAdmin.i18n.categoryAdded || 'Category added successfully!', 'success');
                    } else {
                        this.showNotice(response.data.message || algebraTutorAdmin.i18n.categoryAddError || 'Error adding category.', 'error');
                    }
                    
                    $('#add-new-category-btn').prop('disabled', false).removeClass('loading');
                },
                error: () => {
                    this.showNotice(algebraTutorAdmin.i18n.serverError || 'Server communication error.', 'error');
                    $('#add-new-category-btn').prop('disabled', false).removeClass('loading');
                }
            });
        },
        
        // Set up auto-save functionality
        setupAutoSave: function() {
            // Set auto-save interval (30 seconds)
            setInterval(() => this.autoSave(), 30000);
        },
        
        // Auto-save the question
        autoSave: function() {
            if (!this.state.isDirty || this.state.saveInProgress) {
                return;
            }
            
            const editor = tinyMCE.get('new_question');
            if (!editor) return;
            
            const content = editor.getContent();
            const formData = this.collectFormData();
            
            // Save a draft of the question
            $.ajax({
                url: algebraTutorAdmin.ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_save_draft',
                    nonce: algebraTutorAdmin.nonce,
                    draft: content,
                    meta: formData
                },
                success: (response) => {
                    if (response.success) {
                        this.state.lastSaved = response.data.time;
                        this.$lastSavedSpan.text(this.state.lastSaved);
                        this.showAutoSaveNotification();
                    }
                }
            });
        },
        
        // Save the question
        saveQuestion: function() {
            if (this.state.saveInProgress) {
                return;
            }
            
            // Validate the form
            if (!this.validateForm()) {
                return;
            }
            
            this.state.saveInProgress = true;
            
            // Show loading state
            this.$saveBtn.prop('disabled', true).addClass('loading');
            
            // Collect form data
            const formData = this.collectFormData();
            const questionId = $('#question_id').val();
            
            if (questionId) {
                formData.id = questionId;
            }
            
            // Send AJAX request
            $.ajax({
                url: algebraTutorAdmin.ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_save_question',
                    nonce: algebraTutorAdmin.nonce,
                    data: JSON.stringify(formData)
                },
                success: (response) => {
                    if (response.success) {
                        this.state.isDirty = false;
                        this.state.saveInProgress = false;
                        
                        // Show success message
                        this.showNotice(response.data.message || 'Question saved successfully!', 'success');
                        
                        // Update question ID if available
                        if (response.data.question_id) {
                            $('#question_id').val(response.data.question_id);
                        }
                        
                        // Enable the save button
                        this.$saveBtn.prop('disabled', false).removeClass('loading');
                        
                        // If this is a new question, clear the form or redirect
                        if (!questionId) {
                            if (confirm('Question saved successfully! Would you like to add another question?')) {
                                window.location.reload();
                            } else {
                                window.location.href = 'admin.php?page=algebra-tutor-question-bank';
                            }
                        }
                    } else {
                        this.showNotice(response.data.message || 'Error saving question.', 'error');
                        this.state.saveInProgress = false;
                        this.$saveBtn.prop('disabled', false).removeClass('loading');
                    }
                },
                error: () => {
                    this.showNotice('Server error. Please try again.', 'error');
                    this.state.saveInProgress = false;
                    this.$saveBtn.prop('disabled', false).removeClass('loading');
                }
            });
        },
        
        // Collect form data
        collectFormData: function() {
            const editor = tinyMCE.get('new_question');
            const data = {
                type: $('input[name="question_type"]:checked').val(),
                question: editor ? editor.getContent() : '',
                category: $('#category').val(),
                difficulty: $('input[name="difficulty"]:checked').val(),
                choices: [],
                correctAnswer: '',
                fillAnswers: []
            };
            
            // Get specific data based on question type
            if (data.type === 'multiple') {
                $('.answer-text').each(function() {
                    data.choices.push($(this).val());
                });
                data.correctAnswer = $('input[name="correct_answer"]:checked').val();
            } else if (data.type === 'fill') {
                $('.blank-answer-text').each(function() {
                    data.fillAnswers.push($(this).val());
                });
            }
            
            return data;
        },
        
        // Validate the form
        validateForm: function() {
            const editor = tinyMCE.get('new_question');
            const content = editor ? editor.getContent() : '';
            
            if (!content.trim()) {
                this.showNotice('Question text is required.', 'error');
                this.switchTab('question-tab');
                return false;
            }
            
            const category = $('#category').val();
            if (!category) {
                this.showNotice('Category is required.', 'error');
                this.switchTab('question-tab');
                return false;
            }
            
            const questionType = $('input[name="question_type"]:checked').val();
            
            if (questionType === 'multiple') {
                // Check if all answer fields are filled
                let emptyAnswers = false;
                $('.answer-text').each(function() {
                    if (!$(this).val().trim()) {
                        emptyAnswers = true;
                        return false;
                    }
                });
                
                if (emptyAnswers) {
                    this.showNotice('All answer options must be filled in.', 'error');
                    this.switchTab('question-tab');
                    return false;
                }
                
                // Check if a correct answer is selected
                if (!$('input[name="correct_answer"]:checked').val()) {
                    this.showNotice('You must select a correct answer.', 'error');
                    this.switchTab('question-tab');
                    return false;
                }
            } else if (questionType === 'fill') {
                // Check if the question contains blanks
                if (content.indexOf('__') === -1) {
                    this.showNotice('Fill-in-the-blank questions must contain at least one blank (__).', 'error');
                    this.switchTab('question-tab');
                    return false;
                }
                
                // Check if all blank answers are filled
                let emptyAnswers = false;
                $('.blank-answer-text').each(function() {
                    if (!$(this).val().trim()) {
                        emptyAnswers = true;
                        return false;
                    }
                });
                
                if (emptyAnswers) {
                    this.showNotice('All blank answers must be filled in.', 'error');
                    this.switchTab('question-tab');
                    return false;
                }
            }
            
            return true;
        },
        
        // Restore existing data if editing
        restoreExistingData: function() {
            const questionId = $('#question_id').val();
            
            if (questionId) {
                // Get the selected question type
                this.state.questionType = $('input[name="question_type"]:checked').val();
                this.updateQuestionTypeUI();
            }
        },
        
        // Show welcome guide for new users
        showWelcomeGuide: function() {
            // Only show once per session
            if (sessionStorage.getItem('algebraTutorWelcomeShown')) {
                return;
            }
            
            // Create welcome dialog
            const $welcomeDialog = $(`
                <div class="welcome-dialog">
                    <div class="welcome-dialog-content">
                        <h2>Welcome to the Question Editor</h2>
                        <p>Create engaging math questions with our interactive editor. Here's how to get started:</p>
                        
                        <div class="welcome-steps">
                            <div class="welcome-step">
                                <div class="step-number">1</div>
                                <div class="step-content">
                                    <h3>Choose a Question Type</h3>
                                    <p>Select either Multiple Choice or Fill-in-the-blank.</p>
                                </div>
                            </div>
                            
                            <div class="welcome-step">
                                <div class="step-number">2</div>
                                <div class="step-content">
                                    <h3>Enter Your Question</h3>
                                    <p>Use the "Math" button in the editor to add mathematical formulas.</p>
                                </div>
                            </div>
                            
                            <div class="welcome-step">
                                <div class="step-number">3</div>
                                <div class="step-content">
                                    <h3>Add Answers</h3>
                                    <p>For fill-in-blank, use double underscores (__) to create blanks.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="welcome-dialog-buttons">
                            <button class="welcome-start-button">Get Started</button>
                            <label><input type="checkbox" id="dont-show-again"> Don't show this again</label>
                        </div>
                    </div>
                </div>
            `);
            
            // Add to page
            $('body').append($welcomeDialog);
            
            // Handle close
            $('.welcome-start-button').on('click', function() {
                $welcomeDialog.fadeOut(300, function() {
                    $(this).remove();
                });
                
                if ($('#dont-show-again').is(':checked')) {
                    sessionStorage.setItem('algebraTutorWelcomeShown', 'true');
                }
            });
            
            // Slide in animation
            $welcomeDialog.hide().fadeIn(300);
        },
        
        // Show auto-save notification
        showAutoSaveNotification: function() {
            const $notification = $(`
                <div class="autosave-notification">
                    <div class="autosave-icon">✓</div>
                    <div class="autosave-text">Auto-saved at ${this.state.lastSaved}</div>
                </div>
            `);
            
            // Add to page
            $('body').append($notification);
            
            // Show and hide with animation
            $notification.hide().fadeIn(300);
            
            setTimeout(() => {
                $notification.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        },
        
        // Show notice message
        showNotice: function(message, type = 'info') {
            const $notices = $('#algebra-tutor-notices');
            
            // Create notices container if it doesn't exist
            if (!$notices.length) {
                $('body').append('<div id="algebra-tutor-notices"></div>');
            }
            
            // Create notice
            const $notice = $(`
                <div class="algebra-tutor-notice ${type}">
                    <div class="notice-message">${message}</div>
                    <button class="notice-close">×</button>
                </div>
            `);
            
            // Add to page
            $('#algebra-tutor-notices').append($notice);
            
            // Handle close
            $notice.find('.notice-close').on('click', function() {
                $(this).parent().fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // Add slide in animation
            $notice.hide().slideDown(300);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        },
        
        // Update all UI elements
        updateUI: function() {
            this.updateQuestionTypeUI();
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        QuestionEditor.init();
    });
    
})(jQuery);