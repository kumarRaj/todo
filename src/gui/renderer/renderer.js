/**
 * Electron renderer process for professional desktop GUI
 */

const { ipcRenderer } = require('electron');

// DOM elements
let taskInput, addBtn, loading;
let activeTasksList, completedTasksList;
let activeCount, completedCount;
let contextMenu;
let contextTaskId = null;

// Task data
let tasks = [];
let activeTasks = [];
let completedTasks = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadTasks();
});

function initializeElements() {
    taskInput = document.getElementById('task-input');
    addBtn = document.getElementById('add-btn');
    loading = document.getElementById('loading');

    activeTasksList = document.getElementById('active-tasks');
    completedTasksList = document.getElementById('completed-tasks');

    activeCount = document.getElementById('active-count');
    completedCount = document.getElementById('completed-count');

    contextMenu = document.getElementById('context-menu');
}

function setupEventListeners() {
    // Add task
    addBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    // Hide context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });

    // IPC listeners from main process
    ipcRenderer.on('new-task', () => {
        taskInput.focus();
    });

    ipcRenderer.on('import-tasks', handleImportTasks);
    ipcRenderer.on('export-tasks', handleExportTasks);
}

async function handleAddTask() {
    const content = taskInput.value.trim();
    if (!content) return;

    try {
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';

        await ipcRenderer.invoke('create-task', content);

        // Clear input
        taskInput.value = '';

        // Reload tasks
        await loadTasks();

        // Focus back to input
        taskInput.focus();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Error adding task: ' + error.message);
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Add';
    }
}

async function loadTasks() {
    try {
        showLoading(true);

        // Get all tasks and separate by status
        const allTasks = await ipcRenderer.invoke('get-all-tasks');

        activeTasks = allTasks.filter(task =>
            task.status === 'pending' ||
            task.status === 'in_progress' ||
            task.status === 'waiting'
        );

        completedTasks = allTasks.filter(task => task.status === 'completed');

        renderTasks();
        updateTaskCounts();

    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Error loading tasks');
    } finally {
        showLoading(false);
    }
}

function renderTasks() {
    // Render active tasks
    activeTasksList.innerHTML = '';
    activeTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        activeTasksList.appendChild(taskElement);
    });

    // Render completed tasks
    completedTasksList.innerHTML = '';
    completedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        completedTasksList.appendChild(taskElement);
    });

    // Setup drag and drop for active tasks
    setupDragAndDrop();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.status}`;
    li.dataset.taskId = task.id;
    li.draggable = task.status !== 'completed';

    const statusDisplay = getStatusDisplay(task.status);

    // Create task metadata elements
    const metaElements = [];

    // Add ASAP tag for high priority tasks (example logic)
    if (task.priority === 0 && task.status !== 'completed') {
        metaElements.push(`<span class="task-tag">ASAP</span>`);
    }

    // Add blocked tag if task content contains "blocked"
    if (task.content.toLowerCase().includes('blocked')) {
        metaElements.push(`<span class="task-tag blocked">blocked</span>`);
    }

    // Add progress indicator if task has subtasks (example: "1/3", "0/4")
    const progressMatch = task.content.match(/(\d+)\/(\d+)/);
    if (progressMatch) {
        metaElements.push(`<span class="task-progress">${progressMatch[0]}</span>`);
    }

    // Add comment count if task has URLs (using URLs as proxy for engagement)
    if (task.extractedUrls && task.extractedUrls.length > 0) {
        const commentCount = Math.min(task.extractedUrls.length * 2, 7); // Mock comment count
        metaElements.push(`
            <div class="task-comments">
                💬${commentCount}
            </div>
        `);
    }

    li.innerHTML = `
        ${task.status !== 'completed' ? '<div class="drag-handle" title="Drag to reorder">⋮⋮</div>' : ''}
        <div class="task-content-container">
            <div class="task-content">${escapeHtml(task.content)}</div>

            ${metaElements.length > 0 ? `
                <div class="task-meta">
                    ${metaElements.join('')}
                </div>
            ` : ''}

            ${task.extractedUrls && task.extractedUrls.length > 0 ? `
                <div class="task-urls">
                    ${task.extractedUrls.map(url =>
                        `<a href="#" class="task-url" onclick="openUrl('${url}')" title="${url}">
                            🔗 ${shortenUrl(url)}
                        </a>`
                    ).join('')}
                </div>
            ` : ''}
        </div>

        <div class="task-actions">
            <button class="edit-btn" onclick="editTask('${task.id}')" title="Edit task">
                <span class="edit-icon">✏️</span>
            </button>
            <div class="task-status ${task.status}" onclick="showStatusContextMenu(event, '${task.id}')">
                <span class="status-icon">${statusDisplay.icon}</span>
                <span>${statusDisplay.label}</span>
            </div>
            <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Delete task">
                <span class="delete-icon">🗑️</span>
            </button>
        </div>
    `;

    return li;
}

function getStatusDisplay(status) {
    const statusMap = {
        'pending': { icon: '⚪', label: 'New task' },
        'in_progress': { icon: '🚀', label: 'In Progress' },
        'waiting': { icon: '🕐', label: 'Waiting' },
        'completed': { icon: '✅', label: 'Completed' }
    };
    return statusMap[status] || statusMap['pending'];
}

function updateTaskCounts() {
    activeCount.textContent = activeTasks.length;
    completedCount.textContent = completedTasks.length;
}

function toggleSection(sectionName) {
    const section = document.querySelector(`#${sectionName}-content`).parentElement;
    const content = document.querySelector(`#${sectionName}-content`);

    section.classList.toggle('collapsed');
    content.classList.toggle('collapsed');

    // Update max-height for smooth animation
    if (content.classList.contains('collapsed')) {
        content.style.maxHeight = '0';
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';

        // Remove max-height after animation completes
        setTimeout(() => {
            if (!content.classList.contains('collapsed')) {
                content.style.maxHeight = 'none';
            }
        }, 300);
    }
}

