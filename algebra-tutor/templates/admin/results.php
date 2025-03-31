<?php
/**
 * Admin template for viewing student results
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Get results repository
$results_repo = new \AlgebraTutor\Database\ResultsRepo();

// Pagination parameters
$per_page = 20;
$current_page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$offset = ($current_page - 1) * $per_page;

// Filters
$user_filter = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
$category_filter = isset($_GET['category']) ? sanitize_text_field($_GET['category']) : '';
$date_from = isset($_GET['date_from']) ? sanitize_text_field($_GET['date_from']) : '';
$date_to = isset($_GET['date_to']) ? sanitize_text_field($_GET['date_to']) : '';

// Get total result count and results for the current page
global $wpdb;
$results_table = $wpdb->prefix . 'algebra_results';
$questions_table = $wpdb->prefix . 'algebra_exercises';
$users_table = $wpdb->users;

// Build query conditions
$where_conditions = [];
$query_params = [];

if ($user_filter) {
    $where_conditions[] = 'r.user_id = %d';
    $query_params[] = $user_filter;
}

if ($category_filter) {
    $where_conditions[] = 'q.category = %s';
    $query_params[] = $category_filter;
}

if ($date_from) {
    $where_conditions[] = 'r.timestamp >= %s';
    $query_params[] = $date_from . ' 00:00:00';
}

if ($date_to) {
    $where_conditions[] = 'r.timestamp <= %s';
    $query_params[] = $date_to . ' 23:59:59';
}

// Combine conditions
$where_clause = '';
if (!empty($where_conditions)) {
    $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
}

// Get total matching results - FIX HERE
$count_query = "
    SELECT COUNT(*) 
    FROM $results_table r
    JOIN $questions_table q ON r.question_id = q.id
    $where_clause
";

if (!empty($query_params)) {
    $total_items = $wpdb->get_var($wpdb->prepare($count_query, $query_params));
} else {
    // Direct query without prepare when there are no placeholders
    $total_items = $wpdb->get_var($count_query);
}

$total_pages = ceil($total_items / $per_page);

// Get results for current page
$results_query = "
    SELECT r.*, q.question, q.category, q.difficulty, u.display_name 
    FROM $results_table r
    JOIN $questions_table q ON r.question_id = q.id
    LEFT JOIN $users_table u ON r.user_id = u.ID
    $where_clause
    ORDER BY r.timestamp DESC
    LIMIT %d OFFSET %d
";

// Add pagination parameters
$pagination_params = $query_params;
$pagination_params[] = $per_page;
$pagination_params[] = $offset;

// Get results - Always use prepare here because we always have LIMIT and OFFSET placeholders
$results = $wpdb->get_results($wpdb->prepare($results_query, $pagination_params));

// Get all categories for the filter
$categories = $wpdb->get_col("SELECT DISTINCT category FROM $questions_table ORDER BY category ASC");

// Get users who have results
$users_with_results = $wpdb->get_results("
    SELECT DISTINCT u.ID, u.display_name 
    FROM $results_table r
    JOIN $users_table u ON r.user_id = u.ID
    ORDER BY u.display_name ASC
");

?>

<div class="wrap algebra-tutor-admin">
    <h1><?php _e('Student Results', 'algebra-tutor'); ?></h1>

    <div class="results-filters">
        <form method="get" action="">
            <input type="hidden" name="page" value="algebra-tutor-results">

            <!-- Filters -->
            <div class="filter-row">
                <div class="filter-field">
                    <label for="user_id"><?php _e('Student:', 'algebra-tutor'); ?></label>
                    <select name="user_id" id="user_id">
                        <option value=""><?php _e('All Students', 'algebra-tutor'); ?></option>
                        <?php foreach ($users_with_results as $user) : ?>
                            <option value="<?php echo esc_attr($user->ID); ?>" <?php selected($user_filter, $user->ID); ?>>
                                <?php echo esc_html($user->display_name ? $user->display_name : __('Guest User', 'algebra-tutor')); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-field">
                    <label for="category"><?php _e('Category:', 'algebra-tutor'); ?></label>
                    <select name="category" id="category">
                        <option value=""><?php _e('All Categories', 'algebra-tutor'); ?></option>
                        <?php foreach ($categories as $category) : ?>
                            <option value="<?php echo esc_attr($category); ?>" <?php selected($category_filter, $category); ?>>
                                <?php echo esc_html($category); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filter-field">
                    <label for="date_from"><?php _e('Date From:', 'algebra-tutor'); ?></label>
                    <input type="date" id="date_from" name="date_from" value="<?php echo esc_attr($date_from); ?>">
                </div>

                <div class="filter-field">
                    <label for="date_to"><?php _e('Date To:', 'algebra-tutor'); ?></label>
                    <input type="date" id="date_to" name="date_to" value="<?php echo esc_attr($date_to); ?>">
                </div>

                <div class="filter-actions">
                    <button type="submit" class="button button-primary"><?php _e('Apply Filters', 'algebra-tutor'); ?></button>
                    <a href="?page=algebra-tutor-results" class="button"><?php _e('Reset Filters', 'algebra-tutor'); ?></a>
                </div>
            </div>
        </form>
    </div>

    <!-- Results Summary -->
    <div class="results-summary">
        <h2><?php _e('Results Summary', 'algebra-tutor'); ?></h2>

        <div class="summary-stats">
            <div class="stat-box">
                <span class="stat-number"><?php echo esc_html($total_items); ?></span>
                <span class="stat-label"><?php _e('Total Attempts', 'algebra-tutor'); ?></span>
            </div>

            <?php
            // Calculate correct answers percentage
            $correct_count = 0;
            foreach ($results as $result) {
                if ($result->is_correct) {
                    $correct_count++;
                }
            }
            $success_rate = $total_items > 0 ? round(($correct_count / $total_items) * 100, 1) : 0;
            ?>

            <div class="stat-box">
                <span class="stat-number"><?php echo esc_html($success_rate); ?>%</span>
                <span class="stat-label"><?php _e('Success Rate', 'algebra-tutor'); ?></span>
            </div>
        </div>
    </div>

    <!-- Results Table -->
    <div class="results-table-container">
        <?php if (empty($results)) : ?>
            <div class="no-results">
                <p><?php _e('No results found.', 'algebra-tutor'); ?></p>
            </div>
        <?php else : ?>
            <table class="wp-list-table widefat fixed striped results-table">
                <thead>
                <tr>
                    <th><?php _e('Date & Time', 'algebra-tutor'); ?></th>
                    <th><?php _e('Student', 'algebra-tutor'); ?></th>
                    <th><?php _e('Question', 'algebra-tutor'); ?></th>
                    <th><?php _e('Category', 'algebra-tutor'); ?></th>
                    <th><?php _e('Difficulty', 'algebra-tutor'); ?></th>
                    <th><?php _e('Answer', 'algebra-tutor'); ?></th>
                    <th><?php _e('Result', 'algebra-tutor'); ?></th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($results as $result) : ?>
                    <tr>
                        <td><?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($result->timestamp))); ?></td>
                        <td>
                            <?php if ($result->user_id > 0) : ?>
                                <a href="<?php echo esc_url(add_query_arg('user_id', $result->user_id)); ?>">
                                    <?php echo esc_html($result->display_name ? $result->display_name : __('User #', 'algebra-tutor') . $result->user_id); ?>
                                </a>
                            <?php else : ?>
                                <?php _e('Guest User', 'algebra-tutor'); ?>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php
                            // Truncate question text if too long
                            $question_text = wp_strip_all_tags($result->question);
                            if (strlen($question_text) > 100) {
                                $question_text = substr($question_text, 0, 100) . '...';
                            }
                            echo esc_html($question_text);
                            ?>
                        </td>
                        <td>
                            <a href="<?php echo esc_url(add_query_arg('category', urlencode($result->category))); ?>">
                                <?php echo esc_html($result->category); ?>
                            </a>
                        </td>
                        <td>
                                <span class="difficulty difficulty-<?php echo esc_attr(strtolower($result->difficulty)); ?>">
                                    <?php echo esc_html(ucfirst($result->difficulty)); ?>
                                </span>
                        </td>
                        <td>
                            <?php
                            // Check if answer is stored as JSON (for fill-in-the-blank questions)
                            $user_answer = $result->user_answer;
                            $json_answer = json_decode($user_answer);
                            if (is_array($json_answer)) {
                                echo esc_html(implode(', ', $json_answer));
                            } else {
                                echo esc_html($user_answer);
                            }
                            ?>
                        </td>
                        <td>
                                <span class="result-status status-<?php echo $result->is_correct ? 'correct' : 'incorrect'; ?>">
                                    <?php echo $result->is_correct ? esc_html__('Correct', 'algebra-tutor') : esc_html__('Incorrect', 'algebra-tutor'); ?>
                                </span>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>

            <!-- Pagination -->
            <?php if ($total_pages > 1) : ?>
                <div class="tablenav">
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

        <?php endif; ?>
    </div>
</div>

<script>
    jQuery(document).ready(function($) {
        // Enable date pickers for date filters
        if ($.fn.datepicker) {
            $('#date_from, #date_to').datepicker({
                dateFormat: 'yy-mm-dd'
            });
        }
    });
</script>