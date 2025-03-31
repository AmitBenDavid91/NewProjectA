<?php
/**
 * Admin template for displaying statistics
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Load necessary dependencies for charts
wp_enqueue_script('jquery');
wp_enqueue_script('chart-js', 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js', [], '3.7.1', true);

// Get results repository
$results_repo = new \AlgebraTutor\Database\ResultsRepo();

// Get statistics data
$category_performance = $results_repo->get_performance_by_category();
$popular_questions = $results_repo->get_popular_questions(10);
$top_students = $results_repo->get_top_students(10);
$daily_activity = $results_repo->get_daily_activity(30);

// Format data for charts
$category_labels = [];
$category_success_rates = [];
$category_attempts = [];

foreach ($category_performance as $category) {
    $category_labels[] = $category->category;
    $category_success_rates[] = round($category->success_rate, 1);
    $category_attempts[] = (int) $category->attempts;
}

// Format activity data
$activity_dates = [];
$activity_counts = [];

foreach ($daily_activity as $day) {
    $activity_dates[] = date_i18n('d M', strtotime($day->activity_date));
    $activity_counts[] = (int) $day->attempts;
}

// Get question difficulty distribution
global $wpdb;
$questions_table = $wpdb->prefix . 'algebra_exercises';
$difficulty_distribution = $wpdb->get_results("
    SELECT difficulty, COUNT(*) as count 
    FROM $questions_table 
    GROUP BY difficulty 
    ORDER BY FIELD(difficulty, 'easy', 'medium', 'hard')
");

$difficulty_labels = [];
$difficulty_counts = [];

foreach ($difficulty_distribution as $difficulty) {
    $difficulty_labels[] = ucfirst($difficulty->difficulty);
    $difficulty_counts[] = (int) $difficulty->count;
}

// Get overall success rate
$results_table = $wpdb->prefix . 'algebra_results';
$total_attempts = (int) $wpdb->get_var("SELECT COUNT(*) FROM $results_table");
$correct_attempts = (int) $wpdb->get_var("SELECT COUNT(*) FROM $results_table WHERE is_correct = 1");
$overall_success_rate = $total_attempts > 0 ? round(($correct_attempts / $total_attempts) * 100, 1) : 0;

?>

<div class="wrap algebra-tutor-admin">
    <h1><?php _e('Statistics', 'algebra-tutor'); ?></h1>

    <!-- Overview Section -->
    <div class="stats-overview">
        <div class="stats-section">
            <h2><?php _e('Overview', 'algebra-tutor'); ?></h2>

            <div class="stats-boxes">
                <div class="stats-box">
                    <span class="stats-number"><?php echo esc_html($total_attempts); ?></span>
                    <span class="stats-label"><?php _e('Total Attempts', 'algebra-tutor'); ?></span>
                </div>

                <div class="stats-box">
                    <span class="stats-number"><?php echo esc_html($overall_success_rate); ?>%</span>
                    <span class="stats-label"><?php _e('Overall Success Rate', 'algebra-tutor'); ?></span>
                </div>

                <div class="stats-box">
                    <span class="stats-number"><?php echo esc_html(count($category_labels)); ?></span>
                    <span class="stats-label"><?php _e('Categories', 'algebra-tutor'); ?></span>
                </div>

                <div class="stats-box">
                    <span class="stats-number"><?php echo esc_html(array_sum($difficulty_counts)); ?></span>
                    <span class="stats-label"><?php _e('Total Questions', 'algebra-tutor'); ?></span>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Statistics Sections -->
    <div class="stats-container">
        <div class="stats-row">
            <!-- Category Performance -->
            <div class="stats-column">
                <div class="stats-card">
                    <h3><?php _e('Category Performance', 'algebra-tutor'); ?></h3>
                    <div class="chart-container">
                        <canvas id="categoryChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>

            <!-- Question Difficulty Distribution -->
            <div class="stats-column">
                <div class="stats-card">
                    <h3><?php _e('Question Difficulty Distribution', 'algebra-tutor'); ?></h3>
                    <div class="chart-container">
                        <canvas id="difficultyChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="stats-row">
            <!-- Daily Activity -->
            <div class="stats-column stats-column-full">
                <div class="stats-card">
                    <h3><?php _e('Daily Activity (Last 30 Days)', 'algebra-tutor'); ?></h3>
                    <div class="chart-container">
                        <canvas id="activityChart" width="800" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="stats-row">
            <!-- Popular Questions -->
            <div class="stats-column">
                <div class="stats-card">
                    <h3><?php _e('Most Popular Questions', 'algebra-tutor'); ?></h3>
                    <div class="data-table-container">
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
                    </div>
                </div>
            </div>

            <!-- Top Students -->
            <div class="stats-column">
                <div class="stats-card">
                    <h3><?php _e('Top Students', 'algebra-tutor'); ?></h3>
                    <div class="data-table-container">
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
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    jQuery(document).ready(function($) {
        // Category Performance Chart
        var categoryCtx = document.getElementById('categoryChart').getContext('2d');
        var categoryChart = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: <?php echo json_encode($category_labels); ?>,
                datasets: [{
                    label: '<?php echo esc_js(__('Success Rate (%)', 'algebra-tutor')); ?>',
                    data: <?php echo json_encode($category_success_rates); ?>,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: '<?php echo esc_js(__('Attempts', 'algebra-tutor')); ?>',
                    data: <?php echo json_encode($category_attempts); ?>,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'attempts-y-axis'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '<?php echo esc_js(__('Success Rate (%)', 'algebra-tutor')); ?>'
                        }
                    },
                    'attempts-y-axis': {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '<?php echo esc_js(__('Number of Attempts', 'algebra-tutor')); ?>'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });

        // Difficulty Distribution Chart
        var difficultyCtx = document.getElementById('difficultyChart').getContext('2d');
        var difficultyChart = new Chart(difficultyCtx, {
            type: 'pie',
            data: {
                labels: <?php echo json_encode($difficulty_labels); ?>,
                datasets: [{
                    data: <?php echo json_encode($difficulty_counts); ?>,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var label = context.label || '';
                                var value = context.raw || 0;
                                var total = context.dataset.data.reduce(function(acc, val) { return acc + val; }, 0);
                                var percentage = Math.round((value / total) * 100);
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });

        // Activity Chart
        var activityCtx = document.getElementById('activityChart').getContext('2d');
        var activityChart = new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: <?php echo json_encode($activity_dates); ?>,
                datasets: [{
                    label: '<?php echo esc_js(__('Number of Attempts', 'algebra-tutor')); ?>',
                    data: <?php echo json_encode($activity_counts); ?>,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '<?php echo esc_js(__('Number of Attempts', 'algebra-tutor')); ?>'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '<?php echo esc_js(__('Date', 'algebra-tutor')); ?>'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    });
</script>

<style>
    .stats-overview {
        margin-bottom: 30px;
    }

    .stats-boxes {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 15px;
    }

    .stats-box {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        flex: 1;
        min-width: 200px;
        text-align: center;
    }

    .stats-number {
        display: block;
        font-size: 28px;
        font-weight: bold;
        color: #0073aa;
        margin-bottom: 5px;
    }

    .stats-label {
        color: #555;
        font-size: 14px;
    }

    .stats-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .stats-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 10px;
    }

    .stats-column {
        flex: 1;
        min-width: 45%;
    }

    .stats-column-full {
        flex-basis: 100%;
    }

    .stats-card {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        height: calc(100% - 40px);
    }

    .stats-card h3 {
        margin-top: 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        color: #23282d;
    }

    .chart-container {
        position: relative;
        height: 300px;
    }

    .data-table-container {
        max-height: 300px;
        overflow-y: auto;
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

    @media (max-width: 782px) {
        .stats-row {
            flex-direction: column;
        }

        .stats-column {
            width: 100%;
        }
    }
</style>