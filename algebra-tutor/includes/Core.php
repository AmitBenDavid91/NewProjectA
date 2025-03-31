<?php
namespace AlgebraTutor;

use AlgebraTutor\Admin\Admin;
use AlgebraTutor\Frontend\Frontend;
use AlgebraTutor\Math\MathProcessor;

/**
 * The core plugin class that initializes and coordinates all functionality.
 */
class Core {
    /**
     * The unique instance of the plugin.
     *
     * @var Core
     */
    private static $instance;

    /**
     * Admin class instance.
     *
     * @var Admin
     */
    private $admin;

    /**
     * Frontend class instance.
     *
     * @var Frontend
     */
    private $frontend;

    /**
     * Math processor instance.
     *
     * @var MathProcessor
     */
    private $math_processor;

    /**
     * Get the single instance of this class.
     *
     * @return Core The instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor to prevent creating multiple instances.
     */
    private function __construct() {
        // Initialize dependencies
        $this->math_processor = new MathProcessor();
    }

    /**
     * Initialize the plugin.
     */
    public function initialize() {
        // Set up hooks
        add_action('init', [$this, 'register_post_types']);

        // Initialize admin functionality if in admin area
        if (is_admin()) {
            $this->admin = new Admin($this->math_processor);
            $this->admin->initialize();
        }

        // Initialize frontend functionality
        $this->frontend = new Frontend($this->math_processor);
        $this->frontend->initialize();
    }

    /**
     * Register any custom post types needed.
     */
    public function register_post_types() {
        // Register custom post types if needed
    }
}