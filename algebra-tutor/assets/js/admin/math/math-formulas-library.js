/**
 * ספריית נוסחאות מתמטיות נפוצות לשימוש בתוסף Algebra Tutor
 * מאפשרת גישה מהירה לנוסחאות שונות מאורגנות לפי קטגוריות
 */
var AlgebraTutorMathLibrary = {
    // קטגוריות של נוסחאות
    categories: [
        {
            id: 'algebra',
            name: 'אלגברה',
            formulas: [
                {
                    name: 'נוסחת הכפל המקוצר (a+b)²',
                    latex: '(a+b)^2 = a^2 + 2ab + b^2'
                },
                {
                    name: 'נוסחת הכפל המקוצר (a-b)²',
                    latex: '(a-b)^2 = a^2 - 2ab + b^2'
                },
                {
                    name: 'נוסחת הכפל המקוצר (a+b)(a-b)',
                    latex: '(a+b)(a-b) = a^2 - b^2'
                },
                {
                    name: 'פתרון משוואה ממעלה ראשונה',
                    latex: 'ax + b = c \\Rightarrow x = \\frac{c-b}{a}'
                },
                {
                    name: 'נוסחת השורשים למשוואה ריבועית',
                    latex: 'ax^2 + bx + c = 0 \\Rightarrow x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
                },
                {
                    name: 'דלתא (אפיון שורשי משוואה ריבועית)',
                    latex: '\\Delta = b^2 - 4ac'
                },
                {
                    name: 'נוסחת וייטא - מכפלת שורשים',
                    latex: 'x_1 \\cdot x_2 = \\frac{c}{a}'
                },
                {
                    name: 'נוסחת וייטא - סכום שורשים',
                    latex: 'x_1 + x_2 = -\\frac{b}{a}'
                },
                {
                    name: 'פירוק לפי נוסחת הכפל המקוצר הראשונה',
                    latex: 'a^2 + 2ab + b^2 = (a+b)^2'
                },
                {
                    name: 'פירוק לפי נוסחת הכפל המקוצר השנייה',
                    latex: 'a^2 - 2ab + b^2 = (a-b)^2'
                },
                {
                    name: 'פירוק לפי נוסחת הכפל המקוצר השלישית',
                    latex: 'a^2 - b^2 = (a+b)(a-b)'
                }
            ]
        },
        {
            id: 'functions',
            name: 'פונקציות',
            formulas: [
                {
                    name: 'פונקציה ליניארית',
                    latex: 'f(x) = mx + b'
                },
                {
                    name: 'פונקציה ריבועית',
                    latex: 'f(x) = ax^2 + bx + c'
                },
                {
                    name: 'נקודת קיצון של פונקציה ריבועית',
                    latex: 'x = -\\frac{b}{2a}'
                },
                {
                    name: 'פונקציה רציונלית',
                    latex: 'f(x) = \\frac{P(x)}{Q(x)}'
                },
                {
                    name: 'פונקציה מעריכית',
                    latex: 'f(x) = a \\cdot b^x'
                },
                {
                    name: 'פונקציה לוגריתמית',
                    latex: 'f(x) = \\log_a(x)'
                },
                {
                    name: 'פונקצית ערך מוחלט',
                    latex: 'f(x) = |x|'
                },
                {
                    name: 'פונקצית שורש',
                    latex: 'f(x) = \\sqrt{x}'
                },
                {
                    name: 'מכפלת פונקציות',
                    latex: '(f \\cdot g)(x) = f(x) \\cdot g(x)'
                },
                {
                    name: 'סכום פונקציות',
                    latex: '(f + g)(x) = f(x) + g(x)'
                },
                {
                    name: 'הרכבת פונקציות',
                    latex: '(f \\circ g)(x) = f(g(x))'
                }
            ]
        },
        {
            id: 'geometry',
            name: 'גאומטריה',
            formulas: [
                {
                    name: 'שטח מלבן',
                    latex: 'S = a \\cdot b'
                },
                {
                    name: 'שטח משולש',
                    latex: 'S = \\frac{a \\cdot h}{2}'
                },
                {
                    name: 'שטח משולש (נוסחת הרון)',
                    latex: 'S = \\sqrt{s(s-a)(s-b)(s-c)}, \\text{ כאשר } s = \\frac{a+b+c}{2}'
                },
                {
                    name: 'שטח עיגול',
                    latex: 'S = \\pi r^2'
                },
                {
                    name: 'היקף עיגול',
                    latex: 'P = 2\\pi r'
                },
                {
                    name: 'משפט פיתגורס',
                    latex: 'a^2 + b^2 = c^2'
                },
                {
                    name: 'נפח תיבה',
                    latex: 'V = a \\cdot b \\cdot c'
                },
                {
                    name: 'נפח גליל',
                    latex: 'V = \\pi r^2 h'
                },
                {
                    name: 'נפח חרוט',
                    latex: 'V = \\frac{1}{3} \\pi r^2 h'
                },
                {
                    name: 'נפח כדור',
                    latex: 'V = \\frac{4}{3} \\pi r^3'
                },
                {
                    name: 'שטח פנים של תיבה',
                    latex: 'S = 2(ab + ac + bc)'
                },
                {
                    name: 'שטח פנים של כדור',
                    latex: 'S = 4 \\pi r^2'
                }
            ]
        },
        {
            id: 'calculus',
            name: 'חשבון דיפרנציאלי ואינטגרלי',
            formulas: [
                {
                    name: 'הגדרת הנגזרת',
                    latex: 'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}'
                },
                {
                    name: 'נגזרת של פונקציה קבועה',
                    latex: '\\frac{d}{dx}(c) = 0'
                },
                {
                    name: 'נגזרת של פונקציה לינארית',
                    latex: '\\frac{d}{dx}(ax) = a'
                },
                {
                    name: 'נגזרת של פולינום',
                    latex: '\\frac{d}{dx}(x^n) = nx^{n-1}'
                },
                {
                    name: 'כלל הסכום',
                    latex: '\\frac{d}{dx}[f(x) + g(x)] = f\'(x) + g\'(x)'
                },
                {
                    name: 'כלל המכפלה',
                    latex: '\\frac{d}{dx}[f(x) \\cdot g(x)] = f\'(x) \\cdot g(x) + f(x) \\cdot g\'(x)'
                },
                {
                    name: 'כלל המנה',
                    latex: '\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f\'(x)g(x) - f(x)g\'(x)}{[g(x)]^2}'
                },
                {
                    name: 'כלל השרשרת',
                    latex: '\\frac{d}{dx}f(g(x)) = f\'(g(x)) \\cdot g\'(x)'
                },
                {
                    name: 'נגזרת של פונקציה מעריכית',
                    latex: '\\frac{d}{dx}(e^x) = e^x'
                },
                {
                    name: 'נגזרת של פונקציה לוגריתמית',
                    latex: '\\frac{d}{dx}(\\ln x) = \\frac{1}{x}'
                },
                {
                    name: 'אינטגרל בסיסי',
                    latex: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C, n \\neq -1'
                },
                {
                    name: 'אינטגרל של פונקציה מעריכית',
                    latex: '\\int e^x dx = e^x + C'
                },
                {
                    name: 'אינטגרל של פונקציה לוגריתמית',
                    latex: '\\int \\frac{1}{x} dx = \\ln|x| + C'
                },
                {
                    name: 'אינטגרל מסוים',
                    latex: '\\int_{a}^{b} f(x) dx = F(b) - F(a)'
                }
            ]
        },
        {
            id: 'trigonometry',
            name: 'טריגונומטריה',
            formulas: [
                {
                    name: 'זהות פיתגורס טריגונומטרית',
                    latex: '\\sin^2 \\theta + \\cos^2 \\theta = 1'
                },
                {
                    name: 'טנגנס בעזרת סינוס וקוסינוס',
                    latex: '\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}'
                },
                {
                    name: 'קוטנגנס בעזרת סינוס וקוסינוס',
                    latex: '\\cot \\theta = \\frac{\\cos \\theta}{\\sin \\theta}'
                },
                {
                    name: 'זהות טריגונומטרית נוספת',
                    latex: '1 + \\tan^2 \\theta = \\frac{1}{\\cos^2 \\theta}'
                },
                {
                    name: 'נוסחת הסינוס של סכום זוויות',
                    latex: '\\sin(\\alpha + \\beta) = \\sin \\alpha \\cos \\beta + \\cos \\alpha \\sin \\beta'
                },
                {
                    name: 'נוסחת הסינוס של הפרש זוויות',
                    latex: '\\sin(\\alpha - \\beta) = \\sin \\alpha \\cos \\beta - \\cos \\alpha \\sin \\beta'
                },
                {
                    name: 'נוסחת הקוסינוס של סכום זוויות',
                    latex: '\\cos(\\alpha + \\beta) = \\cos \\alpha \\cos \\beta - \\sin \\alpha \\sin \\beta'
                },
                {
                    name: 'נוסחת הקוסינוס של הפרש זוויות',
                    latex: '\\cos(\\alpha - \\beta) = \\cos \\alpha \\cos \\beta + \\sin \\alpha \\sin \\beta'
                },
                {
                    name: 'חוק הסינוסים',
                    latex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}'
                },
                {
                    name: 'חוק הקוסינוסים',
                    latex: 'c^2 = a^2 + b^2 - 2ab\\cos C'
                },
                {
                    name: 'נוסחת הכפל לסינוס',
                    latex: '\\sin 2\\alpha = 2\\sin \\alpha \\cos \\alpha'
                },
                {
                    name: 'נוסחת הכפל לקוסינוס',
                    latex: '\\cos 2\\alpha = \\cos^2 \\alpha - \\sin^2 \\alpha = 2\\cos^2 \\alpha - 1 = 1 - 2\\sin^2 \\alpha'
                }
            ]
        },
        {
            id: 'statistics',
            name: 'סטטיסטיקה והסתברות',
            formulas: [
                {
                    name: 'ממוצע (מדגם)',
                    latex: '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i'
                },
                {
                    name: 'שכיחות יחסית',
                    latex: 'f_i = \\frac{n_i}{N}'
                },
                {
                    name: 'סטיית תקן (מדגם)',
                    latex: 's = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2}'
                },
                {
                    name: 'שונות (מדגם)',
                    latex: 's^2 = \\frac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2'
                },
                {
                    name: 'הסתברות של איחוד מאורעות',
                    latex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)'
                },
                {
                    name: 'הסתברות של חיתוך מאורעות בלתי תלויים',
                    latex: 'P(A \\cap B) = P(A) \\cdot P(B)'
                },
                {
                    name: 'הסתברות מותנית',
                    latex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}'
                },
                {
                    name: 'נוסחת בייס',
                    latex: 'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}'
                },
                {
                    name: 'קומבינציות - בינום ניוטון',
                    latex: '{n \\choose k} = \\frac{n!}{k!(n-k)!}'
                },
                {
                    name: 'התפלגות בינומית - הסתברות',
                    latex: 'P(X=k) = {n \\choose k} p^k (1-p)^{n-k}'
                },
                {
                    name: 'התפלגות בינומית - תוחלת',
                    latex: 'E(X) = np'
                },
                {
                    name: 'התפלגות בינומית - שונות',
                    latex: 'Var(X) = np(1-p)'
                }
            ]
        },
        {
            id: 'sequences',
            name: 'סדרות',
            formulas: [
                {
                    name: 'סדרה חשבונית - איבר כללי',
                    latex: 'a_n = a_1 + (n-1)d'
                },
                {
                    name: 'סדרה חשבונית - סכום',
                    latex: 'S_n = \\frac{n}{2}(a_1 + a_n) = \\frac{n}{2}[2a_1 + (n-1)d]'
                },
                {
                    name: 'סדרה הנדסית - איבר כללי',
                    latex: 'a_n = a_1 \\cdot q^{n-1}'
                },
                {
                    name: 'סדרה הנדסית - סכום סופי',
                    latex: 'S_n = a_1 \\cdot \\frac{1-q^n}{1-q}, q \\neq 1'
                },
                {
                    name: 'סדרה הנדסית - סכום אינסופי',
                    latex: 'S = \\frac{a_1}{1-q}, |q| < 1'
                },
                {
                    name: 'סדרת פיבונאצ\'י',
                    latex: 'F_n = F_{n-1} + F_{n-2}, F_1 = 1, F_2 = 1'
                },
                {
                    name: 'נוסחת האיבר הכללי בסדרה המוגדרת ע"י כלל נסיגה',
                    latex: 'a_n = f(a_{n-1}, a_{n-2}, \\ldots, a_1)'
                }
            ]
        },
        {
            id: 'logic',
            name: 'לוגיקה',
            formulas: [
                {
                    name: 'שלילה',
                    latex: '\\neg p'
                },
                {
                    name: 'וגם (AND)',
                    latex: 'p \\land q'
                },
                {
                    name: 'או (OR)',
                    latex: 'p \\lor q'
                },
                {
                    name: 'אימפליקציה',
                    latex: 'p \\Rightarrow q'
                },
                {
                    name: 'אימפליקציה דו-כיוונית',
                    latex: 'p \\Leftrightarrow q'
                },
                {
                    name: 'חוק דה-מורגן ראשון',
                    latex: '\\neg(p \\land q) \\Leftrightarrow \\neg p \\lor \\neg q'
                },
                {
                    name: 'חוק דה-מורגן שני',
                    latex: '\\neg(p \\lor q) \\Leftrightarrow \\neg p \\land \\neg q'
                },
                {
                    name: 'כלל הקונטרפוזיציה',
                    latex: '(p \\Rightarrow q) \\Leftrightarrow (\\neg q \\Rightarrow \\neg p)'
                },
                {
                    name: 'לכל (כמת כללי)',
                    latex: '\\forall x \\in A: P(x)'
                },
                {
                    name: 'קיים (כמת קיום)',
                    latex: '\\exists x \\in A: P(x)'
                }
            ]
        }
    ],

    /**
     * פונקציה ליצירת ממשק הספרייה
     * @param {HTMLElement} container - המיכל להצגת הספרייה
     * @param {Function} onSelectCallback - פונקציה שתיקרא בעת בחירת נוסחה
     */
    createLibraryUI: function(container, onSelectCallback) {
        if (!container) return;

        // יצירת אלמנט הכותרת
        var header = document.createElement('h2');
        header.textContent = 'ספריית נוסחאות מתמטיות';
        header.style.borderBottom = '1px solid #ddd';
        header.style.paddingBottom = '10px';
        header.style.marginBottom = '20px';
        container.appendChild(header);

        // יצירת תיאור קצר
        var description = document.createElement('p');
        description.textContent = 'בחר קטגוריה ולאחר מכן לחץ על נוסחה כדי להוסיף אותה לשאלה.';
        description.style.marginBottom = '20px';
        container.appendChild(description);

        // יצירת תפריט קטגוריות
        var categoriesNav = document.createElement('div');
        categoriesNav.className = 'math-library-nav';
        categoriesNav.style.display = 'flex';
        categoriesNav.style.flexWrap = 'wrap';
        categoriesNav.style.gap = '10px';
        categoriesNav.style.margin = '20px 0';

        // יצירת מיכל לתוכן הקטגוריה
        var contentArea = document.createElement('div');
        contentArea.className = 'math-library-content';
        contentArea.style.marginTop = '20px';
        contentArea.style.borderTop = '1px solid #ddd';
        contentArea.style.paddingTop = '20px';

        // יצירת כפתורי הקטגוריות
        this.categories.forEach(function(category, index) {
            var btn = document.createElement('button');
            btn.textContent = category.name;
            btn.setAttribute('data-category', category.id);
            btn.className = 'math-library-category-btn';
            btn.style.padding = '10px 15px';
            btn.style.backgroundColor = index === 0 ? '#0073aa' : '#f7f7f7';
            btn.style.color = index === 0 ? 'white' : '#333';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '14px';
            btn.style.transition = 'all 0.2s ease';

            // אפקט hover
            btn.onmouseover = function() {
                if (btn.style.backgroundColor !== 'rgb(0, 115, 170)') { // לא הכפתור הפעיל
                    btn.style.backgroundColor = '#e9e9e9';
                }
            };

            btn.onmouseout = function() {
                if (btn.style.backgroundColor !== 'rgb(0, 115, 170)') { // לא הכפתור הפעיל
                    btn.style.backgroundColor = '#f7f7f7';
                }
            };

            // אירוע לחיצה
            btn.addEventListener('click', function() {
                // עדכון הסגנון של כל הכפתורים
                document.querySelectorAll('.math-library-category-btn').forEach(function(b) {
                    b.style.backgroundColor = '#f7f7f7';
                    b.style.color = '#333';
                });

                // הדגשת הכפתור הנוכחי
                btn.style.backgroundColor = '#0073aa';
                btn.style.color = 'white';

                // הצגת הנוסחאות מהקטגוריה
                AlgebraTutorMathLibrary.displayCategoryFormulas(contentArea, category, onSelectCallback);
            });

            categoriesNav.appendChild(btn);
        });

        container.appendChild(categoriesNav);
        container.appendChild(contentArea);

        // יצירת תיבת חיפוש
        var searchContainer = document.createElement('div');
        searchContainer.style.margin = '0 0 20px 0';

        var searchLabel = document.createElement('label');
        searchLabel.textContent = 'חיפוש נוסחה: ';
        searchLabel.setAttribute('for', 'formula-search');
        searchLabel.style.marginLeft = '5px';

        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'formula-search';
        searchInput.placeholder = 'הקלד מילות חיפוש...';
        searchInput.style.padding = '8px';
        searchInput.style.width = '300px';
        searchInput.style.maxWidth = '100%';
        searchInput.style.borderRadius = '4px';
        searchInput.style.border = '1px solid #ddd';

        searchContainer.appendChild(searchLabel);
        searchContainer.appendChild(searchInput);

        // הוספת אירוע חיפוש
        searchInput.addEventListener('input', function() {
            var searchTerm = this.value.trim().toLowerCase();

            if (searchTerm.length < 2) {
                // אם החיפוש קצר מדי, הצג את הקטגוריה הראשונה
                var firstCategoryBtn = document.querySelector('.math-library-category-btn');
                if (firstCategoryBtn) {
                    firstCategoryBtn.click();
                }
                return;
            }

            // סינון כל הנוסחאות מכל הקטגוריות
            var allMatchingFormulas = [];

            AlgebraTutorMathLibrary.categories.forEach(function(category) {
                category.formulas.forEach(function(formula) {
                    if (formula.name.toLowerCase().includes(searchTerm) ||
                        formula.latex.toLowerCase().includes(searchTerm)) {
                        allMatchingFormulas.push({
                            category: category.name,
                            formula: formula
                        });
                    }
                });
            });

            // הצגת תוצאות החיפוש
            AlgebraTutorMathLibrary.displaySearchResults(contentArea, allMatchingFormulas, searchTerm, onSelectCallback);
        });

        container.insertBefore(searchContainer, categoriesNav);

        // הצגת הקטגוריה הראשונה כברירת מחדל
        if (this.categories.length > 0) {
            this.displayCategoryFormulas(contentArea, this.categories[0], onSelectCallback);
        }
    },

    /**
     * פונקציה להצגת הנוסחאות בקטגוריה
     * @param {HTMLElement} container - המיכל להצגת הנוסחאות
     * @param {Object} category - אובייקט הקטגוריה להצגה
     * @param {Function} onSelectCallback - פונקציה שתיקרא בעת בחירת נוסחה
     */
    displayCategoryFormulas: function(container, category, onSelectCallback) {
        if (!container) return;

        // ניקוי התוכן הקיים
        container.innerHTML = '';

        // כותרת הקטגוריה
        var categoryTitle = document.createElement('h3');
        categoryTitle.textContent = 'קטגוריה: ' + category.name;
        categoryTitle.style.marginBottom = '15px';
        container.appendChild(categoryTitle);

        // יצירת רשימת הנוסחאות
        var formulasList = document.createElement('div');
        formulasList.className = 'math-formulas-list';
        formulasList.style.display = 'grid';
        formulasList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        formulasList.style.gap = '15px';

        // מיון הנוסחאות לפי שם
        var sortedFormulas = category.formulas.slice().sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

        sortedFormulas.forEach(function(formula) {
            var formulaCard = this.createFormulaCard(formula, onSelectCallback);
            formulasList.appendChild(formulaCard);
        }, this);

        container.appendChild(formulasList);

        // עדכון MathJax לתצוגה נכונה של הנוסחאות
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).catch(function(err) {
                console.error('Error typesetting formulas:', err);
            });
        }
    },

    /**
     * פונקציה להצגת תוצאות חיפוש
     * @param {HTMLElement} container - המיכל להצגת התוצאות
     * @param {Array} results - מערך של תוצאות חיפוש
     * @param {String} searchTerm - מונח החיפוש
     * @param {Function} onSelectCallback - פונקציה שתיקרא בעת בחירת נוסחה
     */
    displaySearchResults: function(container, results, searchTerm, onSelectCallback) {
        if (!container) return;

        // ניקוי התוכן הקיים
        container.innerHTML = '';

        // כותרת תוצאות החיפוש
        var searchTitle = document.createElement('h3');
        searchTitle.textContent = 'תוצאות חיפוש: "' + searchTerm + '"';
        searchTitle.style.marginBottom = '15px';
        container.appendChild(searchTitle);

        if (results.length === 0) {
            // אין תוצאות
            var noResults = document.createElement('p');
            noResults.textContent = 'לא נמצאו נוסחאות התואמות לחיפוש.';
            noResults.style.padding = '20px';
            noResults.style.textAlign = 'center';
            noResults.style.color = '#666';
            container.appendChild(noResults);
            return;
        }

        // יצירת רשימת התוצאות
        var resultsList = document.createElement('div');
        resultsList.className = 'math-formulas-list';
        resultsList.style.display = 'grid';
        resultsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        resultsList.style.gap = '15px';

        results.forEach(function(result) {
            var formulaCard = this.createFormulaCard(result.formula, onSelectCallback, result.category);
            resultsList.appendChild(formulaCard);
        }, this);

        container.appendChild(resultsList);

        // עדכון MathJax לתצוגה נכונה של הנוסחאות
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).catch(function(err) {
                console.error('Error typesetting formulas:', err);
            });
        }
    },

    /**
     * פונקציה ליצירת כרטיס נוסחה
     * @param {Object} formula - אובייקט הנוסחה
     * @param {Function} onSelectCallback - פונקציה שתיקרא בעת בחירת נוסחה
     * @param {String} categoryName - שם הקטגוריה (אופציונלי, לתצוגת תוצאות חיפוש)
     * @returns {HTMLElement} אלמנט הכרטיס
     */
    createFormulaCard: function(formula, onSelectCallback, categoryName) {
        var formulaCard = document.createElement('div');
        formulaCard.className = 'math-formula-card';
        formulaCard.style.border = '1px solid #ddd';
        formulaCard.style.borderRadius = '4px';
        formulaCard.style.padding = '15px';
        formulaCard.style.backgroundColor = '#f9f9f9';
        formulaCard.style.cursor = 'pointer';
        formulaCard.style.transition = 'all 0.2s ease';
        formulaCard.style.position = 'relative';

        var titleElement = document.createElement('div');
        titleElement.className = 'formula-title';
        titleElement.textContent = formula.name;
        titleElement.style.fontWeight = 'bold';
        titleElement.style.marginBottom = '10px';
        titleElement.style.color = '#0073aa';

        var latexElement = document.createElement('div');
        latexElement.className = 'formula-latex';
        latexElement.innerHTML = '\\(' + formula.latex + '\\)';
        latexElement.style.padding = '5px';
        latexElement.style.background = '#fff';
        latexElement.style.border = '1px solid #eee';
        latexElement.style.borderRadius = '3px';
        latexElement.style.minHeight = '40px';
        latexElement.style.display = 'flex';
        latexElement.style.alignItems = 'center';
        latexElement.style.justifyContent = 'center';

        // אם יש שם קטגוריה (מתצוגת חיפוש), הצג אותו
        if (categoryName) {
            var categoryLabel = document.createElement('div');
            categoryLabel.className = 'formula-category';
            categoryLabel.textContent = categoryName;
            categoryLabel.style.position = 'absolute';
            categoryLabel.style.top = '5px';
            categoryLabel.style.right = '5px';
            categoryLabel.style.fontSize = '11px';
            categoryLabel.style.padding = '2px 6px';
            categoryLabel.style.background = '#e0e0e0';
            categoryLabel.style.borderRadius = '3px';
            categoryLabel.style.color = '#555';
            formulaCard.appendChild(categoryLabel);
        }

        // כפתור העתק והדבק
        var insertButton = document.createElement('button');
        insertButton.textContent = 'הוסף לשאלה';
        insertButton.style.marginTop = '10px';
        insertButton.style.padding = '5px 10px';
        insertButton.style.background = '#0073aa';
        insertButton.style.color = '#fff';
        insertButton.style.border = 'none';
        insertButton.style.borderRadius = '3px';
        insertButton.style.cursor = 'pointer';
        insertButton.style.width = '100%';
        insertButton.style.transition = 'background-color 0.2s ease';

        formulaCard.appendChild(titleElement);
        formulaCard.appendChild(latexElement);
        formulaCard.appendChild(insertButton);

        // הוספת אירוע לחיצה על הכפתור
        insertButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof onSelectCallback === 'function') {
                onSelectCallback(formula.latex);
            }
        });

        // הוספת אירוע לחיצה על הכרטיס
        formulaCard.addEventListener('click', function() {
            if (typeof onSelectCallback === 'function') {
                onSelectCallback(formula.latex);
            }
        });

        // אפקט hover
        formulaCard.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f0f0';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            this.style.transform = 'translateY(-2px)';
        });

        formulaCard.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f9f9f9';
            this.style.boxShadow = 'none';
            this.style.transform = 'translateY(0)';
        });

        insertButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#005a87';
        });

        insertButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#0073aa';
        });

        return formulaCard;
    }
};


