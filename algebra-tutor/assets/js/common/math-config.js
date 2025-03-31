/**
 * MathJax Configuration for Algebra Tutor
 *
 * This file configures MathJax to properly render mathematical formulas
 * in both the frontend and admin interfaces.
 */

window.MathJax = {
    tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        processRefs: true,
        tags: 'ams',
        macros: {
            R: '\\mathbb{R}',
            Z: '\\mathbb{Z}',
            N: '\\mathbb{N}',
            Q: '\\mathbb{Q}'
        }
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoreHtmlClass: 'tex2jax_ignore',
        renderActions: {
            addMenu: [],
            checkLoading: []
        },
        enableMenu: false
    },
    svg: {
        fontCache: 'global',
        scale: 1.0,
        minScale: 0.5
    },
    chtml: {
        fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/output/chtml/fonts/woff-v2',
        scale: 1.0,
        minScale: 0.5
    },
    startup: {
        ready: function() {
            // Ready hook
            MathJax.startup.defaultReady();

            // Custom signal that MathJax is ready
            if (typeof window.algebraTutorMathJaxReady === 'function') {
                window.algebraTutorMathJaxReady();
            }
        }
    }
};

// Signal when the config is loaded
window.algebraTutorMathJaxConfigLoaded = true;