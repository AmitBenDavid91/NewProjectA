<?php
namespace AlgebraTutor\Admin;

use AlgebraTutor\Database\QuestionsRepo;
use AlgebraTutor\Database\ResultsRepo;

/**
 * Handles the admin dashboard.
 */
class Dashboard {
    /**
     * Questions repository instance.
     *
     * @var QuestionsRepo
     */
    private $questions_repo;

    /**
     * Results repository instance.
     *
     * @var ResultsRepo
     */
    private $results_repo;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->questions_repo = new QuestionsRepo();
        $this->results_repo = new ResultsRepo();
    }

    /**
     * Render the dashboard page.
     */
    public function render_page() {
        // Load dashboard CSS
        wp_enqueue_style(
            'algebra-tutor-dashboard-style',
            ALGEBRA_TUTOR_URL . 'assets/css/dashboard.css',
            ['algebra-tutor-admin'],
            ALGEBRA_TUTOR_VERSION
        );

        // Get dashboard data
        $total_questions = $this->get_total_questions();
        $total_categories = $this->get_total_categories();
        $total_attempts = $this->get_total_attempts();
        $total_students = $this->get_total_students();
        $correct_attempts = $this->get_correct_attempts();
        $success_rate = $total_attempts > 0 ? round(($correct_attempts / $total_attempts) * 100, 1) : 0;

        // Get popular questions
        $popular_questions = $this->results_repo->get_popular_questions(5);

        // Get category performance
        $categories_performance = $this->results_repo->get_performance_by_category();

        // Get top students
        $top_students = $this->results_repo->get_top_students(5);

        // Get activity data
        $last_7_days_activity = $this->results_repo->get_daily_activity(7);

        // Format activity data for chart
        $activity_dates = [];
        $activity_counts = [];

        // Initialize arrays for the last 7 days
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $activity_dates[] = date_i18n('d/m', strtotime($date));
            $activity_counts[$date] = 0;
        }

        // Fill in activity data
        foreach ($last_7_days_activity as $activity) {
            $activity_counts[$activity->activity_date] = (int) $activity->attempts;
        }

        // Convert to array
        $activity_data = array_values($activity_counts);

        // Get recent activity
        $recent_activity = $this->get_recent_activity(10);

        // Load dashboard template
        include ALGEBRA_TUTOR_PATH . 'templates/admin/dashboard.php';
    }

    /**
     * Get total number of questions.
     *
     * @return int Total questions
     */
    private function get_total_questions() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_exercises';
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    }

    /**
     * Get total number of categories.
     *
     * @return int Total categories
     */
    private function get_total_categories() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_categories';
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    }

    /**
     * Get total number of attempts.
     *
     * @return int Total attempts
     */
    private function get_total_attempts() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_results';
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    }

    /**
     * Get total number of students.
     *
     * @return int Total students
     */
    private function get_total_students() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_results';
        return (int) $wpdb->get_var("SELECT COUNT(DISTINCT user_id) FROM $table_name");
    }

    /**
     * Get total number of correct attempts.
     *
     * @return int Total correct attempts
     */
    private function get_correct_attempts() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_results';
        return (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE is_correct = 1");
    }

    /**
     * Get recent activity.
     *
     * @param int $limit Maximum number of records to get
     * @return array Recent activity items
     */
    private function get_recent_activity($limit = 10) {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';
        $questions_table = $wpdb->prefix . 'algebra_exercises';

        return $wpdb->get_results("
            SELECT r.id, r.user_id, r.question_id, r.is_correct, 
                   r.timestamp, q.question, q.category
            FROM $results_table r
            JOIN $questions_table q ON r.question_id = q.id
            ORDER BY r.timestamp DESC
            LIMIT $limit
        ");
    }
}