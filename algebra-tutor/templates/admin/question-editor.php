<?php
/**
 * Admin template for adding/editing questions
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}



// Get categories if not provided
if (!isset($categories) || empty($categories)) {
    $categories = algebra_tutor_get_categories();
}

// Check if we're editing an existing question
$editing = isset($question) && !empty($question);
$question_id = $editing ? $question->id : 0;

// Default values
$question_text = $editing ? $question->question : '';
$question_type = $editing ? $question->question_type : 'multiple';
$category = $editing ? $question->category : '';
$difficulty = $editing ? $question->difficulty : 'medium';
$choices = $editing && $question->choices ? json_decode($question->choices, true) : [];
$correct_answer = $editing ? $question->correct_answer : '';

// For fill-in-the-blank questions
$fill_answers = [];
if ($editing && $question_type === 'fill') {
    $fill_answers = json_decode($correct_answer, true);
    if (!is_array($fill_answers)) {
        $fill_answers = [$correct_answer];
    }
}

// Process form submission
if ($_SERVER["REQUEST_METHOD"] === "POST" && check_admin_referer('algebra_tutor_' . ($editing ? 'edit' : 'add') . '_question')) {
    $sanitized_data = algebra_tutor_sanitize_question_form($_POST);

    // Validate form data
    $errors = [];

    if (empty($sanitized_data['question'])) {
        $errors[] = __('Question text is required.', 'algebra-tutor');
    }

    if (empty($sanitized_data['category'])) {
        $errors[] = __('Category is required.', 'algebra-tutor');
    }

    if (empty($sanitized_data['difficulty'])) {
        $errors[] = __('Difficulty level is required.', 'algebra-tutor');
    }

    if ($sanitized_data['question_type'] === 'multiple') {
        if (empty($sanitized_data['choices'])) {
            $errors[] = __('Answer choices are required for multiple choice questions.', 'algebra-tutor');
        }

        if (!isset($sanitized_data['correct_answer'])) {
            $errors[] = __('You must select a correct answer.', 'algebra-tutor');
        }
    } else if ($sanitized_data['question_type'] === 'fill') {
        if (empty($sanitized_data['correct_answers'])) {
            $errors[] = __('Answers are required for fill-in-the-blank questions.', 'algebra-tutor');
        }

        if (strpos($sanitized_data['question'], '__') === false) {
            $errors[] = __('Fill-in-the-blank questions must contain at least one blank (__).', 'algebra-tutor');
        }
    }

    // If no errors, save the question
    if (empty($errors)) {
        $save_data = [
            'question' => $sanitized_data['question'],
            'question_type' => $sanitized_data['question_type'],
            'category' => $sanitized_data['category'],
            'difficulty' => $sanitized_data['difficulty'],
        ];

        if ($sanitized_data['question_type'] === 'multiple') {
            $save_data['choices'] = $sanitized_data['choices'];
            $save_data['correct_answer'] = $sanitized_data['correct_answer'];
        } else if ($sanitized_data['question_type'] === 'fill') {
            $save_data['correct_answers'] = $sanitized_data['correct_answers'];
        }

        $result = algebra_tutor_save_question($save_data, $editing ? $question_id : null);

        if ($result !== false) {
            $question_id = $result;
            $message = $editing
                ? algebra_tutor_success_message(__('Question updated successfully!', 'algebra-tutor'))
                : algebra_tutor_success_message(sprintf(__('Question added successfully! (Question ID: %d)', 'algebra-tutor'), $question_id));

            // Clear draft if adding a new question
            if (!$editing) {
                algebra_tutor_save_draft(get_current_user_id(), '', []);

                // Reset form values for a new question
                $question_text = '';
                $choices = [];
                $correct_answer = '';
                $fill_answers = [];
            }
        } else {
            $message = algebra_tutor_error_message(__('Error saving the question.', 'algebra-tutor'));
        }
    } else {
        $message = algebra_tutor_error_message(implode('<br>', $errors));
    }
}

// Enqueue necessary scripts
wp_enqueue_editor();
wp_enqueue_script('jquery-ui-sortable');
?>

<div class="wrap algebra-tutor-admin">
    <h1><?php echo $editing ? __('Edit Question', 'algebra-tutor') : __('Add New Question', 'algebra-tutor'); ?></h1>

    <?php if (isset($message) && !empty($message)) echo $message; ?>

    <!-- Tabs -->
    <h2 class="nav-tab-wrapper">
        <a href="#question-tab" class="nav-tab nav-tab-active"><?php echo $editing ? __('Edit Question', 'algebra-tutor') : __('Add Question', 'algebra-tutor'); ?></a>
        <a href="#formulas-tab" class="nav-tab"><?php _e('Formula Library', 'algebra-tutor'); ?></a>
        <a href="#preview-tab" class="nav-tab"><?php _e('Preview', 'algebra-tutor'); ?></a>
    </h2>

    <!-- Rest of the template remains unchanged -->
    <!-- Question tab -->
    <div id="question-tab" class="tab-content">
        <form method="post" action="" id="add-question-form">
            <?php wp_nonce_field('algebra_tutor_' . ($editing ? 'edit' : 'add') . '_question'); ?>
            <input type="hidden" id="question_id" name="question_id" value="<?php echo esc_attr($question_id); ?>">

            <table class="form-table">
                <!-- Question text -->
                <tr>
                    <th scope="row"><label for="new_question"><?php _e('Question Text', 'algebra-tutor'); ?></label></th>
                    <td>
                        <?php
                        wp_editor(
                            $question_text,
                            'new_question',
                            [
                                'textarea_name' => 'new_question',
                                'textarea_rows' => 10,
                                'media_buttons' => false,
                                'tinymce' => [
                                    'toolbar1' => 'bold,italic,underline,bullist,numlist,link,myMathButton',
                                    'toolbar2' => '',
                                ],
                            ]
                        );
                        ?>
                        <p class="description">
                            <?php _e('Enter your question text here. Use the "Math" button to add formulas. For fill-in-the-blank questions, use "__" (double underscore) to mark blanks.', 'algebra-tutor'); ?>
                        </p>
                    </td>
                </tr>

                <!-- Question type -->
                <tr>
                    <th scope="row"><?php _e('Question Type', 'algebra-tutor'); ?></th>
                    <td>
                        <div class="question-type-selector">
                            <label class="question-type-option">
                                <input type="radio" name="question_type" value="multiple" id="qtype_multiple" <?php checked($question_type, 'multiple'); ?>>
                                <span class="question-type-label"><?php _e('Multiple Choice', 'algebra-tutor'); ?></span>
                                <span class="question-type-desc"><?php _e('Question with multiple options, one of which is correct.', 'algebra-tutor'); ?></span>
                            </label>
                            <label class="question-type-option">
                                <input type="radio" name="question_type" value="fill" id="qtype_fill" <?php checked($question_type, 'fill'); ?>>
                                <span class="question-type-label"><?php _e('Fill-in-the-blank', 'algebra-tutor'); ?></span>
                                <span class="question-type-desc"><?php _e('Question with blanks that the student will fill in.', 'algebra-tutor'); ?></span>
                            </label>
                        </div>
                    </td>
                </tr>

                <!-- Fill-in-the-blank answers -->
                <tr id="fill_answers_container" style="<?php echo $question_type === 'fill' ? '' : 'display:none;'; ?>">
                    <th scope="row"><label for="fill_correct_answers"><?php _e('Correct Answers (Fill-in-the-blank)', 'algebra-tutor'); ?></label></th>
                    <td>
                        <div id="fill-answers-fields" class="fill-answers-container">
                            <?php
                            // Check if we have blanks to display
                            $has_blanks = false;
                            if ($question_type === 'fill' && !empty($question_text)) {
                                preg_match_all('/_{2,}/', $question_text, $matches);
                                if (!empty($matches[0])) {
                                    $has_blanks = true;
                                    foreach ($matches[0] as $index => $match) {
                                        $answer = isset($fill_answers[$index]) ? $fill_answers[$index] : '';
                                        ?>
                                        <div class="blank-answer-row">
                                            <div class="blank-number"><?php printf(__('Blank #%d:', 'algebra-tutor'), $index + 1); ?></div>
                                            <input type="text" name="fill_correct_answers[]" class="blank-answer-text" placeholder="<?php printf(__('Answer for blank %d', 'algebra-tutor'), $index + 1); ?>" value="<?php echo esc_attr($answer); ?>" required>
                                            <button type="button" class="add-alt-answer" title="<?php _e('Add alternative answer', 'algebra-tutor'); ?>">+</button>
                                        </div>
                                        <?php
                                    }
                                }
                            }

                            // If no blanks found, show message
                            if (!$has_blanks) {
                                echo '<div class="no-blanks-message">';
                                echo '<p>' . __('No blanks found. Use "__" (double underscore) in your question text to create blanks.', 'algebra-tutor') . '</p>';
                                echo '</div>';
                            }
                            ?>
                        </div>
                        <p class="description"><?php _e('Enter the correct answers for each blank in the question.', 'algebra-tutor'); ?></p>
                    </td>
                </tr>

                <!-- Multiple choice answers -->
                <tr id="multiple_answers_container" style="<?php echo $question_type === 'multiple' ? '' : 'display:none;'; ?>">
                    <th scope="row"><?php _e('Answer Options (Multiple Choice)', 'algebra-tutor'); ?></th>
                    <td>
                        <div id="multiple-answers-fields" class="multiple-answers-container">
                            <?php
                            // If we have choices, display them
                            if (!empty($choices)) {
                                foreach ($choices as $index => $choice) {
                                    ?>
                                    <div class="multiple-answer-row">
                                        <label class="answer-option">
                                            <input type="radio" name="correct_answer" value="<?php echo $index; ?>" <?php checked(($index + 1), $correct_answer); ?> required>
                                            <span class="answer-radio-label"><?php _e('Correct answer', 'algebra-tutor'); ?></span>
                                        </label>
                                        <input type="text" name="answers[]" class="answer-text" placeholder="<?php printf(__('Option %d', 'algebra-tutor'), $index + 1); ?>" value="<?php echo esc_attr($choice); ?>" required>
                                        <button type="button" class="answer-row-action" title="<?php _e('Remove option', 'algebra-tutor'); ?>" data-action="remove">-</button>
                                    </div>
                                    <?php
                                }
                            } else {
                                // Default four options
                                for ($i = 0; $i < 4; $i++) {
                                    ?>
                                    <div class="multiple-answer-row">
                                        <label class="answer-option">
                                            <input type="radio" name="correct_answer" value="<?php echo $i; ?>" required>
                                            <span class="answer-radio-label"><?php _e('Correct answer', 'algebra-tutor'); ?></span>
                                        </label>
                                        <input type="text" name="answers[]" class="answer-text" placeholder="<?php printf(__('Option %d', 'algebra-tutor'), $i + 1); ?>" required>
                                        <?php if ($i === 0) : ?>
                                            <button type="button" class="answer-row-action" title="<?php _e('Add option', 'algebra-tutor'); ?>" data-action="add">+</button>
                                        <?php else : ?>
                                            <button type="button" class="answer-row-action" title="<?php _e('Remove option', 'algebra-tutor'); ?>" data-action="remove">-</button>
                                        <?php endif; ?>
                                    </div>
                                    <?php
                                }
                            }
                            ?>
                        </div>
                        <div class="answer-options-controls">
                            <button type="button" id="add-answer-option" class="button"><?php _e('Add Option', 'algebra-tutor'); ?></button>
                            <button type="button" id="shuffle-answers" class="button"><?php _e('Shuffle Options', 'algebra-tutor'); ?></button>
                        </div>
                        <p class="description"><?php _e('Select the correct answer by clicking the radio button. You can add, remove, and reorder options.', 'algebra-tutor'); ?></p>
                    </td>
                </tr>

                <!-- Category -->
                <tr>
                    <th scope="row"><label for="category"><?php _e('Category', 'algebra-tutor'); ?></label></th>
                    <td>
                        <select name="category" id="category" required>
                            <option value=""><?php _e('-- Select Category --', 'algebra-tutor'); ?></option>
                            <?php foreach ($categories as $cat) : ?>
                                <option value="<?php echo esc_attr($cat->name); ?>" <?php selected($category, $cat->name); ?>><?php echo esc_html($cat->name); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <a href="#" id="show-add-category" class="add-new-category"><?php _e('+ Add New Category', 'algebra-tutor'); ?></a>
                        <div id="add-category-form" style="display:none; margin-top:10px;">
                            <input type="text" id="new-category-name" placeholder="<?php _e('New category name', 'algebra-tutor'); ?>">
                            <button type="button" id="add-new-category-btn" class="button"><?php _e('Add', 'algebra-tutor'); ?></button>
                            <button type="button" id="cancel-add-category" class="button"><?php _e('Cancel', 'algebra-tutor'); ?></button>
                        </div>
                    </td>
                </tr>

                <!-- Difficulty -->
                <tr>
                    <th scope="row"><label><?php _e('Difficulty Level', 'algebra-tutor'); ?></label></th>
                    <td>
                        <div class="difficulty-selector">
                            <label class="difficulty-option">
                                <input type="radio" name="difficulty" value="easy" <?php checked($difficulty, 'easy'); ?>>
                                <span class="difficulty-level difficulty-easy"><?php _e('Easy', 'algebra-tutor'); ?></span>
                            </label>
                            <label class="difficulty-option">
                                <input type="radio" name="difficulty" value="medium" <?php checked($difficulty, 'medium'); ?>>
                                <span class="difficulty-level difficulty-medium"><?php _e('Medium', 'algebra-tutor'); ?></span>
                            </label>
                            <label class="difficulty-option">
                                <input type="radio" name="difficulty" value="hard" <?php checked($difficulty, 'hard'); ?>>
                                <span class="difficulty-level difficulty-hard"><?php _e('Hard', 'algebra-tutor'); ?></span>
                            </label>
                        </div>
                    </td>
                </tr>
            </table>

            <div class="form-actions">
                <?php submit_button(
                    $editing ? __('Update Question', 'algebra-tutor') : __('Save Question', 'algebra-tutor'),
                    'primary',
                    'submit',
                    false
                ); ?>
                <button type="button" id="preview-button" class="button button-secondary"><?php _e('Preview', 'algebra-tutor'); ?></button>
                <button type="button" id="clear-form" class="button button-secondary"><?php _e('Clear Form', 'algebra-tutor'); ?></button>
                <div id="auto-save-status" class="auto-save-status"><?php _e('Last draft saved:', 'algebra-tutor'); ?> <span id="last-saved-time">-</span></div>
            </div>
        </form>
    </div>

    <!-- Formula library tab -->
    <div id="formulas-tab" class="tab-content" style="display:none;">
        <div id="math-formulas-library-container" class="math-library-wrapper"></div>
    </div>

    <!-- Preview tab -->
    <div id="preview-tab" class="tab-content" style="display:none;">
        <div class="preview-controls">
            <div class="preview-device-selector">
                <button type="button" class="preview-device-btn active" data-device="desktop"><?php _e('Desktop', 'algebra-tutor'); ?></button>
                <button type="button" class="preview-device-btn" data-device="tablet"><?php _e('Tablet', 'algebra-tutor'); ?></button>
                <button type="button" class="preview-device-btn" data-device="mobile"><?php _e('Mobile', 'algebra-tutor'); ?></button>
            </div>
            <button type="button" id="refresh-preview" class="button"><?php _e('Refresh Preview', 'algebra-tutor'); ?></button>
        </div>

        <div id="preview-container" class="preview-container preview-desktop">
            <div class="preview-frame">
                <div id="question-preview" class="question-preview">
                    <h3><?php _e('Question Preview', 'algebra-tutor'); ?></h3>
                    <div id="preview-content" class="preview-content"></div>
                    <div id="preview-answers" class="preview-answers"></div>
                    <button type="button" class="preview-submit-btn"><?php _e('Submit Answer', 'algebra-tutor'); ?></button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    jQuery(document).ready(function($) {
        // Tabs navigation
        $('.nav-tab-wrapper a').on('click', function(e) {
            e.preventDefault();

            // Remove active class from all tabs
            $('.nav-tab-wrapper a').removeClass('nav-tab-active');

            // Hide all content
            $('.tab-content').hide();

            // Highlight current tab
            $(this).addClass('nav-tab-active');

            // Show corresponding content
            $($(this).attr('href')).show();

            // Handle specific tabs
            if ($(this).attr('href') === '#formulas-tab' && typeof AlgebraTutorFormulaLibrary !== 'undefined') {
                AlgebraTutorFormulaLibrary.initLibraryView();
            }

            if ($(this).attr('href') === '#preview-tab') {
                updatePreview();
            }
        });

        // Question type selection
        $('input[name="question_type"]').on('change', function() {
            var type = $(this).val();

            if (type === 'multiple') {
                $('#multiple_answers_container').show();
                $('#fill_answers_container').hide();
            } else if (type === 'fill') {
                $('#multiple_answers_container').hide();
                $('#fill_answers_container').show();
                updateFillAnswers();
            }
        });

        // Add answer option
        $('#add-answer-option').on('click', function() {
            addAnswerRow();
        });

        // Add answer row action
        $(document).on('click', '.answer-row-action[data-action="add"]', function() {
            addAnswerRow();
        });

        // Remove answer row action
        $(document).on('click', '.answer-row-action[data-action="remove"]', function() {
            if ($('.multiple-answer-row').length > 2) {
                $(this).closest('.multiple-answer-row').remove();
                updateRadioValues();
            } else {
                alert('<?php _e('You need at least two answer options.', 'algebra-tutor'); ?>');
            }
        });

        // Shuffle answers
        $('#shuffle-answers').on('click', function() {
            var container = $('#multiple-answers-fields');
            var rows = container.find('.multiple-answer-row').get();

            // Save selected option
            var selectedValue = $('input[name="correct_answer"]:checked').val();
            var selectedText = '';

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
        });

        // Add fill-in-the-blank alternate answers
        $(document).on('click', '.add-alt-answer', function() {
            var parentRow = $(this).closest('.blank-answer-row');
            var blankIndex = parentRow.find('.blank-number').text().match(/\d+/)[0] - 1;

            var altAnswerInput = $(`
            <div class="multiple-answers-input">
                <input type="text" name="fill_correct_answers_alt[${blankIndex}][]" class="blank-alt-answer" placeholder="<?php _e('Alternative answer', 'algebra-tutor'); ?>">
                <button type="button" class="remove-alt-answer" title="<?php _e('Remove alternative answer', 'algebra-tutor'); ?>">-</button>
            </div>
        `);

            parentRow.append(altAnswerInput);
        });

        // Remove alternate answer
        $(document).on('click', '.remove-alt-answer', function() {
            $(this).closest('.multiple-answers-input').remove();
        });

        // Preview button
        $('#preview-button').on('click', function() {
            $('.nav-tab-wrapper a[href="#preview-tab"]').click();
        });

        // Add new category
        $('#show-add-category').on('click', function(e) {
            e.preventDefault();
            $('#add-category-form').slideToggle();
        });

        $('#cancel-add-category').on('click', function() {
            $('#add-category-form').slideUp();
        });

        $('#add-new-category-btn').on('click', function() {
            var categoryName = $('#new-category-name').val().trim();
            if (!categoryName) {
                alert('<?php _e('Category name is required.', 'algebra-tutor'); ?>');
                return;
            }

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_add_category',
                    nonce: '<?php echo wp_create_nonce('algebra_tutor_admin'); ?>',
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

                        alert('<?php _e('Category added successfully!', 'algebra-tutor'); ?>');
                    } else {
                        alert(response.data.message || '<?php _e('Error adding category.', 'algebra-tutor'); ?>');
                    }
                },
                error: function() {
                    alert('<?php _e('Server communication error.', 'algebra-tutor'); ?>');
                }
            });
        });

        // Clear form button
        $('#clear-form').on('click', function() {
            if (confirm('<?php _e('Are you sure you want to clear the form?', 'algebra-tutor'); ?>')) {
                // Clear editor
                if (tinyMCE.get('new_question')) {
                    tinyMCE.get('new_question').setContent('');
                }

                // Reset form fields
                $('.multiple-answer-row .answer-text').val('');
                $('input[name="correct_answer"]').prop('checked', false);
                $('#category').prop('selectedIndex', 0);
                $('input[name="difficulty"][value="medium"]').prop('checked', true);

                // Remove drafts
                localStorage.removeItem('algebraTutorDraft');
                $('#last-saved-time').text('-');
            }
        });

        // Helper functions
        function addAnswerRow() {
            var container = $('#multiple-answers-fields');
            var rowCount = $('.multiple-answer-row').length;

            var newRow = $(`
            <div class="multiple-answer-row">
                <label class="answer-option">
                    <input type="radio" name="correct_answer" value="${rowCount}">
                    <span class="answer-radio-label"><?php _e('Correct answer', 'algebra-tutor'); ?></span>
                </label>
                <input type="text" name="answers[]" class="answer-text" placeholder="<?php _e('Option', 'algebra-tutor'); ?> ${rowCount + 1}" required>
                <button type="button" class="answer-row-action" title="<?php _e('Remove option', 'algebra-tutor'); ?>" data-action="remove">-</button>
            </div>
        `);

            container.append(newRow);
        }

        function updateRadioValues() {
            $('.multiple-answer-row').each(function(index) {
                $(this).find('input[type="radio"]').val(index);
            });
        }

        function updateFillAnswers() {
            var editor = tinyMCE.get('new_question');
            var content = editor ? editor.getContent({format: 'text'}) : '';
            var regex = /_{2,}/g;
            var matches = content.match(regex);
            var fillAnswersDiv = $('#fill-answers-fields');

            // Clear existing content
            fillAnswersDiv.empty();

            if (matches && matches.length > 0) {
                // Create fields for each blank
                $.each(matches, function(index, match) {
                    var blankRow = $(`
                    <div class="blank-answer-row">
                        <div class="blank-number"><?php _e('Blank', 'algebra-tutor'); ?> #${index + 1}:</div>
                        <input type="text" name="fill_correct_answers[]" class="blank-answer-text" placeholder="<?php _e('Answer for blank', 'algebra-tutor'); ?> ${index + 1}" required>
                        <button type="button" class="add-alt-answer" title="<?php _e('Add alternative answer', 'algebra-tutor'); ?>">+</button>
                    </div>
                `);

                    fillAnswersDiv.append(blankRow);
                });
            } else {
                // Show message if no blanks found
                fillAnswersDiv.html(`
                <div class="no-blanks-message">
                    <p><?php _e('No blanks found. Use "__" (double underscore) in your question text to create blanks.', 'algebra-tutor'); ?></p>
                </div>
            `);
            }
        }

        function updatePreview() {
            var editor = tinyMCE.get('new_question');
            if (!editor) return;

            var content = editor.getContent();
            var questionType = $('input[name="question_type"]:checked').val();

            // Update question content
            $('#preview-content').html(content);

            // Update answers preview
            var answersContainer = $('#preview-answers');
            answersContainer.empty();

            if (questionType === 'multiple') {
                // Multiple choice question
                var answersList = $('<div class="preview-multiple-choice"></div>');

                $('.multiple-answer-row').each(function() {
                    var answerText = $(this).find('.answer-text').val() || '';
                    var answerOption = $(`
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
                // Fill-in-the-blank - replace underscores in the question text
                var previewContent = $('#preview-content');
                var html = previewContent.html();
                var newHtml = html.replace(/_{2,}/g, '<input type="text" class="preview-fill-blank" placeholder="...">');
                previewContent.html(newHtml);
            }

            // Typeset MathJax
            if (typeof MathJax !== 'undefined') {
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([$('#preview-container')[0]]).catch(function(err) {
                        console.error("MathJax typeset error:", err);
                    });
                } else if (MathJax.typeset) {
                    MathJax.typeset([$('#preview-container')[0]]);
                }
            }
        }

        // Listen for editor changes
        function waitForEditor(callback) {
            var editor = tinyMCE.get('new_question');
            if (editor) {
                callback(editor);
            } else {
                setTimeout(function() { waitForEditor(callback); }, 200);
            }
        }

        waitForEditor(function(editor) {
            editor.on('change', function() {
                // If fill-in-the-blank is selected, update answer fields
                if ($('#qtype_fill').is(':checked')) {
                    updateFillAnswers();
                }
            });
        });

        // Make answer options sortable
        if ($.fn.sortable) {
            $('#multiple-answers-fields').sortable({
                items: '.multiple-answer-row',
                handle: '.answer-option',
                axis: 'y',
                update: function() {
                    updateRadioValues();
                }
            });
        }
    });
</script>