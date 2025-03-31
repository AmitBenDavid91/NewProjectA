<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Handle AJAX requests for Algebra Tutor plugin.
 */

/**
 * AJAX handler for processing user actions.
 */
function algebra_tutor_handle_ajax_request() {
    // Verify the nonce for security
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'algebra_tutor_nonce')) {
        wp_send_json_error(['message' => __('Security check failed.', 'algebra-tutor')]);
        return;
    }

    // Get the action type
    if (empty($_POST['action_type'])) {
        wp_send_json_error(['message' => __('Missing action type.', 'algebra-tutor')]);
        return;
    }

    $action_type = sanitize_text_field($_POST['action_type']);

    // Debug info
    error_log('Algebra Tutor AJAX: ' . $action_type);
    error_log('POST data: ' . print_r($_POST, true));

    global $wpdb;

    switch ($action_type) {
        case 'submit_practice_answers':
        case 'check_answers':
            if (!isset($_POST['answers']) || !is_array($_POST['answers'])) {
                wp_send_json_error(['message' => __('Answers data is missing or invalid.', 'algebra-tutor')]);
                return;
            }

            $answers = $_POST['answers'];
            $table_name = $wpdb->prefix . 'algebra_exercises';
            $score = 0;
            $solutions = [];

            foreach ($answers as $question_id => $user_answer) {
                $question_id = intval($question_id);
                $question = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $question_id));

                if ($question) {
                    // Process the answer based on question type
                    $is_correct = false;

                    if ($question->question_type === 'multiple') {
                        // For multiple choice, compare directly
                        $is_correct = trim($user_answer) === trim($question->correct_answer);
                    }
                    else if ($question->question_type === 'fill') {
                        // For fill-in-the-blank, compare with JSON array
                        $correct_answers = json_decode($question->correct_answer);

                        // If user answer contains commas, split it (from form data)
                        $user_answers = strpos($user_answer, ',') !== false ?
                            explode(',', $user_answer) :
                            [$user_answer];

                        // Check if arrays match
                        if (is_array($correct_answers) && count($correct_answers) === count($user_answers)) {
                            $is_correct = true;
                            for ($i = 0; $i < count($correct_answers); $i++) {
                                if (trim($user_answers[$i]) !== trim($correct_answers[$i])) {
                                    $is_correct = false;
                                    break;
                                }
                            }
                        }
                    }

                    if ($is_correct) {
                        $score++;
                    }

                    $solutions[] = [
                        'question' => $question->question,
                        'correct_answer' => $question->correct_answer,
                        'explanation' => $is_correct ? __('Correct!', 'algebra-tutor') : __('Incorrect. Try again.', 'algebra-tutor'),
                    ];
                }
            }

            // Save results to database if this is a submission (not just checking)
            if ($action_type === 'submit_practice_answers') {
                // ... save to database code would go here ...
            }

            wp_send_json_success([
                'score' => $score,
                'solutions' => $solutions,
            ]);
            break;

        default:
            wp_send_json_error(['message' => __('Unknown action type.', 'algebra-tutor')]);
    }
}

// Register the AJAX handler for logged-in users
add_action('wp_ajax_algebra_tutor_handle_ajax', 'algebra_tutor_handle_ajax_request');

// Register the AJAX handler for guests
add_action('wp_ajax_nopriv_algebra_tutor_handle_ajax', 'algebra_tutor_handle_ajax_request');