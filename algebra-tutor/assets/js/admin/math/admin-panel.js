/**
 * Question management functionality for Algebra Tutor admin
 */
(function($) {
    'use strict';

    // Global state
    let autoSaveTimer = null;
    let lastSavedTime = null;
    let questionType = 'multiple';

    // Wait for DOM to be ready
    $(document).ready(function() {
        // Initialize form functionality
        initFormHandlers();

        // Make answer options sortable
        makeAnswerRowsSortable();

        // Set up auto-save functionality
        setupAutoSave();

        // Restore draft if available
        restoreDraft();

        // Handle math content editing
        initMathEditing();
    });

    /**
     * Initialize form event handlers
     */
    function initFormHandlers() {
        // Question type selection
        $('input[name="question_type"]').on('change', function() {
            questionType = $(this).val();

            if (questionType === 'multiple') {
                $('#multiple_answers_container').show();
                $('#fill_answers_container').hide();
            } else if (questionType === 'fill') {
                $('#multiple_answers_container').hide();
                $('#fill_answers_container').show();
                updateFillAnswers();
            }
        });

        // Add answer option button
        $('#add-answer-option').on('click', function() {
            addAnswerRow();
        });

        // Shuffle answers button
        $('#shuffle-answers').on('click', function() {
            shuffleAnswers();
        });

        // Add answer row action button
        $(document).on('click', '.answer-row-action[data-action="add"]', function() {
            addAnswerRow();
        });

        // Remove answer row action button
        $(document).on('click', '.answer-row-action[data-action="remove"]', function() {
            if ($('.multiple-answer-row').length > 2) {
                $(this).closest('.multiple-answer-row').remove();

                // Update radio button values
                updateRadioValues();
            } else {
                alert(algebraTutorAdmin.i18n.minimumTwoOptions || 'You need at least two answer options.');
            }
        });

        // Preview button
        $('#preview-button').on('click', function() {
            $('.nav-tab-wrapper a[href="#preview-tab"]').click();
            updatePreview();
        });

        // Clear form button
        $('#clear-form').on('click', function() {
            if (confirm(algebraTutorAdmin.i18n.confirmClear || 'Are you sure you want to clear the form?')) {
                clearForm();
            }
        });

        // Save button (AJAX submission)
        $('#submit-question-form').on('click', function(e) {
            e.preventDefault();
            saveQuestion();
        });

        // Add category form
        $('#show-add-category').on('click', function(e) {
            e.preventDefault();
            $('#add-category-form').slideToggle();
        });

        $('#cancel-add-category').on('click', function() {
            $('#add-category-form').slideUp();
        });

        $('#add-new-category-btn').on('click', function() {
            addNewCategory();
        });

        // Tab navigation
        $('.nav-tab-wrapper a').on('click', function(e) {
            e.preventDefault();

            $('.nav-tab-wrapper a').removeClass('nav-tab-active');
            $('.tab-content').hide();

            $(this).addClass('nav-tab-active');
            $($(this).attr('href')).show();

            if ($(this).attr('href') === '#preview-tab') {
                updatePreview();
            } else if ($(this).attr('href') === '#formulas-tab') {
                if (typeof AlgebraTutorFormulaLibrary !== 'undefined') {
                    AlgebraTutorFormulaLibrary.initLibraryView();
                }
            }
        });

        // Fill-in-the-blank alternate answers
        $(document).on('click', '.add-alt-answer', function() {
            const parentRow = $(this).closest('.blank-answer-row');
            const blankIndex = parentRow.find('.blank-number').text().match(/\d+/)[0] - 1;

            const altAnswerInput = $(`
                <div class="multiple-answers-input">
                    <input type="text" name="fill_correct_answers_alt[${blankIndex}][]" class="blank-alt-answer" placeholder="${algebraTutorAdmin.i18n.alternativeAnswer || 'Alternative answer'}">
                    <button type="button" class="remove-alt-answer" title="${algebraTutorAdmin.i18n.removeAltAnswer || 'Remove alternative answer'}">-</button>
                </div>
            `);

            parentRow.append(altAnswerInput);
        });

        $(document).on('click', '.remove-alt-answer', function() {
            $(this).closest('.multiple-answers-input').remove();
        });
    }

    /**
     * Make answer rows sortable using jQuery UI
     */
    function makeAnswerRowsSortable() {
        if ($.fn.sortable) {
            $('#multiple-answers-fields').sortable({
                items: '.multiple-answer-row',
                handle: '.answer-option',
                axis: 'y',
                update: function() {
                    // Update radio button values after sorting
                    updateRadioValues();
                }
            });
        }
    }

    /**
     * Add a new answer row
     */
    function addAnswerRow() {
        const container = $('#multiple-answers-fields');
        const rowCount = $('.multiple-answer-row').length;

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

        container.append(newRow);

        // Make sure sortable is still working
        makeAnswerRowsSortable();
    }

    /**
     * Update radio button values after reordering
     */
    function updateRadioValues() {
        $('.multiple-answer-row').each(function(index) {
            $(this).find('input[type="radio"]').val(index);
        });
    }

    /**
     * Shuffle answer options randomly
     */
    function shuffleAnswers() {
        const container = $('#multiple-answers-fields');
        const rows = container.find('.multiple-answer-row').get();

        // Save currently selected option
        const selectedValue = $('input[name="correct_answer"]:checked').val();
        let selectedText = '';

        if (selectedValue !== undefined) {
            selectedText = $(rows[selectedValue]).find('.answer-text').val();
        }

        // Shuffle array
        rows.sort(function() {
            return 0.5 - Math.random();
        });

        // Reposition shuffled rows
        $.each(rows, function(index, row) {
            container.append(row);
            $(row).find('input[type="radio"]').val(index);

            // If this was the selected answer, keep it checked
            if ($(row).find('.answer-text').val() === selectedText) {
                $(row).find('input[type="radio"]').prop('checked', true);
            }
        });
    }

    /**
     * Update fill-in-the-blank answers based on question text
     */
    function updateFillAnswers() {
        const editor = tinymce.get('new_question');
        const content = editor ? editor.getContent({format: 'text'}) : '';
        const regex = /_{2,}/g;
        const matches = content.match(regex);
        const fillAnswersDiv = $('#fill-answers-fields');

        // Clear existing content
        fillAnswersDiv.empty();

        if (matches && matches.length > 0) {
            // Create fields for each blank
            $.each(matches, function(index, match) {
                const blankRow = $(`
                    <div class="blank-answer-row">
                        <div class="blank-number">${algebraTutorAdmin.i18n.blank || 'Blank'} #${index + 1}:</div>
                        <input type="text" name="fill_correct_answers[]" class="blank-answer-text" placeholder="${algebraTutorAdmin.i18n.answerForBlank || 'Answer for blank'} ${index + 1}" required>
                        <button type="button" class="add-alt-answer" title="${algebraTutorAdmin.i18n.addAltAnswer || 'Add alternative answer'}">+</button>
                    </div>
                `);

                fillAnswersDiv.append(blankRow);
            });
        } else {
            // Show message if no blanks found
            fillAnswersDiv.html(`
                <div class="no-blanks-message">
                    <p>${algebraTutorAdmin.i18n.noBlanksFiller || 'No blanks found. Use "__" (double underscore) in your question text to create blanks for students to fill in.'}</p>
                </div>
            `);
        }
    }

    /**
     * Set up auto-save functionality
     */
    function setupAutoSave() {
        // Set auto-save interval (30 seconds)
        autoSaveTimer = setInterval(function() {
            saveQuestionDraft();
        }, 30000);

        // Listen for editor changes to trigger auto-save
        function waitForEditor(callback) {
            const editor = tinymce.get('new_question');
            if (editor) {
                callback(editor);
            } else {
                setTimeout(function() { waitForEditor(callback); }, 200);
            }
        }

        waitForEditor(function(editor) {
            editor.on('keyup change', function() {
                // If fill-in-the-blank question type is selected, update answer fields
                if (questionType === 'fill') {
                    updateFillAnswers();
                }

                // Mark as modified for auto-save
                editor.save();
            });
        });
    }

    /**
     * Save question draft to server
     */
    function saveQuestionDraft() {
        const editor = tinymce.get('new_question');
        if (!editor) return;

        const content = editor.getContent();
        const meta = collectFormData();

        $.ajax({
            url: algebraTutorAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'algebra_tutor_save_draft',
                nonce: algebraTutorAdmin.nonce,
                draft: content,
                meta: meta
            },
            success: function(response) {
                if (response.success) {
                    lastSavedTime = response.data.time;
                    $('#last-saved-time').text(lastSavedTime);
                }
            }
        });
    }

    /**
     * Restore draft from server
     */
    function restoreDraft() {
        $.ajax({
            url: algebraTutorAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'algebra_tutor_load_draft',
                nonce: algebraTutorAdmin.nonce
            },
            success: function(response) {
                if (response.success && response.data.content) {
                    applyDraft(response.data.content, response.data.meta);
                } else {
                    // If no server draft, try local storage
                    restoreLocalDraft();
                }
            },
            error: function() {
                restoreLocalDraft();
            }
        });
    }

    /**
     * Restore draft from local storage
     */
    function restoreLocalDraft() {
        const savedDraft = localStorage.getItem('algebraTutorDraft');
        if (savedDraft) {
            try {
                const draftData = JSON.parse(savedDraft);
                applyDraft(draftData.content, draftData);
            } catch(e) {
                console.error("Error restoring draft:", e);
            }
        }
    }

    /**
     * Apply draft content to form
     */
    function applyDraft(content, meta) {
        waitForEditor(function(editor) {
            // Restore question content
            editor.setContent(content);

            // Restore question type
            if (meta && meta.type) {
                $(`#qtype_${meta.type}`).prop('checked', true).trigger('change');
            }

            // Restore category
            if (meta && meta.category) {
                $('#category').val(meta.category);
            }

            // Restore difficulty
            if (meta && meta.difficulty) {
                $(`input[name="difficulty"][value="${meta.difficulty}"]`).prop('checked', true);
            }

            // Restore answers
            if (meta && meta.answers && meta.answers.length) {
                if (meta.type === 'multiple') {
                    // Add more answer rows if needed
                    while ($('.multiple-answer-row').length < meta.answers.length) {
                        addAnswerRow();
                    }

                    // Set values
                    $('.multiple-answer-row').each(function(index) {
                        if (meta.answers[index]) {
                            $(this).find('.answer-text').val(meta.answers[index]);
                        }
                    });

                    // Set correct answer
                    if (meta.correctAnswer) {
                        $(`input[name="correct_answer"][value="${meta.correctAnswer}"]`).prop('checked', true);
                    }
                } else if (meta.type === 'fill') {
                    // Wait for fill answers to be created
                    setTimeout(function() {
                        $('.blank-answer-text').each(function(index) {
                            if (meta.answers[index]) {
                                $(this).val(meta.answers[index]);
                            }
                        });
                    }, 500);
                }
            }
        });
    }

    /**
     * Wait for TinyMCE editor to be available
     */
    function waitForEditor(callback) {
        const editor = tinymce.get('new_question');
        if (editor) {
            callback(editor);
        } else {
            setTimeout(function() { waitForEditor(callback); }, 200);
        }
    }

    /**
     * Initialize math editing functionality
     */
    function initMathEditing() {
        // Listen for editor context menu events
        waitForEditor(function(editor) {
            // Ensure the editor is updated on paste
            editor.on('paste', function() {
                setTimeout(function() {
                    if (questionType === 'fill') {
                        updateFillAnswers();
                    }
                }, 100);
            });

            // Update fill answers when content changes
            editor.on('change', function() {
                setTimeout(function() {
                    if (questionType === 'fill') {
                        updateFillAnswers();
                    }
                }, 100);
            });
        });
    }

    /**
     * Collect all form data
     */
    function collectFormData() {
        const editor = tinymce.get('new_question');
        const data = {
            type: $('input[name="question_type"]:checked').val(),
            category: $('#category').val(),
            difficulty: $('input[name="difficulty"]:checked').val(),
            answers: [],
            correctAnswer: ''
        };

        // Get question content
        if (editor) {
            data.content = editor.getContent();
        }

        // Get answers based on question type
        if (data.type === 'multiple') {
            $('.answer-text').each(function() {
                data.answers.push($(this).val());
            });
            data.correctAnswer = $('input[name="correct_answer"]:checked').val();
        } else if (data.type === 'fill') {
            $('.blank-answer-text').each(function() {
                data.answers.push($(this).val());
            });
        }

        return data;
    }

    /**
     * Update preview tab
     */
    function updatePreview() {
        const editor = tinymce.get('new_question');
        if (!editor) return;

        const content = editor.getContent();
        const questionType = $('input[name="question_type"]:checked').val();

        // Update question content
        $('#preview-content').html(content);

        // Update answers preview
        const answersContainer = $('#preview-answers');
        answersContainer.empty();

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

            answersContainer.append(answersList);
        } else if (questionType === 'fill') {
            // Fill-in-the-blank - already handled by replacing underscores in the question text
            // Explicitly replace each blank in the preview
            const previewContent = $('#preview-content');
            const html = previewContent.html();
            const newHtml = html.replace(/_{2,}/g, '<input type="text" class="preview-fill-blank" placeholder="...">');
            previewContent.html(newHtml);
        }

        // Update MathJax
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([$('#preview-container')[0]]).catch(function(err) {
                console.error("MathJax typeset error:", err);
            });
        }
    }

    /**
     * Add a new category
     */
    function addNewCategory() {
        const categoryName = $('#new-category-name').val().trim();
        if (!categoryName) {
            alert(algebraTutorAdmin.i18n.categoryNameRequired || 'Category name is required.');
            return;
        }

        $.ajax({
            url: algebraTutorAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'algebra_tutor_add_category',
                nonce: algebraTutorAdmin.nonce,
                category_name: categoryName
            },
            success: function(response) {
                if (response.success) {
                    // Add to dropdown
                    $('#category').append($('<option>', {
                        value: response.data.category_name,
                        text: response.data.category_name
                    }));

                    // Select the new category
                    $('#category').val(response.data.category_name);

                    // Clear and hide form
                    $('#new-category-name').val('');
                    $('#add-category-form').slideUp();

                    alert(algebraTutorAdmin.i18n.categoryAdded || 'Category added successfully!');
                } else {
                    alert(response.data.message || algebraTutorAdmin.i18n.categoryAddError || 'Error adding category.');
                }
            },
            error: function() {
                alert(algebraTutorAdmin.i18n.serverError || 'Server communication error.');
            }
        });
    }

    /**
     * Save question via AJAX
     */
    function saveQuestion() {
        const editor = tinymce.get('new_question');
        if (!editor) return;

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show loading state
        $('#submit-question-form').addClass('is-busy').prop('disabled', true);

        // Collect data
        const questionData = collectFormData();
        const questionId = $('#question_id').val();

        if (questionId) {
            questionData.question_id = questionId;
        }

        // Send to server
        $.ajax({
            url: algebraTutorAdmin.ajaxurl,
            type: 'POST',
            data: {
                action: 'algebra_tutor_save_question',
                nonce: algebraTutorAdmin.nonce,
                data: JSON.stringify(questionData)
            },
            success: function(response) {
                $('#submit-question-form').removeClass('is-busy').prop('disabled', false);

                if (response.success) {
                    // Show success message
                    const messageContainer = $('#form-messages');
                    messageContainer.html(`<div class="updated"><p>${response.data.message}</p></div>`);
                    messageContainer.show().delay(5000).fadeOut();

                    // Clear form if adding a new question
                    if (!questionId) {
                        clearForm();
                    }

                    // Update question ID if available
                    if (response.data.question_id) {
                        $('#question_id').val(response.data.question_id);
                    }
                } else {
                    alert(response.data.message || algebraTutorAdmin.i18n.savingError || 'Error saving question.');
                }
            },
            error: function() {
                $('#submit-question-form').removeClass('is-busy').prop('disabled', false);
                alert(algebraTutorAdmin.i18n.serverError || 'Server communication error.');
            }
        });
    }

    /**
     * Validate the question form
     */
    function validateForm() {
        const editor = tinymce.get('new_question');
        const content = editor ? editor.getContent() : '';

        if (!content.trim()) {
            alert(algebraTutorAdmin.i18n.questionRequired || 'Question text is required.');
            return false;
        }

        const category = $('#category').val();
        if (!category) {
            alert(algebraTutorAdmin.i18n.categoryRequired || 'Category is required.');
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
                alert(algebraTutorAdmin.i18n.allAnswersRequired || 'All answer options must be filled in.');
                return false;
            }

            // Check if a correct answer is selected
            if (!$('input[name="correct_answer"]:checked').val()) {
                alert(algebraTutorAdmin.i18n.correctAnswerRequired || 'You must select a correct answer.');
                return false;
            }
        } else if (questionType === 'fill') {
            // Check if the question contains blanks
            if (content.indexOf('__') === -1) {
                alert(algebraTutorAdmin.i18n.blanksRequired || 'Fill-in-the-blank questions must contain at least one blank (__).');
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
                alert(algebraTutorAdmin.i18n.allBlanksRequired || 'All blank answers must be filled in.');
                return false;
            }
        }

        return true;
    }

    /**
     * Clear form and remove draft
     */
    function clearForm() {
        waitForEditor(function(editor) {
            // Clear editor
            editor.setContent('');

            // Reset answer fields
            $('.multiple-answer-row .answer-text').val('');
            $('input[name="correct_answer"]').prop('checked', false);

            // Reset to default values
            $('#category').prop('selectedIndex', 0);
            $('input[name="difficulty"][value="medium"]').prop('checked', true);

            // Remove drafts
            localStorage.removeItem('algebraTutorDraft');
            $('#last-saved-time').text('-');

            // Clear server draft
            $.ajax({
                url: algebraTutorAdmin.ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_save_draft',
                    nonce: algebraTutorAdmin.nonce,
                    draft: '',
                    meta: {}
                }
            });
        });
    }

})(jQuery);