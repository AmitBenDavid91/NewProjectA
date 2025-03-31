<?php
namespace AlgebraTutor\Admin;

use AlgebraTutor\Math\MathProcessor;
use AlgebraTutor\Database\QuestionsRepo;

/**
 * Handles question editing in the admin.
 */
class QuestionEditor {
    /**
     * Math processor instance.
     *
     * @var MathProcessor
     */
    private $math_processor;

    /**
     * Questions repository instance.
     *
     * @var QuestionsRepo
     */
    private $questions_repo;

    /**
     * Constructor.
     *
     * @param MathProcessor $math_processor Math processor instance
     */
    public function __construct(MathProcessor $math_processor) {
        $this->math_processor = $math_processor;
        $this->questions_repo = new QuestionsRepo();

        // Add TinyMCE customizations
        add_filter('mce_buttons', [$this, 'register_mce_button']);
        add_filter('mce_external_plugins', [$this, 'add_mce_plugin']);
        add_filter('tiny_mce_before_init', [$this, 'configure_tinymce']);
    }

    /**
     * Register custom TinyMCE button.
     *
     * @param array $buttons Array of buttons
     * @return array Modified array of buttons
     */
    public function register_mce_button($buttons) {
        array_push($buttons, 'separator', 'myMathButton');
        return $buttons;
    }

    /**
     * Add custom TinyMCE plugin.
     *
     * @param array $plugins Array of plugins
     * @return array Modified array of plugins
     */
    public function add_mce_plugin($plugins) {
        $plugins['myMathButton'] = ALGEBRA_TUTOR_URL . 'assets/js/admin/math/my-math-button.js';
        return $plugins;
    }

    /**
     * Configure TinyMCE for math editing.
     *
     * @param array $init TinyMCE init configuration
     * @return array Modified configuration
     */
    public function configure_tinymce($init) {
        // Add custom elements to the valid elements list
        $custom_elements = 'span[class|contenteditable|data-latex|data-display],div[class|contenteditable|data-latex|data-display]';

        // Append to extended_valid_elements if it exists
        if (isset($init['extended_valid_elements'])) {
            $init['extended_valid_elements'] .= ',' . $custom_elements;
        } else {
            $init['extended_valid_elements'] = $custom_elements;
        }

        // Configure TinyMCE to preserve math elements
        $init['verify_html'] = false;
        $init['allow_html_in_named_anchor'] = true;
        $init['valid_children'] = '+body[span|div],+p[span|div]';

        return $init;
    }

    /**
     * Render the add question page.
     */
    public function render_add_page() {
        global $wpdb;
        $category_table = $wpdb->prefix . 'algebra_categories';
        $categories = $wpdb->get_results("SELECT * FROM $category_table ORDER BY name ASC");

        $message = '';

        // Handle form submission
        if ($_SERVER["REQUEST_METHOD"] === "POST" && check_admin_referer('algebra_tutor_add_question')) {
            $message = $this->process_question_submission();
        }

        // Load template
        include ALGEBRA_TUTOR_PATH . 'templates/admin/question-editor.php';
    }

    /**
     * Process question form submission.
     *
     * @return string Message about the result
     */
    private function process_question_submission() {
        // Check if this is an AJAX submission - if so, skip processing here to avoid duplication
        if (wp_doing_ajax()) {
            return '';
        }

        // Check required fields
        if (empty($_POST['new_question']) || empty($_POST['category']) || empty($_POST['difficulty'])) {
            return '<div class="error"><p>' . __('Missing required fields. Please fill in the question text, category, and difficulty.', 'algebra-tutor') . '</p></div>';
        }

        $question_type = sanitize_text_field($_POST['question_type']);
        $question_text = wp_kses_post($_POST['new_question']);

        // Process math formulas
        $question_text = $this->math_processor->convert_html_to_latex($question_text);

        $category = sanitize_text_field($_POST['category']);
        $difficulty = sanitize_text_field($_POST['difficulty']);

        $data = [
            'question' => $question_text,
            'question_type' => $question_type,
            'category' => $category,
            'difficulty' => $difficulty,
        ];

        // Handle different question types
        if ($question_type === 'multiple') {
            // Multiple choice question
            if (empty($_POST['answers']) || !isset($_POST['correct_answer'])) {
                return '<div class="error"><p>' . __('Missing answer options or correct answer.', 'algebra-tutor') . '</p></div>';
            }

            $answers = array_map('sanitize_text_field', $_POST['answers']);
            $data['choices'] = $answers;

            // Correct answer index - ensure it's properly formatted as 1-based index
            $correct_answer = intval($_POST['correct_answer']) + 1;
            $data['correct_answer'] = (string)$correct_answer;
        } elseif ($question_type === 'fill') {
            // Fill-in-the-blank question
            if (empty($_POST['fill_correct_answers'])) {
                return '<div class="error"><p>' . __('No fill-in-the-blank answers found.', 'algebra-tutor') . '</p></div>';
            }

            $fill_answers = array_map('sanitize_text_field', $_POST['fill_correct_answers']);
            $data['correct_answers'] = $fill_answers;
        } else {
            return '<div class="error"><p>' . __('Invalid question type.', 'algebra-tutor') . '</p></div>';
        }

        // Add the question
        $result = $this->questions_repo->add_question($data);

        if ($result === false) {
            return '<div class="error"><p>' . __('Error saving the question.', 'algebra-tutor') . '</p></div>';
        }

        return '<div class="updated"><p>' . sprintf(__('Question added successfully! (Question ID: %d)', 'algebra-tutor'), $result) . '</p></div>';
    }

