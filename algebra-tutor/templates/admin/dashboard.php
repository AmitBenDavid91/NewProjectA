<?php
/**
 * Admin dashboard template
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Prepare data for JavaScript
$js_data = array(
    'activityDates' => array(),
    'activityCounts' => array(),
    'categoryNames' => array(),
    'categorySuccessRates' => array(),
    'categoryAttempts' => array(),
    'nonce' => wp_create_nonce('algebra_tutor_admin'),
    'i18n' => array(
        'attempts' => __('Attempts', 'algebra-tutor'),
        'successRate' => __('Success Rate (%)', 'algebra-tutor'),
        'date' => __('Date', 'algebra-tutor'),
        'dashboardRefreshed' => __('Dashboard refreshed successfully!', 'algebra-tutor'),
        'refreshError' => __('Error refreshing dashboard.', 'algebra-tutor'),
        'serverError' => __('Server communication error', 'algebra-tutor')
    )
);

// Format activity data for charts
foreach ($last_7_days_activity as $activity) {
    $js_data['activityDates'][] = date_i18n('d M', strtotime($activity->activity_date));
    $js_data['activityCounts'][] = (int) $activity->attempts;
}

// Format category performance data for charts
foreach ($categories_performance as $category) {
    $js_data['categoryNames'][] = $category->category;
    $js_data['categorySuccessRates'][] = round($category->success_rate, 1);
    $js_data['categoryAttempts'][] = (int) $category->attempts;
}

// Enqueue the data for JavaScript
wp_localize_script('algebra-tutor-dashboard', 'algebraTutorDashboard', $js_data);
?>

<div class="wrap algebra-tutor-admin">
    <h1><?php _e('Algebra Tutor Dashboard', 'algebra-tutor'); ?></h1>

    <!-- Dashboard Controls -->
    <div class="dashboard-controls">
        <div class="date-filter">
            <form method="get" action="" id="date-filter-form">
                <input type="hidden" name="page" value="algebra-tutor-dashboard">

                <div class="date-range">
                    <label for="date_from"><?php _e('From:', 'algebra-tutor'); ?></label>
                    <input type="date" id="date_from" name="date_from" value="<?php echo esc_attr(isset($_GET['date_from']) ? $_GET['date_from'] : ''); ?>" class="dashboard-date-picker">

                    <label for="date_to"><?php _e('To:', 'algebra-tutor'); ?></label>
                    <input type="date" id="date_to" name="date_to" value="<?php echo esc_attr(isset($_GET['date_to']) ? $_GET['date_to'] : ''); ?>" class="dashboard-date-picker">

                    <button type="submit" class="button"><?php _e('Filter', 'algebra-tutor'); ?></button>
                </div>

                <div class="quick-filters">
                    <a href="#" class="quick-date-filter" data-period="7days"><?php _e('Last 7 Days', 'algebra-tutor'); ?></a>
                    <a href="#" class="quick-date-filter" data-period="30days"><?php _e('Last 30 Days', 'algebra-tutor'); ?></a>
                    <a href="#" class="quick-date-filter" data-period="month"><?php _e('This Month', 'algebra-tutor'); ?></a>
                    <a href="#" class="quick-date-filter" data-period="quarter"><?php _e('This Quarter', 'algebra-tutor'); ?></a>
                    <a href="#" class="quick-date-filter" data-period="year"><?php _e('This Year', 'algebra-tutor'); ?></a>
                </div>
            </form>
        </div>

        <div class="dashboard-actions">
            <button id="refresh-dashboard" class="button button-primary"><?php _e('Refresh Data', 'algebra-tutor'); ?></button>
        </div>
    </div>

    <!-- Dashboard Overview -->
    <div class="dashboard-overview">
        <div class="stats-boxes">
            <div class="stats-box">
                <span id="stat-total-questions" class="stats-number"><?php echo esc_html($total_questions); ?></span>
                <span class="stats-label"><?php _e('Total Questions', 'algebra-tutor'); ?></span>
            </div>

            <div class="stats-box">
                <span id="stat-total-categories" class="stats-number"><?php echo esc_html($total_categories); ?></span>
                <span class="stats-label"><?php _e('Categories', 'algebra-tutor'); ?></span>
            </div>

            <div class="stats-box">
                <span id="stat-total-attempts" class="stats-number"><?php echo esc_html($total_attempts); ?></span>
                <span class="stats-label"><?php _e('Total Attempts', 'algebra-tutor'); ?></span>
            </div>

            <div class="stats-box">
                <span id="stat-total-students" class="stats-number"><?php echo esc_html($total_students); ?></span>
                <span class="stats-label"><?php _e('Students', 'algebra-tutor'); ?></span>
            </div>

            <div class="stats-box">
                <span id="stat-success-rate" class="stats-number"><?php echo esc_html($success_rate); ?>%</span>
                <span class="stats-label"><?php _e('Success Rate', 'algebra-tutor'); ?></span>
            </div>
        </div>
    </div>

    <!-- Dashboard Widgets -->
    <div class="dashboard-widgets">
        <!-- Activity Chart -->
        <div class="dashboard-card" data-widget-id="activity-chart">
            <div class="card-header">
                <h3><?php _e('Activity Last 7 Days', 'algebra-tutor'); ?></h3>
            </div>
            <div class="card-content">
                <div class="dashboard-chart">
                    <canvas id="activity-chart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>

        <!-- Category Performance -->
        <div class="dashboard-card" data-widget-id="category-performance">
            <div class="card-header">
                <h3><?php _e('Category Performance', 'algebra-tutor'); ?></h3>
            </div>
            <div class="card-content">
                <div class="dashboard-chart">
                    <canvas id="category-performance-chart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>

        <!-- Popular Questions -->
        <div class="dashboard-card" data-widget-id="popular-questions">
            <div class="card-header">
                <h3><?php _e('Popular Questions', 'algebra-tutor'); ?></h3>
            </div>
            <div class="card-content">
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                    <tr>
                        <th><?php _e('Question', 'algebra-tutor'); ?></th>
                        <th><?php _e('Category', 'algebra-tutor'); ?></th>
                        <th><?php _e('Attempts', 'algebra-tutor'); ?></th>
                        <th><?php _e('Success Rate', 'algebra-tutor'); ?></th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($popular_questions as $question) : ?>
                        <tr>
                            <td>
                                <?php
                                // Truncate question text if too long
                                $question_text = wp_strip_all_tags($question->question);
                                if (strlen($question_text) > 50) {
                                    $question_text = substr($question_text, 0, 50) . '...';
                                }
                                echo esc_html($question_text);
                                ?>
                                <div class="row-actions">
                                        <span class="edit">
                                            <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-question-bank&edit=' . $question->id)); ?>">
                                                <?php _e('Edit', 'algebra-tutor'); ?>
                                            </a>
                                        </span>
                                    <span class="view">
                                            | <a href="#" class="preview-question" data-question-id="<?php echo esc_attr($question->id); ?>">
                                                <?php _e('Preview', 'algebra-tutor'); ?>
                                            </a>
                                        </span>
                                </div>
                            </td>
                            <td><?php echo esc_html($question->category); ?></td>
                            <td><?php echo esc_html($question->attempts); ?></td>
                            <td>
                                <?php
                                $success_rate = round($question->success_rate, 1);
                                echo esc_html($success_rate) . '%';

                                // Add visual indicator
                                $indicator_class = $success_rate >= 70 ? 'high' : ($success_rate >= 40 ? 'medium' : 'low');
                                ?>
                                <span class="success-indicator <?php echo esc_attr($indicator_class); ?>"></span>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if (empty($popular_questions)) : ?>
                        <tr>
                            <td colspan="4"><?php _e('No data available', 'algebra-tutor'); ?></td>
                        </tr>
                    <?php endif; ?>
                    </tbody>
                </table>

                <div class="view-all">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-question-bank')); ?>" class="button button-small">
                        <?php _e('View All Questions', 'algebra-tutor'); ?>
                    </a>
                </div>
            </div>
        </div>

        <!-- Top Students -->
        <div class="dashboard-card" data-widget-id="top-students">
            <div class="card-header">
                <h3><?php _e('Top Students', 'algebra-tutor'); ?></h3>
            </div>
            <div class="card-content">
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                    <tr>
                        <th><?php _e('Student', 'algebra-tutor'); ?></th>
                        <th><?php _e('Attempts', 'algebra-tutor'); ?></th>
                        <th><?php _e('Correct', 'algebra-tutor'); ?></th>
                        <th><?php _e('Success Rate', 'algebra-tutor'); ?></th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($top_students as $student) : ?>
                        <tr>
                            <td>
                                <?php
                                if ($student->user_id > 0) {
                                    $user = get_userdata($student->user_id);
                                    echo esc_html($user ? $user->display_name : sprintf(__('User #%d', 'algebra-tutor'), $student->user_id));
                                } else {
                                    echo esc_html__('Guest User', 'algebra-tutor');
                                }
                                ?>
                            </td>
                            <td><?php echo esc_html($student->attempts); ?></td>
                            <td><?php echo esc_html($student->correct); ?></td>
                            <td>
                                <?php
                                $success_rate = round($student->success_rate, 1);
                                echo esc_html($success_rate) . '%';

                                // Add visual indicator
                                $indicator_class = $success_rate >= 70 ? 'high' : ($success_rate >= 40 ? 'medium' : 'low');
                                ?>
                                <span class="success-indicator <?php echo esc_attr($indicator_class); ?>"></span>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if (empty($top_students)) : ?>
                        <tr>
                            <td colspan="4"><?php _e('No data available', 'algebra-tutor'); ?></td>
                        </tr>
                    <?php endif; ?>
                    </tbody>
                </table>

                <div class="view-all">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-results')); ?>" class="button button-small">
                        <?php _e('View All Results', 'algebra-tutor'); ?>
                    </a>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-card" data-widget-id="recent-activity">
            <div class="card-header">
                <h3><?php _e('Recent Activity', 'algebra-tutor'); ?></h3>
            </div>
            <div class="card-content">
                <table id="recent-activity-table" class="wp-list-table widefat fixed striped">
                    <thead>
                    <tr>
                        <th><?php _e('Time', 'algebra-tutor'); ?></th>
                        <th><?php _e('User', 'algebra-tutor'); ?></th>
                        <th><?php _e('Question', 'algebra-tutor'); ?></th>
                        <th><?php _e('Result', 'algebra-tutor'); ?></th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($recent_activity as $activity) : ?>
                        <tr>
                            <td>
                                <?php echo esc_html(human_time_diff(strtotime($activity->timestamp), current_time('timestamp'))); ?>
                                <?php _e('ago', 'algebra-tutor'); ?>
                            </td>
                            <td>
                                <?php
                                if ($activity->user_id > 0) {
                                    $user = get_userdata($activity->user_id);
                                    echo esc_html($user ? $user->display_name : sprintf(__('User #%d', 'algebra-tutor'), $activity->user_id));
                                } else {
                                    echo esc_html__('Guest User', 'algebra-tutor');
                                }
                                ?>
                            </td>
                            <td>
                                <?php
                                // Truncate question text if too long
                                $question_text = wp_strip_all_tags($activity->question);
                                if (strlen($question_text) > 30) {
                                    $question_text = substr($question_text, 0, 30) . '...';
                                }
                                echo esc_html($question_text);
                                ?>
                                <div class="row-actions">
                                        <span class="edit">
                                            <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-question-bank&edit=' . $activity->question_id)); ?>">
                                                <?php _e('Edit', 'algebra-tutor'); ?>
                                            </a>
                                        </span>
                                </div>
                            </td>
                            <td>
                                    <span class="status-<?php echo $activity->is_correct ? 'correct' : 'incorrect'; ?>">
                                        <?php echo $activity->is_correct ? esc_html__('Correct', 'algebra-tutor') : esc_html__('Incorrect', 'algebra-tutor'); ?>
                                    </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                    <?php if (empty($recent_activity)) : ?>
                        <tr>
                            <td colspan="4"><?php _e('No recent activity', 'algebra-tutor'); ?></td>
                        </tr>
                    <?php endif; ?>
                    </tbody>
                </table>

                <div class="view-all">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=algebra-tutor-results')); ?>" class="button button-small">
                        <?php _e('View All Activity', 'algebra-tutor'); ?>
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Dashboard-specific styling */
    .dashboard-controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .date-filter .date-range {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }

    .date-filter .quick-filters {
        display: flex;
        gap: 15px;
        font-size: 13px;
    }

    .date-filter .quick-filters a {
        text-decoration: none;
    }

    .dashboard-overview {
        margin-bottom: 20px;
    }

    .dashboard-widgets {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(48%, 1fr));
        gap: 20px;
    }

    .dashboard-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        overflow: hidden;
    }

    .dashboard-card[data-widget-id="recent-activity"],
    .dashboard-card[data-widget-id="activity-chart"] {
        grid-column: span 2;
    }

    .card-header {
        padding: 15px;
        border-bottom: 1px solid #eee;
        background: #f9f9f9;
        cursor: move;
    }

    .card-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
    }

    .card-content {
        padding: 15px;
    }

    .dashboard-chart {
        position: relative;
        height: 300px;
        margin-bottom: 10px;
    }

    .view-all {
        text-align: right;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
    }

    .success-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-left: 5px;
    }

    .success-indicator.high {
        background-color: #46b450;
    }

    .success-indicator.medium {
        background-color: #ffb900;
    }

    .success-indicator.low {
        background-color: #dc3232;
    }

    .stats-number.updated {
        animation: highlight 1s ease-out;
    }

    @keyframes highlight {
        0% { color: #0073aa; }
        25% { color: #00a0d2; }
        100% { color: #0073aa; }
    }

    @media screen and (max-width: 782px) {
        .dashboard-controls {
            flex-direction: column;
        }

        .date-filter .date-range {
            flex-wrap: wrap;
        }

        .date-filter .quick-filters {
            flex-wrap: wrap;
        }

        .dashboard-widgets {
            grid-template-columns: 1fr;
        }

        .dashboard-card[data-widget-id="recent-activity"],
        .dashboard-card[data-widget-id="activity-chart"] {
            grid-column: span 1;
        }
    }
</style>