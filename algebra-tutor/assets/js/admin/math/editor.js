/**
 * Algebra Tutor - Math Editor
 *
 * Provides a user-friendly interface for creating and editing math formulas
 * using LaTeX syntax with visual editing support via MathLive.
 */

var AlgebraTutorMathEditor = (function($) {
    'use strict';

    // Private variables
    var currentEditor = null;
    var currentMathField = null;
    var currentFormulaElement = null;
    var mathliveLoaded = false;
    var isMathliveLoading = false;
    var modalVisible = false;
    var lastInsertedFormula = null;

    /**
     * Initialize the Math Editor
     */
    function init() {
        // Check if MathLive is already loaded
        checkMathLiveLoaded();

        // Setup TinyMCE plugin if available
        if (typeof tinymce !== 'undefined') {
            setupTinyMCEPlugin();
        }

        // Setup global click handler for math elements
        setupDocumentClickHandler();
    }

    /**
     * Check if MathLive is loaded
     */
    function checkMathLiveLoaded() {
        mathliveLoaded = typeof MathLive !== 'undefined';
        return mathliveLoaded;
    }

    /**
     * Load MathLive library if not already loaded
     */
    function loadMathLive(callback) {
        if (checkMathLiveLoaded()) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        if (isMathliveLoading) {
            // If already in process of loading, wait for it
            var checkInterval = setInterval(function() {
                if (checkMathLiveLoaded()) {
                    clearInterval(checkInterval);
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            }, 200);
            return;
        }

        isMathliveLoading = true;

        // URL for MathLive
        var mathliveUrl = 'https://cdn.jsdelivr.net/npm/mathlive@0.90.5/dist/mathlive.min.js';

        // Create script tag and load library
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = mathliveUrl;
        script.async = true;

        script.onload = function() {
            console.log('MathLive loaded successfully');
            mathliveLoaded = true;
            isMathliveLoading = false;

            if (typeof callback === 'function') {
                callback();
            }
        };

        script.onerror = function() {
            console.error('Failed to load MathLive');
            isMathliveLoading = false;
            alert('Error loading MathLive library. Please refresh the page and try again.');
        };

        document.head.appendChild(script);
    }

    /**
     * Setup TinyMCE plugin for math editing
     */
    function setupTinyMCEPlugin() {
        tinymce.PluginManager.add('algebraMath', function(editor, url) {
            // Add CSS for math elements in the editor
            editor.on('init', function() {
                editor.dom.addStyle(
                    '.algebra-tutor-math {' +
                    '  display: inline-block;' +
                    '  padding: 2px 4px;' +
                    '  margin: 0 2px;' +
                    '  background-color: rgba(0, 115, 170, 0.05);' +
                    '  border: 1px solid rgba(0, 115, 170, 0.1);' +
                    '  border-radius: 3px;' +
                    '  cursor: pointer;' +
                    '  position: relative;' +
                    '  min-width: 30px;' +
                    '  min-height: 20px;' +
                    '}' +
                    '.algebra-tutor-math:hover {' +
                    '  background-color: rgba(0, 115, 170, 0.1);' +
                    '  border-color: rgba(0, 115, 170, 0.2);' +
                    '  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);' +
                    '}' +
                    '.algebra-tutor-math.math-block {' +
                    '  display: block;' +
                    '  margin: 10px 0;' +
                    '  text-align: center;' +
                    '  padding: 5px;' +
                    '}'
                );

                // Store reference to the editor
                currentEditor = editor;
            });

            // Add button to the editor
            editor.ui.registry.addButton('algebraMath', {
                icon: 'character-count',
                tooltip: 'Insert Math Formula',
                onAction: function() {
                    openMathEditor(null);
                }
            });

            // Add menu item
            editor.ui.registry.addMenuItem('algebraMath', {
                icon: 'character-count',
                text: 'Insert Math Formula',
                onAction: function() {
                    openMathEditor(null);
                }
            });

            // Add context menu
            editor.ui.registry.addContextMenu('algebraMath', {
                update: function(element) {
                    // Check if clicking on a math element
                    if (element.classList.contains('algebra-tutor-math')) {
                        return 'editmath removemath';
                    }
                    return '';
                }
            });

            // Add context menu items
            editor.ui.registry.addMenuItem('editmath', {
                icon: 'edit-block',
                text: 'Edit Formula',
                onAction: function() {
                    var element = editor.selection.getNode();
                    if (element.classList.contains('algebra-tutor-math')) {
                        openMathEditor(element);
                    }
                }
            });

            editor.ui.registry.addMenuItem('removemath', {
                icon: 'remove',
                text: 'Remove Formula',
                onAction: function() {
                    var element = editor.selection.getNode();
                    if (element.classList.contains('algebra-tutor-math')) {
                        editor.dom.remove(element);
                        editor.focus();
                    }
                }
            });

            // Add keyboard shortcut (Alt+M)
            editor.addShortcut('Alt+M', 'Insert Math Formula', function() {
                openMathEditor(null);
            });

            // Handle double click on math elements
            editor.on('dblclick', function(e) {
                var element = e.target;
                if (element.classList.contains('algebra-tutor-math')) {
                    e.preventDefault();
                    openMathEditor(element);
                }
            });

            return {
                getMetadata: function() {
                    return {
                        name: 'Algebra Tutor Math',
                        url: 'https://www.example.com/algebra-tutor'
                    };
                }
            };
        });
    }

    /**
     * Setup document-wide click handler for math elements
     */
    function setupDocumentClickHandler() {
        $(document).on('click', '.algebra-tutor-math', function(e) {
            // Don't handle clicks inside TinyMCE
            if ($(this).closest('.mce-content-body').length) {
                return;
            }

            // Open editor for this element
            openMathEditor(this);
        });
    }

    /**
     * Open the math editor dialog
     */
    function openMathEditor(element) {
        // Store reference to the math element being edited
        currentFormulaElement = element;

        // Extract the LaTeX from the element if editing an existing formula
        var latex = '';
        var displayMode = false;

        if (currentFormulaElement) {
            latex = currentFormulaElement.getAttribute('data-latex') || '';
            latex = decodeLatex(latex);
            displayMode = currentFormulaElement.classList.contains('math-block');
        }

        // Create the editor modal
        createEditorModal(latex, displayMode);
    }

    /**
     * Create the math editor modal dialog
     */
    function createEditorModal(latex, displayMode) {
        // Don't create multiple instances
        if (modalVisible) {
            return;
        }

        modalVisible = true;

        // Create backdrop
        var $backdrop = $('<div>', {
            id: 'math-editor-backdrop',
            class: 'math-editor-backdrop',
            click: function(e) {
                if (e.target === this) {
                    closeMathEditor(false);
                }
            }
        });

        // Create modal container
        var $modal = $('<div>', {
            id: 'math-editor-modal',
            class: 'math-editor-modal'
        });

        // Modal header
        var $header = $('<div>', {
            class: 'math-editor-header'
        });

        $header.append($('<h2>', {
            class: 'math-editor-title',
            text: currentFormulaElement ? 'Edit Math Formula' : 'Insert Math Formula'
        }));

        $header.append($('<button>', {
            class: 'math-editor-close',
            html: '&times;',
            'aria-label': 'Close',
            click: function() {
                closeMathEditor(false);
            }
        }));

        // Modal tabs
        var $tabs = $('<div>', {
            class: 'math-editor-tabs'
        });

        $tabs.append($('<div>', {
            class: 'math-editor-tab active',
            'data-tab': 'visual',
            text: 'Visual Editor',
            click: function() {
                switchTab('visual');
            }
        }));

        $tabs.append($('<div>', {
            class: 'math-editor-tab',
            'data-tab': 'latex',
            text: 'LaTeX Code',
            click: function() {
                switchTab('latex');
            }
        }));

        $tabs.append($('<div>', {
            class: 'math-editor-tab',
            'data-tab': 'library',
            text: 'Formula Library',
            click: function() {
                switchTab('library');
                initFormulaLibrary();
            }
        }));

        // Modal content
        var $content = $('<div>', {
            class: 'math-editor-content'
        });

        // Visual editor tab
        var $visualTab = $('<div>', {
            class: 'math-editor-tab-content visual-editor active'
        });

        // Field wrapper
        var $fieldWrapper = $('<div>', {
            class: 'math-editor-field-wrapper'
        });

        if (mathliveLoaded) {
            // Create MathLive field
            var $mathField = $('<math-field>', {
                id: 'math-field',
                style: 'width: 100%; min-height: 50px; font-size: 16px; direction: ltr;'
            });

            $fieldWrapper.append($mathField);
        } else {
            // Loading indicator until MathLive is ready
            var $loading = $('<div>', {
                class: 'math-loading',
                text: 'Loading math editor'
            });

            $fieldWrapper.append($loading);
        }

        $visualTab.append($fieldWrapper);

        // Display mode selector
        var $modeSelector = $('<div>', {
            class: 'math-editor-mode'
        });

        var $inlineLabel = $('<label>').append(
            $('<input>', {
                type: 'radio',
                name: 'display-mode',
                value: 'inline',
                checked: !displayMode
            }),
            ' Inline Formula'
        );

        var $blockLabel = $('<label>').append(
            $('<input>', {
                type: 'radio',
                name: 'display-mode',
                value: 'block',
                checked: displayMode
            }),
            ' Block Formula'
        );

        $modeSelector.append($inlineLabel, $blockLabel);
        $visualTab.append($modeSelector);

        // LaTeX editor tab
        var $latexTab = $('<div>', {
            class: 'math-editor-tab-content latex-editor'
        });

        var $latexField = $('<textarea>', {
            id: 'latex-field',
            style: 'width: 100%; min-height: 120px; padding: 10px; font-family: monospace; font-size: 14px; direction: ltr;',
            value: latex
        });

        $latexField.on('input', function() {
            updatePreview($(this).val());
        });

        $latexTab.append($latexField);

        // Formula library tab
        var $libraryTab = $('<div>', {
            id: 'formula-library-container',
            class: 'math-editor-tab-content formula-library-tab'
        });

        $libraryTab.append($('<div>', {
            class: 'math-loading',
            text: 'Loading formula library'
        }));

        // Add tabs to content
        $content.append($visualTab, $latexTab, $libraryTab);

        // Formula preview
        var $previewContainer = $('<div>', {
            class: 'math-editor-preview'
        });

        $previewContainer.append($('<div>', {
            class: 'math-editor-preview-title',
            text: 'Preview:'
        }));

        var $preview = $('<div>', {
            id: 'math-preview',
            style: 'text-align: center; direction: ltr;'
        });

        $previewContainer.append($preview);

        // Action buttons
        var $actions = $('<div>', {
            class: 'math-editor-actions'
        });

        // Add Delete button if editing existing formula
        if (currentFormulaElement) {
            $actions.append($('<button>', {
                class: 'math-editor-delete',
                text: 'Delete Formula',
                click: function() {
                    if (confirm('Are you sure you want to delete this formula?')) {
                        deleteFormula();
                        closeMathEditor(false);
                    }
                }
            }));
        }

        $actions.append($('<button>', {
            class: 'math-editor-cancel',
            text: 'Cancel',
            click: function() {
                closeMathEditor(false);
            }
        }));

        $actions.append($('<button>', {
            class: 'math-editor-save',
            text: currentFormulaElement ? 'Update Formula' : 'Insert Formula',
            click: function() {
                saveFormula();
            }
        }));

        // Assemble the modal
        $modal.append($header, $tabs, $content, $previewContainer, $actions);

        // Add to document
        $('body').append($backdrop, $modal);

        // Initialize MathLive if needed
        if (!mathliveLoaded) {
            loadMathLive(function() {
                initMathField(latex);
            });
        } else {
            // Initialize MathLive field
            setTimeout(function() {
                initMathField(latex);
            }, 50);
        }

        // Update preview
        updatePreview(latex);

        // Center the modal
        centerModal($modal);

        // Add keyboard handlers
        $(document).on('keydown.algebraMathEditor', function(e) {
            // Escape key closes the editor
            if (e.key === 'Escape') {
                closeMathEditor(false);
            }

            // Enter key with Ctrl saves the formula
            if (e.key === 'Enter' && e.ctrlKey) {
                saveFormula();
            }
        });
    }

    /**
     * Initialize the MathLive field
     */
    function initMathField(latex) {
        var $mathField = $('#math-field');
        var $latexField = $('#latex-field');

        if (!$mathField.length || !mathliveLoaded) return;

        // Remove loading indicator if present
        $('.math-loading').remove();

        // If the field doesn't exist yet, create it
        if (!$mathField.length) {
            var $fieldWrapper = $('.math-editor-field-wrapper');
            $mathField = $('<math-field>', {
                id: 'math-field',
                style: 'width: 100%; min-height: 50px; font-size: 16px; direction: ltr;'
            });

            $fieldWrapper.append($mathField);
        }

        // Set up MathLive field
        try {
            // Different versions of MathLive have different APIs
            if ($mathField[0].setValue) {
                // Newer versions
                $mathField[0].setValue(latex);

                // Add event listener
                $mathField[0].addEventListener('input', function(e) {
                    var value = e.target.value;
                    $latexField.val(value);
                    updatePreview(value);
                });

                currentMathField = $mathField[0];
            } else if (typeof MathLive.makeMathField === 'function') {
                // Older versions
                currentMathField = MathLive.makeMathField($mathField[0], {
                    virtualKeyboardMode: 'manual',
                    onContentDidChange: function() {
                        var value = currentMathField.getValue();
                        $latexField.val(value);
                        updatePreview(value);
                    }
                });

                if (latex) {
                    currentMathField.setValue(latex);
                }
            } else {
                console.error('MathLive API not found');
                // Fall back to using the textarea
                $mathField.hide();
                createTextareaFallback(latex);
            }
        } catch (error) {
            console.error('Error initializing MathLive:', error);
            // Fall back to using the textarea
            $mathField.hide();
            createTextareaFallback(latex);
        }
    }

    /**
     * Create a textarea fallback if MathLive fails
     */
    function createTextareaFallback(latex) {
        var $fieldWrapper = $('.math-editor-field-wrapper');
        var $latexField = $('#latex-field');

        var $textareaInput = $('<textarea>', {
            id: 'math-field-fallback',
            class: 'math-field-fallback',
            style: 'width: 100%; min-height: 80px; padding: 10px; font-family: monospace; direction: ltr;',
            value: latex,
            placeholder: 'Enter LaTeX code here...'
        });

        $textareaInput.on('input', function() {
            var value = $(this).val();
            $latexField.val(value);
            updatePreview(value);
        });

        $fieldWrapper.append($textareaInput);
    }

    /**
     * Switch between editor tabs
     */
    function switchTab(tabName) {
        // Update tab buttons
        $('.math-editor-tab').removeClass('active');
        $('.math-editor-tab[data-tab="' + tabName + '"]').addClass('active');

        // Update tab content
        $('.math-editor-tab-content').removeClass('active');

        if (tabName === 'visual') {
            $('.visual-editor').addClass('active');

            // Focus the math field
            if (currentMathField) {
                if (typeof currentMathField.focus === 'function') {
                    currentMathField.focus();
                } else if (typeof currentMathField.executeCommand === 'function') {
                    currentMathField.executeCommand('focus');
                }
            } else {
                $('#math-field-fallback').focus();
            }
        } else if (tabName === 'latex') {
            $('.latex-editor').addClass('active');

            // Focus the LaTeX field
            $('#latex-field').focus();
        } else if (tabName === 'library') {
            $('.formula-library-tab').addClass('active');
        }
    }

    /**
     * Initialize the formula library
     */
    function initFormulaLibrary() {
        var $container = $('#formula-library-container');

        // Check if the library is already initialized
        if ($container.data('initialized')) {
            return;
        }

        // Mark as initialized
        $container.data('initialized', true);

        // Load the formula library if not already loaded
        if (typeof AlgebraTutorMathLibrary === 'undefined') {
            $.getScript(window.algebraTutorAdmin.formulaLibraryUrl, function() {
                if (typeof AlgebraTutorMathLibrary !== 'undefined') {
                    renderFormulaLibrary();
                } else {
                    $container.html('<div class="notice notice-error"><p>Failed to load formula library. Please refresh the page and try again.</p></div>');
                }
            }).fail(function() {
                $container.html('<div class="notice notice-error"><p>Failed to load formula library. Please refresh the page and try again.</p></div>');
            });
        } else {
            renderFormulaLibrary();
        }
    }

    /**
     * Render the formula library content
     */
    function renderFormulaLibrary() {
        var $container = $('#formula-library-container');

        if (!$container.length || typeof AlgebraTutorMathLibrary === 'undefined') {
            return;
        }

        // Clear existing content
        $container.empty();

        // Create the library UI
        AlgebraTutorMathLibrary.createLibraryUI($container[0], onSelectFormula);

        // Update MathJax rendering
        typesetMath();
    }

    /**
     * Callback for formula selection from library
     */
    function onSelectFormula(latex) {
        // Update both the LaTeX field and the MathLive field
        $('#latex-field').val(latex);

        // Update the MathLive field
        if (currentMathField) {
            try {
                if (typeof currentMathField.setValue === 'function') {
                    currentMathField.setValue(latex);
                } else {
                    currentMathField.latex(latex);
                }
            } catch (error) {
                console.error('Error updating MathLive field:', error);
            }
        } else {
            $('#math-field-fallback').val(latex);
        }

        // Update preview
        updatePreview(latex);

        // Switch to visual tab
        switchTab('visual');
    }

    /**
     * Update the formula preview
     */
    function updatePreview(latex) {
        var $preview = $('#math-preview');
        if (!$preview.length) return;

        // Get the display mode
        var displayMode = $('input[name="display-mode"]:checked').val() === 'block';

        // Update preview content with proper delimiters
        if (latex) {
            $preview.html(displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)');
        } else {
            $preview.html('<span style="color: #999; font-style: italic;">No formula entered</span>');
        }

        // Typeset with MathJax
        typesetMath($preview[0]);
    }

    /**
     * Typeset math using MathJax
     */
    function typesetMath(element) {
        if (typeof MathJax !== 'undefined') {
            setTimeout(function() {
                if (MathJax.typesetPromise) {
                    // MathJax v3
                    MathJax.typesetPromise([element || document.getElementById('math-preview')])
                        .catch(function(err) {
                            console.error('MathJax typeset error:', err);
                        });
                } else if (MathJax.Hub && MathJax.Hub.Queue) {
                    // MathJax v2
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, element || document.getElementById('math-preview')]);
                }
            }, 50);
        }
    }

    /**
     * Center the modal dialog
     */
    function centerModal($modal) {
        var windowHeight = window.innerHeight;
        var windowWidth = window.innerWidth;
        var modalHeight = $modal.outerHeight();
        var modalWidth = $modal.outerWidth();

        var top = Math.max(0, (windowHeight - modalHeight) / 3);
        var left = Math.max(0, (windowWidth - modalWidth) / 2);

        $modal.css({
            top: top + 'px',
            left: left + 'px'
        });
    }

    /**
     * Close the math editor
     */
    function closeMathEditor(save) {
        // Save the formula if requested
        if (save) {
            saveFormula();
        }

        // Remove the modal and backdrop
        $('#math-editor-modal, #math-editor-backdrop').remove();

        // Remove keyboard handler
        $(document).off('keydown.algebraMathEditor');

        // Reset state
        modalVisible = false;
        currentFormulaElement = null;
        currentMathField = null;
    }

    /**
     * Save the formula to the editor
     */
    function saveFormula() {
        // Get the LaTeX code
        var latex = $('#latex-field').val().trim();

        if (!latex) {
            alert('Please enter a formula.');
            return;
        }

        // Get display mode
        var displayMode = $('input[name="display-mode"]:checked').val() === 'block';

        // Check if we're editing an existing element or creating a new one
        if (currentFormulaElement) {
            // Update existing formula
            updateFormula(currentFormulaElement, latex, displayMode);
        } else {
            // Insert new formula
            insertFormula(latex, displayMode);
        }

        // Close the editor
        closeMathEditor(false);
    }

    /**
     * Update an existing formula
     */
    function updateFormula(element, latex, displayMode) {
        // Get the correct delimiters based on display mode
        var formula = displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)';

        // Update the element attributes and content
        element.setAttribute('data-latex', encodeLatex(latex));
        element.innerHTML = formula;

        // Update display mode classes
        if (displayMode) {
            element.classList.add('math-block');
            element.classList.remove('math-inline');
        } else {
            element.classList.add('math-inline');
            element.classList.remove('math-block');
        }

        // Update MathJax rendering
        typesetMath(element);

        // If the element is in TinyMCE, notify the editor
        if (currentEditor) {
            currentEditor.fire('change');
        }
    }

    /**
     * Insert a new formula into the editor
     */
    function insertFormula(latex, displayMode) {
        // Create formula HTML
        var className = displayMode ? 'algebra-tutor-math math-block' : 'algebra-tutor-math math-inline';
        var formula = displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)';

        var html = '<span class="' + className + '" data-latex="' + encodeLatex(latex) + '">' + formula + '</span>';

        // Add a space after inline formulas
        if (!displayMode) {
            html += '&nbsp;';
        }

        // If in TinyMCE, insert into the editor
        if (currentEditor) {
            currentEditor.insertContent(html);

            // Find and remember the inserted element for later typesetting
            lastInsertedFormula = currentEditor.dom.select('.algebra-tutor-math[data-latex="' + encodeLatex(latex) + '"]').pop();

            // Typeset the inserted formula
            setTimeout(function() {
                if (lastInsertedFormula) {
                    typesetMath(lastInsertedFormula);
                }
            }, 100);
        } else {
            // If not in TinyMCE, try using a field with the mathTarget attribute
            var targetId = $('body').data('mathTarget');
            if (targetId) {
                var $target = $('#' + targetId);
                if ($target.length) {
                    $target.val(function(index, value) {
                        return value + html;
                    });
                }
            }
        }
    }

    /**
     * Delete a formula
     */
    function deleteFormula() {
        if (!currentFormulaElement) return;

        if (currentEditor && currentFormulaElement.closest('.mce-content-body')) {
            currentEditor.dom.remove(currentFormulaElement);
            currentEditor.fire('change');
        } else {
            $(currentFormulaElement).remove();
        }
    }

    /**
     * Encode LaTeX for storing in HTML attributes
     */
    function encodeLatex(latex) {
        return latex.replace(/[\u00A0-\u9999<>&]/gim, function(i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }

    /**
     * Decode LaTeX from HTML attributes
     */
    function decodeLatex(latex) {
        try {
            // Check if it's URI encoded
            if (latex && /(%[0-9A-F]{2})+/i.test(latex)) {
                return decodeURIComponent(latex);
            }

            // Decode HTML entities
            var txt = document.createElement('textarea');
            txt.innerHTML = latex;
            return txt.value;
        } catch (e) {
            console.error('Error decoding LaTeX:', e);
            return latex;
        }
    }

    // Public API
    return {
        init: init,
        openEditor: openMathEditor,
        loadMathLive: loadMathLive,
        typesetMath: typesetMath
    };

})(jQuery);

// Initialize when document is ready
jQuery(document).ready(function() {
    AlgebraTutorMathEditor.init();
});