// src/components/MathEditor/MathEditor.js
import React, { useState, useEffect, useRef } from 'react';
import './MathEditor.css';

const MathEditor = ({ initialLatex = '', onSave, onCancel }) => {
    const [latex, setLatex] = useState(initialLatex);
    const [displayMode, setDisplayMode] = useState(false);
    const [activeTab, setActiveTab] = useState('visual');
    const [mathfieldLoaded, setMathfieldLoaded] = useState(false);
    const [libraryLoaded, setLibraryLoaded] = useState(false);
    const mathFieldRef = useRef(null);

    // Load MathLive library when component mounts
    useEffect(() => {
        // Check if MathLive is already loaded
        if (window.MathLive) {
            setMathfieldLoaded(true);
            return;
        }

        // Load MathLive script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathlive@0.90.5/dist/mathlive.min.js';
        script.async = true;
        script.onload = () => {
            setMathfieldLoaded(true);
        };
        document.body.appendChild(script);

        // Clean up
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Initialize math field when MathLive is loaded
    useEffect(() => {
        if (mathfieldLoaded && mathFieldRef.current) {
            try {
                // Initialize the math field
                if (typeof window.MathLive.makeMathField === 'function') {
                    // Older MathLive version
                    const mathField = window.MathLive.makeMathField(mathFieldRef.current, {
                        virtualKeyboardMode: 'manual',
                        onContentDidChange: (mf) => {
                            setLatex(mf.getValue());
                        }
                    });

                    // Set initial content
                    if (initialLatex) {
                        mathField.setValue(initialLatex);
                    }
                } else if (mathFieldRef.current.setOptions) {
                    // Newer MathLive version
                    mathFieldRef.current.setOptions({
                        virtualKeyboardMode: 'manual'
                    });

                    // Set initial content
                    if (initialLatex) {
                        mathFieldRef.current.setValue(initialLatex);
                    }

                    // Listen for changes
                    mathFieldRef.current.addEventListener('input', (e) => {
                        setLatex(e.target.value);
                    });
                }
            } catch (error) {
                console.error('Error initializing MathLive:', error);
            }
        }
    }, [mathfieldLoaded, initialLatex]);

    // Update preview when latex changes
    useEffect(() => {
        updatePreview();
    }, [latex, displayMode]);

    // Load formula library
    const loadFormulaLibrary = async () => {
        if (libraryLoaded) return;

        try {
            const response = await fetch(
                `${algebraTutorData.ajaxUrl}?action=algebra_tutor_get_formulas&nonce=${algebraTutorData.nonce}`
            );
            const data = await response.json();

            if (data.success) {
                renderFormulaLibrary(data.data);
                setLibraryLoaded(true);
            }
        } catch (error) {
            console.error('Error loading formula library:', error);
        }
    };

    // Render formula library
    const renderFormulaLibrary = (categories) => {
        const container = document.getElementById('formula-library-container');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create category tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'formula-tabs';

        const tabButtons = document.createElement('div');
        tabButtons.className = 'formula-tab-buttons';

        const tabContents = document.createElement('div');
        tabContents.className = 'formula-tab-contents';

        categories.forEach((category, index) => {
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.className = 'formula-tab-button' + (index === 0 ? ' active' : '');
            tabButton.dataset.tab = category.id;
            tabButton.textContent = category.name;
            tabButton.onclick = () => {
                // Activate this tab
                document.querySelectorAll('.formula-tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                tabButton.classList.add('active');

                // Show this tab's content
                document.querySelectorAll('.formula-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById('formula-tab-' + category.id).classList.add('active');
            };

            tabButtons.appendChild(tabButton);

            // Create tab content
            const tabContent = document.createElement('div');
            tabContent.id = 'formula-tab-' + category.id;
            tabContent.className = 'formula-tab-content' + (index === 0 ? ' active' : '');

            // Create formula grid
            const formulaGrid = document.createElement('div');
            formulaGrid.className = 'formula-grid';

            // Add formulas to grid
            category.formulas.forEach(formula => {
                const formulaCard = document.createElement('div');
                formulaCard.className = 'formula-card';
                formulaCard.dataset.latex = formula.latex;

                const formulaName = document.createElement('div');
                formulaName.className = 'formula-name';
                formulaName.textContent = formula.name;

                const formulaPreview = document.createElement('div');
                formulaPreview.className = 'formula-preview';
                formulaPreview.innerHTML = '\\(' + formula.latex + '\\)';

                formulaCard.appendChild(formulaName);
                formulaCard.appendChild(formulaPreview);

                // Add click handler
                formulaCard.onclick = () => {
                    setLatex(formula.latex);
                    setActiveTab('visual');

                    // Update the math field
                    try {
                        if (mathFieldRef.current) {
                            if (mathFieldRef.current.setValue) {
                                mathFieldRef.current.setValue(formula.latex);
                            } else if (mathFieldRef.current.mathfield && mathFieldRef.current.mathfield.setValue) {
                                mathFieldRef.current.mathfield.setValue(formula.latex);
                            }
                        }
                    } catch (error) {
                        console.error('Error updating math field:', error);
                    }
                };

                formulaGrid.appendChild(formulaCard);
            });

            tabContent.appendChild(formulaGrid);
            tabContents.appendChild(tabContent);
        });

        tabsContainer.appendChild(tabButtons);
        tabsContainer.appendChild(tabContents);
        container.appendChild(tabsContainer);

        // Render math using MathJax
        if (window.MathJax) {
            try {
                if (window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([container]);
                } else if (window.MathJax.typeset) {
                    window.MathJax.typeset([container]);
                }
            } catch (error) {
                console.error('Error typesetting math:', error);
            }
        }
    };

    // Update math preview
    const updatePreview = () => {
        const preview = document.getElementById('math-preview');
        if (!preview) return;

        // Update preview content
        if (latex) {
            preview.innerHTML = displayMode ? `\\[${latex}\\]` : `\\(${latex}\\)`;
        } else {
            preview.innerHTML = '<span style="color: #999; font-style: italic;">No formula entered</span>';
        }

        // Typeset with MathJax
        if (window.MathJax) {
            try {
                if (window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([preview]);
                } else if (window.MathJax.typeset) {
                    window.MathJax.typeset([preview]);
                }
            } catch (error) {
                console.error('Error typesetting math:', error);
            }
        }
    };

    // Toggle virtual keyboard
    const toggleVirtualKeyboard = () => {
        if (!mathFieldRef.current) return;

        try {
            if (mathFieldRef.current.executeCommand) {
                mathFieldRef.current.executeCommand('toggleVirtualKeyboard');
            } else if (window.MathLive && window.MathLive.toggleVirtualKeyboard) {
                window.MathLive.toggleVirtualKeyboard(mathFieldRef.current);
            }
        } catch (error) {
            console.error('Error toggling virtual keyboard:', error);
        }
    };

    // Handle tab switching
    const switchTab = (tab) => {
        setActiveTab(tab);

        if (tab === 'library' && !libraryLoaded) {
            loadFormulaLibrary();
        }
    };

    // Insert math symbols
    const insertSymbol = (symbol) => {
        if (!mathFieldRef.current) return;

        try {
            if (mathFieldRef.current.insert) {
                mathFieldRef.current.insert(symbol);
            } else if (mathFieldRef.current.mathfield && mathFieldRef.current.mathfield.insert) {
                mathFieldRef.current.mathfield.insert(symbol);
            }
        } catch (error) {
            console.error('Error inserting symbol:', error);
        }
    };

    // Handle saving the formula
    const handleSave = () => {
        if (onSave) {
            onSave(latex, displayMode);
        }
    };

    return (
        <div className="math-editor-modal">
            <div className="math-editor-backdrop" onClick={onCancel}></div>
            <div className="math-editor-content">
                <div className="math-editor-header">
                    <h2 className="math-editor-title">Math Formula Editor</h2>
                    <button className="math-editor-close" onClick={onCancel}>&times;</button>
                </div>

                <div className="math-editor-tabs">
                    <div
                        className={`math-editor-tab ${activeTab === 'visual' ? 'active' : ''}`}
                        data-tab="visual"
                        onClick={() => switchTab('visual')}
                    >
                        Visual Editor
                    </div>
                    <div
                        className={`math-editor-tab ${activeTab === 'latex' ? 'active' : ''}`}
                        data-tab="latex"
                        onClick={() => switchTab('latex')}
                    >
                        LaTeX Code
                    </div>
                    <div
                        className={`math-editor-tab ${activeTab === 'library' ? 'active' : ''}`}
                        data-tab="library"
                        onClick={() => switchTab('library')}
                    >
                        Formula Library
                    </div>
                </div>

                <div className="math-editor-content">
                    {/* Visual editor tab */}
                    <div className={`math-editor-tab-content visual-editor ${activeTab === 'visual' ? 'active' : ''}`}>
                        <div className="math-editor-toolbar">
                            <div className="math-editor-toolbar-group">
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Squared"
                                    onClick={() => insertSymbol('^{2}')}
                                >
                                    x²
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Square root"
                                    onClick={() => insertSymbol('\\sqrt{}')}
                                >
                                    √
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Fraction"
                                    onClick={() => insertSymbol('\\frac{}{}')}
                                >
                                    frac
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Subscript"
                                    onClick={() => insertSymbol('_{}')}
                                >
                                    x₂
                                </button>
                            </div>

                            <div className="math-editor-toolbar-group">
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Pi"
                                    onClick={() => insertSymbol('\\pi')}
                                >
                                    π
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Infinity"
                                    onClick={() => insertSymbol('\\infty')}
                                >
                                    ∞
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Not equal"
                                    onClick={() => insertSymbol('\\neq')}
                                >
                                    ≠
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Less than or equal"
                                    onClick={() => insertSymbol('\\leq')}
                                >
                                    ≤
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Greater than or equal"
                                    onClick={() => insertSymbol('\\geq')}
                                >
                                    ≥
                                </button>
                            </div>

                            <div className="math-editor-toolbar-group">
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Integral"
                                    onClick={() => insertSymbol('\\int')}
                                >
                                    ∫
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Sum"
                                    onClick={() => insertSymbol('\\sum')}
                                >
                                    ∑
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Parentheses"
                                    onClick={() => insertSymbol('\\left(\\right)')}
                                >
                                    ()
                                </button>
                                <button
                                    className="math-editor-toolbar-btn"
                                    title="Square brackets"
                                    onClick={() => insertSymbol('\\left[\\right]')}
                                >
                                    []
                                </button>
                            </div>
                        </div>

                        <div className="math-editor-field-wrapper">
                            {mathfieldLoaded ? (
                                <math-field
                                    ref={mathFieldRef}
                                    id="math-field"
                                    style={{ width: '100%', minHeight: '50px', fontSize: '16px', direction: 'ltr' }}
                                ></math-field>
                            ) : (
                                <div className="math-loading">Loading math editor...</div>
                            )}
                        </div>

                        <div className="math-editor-mode">
                            <label>
                                <input
                                    type="radio"
                                    name="display-mode"
                                    value="inline"
                                    checked={!displayMode}
                                    onChange={() => setDisplayMode(false)}
                                />
                                Inline Formula
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="display-mode"
                                    value="block"
                                    checked={displayMode}
                                    onChange={() => setDisplayMode(true)}
                                />
                                Block Formula
                            </label>
                        </div>
                    </div>

                    {/* LaTeX editor tab */}
                    <div className={`math-editor-tab-content latex-editor ${activeTab === 'latex' ? 'active' : ''}`}>
            <textarea
                id="latex-field"
                style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '10px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    direction: 'ltr'
                }}
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
            ></textarea>
                    </div>

                    {/* Formula library tab */}
                    <div className={`math-editor-tab-content formula-library-tab ${activeTab === 'library' ? 'active' : ''}`} id="formula-library-container">
                        {!libraryLoaded && <div className="math-loading">Loading formula library...</div>}
                    </div>
                </div>

                <div className="math-editor-preview">
                    <div className="math-editor-preview-title">Preview:</div>
                    <div id="math-preview" style={{ textAlign: 'center', direction: 'ltr' }}></div>
                </div>

                <button
                    className="math-editor-keyboard"
                    onClick={toggleVirtualKeyboard}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M0 4v8h16V4H0zm1 1h14v6H1V5zm2 1v1h1V6H3zm2 0v1h1V6H5zm2 0v1h1V6H7zm2 0v1h1V6H9zm2 0v1h1V6h-1zm2 0v1h1V6h-1zM3 8v1h1V8H3zm2 0v1h1V8H5zm2 0v1h1V8H7zm2 0v1h1V8H9zm2 0v1h1V8h-1zm2 0v1h1V8h-1zM3 10v1h7v-1H3zm8 0v1h2v-1h-2z"/>
                    </svg>
                    Virtual Keyboard
                </button>

                <div className="math-editor-actions">
                    <button className="math-editor-cancel" onClick={onCancel}>Cancel</button>
                    <button className="math-editor-save" onClick={handleSave}>Insert Formula</button>
                </div>
            </div>
        </div>
    );
};

export default MathEditor;