function showStatusContextMenu(event, taskId) {
    event.preventDefault();
    event.stopPropagation();

    contextTaskId = taskId;

    const rect = event.target.closest('.task-status').getBoundingClientRect();

    contextMenu.style.left = rect.left + 'px';
    contextMenu.style.top = (rect.bottom + 5) + 'px';
    contextMenu.classList.remove('hidden');

    // Adjust position if menu would go off-screen
    setTimeout(() => {
        const menuRect = contextMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (menuRect.right > windowWidth) {
            contextMenu.style.left = (rect.right - menuRect.width) + 'px';
        }

        if (menuRect.bottom > windowHeight) {
            contextMenu.style.top = (rect.top - menuRect.height - 5) + 'px';
        }
    }, 0);
}

function hideContextMenu() {
    contextMenu.classList.add('hidden');
    contextTaskId = null;
}

async function changeTaskStatus(taskId, newStatus) {
    if (!taskId) return;

    try {
        await ipcRenderer.invoke('change-task-status', taskId, newStatus);
        await loadTasks();
        hideContextMenu();
    } catch (error) {
        console.error('Error changing task status:', error);
        alert('Error changing task status: ' + error.message);
    }
}

async function editTask(taskId) {
    if (!taskId) return;

    hideContextMenu();

    // Find the task element
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;

    // Find the task content element
    const taskContentElement = taskElement.querySelector('.task-content');
    if (!taskContentElement || taskElement.classList.contains('editing')) return;

    // Get current task content
    const currentContent = taskContentElement.textContent.trim();

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentContent;
    input.className = 'task-edit-input';

    // Replace content with input
    taskContentElement.style.display = 'none';
    taskContentElement.parentNode.insertBefore(input, taskContentElement.nextSibling);
    taskElement.classList.add('editing');

    // Focus and select text
    input.focus();
    input.select();

    // Handle save
    const saveEdit = async () => {
        const newContent = input.value.trim();

        if (newContent && newContent !== currentContent) {
            try {
                await ipcRenderer.invoke('update-task-content', taskId, newContent);
                await loadTasks();
            } catch (error) {
                console.error('Error updating task:', error);
                alert('Error updating task: ' + error.message);
                // Revert changes
                taskContentElement.style.display = '';
                input.remove();
                taskElement.classList.remove('editing');
            }
        } else {
            // Cancel edit
            taskContentElement.style.display = '';
            input.remove();
            taskElement.classList.remove('editing');
        }
    };

    // Handle cancel
    const cancelEdit = () => {
        taskContentElement.style.display = '';
        input.remove();
        taskElement.classList.remove('editing');
    };

    // Event listeners
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });

    input.addEventListener('blur', saveEdit);
}

async function deleteTask(taskId) {
    if (!taskId) return;

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this task? This action cannot be undone.');
    if (!confirmed) {
        hideContextMenu();
        return;
    }

    try {
        await ipcRenderer.invoke('delete-task', taskId);
        await loadTasks();
        hideContextMenu();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task: ' + error.message);
    }
}

