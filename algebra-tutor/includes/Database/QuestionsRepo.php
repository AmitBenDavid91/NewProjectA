<?php
namespace AlgebraTutor\Database;

/**
 * Repository for question data operations.
 */
class QuestionsRepo {
    /**
     * Get all categories.
     *
     * @return array List of category names
     */
    public function get_categories() {
        global $wpdb;
        $category_table = $wpdb->prefix . 'algebra_categories';

        return $wpdb->get_col("SELECT name FROM $category_table ORDER BY name ASC");
    }

    /**
     * Get a single category by ID.
     *
     * @param int $category_id Category ID
     * @return object|null Category object or null if not found
     */
    public function get_category($category_id) {
        global $wpdb;
        $category_table = $wpdb->prefix . 'algebra_categories';

        return $wpdb->get_row($wpdb->query(
            "SELECT * FROM $category_table WHERE id = %d",
            $category_id
        ));
    }

    /**
     * Add a new category.
     *
     * @param string $name Category name
     * @return int|false The ID of the inserted category or false on failure
     */
    public function add_category($name) {
        global $wpdb;
        $category_table = $wpdb->prefix . 'algebra_categories';

        // Check if category already exists
        $exists = $wpdb->get_var($wpdb->query(
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
     * Get a single question by ID.
     *
     * @param int $question_id Question ID
     * @return object|null Question object or null if not found
     */
    public function get_question($question_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_exercises';

        return $wpdb->get_row($wpdb->query(
            "SELECT * FROM $table_name WHERE id = %d",
            $question_id
        ));
    }

    /**
     * Get questions by category.
     *
     * @param string $category Category name
     * @param int $limit Maximum number of questions to get
     * @param string $difficulty Difficulty level (optional)
     * @return array Array of question objects
     */
    public function get_questions_by_category($category, $limit = 10, $difficulty = '') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_exercises';

        $query = "SELECT * FROM $table_name WHERE category = %s";
        $params = [$category];

        if (!empty($difficulty)) {
            $query .= " AND difficulty = %s";
            $params[] = $difficulty;
        }

        $query .= " ORDER BY RAND() LIMIT %d";
        $params[] = $limit;

        return $wpdb->get_results($wpdb->prepare($query, $params));
    }

    /**
     * Get random questions.
     *
     * @param int $limit Maximum number of questions to get
     * @param string $difficulty Difficulty level (optional)
     * @return array Array of question objects
     */
    public function get_random_questions($limit = 10, $difficulty = '') {
        global $wpdb;
        $table_name = $wpdb->prefix . 'algebra_exercises';

        $query = "SELECT * FROM $table_name";
        $params = [];

        if (!empty($difficulty)) {
            $query .= " WHERE difficulty = %s";
            $params[] = $difficulty;
        }

        $query .= " ORDER BY RAND() LIMIT %d";
        $params[] = $limit;

        return $wpdb->get_results($wpdb->prepare($query, $params));
    }

    /**
     * Add a new question.
     *
     * @param array $data Question data
     * @return int|false The ID of the inserted question or false on failure
     */
    public function add_question($data) {
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

        // Insert the question
        $result = $wpdb->insert(
            $table_name,
            $question_data,
            [
                '%s', // question
                '%s', // question_type
                '%s', // category
                '%s', // difficulty
                '%s', // choices
                '%s', // correct_answer
            ]
        );

        if ($result === false) {
            return false;
        }

        return $wpdb->insert_id;
    }

    /**
     * Update an existing question.
     *
     * @param int $question_id Question ID
     * @param array $data Question data
     * @return bool True on success, false on failure
     */
    public function update_question($question_id, $data) {
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

        // Update the question
        $result = $wpdb->update(
            $table_name,
            $question_data,
            ['id' => $question_id],
            [
                '%s', // question
                '%s', // question_type
                '%s', // category
                '%s', // difficulty
                '%s', // choices
                '%s', // correct_answer
            ],
            ['%d'] // id
        );

        return $result !== false;
    }

    /**
     * Delete a question.
     *
     * @param int $question_id Question ID
     * @return bool True on success, false on failure
     */
    public function delete_question($question_id) {
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
     * Get all questions.
     *
     * @param string $orderby Column to order by
     * @param string $order Order direction (ASC or DESC)
     * @return array Array of question objects
     */
    public function get_all_questions($orderby = 'id', $order = 'DESC') {
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
}