if (typeof window.TodoApp === 'undefined') {
    class TodoApp {
        constructor() {
            // Check if user is authenticated before initializing
            if (this.checkAuthentication()) {
                this.initializeApp();
            }
            
            // Set initialized flag
            this.initialized = false;
        }
        
        /**
         * Check if user is authenticated
         * @returns {boolean} Authentication status
         */
        checkAuthentication() {
            if (typeof authHandler !== 'undefined') {
                return authHandler.isUserAuthenticated();
            }
            return false; // If authHandler isn't defined yet, return false
        }
        
        async initializeApp() {
            try {
                await this.initializeElements();
                this.initializeState();
                if (typeof ReminderSystem !== 'undefined') this.reminderSystem = new ReminderSystem();
                if (typeof StatisticsHandler !== 'undefined') this.statisticsHandler = new StatisticsHandler();
                this.bindEvents();
                this.loadInitialData();
                
                // Set initialized flag
                this.initialized = true;
            } catch (error) {
                console.error('TodoApp: Initialization failed:', error);
                this.showError('Failed to initialize application');
            }
        }

        initializeElements() {
            return new Promise((resolve, reject) => {
                try {
                    this.addTaskBtn = document.getElementById('addTaskBtn');
                    this.taskFormModal = document.getElementById('taskFormModal');
                    this.taskForm = document.getElementById('taskForm');
                    this.taskList = document.getElementById('taskList');
                    this.saveTaskBtn = document.getElementById('saveTaskBtn');
                    this.cancelTaskBtn = document.getElementById('cancelTaskBtn');
                    this.addCategoryBtn = document.getElementById('addCategoryBtn');
                    this.categoryFormModal = document.getElementById('categoryFormModal');
                    this.categoryForm = document.getElementById('categoryForm');
                    this.saveCategoryBtn = document.getElementById('saveCategoryBtn');
                    this.cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
                    this.categoryList = document.getElementById('categoryList');
                    this.priorityFilter = document.getElementById('priorityFilter');
                    this.statusFilter = document.getElementById('statusFilter');
                    this.categoryFilter = document.getElementById('categoryFilter');
                    this.searchInput = document.getElementById('searchInput');
                    
                    // Listen for authentication changes
                    document.addEventListener('userAuthenticated', (event) => {
                        console.log('User authenticated event received');
                        this.handleAuthChange(true, event.detail?.user);
                    });
                    
                    document.addEventListener('userLoggedOut', () => {
                        console.log('User logged out event received');
                        this.handleAuthChange(false);
                    });
                    
                    resolve();
                } catch (error) { reject(error); }
            });
        }

        initializeState() {
            this.currentFilters = { priority: 'all', status: 'all', category: 'all', searchTerm: '' };
        }
        
        /**
         * Handle authentication state changes
         * @param {boolean} isAuthenticated Is user authenticated
         * @param {Object} user User object (if authenticated)
         */
        handleAuthChange(isAuthenticated, user = null) {
            console.log('Auth state changed:', isAuthenticated ? 'authenticated' : 'not authenticated');
            
            if (isAuthenticated) {
                // If the app is not yet initialized, initialize it
                if (!this.initialized) {
                    this.initializeApp();
                    return;
                }
                
                // Otherwise, just refresh the data
                this.loadInitialData();
            } else {
                // Clear UI on logout
                if (this.taskList) {
                    this.taskList.innerHTML = '';
                }
                if (this.categoryList) {
                    this.categoryList.innerHTML = '';
                }
                
                // Reset initialized state
                this.initialized = false;
            }
        }

        bindEvents() {
            if (this.addTaskBtn) {
                this.addTaskBtn.addEventListener('click', () => {
                    if (this.taskFormModal) {
                        this.taskFormModal.classList.remove('hidden');
                    }
                });
            }

            if (this.saveTaskBtn) {
                this.saveTaskBtn.addEventListener('click', e => {
                    e.preventDefault();
                    this.saveTask();
                });
            }

            if (this.cancelTaskBtn) {
                this.cancelTaskBtn.addEventListener('click', () => {
                    if (this.taskFormModal) {
                        this.taskFormModal.classList.add('hidden');
                        this.clearForm();
                    }
                });
            }

            if (this.addCategoryBtn) {
                this.addCategoryBtn.addEventListener('click', () => {
                    if (this.categoryFormModal) {
                        this.categoryFormModal.classList.remove('hidden');
                    }
                });
            }

            if (this.saveCategoryBtn) {
                this.saveCategoryBtn.addEventListener('click', e => {
                    e.preventDefault();
                    this.saveCategory();
                });
            }

            if (this.cancelCategoryBtn) {
                this.cancelCategoryBtn.addEventListener('click', () => {
                    if (this.categoryFormModal) {
                        this.categoryFormModal.classList.add('hidden');
                        const categoryInput = document.getElementById('categoryName');
                        if (categoryInput) categoryInput.value = '';
                    }
                });
            }

            if (this.taskList) {
                this.taskList.addEventListener('click', e => {
                    if (e.target.classList.contains('btn-delete')) {
                        const taskItem = e.target.closest('.task-item');
                        if (taskItem) this.deleteTask(taskItem.dataset.taskId);
                    } else if (e.target.classList.contains('task-checkbox')) {
                        const taskItem = e.target.closest('.task-item');
                        if (taskItem) this.toggleTaskCompletion(taskItem.dataset.taskId, e.target.checked);
                    }
                });
            }

            if (this.categoryList) {
                this.categoryList.addEventListener('click', e => {
                    if (e.target.classList.contains('delete-category')) {
                        const categoryItem = e.target.closest('.category-item');
                        if (categoryItem) this.deleteCategory(categoryItem.dataset.category);
                    }
                });
            }

            this.bindFilterEvents();
            this.bindSearchEvents();

            document.querySelectorAll('.modal-close').forEach(button => {
                button.addEventListener('click', () => {
                    const modal = button.closest('.modal-overlay');
                    if (modal) {
                        modal.classList.add('hidden');
                        const form = modal.querySelector('form');
                        if (form) form.reset();
                    }
                });
            });
        }

        bindFilterEvents() {
            if (this.priorityFilter) this.priorityFilter.addEventListener('change', () => {
                this.currentFilters.priority = this.priorityFilter.value;
                this.refreshTaskList();
            });

            if (this.statusFilter) this.statusFilter.addEventListener('change', () => {
                this.currentFilters.status = this.statusFilter.value;
                this.refreshTaskList();
            });

            if (this.categoryFilter) this.categoryFilter.addEventListener('change', () => {
                this.currentFilters.category = this.categoryFilter.value;
                this.refreshTaskList();
            });
        }

        bindSearchEvents() {
            if (this.searchInput) {
                let searchTimeout;
                this.searchInput.addEventListener('input', e => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.currentFilters.searchTerm = e.target.value;
                        this.refreshTaskList();
                    }, 300);
                });
            }
        }

        saveTask() {
            const title = document.getElementById('taskTitle')?.value.trim() || '';
            const description = document.getElementById('taskDescription')?.value.trim() || '';
            const dueDate = document.getElementById('taskDueDate')?.value || '';
            const priority = document.getElementById('taskPriority')?.value || 'low';
            const category = document.getElementById('taskCategory')?.value || '';

            if (!this.validateTaskInput(title, dueDate)) return;

            const task = { title, description, dueDate, priority, category, completed: false };
            if (storageHandler.addTask(task)) {
                this.refreshTaskList();
                this.clearForm();
                if (this.taskFormModal) this.taskFormModal.classList.add('hidden');
                this.showSuccess('Task saved successfully');
                if (this.reminderSystem) this.reminderSystem.checkDueDates();
                if (typeof taskGraphHandler !== 'undefined' && 
                    typeof taskGraphHandler.updateGraph === 'function') {
                    taskGraphHandler.updateGraph();
                }
            }
        }

        saveCategory() {
            const categoryInput = document.getElementById('categoryName');
            const categoryName = categoryInput?.value.trim() || '';
            if (!categoryName) {
                this.showError('Please enter a category name');
                return;
            }
            if (storageHandler.addCategory(categoryName)) {
                this.loadCategories();
                if (categoryInput) categoryInput.value = '';
                if (this.categoryFormModal) this.categoryFormModal.classList.add('hidden');
                this.showSuccess('Category saved successfully');
            } else {
                this.showError('Category already exists');
            }
        }

        deleteTask(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                if (storageHandler.deleteTask(taskId)) {
                    this.refreshTaskList();
                    this.showSuccess('Task deleted successfully');
                    if (typeof taskGraphHandler !== 'undefined' && 
                        typeof taskGraphHandler.updateGraph === 'function') {
                        taskGraphHandler.updateGraph();
                    }
                }
            }
        }

        deleteCategory(categoryName) {
            if (confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
                if (storageHandler.deleteCategory(categoryName)) {
                    this.loadCategories();
                    this.refreshTaskList();
                    this.showSuccess('Category deleted successfully');
                }
            }
        }

        toggleTaskCompletion(taskId, completed) {
            try {
                // Update the task status and add completion timestamp
                const status = completed ? 'completed' : 'pending';
                if (storageHandler.updateTask(taskId, { status, completed })) {
                    this.refreshTaskList();
                    // Update the graph after task completion
                    if (typeof taskGraphHandler !== 'undefined' && 
                        typeof taskGraphHandler.updateGraph === 'function') {
                        taskGraphHandler.updateGraph();
                    }
                }
            } catch (error) {
                console.error('Error toggling task completion:', error);
            }
        }

        loadCategories() {
            const categories = storageHandler.getAllCategories();
            this.updateCategoryList(categories);
            this.updateCategoryDropdowns(categories);
        }

        updateCategoryList(categories) {
            if (!this.categoryList) return;
            
            if (categories.length === 0) {
                this.categoryList.innerHTML = '<div class="empty-category-message">No categories yet</div>';
                return;
            }
            
            this.categoryList.innerHTML = categories.map(category => 
                `<div class="category-item" data-category="${this.escapeHtml(category)}">
                    <span>${this.escapeHtml(category)}</span>
                    <button class="delete-category" title="Delete category">&times;</button>
                </div>`
            ).join('');
        }

        updateCategoryDropdowns(categories) {
            if (this.categoryFilter) {
                this.categoryFilter.innerHTML = `<option value="all">All Categories</option>
                    ${categories.map(category => 
                        `<option value="${this.escapeHtml(category)}">${this.escapeHtml(category)}</option>`
                    ).join('')}`;
            }
            const taskCategorySelect = document.getElementById('taskCategory');
            if (taskCategorySelect) {
                taskCategorySelect.innerHTML = `<option value="">Select Category</option>
                    ${categories.map(category => 
                        `<option value="${this.escapeHtml(category)}">${this.escapeHtml(category)}</option>`
                    ).join('')}`;
            }
        }

        loadInitialData() {
            try {
                console.log('Loading initial data...');
                this.loadCategories();
                this.refreshTaskList();
                
                // Update statistics if available
                if (this.statisticsHandler && typeof this.statisticsHandler.updateStatistics === 'function') {
                    this.statisticsHandler.updateStatistics();
                }
                
                // Initialize task tree if available
                if (typeof taskTree !== 'undefined' && typeof taskTree.initializeTree === 'function') {
                    const tasks = storageHandler.getAllTasks();
                    taskTree.initializeTree(tasks);
                }
                
                // Initialize bulk operations if available
                if (typeof BulkOperations !== 'undefined' && !window.bulkOperations) {
                    window.bulkOperations = new BulkOperations();
                }
                
                // Update graph if available
                if (typeof taskGraphHandler !== 'undefined' && 
                    typeof taskGraphHandler.updateGraph === 'function') {
                    taskGraphHandler.updateGraph();
                }
                
                console.log('Initial data loaded successfully');
            } catch (error) {
                console.error('Failed to load initial data:', error);
                this.showError('Failed to load initial data');
            }
        }

        refreshTaskList() {
            try {
                if (!this.taskList) return;
                
                // Store the statistics dashboard element
                const statisticsDashboard = document.getElementById('statisticsDashboard');
                
                // Only clear task list items, not the entire HTML
                const taskItems = this.taskList.querySelectorAll('.task-item');
                taskItems.forEach(item => item.remove());
                
                // Update task list
                const tasks = storageHandler.getAllTasks();
                
                if (tasks.length === 0) {
                    this.taskList.innerHTML = '<div class="empty-task-message">No tasks yet. Click the "Add Task" button to create your first task.</div>';
                    return;
                }
                
                const filteredTasks = this.filterTasks(tasks);
                
                if (filteredTasks.length === 0) {
                    this.taskList.innerHTML = '<div class="empty-task-message">No tasks match your current filters.</div>';
                    return;
                }
                
                filteredTasks.forEach(task => this.addTaskToList(task));
                
                // Update statistics if available
                if (this.statisticsHandler && typeof this.statisticsHandler.updateStatistics === 'function') {
                    this.statisticsHandler.updateStatistics();
                }
                
                // Update task tree if available
                if (typeof taskTree !== 'undefined' && typeof taskTree.initializeTree === 'function') {
                    taskTree.initializeTree(tasks);
                }
                
                // Update graph if available - using a small timeout to ensure DOM is settled
                if (typeof taskGraphHandler !== 'undefined' && typeof taskGraphHandler.updateGraph === 'function') {
                    setTimeout(() => {
                        taskGraphHandler.updateGraph();
                    }, 100);
                }
            } catch (error) {
                console.error('Error refreshing task list:', error);
            }
        }
        
        addTaskToList(task) {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item priority-${task.priority}`;
            taskElement.dataset.taskId = task.id;
            taskElement.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' || task.completed ? 'checked' : ''}>
                    <div class="task-details">
                        <span class="task-title ${task.status === 'completed' || task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</span>
                        ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            ${task.category ? `<span class="task-category">${this.escapeHtml(task.category)}</span>` : ''}
                            <span class="task-due-date">${this.formatDate(task.dueDate)}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-delete" title="Delete task">Delete</button>`;
            this.taskList.appendChild(taskElement);
        }

        filterTasks(tasks) {
            return tasks.filter(task => {
                const priorityMatch = this.currentFilters.priority === 'all' || task.priority === this.currentFilters.priority;
                
                // Handle both status and completed properties for backward compatibility
                const isCompleted = task.status === 'completed' || task.completed;
                const statusMatch = this.currentFilters.status === 'all' || 
                                  (this.currentFilters.status === 'completed' && isCompleted) ||
                                  (this.currentFilters.status === 'pending' && !isCompleted);
                
                const categoryMatch = this.currentFilters.category === 'all' || task.category === this.currentFilters.category;
                const searchMatch = !this.currentFilters.searchTerm || 
                                  task.title.toLowerCase().includes(this.currentFilters.searchTerm.toLowerCase()) ||
                                  (task.description && task.description.toLowerCase().includes(this.currentFilters.searchTerm.toLowerCase())) ||
                                  (task.category && task.category.toLowerCase().includes(this.currentFilters.searchTerm.toLowerCase()));
                return priorityMatch && statusMatch && categoryMatch && searchMatch;
            });
        }

        validateTaskInput(title, dueDate) {
            if (!title) { this.showError('Please enter a task title'); return false; }
            if (!dueDate) { this.showError('Please select a due date'); return false; }
            return true;
        }

        clearForm() {
            const taskTitle = document.getElementById('taskTitle');
            const taskDescription = document.getElementById('taskDescription');
            const taskDueDate = document.getElementById('taskDueDate');
            const taskPriority = document.getElementById('taskPriority');
            const taskCategory = document.getElementById('taskCategory');
            if (taskTitle) taskTitle.value = '';
            if (taskDescription) taskDescription.value = '';
            if (taskDueDate) taskDueDate.value = '';
            if (taskPriority) taskPriority.value = 'low';
            if (taskCategory) taskCategory.value = '';
        }

        formatDate(dateString) {
            try {
                const date = new Date(dateString);
                return date.toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            } catch (error) { return dateString; }
        }

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        showError(message) { 
            const toast = document.createElement('div');
            toast.className = 'toast toast-error';
            toast.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }, 100);
        }
        
        showSuccess(message) { 
            const toast = document.createElement('div');
            toast.className = 'toast toast-success';
            toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }, 100);
        }
    }
    window.TodoApp = TodoApp;
}

// Wait for authentication before initializing the app
document.addEventListener('DOMContentLoaded', () => {
    // Set default theme to light
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    
    // Initialize auth UI
    if (typeof authHandler !== 'undefined') {
        // Check if user is already authenticated from localStorage
        if (authHandler.isUserAuthenticated()) {
            // If already authenticated, initialize the app
            window.todoApp = new TodoApp();
        }
    } else {
        // If authentication is not implemented, initialize the app anyway
        window.todoApp = new TodoApp();
    }
});

// Toast styles
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        max-width: 300px;
        z-index: 9999;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .toast.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .toast-error {
        background-color: var(--danger-color);
    }
    
    .toast-success {
        background-color: var(--success-color);
    }
    
    .empty-task-message, .empty-category-message {
        padding: 20px;
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
    }
`;
document.head.appendChild(style);