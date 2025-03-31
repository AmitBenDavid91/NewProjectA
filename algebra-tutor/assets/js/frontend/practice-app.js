/**
 * Algebra Tutor - Practice App
 *
 * Vanilla JavaScript implementation for the practice interface
 * with MathJax integration for math formula display
 */

jQuery(document).ready(function($) {
    'use strict';

    // Main app container
    var $container = $('#algebra-tutor-practice-root');
    if (!$container.length) return;

    // Remove loading message
    $container.find('.loading-message').remove();

    // Get data from global object
    var appData = window.algebraTutorData || {};
    var questions = appData.questions || [];
    var nonce = appData.nonce || '';
    var ajaxUrl = appData.ajaxUrl || '';

    // Get internationalization strings
    var i18n = appData.i18n || {
        submit: "Submit Answer",
        submitted: "Answer Submitted",
        correct: "Correct!",
        incorrect: "Incorrect, try again",
        showAnswer: "Incorrect. The correct answer is: ",
        finish: "I'm Done",
        loading: "Loading...",
        noQuestions: "No practice questions found."
    };

    // User results
    var userResults = [];

    // Initialize the app
    initApp();

    /**
     * Initialize the practice application
     */
    function initApp() {
        renderPracticePage();
        typesetMath();
    }

    /**
     * Render the main practice page
     */
    function renderPracticePage() {
        if (questions.length === 0) {
            $container.html('<p class="no-questions">' + i18n.noQuestions + '</p>');
            return;
        }

        // Create container for questions
        var $practiceContainer = $('<div class="practice-container"></div>');

        // Add each question card with its index (for numbering)
        questions.forEach(function(question, index) {
            var $questionCard = createQuestionCard(question, index);
            $practiceContainer.append($questionCard);
        });

        // Add finish button
        var $finishButton = $('<button class="submit-btn">' + i18n.finish + '</button>');
        $finishButton.on('click', handleFinish);
        $practiceContainer.append($finishButton);

        // Add to the DOM
        $container.html($practiceContainer);
    }

    /**
     * Create a question card with the appropriate type
     */
    function createQuestionCard(question, index) {
        var id = question.id;
        var questionText = fixLatexEncoding(question.question || "");
        var questionType = question.question_type || (questionText.includes("__") ? "fill" : "multiple");

        // Create the card element
        var $card = $('<div class="question-card" data-id="' + id + '" data-type="' + questionType + '"></div>');

        // Add question number
        var $questionNumber = $('<div class="question-number">Question ' + (index + 1) + '</div>');
        $card.append($questionNumber);

        // Create question content
        var $questionText = $('<div class="question-text"></div>');

        if (questionType === "fill" || questionText.includes("__")) {
            // For fill-in-the-blank questions
            $questionText.append(createFillQuestion(questionText, id));
        } else {
            // For multiple choice questions
            $questionText.html(questionText);
            $questionText.append(createMultipleChoiceOptions(question, id));
        }

        // Create submission button
        var $submitButton = $('<button class="submit-btn">' + i18n.submit + '</button>');
        $submitButton.on('click', function() {
            handleSubmit(id);
        });

        // Create feedback area
        var $feedback = $('<div class="feedback" style="display:none;"></div>');

        // Add elements to the card
        $card.append($questionText);
        $card.append($submitButton);
        $card.append($feedback);

        // Store status in data attribute
        $card.data('attempts', 0);
        $card.data('submitted', false);

        return $card;
    }

    /**
     * Create a fill-in-the-blank question
     */
    function createFillQuestion(text, questionId) {
        var parts = text.split(/_{2,}/);
        var $container = $('<div class="fill-question"></div>');

        // Parse through the text parts and add inputs between them
        parts.forEach(function(part, i) {
            // Add the text part
            var $textPart = $('<span class="question-part"></span>');
            $textPart.html(part);
            $container.append($textPart);

            // Add an input field if this isn't the last part
            if (i < parts.length - 1) {
                var $input = $('<input type="text" class="fill-blank" placeholder="..." ' +
                    'data-question-id="' + questionId + '" ' +
                    'data-blank-index="' + i + '">');
                $container.append($input);
            }
        });

        return $container;
    }

    /**
     * Create multiple choice options
     */
    function createMultipleChoiceOptions(question, questionId) {
        var $container = $('<div class="answer-options"></div>');
        var choices = question.choices;

        // Parse choices if necessary
        var choicesArray = [];
        if (typeof choices === 'string') {
            try {
                choicesArray = JSON.parse(choices);
            } catch(e) {
                // If JSON parsing fails, try to split by comma
                choicesArray = choices.split(',');
            }
        } else if (Array.isArray(choices)) {
            choicesArray = choices;
        }

        // Add each option
        choicesArray.forEach(function(option, index) {
            var $option = $('<div class="answer-option"></div>');
            var $label = $('<label></label>');
            var $input = $('<input type="radio" name="question_' + questionId + '" value="' + (index + 1) + '">')
            var $text = $('<span></span>').html(fixLatexEncoding(option));

            $label.append($input);
            $label.append($text);
            $option.append($label);
            $container.append($option);
        });

        return $container;
    }

    /**
     * Handle question submission
     */
    function handleSubmit(questionId) {
        var $card = $('.question-card[data-id="' + questionId + '"]');

        // Check if already submitted
        if ($card.data('submitted')) {
            return;
        }

        // Get question type
        var questionType = $card.data('type');

        // Increment attempts
        var attempts = $card.data('attempts') || 0;
        attempts++;
        $card.data('attempts', attempts);

        // Get the user's answer
        var userAnswer = questionType === 'fill'
            ? getFillAnswers(questionId)
            : getSelectedOption(questionId);

        // Check answer
        var question = findQuestionById(questionId);
        var isCorrect = checkAnswer(questionId, userAnswer, question);

        // Show feedback
        showFeedback($card, isCorrect, question, attempts);

        // Save result
        saveResult(questionId, userAnswer, isCorrect);
    }

    /**
     * Get the selected option from a multiple choice question
     */
    function getSelectedOption(questionId) {
        return $('input[name="question_' + questionId + '"]:checked').val() || "";
    }

    /**
     * Get the answers from a fill-in-the-blank question
     */
    function getFillAnswers(questionId) {
        var answers = [];

        $('.fill-blank[data-question-id="' + questionId + '"]').each(function() {
            var index = parseInt($(this).data('blank-index'), 10);
            answers[index] = $(this).val() || "";
        });

        return answers;
    }

    /**
     * Find a question by its ID
     */
    function findQuestionById(id) {
        return questions.find(function(q) {
            return parseInt(q.id, 10) === parseInt(id, 10);
        });
    }

    /**
     * Check if an answer is correct
     */
    function checkAnswer(questionId, userAnswer, question) {
        if (!question) return false;

        var questionType = question.question_type ||
            (question.question && question.question.includes("__") ? "fill" : "multiple");

        var correctAnswer = question.correct_answer || "";

        if (questionType === "fill" || (question.question && question.question.includes("__"))) {
            // For fill-in-the-blank questions
            var correctAnswerArray = [];

            try {
                correctAnswerArray = typeof correctAnswer === 'string'
                    ? JSON.parse(correctAnswer)
                    : correctAnswer;
            } catch(e) {
                correctAnswerArray = correctAnswer.split(',');
            }

            // Normalize answers for comparison
            var normalizedUser = userAnswer.map(function(ans) {
                return ans.trim().toLowerCase();
            });

            var normalizedCorrect = correctAnswerArray.map(function(ans) {
                return typeof ans === 'string' ? ans.trim().toLowerCase() : String(ans).toLowerCase();
            });

            // Check if arrays match
            return normalizedUser.length === normalizedCorrect.length &&
                normalizedUser.every(function(answer, index) {
                    return answer === normalizedCorrect[index];
                });
        } else {
            // For multiple choice questions
            var normalizedUser = userAnswer ? userAnswer.trim() : "";
            var normalizedCorrect = correctAnswer ? correctAnswer.trim() : "";
            return normalizedUser === normalizedCorrect;
        }
    }

    /**
     * Show feedback message
     */
    function showFeedback($card, isCorrect, question, attempts) {
        var $feedback = $card.find('.feedback');
        var $button = $card.find('.submit-btn');

        $feedback.removeClass('correct incorrect');

        if (isCorrect) {
            // Correct answer
            $feedback.html(i18n.correct);
            $feedback.addClass('correct');
            $button.text(i18n.submitted);
            $card.data('submitted', true);

            // Disable inputs
            $card.find('input').prop('disabled', true);
            $button.prop('disabled', true);
        } else {
            // Incorrect answer
            if (attempts >= 2) {
                // Show correct answer after two attempts
                var correctAnswer = "";

                if (question.question_type === "fill" || (question.question && question.question.includes("__"))) {
                    try {
                        correctAnswer = typeof question.correct_answer === 'string'
                            ? JSON.parse(question.correct_answer).join(", ")
                            : question.correct_answer.join(", ");
                    } catch(e) {
                        correctAnswer = question.correct_answer;
                    }
                } else {
                    // For multiple choice, we need to show the text of the correct option
                    var choicesArray = [];
                    try {
                        choicesArray = typeof question.choices === 'string'
                            ? JSON.parse(question.choices)
                            : question.choices;
                    } catch(e) {
                        choicesArray = question.choices.split(',');
                    }

                    // The correct_answer for multiple choice is the 1-based index
                    var correctIndex = parseInt(question.correct_answer, 10) - 1;
                    if (correctIndex >= 0 && correctIndex < choicesArray.length) {
                        correctAnswer = choicesArray[correctIndex];
                    } else {
                        correctAnswer = question.correct_answer;
                    }
                }

                $feedback.html(i18n.showAnswer + correctAnswer);
                $feedback.addClass('incorrect');
                $button.text(i18n.submitted);
                $card.data('submitted', true);

                // Disable inputs
                $card.find('input').prop('disabled', true);
                $button.prop('disabled', true);
            } else {
                // First attempt, allow retry
                $feedback.html(i18n.incorrect);
                $feedback.addClass('incorrect');
            }
        }

        $feedback.show();
    }

    /**
     * Save a result
     */
    function saveResult(questionId, answer, isCorrect) {
        // Add to local results
        var result = {
            questionId: questionId,
            answer: answer,
            isCorrect: isCorrect,
            timestamp: new Date().toISOString()
        };

        // Update or add the result
        var existingIndex = userResults.findIndex(function(r) {
            return r.questionId === questionId;
        });

        if (existingIndex >= 0) {
            userResults[existingIndex] = result;
        } else {
            userResults.push(result);
        }

        // Save to server if AJAX URL is available
        if (ajaxUrl && nonce) {
            var data = {
                action: 'algebra_tutor_handle_ajax',
                nonce: nonce,
                action_type: 'submit_practice_answers',
                question_id: questionId,
                answer: JSON.stringify(answer),
                is_correct: isCorrect ? '1' : '0'
            };

            $.post(ajaxUrl, data).fail(function(error) {
                console.error('Error saving answer:', error);
            });
        }
    }

    /**
     * Handle finish button click
     */
    function handleFinish() {
        var totalQuestions = questions.length;
        var answeredQuestions = userResults.length;
        var correctAnswers = userResults.filter(function(r) {
            return r.isCorrect;
        }).length;

        // Calculate percentage
        var percentage = Math.round((correctAnswers / totalQuestions) * 100);

        // Create message
        var message = 'You\'ve completed the practice!\n\n' +
            'Questions answered: ' + answeredQuestions + ' out of ' + totalQuestions + '\n' +
            'Correct answers: ' + correctAnswers + ' (' + percentage + '%)\n\n';

        // Ask for confirmation if not all questions answered
        if (answeredQuestions < totalQuestions) {
            message += "Note that you haven't answered all questions. Are you sure you want to finish?";
            if (!confirm(message)) {
                return;
            }
        } else {
            alert(message);
        }

        // Submit final results to server
        if (ajaxUrl && nonce && userResults.length > 0) {
            var data = {
                action: 'algebra_tutor_handle_ajax',
                nonce: nonce,
                action_type: 'finish_practice',
                results: JSON.stringify(userResults)
            };

            $.post(ajaxUrl, data).fail(function(error) {
                console.error('Error submitting results:', error);
            });
        }
    }

    /**
     * Helper function to fix LaTeX encoding issues
     */
    function fixLatexEncoding(text) {
        if (!text) return text;
        // Fix ampersands and other special characters
        return text.replace(/&amp;/g, '&').replace(/amp;/g, '&');
    }

    /**
     * Typeset math using MathJax
     */
    function typesetMath() {
        if (typeof MathJax !== 'undefined') {
            setTimeout(function() {
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([$container[0]])
                        .catch(function(err) {
                            console.error('MathJax typeset error:', err);
                        });
                } else if (MathJax.typeset) {
                    MathJax.typeset([$container[0]]);
                } else if (MathJax.Hub && MathJax.Hub.Queue) {
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, $container[0]]);
                }
            }, 200);
        }
    }
});