<?php
/**
 * Utility functions for Algebra Tutor
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sanitizes LaTeX to ensure proper formatting
 *
 * @param string $latex LaTeX string to sanitize
 * @param bool $display_mode Whether it's a block or inline formula
 * @return string Sanitized LaTeX string
 */
function algebra_tutor_sanitize_latex($latex, $display_mode = false) {
    // Remove unnecessary escape characters
    $latex = stripslashes($latex);

    // Remove outer delimiters if they exist
    $latex = preg_replace('/^(\\\\\[|\\\\\()|(\\\\\]|\\\\\))$/', '', $latex);

    // Trim any extra whitespace
    $latex = trim($latex);

    // Basic validation - check for balanced braces
    $open_braces = substr_count($latex, '{');
    $close_braces = substr_count($latex, '}');

    if ($open_braces !== $close_braces) {
        // Attempt to fix unbalanced braces
        if ($open_braces > $close_braces) {
            $latex .= str_repeat('}', $open_braces - $close_braces);
        } else {
            $latex = str_repeat('{', $close_braces - $open_braces) . $latex;
        }
    }

    // Ensure proper MathJax delimiters
    if ($display_mode) {
        return '\[' . $latex . '\]';
    } else {
        return '\(' . $latex . '\)';
    }
}

/**
 * Convert HTML math elements to LaTeX notation for saving
 *
 * @param string $content Content with HTML math elements
 * @return string Content with LaTeX notation
 */
function algebra_tutor_convert_html_to_latex($content) {
    // Convert span inline elements
    $content = preg_replace_callback(
        '/<span\s+class=["\']algebra-tutor-math\s+math-inline["\']\s+data-latex=["\']([^"\']*)["\'].*?>.*?<\/span>/s',
        function($matches) {
            $latex = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
            return '\(' . $latex . '\)';
        },
        $content
    );

    // Convert div block elements
    $content = preg_replace_callback(
        '/<div\s+class=["\']algebra-tutor-math\s+math-block["\']\s+data-latex=["\']([^"\']*)["\'].*?>.*?<\/div>/s',
        function($matches) {
            $latex = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
            return '\[' . $latex . '\]';
        },
        $content
    );

    return $content;
}

/**
 * Process math elements in content for display
 *
 * @param string $content The content to process
 * @return string The processed content
 */
function algebra_tutor_process_math_for_display($content) {
    // Process inline math elements: \( ... \)
    $content = preg_replace_callback('/\\\\\((.*?)\\\\\)/s', function($matches) {
        return algebra_tutor_create_inline_element($matches[1]);
    }, $content);

    // Process block math elements: \[ ... \]
    $content = preg_replace_callback('/\\\\\[(.*?)\\\\\]/s', function($matches) {
        return algebra_tutor_create_block_element($matches[1]);
    }, $content);

    return $content;
}

/**
 * Create an inline math element
 *
 * @param string $latex The LaTeX content
 * @return string HTML for the inline math element
 */
function algebra_tutor_create_inline_element($latex) {
    $latex = trim($latex);
    $encoded_latex = htmlspecialchars($latex, ENT_QUOTES, 'UTF-8');

    return sprintf(
        '<span class="algebra-tutor-math math-inline" data-latex="%s">\(%s\)</span>',
        $encoded_latex,
        $latex
    );
}

/**
 * Create a block math element
 *
 * @param string $latex The LaTeX content
 * @return string HTML for the block math element
 */
function algebra_tutor_create_block_element($latex) {
    $latex = trim($latex);
    $encoded_latex = htmlspecialchars($latex, ENT_QUOTES, 'UTF-8');

    return sprintf(
        '<div class="algebra-tutor-math math-block" data-latex="%s">\[%s\]</div>',
        $encoded_latex,
        $latex
    );
}

/**
 * Get all question categories
 *
 * @return array Array of category objects
 */
function algebra_tutor_get_categories() {
    global $wpdb;
    $category_table = $wpdb->prefix . 'algebra_categories';

    return $wpdb->get_results("SELECT * FROM $category_table ORDER BY name ASC");
}

