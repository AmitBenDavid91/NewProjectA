/**
 * תוסף עורך נוסחאות מתמטיות עבור TinyMCE
 * מאפשר הוספה, עריכה ומחיקה של נוסחאות LaTeX בצורה קלה ואינטואיטיבית
 */
tinymce.PluginManager.add('myMathButton', function(editor, url) {
    // מצבים גלובליים
    var currentMathElement = null;
    var mathLiveLoaded = false;
    var isMathLiveLoading = false;
    var dragStartX = 0;
    var dragStartY = 0;
    var isDragging = false;
    var editorX = 0;
    var editorY = 0;
    var lastInsertedFormula = null;
    var libraryInitialized = false;

    // בדיקה האם MathLive זמין
    function checkMathLiveLoaded() {
        mathLiveLoaded = typeof MathLive !== 'undefined';
        return mathLiveLoaded;
    }

    // הוספת CSS לעיצוב נוסחאות
    editor.on('init', function() {
        // בדיקה ראשונית של MathLive
        checkMathLiveLoaded();

        // הוספת CSS לעיצוב הנוסחאות בעורך
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
            '.algebra-tutor-math:hover::after {' +
            '  content: "✎";' +
            '  position: absolute;' +
            '  top: -8px;' +
            '  right: -8px;' +
            '  background: #0073aa;' +
            '  color: white;' +
            '  border-radius: 50%;' +
            '  width: 16px;' +
            '  height: 16px;' +
            '  font-size: 10px;' +
            '  line-height: 16px;' +
            '  text-align: center;' +
            '}' +
            '.algebra-tutor-math:hover::before {' +
            '  content: "×";' +
            '  position: absolute;' +
            '  top: -8px;' +
            '  left: -8px;' +
            '  background: #d63638;' +
            '  color: white;' +
            '  border-radius: 50%;' +
            '  width: 16px;' +
            '  height: 16px;' +
            '  font-size: 12px;' +
            '  line-height: 14px;' +
            '  text-align: center;' +
            '}' +
            '.algebra-tutor-math.math-block {' +
            '  display: block;' +
            '  margin: 10px 0;' +
            '  text-align: center;' +
            '  padding: 5px;' +
            '}'
        );

        // טיפול בלחיצה על נוסחאות קיימות
        editor.getBody().addEventListener('click', function(e) {
            var target = e.target;
            var mathElement = target.closest('.algebra-tutor-math');

            if (mathElement) {
                e.preventDefault();
                e.stopPropagation();

                // בדיקה אם לחצו על כפתור המחיקה (בחלק השמאלי העליון)
                var rect = mathElement.getBoundingClientRect();
                var deleteButtonX = rect.left;
                var deleteButtonY = rect.top;

                // אם הלחיצה היתה באזור של כפתור המחיקה (16x16 פיקסלים בפינה השמאלית העליונה)
                if (e.clientX >= deleteButtonX - 8 && e.clientX <= deleteButtonX + 8 &&
                    e.clientY >= deleteButtonY - 8 && e.clientY <= deleteButtonY + 8) {
                    // מחיקת הנוסחה
                    deleteFormula(mathElement);
                } else {
                    // פתיחת העורך
                    openMathEditor(mathElement);
                }
            }
        });

        // הוספת סגנון לחלון הצף
        var floatingEditorStyle = document.createElement('style');
        floatingEditorStyle.type = 'text/css';
        floatingEditorStyle.innerHTML = `
            #math-floating-editor {
                position: fixed;
                top: 100px;
                left: 100px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                padding: 15px;
                z-index: 100001;
                width: 700px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                direction: rtl;
                resize: both;
            }
            #math-floating-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.3);
                z-index: 100000;
            }
            .math-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
                cursor: move;
            }
            .math-editor-title {
                font-size: 16px;
                font-weight: bold;
                margin: 0;
            }
            .math-editor-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #666;
            }
            .math-editor-close:hover {
                color: #000;
            }
            .math-editor-tabs {
                display: flex;
                margin-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .math-editor-tab {
                padding: 8px 16px;
                cursor: pointer;
                border: 1px solid transparent;
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                margin-right: 5px;
                background: #f7f7f7;
            }
            .math-editor-tab.active {
                background: #fff;
                border-color: #eee;
                border-bottom: 1px solid #fff;
                margin-bottom: -1px;
                font-weight: bold;
                color: #0073aa;
            }
            .math-editor-content {
                margin-bottom: 15px;
            }
            .math-editor-tab-content {
                display: none;
            }
            .math-editor-tab-content.active {
                display: block;
            }
            .math-editor-field-wrapper {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 15px;
                background: #fff;
            }
            .math-editor-preview {
                background: #f9f9f9;
                border: 1px solid #eee;
                border-radius: 4px;
                padding: 15px;
                min-height: 60px;
                margin-bottom: 15px;
                overflow-x: auto;
            }
            .math-editor-preview-title {
                font-weight: bold;
                margin-bottom: 10px;
                color: #555;
            }
            .math-editor-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .math-editor-toolbar-group {
                display: flex;
                gap: 3px;
                margin-right: 15px;
                padding-right: 15px;
                border-right: 1px solid #eee;
            }
            .math-editor-toolbar-group:last-child {
                border-right: none;
            }
            .math-editor-toolbar-btn {
                min-width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                padding: 0 8px;
            }
            .math-editor-toolbar-btn:hover {
                background: #f0f0f0;
                border-color: #0073aa;
            }
            .math-editor-mode {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }
            .math-editor-mode label {
                margin-right: 10px;
                display: flex;
                align-items: center;
                cursor: pointer;
            }
            .math-editor-mode input {
                margin-right: 5px;
            }
            .math-editor-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .math-editor-save {
                background: #0073aa;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            .math-editor-save:hover {
                background: #005f87;
            }
            .math-editor-cancel {
                background: #f7f7f7;
                border: 1px solid #ddd;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            .math-editor-cancel:hover {
                background: #f0f0f0;
                border-color: #999;
            }
            .math-editor-delete {
                background: #d63638;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-right: auto;
            }
            .math-editor-delete:hover {
                background: #b32d2e;
            }
            .math-editor-done {
                background: #46b450;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 5px;
            }
            .math-editor-done:hover {
                background: #39963c;
            }
            .math-editor-keyboard {
                background: #f7f7f7;
                border: 1px solid #ddd;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                margin-top: 10px;
            }
            .math-editor-keyboard:hover {
                background: #f0f0f0;
                border-color: #999;
            }
            .math-editor-keyboard svg {
                margin-right: 5px;
            }
            .math-loading {
                text-align: center;
                padding: 20px;
                font-style: italic;
                color: #666;
            }
            .math-loading::after {
                content: "...";
                animation: dots 1.5s infinite;
            }
            @keyframes dots {
                0%, 20% { content: "."; }
                40% { content: ".."; }
                60%, 100% { content: "..."; }
            }
            
            /* עיצוב ספריית הנוסחאות */
            .formula-library-tab {
                padding: 15px;
                max-height: 400px;
                overflow-y: auto;
            }
            .formula-library-title {
                font-weight: bold;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #eee;
            }
            .formula-library-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 15px;
            }
            .formula-category-button {
                background: #f7f7f7;
                border: 1px solid #ddd;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            .formula-category-button.active {
                background: #0073aa;
                color: white;
                border-color: #0073aa;
            }
            .formula-search {
                margin-bottom: 15px;
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .formula-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }
            .formula-card {
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                cursor: pointer;
                transition: all 0.2s;
                background: #f9f9f9;
                position: relative;
            }
            .formula-card:hover {
                border-color: #0073aa;
                background: #f0f0f0;
                transform: translateY(-2px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .formula-name {
                font-size: 12px;
                color: #0073aa;
                margin-bottom: 5px;
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .formula-preview {
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border: 1px solid #eee;
                border-radius: 3px;
                padding: 5px;
                direction: ltr;
            }
            .formula-category-content {
                display: none;
            }
            .formula-category-content.active {
                display: block;
            }
        `;
        document.head.appendChild(floatingEditorStyle);

        // וידוא טעינת MathLive אם צריך
        ensureMathLiveLoaded();
    });

    // Add keyboard shortcut Alt+Plus to open math editor
    editor.on('keydown', function(e) {
        // Check for Alt+Plus (Plus is keyCode 187 or 107 depending on browser)
        if (e.altKey && (e.keyCode === 187 || e.keyCode === 107)) {
            e.preventDefault(); // Prevent default browser behavior

            // Check if MathLive is loaded
            if (checkMathLiveLoaded()) {
                openMathEditor(null);
            } else {
                loadMathLive(function() {
                    openMathEditor(null);
                });
            }
        }
    });
    // הוספת כפתור לסרגל הכלים
    editor.addButton('myMathButton', {
        text: 'נוסחה',
        icon: 'code',
        tooltip: 'הוספת נוסחה מתמטית',
        onclick: function() {
            if (checkMathLiveLoaded()) {
                openMathEditor(null);
            } else {
                loadMathLive(function() {
                    openMathEditor(null);
                });
            }
        }
    });

    /**
     * וידוא שספריית MathLive טעונה
     */
    function ensureMathLiveLoaded() {
        if (checkMathLiveLoaded()) {
            return true;
        }

        // אם MathLive עדיין לא נטען, ננסה לטעון אותו
        if (!isMathLiveLoading) {
            loadMathLive();
        }

        return false;
    }

    /**
     * טעינת ספריית MathLive
     */
    function loadMathLive(callback) {
        if (checkMathLiveLoaded()) {
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        if (isMathLiveLoading) {
            // אם כבר בתהליך טעינה, נמתין ונבדוק שוב
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

        isMathLiveLoading = true;

        // כתובת ברירת מחדל ל-MathLive CDN
        var mathliveUrl = 'https://cdn.jsdelivr.net/npm/mathlive@0.90.5/dist/mathlive.min.js';

        // אם יש כתובת מוגדרת על ידי המערכת
        if (typeof algebraTutorSettings !== 'undefined' && algebraTutorSettings.mathliveUrl) {
            mathliveUrl = algebraTutorSettings.mathliveUrl;
        }

        // יצירת תגית סקריפט וטעינת הספרייה
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = mathliveUrl;
        script.async = true;

        script.onload = function() {
            console.log('MathLive loaded successfully');
            mathLiveLoaded = true;
            isMathLiveLoading = false;

            if (typeof callback === 'function') {
                callback();
            }
        };

        script.onerror = function() {
            console.error('Failed to load MathLive from: ' + mathliveUrl);
            isMathLiveLoading = false;
            alert('שגיאה בטעינת ספריית MathLive. יש לרענן את הדף ולנסות שוב.');
        };

        document.head.appendChild(script);
    }

    /**
     * פתיחת עורך נוסחאות צף
     */
    function openMathEditor(element) {
        currentMathElement = element;

        // קריאת נתוני הנוסחה אם יש
        var latex = '';
        var displayMode = false;

        if (currentMathElement) {
            // קריאת ה-latex המקורי מ-data-attribute
            latex = currentMathElement.getAttribute('data-latex') || '';
            latex = decodeLatex(latex);

            // בדיקת מצב תצוגה
            displayMode = currentMathElement.classList.contains('math-block');
        }

        // הסרת עורך קודם אם קיים
        removeMathEditor();

        // יצירת רקע אפור (backdrop)
        var backdrop = document.createElement('div');
        backdrop.id = 'math-floating-backdrop';
        backdrop.onclick = function(e) {
            if (e.target === backdrop) {
                closeMathEditor(false);
            }
        };
        document.body.appendChild(backdrop);

        // יצירת חלון העורך
        var editorContainer = document.createElement('div');
        editorContainer.id = 'math-floating-editor';

        // כותרת העורך
        var header = document.createElement('div');
        header.className = 'math-editor-header';

        var title = document.createElement('h2');
        title.className = 'math-editor-title';
        title.textContent = currentMathElement ? 'עריכת נוסחה מתמטית' : 'הוספת נוסחה מתמטית';
        header.appendChild(title);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'math-editor-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'סגור');
        closeBtn.onclick = function() {
            closeMathEditor(false);
        };
        header.appendChild(closeBtn);
        editorContainer.appendChild(header);

        // הוספת תמיכה בגרירה
        header.addEventListener('mousedown', function(e) {
            // לא לגרור בלחיצה על כפתור הסגירה
            if (e.target === closeBtn) return;

            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            editorX = editorContainer.offsetLeft;
            editorY = editorContainer.offsetTop;

            // מנע ברירת טקסט בזמן גרירה
            e.preventDefault();
        });

        // לשוניות
        var tabs = document.createElement('div');
        tabs.className = 'math-editor-tabs';

        var visualTab = document.createElement('div');
        visualTab.className = 'math-editor-tab active';
        visualTab.setAttribute('data-tab', 'visual');
        visualTab.textContent = 'עורך חזותי';
        tabs.appendChild(visualTab);

        var latexTab = document.createElement('div');
        latexTab.className = 'math-editor-tab';
        latexTab.setAttribute('data-tab', 'latex');
        latexTab.textContent = 'קוד LaTeX';
        tabs.appendChild(latexTab);

        var libraryTab = document.createElement('div');
        libraryTab.className = 'math-editor-tab';
        libraryTab.setAttribute('data-tab', 'library');
        libraryTab.textContent = 'ספריית נוסחאות';
        tabs.appendChild(libraryTab);

        editorContainer.appendChild(tabs);

        // תוכן העורך
        var editorContent = document.createElement('div');
        editorContent.className = 'math-editor-content';

        // לשונית ויזואלית
        var visualContent = document.createElement('div');
        visualContent.className = 'math-editor-tab-content visual-editor active';

        // בדיקה אם MathLive נטען
        if (!mathLiveLoaded) {
            var loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'math-loading';
            loadingIndicator.textContent = 'טוען את עורך הנוסחאות';
            visualContent.appendChild(loadingIndicator);
        } else {
            // סרגל כלים
            visualContent.appendChild(createMathToolbar());
        }

        // שדה עריכה
        var fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'math-editor-field-wrapper';

        if (mathLiveLoaded) {
            var mathField = document.createElement('math-field');
            mathField.id = 'math-editor-field';
            mathField.style.width = '100%';
            mathField.style.minHeight = '50px';
            mathField.style.fontSize = '16px';
            mathField.style.direction = 'ltr';

            fieldWrapper.appendChild(mathField);
        } else {
            // שדה טקסט פשוט כגיבוי עד שהספרייה תיטען
            var textField = document.createElement('textarea');
            textField.id = 'math-editor-field-fallback';
            textField.placeholder = 'טוען את עורך הנוסחאות...';
            textField.style.width = '100%';
            textField.style.minHeight = '50px';
            textField.style.padding = '10px';
            textField.value = latex;

            fieldWrapper.appendChild(textField);
        }

        visualContent.appendChild(fieldWrapper);

        // בחירת מצב תצוגה
        var modeSelector = document.createElement('div');
        modeSelector.className = 'math-editor-mode';

        var inlineLabel = document.createElement('label');
        var inlineRadio = document.createElement('input');
        inlineRadio.type = 'radio';
        inlineRadio.name = 'display-mode';
        inlineRadio.value = 'inline';
        inlineRadio.checked = !displayMode;
        inlineLabel.appendChild(inlineRadio);
        inlineLabel.appendChild(document.createTextNode('בתוך השורה'));

        var blockLabel = document.createElement('label');
        var blockRadio = document.createElement('input');
        blockRadio.type = 'radio';
        blockRadio.name = 'display-mode';
        blockRadio.value = 'block';
        blockRadio.checked = displayMode;
        blockLabel.appendChild(blockRadio);
        blockLabel.appendChild(document.createTextNode('בשורה נפרדת'));

        modeSelector.appendChild(inlineLabel);
        modeSelector.appendChild(blockLabel);

        visualContent.appendChild(modeSelector);

        editorContent.appendChild(visualContent);

        // לשונית LaTeX
        var latexContent = document.createElement('div');
        latexContent.className = 'math-editor-tab-content latex-editor';

        var latexField = document.createElement('textarea');
        latexField.id = 'latex-editor-field';
        latexField.style.width = '100%';
        latexField.style.minHeight = '120px';
        latexField.style.padding = '10px';
        latexField.style.fontFamily = 'monospace';
        latexField.style.fontSize = '14px';
        latexField.style.direction = 'ltr';
        latexField.value = latex;

        latexContent.appendChild(latexField);
        editorContent.appendChild(latexContent);

        // לשונית ספריית נוסחאות
        var libraryContent = document.createElement('div');
        libraryContent.className = 'math-editor-tab-content formula-library-tab';
        libraryContent.id = 'formula-library-container';

        var libraryLoading = document.createElement('div');
        libraryLoading.className = 'math-loading';
        libraryLoading.textContent = 'טוען את ספריית הנוסחאות';
        libraryContent.appendChild(libraryLoading);

        editorContent.appendChild(libraryContent);

        editorContainer.appendChild(editorContent);

        // תצוגה מקדימה
        var previewContainer = document.createElement('div');
        previewContainer.className = 'math-editor-preview';

        var previewTitle = document.createElement('div');
        previewTitle.className = 'math-editor-preview-title';
        previewTitle.textContent = 'תצוגה מקדימה:';
        previewContainer.appendChild(previewTitle);

        var preview = document.createElement('div');
        preview.id = 'math-editor-preview';
        preview.style.textAlign = 'center';
        preview.style.direction = 'ltr';
        previewContainer.appendChild(preview);

        editorContainer.appendChild(previewContainer);

        // כפתור מקלדת וירטואלית (רק אם MathLive זמין)
        if (mathLiveLoaded) {
            var keyboardBtn = document.createElement('button');
            keyboardBtn.className = 'math-editor-keyboard';
            keyboardBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4v8h16V4H0zm1 1h14v6H1V5zm2 1v1h1V6H3zm2 0v1h1V6H5zm2 0v1h1V6H7zm2 0v1h1V6H9zm2 0v1h1V6h-1zm2 0v1h1V6h-1zM3 8v1h1V8H3zm2 0v1h1V8H5zm2 0v1h1V8H7zm2 0v1h1V8H9zm2 0v1h1V8h-1zm2 0v1h1V8h-1zM3 10v1h7v-1H3zm8 0v1h2v-1h-2z"/></svg> מקלדת וירטואלית';
            keyboardBtn.onclick = function() {
                var mathField = document.getElementById('math-editor-field');
                if (mathField && mathField.mathfield) {
                    mathField.mathfield.executeCommand('toggleVirtualKeyboard');
                } else if (typeof MathLive !== 'undefined' && MathLive.toggleVirtualKeyboard) {
                    MathLive.toggleVirtualKeyboard();
                }
            };
            editorContainer.appendChild(keyboardBtn);
        }

        // כפתורים
        var actionsDiv = document.createElement('div');
        actionsDiv.className = 'math-editor-actions';

        // כפתור מחיקה (רק אם עורכים נוסחה קיימת)
        if (currentMathElement) {
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'math-editor-delete';
            deleteBtn.textContent = 'מחק נוסחה';
            deleteBtn.onclick = function() {
                if (confirm('האם אתה בטוח שברצונך למחוק את הנוסחה?')) {
                    deleteFormula(currentMathElement);
                    closeMathEditor(false);
                }
            };
            actionsDiv.appendChild(deleteBtn);
        }

        var saveBtn = document.createElement('button');
        saveBtn.className = 'math-editor-save';
        saveBtn.textContent = 'הוסף נוסחה';
        saveBtn.onclick = function() {
            saveFormula();
        };
        actionsDiv.appendChild(saveBtn);

        var doneBtn = document.createElement('button');
        doneBtn.className = 'math-editor-done';
        doneBtn.textContent = 'סיים';
        doneBtn.onclick = function() {
            closeMathEditor(true);
        };
        actionsDiv.appendChild(doneBtn);

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'math-editor-cancel';
        cancelBtn.textContent = 'ביטול';
        cancelBtn.onclick = function() {
            closeMathEditor(false);
        };
        actionsDiv.appendChild(cancelBtn);

        editorContainer.appendChild(actionsDiv);

        document.body.appendChild(editorContainer);

        // אם MathLive כבר נטען, אתחל את העורך
        if (mathLiveLoaded) {
            // אתחול העורך אחרי שהוא נוסף ל-DOM
            setTimeout(function() {
                initMathField(document.getElementById('math-editor-field'), latexField, preview, latex);

                // הוספת אירועי מקלדת
                document.getElementById('math-editor-field').addEventListener('keydown', function(e) {
                    // Enter שומר את הנוסחה
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                        e.preventDefault();
                        saveFormula();
                    }
                });
            }, 50);
        } else {
            // נטען את MathLive ומעדכנים את הממשק כשהוא מוכן
            loadMathLive(function() {
                // הסרת אינדיקטור טעינה
                var loadingIndicator = visualContent.querySelector('.math-loading');
                if (loadingIndicator) {
                    visualContent.removeChild(loadingIndicator);
                }

                // הוספת סרגל כלים
                visualContent.insertBefore(createMathToolbar(), visualContent.firstChild);

                // החלפת שדה הטקסט הפשוט בשדה MathLive
                var textField = document.getElementById('math-editor-field-fallback');
                var fieldValue = textField ? textField.value : latex;

                fieldWrapper.innerHTML = '';
                var mathField = document.createElement('math-field');
                mathField.id = 'math-editor-field';
                mathField.style.width = '100%';
                mathField.style.minHeight = '50px';
                mathField.style.fontSize = '16px';
                mathField.style.direction = 'ltr';

                fieldWrapper.appendChild(mathField);

                // אתחול העורך
                initMathField(mathField, latexField, preview, fieldValue);

                // הוספת אירועי מקלדת
                mathField.addEventListener('keydown', function(e) {
                    // Enter שומר את הנוסחה
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                        e.preventDefault();
                        saveFormula();
                    }
                });

                // הוספת כפתור מקלדת וירטואלית
                var keyboardBtn = document.createElement('button');
                keyboardBtn.className = 'math-editor-keyboard';
                keyboardBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 4v8h16V4H0zm1 1h14v6H1V5zm2 1v1h1V6H3zm2 0v1h1V6H5zm2 0v1h1V6H7zm2 0v1h1V6H9zm2 0v1h1V6h-1zm2 0v1h1V6h-1zM3 8v1h1V8H3zm2 0v1h1V8H5zm2 0v1h1V8H7zm2 0v1h1V8H9zm2 0v1h1V8h-1zm2 0v1h1V8h-1zM3 10v1h7v-1H3zm8 0v1h2v-1h-2z"/></svg> מקלדת וירטואלית';
                keyboardBtn.onclick = function() {
                    var mathField = document.getElementById('math-editor-field');
                    if (mathField && mathField.mathfield) {
                        mathField.mathfield.executeCommand('toggleVirtualKeyboard');
                    } else if (typeof MathLive !== 'undefined' && MathLive.toggleVirtualKeyboard) {
                        MathLive.toggleVirtualKeyboard();
                    }
                };
                editorContainer.insertBefore(keyboardBtn, actionsDiv);
            });
        }

        latexField.addEventListener('keydown', function(e) {
            // Enter שומר את הנוסחה
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                saveFormula();
            }
        });

        latexField.addEventListener('input', function() {
            updatePreview(latexField.value, document.getElementById('math-editor-preview'), getDisplayMode());

            // סינכרון עם שדה MathLive אם קיים
            var mathField = document.getElementById('math-editor-field');
            if (mathField && mathField.mathfield) {
                try {
                    mathField.mathfield.setValue(latexField.value);
                } catch (e) {
                    console.error('Error updating MathLive field:', e);
                }
            }
        });

        editorContainer.addEventListener('keydown', function(e) {
            // ESC סוגר את העורך
            if (e.key === 'Escape') {
                closeMathEditor(false);
            }
        });

        // טיפול בגרירה
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        // מעבר בין לשוניות
        visualTab.addEventListener('click', function() {
            switchTab('visual');
        });

        latexTab.addEventListener('click', function() {
            switchTab('latex');
        });

        libraryTab.addEventListener('click', function() {
            switchTab('library');

            // טעינת ספריית הנוסחאות בפעם הראשונה שלוחצים על הלשונית
            if (!libraryInitialized) {
                initializeFormulaLibrary();
            }
        });

        // עדכון תצוגה מקדימה ראשונית
        updatePreview(latex, preview, displayMode);

        // מיקום החלון במרכז
        centerFloatingEditor(editorContainer);

        // התמקדות בשדה העריכה
        setTimeout(function() {
            if (mathLiveLoaded) {
                var mathField = document.getElementById('math-editor-field');
                if (mathField) {
                    mathField.focus();
                }
            } else {
                var textField = document.getElementById('math-editor-field-fallback');
                if (textField) {
                    textField.focus();
                }
            }
        }, 200);
    }

    /**
     * אתחול ספריית הנוסחאות
     */
    function initializeFormulaLibrary() {
        // בדיקה אם ספריית הנוסחאות אינה מוגדרת
        if (typeof AlgebraTutorMathLibrary === 'undefined') {
            console.error('Missing AlgebraTutorMathLibrary');
            var libraryContainer = document.getElementById('formula-library-container');
            if (libraryContainer) {
                libraryContainer.innerHTML = '<div class="formula-library-error">ספריית הנוסחאות לא נטענה כראוי. נסה לרענן את הדף.</div>';
            }
            return;
        }

        libraryInitialized = true;
        var container = document.getElementById('formula-library-container');
        if (!container) return;

        // ניקוי התוכן הקיים
        container.innerHTML = '';

        // כותרת הספרייה
        var title = document.createElement('div');
        title.className = 'formula-library-title';
        title.textContent = 'ספריית נוסחאות מתמטיות';
        container.appendChild(title);

        // שדה חיפוש
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'formula-search';
        searchInput.placeholder = 'חיפוש נוסחה...';
        container.appendChild(searchInput);

        // יצירת תפריט קטגוריות
        var categoriesNav = document.createElement('div');
        categoriesNav.className = 'formula-library-categories';

        // יצירת מיכל לתוכן הנוסחאות
        var formulasContent = document.createElement('div');
        formulasContent.className = 'formula-library-content';

        // יצירת כפתורי הקטגוריות
        AlgebraTutorMathLibrary.categories.forEach(function(category, index) {
            var btn = document.createElement('button');
            btn.textContent = category.name;
            btn.className = 'formula-category-button' + (index === 0 ? ' active' : '');
            btn.setAttribute('data-category', category.id);

            // אירוע לחיצה על קטגוריה
            btn.addEventListener('click', function() {
                // עדכון הסגנון של כל הכפתורים
                document.querySelectorAll('.formula-category-button').forEach(function(b) {
                    b.classList.remove('active');
                });

                // הדגשת הכפתור הנוכחי
                btn.classList.add('active');

                // הצגת הנוסחאות מהקטגוריה
                showCategoryFormulas(category);
            });

            categoriesNav.appendChild(btn);

            // יצירת מיכל לנוסחאות בקטגוריה זו
            var categoryContent = document.createElement('div');
            categoryContent.className = 'formula-category-content' + (index === 0 ? ' active' : '');
            categoryContent.id = 'category-' + category.id;
            formulasContent.appendChild(categoryContent);

            // מילוי הנוסחאות בקטגוריה הראשונה
            if (index === 0) {
                populateCategoryFormulas(category, categoryContent);
            }
        });

        container.appendChild(categoriesNav);
        container.appendChild(formulasContent);

        // אירוע חיפוש
        searchInput.addEventListener('input', function() {
            var searchTerm = this.value.trim().toLowerCase();

            if (searchTerm.length < 2) {
                // אם החיפוש קצר מדי, הצג את הקטגוריה הפעילה
                var activeBtn = document.querySelector('.formula-category-button.active');
                if (activeBtn) activeBtn.click();
                return;
            }

            // חיפוש בכל הקטגוריות
            var results = [];

            AlgebraTutorMathLibrary.categories.forEach(function(category) {
                category.formulas.forEach(function(formula) {
                    if (formula.name.toLowerCase().includes(searchTerm) ||
                        formula.latex.toLowerCase().includes(searchTerm)) {
                        results.push({
                            category: category.name,
                            formula: formula
                        });
                    }
                });
            });

            // הצגת תוצאות החיפוש
            showSearchResults(results, searchTerm);
        });

        // הצגת הקטגוריה הראשונה כברירת מחדל
        if (AlgebraTutorMathLibrary.categories.length > 0) {
            showCategoryFormulas(AlgebraTutorMathLibrary.categories[0]);
        }
    }

    /**
     * הצגת נוסחאות מקטגוריה ספציפית
     */
    function showCategoryFormulas(category) {
        // הסתרת כל תכני הקטגוריות
        document.querySelectorAll('.formula-category-content').forEach(function(content) {
            content.classList.remove('active');
        });

        // מציאת/יצירת המיכל של הקטגוריה
        var categoryContent = document.getElementById('category-' + category.id);
        if (!categoryContent) {
            categoryContent = document.createElement('div');
            categoryContent.className = 'formula-category-content';
            categoryContent.id = 'category-' + category.id;
            document.querySelector('.formula-library-content').appendChild(categoryContent);
        }

        // הפעלת הקטגוריה
        categoryContent.classList.add('active');

        // מילוי הנוסחאות אם המיכל ריק
        if (categoryContent.children.length === 0) {
            populateCategoryFormulas(category, categoryContent);
        }
    }

    /**
     * מילוי מיכל קטגוריה בנוסחאות
     */
    function populateCategoryFormulas(category, container) {
        // ניקוי המיכל
        container.innerHTML = '';

        // יצירת רשת הנוסחאות
        var grid = document.createElement('div');
        grid.className = 'formula-grid';

        // מיון הנוסחאות לפי שם
        var sortedFormulas = category.formulas.slice().sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });

        // יצירת כרטיסיות הנוסחאות
        sortedFormulas.forEach(function(formula) {
            var card = createFormulaCard(formula);
            grid.appendChild(card);
        });

        container.appendChild(grid);

        // הפעלת MathJax על הקטגוריה
        if (typeof MathJax !== 'undefined') {
            setTimeout(function() {
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([container])
                        .catch(function(err) {
                            console.error('MathJax error:', err);
                        });
                } else if (MathJax.typeset) {
                    MathJax.typeset([container]);
                }
            }, 50);
        }
    }

    /**
     * הצגת תוצאות חיפוש
     */
    function showSearchResults(results, searchTerm) {
        // הסתרת כל תכני הקטגוריות
        document.querySelectorAll('.formula-category-content').forEach(function(content) {
            content.classList.remove('active');
        });

        // מציאת/יצירת מיכל תוצאות חיפוש
        var searchContent = document.getElementById('search-results');
        if (!searchContent) {
            searchContent = document.createElement('div');
            searchContent.className = 'formula-category-content';
            searchContent.id = 'search-results';
            document.querySelector('.formula-library-content').appendChild(searchContent);
        }

        // ניקוי המיכל
        searchContent.innerHTML = '';

        // כותרת תוצאות החיפוש
        var title = document.createElement('div');
        title.className = 'formula-library-title';
        title.textContent = 'תוצאות חיפוש: "' + searchTerm + '"';
        searchContent.appendChild(title);

        if (results.length === 0) {
            // אין תוצאות
            var noResults = document.createElement('div');
            noResults.textContent = 'לא נמצאו נוסחאות התואמות לחיפוש.';
            noResults.style.padding = '20px';
            noResults.style.textAlign = 'center';
            searchContent.appendChild(noResults);
        } else {
            // יצירת רשת תוצאות
            var grid = document.createElement('div');
            grid.className = 'formula-grid';

            results.forEach(function(result) {
                var card = createFormulaCard(result.formula, result.category);
                grid.appendChild(card);
            });

            searchContent.appendChild(grid);
        }

        // הפעלת המיכל
        searchContent.classList.add('active');

        // הפעלת MathJax על תוצאות החיפוש
        if (typeof MathJax !== 'undefined') {
            setTimeout(function() {
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([searchContent])
                        .catch(function(err) {
                            console.error('MathJax error:', err);
                        });
                } else if (MathJax.typeset) {
                    MathJax.typeset([searchContent]);
                }
            }, 50);
        }
    }

    /**
     * יצירת כרטיסיית נוסחה
     */
    function createFormulaCard(formula, categoryName) {
        var card = document.createElement('div');
        card.className = 'formula-card';

        var name = document.createElement('div');
        name.className = 'formula-name';
        name.textContent = formula.name;
        if (categoryName) {
            name.textContent += ' (' + categoryName + ')';
        }

        var preview = document.createElement('div');
        preview.className = 'formula-preview';

        // הצגת הנוסחה באמצעות MathJax
        if (formula.latex) {
            preview.innerHTML = '\\(' + formula.latex + '\\)';
        }

        card.appendChild(name);
        card.appendChild(preview);

        // אירוע לחיצה להוספת הנוסחה
        card.addEventListener('click', function() {
            var latexField = document.getElementById('latex-editor-field');
            var mathField = document.getElementById('math-editor-field');

            if (latexField) {
                latexField.value = formula.latex;

                // עדכון שדה MathLive
                if (mathField) {
                    try {
                        if (mathField.setValue) {
                            mathField.setValue(formula.latex);
                        } else if (mathField.mathfield && mathField.mathfield.setValue) {
                            mathField.mathfield.setValue(formula.latex);
                        }
                    } catch (e) {
                        console.error('Error updating math field:', e);
                    }
                }

                // עדכון התצוגה המקדימה
                updatePreview(formula.latex, document.getElementById('math-editor-preview'), getDisplayMode());

                // מעבר ללשונית העורך
                switchTab('visual');
            }
        });

        return card;
    }

    /**
     * מחזיר את מצב התצוגה הנוכחי (בלוק או אינליין)
     */
    function getDisplayMode() {
        var blockRadio = document.querySelector('input[name="display-mode"][value="block"]');
        return blockRadio ? blockRadio.checked : false;
    }

    /**
     * טיפול בגרירת העורך
     */
    function handleDrag(e) {
        if (!isDragging) return;

        var editorContainer = document.getElementById('math-floating-editor');
        if (!editorContainer) return;

        var deltaX = e.clientX - dragStartX;
        var deltaY = e.clientY - dragStartY;

        editorContainer.style.left = (editorX + deltaX) + 'px';
        editorContainer.style.top = (editorY + deltaY) + 'px';
    }

    /**
     * מיקום העורך במרכז המסך
     */
    function centerFloatingEditor(editorContainer) {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        var editorWidth = editorContainer.offsetWidth;
        var editorHeight = editorContainer.offsetHeight;

        // מיקום במרכז
        editorContainer.style.left = Math.max(0, (windowWidth - editorWidth) / 2) + 'px';
        editorContainer.style.top = Math.max(0, (windowHeight - editorHeight) / 3) + 'px';
    }

    /**
     * אתחול שדה המתמטיקה
     */
    function initMathField(mathField, latexField, preview, initialLatex) {
        if (!mathLiveLoaded || !mathField) return;

        try {
            // בדיקה אם זו גרסה חדשה של MathLive
            if (typeof mathField.setValue === 'function') {
                // גרסה חדשה
                if (initialLatex) {
                    mathField.setValue(initialLatex);
                }

                // עדכון שדה LaTeX כשהמתמטיקה משתנה
                mathField.addEventListener('input', function() {
                    latexField.value = mathField.value;
                    updatePreview(mathField.value, preview, getDisplayMode());
                });
            }
            else if (typeof MathLive.makeMathField === 'function') {
                // גרסה ישנה
                var mathFieldInstance = MathLive.makeMathField(mathField, {
                    virtualKeyboardMode: 'manual',
                    onContentDidChange: function() {
                        latexField.value = mathFieldInstance.getValue();
                        updatePreview(mathFieldInstance.getValue(), preview, getDisplayMode());
                    }
                });

                // הגדרת הערך ההתחלתי
                if (initialLatex) {
                    mathFieldInstance.setValue(initialLatex);
                }
            }
            else {
                console.error('MathLive API not found, falling back to simple editor');
                createTextInputFallback(mathField, latexField, preview, initialLatex);
            }

            // עדכון התצוגה המקדימה הראשונית
            updatePreview(initialLatex, preview, getDisplayMode());

            // אם יש שינוי במצב התצוגה, עדכן את התצוגה המקדימה
            var displayModeRadios = document.querySelectorAll('input[name="display-mode"]');
            for (var i = 0; i < displayModeRadios.length; i++) {
                displayModeRadios[i].addEventListener('change', function() {
                    updatePreview(latexField.value, preview, getDisplayMode());
                });
            }
        } catch (e) {
            console.error('Error initializing MathLive:', e);
            createTextInputFallback(mathField, latexField, preview, initialLatex);
        }
    }

    /**
     * החלפת לשונית פעילה
     */
    function switchTab(tabName) {
        var tabs = document.querySelectorAll('.math-editor-tab');
        var contents = document.querySelectorAll('.math-editor-tab-content');

        // הסרת הפעילות מכל הלשוניות והתכנים
        tabs.forEach(function(tab) {
            tab.classList.remove('active');
        });

        contents.forEach(function(content) {
            content.classList.remove('active');
        });

        // הפעלת הלשונית הנבחרת
        document.querySelector('.math-editor-tab[data-tab="' + tabName + '"]').classList.add('active');

        if (tabName === 'visual') {
            document.querySelector('.visual-editor').classList.add('active');
            // במעבר ללשונית הויזואלית, עדכן את שדה המתמטיקה מהקוד LaTeX
            var latexField = document.getElementById('latex-editor-field');
            var mathField = document.getElementById('math-editor-field');

            if (latexField && mathField) {
                try {
                    if (mathField.setValue) {
                        mathField.setValue(latexField.value);
                    } else if (mathField.mathfield && mathField.mathfield.setValue) {
                        mathField.mathfield.setValue(latexField.value);
                    }

                    setTimeout(function() {
                        mathField.focus();
                    }, 100);
                } catch (e) {
                    console.error('Error updating math field:', e);
                }
            }
        } else if (tabName === 'latex') {
            document.querySelector('.latex-editor').classList.add('active');
            // במעבר ללשונית ה-LaTeX, התמקד בשדה הטקסט
            var latexField = document.getElementById('latex-editor-field');
            if (latexField) {
                setTimeout(function() {
                    latexField.focus();
                }, 100);
            }
        } else if (tabName === 'library') {
            document.querySelector('.formula-library-tab').classList.add('active');
        }
    }

    /**
     * יצירת גיבוי של שדה טקסט רגיל
     */
    function createTextInputFallback(mathField, latexField, preview, initialValue) {
        // הסתרת שדה המתמטיקה
        if (mathField) {
            mathField.style.display = 'none';

            // יצירת שדה טקסט רגיל במקום שדה המתמטיקה
            var container = mathField.parentNode;
            var textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = initialValue || '';
            textInput.style.width = '100%';
            textInput.style.padding = '10px';
            textInput.style.fontSize = '16px';
            textInput.style.fontFamily = 'monospace';
            textInput.style.direction = 'ltr';
            container.appendChild(textInput);

            // עדכון שדה ה-LaTeX כששדה הטקסט משתנה
            textInput.addEventListener('input', function() {
                latexField.value = textInput.value;
                updatePreview(textInput.value, preview, getDisplayMode());
            });

            // עדכון התצוגה המקדימה
            updatePreview(initialValue, preview, getDisplayMode());

            // הוספת תמיכה במקש Enter
            textInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveFormula();
                }
            });
        }
    }

    /**
     * יצירת סרגל כלים לנוסחאות
     */
    function createMathToolbar() {
        var toolbar = document.createElement('div');
        toolbar.className = 'math-editor-toolbar';

        // קבוצת פעולות בסיסיות
        var basicGroup = createToolbarGroup([
            { label: 'x^2', tooltip: 'חזקה', action: function() { insertMathCommand('^{2}'); } },
            { label: '√', tooltip: 'שורש', action: function() { insertMathCommand('\\sqrt{}'); } },
            { label: 'frac', tooltip: 'שבר', action: function() { insertMathCommand('\\frac{}{}'); } },
            { label: 'x₂', tooltip: 'אינדקס תחתון', action: function() { insertMathCommand('_2'); } }
        ]);
        toolbar.appendChild(basicGroup);

        // קבוצת סמלים מתמטיים
        var symbolsGroup = createToolbarGroup([
            { label: 'π', tooltip: 'פאי', action: function() { insertMathCommand('\\pi'); } },
            { label: '∞', tooltip: 'אינסוף', action: function() { insertMathCommand('\\infty'); } },
            { label: '≠', tooltip: 'לא שווה', action: function() { insertMathCommand('\\ne'); } },
            { label: '≤', tooltip: 'קטן שווה', action: function() { insertMathCommand('\\le'); } },
            { label: '≥', tooltip: 'גדול שווה', action: function() { insertMathCommand('\\ge'); } }
        ]);
        toolbar.appendChild(symbolsGroup);

        // קבוצת פעולות מתקדמות
        var advancedGroup = createToolbarGroup([
            { label: '∫', tooltip: 'אינטגרל', action: function() { insertMathCommand('\\int'); } },
            { label: '∑', tooltip: 'סכום', action: function() { insertMathCommand('\\sum'); } },
            { label: '()', tooltip: 'סוגריים', action: function() { insertMathCommand('\\left(\\right)'); } },
            { label: '[]', tooltip: 'סוגריים מרובעים', action: function() { insertMathCommand('\\left[\\right]'); } }
        ]);
        toolbar.appendChild(advancedGroup);

        return toolbar;
    }

    /**
     * יצירת קבוצת כפתורים לסרגל הכלים
     */
    function createToolbarGroup(buttons) {
        var group = document.createElement('div');
        group.className = 'math-editor-toolbar-group';

        buttons.forEach(function(btn) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'math-editor-toolbar-btn';
            button.textContent = btn.label;
            button.title = btn.tooltip || '';
            button.onclick = btn.action;
            group.appendChild(button);
        });

        return group;
    }

    /**
     * הוספת פקודה בשדה העריכה
     */
    function insertMathCommand(command) {
        var mathField = document.getElementById('math-editor-field');
        if (!mathField) return;

        try {
            // בדיקת הגרסה וסוג האלמנט
            if (mathField.insert) {
                // גרסה חדשה עם תמיכה ב-insert
                mathField.insert(command);
                mathField.focus();
            } else if (mathField.mathfield && mathField.mathfield.insert) {
                // גרסה ישנה עם מצב mathfield
                mathField.mathfield.insert(command);
                mathField.mathfield.focus();
            } else {
                // מצב גיבוי - עדכון שדה הטקסט
                var textField = document.querySelector('#math-editor-field + input');
                if (textField) {
                    var start = textField.selectionStart;
                    var end = textField.selectionEnd;
                    var value = textField.value;
                    textField.value = value.substring(0, start) + command + value.substring(end);
                    textField.focus();
                    textField.selectionStart = textField.selectionEnd = start + command.length;
                } else {
                    // עדכון ישיר של שדה ה-LaTeX
                    var latexField = document.getElementById('latex-editor-field');
                    if (latexField) {
                        var lStart = latexField.selectionStart;
                        var lEnd = latexField.selectionEnd;
                        var lValue = latexField.value;
                        latexField.value = lValue.substring(0, lStart) + command + lValue.substring(lEnd);

                        // עדכון התצוגה המקדימה
                        updatePreview(latexField.value, document.getElementById('math-editor-preview'), getDisplayMode());

                        // מיקום הסמן
                        latexField.focus();
                        latexField.selectionStart = latexField.selectionEnd = lStart + command.length;
                    }
                }
            }
        } catch (error) {
            console.error('Error inserting math command:', error);
        }
    }

    /**
     * עדכון תצוגה מקדימה
     */
    function updatePreview(latex, previewElement, displayMode) {
        if (!previewElement) return;

        // הוספת סימון נכון של התוכן בהתאם למצב התצוגה
        if (latex) {
            previewElement.innerHTML = displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)';
        } else {
            previewElement.innerHTML = '';
        }

        // עדכון MathJax
        typesetMathJax(previewElement);
    }

    /**
     * ביצוע Typeset באמצעות MathJax
     */
    function typesetMathJax(element) {
        if (typeof MathJax !== 'undefined') {
            if (MathJax.typeset) {
                // MathJax v3
                MathJax.typeset([element]);
            } else if (MathJax.Hub && MathJax.Hub.Queue) {
                // MathJax v2
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, element]);
            } else if (MathJax.typesetPromise) {
                // MathJax v3 async API
                MathJax.typesetPromise([element]).catch(function(err) {
                    console.error('MathJax typeset error:', err);
                });
            }
        }
    }

    /**
     * דקודינג של קוד LaTeX
     */
    function decodeLatex(latex) {
        try {
            // בדיקה אם מקודד ב-URI
            if (latex && /(%[0-9A-F]{2})+/i.test(latex)) {
                return decodeURIComponent(latex);
            }

            // אחרת, השתמש ב-HTML entity decode
            var txt = document.createElement('textarea');
            txt.innerHTML = latex;
            return txt.value;
        } catch (e) {
            console.error('Error decoding LaTeX:', e);
            return latex; // החזר את הערך המקורי במקרה של שגיאה
        }
    }

    /**
     * אנקודינג של קוד LaTeX
     */
    function encodeLatex(latex) {
        // שימוש בקידוד HTML לשמירה על צורת ה-LaTeX ללא בעיות
        return latex.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
            return '&#' + i.charCodeAt(0) + ';';
        });
    }

    /**
     * שמירת הנוסחה הנוכחית לעורך
     */
    function saveFormula() {
        // קבלת הקוד LaTeX
        var latexField = document.getElementById('latex-editor-field');
        var latex = latexField ? latexField.value.trim() : '';

        if (latex) {
            // קבלת מצב התצוגה
            var displayMode = getDisplayMode();

            // אם מדובר בעריכת נוסחה קיימת
            if (currentMathElement) {
                updateFormula(currentMathElement, latex, displayMode);
            }
            // אם מדובר בהוספת נוסחה חדשה
            else {
                insertFormulaIntoEditor(latex, displayMode);
            }

            // שמירת נתוני ביטוי שהוספנו לאחרונה
            editor.focus();
            setTimeout(function() {
                // מחפש את הנוסחה האחרונה שהוספנו לפי ה-data-latex
                var allMathElements = editor.getBody().querySelectorAll('.algebra-tutor-math');
                for (var i = 0; i < allMathElements.length; i++) {
                    if (allMathElements[i].getAttribute('data-latex') === encodeLatex(latex)) {
                        lastInsertedFormula = allMathElements[i];
                        break;
                    }
                }
            }, 100);

            // החזרת המיקוד לשדה העריכה
            var mathField = document.getElementById('math-editor-field');
            if (mathField) {
                // איפוס השדה אם זו נוסחה חדשה
                if (!currentMathElement) {
                    if (mathField.setValue) {
                        mathField.setValue('');
                    } else if (mathField.mathfield && mathField.mathfield.setValue) {
                        mathField.mathfield.setValue('');
                    }

                    // איפוס שדה ה-LaTeX
                    if (latexField) {
                        latexField.value = '';
                    }

                    // איפוס התצוגה המקדימה
                    var preview = document.getElementById('math-editor-preview');
                    if (preview) {
                        preview.innerHTML = '';
                    }
                }

                // החזרת המיקוד לשדה העריכה
                setTimeout(function() {
                    if (mathField.focus) {
                        mathField.focus();
                    }
                }, 100);
            }
        }
    }

    /**
     * סגירת עורך נוסחאות
     */
    function closeMathEditor(save) {
        if (save) {
            // שמירת הנוסחה
            saveFormula();
        }

        // הסרת מאזיני הגרירה
        document.removeEventListener('mousemove', handleDrag);

        // הסרת העורך
        removeMathEditor();

        // איפוס המצב הנוכחי
        currentMathElement = null;

        // החזרת המיקוד לעורך
        editor.focus();

        // מיקום הסמן אחרי הנוסחה האחרונה שהוספה
        if (lastInsertedFormula) {
            placeCursorAfterNode(lastInsertedFormula);
            lastInsertedFormula = null;
        }
    }

    /**
     * הסרת העורך וחלקיו מה-DOM
     */
    function removeMathEditor() {
        // הסרת הרקע
        var backdrop = document.getElementById('math-floating-backdrop');
        if (backdrop) {
            document.body.removeChild(backdrop);
        }

        // הסרת חלון העורך
        var editorContainer = document.getElementById('math-floating-editor');
        if (editorContainer) {
            document.body.removeChild(editorContainer);
        }
    }

    /**
     * עדכון נוסחה קיימת
     */
    function updateFormula(element, latex, displayMode) {
        // בדיקה אם יש שינוי במצב התצוגה
        var wasBlock = element.classList.contains('math-block');

        // חשוב: שומר את הסימונים של MathJax בתוך תוכן האלמנט!
        var formula = displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)';

        // עדכון מאפייני הנתונים והתוכן
        element.setAttribute('data-latex', encodeLatex(latex));
        element.innerHTML = formula;

        // עדכון מצב התצוגה בהתאם
        if (wasBlock !== displayMode) {
            if (displayMode) {
                element.classList.remove('math-inline');
                element.classList.add('math-block');
            } else {
                element.classList.remove('math-block');
                element.classList.add('math-inline');
            }
        }

        // עדכון MathJax
        typesetMathJax(element);

        // סימון שינוי בעורך
        editor.undoManager.add();
    }

    /**
     * הוספת נוסחה למסמך
     */
    function insertFormulaIntoEditor(latex, displayMode) {
        // יצירת HTML בהתאם למצב התצוגה
        var className = displayMode ? 'algebra-tutor-math math-block' : 'algebra-tutor-math math-inline';

        // חשוב: שומר את הסימונים של MathJax בתוך תוכן האלמנט!
        var formula = displayMode ? '\\[' + latex + '\\]' : '\\(' + latex + '\\)';

        var html = '<span class="' + className + '" data-latex="' + encodeLatex(latex) + '">' + formula + '</span>';

        // הוספת רווח אם הנוסחה בתוך השורה
        if (!displayMode) {
            html += '&nbsp;';
        }

        editor.insertContent(html);

        // עדכון MathJax
        setTimeout(function() {
            typesetMathJax(editor.getBody());
        }, 100);
    }

    /**
     * מחיקת נוסחה מהמסמך
     */
    function deleteFormula(element) {
        if (!element) return;

        // מחיקת האלמנט מהתוכן
        element.parentNode.removeChild(element);

        // סימון שינוי בעורך
        editor.undoManager.add();
    }

    /**
     * מיקום הסמן אחרי נוסחה
     */
    function placeCursorAfterNode(node) {
        if (!node) return;

        // מיקום הסמן אחרי הנוסחה
        var range = editor.dom.createRng();
        range.setStartAfter(node);
        range.setEndAfter(node);

        // הפעלת הסמן במיקום זה
        editor.selection.setRng(range);
    }

    return {
        // ממשק ציבורי למקרה שנרצה לשלוף מידע או להפעיל פונקציות מבחוץ
        openEditor: openMathEditor,
        saveFormula: saveFormula,
        insertCommand: insertMathCommand,
        deleteFormula: deleteFormula
    };
});