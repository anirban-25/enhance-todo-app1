class TaskGraphHandler {
    constructor() {
        this.chart = null;
        this.initialized = false;
        this.graphContainer = null;
        this.visibleDatasets = {
            pending: true,
            completed: true
        };
    }

    async initializeGraph() {
        try {
            console.log('Initializing graph...');
            // First, ensure Chart.js is loaded
            await this.loadChartJS();
            
            // Create statistics dashboard if it doesn't exist
            this.ensureStatisticsDashboard();
            
            // Mark as initialized and update the graph
            this.initialized = true;
            this.updateGraph();
            
            // Set up a mutation observer to monitor DOM changes
            this.setupMutationObserver();
        } catch (error) {
            console.error('Error initializing graph:', error);
        }
    }

    ensureStatisticsDashboard() {
        // Ensure statistics dashboard exists
        let statisticsDashboard = document.getElementById('statisticsDashboard');
        if (!statisticsDashboard) {
            statisticsDashboard = document.createElement('div');
            statisticsDashboard.id = 'statisticsDashboard';
            statisticsDashboard.className = 'statistics-dashboard';
            const tasksPanel = document.querySelector('.tasks-panel');
            if (tasksPanel) {
                tasksPanel.parentNode.insertBefore(statisticsDashboard, tasksPanel.nextSibling);
            } else {
                const taskList = document.getElementById('taskList');
                if (taskList && taskList.parentNode) {
                    taskList.parentNode.insertBefore(statisticsDashboard, taskList.nextSibling);
                } else {
                    document.querySelector('main').appendChild(statisticsDashboard);
                }
            }
        }
        
        // Create or get graph container
        this.graphContainer = statisticsDashboard.querySelector('.graph-container');
        if (!this.graphContainer) {
            this.graphContainer = document.createElement('div');
            this.graphContainer.className = 'graph-container graph-appear';
            
            // Create the HTML structure for the graph with toggle controls
            this.graphContainer.innerHTML = `
                <h2><i class="fas fa-chart-line"></i> Task Timeline</h2>
                <div class="canvas-container">
                    <canvas id="taskTimelineChart"></canvas>
                </div>
                <div class="graph-controls">
                    <div class="graph-toggle toggle-pending active" data-dataset="pending">
                        <div class="toggle-indicator"></div>
                        <span class="toggle-label">Pending Tasks</span>
                    </div>
                    <div class="graph-toggle toggle-completed active" data-dataset="completed">
                        <div class="toggle-indicator"></div>
                        <span class="toggle-label">Completed Tasks</span>
                    </div>
                </div>
            `;
            
            statisticsDashboard.appendChild(this.graphContainer);
            
            // Add event listeners to toggle buttons
            this.setupToggleListeners();
        }
    }
    
    setupToggleListeners() {
        const toggleButtons = this.graphContainer.querySelectorAll('.graph-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const dataset = button.dataset.dataset;
                button.classList.toggle('active');
                this.visibleDatasets[dataset] = button.classList.contains('active');
                this.updateDatasetVisibility();
            });
        });
    }
    
    updateDatasetVisibility() {
        if (!this.chart) return;
        
        this.chart.data.datasets.forEach(dataset => {
            if (dataset.label.toLowerCase().includes('pending')) {
                dataset.hidden = !this.visibleDatasets.pending;
            } else if (dataset.label.toLowerCase().includes('completed')) {
                dataset.hidden = !this.visibleDatasets.completed;
            }
        });
        
        this.chart.update();
    }

    setupMutationObserver() {
        // Create an observer to watch for DOM changes that might affect our chart
        const observer = new MutationObserver((mutations) => {
            // Check if our graph container was removed
            const container = document.querySelector('.graph-container');
            if (!container) {
                console.log('Graph container was removed, restoring...');
                this.ensureStatisticsDashboard();
                this.updateGraph();
            }
        });
        
        // Start observing the main container for changes
        const container = document.querySelector('.container') || document.body;
        observer.observe(container, { 
            childList: true, 
            subtree: true 
        });
    }

    async loadChartJS() {
        // Check if Chart is already defined
        if (window.Chart) {
            console.log('Chart.js already loaded');
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    updateGraph() {
        try {
            console.log('Updating graph...');
            if (!this.initialized) {
                console.log('Graph not initialized, initializing now...');
                this.initializeGraph();
                return;
            }

            // Ensure the statistics dashboard and graph container exist
            this.ensureStatisticsDashboard();
            
            // Get canvas element after ensuring it exists
            let ctx = document.getElementById('taskTimelineChart');
            if (!ctx) {
                console.error('Canvas element not found, recreating graph container');
                
                // Recreate the canvas container
                const canvasContainer = this.graphContainer.querySelector('.canvas-container');
                if (canvasContainer) {
                    canvasContainer.innerHTML = '<canvas id="taskTimelineChart"></canvas>';
                    ctx = document.getElementById('taskTimelineChart');
                } else {
                    // If canvas container doesn't exist, recreate the entire graph container
                    this.graphContainer.innerHTML = `
                        <h2><i class="fas fa-chart-line"></i> Task Timeline</h2>
                        <div class="canvas-container">
                            <canvas id="taskTimelineChart"></canvas>
                        </div>
                        <div class="graph-controls">
                            <div class="graph-toggle toggle-pending active" data-dataset="pending">
                                <div class="toggle-indicator"></div>
                                <span class="toggle-label">Pending Tasks</span>
                            </div>
                            <div class="graph-toggle toggle-completed active" data-dataset="completed">
                                <div class="toggle-indicator"></div>
                                <span class="toggle-label">Completed Tasks</span>
                            </div>
                        </div>
                    `;
                    
                    ctx = document.getElementById('taskTimelineChart');
                    this.setupToggleListeners();
                }
                
                if (!ctx) {
                    console.error('Failed to create canvas element');
                    return;
                }
            }

            // Get data for the last 30 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            let timelineData;
            try {
                timelineData = storageHandler.getTaskStatistics(startDate, endDate);
                console.log('Timeline data:', timelineData);
            } catch (error) {
                console.error('Error getting task statistics:', error);
                // Create dummy data if there's an error or no data
                timelineData = this.createDummyData(startDate, endDate);
            }

            // Format dates for better display
            const formattedData = timelineData.map(data => ({
                ...data,
                formattedDate: this.formatDateForDisplay(data.date)
            }));

            // Destroy existing chart if it exists
            if (this.chart) {
                this.chart.destroy();
            }

            // Create new chart with enhanced styling
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: formattedData.map(data => data.formattedDate),
                    datasets: [
                        {
                            label: 'Pending Tasks',
                            data: formattedData.map(data => data.pending),
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#ff6b6b',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            hidden: !this.visibleDatasets.pending
                        },
                        {
                            label: 'Completed Tasks',
                            data: formattedData.map(data => data.completed),
                            borderColor: '#51cf66',
                            backgroundColor: 'rgba(81, 207, 102, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#51cf66',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            hidden: !this.visibleDatasets.completed
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: false // Hide default legend as we use custom toggles
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 26, 36, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: 'rgba(0, 255, 245, 0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 12,
                            boxPadding: 6,
                            usePointStyle: true,
                            callbacks: {
                                title: function(tooltipItems) {
                                    return tooltipItems[0].label;
                                },
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                color: 'var(--text-secondary)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: 'var(--text-secondary)',
                                padding: 10,
                                precision: 0
                            }
                        }
                    }
                }
            });
            
            // Update toggle buttons to reflect current state
            this.updateToggleState();
            
        } catch (error) {
            console.error('Error updating graph:', error);
        }
    }
    
    updateToggleState() {
        const pendingToggle = this.graphContainer.querySelector('.toggle-pending');
        const completedToggle = this.graphContainer.querySelector('.toggle-completed');
        
        if (pendingToggle) {
            pendingToggle.classList.toggle('active', this.visibleDatasets.pending);
        }
        
        if (completedToggle) {
            completedToggle.classList.toggle('active', this.visibleDatasets.completed);
        }
    }
    
    // Helper function to format dates in a more user-friendly way
    formatDateForDisplay(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (error) {
            return dateStr;
        }
    }
    
    // Helper function to create dummy data if needed
    createDummyData(startDate, endDate) {
        const data = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            data.push({
                date: dateStr,
                pending: Math.floor(Math.random() * 10),
                completed: Math.floor(Math.random() * 5)
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return data;
    }
}

const taskGraphHandler = new TaskGraphHandler();

// Initialize the graph when the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short time to ensure other components are initialized
    setTimeout(() => {
        taskGraphHandler.initializeGraph();
    }, 500);
});