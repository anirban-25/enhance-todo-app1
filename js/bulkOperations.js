class BulkOperations {
    constructor() {
        this.selectedTasks = new Set();
        this.initializeBulkUI();
        this.bindEvents();
    }

    initializeBulkUI() {
        // Create bulk operations toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'bulk-operations-toolbar hidden';
        toolbar.id = 'bulkToolbar';
        toolbar.innerHTML = `
            <div class="bulk-info">
                <span class="selected-count">0 tasks selected</span>
            </div>
            <div class="bulk-actions">
                <button class="btn-bulk complete" title="Complete Selected">
                    <i class="fas fa-check"></i> Complete
                </button>
                <button class="btn-bulk delete" title="Delete Selected">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="btn-bulk category" title="Change Category">
                    <i class="fas fa-folder"></i> Category
                </button>
                <button class="btn-bulk export" title="Export Selected">
                    <i class="fas fa-file-export"></i> Export
                </button>
            </div>
        `;

        // Add toolbar to the page
        const taskList = document.getElementById('taskList');
        taskList.parentNode.insertBefore(toolbar, taskList);

        // Add selection checkbox to task list header
        this.addSelectionControls();
    }

    addSelectionControls() {
        // Add bulk selection checkbox to each task item
        const tasks = document.querySelectorAll('.task-item');
        tasks.forEach(task => {
            if (!task.querySelector('.task-select')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-select';
                task.querySelector('.task-content').prepend(checkbox);
            }
        });
    }

    bindEvents() {
        // Handle task selection
        document.getElementById('taskList').addEventListener('change', (e) => {
            if (e.target.classList.contains('task-select')) {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                if (e.target.checked) {
                    this.selectedTasks.add(taskId);
                } else {
                    this.selectedTasks.delete(taskId);
                }
                this.updateToolbarVisibility();
            }
        });

        // Handle bulk actions
        document.getElementById('bulkToolbar').addEventListener('click', (e) => {
            const button = e.target.closest('.btn-bulk');
            if (!button) return;

            if (button.classList.contains('complete')) {
                this.completeSelectedTasks();
            } else if (button.classList.contains('delete')) {
                this.deleteSelectedTasks();
            } else if (button.classList.contains('category')) {
                this.showCategoryModal();
            } else if (button.classList.contains('export')) {
                this.exportSelectedTasks();
            }
        });
    }

    updateToolbarVisibility() {
        const toolbar = document.getElementById('bulkToolbar');
        const selectedCount = this.selectedTasks.size;
        
        if (selectedCount > 0) {
            toolbar.classList.remove('hidden');
            toolbar.querySelector('.selected-count').textContent = 
                `${selectedCount} task${selectedCount === 1 ? '' : 's'} selected`;
        } else {
            toolbar.classList.add('hidden');
        }
    }

    completeSelectedTasks() {
        if (!confirm('Mark selected tasks as complete?')) return;

        this.selectedTasks.forEach(taskId => {
            storageHandler.updateTask(taskId, { completed: true });
        });

        this.clearSelection();
        window.todoApp.refreshTaskList();
    }

    deleteSelectedTasks() {
        if (!confirm('Delete selected tasks? This cannot be undone.')) return;

        this.selectedTasks.forEach(taskId => {
            storageHandler.deleteTask(taskId);
        });

        this.clearSelection();
        window.todoApp.refreshTaskList();
    }

    showCategoryModal() {
        // Create and show category selection modal
        const categories = storageHandler.getAllCategories();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Change Category</h3>
                <select id="bulkCategory">
                    <option value="">No Category</option>
                    ${categories.map(category => 
                        `<option value="${category}">${category}</option>`
                    ).join('')}
                </select>
                <div class="modal-actions">
                    <button class="btn-save">Apply</button>
                    <button class="btn-cancel">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle modal actions
        modal.querySelector('.btn-save').addEventListener('click', () => {
            const category = document.getElementById('bulkCategory').value;
            this.updateTasksCategory(category);
            modal.remove();
        });

        modal.querySelector('.btn-cancel').addEventListener('click', () => {
            modal.remove();
        });
    }

    updateTasksCategory(category) {
        this.selectedTasks.forEach(taskId => {
            storageHandler.updateTask(taskId, { category });
        });

        this.clearSelection();
        window.todoApp.refreshTaskList();
    }

    exportSelectedTasks() {
        const tasks = storageHandler.getAllTasks()
            .filter(task => this.selectedTasks.has(task.id));

        const exportData = {
            tasks,
            exportDate: new Date().toISOString(),
            totalTasks: tasks.length
        };

        // Create download link
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tasks_export_${new Date().toISOString().slice(0,10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    clearSelection() {
        this.selectedTasks.clear();
        document.querySelectorAll('.task-select').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateToolbarVisibility();
    }
}