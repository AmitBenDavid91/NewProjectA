<?php
namespace AlgebraTutor\Math;

/**
 * Handles processing and rendering of mathematical formulas.
 */
class MathProcessor {
    /**
     * Configuration options
     *
     * @var array
     */
    private $config = [
        'enable_inline' => true,
        'enable_block' => true,
        'mathjax_version' => '3.2.2',
        'mathjax_cdn' => 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
    ];

    /**
     * Formula cache
     *
     * @var array
     */
    private $formula_cache = [];

    /**
     * Constructor.
     */
    public function __construct() {
        // Apply configuration filters
        $this->config = apply_filters('algebra_tutor_math_config', $this->config);

        // Set up hooks
        add_filter('the_content', [$this, 'process_math_content'], 10);
        add_filter('the_excerpt', [$this, 'process_math_content'], 10);
        add_filter('comment_text', [$this, 'process_math_content'], 10);

        // Update KSES allowed tags
        add_action('init', [$this, 'update_kses_allowed_tags']);

        // Add MathJax shortcode
        add_shortcode('math', [$this, 'math_shortcode']);
        add_shortcode('algebra_formula', [$this, 'math_shortcode']);
    }

    /**
     * Update KSES allowed tags to preserve math elements.
     */
    public function update_kses_allowed_tags() {
        global $allowedposttags;

        // Allow span with math-related attributes
        $allowedposttags['span'] = array_merge(
            isset($allowedposttags['span']) ? $allowedposttags['span'] : [],
            [
                'class' => true,
                'contenteditable' => true,
                'data-latex' => true,
                'data-display' => true,
                'style' => true,
                'id' => true,
            ]
        );

        // Allow div with math-related attributes
        $allowedposttags['div'] = array_merge(
            isset($allowedposttags['div']) ? $allowedposttags['div'] : [],
            [
                'class' => true,
                'contenteditable' => true,
                'data-latex' => true,
                'data-display' => true,
                'style' => true,
                'id' => true,
            ]
        );
    }

    /**
     * Process math formulas in content.
     *
     * @param string $content The content to process
     * @return string The processed content
     */
    public function process_math_content($content) {
        // Process inline math elements: \( ... \)
        if ($this->config['enable_inline']) {
            $content = preg_replace_callback('/\\\\\((.*?)\\\\\)/s', function($matches) {
                return $this->create_inline_element($matches[1]);
            }, $content);
        }

        // Process block math elements: \[ ... \]
        if ($this->config['enable_block']) {
            $content = preg_replace_callback('/\\\\\[(.*?)\\\\\]/s', function($matches) {
                return $this->create_block_element($matches[1]);
            }, $content);
        }

        return $content;
    }

    /**
     * Create an inline math element.
     *
     * @param string $latex The LaTeX content
     * @return string HTML for the inline math element
     */
    public function create_inline_element($latex) {
        $latex = trim($latex);
        $encoded_latex = htmlspecialchars($latex, ENT_QUOTES, 'UTF-8');

        // Check cache
        $cache_key = 'inline_' . md5($latex);
        if (isset($this->formula_cache[$cache_key])) {
            return $this->formula_cache[$cache_key];
        }

        $html = sprintf(
            '<span class="algebra-tutor-math math-inline" data-latex="%s">\(%s\)</span>',
            $encoded_latex,
            $latex
        );

        // Cache the result
        $this->formula_cache[$cache_key] = $html;

        return $html;
    }

    /**
     * Create a block math element.
     *
     * @param string $latex The LaTeX content
     * @return string HTML for the block math element
     */
    public function create_block_element($latex) {
        $latex = trim($latex);
        $encoded_latex = htmlspecialchars($latex, ENT_QUOTES, 'UTF-8');

        // Check cache
        $cache_key = 'block_' . md5($latex);
        if (isset($this->formula_cache[$cache_key])) {
            return $this->formula_cache[$cache_key];
        }

        $html = sprintf(
            '<div class="algebra-tutor-math math-block" data-latex="%s">\[%s\]</div>',
            $encoded_latex,
            $latex
        );

        // Cache the result
        $this->formula_cache[$cache_key] = $html;

        return $html;
    }

