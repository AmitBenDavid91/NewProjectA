<?php
namespace AlgebraTutor\Database;

/**
 * Repository for results data operations.
 */
class ResultsRepo {
    /**
     * Save a user's question result.
     *
     * @param int $user_id User ID (0 for guests)
     * @param int $question_id Question ID
     * @param mixed $user_answer User's answer
     * @param bool $is_correct Whether the answer is correct
     * @return int|false The ID of the inserted result or false on failure
     */
    public function save_result($user_id, $question_id, $user_answer, $is_correct) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_results';

        // Format user answer for storage
        if (is_array($user_answer)) {
            $user_answer = json_encode($user_answer, JSON_UNESCAPED_UNICODE);
        }

        // Insert the result
        $result = $wpdb->insert(
            $table_name,
            [
                'user_id' => $user_id,
                'question_id' => $question_id,
                'user_answer' => $user_answer,
                'is_correct' => $is_correct ? 1 : 0,
            ],
            [
                '%d', // user_id
                '%d', // question_id
                '%s', // user_answer
                '%d', // is_correct
            ]
        );

        if ($result === false) {
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Get recent results.
     *
     * @param int $limit Maximum number of results to get
     * @return array Array of result objects
     */
    public function get_recent_results($limit = 10) {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';
        $questions_table = $wpdb->prefix . 'algebra_exercises';

        return $wpdb->get_results($wpdb->prepare("
            SELECT r.*, q.question, q.category
            FROM $results_table r
            JOIN $questions_table q ON r.question_id = q.id
            ORDER BY r.timestamp DESC
            LIMIT %d
        ", $limit));
    }

    /**
     * Get results by user.
     *
     * @param int $user_id User ID
     * @param int $limit Maximum number of results to get
     * @return array Array of result objects
     */
    public function get_results_by_user($user_id, $limit = 100) {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';
        $questions_table = $wpdb->prefix . 'algebra_exercises';

        return $wpdb->get_results($wpdb->prepare("
            SELECT r.*, q.question, q.category
            FROM $results_table r
            JOIN $questions_table q ON r.question_id = q.id
            WHERE r.user_id = %d
            ORDER BY r.timestamp DESC
            LIMIT %d
        ", $user_id, $limit));
    }

    /**
     * Get performance data by category.
     *
     * @return array Array of category performance objects
     */
    public function get_performance_by_category() {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';
        $questions_table = $wpdb->prefix . 'algebra_exercises';

        return $wpdb->get_results("
            SELECT q.category, 
                   COUNT(r.id) as attempts, 
                   SUM(r.is_correct) as correct,
                   (SUM(r.is_correct) / COUNT(r.id)) * 100 as success_rate
            FROM $results_table r
            JOIN $questions_table q ON r.question_id = q.id
            GROUP BY q.category
            ORDER BY success_rate DESC
        ");
    }

    /**
     * Get popular questions (most attempted).
     *
     * @param int $limit Maximum number of questions to get
     * @return array Array of popular question objects
     */
    public function get_popular_questions($limit = 5) {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';
        $questions_table = $wpdb->prefix . 'algebra_exercises';

        return $wpdb->get_results($wpdb->prepare("
            SELECT q.id, q.question, q.category, COUNT(r.id) as attempts, 
                   SUM(r.is_correct) as correct_attempts,
                   (SUM(r.is_correct) / COUNT(r.id)) * 100 as success_rate
            FROM $questions_table q
            JOIN $results_table r ON q.id = r.question_id
            GROUP BY q.id
            ORDER BY attempts DESC
            LIMIT %d
        ", $limit));
    }

    /**
     * Get top performing students.
     *
     * @param int $limit Maximum number of students to get
     * @return array Array of student performance objects
     */
    public function get_top_students($limit = 5) {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';

        return $wpdb->get_results($wpdb->prepare("
            SELECT r.user_id, 
                   COUNT(r.id) as attempts, 
                   SUM(r.is_correct) as correct,
                   (SUM(r.is_correct) / COUNT(r.id)) * 100 as success_rate
            FROM $results_table r
            GROUP BY r.user_id
            ORDER BY correct DESC
            LIMIT %d
        ", $limit));
    }

    /**
     * Get activity data for the last N days.
     *
     * @param int $days Number of days
     * @return array Array of daily activity objects
     */
    public function get_daily_activity($days = 7) {
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';

        return $wpdb->get_results($wpdb->prepare("
            SELECT DATE(timestamp) as activity_date, 
                   COUNT(id) as attempts
            FROM $results_table
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL %d DAY)
            GROUP BY DATE(timestamp)
            ORDER BY activity_date ASC
        ", $days));
    }
}