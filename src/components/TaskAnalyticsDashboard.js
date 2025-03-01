/**
 * TaskAnalyticsDashboard Component
 * Provides analytics and visualization functionality for task management
 */

const TaskAnalyticsDashboard = {
    // Calculate overall analytics for tasks
    processAnalytics: function(tasks) {
        return {
            totalTasks: this.calculateTotalTasks(tasks),
            completionRate: this.calculateCompletionRate(tasks),
            categoryDistribution: this.getCategoryDistribution(tasks),
            priorityDistribution: this.getPriorityDistribution(tasks),
            completionTrend: this.getCompletionTrend(tasks)
        };
    },

    // Calculate total number of tasks
    calculateTotalTasks: function(tasks) {
        return tasks.length;
    },

    // Calculate task completion rate
    calculateCompletionRate: function(tasks) {
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(task => task.completed).length;
        return Math.round((completedTasks / tasks.length) * 100);
    },

    // Get distribution of tasks across categories
    getCategoryDistribution: function(tasks) {
        const distribution = {};
        tasks.forEach(task => {
            distribution[task.category] = (distribution[task.category] || 0) + 1;
        });
        return distribution;
    },

    // Get distribution of tasks across priority levels
    getPriorityDistribution: function(tasks) {
        const distribution = {};
        tasks.forEach(task => {
            distribution[task.priority] = (distribution[task.priority] || 0) + 1;
        });
        return distribution;
    },

    // Calculate completion trend over the last 7 days
    getCompletionTrend: function(tasks) {
        const last7Days = [...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => ({
            date,
            completed: tasks.filter(task => 
                task.completedAt && task.completedAt.split('T')[0] === date
            ).length
        }));
    },

    // Process task data for visualization
    prepareVisualizationData: function(tasks) {
        return {
            completionTrend: this.getCompletionTrend(tasks),
            categoryChart: Object.entries(this.getCategoryDistribution(tasks))
                .map(([category, count]) => ({ category, count })),
            priorityChart: Object.entries(this.getPriorityDistribution(tasks))
                .map(([priority, count]) => ({ priority, count }))
        };
    }
};

module.exports = TaskAnalyticsDashboard;