/**
 * Get a single question by ID
 *
 * @param int $question_id Question ID
 * @return object|null Question object or null if not found
 */
function algebra_tutor_get_question($question_id) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'algebra_exercises';

    return $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE id = %d",
        intval($question_id)
    ));
}

/**
 * Add a new category
 *
 * @param string $name Category name
 * @return int|false The ID of the inserted category or false on failure
 */
function algebra_tutor_add_category($name) {
    global $wpdb;
    $category_table = $wpdb->prefix . 'algebra_categories';

    // Check if category already exists
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $category_table WHERE name = %s",
        $name
    ));

    if ($exists) {
        return false;
    }

    // Insert the category
    $result = $wpdb->insert(
        $category_table,
        ['name' => $name],
        ['%s']
    );

    if ($result === false) {
        return false;
    }

    return $wpdb->insert_id;
}

/**
 * Save a question to the database
 *
 * @param array $data Question data
 * @param int|null $question_id Question ID for updates (null for new questions)
 * @return int|false The question ID or false on failure


/**
 * Delete a question
 *
 * @param int $question_id Question ID
 * @return bool True on success, false on failure
 */
function algebra_tutor_delete_question($question_id) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'algebra_exercises';

    $result = $wpdb->delete(
        $table_name,
        ['id' => $question_id],
        ['%d']
    );

    return $result !== false;
}

/**
 * Get all questions
 *
 * @param string $orderby Column to order by
 * @param string $order Order direction (ASC or DESC)
 * @return array Array of question objects
 */
function algebra_tutor_get_all_questions($orderby = 'id', $order = 'DESC') {
    global $wpdb;
    $table_name = $wpdb->prefix . 'algebra_exercises';

    // Sanitize orderby and order
    $allowed_columns = ['id', 'category', 'difficulty', 'created_at'];
    $orderby = in_array($orderby, $allowed_columns) ? $orderby : 'id';
    $order = strtoupper($order) === 'ASC' ? 'ASC' : 'DESC';

    return $wpdb->get_results(
        "SELECT * FROM $table_name ORDER BY $orderby $order"
    );
}

/**
 * Save a draft question for a user
 *
 * @param int $user_id User ID
 * @param string $content Draft content
 * @param array $meta Draft metadata
 * @return bool Success status
 */
function algebra_tutor_save_draft($user_id, $content, $meta = []) {
    update_user_meta($user_id, 'algebra_tutor_draft', $content);
    update_user_meta($user_id, 'algebra_tutor_draft_meta', $meta);
    return true;
}

/**
 * Load a draft question for a user
 *
 * @param int $user_id User ID
 * @return array Draft data with 'content' and 'meta' keys
 */
function algebra_tutor_load_draft($user_id) {
    return [
        'content' => get_user_meta($user_id, 'algebra_tutor_draft', true),
        'meta' => get_user_meta($user_id, 'algebra_tutor_draft_meta', true)
    ];
}

/**
 * Format error message
 *
 * @param string $message Error message
 * @return string Formatted HTML
 */
function algebra_tutor_error_message($message) {
    return '<div class="error"><p>' . esc_html($message) . '</p></div>';
}

/**
 * Format success message
 *
 * @param string $message Success message
 * @return string Formatted HTML
 */
function algebra_tutor_success_message($message) {
    return '<div class="updated"><p>' . esc_html($message) . '</p></div>';
}

/**
 * Clean user input from question form
 *
 * @param array $data Raw form data
 * @return array Sanitized data
 */



