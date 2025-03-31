<?php
namespace AlgebraTutor\Frontend;

use AlgebraTutor\Math\MathProcessor;

/**
 * Registers and handles shortcodes.
 */
class Shortcodes {
    /**
     * Math processor instance.
     *
     * @var MathProcessor
     */
    private $math_processor;

    /**
     * Practice instance.
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

        // Register shortcodes
        add_shortcode('algebra_tutor_practice', [$this, 'practice_shortcode']);
    }

    /**
     * Practice page shortcode handler.
     *
     * @param array $atts Shortcode attributes
     * @param string|null $content Shortcode content
     * @return string HTML output
     */
    public function practice_shortcode($atts, $content = null) {
        $atts = shortcode_atts([
            'category' => '',
            'difficulty' => '',
            'count' => 5
        ], $atts, 'algebra_tutor_practice');

        // Override GET parameters if specified in shortcode
        if (!empty($atts['category'])) {
            $_GET['category'] = $atts['category'];
        }

        if (!empty($atts['difficulty'])) {
            $_GET['difficulty'] = $atts['difficulty'];
        }

        // Render the practice page
        return $this->practice->render_page();
    }
}