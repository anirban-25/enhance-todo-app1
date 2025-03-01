/**
 * StatisticsHandler Class
 * Manages the analytics dashboard for the Enhanced Business To-Do List Application
 */
class StatisticsHandler {
    constructor() {
        this.dashboardContainer = this.createDashboardContainer();
        this.updateStatistics();
    }

    createDashboardContainer() {
        const container = document.createElement('div');
        container.id = 'statisticsDashboard';
        container.className = 'statistics-dashboard';
        
        // Insert after task list
        const taskList = document.getElementById('taskList');
        taskList.parentNode.insertBefore(container, taskList.nextSibling);
        
        return container;
    }

    updateStatistics() {
        const tasks = storageHandler.getAllTasks();
        const stats = this.calculateStatistics(tasks);
        this.renderDashboard(stats);
    }

    calculateStatistics(tasks) {
        const now = new Date();
        
        return {
            total: tasks.length,
            completed: tasks.filter(task => task.completed).length,
            pending: tasks.filter(task => !task.completed).length,
            overdue: tasks.filter(task => !task.completed && new Date(task.dueDate) < now).length,
            dueSoon: tasks.filter(task => {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate - now;
                return !task.completed && timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
            }).length,
            categoryDistribution: this.getCategoryDistribution(tasks),
            priorityDistribution: this.getPriorityDistribution(tasks),
            completionRate: tasks.length ? 
                Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100) : 0
        };
    }

    getCategoryDistribution(tasks) {
        const distribution = {};
        tasks.forEach(task => {
            const category = task.category || 'Uncategorized';
            distribution[category] = (distribution[category] || 0) + 1;
        });
        return distribution;
    }

    getPriorityDistribution(tasks) {
        const distribution = {
            high: tasks.filter(task => task.priority === 'high').length,
            medium: tasks.filter(task => task.priority === 'medium').length,
            low: tasks.filter(task => task.priority === 'low').length
        };
        return distribution;
    }

    renderDashboard(stats) {
        this.dashboardContainer.innerHTML = `
            <div class="stats-header">
                <h2>Task Analytics</h2>
                <div class="stats-actions">
                    <button onclick="todoApp.statisticsHandler.exportStatistics()" class="btn-secondary">
                        <i class="fas fa-download"></i> Export Stats
                    </button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Total Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.completionRate}%</div>
                    <div class="stat-label">Completion Rate</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.completionRate}%"></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.overdue}</div>
                    <div class="stat-label">Overdue Tasks</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.dueSoon}</div>
                    <div class="stat-label">Due in 24h</div>
                </div>
            </div>

            <div class="stats-details">
                <div class="stat-section">
                    <h3>Priority Distribution</h3>
                    <div class="priority-chart">
                        ${this.renderPriorityChart(stats.priorityDistribution)}
                    </div>
                </div>
                
                <div class="stat-section">
                    <h3>Category Distribution</h3>
                    <div class="category-chart">
                        ${this.renderCategoryChart(stats.categoryDistribution)}
                    </div>
                </div>
            </div>
        `;
    }

    renderPriorityChart(distribution) {
        const total = distribution.high + distribution.medium + distribution.low;
        if (total === 0) return '<div class="no-data">No tasks available</div>';

        return `
            <div class="chart-bars">
                <div class="chart-bar">
                    <div class="bar-label">High</div>
                    <div class="bar high" style="height: ${(distribution.high / total * 100)}%">
                        ${distribution.high}
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">Medium</div>
                    <div class="bar medium" style="height: ${(distribution.medium / total * 100)}%">
                        ${distribution.medium}
                    </div>
                </div>
                <div class="chart-bar">
                    <div class="bar-label">Low</div>
                    <div class="bar low" style="height: ${(distribution.low / total * 100)}%">
                        ${distribution.low}
                    </div>
                </div>
            </div>
        `;
    }

    renderCategoryChart(distribution) {
        const entries = Object.entries(distribution);
        if (entries.length === 0) return '<div class="no-data">No categories available</div>';

        const total = entries.reduce((sum, [_, count]) => sum + count, 0);
        
        return entries.map(([category, count]) => `
            <div class="category-bar">
                <div class="bar-info">
                    <span class="category-name">${category}</span>
                    <span class="category-count">${count} (${Math.round(count/total * 100)}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(count/total * 100)}%"></div>
                </div>
            </div>
        `).join('');
    }

    exportStatistics() {
        const tasks = storageHandler.getAllTasks();
        const stats = this.calculateStatistics(tasks);
        
        const exportData = {
            statistics: stats,
            exportDate: new Date().toISOString(),
            totalTasks: tasks.length
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `task_statistics_${new Date().toISOString().slice(0,10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    }
}

// Export the class to window object
window.StatisticsHandler = StatisticsHandler;