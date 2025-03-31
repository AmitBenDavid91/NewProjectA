/**
 * MathJax קונפיגורציה גלובלית
 * חשוב: קובץ זה חייב להיטען לפני ספריית MathJax עצמה
 */

// MathJax Configuration
window.MathJax = {
    tex: {
        inlineMath: [["\\(", "\\)"]],
        displayMath: [["\\[", "\\]"]],
        processEscapes: true,
        processEnvironments: true,
        packages: {"[+]": ["ams", "noerrors", "physics", "mhchem", "color"]}
    },
    options: {
        ignoreHtmlClass: "tex2jax_ignore",
        processHtmlClass: "tex2jax_process",
        renderActions: {
            findScript: [10, function (doc) {
                document.querySelectorAll('script[type^="math/tex"]').forEach(function (node) {
                    const display = node.type.indexOf('mode=display') !== -1;
                    const math = new doc.options.MathItem(
                        node.textContent,
                        doc.inputJax[0],
                        display
                    );
                    const text = document.createTextNode('');
                    node.parentNode.replaceChild(text, node);
                    math.start = {node: text, delim: '', n: 0};
                    math.end = {node: text, delim: '', n: 0};
                    doc.math.push(math);
                });
            }, '']
        }
    },
    svg: {
        fontCache: "global"
    },
    startup: {
        typeset: true,
        ready: function() {
            // ביצוע אתחול סטנדרטי של MathJax
            MathJax.startup.defaultReady();

            // הוספת אובייקט גלובלי עם פונקציות עזר
            window.AlgebraTutorMathJax = {
                // פונקציה לביצוע typeset על אלמנט ספציפי או מערך אלמנטים
                typeset: function(elements) {
                    if (MathJax.typesetPromise) {
                        return MathJax.typesetPromise(elements instanceof Array ? elements : [elements])
                            .catch(function(err) {
                                console.error('MathJax typeset error:', err);
                            });
                    } else if (MathJax.typeset) {
                        return MathJax.typeset(elements instanceof Array ? elements : [elements]);
                    }
                },

                // פונקציה להמרת LaTeX לתצוגה ויזואלית בעמוד
                renderFormula: function(latex, displayMode) {
                    const formula = displayMode ? `\\[${latex}\\]` : `\\(${latex}\\)`;
                    const wrapper = document.createElement(displayMode ? 'div' : 'span');
                    wrapper.className = `algebra-tutor-math ${displayMode ? 'math-block' : 'math-inline'}`;
                    wrapper.setAttribute('data-latex', latex);
                    wrapper.innerHTML = formula;
                    return wrapper;
                },

                // פונקציה להמרת HTML entities ל-LaTeX רגיל
                decodeLatex: function(encodedLatex) {
                    try {
                        // בדיקה אם מקודד ב-URI
                        if (encodedLatex && /(%[0-9A-F]{2})+/i.test(encodedLatex)) {
                            return decodeURIComponent(encodedLatex);
                        }

                        // אחרת, השתמש ב-HTML entity decode
                        const txt = document.createElement('textarea');
                        txt.innerHTML = encodedLatex;
                        return txt.value;
                    } catch (e) {
                        console.error('Error decoding LaTeX:', e);
                        return encodedLatex; // החזר את הערך המקורי במקרה של שגיאה
                    }
                }
            };

            // לאחר ש-MathJax טעון, שלח אירוע שמודיע על מוכנות MathJax
            var event = new CustomEvent('mathjax:loaded', { detail: { version: MathJax.version } });
            document.dispatchEvent(event);

            // ביצוע typeset נוסף אחרי טעינה מלאה של העמוד
            window.addEventListener('load', function() {
                setTimeout(function() {
                    MathJax.typesetPromise().catch(function(err) {
                        console.error('MathJax typeset error on load:', err);
                    });
                }, 200);
            });
        }
    }
};

// הוספת פונקציה להפעלת MathJax על תוכן דינמי (למשל בעמוד התרגול)
document.addEventListener('DOMContentLoaded', function() {
    // רשימה של class selectors שייתכן שיכילו נוסחאות מתמטיות
    const mathContainers = [
        '.algebra-tutor-math',
        '.question-card',
        '.preview-content',
        '.algebra-question-text',
        '.algebra-answer-option',
        '.math-editor-preview',
        '.preview-fill-blank'
    ];

    // פונקציה להפעלת MathJax על אלמנטים חדשים בעמוד
    function processMathInDynamicContent() {
        if (window.MathJax && window.MathJax.typesetPromise) {
            let elements = [];

            mathContainers.forEach(selector => {
                const containers = document.querySelectorAll(selector);
                containers.forEach(container => {
                    elements.push(container);
                });
            });

            if (elements.length > 0) {
                window.MathJax.typesetPromise(elements)
                    .catch(function(err) {
                        console.error('MathJax dynamic typeset error:', err);
                    });
            }
        }
    }

    // פונקציה לתיקון קידוד HTML entities בתוך נוסחאות
    function fixFormulaEncoding() {
        document.querySelectorAll('.algebra-tutor-math').forEach(function(element) {
            let latex = element.getAttribute('data-latex');
            if (latex && (latex.includes('&amp;') || latex.includes('amp;'))) {
                // תיקון קידוד שגוי של אמפרסנד
                latex = latex.replace(/&amp;/g, '&').replace(/amp;/g, '');
                element.setAttribute('data-latex', latex);

                // עדכון תוכן הנוסחה בהתאם
                const isBlock = element.classList.contains('math-block');
                if (isBlock) {
                    element.innerHTML = '\\[' + latex + '\\]';
                } else {
                    element.innerHTML = '\\(' + latex + '\\)';
                }
            }
        });

        // ביצוע typeset מחדש אחרי תיקון הקידוד
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise().catch(function(err) {
                console.error('MathJax typeset error after encoding fix:', err);
            });
        }
    }

    // יצירת MutationObserver לביצוע typeset כאשר מתווספים אלמנטים חדשים לעמוד
    const observer = new MutationObserver(function(mutations) {
        let needsProcessing = false;

        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // אם זה אלמנט HTML, בדוק אם זה אחד מה-selectors שאנחנו מחפשים
                        const matchesSelector = mathContainers.some(selector =>
                            node.matches(selector) || node.querySelector(selector)
                        );

                        if (matchesSelector) {
                            needsProcessing = true;
                            break;
                        }
                    }
                }
            }

            if (needsProcessing) break;
        }

        if (needsProcessing) {
            // התעלם מ-MutationRecords בזמן העיבוד
            observer.disconnect();

            // עבד את הנוסחאות אחרי השהייה קצרה כדי לוודא שהכל נטען
            setTimeout(function() {
                fixFormulaEncoding();
                processMathInDynamicContent();

                // חדש את ה-observer
                setTimeout(function() {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }, 100);
            }, 200);
        }
    });

    // התחל להאזין לשינויים בעמוד
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // תיקון קידוד ראשוני
    setTimeout(fixFormulaEncoding, 300);

    // ביצוע typeset ראשוני
    setTimeout(processMathInDynamicContent, 500);

    // ביצוע typeset נוסף אחרי טעינה מלאה של העמוד
    window.addEventListener('load', function() {
        setTimeout(fixFormulaEncoding, 800);
        setTimeout(processMathInDynamicContent, 1000);
    });
});