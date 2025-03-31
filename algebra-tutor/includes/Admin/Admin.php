<?php
namespace AlgebraTutor\Admin;

use AlgebraTutor\Math\MathProcessor;

/**
 * The admin-specific functionality of the plugin.
 */
class Admin {
    /**
     * Reference to the MathProcessor instance.
     *
     * @var MathProcessor
     */
    private $math_processor;

    /**
     * Dashboard instance.
     *
     * @var Dashboard
     */
    private $dashboard;

    /**
     * Question editor instance.
     *
     * @var QuestionEditor
     */
    private $question_editor;

    /**
     * Constructor.
     *
     * @param MathProcessor $math_processor Math processor instance
     */
    public function __construct(MathProcessor $math_processor) {
        $this->math_processor = $math_processor;
    }

    /**
     * Initialize admin functionality.
     */
    public function initialize() {
        // Initialize components
        $this->dashboard = new Dashboard();
        $this->question_editor = new QuestionEditor($this->math_processor);

        // Add hooks
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);

        // Initialize AJAX handlers
        $this->initialize_ajax_handlers();
    }

    /**
     * Register admin menu items.
     */
    public function register_admin_menu() {
        // Main menu
        add_menu_page(
            __('Algebra Tutor Dashboard', 'algebra-tutor'),
            __('Algebra Tutor', 'algebra-tutor'),
            'manage_options',
            'algebra-tutor-dashboard',
            [$this->dashboard, 'render_page'],
            'dashicons-welcome-learn-more',
            30
        );

        // Submenus
        add_submenu_page(
            'algebra-tutor-dashboard',
            __('Dashboard', 'algebra-tutor'),
            __('Dashboard', 'algebra-tutor'),
            'manage_options',
            'algebra-tutor-dashboard',
            [$this->dashboard, 'render_page']
        );

        add_submenu_page(
            'algebra-tutor-dashboard',
            __('Add Question', 'algebra-tutor'),
            __('Add Question', 'algebra-tutor'),
            'manage_options',
            'algebra-tutor-add-question',
            [$this->question_editor, 'render_add_page']
        );

        add_submenu_page(
            'algebra-tutor-dashboard',
            __('Question Bank', 'algebra-tutor'),
            __('Question Bank', 'algebra-tutor'),
            'manage_options',
            'algebra-tutor-question-bank',
            [$this->question_editor, 'render_bank_page']
        );

        add_submenu_page(
            'algebra-tutor-dashboard',
            __('Results', 'algebra-tutor'),
            __('Results', 'algebra-tutor'),
            'manage_options',
            'algebra-tutor-results',
            [$this, 'render_results_page']
        );

        add_submenu_page(
            'algebra-tutor-dashboard',
            __('Statistics', 'algebra-tutor'),
            __('Statistics', 'algebra-tutor'),
            'manage_options',
            'algebra-tutor-statistics',
            [$this, 'render_statistics_page']
        );
    }

    /**
     * Enqueue admin scripts and styles.
     *
     * @param string $hook Current admin page
     */
    public function enqueue_scripts($hook) {
        // Only load on plugin admin pages
        if (strpos($hook, 'algebra-tutor') === false) {
            return;
        }

        // Common admin styles
        wp_enqueue_style(
            'algebra-tutor-admin',
            ALGEBRA_TUTOR_URL . 'assets/css/admin.css',
            [],
            ALGEBRA_TUTOR_VERSION
        );

        // Common admin scripts
        wp_enqueue_script(
            'algebra-tutor-admin',
            ALGEBRA_TUTOR_URL . 'assets/js/admin/common.js',
            ['jquery'],
            ALGEBRA_TUTOR_VERSION,
            true
        );

        // Page-specific scripts
        if (strpos($hook, 'algebra-tutor-dashboard') !== false) {
            wp_enqueue_script(
                'algebra-tutor-dashboard',
                ALGEBRA_TUTOR_URL . 'assets/js/admin/dashboard.js',
                ['jquery', 'jquery-ui-sortable', 'wp-charts'],
                ALGEBRA_TUTOR_VERSION,
                true
            );
        } elseif (strpos($hook, 'algebra-tutor-add-question') !== false ||
            strpos($hook, 'algebra-tutor-question-bank') !== false) {
            // TinyMCE
            wp_enqueue_editor();

            // MathJax
            wp_enqueue_script(
                'mathjax-config',
                ALGEBRA_TUTOR_URL . 'assets/js/common/math-config.js',
                [],
                ALGEBRA_TUTOR_VERSION,
                false
            );

            wp_enqueue_script(
                'mathjax',
                'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
                ['mathjax-config'],
                '3.2.2',
                true
            );

            // MathLive for WYSIWYG math editing
            wp_enqueue_script(
                'mathlive',
                'https://cdn.jsdelivr.net/npm/mathlive@0.90.5/dist/mathlive.min.js',
                [],
                '0.90.5',
                true
            );

            // Question editor scripts
            wp_enqueue_script(
                'algebra-tutor-question-editor',
                ALGEBRA_TUTOR_URL . 'assets/js/admin/question-manager.js',
                ['jquery', 'jquery-ui-sortable', 'mathjax', 'mathlive'],
                ALGEBRA_TUTOR_VERSION,
                true
            );

            wp_enqueue_script(
                'algebra-tutor-math-editor',
                ALGEBRA_TUTOR_URL . 'assets/js/admin/math/editor.js',
                ['jquery', 'mathjax', 'mathlive'],
                ALGEBRA_TUTOR_VERSION,
                true
            );

            wp_enqueue_script(
                'algebra-tutor-formula-library',
                ALGEBRA_TUTOR_URL . 'assets/js/admin/math/formula-library.js',
                ['jquery', 'mathjax'],
                ALGEBRA_TUTOR_VERSION,
                true
            );

            // Localize scripts
            wp_localize_script('algebra-tutor-question-editor', 'algebraTutorAdmin', [
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('algebra_tutor_admin'),
            ]);
        }
    }

    /**
     * Initialize AJAX handlers.
     */
    private function initialize_ajax_handlers() {
        // Add category
        add_action('wp_ajax_algebra_tutor_add_category', [$this->question_editor, 'ajax_add_category']);

        // Save question
        add_action('wp_ajax_algebra_tutor_save_question', [$this->question_editor, 'ajax_save_question']);

        // Delete question
        add_action('wp_ajax_algebra_tutor_delete_question', [$this->question_editor, 'ajax_delete_question']);

        // Save draft
        add_action('wp_ajax_algebra_tutor_save_draft', [$this->question_editor, 'ajax_save_draft']);

        // Load draft
        add_action('wp_ajax_algebra_tutor_load_draft', [$this->question_editor, 'ajax_load_draft']);
    }

    /**
     * Render results page.
     */
    public function render_results_page() {
        require_once ALGEBRA_TUTOR_PATH . 'templates/admin/results.php';
    }

    /**
     * Render statistics page.
     */
    public function render_statistics_page() {
        require_once ALGEBRA_TUTOR_PATH . 'templates/admin/statistics.php';
    }
}