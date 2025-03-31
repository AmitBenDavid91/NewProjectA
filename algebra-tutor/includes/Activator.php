<?php
namespace AlgebraTutor;

use AlgebraTutor\Database\DBManager;

/**
 * Fired during plugin activation.
 */
class Activator {
    /**
     * Database manager instance.
     *
     * @var DBManager
     */
    private $db_manager;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->db_manager = new DBManager();
    }

    /**
     * Activate the plugin.
     */
    public function activate() {
        // Create database tables
        $this->db_manager->create_tables();

        // Create required directories
        $this->create_required_directories();

        // Create required files
        $this->create_required_files();

        // Set plugin version in database
        update_option('algebra_tutor_version', ALGEBRA_TUTOR_VERSION);

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Create required directories.
     */
    private function create_required_directories() {
        $dirs = [
            ALGEBRA_TUTOR_PATH . 'assets/js',
            ALGEBRA_TUTOR_PATH . 'assets/css',
        ];

        foreach ($dirs as $dir) {
            if (!file_exists($dir)) {
                wp_mkdir_p($dir);
            }
        }
    }

    /**
     * Create required files.
     */
    private function create_required_files() {
        // Create MathJax config file if it doesn't exist
        $mathjax_config = ALGEBRA_TUTOR_PATH . 'assets/js/common/math-config.js';
        if (!file_exists($mathjax_config)) {
            $template_path = ALGEBRA_TUTOR_PATH . 'assets/js/common/templates/math-config.js.tpl';

            if (file_exists($template_path)) {
                // Copy from template
                copy($template_path, $mathjax_config);
            } else {
                // Create from scratch
                $config_content = "window.MathJax = {
    tex: { 
        inlineMath: [['\\\\(', '\\\\)']],
        displayMath: [['\\\\[', '\\\\]']],
        processEscapes: true
    },
    svg: { fontCache: 'global' }
};";
                file_put_contents($mathjax_config, $config_content);
            }
        }

        // Create CSS for math formulas if it doesn't exist
        $math_css = ALGEBRA_TUTOR_PATH . 'assets/css/math-frontend.css';
        if (!file_exists($math_css)) {
            $template_path = ALGEBRA_TUTOR_PATH . 'assets/css/templates/math-frontend.css.tpl';

            if (file_exists($template_path)) {
                // Copy from template
                copy($template_path, $math_css);
            } else {
                // Create from scratch
                $css_content = "/* Math formulas styling */
.algebra-tutor-math {
    display: inline-block;
    direction: ltr;
}
.algebra-tutor-math.math-block {
    display: block;
    text-align: center;
    margin: 15px 0;
}";
                file_put_contents($math_css, $css_content);
            }
        }
    }

    /**
     * Uninstall the plugin.
     */
    public static function uninstall() {
        // Drop database tables
        $db_manager = new DBManager();
        $db_manager->drop_tables();

        // Delete plugin options
        delete_option('algebra_tutor_version');

        // Other cleanup actions as needed
    }
}