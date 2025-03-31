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
        packages: {"[+]": ["ams", "noerrors"]}
    },
    options: {
        ignoreHtmlClass: "tex2jax_ignore",
        processHtmlClass: "tex2jax_process"
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
                }
            };

            // לאחר ש-MathJax טעון, שלח אירוע שמודיע על מוכנות MathJax
            var event = new CustomEvent('mathjax:loaded', { detail: { version: MathJax.version } });
            document.dispatchEvent(event);
        }
    }
};

// אנחנו לא טוענים את MathJax כאן, רק מגדירים את הקונפיגורציה
// הקובץ מיובא לפני הספרייה עצמה