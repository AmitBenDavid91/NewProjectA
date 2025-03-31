<?php
namespace AlgebraTutor\Frontend;

use AlgebraTutor\Math\MathProcessor;

/**
 * Handles all frontend functionality.
 */
class Frontend {
    /**
     * Math processor instance.
     *
     * @var MathProcessor
     */
    private $math_processor;

    /**
     * Practice page handler.
     *
     * @var Practice
     */
    private $practice;

    /**
     * Constructor.
     *
     * @param MathProcessor $math_processor Math processor instance
     */
    public function __construct(MathProcessor $math_processor) {
        $this->math_processor = $math_processor;
        $this->practice = new Practice($math_processor);
    }

    /**
     * Initialize frontend functionality.
     */
    public function initialize() {
        // Register hooks
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_filter('wp_nav_menu_items', [$this, 'add_menu_item'], 10, 2);

        // Register shortcodes
        add_shortcode('algebra_tutor_practice', [$this->practice, 'shortcode_handler']);

        // Initialize AJAX handlers
        $this->initialize_ajax_handlers();
    }

    /**
     * Enqueue frontend scripts and styles.
     */
    public function enqueue_scripts() {
        global $post;
        $load_scripts = false;

        // Check if we need to load MathJax
        if (is_singular() && $post) {
            if (strpos($post->post_content, 'algebra-tutor-math') !== false ||
                strpos($post->post_content, '\(') !== false ||
                strpos($post->post_content, '\[') !== false ||
                has_shortcode($post->post_content, 'algebra_tutor_practice') ||
                has_shortcode($post->post_content, 'math') ||
                has_shortcode($post->post_content, 'algebra_formula')) {
                $load_scripts = true;
            }
        }

        // Check if this is the practice page
        if (is_page('algebra-practice') || isset($_GET['algebra_tutor_practice'])) {
            $load_scripts = true;
        }

        // Allow other plugins to force loading math scripts
        $load_scripts = apply_filters('algebra_tutor_load_math_scripts', $load_scripts);

        if ($load_scripts) {
            // Load MathJax configuration
            wp_enqueue_script(
                'mathjax-config',
                ALGEBRA_TUTOR_URL . 'assets/js/common/math-config.js',
                [],
                ALGEBRA_TUTOR_VERSION,
                false
            );

            // Load MathJax
            wp_enqueue_script(
                'mathjax',
                'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
                ['mathjax-config'],
                '3.2.2',
                true
            );

            // Load frontend styles
            wp_enqueue_style(
                'algebra-tutor-frontend',
                ALGEBRA_TUTOR_URL . 'assets/css/frontend.css',
                [],
                ALGEBRA_TUTOR_VERSION
            );

            // Math specific styling
            wp_enqueue_style(
                'algebra-tutor-math',
                ALGEBRA_TUTOR_URL . 'assets/css/math-frontend.css',
                [],
                ALGEBRA_TUTOR_VERSION
            );
        }

        // Check if we're on the practice page
        if (is_page('algebra-practice') || has_shortcode($post->post_content, 'algebra_tutor_practice')) {
            // Load jQuery
            wp_enqueue_script('jquery');

            // Enqueue practice app
            wp_enqueue_script(
                'algebra-tutor-practice-app',
                ALGEBRA_TUTOR_URL . 'assets/js/frontend/practice-app.js',
                ['jquery', 'mathjax'],
                ALGEBRA_TUTOR_VERSION,
                true
            );

            // Enqueue practice styles
            wp_enqueue_style(
                'algebra-tutor-practice',
                ALGEBRA_TUTOR_URL . 'assets/css/practice.css',
                ['algebra-tutor-frontend'],
                ALGEBRA_TUTOR_VERSION
            );
        }
    }

    /**
     * Add practice link to the main menu.
     *
     * @param string $items Menu HTML
     * @param object $args Menu arguments
     * @return string Modified menu HTML
     */
    public function add_menu_item($items, $args) {
        if ($args->theme_location == 'primary') {
            $items .= '<li><a href="' . site_url('/algebra-practice') . '">' . __('Practice', 'algebra-tutor') . '</a></li>';
        }
        return $items;
    }

    /**
     * Initialize AJAX handlers for frontend.
     */
    private function initialize_ajax_handlers() {
        // Handle practice answers submission
        add_action('wp_ajax_algebra_tutor_handle_ajax', [$this, 'handle_ajax_request']);
        add_action('wp_ajax_nopriv_algebra_tutor_handle_ajax', [$this, 'handle_ajax_request']);
    }

    /**
     * AJAX request handler - routes to appropriate method
     */
    public function handle_ajax_request() {
        // Verify nonce
        check_ajax_referer('algebra_tutor_nonce', 'nonce');

        if (!isset($_POST['action_type'])) {
            wp_send_json_error(['message' => __('Missing action type.', 'algebra-tutor')]);
            return;
        }

        $action_type = sanitize_text_field($_POST['action_type']);

        switch ($action_type) {
            case 'submit_practice_answers':
                $this->practice->ajax_submit_answers();
                break;

            case 'finish_practice':
                $this->practice->ajax_finish_practice();
                break;

            default:
                wp_send_json_error(['message' => __('Unknown action type.', 'algebra-tutor')]);
        }
    }
}