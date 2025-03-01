// A comprehensive system to manage task reminders and notifications
class ReminderSystem {
    constructor() {
        // Initialize reminder settings
        this.reminderSettings = {
            // Default reminder thresholds in days
            upcomingThreshold: 3,
            warningThreshold: 1,
            checkInterval: 60000 // Check every minute
        };

        // Start the reminder check interval
        this.startReminderCheck();
        
        // Initialize notification permission
        this.initializeNotifications();
    }

    async initializeNotifications() {
        // Request notification permission if not already granted
        if (Notification.permission !== "granted") {
            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    console.log("Notification permission granted");
                }
            } catch (error) {
                console.error("Error requesting notification permission:", error);
            }
        }
    }

    startReminderCheck() {
        // Perform initial check
        this.checkDueDates();

        // Set up regular interval checks
        setInterval(() => this.checkDueDates(), this.reminderSettings.checkInterval);
    }

    checkDueDates() {
        const tasks = storageHandler.getAllTasks();
        const now = new Date();

        tasks.forEach(task => {
            if (task.completed) return; // Skip completed tasks

            const dueDate = new Date(task.dueDate);
            const daysUntilDue = this.calculateDaysUntilDue(dueDate);

            // Check different reminder thresholds
            if (this.shouldSendReminder(daysUntilDue, task)) {
                this.sendReminder(task, daysUntilDue);
            }
        });
    }

    calculateDaysUntilDue(dueDate) {
        const now = new Date();
        const diffTime = dueDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    shouldSendReminder(daysUntilDue, task) {
        // Check if task is overdue
        if (daysUntilDue < 0 && !task.overdueNotified) {
            return true;
        }

        // Check warning threshold
        if (daysUntilDue <= this.reminderSettings.warningThreshold && !task.warningNotified) {
            return true;
        }

        // Check upcoming threshold
        if (daysUntilDue <= this.reminderSettings.upcomingThreshold && !task.upcomingNotified) {
            return true;
        }

        return false;
    }

    sendReminder(task, daysUntilDue) {
        let message, type;

        if (daysUntilDue < 0) {
            message = `Task "${task.title}" is overdue!`;
            type = 'overdue';
            task.overdueNotified = true;
        } else if (daysUntilDue <= this.reminderSettings.warningThreshold) {
            message = `Task "${task.title}" is due ${daysUntilDue === 0 ? 'today' : 'tomorrow'}!`;
            type = 'warning';
            task.warningNotified = true;
        } else {
            message = `Task "${task.title}" is due in ${daysUntilDue} days`;
            type = 'upcoming';
            task.upcomingNotified = true;
        }

        // Update task in storage with notification flags
        storageHandler.updateTask(task.id, task);

        // Send browser notification if permitted
        this.showNotification(message, type);

        // Also update the UI to show the reminder
        this.showReminderInUI(message, type);
    }

    showNotification(message, type) {
        if (Notification.permission === "granted") {
            const notification = new Notification("Task Reminder", {
                body: message,
                icon: this.getIconForType(type)
            });
        }
    }

    showReminderInUI(message, type) {
        const reminderContainer = document.getElementById('reminderContainer') || 
                                this.createReminderContainer();

        const reminderElement = document.createElement('div');
        reminderElement.className = `reminder-alert reminder-${type}`;
        reminderElement.innerHTML = `
            <span class="reminder-message">${message}</span>
            <button class="reminder-close">&times;</button>
        `;

        // Add close button functionality
        reminderElement.querySelector('.reminder-close').addEventListener('click', () => {
            reminderElement.remove();
            if (reminderContainer.children.length === 0) {
                reminderContainer.remove();
            }
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            reminderElement.remove();
            if (reminderContainer.children.length === 0) {
                reminderContainer.remove();
            }
        }, 5000);

        reminderContainer.appendChild(reminderElement);
    }

    createReminderContainer() {
        const container = document.createElement('div');
        container.id = 'reminderContainer';
        container.className = 'reminder-container';
        document.body.appendChild(container);
        return container;
    }

    getIconForType(type) {
        // Return appropriate icon URLs for different reminder types
        const icons = {
            overdue: '/icons/overdue.png',
            warning: '/icons/warning.png',
            upcoming: '/icons/upcoming.png'
        };
        return icons[type] || icons.warning;
    }

    // Method to update reminder settings
    updateSettings(newSettings) {
        this.reminderSettings = {
            ...this.reminderSettings,
            ...newSettings
        };
    }
}