function algebra_tutor_sanitize_question_form($data) {
    $sanitized = [];

    // Basic fields
    if (isset($data['new_question'])) {
        $sanitized['question'] = wp_kses_post($data['new_question']);
        // Process math in question
        $sanitized['question'] = algebra_tutor_convert_html_to_latex($sanitized['question']);
    }

    if (isset($data['question_type'])) {
        $sanitized['question_type'] = sanitize_text_field($data['question_type']);
    }

    if (isset($data['category'])) {
        $sanitized['category'] = sanitize_text_field($data['category']);
    }

    if (isset($data['difficulty'])) {
        $sanitized['difficulty'] = sanitize_text_field($data['difficulty']);
    }

    // Multiple choice answers
    if (isset($data['answers']) && is_array($data['answers'])) {
        $sanitized['choices'] = array_map('sanitize_text_field', $data['answers']);
    }

    if (isset($data['correct_answer'])) {
        $sanitized['correct_answer'] = sanitize_text_field($data['correct_answer']);
    }

    // Fill-in-the-blank answers
    if (isset($data['fill_correct_answers']) && is_array($data['fill_correct_answers'])) {
        $sanitized['correct_answers'] = array_map('sanitize_text_field', $data['fill_correct_answers']);
    }

    return $sanitized;
}




/**
 * Save a question to the database
 *
 * @param array $data Question data
 * @param int|null $question_id Question ID for updates (null for new questions)
 * @return int|false The question ID or false on failure
 */
function algebra_tutor_save_question($data, $question_id = null) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'algebra_exercises';

    // Prepare data
    $question_data = [
        'question' => $data['question'],
        'question_type' => $data['question_type'],
        'category' => $data['category'],
        'difficulty' => $data['difficulty'],
    ];

    // Handle different question types
    if ($data['question_type'] === 'multiple') {
        $question_data['choices'] = json_encode($data['choices'], JSON_UNESCAPED_UNICODE);
        $question_data['correct_answer'] = $data['correct_answer'];
    } else if ($data['question_type'] === 'fill') {
        $question_data['choices'] = '';
        $question_data['correct_answer'] = json_encode($data['correct_answers'], JSON_UNESCAPED_UNICODE);
    }

    // Format strings
    $format = [
        '%s', // question
        '%s', // question_type
        '%s', // category
        '%s', // difficulty
        '%s', // choices
        '%s', // correct_answer
    ];

    // Update or insert
    if ($question_id) {
        // Update existing question
        $result = $wpdb->update(
            $table_name,
            $question_data,
            ['id' => $question_id],
            $format,
            ['%d'] // id
        );

        return ($result !== false) ? $question_id : false;
    } else {
        // Insert new question
        $result = $wpdb->insert(
            $table_name,
            $question_data,
            $format
        );

        return ($result !== false) ? $wpdb->insert_id : false;
    }
}



/**
 * Get formula library categories and formulas
 *
 * @return array Formula library data
 */
function algebra_tutor_get_formula_library() {
    // This is a simplified version - in a full implementation this would come from a database or API
    return [
        [
            'id' => 'algebra',
            'name' => __('Algebra', 'algebra-tutor'),
            'formulas' => [
                [
                    'name' => __('Quadratic Formula', 'algebra-tutor'),
                    'latex' => 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
                ],
                [
                    'name' => __('Binomial Expansion (a+b)²', 'algebra-tutor'),
                    'latex' => '(a+b)^2 = a^2 + 2ab + b^2'
                ],
                [
                    'name' => __('Binomial Expansion (a-b)²', 'algebra-tutor'),
                    'latex' => '(a-b)^2 = a^2 - 2ab + b^2'
                ],
                [
                    'name' => __('Difference of Squares', 'algebra-tutor'),
                    'latex' => '(a+b)(a-b) = a^2 - b^2'
                ]
            ]
        ],
        [
            'id' => 'geometry',
            'name' => __('Geometry', 'algebra-tutor'),
            'formulas' => [
                [
                    'name' => __('Circle Area', 'algebra-tutor'),
                    'latex' => 'A = \\pi r^2'
                ],
                [
                    'name' => __('Triangle Area', 'algebra-tutor'),
                    'latex' => 'A = \\frac{1}{2}bh'
                ],
                [
                    'name' => __('Pythagorean Theorem', 'algebra-tutor'),
                    'latex' => 'a^2 + b^2 = c^2'
                ]
            ]
        ]
    ];
}