function setupDragAndDrop() {
    const activeTaskItems = activeTasksList.querySelectorAll('.task-item[draggable="true"]');

    activeTaskItems.forEach(item => {
        // Remove existing listeners first
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragover', handleDragOver);
        item.removeEventListener('drop', handleDrop);
        item.removeEventListener('dragend', handleDragEnd);

        // Add fresh listeners
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);

        // Prevent child elements from interfering with drag
        const taskActions = item.querySelector('.task-actions');
        if (taskActions) {
            taskActions.addEventListener('mousedown', (e) => {
                // Allow drag to start from the task content area, not just the actions
                if (e.target.closest('.delete-btn') || e.target.closest('.task-status')) {
                    e.stopPropagation();
                }
            });
        }
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const afterElement = getDragAfterElement(activeTasksList, e.clientY);

    if (afterElement == null) {
        activeTasksList.appendChild(draggedElement);
    } else {
        activeTasksList.insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');

    // Get new order and update priorities
    updateTaskPriorities();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateTaskPriorities() {
    const taskItems = [...activeTasksList.querySelectorAll('.task-item[draggable="true"]')];
    const newOrder = taskItems.map(item => item.dataset.taskId);

    try {
        // Update priorities based on new order
        await ipcRenderer.invoke('update-task-priorities', newOrder);
        // Reload tasks to reflect changes
        await loadTasks();
    } catch (error) {
        console.error('Error updating task priorities:', error);
        // Reload tasks to reset to original order if update failed
        await loadTasks();
    }
}

async function openUrl(url) {
    try {
        await ipcRenderer.invoke('open-url', url);
    } catch (error) {
        console.error('Error opening URL:', error);
        alert('Error opening URL: ' + error.message);
    }
}

function shortenUrl(url) {
    if (url.length <= 40) return url;

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');

        if (domain.includes('github.com')) {
            const parts = urlObj.pathname.split('/');
            if (parts.length >= 3) {
                return `${parts[1]}/${parts[2]}`;
            }
        }

        return domain;
    } catch {
        return url.substring(0, 30) + '...';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    // Simple error display - could be enhanced with better UI
    console.error(message);
    alert(message);
}

async function handleImportTasks() {
    try {
        const result = await ipcRenderer.invoke('import-tasks');

        if (!result) {
            return; // User canceled
        }

        if (!result.success) {
            alert('Import failed: ' + result.error);
            return;
        }

        const message = `Successfully imported ${result.count} tasks!\n` +
                       `📋 ${result.pending} pending\n` +
                       `✅ ${result.completed} completed`;

        alert(message);
        await loadTasks();

    } catch (error) {
        console.error('Error importing tasks:', error);
        alert('Error importing tasks: ' + error.message);
    }
}

async function handleExportTasks() {
    try {
        const format = await showExportFormatDialog();
        if (!format) return;

        const result = await ipcRenderer.invoke('export-tasks', format.format, format.includeCompleted);

        if (!result) {
            return; // User canceled
        }

        if (!result.success) {
            alert('Export failed: ' + result.error);
            return;
        }

        let message = `Successfully exported to:\n${result.filePath}\n\n`;

        if (result.pending !== undefined) {
            message += `📋 ${result.pending} pending, ✅ ${result.completed} completed`;
        } else {
            message += `📋 ${result.total} tasks exported`;
        }

        alert(message);

    } catch (error) {
        console.error('Error exporting tasks:', error);
        alert('Error exporting tasks: ' + error.message);
    }
}

function showExportFormatDialog() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            min-width: 320px;
        `;

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Export Tasks</h3>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">Format:</label>
                <select id="format-select" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                    <option value="txt">Text (.txt)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="md">Markdown (.md)</option>
                </select>
            </div>

            <div style="margin-bottom: 24px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
                    <input type="checkbox" id="include-completed" checked style="width: 16px; height: 16px;">
                    <span>Include completed tasks</span>
                </label>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancel-btn" style="padding: 10px 20px; border: 2px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; font-size: 14px;">Cancel</button>
                <button id="export-btn" style="padding: 10px 20px; border: none; background: #3b82f6; color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">Export</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        dialog.querySelector('#cancel-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        dialog.querySelector('#export-btn').addEventListener('click', () => {
            const format = dialog.querySelector('#format-select').value;
            const includeCompleted = dialog.querySelector('#include-completed').checked;

            document.body.removeChild(overlay);
            resolve({ format, includeCompleted });
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(null);
            }
        });
    });
}

// Global functions for onclick handlers
window.toggleSection = toggleSection;
window.showStatusContextMenu = showStatusContextMenu;
window.changeTaskStatus = changeTaskStatus;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.openUrl = openUrl;