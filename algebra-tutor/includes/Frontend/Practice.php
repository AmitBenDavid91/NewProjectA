<?php
namespace AlgebraTutor\Frontend;

use AlgebraTutor\Math\MathProcessor;

/**
 * Handles the algebra practice page.
 */
class Practice {
    /**
     * Math processor instance.
     *
     * @var MathProcessor
     */
    private $math_processor;

    /**
     * Constructor.
     *
     * @param MathProcessor $math_processor Math processor instance
     */
    public function __construct(MathProcessor $math_processor) {
        $this->math_processor = $math_processor;
    }

    /**
     * Render the practice page.
     *
     * @return string HTML content
     */
    public function render_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_exercises';

        // Get categories
        $categories = $wpdb->get_col("SELECT DISTINCT category FROM $table_name ORDER BY category ASC");

        // Get selected category
        $selected_category = isset($_GET['category']) ? sanitize_text_field($_GET['category']) : '';

        // Get questions
        if (!empty($selected_category)) {
            $questions = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM $table_name WHERE category = %s ORDER BY RAND() LIMIT 5",
                    $selected_category
                )
            );
        } else {
            $questions = $wpdb->get_results("SELECT * FROM $table_name ORDER BY RAND() LIMIT 5");
        }

        // Process questions for display
        foreach ($questions as &$question) {
            // Process math in question text
            if (isset($question->question)) {
                $question->question = $this->math_processor->process_math_content($question->question);
            }

            // Process choices if they exist
            if (isset($question->choices) && !empty($question->choices)) {
                if (is_string($question->choices)) {
                    // Decode JSON
                    $choices = json_decode($question->choices);
                    if (is_array($choices)) {
                        foreach ($choices as &$choice) {
                            $choice = $this->math_processor->process_math_content($choice);
                        }
                        $question->choices = $choices; // Keep as an array for the template
                    }
                } elseif (is_array($question->choices)) {
                    foreach ($question->choices as &$choice) {
                        $choice = $this->math_processor->process_math_content($choice);
                    }
                }
            }
        }

        // Data for JavaScript
        $data = [
            'categories' => $categories,
            'selected_category' => $selected_category,
            'questions' => $questions,
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('algebra_tutor_nonce'),
            'i18n' => [
                'submit' => __('Submit Answer', 'algebra-tutor'),
                'submitted' => __('Answer Submitted', 'algebra-tutor'),
                'correct' => __('Correct!', 'algebra-tutor'),
                'incorrect' => __('Incorrect, try again', 'algebra-tutor'),
                'showAnswer' => __('Incorrect. The correct answer is: ', 'algebra-tutor'),
                'finish' => __('I\'m Done', 'algebra-tutor'),
                'loading' => __('Loading...', 'algebra-tutor'),
                'noQuestions' => __('No practice questions found.', 'algebra-tutor')
            ]
        ];

        // Start output buffering
        ob_start();

        // Include template
        include ALGEBRA_TUTOR_PATH . 'templates/frontend/practice.php';

        // Return buffered content
        return ob_get_clean();
    }

    /**
     * Handle practice answers submission via AJAX.
     */
    public function ajax_submit_answers() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_nonce', 'nonce');

        // Get question ID and answer
        $question_id = isset($_POST['question_id']) ? intval($_POST['question_id']) : 0;
        $user_answer = isset($_POST['answer']) ? sanitize_text_field($_POST['answer']) : '';
        $is_correct = isset($_POST['is_correct']) ? (bool)$_POST['is_correct'] : false;

        if (!$question_id) {
            wp_send_json_error(['message' => __('Missing question ID.', 'algebra-tutor')]);
            return;
        }

        // Get user ID (0 for guests)
        $user_id = get_current_user_id();

        // Record result in database
        global $wpdb;
        $results_table = $wpdb->prefix . 'algebra_results';

        // Format user answer for storage
        if (is_array($user_answer)) {
            $user_answer = json_encode($user_answer, JSON_UNESCAPED_UNICODE);
        }

        $result = $wpdb->insert(
            $results_table,
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
            wp_send_json_error(['message' => __('Error saving answer.', 'algebra-tutor')]);
            return;
        }

        wp_send_json_success(['message' => __('Answer saved successfully.', 'algebra-tutor')]);
    }

    /**
     * Handle finishing practice session via AJAX.
     */
    public function ajax_finish_practice() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_nonce', 'nonce');

        // Get results
        $results = isset($_POST['results']) ? json_decode(stripslashes($_POST['results']), true) : [];

        if (empty($results)) {
            wp_send_json_error(['message' => __('No results to save.', 'algebra-tutor')]);
            return;
        }

        // Here you could add additional processing for the session completion
        // For example, updating user stats, sending an email, etc.

        wp_send_json_success(['message' => __('Practice session completed.', 'algebra-tutor')]);
    }

    /**
     * Register shortcode for the practice page.
     */
    public function register_shortcode() {
        add_shortcode('algebra_tutor_practice', [$this, 'shortcode_handler']);
    }

    /**
     * Shortcode handler.
     */
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(
            [
                'category' => '',
                'count' => 5
            ],
            $atts,
            'algebra_tutor_practice'
        );

        // Override GET parameters if specified in shortcode
        if (!empty($atts['category'])) {
            $_GET['category'] = $atts['category'];
        }

        return $this->render_page();
    }
}