    /**
     * Render the question bank page.
     */
    public function render_bank_page() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_exercises';
        $category_table = $wpdb->prefix . 'algebra_categories';

        // Handle question editing
        if (isset($_GET['edit'])) {
            $question_id = intval($_GET['edit']);
            $question = $this->questions_repo->get_question($question_id);

            if ($question) {
                $categories = $wpdb->get_results("SELECT * FROM $category_table ORDER BY name ASC");

                // Process form submission for editing
                $message = '';
                if ($_SERVER["REQUEST_METHOD"] === "POST" && check_admin_referer('algebra_tutor_edit_question')) {
                    $message = $this->process_question_edit($question_id);
                }

                // Load edit template
                include ALGEBRA_TUTOR_PATH . 'templates/admin/question-editor.php';
                return;
            }
        }

        // Handle question deletion
        if (isset($_GET['delete']) && isset($_GET['_wpnonce']) && wp_verify_nonce($_GET['_wpnonce'], 'delete-question_' . $_GET['delete'])) {
            $question_id = intval($_GET['delete']);
            $this->questions_repo->delete_question($question_id);

            echo '<div class="updated"><p>' . __('Question deleted successfully!', 'algebra-tutor') . '</p></div>';
        }

        // Get all questions
        $questions = $this->questions_repo->get_all_questions();

        // Handle adding a new category
        if (!empty($_POST['new_category']) && check_admin_referer('algebra_tutor_admin')) {
            $new_category = sanitize_text_field($_POST['new_category']);
            $result = $this->questions_repo->add_category($new_category);

            if ($result !== false) {
                echo '<div class="updated"><p>' . __('Category added successfully!', 'algebra-tutor') . '</p></div>';
            } else {
                echo '<div class="error"><p>' . __('Error adding category. It may already exist.', 'algebra-tutor') . '</p></div>';
            }
        }

        // Get categories
        $categories = $wpdb->get_results("SELECT * FROM $category_table ORDER BY name ASC");

