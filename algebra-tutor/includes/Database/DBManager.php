<?php
namespace AlgebraTutor\Database;

/**
 * Handles database operations for the plugin.
 */
class DBManager {
    /**
     * Create required database tables.
     */
    public function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // Exercises table
        $table_name = $wpdb->prefix . 'algebra_exercises';
        $sql1 = "CREATE TABLE IF NOT EXISTS $table_name (
            id MEDIUMINT(9) NOT NULL AUTO_INCREMENT,
            question TEXT NOT NULL,
            choices TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            difficulty VARCHAR(20) NOT NULL,
            question_type VARCHAR(50) NOT NULL DEFAULT 'multiple-choice',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        // Results table
        $results_table = $wpdb->prefix . 'algebra_results';
        $sql2 = "CREATE TABLE IF NOT EXISTS $results_table (
            id MEDIUMINT(9) NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) NOT NULL,
            question_id MEDIUMINT(9) NOT NULL,
            user_answer TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY question_id (question_id)
        ) $charset_collate;";

        // Categories table
        $categories_table = $wpdb->prefix . 'algebra_categories';
        $sql3 = "CREATE TABLE IF NOT EXISTS $categories_table (
            id MEDIUMINT(9) NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            parent_id MEDIUMINT(9) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY name (name)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql1);
        dbDelta($sql2);
        dbDelta($sql3);
    }

    /**
     * Drop plugin tables on uninstall.
     */
    public function drop_tables() {
        global $wpdb;
        $tables = ['algebra_exercises', 'algebra_results', 'algebra_categories'];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}$table");
        }
    }
}