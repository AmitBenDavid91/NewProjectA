/**
 * Enhanced Dashboard Interface
 * Uses Chart.js for improved data visualization
 */
(function($) {
    'use strict';

    const AlgebraTutorDashboard = {
        // Charts instances
        charts: {},
        
        // Dashboard state
        state: {
            dateRange: '7days',
            isLoading: false,
            categoryData: [],
            activityData: [],
            difficultyData: [],
            filterCategory: '',
            filterDifficulty: ''
        },
        
        // Initialize the dashboard
        init: function() {
            this.cacheElements();
            this.bindEvents();
            this.initCharts();
            this.setupWidgetSorting();
            this.initDateRangePicker();
        },
        
        // Cache DOM elements
        cacheElements: function() {
            this.$dashboard = $('.algebra-tutor-admin');
            this.$refreshBtn = $('#refresh-dashboard');
            this.$dateRangePicker = $('.dashboard-date-picker');
            this.$quickFilters = $('.quick-date-filter');
            this.$filterForm = $('#date-filter-form');
            this.$dashboardCards = $('.dashboard-card');
            this.$dashboardWidgets = $('.dashboard-widgets');
            this.$categoryFilter = $('#filter-category');
            this.$difficultyFilter = $('#filter-difficulty');
        },
        
        // Bind event listeners
        bindEvents: function() {
            const self = this;
            
            // Refresh dashboard
            this.$refreshBtn.on('click', function(e) {
                e.preventDefault();
                self.refreshDashboard();
            });
            
            // Quick date filters
            this.$quickFilters.on('click', function(e) {
                e.preventDefault();
                self.setDateRange($(this).data('period'));
            });
            
            // Date range picker events
            this.$dateRangePicker.on('change', function() {
                self.state.dateRange = 'custom';
            });
            
            // Filter form submit
            this.$filterForm.on('submit', function(e) {
                self.state.isLoading = true;
                // Continue with form submission
            });
            
            // Category filter
            this.$categoryFilter.on('change', function() {
                self.state.filterCategory = $(this).val();
                self.filterChartData();
            });
            
            // Difficulty filter
            this.$difficultyFilter.on('change', function() {
                self.state.filterDifficulty = $(this).val();
                self.filterChartData();
            });
            
            // Window resize
            $(window).on('resize', $.throttle(250, function() {
                self.resizeCharts();
            }));
            
            // Widget toggle (minimize/expand)
            this.$dashboard.on('click', '.widget-toggle', function() {
                const $card = $(this).closest('.dashboard-card');
                $card.toggleClass('minimized');
                
                if (!$card.hasClass('minimized')) {
                    // Resize chart when maximizing
                    const widgetId = $card.data('widget-id');
                    if (self.charts[widgetId]) {
                        self.charts[widgetId].resize();
                    }
                }
                
                // Save state to user preferences
                self.saveWidgetState($card.data('widget-id'), $card.hasClass('minimized') ? 'minimized' : 'expanded');
            });
        },
        
        // Initialize charts
        initCharts: function() {
            this.initActivityChart();
            this.initCategoryChart();
            this.initDifficultyChart();
            this.initStudentProgressChart();
        },
        
        // Initialize activity chart
        initActivityChart: function() {
            const ctx = document.getElementById('activity-chart');
            if (!ctx) return;
            
            this.charts.activity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: algebraTutorDashboard.activityDates || [],
                    datasets: [{
                        label: algebraTutorDashboard.i18n.attempts || 'Attempts',
                        data: algebraTutorDashboard.activityCounts || [],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            callbacks: {
                                title: function(tooltipItems) {
                                    return tooltipItems[0].label;
                                }
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            },
                            title: {
                                display: true,
                                text: algebraTutorDashboard.i18n.attempts || 'Attempts',
                                font: {
                                    size: 12,
                                    weight: 'normal'
                                },
                                padding: {top: 10, bottom: 0}
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: algebraTutorDashboard.i18n.date || 'Date',
                                font: {
                                    size: 12,
                                    weight: 'normal'
                                },
                                padding: {top: 10, bottom: 0}
                            }
                        }
                    }
                }
            });
        },
        
        // Initialize category performance chart
        initCategoryChart: function() {
            const ctx = document.getElementById('category-performance-chart');
            if (!ctx) return;
            
            this.charts.category = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: algebraTutorDashboard.categoryNames || [],
                    datasets: [{
                        label: algebraTutorDashboard.i18n.successRate || 'Success Rate (%)',
                        data: algebraTutorDashboard.categorySuccessRates || [],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        order: 2
                    }, {
                        label: algebraTutorDashboard.i18n.attempts || 'Attempts',
                        data: algebraTutorDashboard.categoryAttempts || [],
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        type: 'line',
                        yAxisID: 'attempts-y-axis',
                        order: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                title: function(tooltipItems) {
                                    return tooltipItems[0].label;
                                }
                            }
                        },
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: algebraTutorDashboard.i18n.successRate || 'Success Rate (%)',
                                font: {
                                    size: 12,
                                    weight: 'normal'
                                }
                            }
                        },
                        'attempts-y-axis': {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false
                            },
                            title: {
                                display: true,
                                text: algebraTutorDashboard.i18n.attempts || 'Attempts',
                                font: {
                                    size: 12,
                                    weight: 'normal'
                                }
                            },
                            ticks: {
                                precision: 0
                            }
                        },
                        x: {
                            ticks: {
                                callback: function(value) {
                                    const label = this.getLabelForValue(value);
                                    // Truncate long labels
                                    if (label.length > 10) {
                                        return label.substr(0, 10) + '...';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        // Initialize difficulty distribution chart
        initDifficultyChart: function() {
            const ctx = document.getElementById('difficulty-chart');
            if (!ctx) return;
            
            // Use preset colors for difficulty levels
            const difficultyColors = {
                easy: {
                    background: 'rgba(75, 192, 192, 0.7)',
                    border: 'rgba(75, 192, 192, 1)'
                },
                medium: {
                    background: 'rgba(255, 159, 64, 0.7)',
                    border: 'rgba(255, 159, 64, 1)'
                },
                hard: {
                    background: 'rgba(255, 99, 132, 0.7)',
                    border: 'rgba(255, 99, 132, 1)'
                }
            };
            
            // Extract data from global variable
            const difficulties = algebraTutorDashboard.difficultyLabels || ['Easy', 'Medium', 'Hard'];
            const counts = algebraTutorDashboard.difficultyCounts || [0, 0, 0];
            
            // Map difficulties to colors
            const backgroundColors = difficulties.map(d => {
                const key = d.toLowerCase();
                return difficultyColors[key] ? difficultyColors[key].background : 'rgba(100, 100, 100, 0.7)';
            });
            
            const borderColors = difficulties.map(d => {
                const key = d.toLowerCase();
                return difficultyColors[key] ? difficultyColors[key].border : 'rgba(100, 100, 100, 1)';
            });
            
            this.charts.difficulty = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: difficulties,
                    datasets: [{
                        data: counts,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        },
        
        // Initialize student progress chart
        initStudentProgressChart: function() {
            const ctx = document.getElementById('student-progress-chart');
            if (!ctx) return;
            
            // Check if we have the data
            if (!algebraTutorDashboard.studentProgressLabels || !algebraTutorDashboard.studentProgressData) {
                return;
            }
            
            // Extract data
            const labels = algebraTutorDashboard.studentProgressLabels;
            const datasets = algebraTutorDashboard.studentProgressData.map((student, index) => {
                // Colorize each student dataset differently
                const colors = [
                    { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
                    { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
                    { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
                    { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
                    { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' }
                ];
                
                const colorIndex = index % colors.length;
                
                return {
                    label: student.name,
                    data: student.scores,
                    backgroundColor: colors[colorIndex].bg,
                    borderColor: colors[colorIndex].border,
                    borderWidth: 2,
                    fill: true,
                    pointBackgroundColor: colors[colorIndex].border,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors[colorIndex].border,
                    pointRadius: 4,
                    pointHoverRadius: 5
                };
            });
            
            this.charts.studentProgress = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}%`;
                                }
                            }
                        },
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    }
                }
            });
        },
        
        // Set up widget sorting functionality
        setupWidgetSorting: function() {
            const self = this;
            
            if ($.fn.sortable) {
                this.$dashboardWidgets.sortable({
                    items: '.dashboard-card',
                    handle: '.card-header',
                    placeholder: 'dashboard-card-placeholder',
                    forcePlaceholderSize: true,
                    opacity: 0.7,
                    start: function(event, ui) {
                        // Add a height to the placeholder
                        $('.dashboard-card-placeholder').height(ui.item.height());
                    },
                    stop: function() {
                        // Redraw charts after sorting
                        self.resizeCharts();
                    },
                    update: function() {
                        self.saveWidgetOrder();
                    }
                });
            }
        },
        
        // Initialize date range picker
        initDateRangePicker: function() {
            if ($.fn.daterangepicker) {
                $('.dashboard-daterange-picker').daterangepicker({
                    opens: 'left',
                    autoUpdateInput: false,
                    locale: {
                        cancelLabel: 'Clear',
                        applyLabel: 'Apply',
                        format: 'YYYY-MM-DD'
                    },
                    ranges: {
                        'Today': [moment(), moment()],
                        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                        'This Month': [moment().startOf('month'), moment().endOf('month')],
                        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                    }
                });
                
                $('.dashboard-daterange-picker').on('apply.daterangepicker', function(ev, picker) {
                    $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
                    $('#date_from').val(picker.startDate.format('YYYY-MM-DD'));
                    $('#date_to').val(picker.endDate.format('YYYY-MM-DD'));
                    
                    // Automatically submit the form
                    $('#date-filter-form').submit();
                });
                
                $('.dashboard-daterange-picker').on('cancel.daterangepicker', function() {
                    $(this).val('');
                    $('#date_from').val('');
                    $('#date_to').val('');
                });
            }
        },
        
        // Set date range
        setDateRange: function(period) {
            this.state.dateRange = period;
            
            // Calculate the date range based on the period
            let startDate = moment();
            let endDate = moment();
            
            switch (period) {
                case '7days':
                    startDate = moment().subtract(6, 'days');
                    break;
                case '30days':
                    startDate = moment().subtract(29, 'days');
                    break;
                case 'month':
                    startDate = moment().startOf('month');
                    endDate = moment().endOf('month');
                    break;
                case 'quarter':
                    startDate = moment().startOf('quarter');
                    endDate = moment().endOf('quarter');
                    break;
                case 'year':
                    startDate = moment().startOf('year');
                    endDate = moment().endOf('year');
                    break;
            }
            
            // Set the form values
            $('#date_from').val(startDate.format('YYYY-MM-DD'));
            $('#date_to').val(endDate.format('YYYY-MM-DD'));
            
            // Update the daterange picker if it exists
            if ($('.dashboard-daterange-picker').length) {
                $('.dashboard-daterange-picker').val(startDate.format('YYYY-MM-DD') + ' - ' + endDate.format('YYYY-MM-DD'));
            }
            
            // Submit the form
            $('#date-filter-form').submit();
        },
        
        // Refresh dashboard
        refreshDashboard: function() {
            this.state.isLoading = true;
            this.$refreshBtn.addClass('is-busy').prop('disabled', true);
            
            // Use AJAX to get fresh data
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_refresh_dashboard',
                    nonce: algebraTutorDashboard.nonce || '',
                    date_from: $('#date_from').val(),
                    date_to: $('#date_to').val(),
                    category: this.state.filterCategory,
                    difficulty: this.state.filterDifficulty
                },
                success: (response) => {
                    if (response.success) {
                        this.updateDashboardData(response.data);
                        this.showNotice(
                            algebraTutorDashboard.i18n.dashboardRefreshed || 'Dashboard refreshed successfully!',
                            'success'
                        );
                    } else {
                        this.showNotice(
                            response.data.message || algebraTutorDashboard.i18n.refreshError || 'Error refreshing dashboard.',
                            'error'
                        );
                    }
                    
                    this.state.isLoading = false;
                    this.$refreshBtn.removeClass('is-busy').prop('disabled', false);
                },
                error: () => {
                    this.showNotice(
                        algebraTutorDashboard.i18n.serverError || 'Server communication error',
                        'error'
                    );
                    
                    this.state.isLoading = false;
                    this.$refreshBtn.removeClass('is-busy').prop('disabled', false);
                }
            });
        },
        
        // Update dashboard with new data
        updateDashboardData: function(data) {
            // Update the global data object
            Object.assign(algebraTutorDashboard, data);
            
            // Update stats boxes with animation
            if (data.stats) {
                Object.keys(data.stats).forEach(key => {
                    const $stat = $(`#stat-${key}`);
                    if ($stat.length) {
                        const oldValue = parseFloat($stat.text().replace(/,/g, ''));
                        const newValue = parseFloat(data.stats[key].toString().replace(/,/g, ''));
                        
                        // Animate the number change
                        this.animateNumberChange($stat, oldValue, newValue);
                    }
                });
            }
            
            // Update charts
            this.updateCharts(data);
            
            // Update tables
            this.updateTables(data);
        },
        
        // Update chart data
        updateCharts: function(data) {
            // Update activity chart
            if (this.charts.activity && data.activityDates && data.activityCounts) {
                this.charts.activity.data.labels = data.activityDates;
                this.charts.activity.data.datasets[0].data = data.activityCounts;
                this.charts.activity.update();
            }
            
            // Update category chart
            if (this.charts.category && data.categoryNames && data.categorySuccessRates && data.categoryAttempts) {
                this.charts.category.data.labels = data.categoryNames;
                this.charts.category.data.datasets[0].data = data.categorySuccessRates;
                this.charts.category.data.datasets[1].data = data.categoryAttempts;
                this.charts.category.update();
            }
            
            // Update difficulty chart
            if (this.charts.difficulty && data.difficultyLabels && data.difficultyCounts) {
                this.charts.difficulty.data.labels = data.difficultyLabels;
                this.charts.difficulty.data.datasets[0].data = data.difficultyCounts;
                this.charts.difficulty.update();
            }
            
            // Update student progress chart
            if (this.charts.studentProgress && data.studentProgressLabels && data.studentProgressData) {
                this.charts.studentProgress.data.labels = data.studentProgressLabels;
                
                // Replace datasets
                this.charts.studentProgress.data.datasets = data.studentProgressData.map((student, index) => {
                    const colors = [
                        { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
                        { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
                        { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
                        { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
                        { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' }
                    ];
                    
                    const colorIndex = index % colors.length;
                    
                    return {
                        label: student.name,
                        data: student.scores,
                        backgroundColor: colors[colorIndex].bg,
                        borderColor: colors[colorIndex].border,
                        borderWidth: 2,
                        fill: true
                    };
                });
                
                this.charts.studentProgress.update();
            }
        },
        
        // Update table data
        updateTables: function(data) {
            // Update popular questions table
            if (data.popularQuestions) {
                const $tableBody = $('#popular-questions-table tbody');
                if ($tableBody.length) {
                    $tableBody.empty();
                    
                    if (data.popularQuestions.length) {
                        data.popularQuestions.forEach(question => {
                            const successRate = parseFloat(question.success_rate).toFixed(1);
                            const indicatorClass = successRate >= 70 ? 'high' : (successRate >= 40 ? 'medium' : 'low');
                            
                            const $row = $(`
                                <tr>
                                    <td>
                                        ${this.truncateText(question.question, 50)}
                                        <div class="row-actions">
                                            <span class="edit">
                                                <a href="admin.php?page=algebra-tutor-question-bank&edit=${question.id}">
                                                    ${algebraTutorDashboard.i18n.edit || 'Edit'}
                                                </a>
                                            </span>
                                            <span class="view">
                                                | <a href="#" class="preview-question" data-question-id="${question.id}">
                                                    ${algebraTutorDashboard.i18n.preview || 'Preview'}
                                                </a>
                                            </span>
                                        </div>
                                    </td>
                                    <td>${question.category}</td>
                                    <td>${question.attempts}</td>
                                    <td>
                                        ${successRate}%
                                        <span class="success-indicator ${indicatorClass}"></span>
                                    </td>
                                </tr>
                            `);
                            
                            $tableBody.append($row);
                        });
                    } else {
                        $tableBody.html(`<tr><td colspan="4">${algebraTutorDashboard.i18n.noData || 'No data available'}</td></tr>`);
                    }
                }
            }
            
            // Update top students table
            if (data.topStudents) {
                const $tableBody = $('#top-students-table tbody');
                if ($tableBody.length) {
                    $tableBody.empty();
                    
                    if (data.topStudents.length) {
                        data.topStudents.forEach(student => {
                            const successRate = parseFloat(student.success_rate).toFixed(1);
                            const indicatorClass = successRate >= 70 ? 'high' : (successRate >= 40 ? 'medium' : 'low');
                            
                            const $row = $(`
                                <tr>
                                    <td>${student.name || 'Guest User'}</td>
                                    <td>${student.attempts}</td>
                                    <td>${student.correct}</td>
                                    <td>
                                        ${successRate}%
                                        <span class="success-indicator ${indicatorClass}"></span>
                                    </td>
                                </tr>
                            `);
                            
                            $tableBody.append($row);
                        });
                    } else {
                        $tableBody.html(`<tr><td colspan="4">${algebraTutorDashboard.i18n.noData || 'No data available'}</td></tr>`);
                    }
                }
            }
            
            // Update recent activity
            if (data.recentActivity) {
                const $tableBody = $('#recent-activity-table tbody');
                if ($tableBody.length) {
                    $tableBody.empty();
                    
                    if (data.recentActivity.length) {
                        data.recentActivity.forEach(activity => {
                            const $row = $(`
                                <tr>
                                    <td>${activity.time}</td>
                                    <td>${activity.user}</td>
                                    <td>
                                        ${this.truncateText(activity.question, 30)}
                                        <div class="row-actions">
                                            <span class="edit">
                                                <a href="admin.php?page=algebra-tutor-question-bank&edit=${activity.question_id}">
                                                    ${algebraTutorDashboard.i18n.edit || 'Edit'}
                                                </a>
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="status-${activity.is_correct ? 'correct' : 'incorrect'}">
                                            ${activity.is_correct ? 
                                                (algebraTutorDashboard.i18n.correct || 'Correct') : 
                                                (algebraTutorDashboard.i18n.incorrect || 'Incorrect')}
                                        </span>
                                    </td>
                                </tr>
                            `);
                            
                            $tableBody.append($row);
                        });
                    } else {
                        $tableBody.html(`<tr><td colspan="4">${algebraTutorDashboard.i18n.noActivity || 'No recent activity'}</td></tr>`);
                    }
                }
            }
        },
        
        // Filter chart data based on selection
        filterChartData: function() {
            // Toggle loading state
            this.state.isLoading = true;
            $('.dashboard-loader').fadeIn(200);
            
            // Get filter values
            const category = this.state.filterCategory;
            const difficulty = this.state.filterDifficulty;
            
            // Make AJAX request to get filtered data
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_filter_dashboard',
                    nonce: algebraTutorDashboard.nonce || '',
                    category: category,
                    difficulty: difficulty,
                    date_from: $('#date_from').val(),
                    date_to: $('#date_to').val()
                },
                success: (response) => {
                    if (response.success) {
                        this.updateDashboardData(response.data);
                    } else {
                        this.showNotice(
                            response.data.message || algebraTutorDashboard.i18n.filterError || 'Error applying filters.',
                            'error'
                        );
                    }
                    
                    this.state.isLoading = false;
                    $('.dashboard-loader').fadeOut(200);
                },
                error: () => {
                    this.showNotice(
                        algebraTutorDashboard.i18n.serverError || 'Server communication error',
                        'error'
                    );
                    
                    this.state.isLoading = false;
                    $('.dashboard-loader').fadeOut(200);
                }
            });
        },
        
        // Save widget order
        saveWidgetOrder: function() {
            const widgetOrder = [];
            
            this.$dashboardCards.each(function() {
                widgetOrder.push($(this).data('widget-id'));
            });
            
            // Save via AJAX
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_save_dashboard_layout',
                    nonce: algebraTutorDashboard.nonce || '',
                    widget_order: widgetOrder
                }
            });
        },
        
        // Save individual widget state (minimized/expanded)
        saveWidgetState: function(widgetId, state) {
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'algebra_tutor_save_widget_state',
                    nonce: algebraTutorDashboard.nonce || '',
                    widget_id: widgetId,
                    state: state
                }
            });
        },
        
        // Resize charts when container size changes
        resizeCharts: function() {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        },
        
        // Helper function to truncate text
        truncateText: function(text, length) {
            text = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
            
            if (text.length > length) {
                return text.substring(0, length) + '...';
            }
            
            return text;
        },
        
        // Animate number change in stats
        animateNumberChange: function($element, oldValue, newValue) {
            $element.addClass('updating');
            
            $({ value: oldValue }).animate({ value: newValue }, {
                duration: 1000,
                easing: 'swing',
                step: function() {
                    $element.text(Math.round(this.value).toLocaleString());
                },
                complete: function() {
                    $element.text(Math.round(newValue).toLocaleString());
                    setTimeout(() => {
                        $element.removeClass('updating');
                    }, 500);
                }
            });
        },
        
        // Show a notification message
        showNotice: function(message, type = 'info') {
            const $notice = $(`
                <div class="notice notice-${type} is-dismissible algebra-dashboard-notice">
                    <p>${message}</p>
                    <button type="button" class="notice-dismiss">
                        <span class="screen-reader-text">Dismiss this notice.</span>
                    </button>
                </div>
            `);
            
            // Remove any existing notices
            $('.algebra-dashboard-notice').remove();
            
            // Add the notice to the page
            this.$dashboard.prepend($notice);
            
            // Add dismiss functionality
            $notice.find('.notice-dismiss').on('click', function() {
                $(this).parent().fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // Auto dismiss after 5 seconds
            setTimeout(() => {
                $notice.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 5000);
        }
    };
    
    // Initialize when document is ready
    $(document).ready(function() {
        AlgebraTutorDashboard.init();
    });
    
})(jQuery);