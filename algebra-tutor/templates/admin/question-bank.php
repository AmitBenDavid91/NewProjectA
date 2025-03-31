<?php
/**
 * Admin template for managing questions
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Pagination
$per_page = 20;
$current_page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$offset = ($current_page - 1) * $per_page;

// Filters
$category_filter = isset($_GET['filter_category']) ? sanitize_text_field($_GET['filter_category']) : '';
$difficulty_filter = isset($_GET['filter_difficulty']) ? sanitize_text_field($_GET['filter_difficulty']) : '';
$type_filter = isset($_GET['filter_type']) ? sanitize_text_field($_GET['filter_type']) : '';
$search_term = isset($_GET['search']) ? sanitize_text_field($_GET['search']) : '';

// Get questions with filters
global $wpdb;
$table_name = $wpdb->prefix . 'algebra_exercises';

$where_conditions = [];
$query_params = [];

if (!empty($category_filter)) {
    $where_conditions[] = 'category = %s';
    $query_params[] = $category_filter;
}

if (!empty($difficulty_filter)) {
    $where_conditions[] = 'difficulty = %s';
    $query_params[] = $difficulty_filter;
}

if (!empty($type_filter)) {
    $where_conditions[] = 'question_type = %s';
    $query_params[] = $type_filter;
}

if (!empty($search_term)) {
    $where_conditions[] = 'question LIKE %s';
    $query_params[] = '%' . $wpdb->esc_like($search_term) . '%';
}

// Construct the WHERE clause
$where_clause = '';
if (!empty($where_conditions)) {
    $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
}

// Get total matching questions count - FIX HERE!
$count_query = "SELECT COUNT(*) FROM $table_name $where_clause";
if (!empty($query_params)) {
    $total_items = $wpdb->get_var($wpdb->prepare($count_query, $query_params));
} else {
    // Direct query without prepare when there are no placeholders
    $total_items = $wpdb->get_var($count_query);
}

$total_pages = ceil($total_items / $per_page);

// Get questions for current page - FIX HERE!
$questions_query = "SELECT * FROM $table_name $where_clause ORDER BY id DESC LIMIT %d OFFSET %d";

// Create parameters array for the paginated query
$pagination_params = $query_params;
$pagination_params[] = $per_page;
$pagination_params[] = $offset;

// Always use prepare here because we always have placeholders for LIMIT and OFFSET
$questions = $wpdb->get_results($wpdb->prepare($questions_query, $pagination_params));

// Get all categories for filter
$category_table = $wpdb->prefix . 'algebra_categories';
$all_categories = $wpdb->get_results("SELECT * FROM $category_table ORDER BY name ASC");

// Available question types
$question_types = [
    'multiple' => __('Multiple Choice', 'algebra-tutor'),
    'fill' => __('Fill-in-the-blank', 'algebra-tutor')
];

// Available difficulty levels
$difficulty_levels = [
    'easy' => __('Easy', 'algebra-tutor'),
    'medium' => __('Medium', 'algebra-tutor'),
    'hard' => __('Hard', 'algebra-tutor')
];

// Handle bulk actions
if (isset($_POST['question_action']) && !empty($_POST['question_ids']) && check_admin_referer('algebra_tutor_bulk_action')) {
    $action = sanitize_text_field($_POST['question_action']);
    $question_ids = array_map('intval', (array) $_POST['question_ids']);

    if ($action === 'delete' && !empty($question_ids)) {
        $ids_format = implode(',', array_fill(0, count($question_ids), '%d'));
        $wpdb->query($wpdb->prepare("DELETE FROM $table_name WHERE id IN ($ids_format)", $question_ids));

        echo '<div class="notice notice-success is-dismissible"><p>' .
            sprintf(__('%d questions have been deleted.', 'algebra-tutor'), count($question_ids)) .
            '</p></div>';
    }
}
?>

<div class="wrap algebra-tutor-admin">
    <h1 class="wp-heading-inline"><?php _e('Question Bank', 'algebra-tutor'); ?></h1>
    <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-add-question')); ?>" class="page-title-action"><?php _e('Add New Question', 'algebra-tutor'); ?></a>

    <hr class="wp-header-end">

    <!-- Filters -->
    <div class="tablenav top">
        <form method="get" action="">
            <input type="hidden" name="page" value="algebra-tutor-question-bank">

            <div class="alignleft actions">
                <label for="filter_category" class="screen-reader-text"><?php _e('Filter by category', 'algebra-tutor'); ?></label>
                <select name="filter_category" id="filter_category">
                    <option value=""><?php _e('All Categories', 'algebra-tutor'); ?></option>
                    <?php foreach ($all_categories as $category) : ?>
                        <option value="<?php echo esc_attr($category->name); ?>" <?php selected($category_filter, $category->name); ?>>
                            <?php echo esc_html($category->name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <label for="filter_difficulty" class="screen-reader-text"><?php _e('Filter by difficulty', 'algebra-tutor'); ?></label>
                <select name="filter_difficulty" id="filter_difficulty">
                    <option value=""><?php _e('All Difficulties', 'algebra-tutor'); ?></option>
                    <?php foreach ($difficulty_levels as $key => $label) : ?>
                        <option value="<?php echo esc_attr($key); ?>" <?php selected($difficulty_filter, $key); ?>>
                            <?php echo esc_html($label); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <label for="filter_type" class="screen-reader-text"><?php _e('Filter by type', 'algebra-tutor'); ?></label>
                <select name="filter_type" id="filter_type">
                    <option value=""><?php _e('All Types', 'algebra-tutor'); ?></option>
                    <?php foreach ($question_types as $key => $label) : ?>
                        <option value="<?php echo esc_attr($key); ?>" <?php selected($type_filter, $key); ?>>
                            <?php echo esc_html($label); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <input type="submit" class="button" value="<?php esc_attr_e('Filter', 'algebra-tutor'); ?>">
            </div>

            <div class="alignright actions">
                <label for="search" class="screen-reader-text"><?php _e('Search Questions', 'algebra-tutor'); ?></label>
                <input type="search" id="search" name="search" value="<?php echo esc_attr($search_term); ?>" placeholder="<?php esc_attr_e('Search questions...', 'algebra-tutor'); ?>">
                <input type="submit" class="button" value="<?php esc_attr_e('Search', 'algebra-tutor'); ?>">
            </div>
        </form>
    </div>

    <form method="post" action="">
        <?php wp_nonce_field('algebra_tutor_bulk_action'); ?>

        <div class="tablenav top">
            <div class="alignleft actions bulkactions">
                <label for="bulk-action-selector-top" class="screen-reader-text"><?php _e('Select bulk action', 'algebra-tutor'); ?></label>
                <select name="question_action" id="bulk-action-selector-top">
                    <option value="-1"><?php _e('Bulk Actions', 'algebra-tutor'); ?></option>
                    <option value="delete"><?php _e('Delete', 'algebra-tutor'); ?></option>
                </select>
                <input type="submit" id="doaction" class="button action" value="<?php esc_attr_e('Apply', 'algebra-tutor'); ?>">
            </div>

            <?php if ($total_pages > 1) : ?>
                <div class="tablenav-pages">
                    <span class="displaying-num">
                        <?php printf(
                            _n('%s item', '%s items', $total_items, 'algebra-tutor'),
                            number_format_i18n($total_items)
                        ); ?>
                    </span>

                    <span class="pagination-links">
                        <?php
                        echo paginate_links(array(
                            'base' => add_query_arg('paged', '%#%'),
                            'format' => '',
                            'prev_text' => '&laquo;',
                            'next_text' => '&raquo;',
                            'total' => $total_pages,
                            'current' => $current_page,
                        ));
                        ?>
                    </span>
                </div>
            <?php endif; ?>
        </div>

        <table class="wp-list-table widefat fixed striped questions-table">
            <thead>
            <tr>
                <td class="manage-column column-cb check-column">
                    <input type="checkbox" id="cb-select-all-1">
                </td>
                <th scope="col" class="manage-column column-id"><?php _e('ID', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-question"><?php _e('Question', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-type"><?php _e('Type', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-category"><?php _e('Category', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-difficulty"><?php _e('Difficulty', 'algebra-tutor'); ?></th>

                <th scope="col" class="manage-column column-actions"><?php _e('Actions', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-correct-answer"><?php _e('Correct Answer', 'algebra-tutor'); ?></th>

            </tr>
            </thead>

            <tbody id="the-list">
            <?php if (empty($questions)) : ?>
                <tr>
                    <td colspan="7" style="text-align: center;"><?php _e('No questions found.', 'algebra-tutor'); ?></td>
                </tr>
            <?php else : ?>
                <?php foreach ($questions as $question) : ?>
                    <tr>
                        <th scope="row" class="check-column">
                            <input type="checkbox" name="question_ids[]" value="<?php echo esc_attr($question->id); ?>">
                        </th>
                        <td class="column-id"><?php echo esc_html($question->id); ?></td>
                        <td class="column-question">
                            <?php
                            // Truncate question text if too long
                            $question_text = wp_strip_all_tags($question->question);
                            if (strlen($question_text) > 80) {
                                $question_text = substr($question_text, 0, 80) . '...';
                            }
                            echo esc_html($question_text);
                            ?>
                        </td>
                        <td class="column-type">
                            <?php
                            echo isset($question_types[$question->question_type])
                                ? esc_html($question_types[$question->question_type])
                                : esc_html($question->question_type);
                            ?>
                        </td>
                        <td class="column-category"><?php echo esc_html($question->category); ?></td>
                        <td class="column-difficulty">
                                <span class="difficulty-badge difficulty-<?php echo esc_attr($question->difficulty); ?>">
                                    <?php echo isset($difficulty_levels[$question->difficulty])
                                        ? esc_html($difficulty_levels[$question->difficulty])
                                        : esc_html(ucfirst($question->difficulty));
                                    ?>
                                </span>
                        </td>
                        <td class="column-actions">
                            <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-question-bank&edit=' . $question->id)); ?>" class="button button-small"><?php _e('Edit', 'algebra-tutor'); ?></a>

                            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin.php?page=algebra-tutor-question-bank&delete=' . $question->id), 'delete-question_' . $question->id)); ?>" class="button button-small delete-question" data-question-id="<?php echo esc_attr($question->id); ?>"><?php _e('Delete', 'algebra-tutor'); ?></a>

                            <a href="#" class="button button-small preview-question" data-question-id="<?php echo esc_attr($question->id); ?>"><?php _e('Preview', 'algebra-tutor'); ?></a>
                        </td>


                        <td class="column-correct-answer">
                            <?php
                            if ($question->question_type === 'multiple') {
                                // For multiple choice, display the correct option text
                                $choices = json_decode($question->choices, true);
                                $correct_index = (int)$question->correct_answer - 1; // Convert to zero-based index
                                if (isset($choices[$correct_index])) {
                                    echo '<strong>' . esc_html($choices[$correct_index]) . '</strong>';
                                } else {
                                    echo '<em>' . esc_html__('Unknown', 'algebra-tutor') . '</em>';
                                }
                            } else if ($question->question_type === 'fill') {
                                // For fill-in-the-blank, show the correct answers
                                $answers = json_decode($question->correct_answer, true);
                                if (is_array($answers)) {
                                    echo '<ul class="fill-answers-list">';
                                    foreach ($answers as $index => $answer) {
                                        echo '<li><strong>' . esc_html__('Blank', 'algebra-tutor') . ' ' . ($index + 1) . ':</strong> ' . esc_html($answer) . '</li>';
                                    }
                                    echo '</ul>';
                                } else {
                                    echo esc_html($question->correct_answer);
                                }
                            } else {
                                echo esc_html($question->correct_answer);
                            }
                            ?>
                        </td>

                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
            </tbody>

            <tfoot>
            <tr>
                <td class="manage-column column-cb check-column">
                    <input type="checkbox" id="cb-select-all-2">
                </td>
                <th scope="col" class="manage-column column-id"><?php _e('ID', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-question"><?php _e('Question', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-type"><?php _e('Type', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-category"><?php _e('Category', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-difficulty"><?php _e('Difficulty', 'algebra-tutor'); ?></th>
                <th scope="col" class="manage-column column-actions"><?php _e('Actions', 'algebra-tutor'); ?></th>
            </tr>
            </tfoot>
        </table>

        <?php if ($total_pages > 1) : ?>
            <div class="tablenav bottom">
                <div class="alignleft actions bulkactions">
                    <label for="bulk-action-selector-bottom" class="screen-reader-text"><?php _e('Select bulk action', 'algebra-tutor'); ?></label>
                    <select name="question_action" id="bulk-action-selector-bottom">
                        <option value="-1"><?php _e('Bulk Actions', 'algebra-tutor'); ?></option>
                        <option value="delete"><?php _e('Delete', 'algebra-tutor'); ?></option>
                    </select>
                    <input type="submit" id="doaction2" class="button action" value="<?php esc_attr_e('Apply', 'algebra-tutor'); ?>">
                </div>

                <div class="tablenav-pages">
                    <span class="displaying-num">
                        <?php printf(
                            _n('%s item', '%s items', $total_items, 'algebra-tutor'),
                            number_format_i18n($total_items)
                        ); ?>
                    </span>

                    <span class="pagination-links">
                        <?php
                        echo paginate_links(array(
                            'base' => add_query_arg('paged', '%#%'),
                            'format' => '',
                            'prev_text' => '&laquo;',
                            'next_text' => '&raquo;',
                            'total' => $total_pages,
                            'current' => $current_page,
                        ));
                        ?>
                    </span>
                </div>
            </div>
        <?php endif; ?>
    </form>
</div>

<!-- Question Preview Modal -->
<div id="question-preview-modal" style="display: none;">
    <div class="question-preview-backdrop"></div>
    <div class="question-preview-content">
        <div class="question-preview-header">
            <h2><?php _e('Question Preview', 'algebra-tutor'); ?></h2>
            <button class="close-modal" aria-label="<?php esc_attr_e('Close', 'algebra-tutor'); ?>">&times;</button>
        </div>
        <div class="question-preview-body">
            <div class="question-preview-loading">
                <?php _e('Loading question...', 'algebra-tutor'); ?>
            </div>
            <div class="question-preview-data" style="display: none;">
                <h3 class="question-title"></h3>
                <div class="question-text"></div>
                <div class="question-details">
                    <span class="question-type"></span>
                    <span class="question-category"></span>
                    <span class="question-difficulty"></span>
                </div>
                <div class="question-answers"></div>
            </div>
        </div>
        <div class="question-preview-footer">
            <button class="button close-preview"><?php _e('Close', 'algebra-tutor'); ?></button>
            <a href="#" class="button button-primary edit-question"><?php _e('Edit Question', 'algebra-tutor'); ?></a>
        </div>
    </div>
</div>

<style>
    /* Question Bank Table Styles */
    .questions-table .column-id {
        width: 60px;
        text-align: center;
    }

    .questions-table .column-type {
        width: 120px;
    }

    .questions-table .column-category {
        width: 130px;
    }

    .questions-table .column-difficulty {
        width: 80px;
    }

    .questions-table .column-actions {
        width: 180px;
    }

    .difficulty-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        color: white;
    }

    .difficulty-easy {
        background-color: #46b450;
    }

    .difficulty-medium {
        background-color: #ffb900;
    }

    .difficulty-hard {
        background-color: #dc3232;
    }

    /* Modal Styles */
    #question-preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100000;
    }

    .question-preview-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 100001;
    }

    .question-preview-content {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        background: white;
        border-radius: 5px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 100002;
        display: flex;
        flex-direction: column;
    }

    .question-preview-header {
        padding: 15px 20px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .question-preview-header h2 {
        margin: 0;
        font-size: 18px;
    }

    .close-modal {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        color: #666;
    }

    .question-preview-body {
        padding: 20px;
        overflow-y: auto;
        flex-grow: 1;
    }

    .question-preview-loading {
        text-align: center;
        padding: 30px;
        font-style: italic;
        color: #666;
    }

    .question-title {
        margin-top: 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .question-text {
        margin-bottom: 20px;
        padding: 15px;
        background: #f9f9f9;
        border: 1px solid #eee;
        border-radius: 3px;
    }

    .question-details {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
    }

    .question-type,
    .question-category,
    .question-difficulty {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 3px;
        background: #f0f0f0;
        font-size: 12px;
    }

    .question-answers {
        margin-top: 20px;
    }

    .answer-option {
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 3px;
    }

    .answer-option.correct {
        background: #e7f7e7;
        border-left: 3px solid #46b450;
    }

    .fill-blank-answers {
        margin-top: 10px;
    }

    .fill-blank-answer {
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #e7f7e7;
        border-radius: 3px;
        border-left: 3px solid #46b450;
    }

    .question-preview-footer {
        padding: 15px 20px;
        border-top: 1px solid #ddd;
        text-align: right;
    }
</style>

<script>
    jQuery(document).ready(function($) {
        // Delete confirmation
        $('.delete-question').on('click', function(e) {
            if (!confirm('<?php echo esc_js(__('Are you sure you want to delete this question? This action cannot be undone.', 'algebra-tutor')); ?>')) {
                e.preventDefault();
            }
        });

        // Bulk action confirmation
        $('form').on('submit', function(e) {
            var action = $('#bulk-action-selector-top').val();
            if (action === 'delete') {
                var checked = $('input[name="question_ids[]"]:checked').length;
                if (checked > 0) {
                    if (!confirm('<?php echo esc_js(__('Are you sure you want to delete the selected questions? This action cannot be undone.', 'algebra-tutor')); ?>')) {
                        e.preventDefault();
                    }
                } else {
                    alert('<?php echo esc_js(__('Please select at least one question to perform this action.', 'algebra-tutor')); ?>');
                    e.preventDefault();
                }
            }
        });

        // Check all checkboxes
        $('#cb-select-all-1, #cb-select-all-2').on('change', function() {
            var isChecked = $(this).prop('checked');
            $('input[name="question_ids[]"]').prop('checked', isChecked);
        });

        // Preview question
        $('.preview-question').on('click', function(e) {
            e.preventDefault();

            var questionId = $(this).data('question-id');
            var modal = $('#question-preview-modal');

            // Show modal
            modal.show();
            $('.question-preview-loading').show();
            $('.question-preview-data').hide();

            // Update the edit link
            $('.edit-question').attr('href', '<?php echo esc_js(admin_url('admin.php?page=algebra-tutor-question-bank&edit=')); ?>' + questionId);

            // Load question data via AJAX
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_get_question',
                    nonce: '<?php echo wp_create_nonce('algebra_tutor_admin'); ?>',
                    question_id: questionId
                },
                success: function(response) {
                    $('.question-preview-loading').hide();

                    if (response.success) {
                        var data = response.data;

                        // Fill question data
                        $('.question-title').text('<?php echo esc_js(__('Question ID:', 'algebra-tutor')); ?> ' + data.id);
                        $('.question-text').html(data.question);
                        $('.question-type').text(data.question_type === 'multiple' ?
                            '<?php echo esc_js(__('Multiple Choice', 'algebra-tutor')); ?>' :
                            '<?php echo esc_js(__('Fill-in-the-blank', 'algebra-tutor')); ?>');
                        $('.question-category').text(data.category);

                        // Set difficulty with correct class
                        var difficultyText = '';
                        switch(data.difficulty) {
                            case 'easy':
                                difficultyText = '<?php echo esc_js(__('Easy', 'algebra-tutor')); ?>';
                                break;
                            case 'medium':
                                difficultyText = '<?php echo esc_js(__('Medium', 'algebra-tutor')); ?>';
                                break;
                            case 'hard':
                                difficultyText = '<?php echo esc_js(__('Hard', 'algebra-tutor')); ?>';
                                break;
                            default:
                                difficultyText = data.difficulty;
                        }

                        $('.question-difficulty').text(difficultyText)
                            .removeClass('difficulty-easy difficulty-medium difficulty-hard')
                            .addClass('difficulty-' + data.difficulty);

                        // Display answers based on question type
                        var answersHtml = '';

                        if (data.question_type === 'multiple') {
                            answersHtml += '<h4><?php echo esc_js(__('Answer Options:', 'algebra-tutor')); ?></h4>';

                            var choices = JSON.parse(data.choices);
                            if (choices && choices.length) {
                                for (var i = 0; i < choices.length; i++) {
                                    var isCorrect = (data.correct_answer == (i + 1));
                                    answersHtml += '<div class="answer-option ' + (isCorrect ? 'correct' : '') + '">';
                                    answersHtml += (i + 1) + '. ' + choices[i];
                                    if (isCorrect) {
                                        answersHtml += ' <strong>(<?php echo esc_js(__('Correct Answer', 'algebra-tutor')); ?>)</strong>';
                                    }
                                    answersHtml += '</div>';
                                }
                            }
                        } else if (data.question_type === 'fill') {
                            answersHtml += '<h4><?php echo esc_js(__('Correct Answers:', 'algebra-tutor')); ?></h4>';
                            answersHtml += '<div class="fill-blank-answers">';

                            var answers = JSON.parse(data.correct_answer);
                            if (answers && answers.length) {
                                for (var i = 0; i < answers.length; i++) {
                                    answersHtml += '<div class="fill-blank-answer">';
                                    answersHtml += '<?php echo esc_js(__('Blank', 'algebra-tutor')); ?> #' + (i + 1) + ': ' + answers[i];
                                    answersHtml += '</div>';
                                }
                            }

                            answersHtml += '</div>';
                        }

                        $('.question-answers').html(answersHtml);

                        // Show question data
                        $('.question-preview-data').show();

                        // Update MathJax if available
                        if (typeof MathJax !== 'undefined') {
                            setTimeout(function() {
                                if (MathJax.typesetPromise) {
                                    MathJax.typesetPromise([$('.question-preview-data')[0]])
                                        .catch(function(err) {
                                            console.error('MathJax typeset error:', err);
                                        });
                                } else if (MathJax.Hub && MathJax.Hub.Queue) {
                                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, $('.question-preview-data')[0]]);
                                }
                            }, 100);
                        }
                    } else {
                        $('.question-preview-data').html('<div class="notice notice-error"><p>' +
                            '<?php echo esc_js(__('Error loading question data.', 'algebra-tutor')); ?>' +
                            '</p></div>').show();
                    }
                },
                error: function() {
                    $('.question-preview-loading').hide();
                    $('.question-preview-data').html('<div class="notice notice-error"><p>' +
                        '<?php echo esc_js(__('Failed to load question data. Please try again.', 'algebra-tutor')); ?>' +
                        '</p></div>').show();
                }
            });
        });

        // Close modal
        $('.close-modal, .close-preview, .question-preview-backdrop').on('click', function() {
            $('#question-preview-modal').hide();
        });
    });
</script>