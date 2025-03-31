/**
 * Algebra Tutor - Common Admin Scripts
 *
 * Shared functionality for all admin pages
 */

var AlgebraTutorAdmin = (function($) {
    'use strict';

    // Private variables
    var ajaxUrl = window.ajaxurl || '';
    var nonce = window.algebraTutorAdmin ? window.algebraTutorAdmin.nonce : '';
    var i18n = window.algebraTutorAdmin ? window.algebraTutorAdmin.i18n : {};

    /**
     * Initialize common functionality
     */
    function init() {
        // Setup tooltips
        initTooltips();

        // Initialize tabs
        initTabs();

        // Setup notices
        initNotices();

        // Initialize MathJax if needed
        initMathJax();
    }

    /**
     * Initialize tooltips
     */
    function initTooltips() {
        $('.algebra-tutor-tooltip').each(function() {
            var $tooltip = $(this);

            $tooltip.on('mouseenter', function() {
                var $tip = $('<div class="tooltip-content"></div>');
                $tip.html($tooltip.data('tooltip'));
                $tooltip.append($tip);

                setTimeout(function() {
                    $tip.addClass('visible');
                }, 10);
            });

            $tooltip.on('mouseleave', function() {
                var $tip = $tooltip.find('.tooltip-content');
                $tip.removeClass('visible');

                setTimeout(function() {
                    $tip.remove();
                }, 200);
            });
        });
    }

    /**
     * Initialize tab navigation
     */
    function initTabs() {
        $('.algebra-tutor-tabs').each(function() {
            var $tabContainer = $(this);
            var $tabLinks = $tabContainer.find('.tab-link');
            var $tabContents = $tabContainer.find('.tab-content');

            $tabLinks.on('click', function(e) {
                e.preventDefault();

                var tabId = $(this).attr('href');

                // Remove active class from all tabs and content
                $tabLinks.removeClass('active');
                $tabContents.removeClass('active');

                // Add active class to current tab and content
                $(this).addClass('active');
                $(tabId).addClass('active');
            });
        });
    }

    /**
     * Initialize dismissible notices
     */
    function initNotices() {
        $('.algebra-tutor-notice .notice-dismiss').on('click', function() {
            var $notice = $(this).closest('.algebra-tutor-notice');

            $notice.slideUp(200, function() {
                $notice.remove();
            });

            // If the notice has an ID, remember that it was dismissed
            if ($notice.data('notice-id')) {
                rememberDismissedNotice($notice.data('notice-id'));
            }
        });
    }

    /**
     * Store dismissed notice in user meta
     */
    function rememberDismissedNotice(noticeId) {
        $.post(ajaxUrl, {
            action: 'algebra_tutor_dismiss_notice',
            notice_id: noticeId,
            nonce: nonce
        });
    }

    /**
     * Initialize MathJax if needed
     */
    function initMathJax() {
        if (typeof MathJax === 'undefined' && $('.algebra-tutor-math').length > 0) {
            // Load MathJax config if not already loaded
            if (!window.algebraTutorMathJaxConfigLoaded) {
                loadScript(window.algebraTutorAdmin.mathConfigUrl);
            }

            // Load MathJax library
            loadScript('https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js');
        } else if (typeof MathJax !== 'undefined') {
            // Typeset existing math elements
            typesetMath();
        }
    }

    /**
     * Typeset math elements using MathJax
     */
    function typesetMath() {
        if (typeof MathJax !== 'undefined') {
            setTimeout(function() {
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise()
                        .catch(function(err) {
                            console.error('MathJax typeset error:', err);
                        });
                } else if (MathJax.Hub && MathJax.Hub.Queue) {
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
                }
            }, 100);
        }
    }

    /**
     * Helper to load a script
     */
    function loadScript(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = true;
        document.head.appendChild(script);
    }

    /**
     * Show a confirmation dialog
     */
    function confirm(message, callback) {
        if (window.confirm(message)) {
            callback();
        }
    }

    /**
     * Show an error message
     */
    function showError(message, container) {
        if (container) {
            var $error = $('<div class="algebra-tutor-notice notice notice-error is-dismissible"></div>');
            $error.html('<p>' + message + '</p>');
            $error.append('<button type="button" class="notice-dismiss"></button>');
            $(container).prepend($error);

            initNotices();
        } else {
            alert(message);
        }
    }

    /**
     * Show a success message
     */
    function showSuccess(message, container) {
        if (container) {
            var $success = $('<div class="algebra-tutor-notice notice notice-success is-dismissible"></div>');
            $success.html('<p>' + message + '</p>');
            $success.append('<button type="button" class="notice-dismiss"></button>');
            $(container).prepend($success);

            initNotices();
        } else {
            alert(message);
        }
    }

    /**
     * Make an AJAX request
     */
    function ajax(data, successCallback, errorCallback) {
        // Add nonce to the data
        data.nonce = nonce;

        $.ajax({
            url: ajaxUrl,
            type: 'POST',
            data: data,
            success: function(response) {
                if (response.success) {
                    if (typeof successCallback === 'function') {
                        successCallback(response.data);
                    }
                } else {
                    if (typeof errorCallback === 'function') {
                        errorCallback(response.data.message || i18n.errorOccurred || 'An error occurred');
                    } else {
                        showError(response.data.message || i18n.errorOccurred || 'An error occurred');
                    }
                }
            },
            error: function(xhr, status, error) {
                if (typeof errorCallback === 'function') {
                    errorCallback(i18n.serverError || 'Server communication error');
                } else {
                    showError(i18n.serverError || 'Server communication error');
                }
            }
        });
    }

    // Public API
    return {
        init: init,
        confirm: confirm,
        showError: showError,
        showSuccess: showSuccess,
        ajax: ajax,
        typesetMath: typesetMath
    };

})(jQuery);

// Initialize when the document is ready
jQuery(document).ready(function() {
    AlgebraTutorAdmin.init();
});