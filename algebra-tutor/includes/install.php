<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

function algebra_tutor_install() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'algebra_exercises';
    $results_table = $wpdb->prefix . 'algebra_results';
    $charset_collate = $wpdb->get_charset_collate();

    // יצירת טבלת שאלות
    $sql1 = "CREATE TABLE $table_name (
        id MEDIUMINT(9) NOT NULL AUTO_INCREMENT,
        question TEXT NOT NULL,
        choices TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        question_type VARCHAR(50) NOT NULL DEFAULT 'multiple-choice',
        PRIMARY KEY  (id)
    ) $charset_collate;";

    // יצירת טבלת תוצאות משתמשים
    $sql2 = "CREATE TABLE $results_table (
        id MEDIUMINT(9) NOT NULL AUTO_INCREMENT,
        user_id BIGINT(20) NOT NULL,
        question_id MEDIUMINT(9) NOT NULL,
        user_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql1);
    dbDelta($sql2);
}