/**
 * Algebra Tutor - Formula Library Interface
 *
 * JavaScript interface for the mathematical formula library
 * Allows browsing, searching and using common math formulas
 */

var AlgebraTutorFormulaLibrary = (function($) {
    'use strict';

    // Private variables
    var libraryData = null;
    var libraryInitialized = false;
    var currentCallback = null;

    /**
     * Initialize the formula library
     */
    function init(callback) {
        // Store callback for later use
        if (typeof callback === 'function') {
            currentCallback = callback;
        }

        // Check if already initialized
        if (libraryInitialized) {
            return true;
        }

        // Check if data is already loaded
        if (window.algebraTutorFormulas) {
            libraryData = window.algebraTutorFormulas;
            return true;
        }

        // Load formula data from server if needed
        loadFormulaData();

        return libraryInitialized;
    }

    /**
     * Load formula data from the server
     */
    function loadFormulaData() {
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'algebra_tutor_get_formulas',
                nonce: window.algebraTutorAdmin ? window.algebraTutorAdmin.nonce : ''
            },
            success: function(response) {
                if (response.success && response.data) {
                    libraryData = response.data;
                    libraryInitialized = true;

                    // Call initialization callback if set
                    if (typeof currentCallback === 'function') {
                        currentCallback();
                    }
                } else {
                    console.error('Error loading formula library:', response.data ? response.data.message : 'Unknown error');
                }
            },
            error: function() {
                console.error('Error loading formula library: Server communication error');
            }
        });
    }

    /**
     * Initialize the library view
     */
    function initLibraryView() {
        var $container = $('#math-formulas-library-container');

        if (!$container.length) {
            return false;
        }

        // Initialize the library if needed
        if (!init()) {
            // Show loading indicator
            $container.html('<div class="math-loading">Loading formula library...</div>');
            return false;
        }

        // Create the library UI
        renderLibraryUI($container);

        return true;
    }

    /**
     * Render the formula library UI
     */
    function renderLibraryUI($container) {
        // Clear the container
        $container.empty();

        // Add header
        var $header = $('<h2>').text('Math Formula Library');
        $container.append($header);

        // Add description
        var $description = $('<p>').text('Click on a formula to add it to your question.');
        $container.append($description);

        // Add search field
        var $searchContainer = $('<div>', {
            class: 'formula-search-container'
        });

        var $searchInput = $('<input>', {
            type: 'text',
            id: 'formula-search',
            class: 'formula-search',
            placeholder: 'Search formulas...'
        });

        $searchContainer.append($searchInput);
        $container.append($searchContainer);

        // Create tabs for categories
        var $tabs = $('<div>', {
            class: 'formula-tabs'
        });

        var $tabButtons = $('<div>', {
            class: 'formula-tab-buttons'
        });

        var $tabContents = $('<div>', {
            class: 'formula-tab-contents'
        });

        // Generate tabs for each category
        libraryData.forEach(function(category, index) {
            // Create tab button
            var $tabButton = $('<button>', {
                class: 'formula-tab-button' + (index === 0 ? ' active' : ''),
                'data-tab': category.id,
                text: category.name
            });

            $tabButton.on('click', function() {
                // Activate this tab
                $('.formula-tab-button').removeClass('active');
                $(this).addClass('active');

                // Show this tab's content
                $('.formula-tab-content').removeClass('active');
                $('#formula-tab-' + category.id).addClass('active');

                // Typeset math
                typesetMath();
            });

            $tabButtons.append($tabButton);

            // Create tab content
            var $tabContent = $('<div>', {
                id: 'formula-tab-' + category.id,
                class: 'formula-tab-content' + (index === 0 ? ' active' : '')
            });

            // Create formula grid
            var $formulaGrid = $('<div>', {
                class: 'formula-grid'
            });

            // Add formulas to grid
            category.formulas.forEach(function(formula) {
                var $formulaCard = createFormulaCard(formula);
                $formulaGrid.append($formulaCard);
            });

            $tabContent.append($formulaGrid);
            $tabContents.append($tabContent);
        });

        // Add search results tab (hidden by default)
        var $searchResultsTab = $('<div>', {
            id: 'formula-tab-search',
            class: 'formula-tab-content'
        });

        var $searchResultsGrid = $('<div>', {
            class: 'formula-grid',
            id: 'search-results-grid'
        });

        $searchResultsTab.append($searchResultsGrid);
        $tabContents.append($searchResultsTab);

        // Add tabs to container
        $tabs.append($tabButtons);
        $tabs.append($tabContents);
        $container.append($tabs);

        // Handle search
        $searchInput.on('input', function() {
            var searchTerm = $(this).val().trim().toLowerCase();

            if (searchTerm.length < 2) {
                // If search is cleared, go back to the active tab
                $('.formula-tab-button.active').click();
                return;
            }

            // Search all formulas across categories
            var results = [];

            libraryData.forEach(function(category) {
                category.formulas.forEach(function(formula) {
                    if (formula.name.toLowerCase().includes(searchTerm) ||
                        formula.latex.toLowerCase().includes(searchTerm)) {
                        results.push({
                            formula: formula,
                            category: category.name
                        });
                    }
                });
            });

            // Show search results tab
            $('.formula-tab-button').removeClass('active');
            $('.formula-tab-content').removeClass('active');
            $('#formula-tab-search').addClass('active');

            // Update search results
            renderSearchResults(results, searchTerm);
        });

        // Initialize MathJax typesetting
        typesetMath();
    }

    /**
     * Create a formula card element
     */
    function createFormulaCard(formula, categoryName) {
        var $card = $('<div>', {
            class: 'formula-card',
            'data-latex': formula.latex
        });

        var $name = $('<div>', {
            class: 'formula-name',
            text: formula.name
        });

        if (categoryName) {
            $name.append(' ').append($('<span>', {
                class: 'formula-category',
                text: '(' + categoryName + ')'
            }));
        }

        var $preview = $('<div>', {
            class: 'formula-preview',
            html: '\\(' + formula.latex + '\\)'
        });

        $card.append($name, $preview);

        // Add click handler
        $card.on('click', function() {
            insertFormula(formula.latex);
        });

        return $card;
    }

    /**
     * Render search results
     */
    function renderSearchResults(results, searchTerm) {
        var $grid = $('#search-results-grid');

        // Clear grid
        $grid.empty();

        if (results.length === 0) {
            // No results found
            $grid.html('<div class="no-results">No formulas found matching "' + searchTerm + '"</div>');
            return;
        }

        // Add results to grid
        results.forEach(function(result) {
            var $card = createFormulaCard(result.formula, result.category);
            $grid.append($card);
        });

        // Typeset math
        typesetMath();
    }

    /**
     * Insert a formula into the editor
     */
    function insertFormula(latex) {
        // Use the callback if provided
        if (typeof currentCallback === 'function') {
            currentCallback(latex);
            return;
        }

        // Try to use the math editor if available
        if (typeof AlgebraTutorMathEditor !== 'undefined') {
            var $latexField = $('#latex-field');

            if ($latexField.length) {
                // We're in the math editor modal, update the field
                $latexField.val(latex);

                // Update the preview
                var $preview = $('#math-preview');
                if ($preview.length) {
                    var displayMode = $('input[name="display-mode"]:checked').val() === 'block';
                    $preview.html(displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)');
                    typesetMath();
                }

                // Switch to visual tab
                $('.math-editor-tab[data-tab="visual"]').click();

                // Update MathLive field if available
                var mathField = document.getElementById('math-field');
                if (mathField) {
                    try {
                        if (mathField.setValue) {
                            mathField.setValue(latex);
                        } else if (mathField.mathfield && mathField.mathfield.setValue) {
                            mathField.mathfield.setValue(latex);
                        }
                    } catch (e) {
                        console.error('Error updating math field:', e);
                    }
                }
            } else {
                // Open the math editor with this formula
                AlgebraTutorMathEditor.openEditor(null, latex);
            }
        } else {
            // If math editor is not available, try to insert directly into TinyMCE
            if (typeof tinymce !== 'undefined') {
                var editor = tinymce.activeEditor;

                if (editor) {
                    var html = '<span class="algebra-tutor-math math-inline" data-latex="' +
                        encodeHtml(latex) + '">' +
                        '\\(' + latex + '\\)' +
                        '</span>';

                    editor.insertContent(html);

                    // Typeset the inserted formula
                    setTimeout(function() {
                        if (typeof MathJax !== 'undefined') {
                            if (MathJax.typesetPromise) {
                                MathJax.typesetPromise([editor.getBody()])
                                    .catch(function(err) {
                                        console.error('MathJax typeset error:', err);
                                    });
                            } else if (MathJax.Hub && MathJax.Hub.Queue) {
                                MathJax.Hub.Queue(['Typeset', MathJax.Hub, editor.getBody()]);
                            }
                        }
                    }, 100);
                }
            }
        }
    }

    /**
     * Encode HTML entities
     */
    function encodeHtml(str) {
        return str.replace(/[\u00A0-\u9999<>&]/gim, function(i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }

    /**
     * Typeset math using MathJax
     */
    function typesetMath() {
        if (typeof MathJax === 'undefined') {
            return;
        }

        setTimeout(function() {
            if (MathJax.typesetPromise) {
                // MathJax v3
                MathJax.typesetPromise()
                    .catch(function(err) {
                        console.error('MathJax typeset error:', err);
                    });
            } else if (MathJax.Hub && MathJax.Hub.Queue) {
                // MathJax v2
                MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
            }
        }, 100);
    }

    // Public API
    return {
        init: init,
        initLibraryView: initLibraryView,
        insertFormula: insertFormula
    };

})(jQuery);

// Initialize when document is ready
jQuery(document).ready(function() {
    // The library is initialized on demand when needed
});