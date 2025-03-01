if (typeof window.TodoApp === 'undefined') {
    class TodoApp {
        constructor() { this.initializeApp(); }
        
        async initializeApp() {
            try {
                await this.initializeElements();
                this.initializeState();
                if (typeof ReminderSystem !== 'undefined') this.reminderSystem = new ReminderSystem();
                if (typeof StatisticsHandler !== 'undefined') this.statisticsHandler = new StatisticsHandler();
                this.bindEvents();
                this.loadInitialData();
            } catch (error) {
                console.error('TodoApp: Initialization failed:', error);
                this.showError('Failed to initialize application');
            }
        }

        initializeElements() {
            return new Promise((resolve, reject) => {
                try {
                    this.addTaskBtn = document.getElementById('addTaskBtn');
                    this.taskForm = document.getElementById('taskForm');
                    this.taskList = document.getElementById('taskList');
                    this.saveTaskBtn = document.getElementById('saveTaskBtn');
                    this.cancelTaskBtn = document.getElementById('cancelTaskBtn');
                    this.addCategoryBtn = document.getElementById('addCategoryBtn');
                    this.categoryForm = document.getElementById('categoryForm');
                    this.saveCategoryBtn = document.getElementById('saveCategoryBtn');
                    this.cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
                    this.categoryList = document.getElementById('categoryList');
                    this.priorityFilter = document.getElementById('priorityFilter');
                    this.statusFilter = document.getElementById('statusFilter');
                    this.categoryFilter = document.getElementById('categoryFilter');
                    this.searchInput = document.getElementById('searchInput');
                    resolve();
                } catch (error) { reject(error); }
            });
        }

        initializeState() {
            this.currentFilters = { priority: 'all', status: 'all', category: 'all', searchTerm: '' };
        }

        bindEvents() {
            if (this.addTaskBtn) this.addTaskBtn.addEventListener('click', () => {
                document.getElementById('taskFormModal').classList.remove('hidden');
            });

            if (this.saveTaskBtn) this.saveTaskBtn.addEventListener('click', e => {
                e.preventDefault();
                this.saveTask();
            });

            if (this.cancelTaskBtn) this.cancelTaskBtn.addEventListener('click', () => {
                if (this.taskForm) {
                    this.taskForm.classList.add('hidden');
                    this.clearForm();
                }
            });

            if (this.addCategoryBtn) this.addCategoryBtn.addEventListener('click', () => {
                document.getElementById('categoryFormModal').classList.remove('hidden');
            });

            if (this.saveCategoryBtn) this.saveCategoryBtn.addEventListener('click', e => {
                e.preventDefault();
                this.saveCategory();
            });

            if (this.cancelCategoryBtn) this.cancelCategoryBtn.addEventListener('click', () => {
                if (this.categoryForm) {
                    this.categoryForm.classList.add('hidden');
                    const categoryInput = document.getElementById('categoryName');
                    if (categoryInput) categoryInput.value = '';
                }
            });

            if (this.taskList) this.taskList.addEventListener('click', e => {
                if (e.target.classList.contains('btn-delete')) {
                    const taskItem = e.target.closest('.task-item');
                    if (taskItem) this.deleteTask(taskItem.dataset.taskId);
                } else if (e.target.classList.contains('task-checkbox')) {
                    const taskItem = e.target.closest('.task-item');
                    if (taskItem) this.toggleTaskCompletion(taskItem.dataset.taskId, e.target.checked);
                }
            });

            if (this.categoryList) this.categoryList.addEventListener('click', e => {
                if (e.target.classList.contains('delete-category')) {
                    const categoryItem = e.target.closest('.category-item');
                    if (categoryItem) this.deleteCategory(categoryItem.dataset.category);
                }
            });

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
                if (this.taskForm) this.taskForm.classList.add('hidden');
                this.showSuccess('Task saved successfully');
                if (this.reminderSystem) this.reminderSystem.checkDueDates();
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
                if (this.categoryForm) this.categoryForm.classList.add('hidden');
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
            if (storageHandler.updateTask(taskId, { completed })) this.refreshTaskList();
        }

        loadCategories() {
            const categories = storageHandler.getAllCategories();
            this.updateCategoryList(categories);
            this.updateCategoryDropdowns(categories);
        }

        updateCategoryList(categories) {
            if (!this.categoryList) return;
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
                this.loadCategories();
                this.refreshTaskList();
            } catch (error) {
                console.error('Failed to load initial data:', error);
                this.showError('Failed to load initial data');
            }
        }

        refreshTaskList() {
            if (!this.taskList) return;
            this.taskList.innerHTML = '';
            const tasks = storageHandler.getAllTasks();
            const filteredTasks = this.filterTasks(tasks);
            filteredTasks.forEach(task => this.addTaskToList(task));
            if (this.statisticsHandler) this.statisticsHandler.updateStatistics();
        }

        addTaskToList(task) {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item priority-${task.priority}`;
            taskElement.dataset.taskId = task.id;
            taskElement.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-details">
                        <span class="task-title ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.title)}</span>
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
                const statusMatch = this.currentFilters.status === 'all' || 
                                  (this.currentFilters.status === 'completed' && task.completed) ||
                                  (this.currentFilters.status === 'pending' && !task.completed);
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

        showError(message) { alert(message); }
        showSuccess(message) { alert(message); }
    }
    window.TodoApp = TodoApp;
}

if (!window.todoApp) {
    document.addEventListener('DOMContentLoaded', () => {
        window.todoApp = new TodoApp();
    });
}