<?php
/**
 * Template for the practice page
 *
 * @package AlgebraTutor
 */

// If this file is called directly, abort.
if (!defined('ABSPATH')) {
    exit;
}

// Create a nonce for AJAX requests
$nonce = wp_create_nonce('algebra_tutor_nonce');
?>

<div id="algebra-tutor-practice">
    <!-- Category Selection -->
    <div class="category-select">
        <form method="get" action="">
            <label for="category"><?php _e('Select Category:', 'algebra-tutor'); ?></label>
            <select name="category" id="category" onchange="this.form.submit()">
                <option value=""><?php _e('-- All Categories --', 'algebra-tutor'); ?></option>
                <?php foreach ($categories as $cat) : ?>
                    <option value="<?php echo esc_attr($cat); ?>" <?php selected($selected_category, $cat); ?>>
                        <?php echo esc_html($cat); ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </form>
    </div>

    <!-- Question list will be populated by JavaScript -->
    <div id="algebra-tutor-practice-root">
        <!-- Loading indicator until JS loads -->
        <div class="loading-message">
            <p><?php _e('Loading questions...', 'algebra-tutor'); ?></p>
        </div>
    </div>

    <!-- Data for JavaScript -->
    <script type="text/javascript">
        // Set up the data object for the practice app
        window.algebraTutorData = <?php echo json_encode($data); ?>;
    </script>
</div>