        // Load question bank template
        include ALGEBRA_TUTOR_PATH . 'templates/admin/question-bank.php';
    }

    /**
     * Process question edit submission.
     *
     * @param int $question_id Question ID
     * @return string Message about the result
     */
    private function process_question_edit($question_id) {
        // Skip if AJAX to avoid duplication
        if (wp_doing_ajax()) {
            return '';
        }

        // Check required fields
        if (empty($_POST['new_question']) || empty($_POST['category']) || empty($_POST['difficulty'])) {
            return '<div class="error"><p>' . __('Missing required fields. Please fill in the question text, category, and difficulty.', 'algebra-tutor') . '</p></div>';
        }

        $question_type = sanitize_text_field($_POST['question_type']);
        $question_text = wp_kses_post($_POST['new_question']);

        // Process math formulas
        $question_text = $this->math_processor->convert_html_to_latex($question_text);

        $category = sanitize_text_field($_POST['category']);
        $difficulty = sanitize_text_field($_POST['difficulty']);

        $data = [
            'question' => $question_text,
            'question_type' => $question_type,
            'category' => $category,
            'difficulty' => $difficulty,
        ];

        // Handle different question types
        if ($question_type === 'multiple') {
            // Multiple choice question
            if (empty($_POST['answers']) || !isset($_POST['correct_answer'])) {
                return '<div class="error"><p>' . __('Missing answer options or correct answer.', 'algebra-tutor') . '</p></div>';
            }

            $answers = array_map('sanitize_text_field', $_POST['answers']);
            $data['choices'] = $answers;

            // Correct answer index - ensure it's properly formatted as 1-based index
            $correct_answer = intval($_POST['correct_answer']) + 1;
            $data['correct_answer'] = (string)$correct_answer;
        } elseif ($question_type === 'fill') {
            // Fill-in-the-blank question
            if (empty($_POST['fill_correct_answers'])) {
                return '<div class="error"><p>' . __('No fill-in-the-blank answers found.', 'algebra-tutor') . '</p></div>';
            }

            $fill_answers = array_map('sanitize_text_field', $_POST['fill_correct_answers']);
            $data['correct_answers'] = $fill_answers;
        } else {
            return '<div class="error"><p>' . __('Invalid question type.', 'algebra-tutor') . '</p></div>';
        }

        // Update the question
        $result = $this->questions_repo->update_question($question_id, $data);

        if ($result === false) {
            return '<div class="error"><p>' . __('Error updating the question.', 'algebra-tutor') . '</p></div>';
        }

        return '<div class="updated"><p>' . __('Question updated successfully!', 'algebra-tutor') . '</p></div>';
    }

    /**
     * AJAX handler for adding a category.
     */
    public function ajax_add_category() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_admin', 'nonce');

        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'algebra-tutor')]);
            return;
        }

        // Check if category name is provided
        if (empty($_POST['category_name'])) {
            wp_send_json_error(['message' => __('Category name is required.', 'algebra-tutor')]);
            return;
        }

        $category_name = sanitize_text_field($_POST['category_name']);
        $result = $this->questions_repo->add_category($category_name);

        if ($result === false) {
            wp_send_json_error(['message' => __('Error adding category. It may already exist.', 'algebra-tutor')]);
            return;
        }

        wp_send_json_success([
            'category_id' => $result,
            'category_name' => $category_name
        ]);
    }

    /**
     * AJAX handler for saving a question.
     */
    public function ajax_save_question() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_admin', 'nonce');

        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'algebra-tutor')]);
            return;
        }

        // Get and validate input data
        $input = json_decode(stripslashes($_POST['data']), true);
        if (empty($input)) {
            wp_send_json_error(['message' => __('Invalid request data.', 'algebra-tutor')]);
            return;
        }

        // Process question data
        $question_data = [
            'question' => $this->math_processor->convert_html_to_latex($input['content']),
            'question_type' => $input['type'],
            'category' => $input['category'],
            'difficulty' => $input['difficulty'],
        ];

        // Handle different question types
        if ($input['type'] === 'multiple') {
            $question_data['choices'] = $input['answers'];
            // Ensure correct_answer is 1-based index for DB storage
            $question_data['correct_answer'] = (string)(intval($input['correctAnswer']) + 1);
        } elseif ($input['type'] === 'fill') {
            $question_data['correct_answers'] = $input['answers'];
        }

        // Update or insert question
        if (!empty($input['question_id'])) {
            // Update existing question
            $result = $this->questions_repo->update_question($input['question_id'], $question_data);
            $message = __('Question updated successfully!', 'algebra-tutor');
            $question_id = $input['question_id'];
        } else {
            // Add new question
            $result = $this->questions_repo->add_question($question_data);
            $message = sprintf(__('Question added successfully! (Question ID: %d)', 'algebra-tutor'), $result);
            $question_id = $result;
        }

        if ($result === false) {
            wp_send_json_error(['message' => __('Error saving the question.', 'algebra-tutor')]);
            return;
        }

        wp_send_json_success([
            'message' => $message,
            'question_id' => $question_id
        ]);
    }

    /**
     * AJAX handler for getting a question for preview.
     */
    public function ajax_get_question() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_admin', 'nonce');

        // Check if question ID is provided
        if (empty($_POST['question_id'])) {
            wp_send_json_error(['message' => __('Question ID is required.', 'algebra-tutor')]);
            return;
        }

        $question_id = intval($_POST['question_id']);
        $question = $this->questions_repo->get_question($question_id);

        if (!$question) {
            wp_send_json_error(['message' => __('Question not found.', 'algebra-tutor')]);
            return;
        }

        // Process the choices if they exist
        if (!empty($question->choices)) {
            $question->choices = json_decode($question->choices);
        }

        wp_send_json_success($question);
    }

    /**
     * AJAX handler for deleting a question.
     */
    public function ajax_delete_question() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_admin', 'nonce');

        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'algebra-tutor')]);
            return;
        }

        // Check if question ID is provided
        if (empty($_POST['question_id'])) {
            wp_send_json_error(['message' => __('Question ID is required.', 'algebra-tutor')]);
            return;
        }

        $question_id = intval($_POST['question_id']);
        $result = $this->questions_repo->delete_question($question_id);

        if ($result === false) {
            wp_send_json_error(['message' => __('Error deleting the question.', 'algebra-tutor')]);
            return;
        }

        wp_send_json_success(['message' => __('Question deleted successfully!', 'algebra-tutor')]);
    }

    /**
     * AJAX handler for saving a draft.
     */
    public function ajax_save_draft() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_admin', 'nonce');

        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'algebra-tutor')]);
            return;
        }

        $user_id = get_current_user_id();
        $draft_content = isset($_POST['draft']) ? wp_kses_post($_POST['draft']) : '';
        $draft_meta = isset($_POST['meta']) ? $_POST['meta'] : [];

        // Save draft in user meta
        update_user_meta($user_id, 'algebra_tutor_draft', $draft_content);
        update_user_meta($user_id, 'algebra_tutor_draft_meta', $draft_meta);

        wp_send_json_success([
            'message' => __('Draft saved successfully.', 'algebra-tutor'),
            'time' => current_time('H:i:s')
        ]);
    }

    /**
     * AJAX handler for loading a draft.
     */
    public function ajax_load_draft() {
        // Verify security nonce
        check_ajax_referer('algebra_tutor_admin', 'nonce');

        // Verify user capabilities
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'algebra-tutor')]);
            return;
        }

        $user_id = get_current_user_id();
        $draft_content = get_user_meta($user_id, 'algebra_tutor_draft', true);
        $draft_meta = get_user_meta($user_id, 'algebra_tutor_draft_meta', true);

        wp_send_json_success([
            'content' => $draft_content,
            'meta' => $draft_meta
        ]);
    }
}