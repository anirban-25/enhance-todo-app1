/**
 * StorageHandler Class
 * Manages local storage operations for the Enhanced Business To-Do List Application
 */
class StorageHandler {
    constructor() {
        this.TASKS_KEY = 'tasks';
        this.CATEGORIES_KEY = 'categories';
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(this.TASKS_KEY)) {
            localStorage.setItem(this.TASKS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.CATEGORIES_KEY)) {
            localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(['Work', 'Personal', 'Shopping']));
        }
        console.log('StorageHandler initialized successfully');
    }
    getallTasksforMe(){
        try{
            return JSON.parse(localStorage.getItem(this.TASKS_KEY)) || [];
        }catch(error){
            console.error('Error getting tasks:', error);
            return [];
        }
    }
    // Task Operations
    getAllTasks() {
        try {
            return JSON.parse(localStorage.getItem(this.TASKS_KEY)) || [];
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    }

    addTask(task) {
        try {
            const tasks = this.getAllTasks();
            task.id = this.generateId();
            task.createdAt = new Date().toISOString();
            task.completedAt = null;
            task.status = 'pending';
            tasks.push(task);
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
            return task;
        } catch (error) {
            console.error('Error adding task:', error);
            return null;
        }
    }

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
                tasks[index] = { ...tasks[index], ...updates };
                localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    }

    deleteTask(taskId) {
        try {
            const tasks = this.getAllTasks();
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            localStorage.setItem(this.TASKS_KEY, JSON.stringify(filteredTasks));
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }

    // Category Operations
    getAllCategories() {
        try {
            return JSON.parse(localStorage.getItem(this.CATEGORIES_KEY)) || [];
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    addCategory(categoryName) {
        try {
            const categories = this.getAllCategories();
            if (categories.includes(categoryName)) {
                return false;
            }
            categories.push(categoryName);
            localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
            return true;
        } catch (error) {
            console.error('Error adding category:', error);
            return false;
        }
    }

    deleteCategory(categoryName) {
        try {
            const categories = this.getAllCategories();
            const index = categories.indexOf(categoryName);
            if (index !== -1) {
                categories.splice(index, 1);
                localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
                
                // Update tasks that use this category
                const tasks = this.getAllTasks();
                const updatedTasks = tasks.map(task => {
                    if (task.category === categoryName) {
                        return { ...task, category: '' };
                    }
                    return task;
                });
                localStorage.setItem(this.TASKS_KEY, JSON.stringify(updatedTasks));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting category:', error);
            return false;
        }
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clearAllData() {
        try {
            localStorage.removeItem(this.TASKS_KEY);
            localStorage.removeItem(this.CATEGORIES_KEY);
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Add new method to get task statistics over time
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