    /**
     * Math shortcode handler.
     *
     * @param array $atts Shortcode attributes
     * @param string|null $content Shortcode content
     * @return string HTML output
     */
    public function math_shortcode($atts, $content = null) {
        $atts = shortcode_atts([
            'display' => 'inline',
            'align' => '',
            'color' => '',
            'size' => '',
        ], $atts, 'math');

        if (empty($content)) {
            return '';
        }

        $display_mode = ($atts['display'] === 'block');
        $latex = trim($content);

        // Handle additional styling
        $style_parts = [];

        if (!empty($atts['align'])) {
            $style_parts[] = 'text-align: ' . esc_attr($atts['align']);
        }

        if (!empty($atts['color'])) {
            $style_parts[] = 'color: ' . esc_attr($atts['color']);
        }

        if (!empty($atts['size'])) {
            $style_parts[] = 'font-size: ' . esc_attr($atts['size']);
        }

        $style_attr = !empty($style_parts) ? ' style="' . implode('; ', $style_parts) . ';"' : '';

        if ($display_mode) {
            return sprintf(
                '<div class="algebra-tutor-math math-block" data-latex="%s" data-display="block"%s>\[%s\]</div>',
                esc_attr($latex),
                $style_attr,
                $latex
            );
        } else {
            return sprintf(
                '<span class="algebra-tutor-math math-inline" data-latex="%s" data-display="inline"%s>\(%s\)</span>',
                esc_attr($latex),
                $style_attr,
                $latex
            );
        }
    }

    /**
     * Convert HTML math elements to LaTeX notation for saving.
     *
     * @param string $content Content with HTML math elements
     * @return string Content with LaTeX notation
     */
    public function convert_html_to_latex($content) {
        // Improved regex that handles quotes correctly

        // Convert span inline elements
        $content = preg_replace_callback(
            '/<span[^>]*class=["|\']algebra-tutor-math(?:\s+math-inline)?["|\'][^>]*data-latex=["|\']([^"\']*)["|\'](.*?)>.*?<\/span>/s',
            function($matches) {
                $latex = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
                return '\(' . $latex . '\)';
            },
            $content
        );

        // Convert div block elements
        $content = preg_replace_callback(
            '/<div[^>]*class=["|\']algebra-tutor-math(?:\s+math-block)?["|\'][^>]*data-latex=["|\']([^"\']*)["|\'](.*?)>.*?<\/div>/s',
            function($matches) {
                $latex = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
                return '\[' . $latex . '\]';
            },
            $content
        );

        return $content;
    }

    /**
     * Sanitize LaTeX string.
     *
     * @param string $latex LaTeX string to sanitize
     * @param bool $display_mode Whether it's a block or inline formula
     * @return string Sanitized LaTeX string
     */
    public function sanitize_latex($latex, $display_mode = false) {
        // Remove unnecessary escape characters
        $latex = stripslashes($latex);

        // Remove outer delimiters if they exist
        $latex = preg_replace('/^(\\\\\[|\\\\\()|(\\\\\]|\\\\\))$/', '', $latex);

        // Trim whitespace
        $latex = trim($latex);

        // Basic validation - check for balanced braces
        $open_braces = substr_count($latex, '{');
        $close_braces = substr_count($latex, '}');

        if ($open_braces !== $close_braces) {
            // Attempt to fix unbalanced braces
            if ($open_braces > $close_braces) {
                $latex .= str_repeat('}', $open_braces - $close_braces);
            } else {
                $latex = str_repeat('{', $close_braces - $open_braces) . $latex;
            }
        }

        // Return with proper delimiters
        return $display_mode ? '\[' . $latex . '\]' : '\(' . $latex . '\)';
    }
}