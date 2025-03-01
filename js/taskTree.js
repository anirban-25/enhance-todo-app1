/**
 * TaskTree class manages the hierarchical view of tasks, allowing users to see
 * parent-child relationships and task dependencies in a tree structure.
 */
class TaskTree {
    constructor() {
        // Initialize main container elements
        this.treeContainer = document.getElementById('taskTree');
        this.listContainer = document.getElementById('taskList');
        
        // Initialize view toggle buttons
        this.treeViewBtn = document.getElementById('treeViewBtn');
        this.listViewBtn = document.getElementById('listViewBtn');
        
        // Bind view toggle events
        this.bindViewToggle();
    }

    /**
     * Initializes the tree view with the provided tasks array
     * @param {Array} tasks - Array of task objects
     */
    initializeTree(tasks) {
        const organizedTasks = this.organizeTasks(tasks);
        this.treeContainer.innerHTML = '';
        this.renderTaskTree(organizedTasks, this.treeContainer);
    }

    /**
     * Organizes flat task array into hierarchical structure
     * @param {Array} tasks - Flat array of task objects
     * @returns {Array} Array of root tasks with nested children
     */
    organizeTasks(tasks) {
        const taskMap = new Map();
        
        // First pass: Create task objects with empty children arrays
        tasks.forEach(task => {
            taskMap.set(task.id, {
                ...task,
                children: []
            });
        });

        const rootTasks = [];

        // Second pass: Establish parent-child relationships
        tasks.forEach(task => {
            const taskWithChildren = taskMap.get(task.id);
            if (task.parentId) {
                const parent = taskMap.get(task.parentId);
                if (parent) {
                    parent.children.push(taskWithChildren);
                } else {
                    rootTasks.push(taskWithChildren);
                }
            } else {
                rootTasks.push(taskWithChildren);
            }
        });

        return rootTasks;
    }

    /**
     * Recursively renders the task tree
     * @param {Array} tasks - Array of tasks to render
     * @param {HTMLElement} container - Container element
     * @param {number} level - Current nesting level
     */
    renderTaskTree(tasks, container, level = 0) {
        tasks.forEach(task => {
            const nodeElement = this.createTreeNode(task, level);
            container.appendChild(nodeElement);

            if (task.children && task.children.length > 0) {
                const childContainer = document.createElement('div');
                childContainer.className = 'tree-node-children';
                nodeElement.appendChild(childContainer);
                this.renderTaskTree(task.children, childContainer, level + 1);
            }
        });
    }

    /**
     * Creates a visual node element for a task
     * @param {Object} task - Task object
     * @param {number} level - Nesting level
     * @returns {HTMLElement} Created node element
     */
    createTreeNode(task, level) {
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.dataset.taskId = task.id;
        node.dataset.level = level;

        const nodeContent = document.createElement('div');
        nodeContent.className = `tree-node-content priority-${task.priority}`;
        if (task.completed) nodeContent.classList.add('completed');

        nodeContent.innerHTML = `
            <div class="task-header">
                <div class="task-status">
                    <input type="checkbox" 
                           class="task-checkbox" 
                           ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-info">
                    <span class="task-title">${this.escapeHtml(task.title)}</span>
                    ${task.category ? 
                        `<span class="task-category badge">${this.escapeHtml(task.category)}</span>` 
                        : ''}
                </div>
            </div>
            <div class="task-details">
                <span class="task-due-date">Due: ${this.formatDate(task.dueDate)}</span>
                ${task.estimatedTime ? 
                    `<span class="task-time">Est: ${task.estimatedTime}h</span>` 
                    : ''}
            </div>
        `;

        // Add expand/collapse button for tasks with children
        if (task.children && task.children.length > 0) {
            const expandBtn = document.createElement('button');
            expandBtn.className = 'expand-btn';
            expandBtn.innerHTML = '▼';
            expandBtn.onclick = () => this.toggleNodeExpand(node);
            nodeContent.insertBefore(expandBtn, nodeContent.firstChild);
        }

        node.appendChild(nodeContent);
        return node;
    }

    /**
     * Sets up event listeners for view toggle buttons
     */
    bindViewToggle() {
        this.treeViewBtn.addEventListener('click', () => {
            this.treeContainer.classList.remove('hidden');
            this.listContainer.classList.add('hidden');
            this.treeViewBtn.classList.add('active');
            this.listViewBtn.classList.remove('active');
        });

        this.listViewBtn.addEventListener('click', () => {
            this.listContainer.classList.remove('hidden');
            this.treeContainer.classList.add('hidden');
            this.listViewBtn.classList.add('active');
            this.treeViewBtn.classList.remove('active');
        });
    }

    /**
     * Formats date strings for display
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted date string
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }

    /**
     * Toggles expand/collapse state of a tree node
     * @param {HTMLElement} node - Node element to toggle
     */
    toggleNodeExpand(node) {
        const childContainer = node.querySelector('.tree-node-children');
        const expandBtn = node.querySelector('.expand-btn');
        
        if (childContainer) {
            const isExpanded = !childContainer.classList.contains('hidden');
            childContainer.classList.toggle('hidden');
            expandBtn.innerHTML = isExpanded ? '▼' : '▲';
        }
    }

    /**
     * Safely escapes HTML content
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Create and export a global instance of TaskTree
const taskTree = new TaskTree();