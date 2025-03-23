/**
 * StorageHandler Class
 * Manages local storage operations for the Enhanced Business To-Do List Application
 * Updated to support user authentication
 */
class StorageHandler {
    constructor() {
        this.TASKS_KEY = 'tasks';
        this.CATEGORIES_KEY = 'categories';
        this.initializeStorage();
    }

    initializeStorage() {
        // We no longer initialize with default values here
        // Instead, we check for user-specific data when needed
        console.log('StorageHandler initialized successfully');
    }

    /**
     * Get user-specific storage key
     * @param {string} baseKey Base storage key
     * @returns {string} User-specific storage key
     */
    getUserStorageKey(baseKey) {
        const user = this.getCurrentUser();
        if (user && user.id) {
            return `${baseKey}_${user.id}`;
        }
        return baseKey;
    }

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user or null if not authenticated
     */
    getCurrentUser() {
        if (typeof authHandler !== 'undefined' && authHandler.isUserAuthenticated()) {
            return authHandler.getCurrentUser();
        }
        return null;
    }
    
    /**
     * Get all tasks for the current user
     * @returns {Array} Array of tasks
     */
    getAllTasks() {
        try {
            const userKey = this.getUserStorageKey(this.TASKS_KEY);
            const tasksData = localStorage.getItem(userKey);
            
            if (!tasksData) {
                // Initialize empty tasks array for this user if it doesn't exist
                localStorage.setItem(userKey, JSON.stringify([]));
                return [];
            }
            
            return JSON.parse(tasksData) || [];
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    }

    /**
     * Add a new task for the current user
     * @param {Object} task Task object
     * @returns {Object|null} Added task or null if error
     */
    addTask(task) {
        try {
            const tasks = this.getAllTasks();
            task.id = this.generateId();
            task.createdAt = new Date().toISOString();
            task.completedAt = null;
            task.status = 'pending';
            
            // Add user ID to task if authenticated
            const user = this.getCurrentUser();
            if (user && user.id) {
                task.userId = user.id;
            }
            
            tasks.push(task);
            const userKey = this.getUserStorageKey(this.TASKS_KEY);
            localStorage.setItem(userKey, JSON.stringify(tasks));
            return task;
        } catch (error) {
            console.error('Error adding task:', error);
            return null;
        }
    }

    /**
     * Update a task for the current user
     * @param {string} taskId Task ID
     * @param {Object} updates Task updates
     * @returns {boolean} Success status
     */
    updateTask(taskId, updates) {
        try {
            const tasks = this.getAllTasks();
            const index = tasks.findIndex(task => task.id === taskId);
            if (index !== -1) {
                if (updates.status === 'completed' && tasks[index].status !== 'completed') {
                    updates.completedAt = new Date().toISOString();
                } else if (updates.status === 'pending') {
                    updates.completedAt = null;
                }
                
                // Ensure completed property is also set for backward compatibility
                if (updates.status === 'completed') {
                    updates.completed = true;
                } else if (updates.status === 'pending') {
                    updates.completed = false;
                }
                
                // If completed property is changed directly, update status as well
                if (updates.hasOwnProperty('completed') && !updates.hasOwnProperty('status')) {
                    updates.status = updates.completed ? 'completed' : 'pending';
                    if (updates.completed && !tasks[index].completed) {
                        updates.completedAt = new Date().toISOString();
                    } else if (!updates.completed) {
                        updates.completedAt = null;
                    }
                }
                
                tasks[index] = { ...tasks[index], ...updates };
                const userKey = this.getUserStorageKey(this.TASKS_KEY);
                localStorage.setItem(userKey, JSON.stringify(tasks));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    }

    /**
     * Delete a task for the current user
     * @param {string} taskId Task ID
     * @returns {boolean} Success status
     */
    deleteTask(taskId) {
        try {
            const tasks = this.getAllTasks();
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            const userKey = this.getUserStorageKey(this.TASKS_KEY);
            localStorage.setItem(userKey, JSON.stringify(filteredTasks));
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }

    /**
     * Get all categories for the current user
     * @returns {Array} Array of categories
     */
    getAllCategories() {
        try {
            const userKey = this.getUserStorageKey(this.CATEGORIES_KEY);
            const categoriesData = localStorage.getItem(userKey);
            
            if (!categoriesData) {
                // Initialize with default categories for this user if it doesn't exist
                const defaultCategories = ['Work', 'Personal', 'Shopping'];
                localStorage.setItem(userKey, JSON.stringify(defaultCategories));
                return defaultCategories;
            }
            
            return JSON.parse(categoriesData) || [];
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    /**
     * Add a new category for the current user
     * @param {string} categoryName Category name
     * @returns {boolean} Success status
     */
    addCategory(categoryName) {
        try {
            const categories = this.getAllCategories();
            if (categories.includes(categoryName)) {
                return false;
            }
            categories.push(categoryName);
            const userKey = this.getUserStorageKey(this.CATEGORIES_KEY);
            localStorage.setItem(userKey, JSON.stringify(categories));
            return true;
        } catch (error) {
            console.error('Error adding category:', error);
            return false;
        }
    }

    /**
     * Delete a category for the current user
     * @param {string} categoryName Category name
     * @returns {boolean} Success status
     */
    deleteCategory(categoryName) {
        try {
            const categories = this.getAllCategories();
            const index = categories.indexOf(categoryName);
            if (index !== -1) {
                categories.splice(index, 1);
                const userKey = this.getUserStorageKey(this.CATEGORIES_KEY);
                localStorage.setItem(userKey, JSON.stringify(categories));
                
                // Update tasks that use this category
                const tasks = this.getAllTasks();
                const updatedTasks = tasks.map(task => {
                    if (task.category === categoryName) {
                        return { ...task, category: '' };
                    }
                    return task;
                });
                const tasksKey = this.getUserStorageKey(this.TASKS_KEY);
                localStorage.setItem(tasksKey, JSON.stringify(updatedTasks));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting category:', error);
            return false;
        }
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Clear all data for the current user
     * @returns {boolean} Success status
     */
    clearAllData() {
        try {
            const tasksKey = this.getUserStorageKey(this.TASKS_KEY);
            const categoriesKey = this.getUserStorageKey(this.CATEGORIES_KEY);
            
            localStorage.removeItem(tasksKey);
            localStorage.removeItem(categoriesKey);
            
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get task statistics over time
     * @param {string} startDate Start date
     * @param {string} endDate End date
     * @returns {Array} Timeline data
     */
    getTaskStatistics(startDate, endDate) {
        try {
            const tasks = this.getAllTasks();
            const timelineData = [];
            
            let currentDate = new Date(startDate);
            const end = new Date(endDate);
            
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                
                const stats = {
                    date: dateStr,
                    pending: tasks.filter(task => {
                        const taskCreated = new Date(task.createdAt).toISOString().split('T')[0];
                        const taskCompleted = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
                        return taskCreated <= dateStr && (!taskCompleted || taskCompleted > dateStr);
                    }).length,
                    completed: tasks.filter(task => {
                        const taskCompleted = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null;
                        return taskCompleted === dateStr;
                    }).length
                };
                
                timelineData.push(stats);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return timelineData;
        } catch (error) {
            console.error('Error getting task statistics:', error);
            return [];
        }
    }
}

// Create a global instance of StorageHandler
const storageHandler = new StorageHandler();