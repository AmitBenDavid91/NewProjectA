<?php
/**
 * Plugin Name: Algebra Tutor
 * Plugin URI: https://yourwebsite.com
 * Description: Interactive algebra learning plugin with MathJax formula display
 * Version: 3.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL2
 * Text Domain: algebra-tutor
 * Domain Path: /languages
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('ALGEBRA_TUTOR_VERSION', '3.0.0');
define('ALGEBRA_TUTOR_FILE', __FILE__);
define('ALGEBRA_TUTOR_PATH', plugin_dir_path(__FILE__));
define('ALGEBRA_TUTOR_URL', plugin_dir_url(__FILE__));
define('ALGEBRA_TUTOR_BASENAME', plugin_basename(__FILE__));
require_once ALGEBRA_TUTOR_PATH . 'includes/functions.php';
require_once ALGEBRA_TUTOR_PATH . 'includes/ajax-handlers.php';

// Autoloader
spl_autoload_register(function ($class) {
    // Plugin namespace prefix
    $prefix = 'AlgebraTutor\\';
    $len = strlen($prefix);

    // Check if the class uses the namespace prefix
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    // Get the relative class name
    $relative_class = substr($class, $len);

    // Replace namespace separators with directory separators
    // and append '.php'
    $file = ALGEBRA_TUTOR_PATH . 'includes/' . str_replace('\\', '/', $relative_class) . '.php';

    // If the file exists, require it
    if (file_exists($file)) {
        require $file;
    }
});

// Initialize the plugin
function algebra_tutor_init() {
    // Load text domain for translations
    load_plugin_textdomain('algebra-tutor', false, dirname(ALGEBRA_TUTOR_BASENAME) . '/languages');

    // Initialize the plugin
    $plugin = \AlgebraTutor\Core::get_instance();
    $plugin->initialize();
}
add_action('plugins_loaded', 'algebra_tutor_init');

// Register activation hook
register_activation_hook(__FILE__, function() {
    $activator = new \AlgebraTutor\Activator();
    $activator->activate();
});

// Register deactivation hook
register_deactivation_hook(__FILE__, function() {
    $deactivator = new \AlgebraTutor\Deactivator();
    $deactivator->deactivate();
});

// Define a named function for uninstall (not a closure)
function algebra_tutor_uninstall() {
    // Use static method for uninstall (no instance needed)
    \AlgebraTutor\Activator::uninstall();
}
// Register uninstall hook with named function
register_uninstall_hook(__FILE__, 'algebra_tutor_uninstall');