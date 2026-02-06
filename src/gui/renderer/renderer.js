/**
 * Electron renderer process for desktop GUI
 */

const { ipcRenderer } = require('electron');

// DOM elements
let taskInput, scheduleInput, addBtn, taskList, emptyState, loading;
let viewButtons = [];
let currentView = 'pending';
let tasks = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    setupEventListeners();
    loadTasks();
});

function initializeElements() {
    taskInput = document.getElementById('task-input');
    scheduleInput = document.getElementById('schedule-input');
    addBtn = document.getElementById('add-btn');
    taskList = document.getElementById('task-list');
    emptyState = document.getElementById('empty-state');
    loading = document.getElementById('loading');
    viewButtons = document.querySelectorAll('.view-btn');
}

function setupEventListeners() {
    // Add task
    addBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    // View switching
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
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

    const scheduledFor = scheduleInput.value || null;

    try {
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';

        await ipcRenderer.invoke('create-task', content, scheduledFor);

        // Clear inputs
        taskInput.value = '';
        scheduleInput.value = '';

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

function switchView(view) {
    currentView = view;

    // Update active button
    viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Reload tasks with new filter
    loadTasks();
}

async function loadTasks() {
    try {
        showLoading(true);
        tasks = await ipcRenderer.invoke('get-tasks', currentView);
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showEmptyState('Error loading tasks');
    } finally {
        showLoading(false);
    }
}

function renderTasks() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index);
        taskList.appendChild(taskElement);
    });

    // Setup drag and drop for pending tasks
    if (currentView === 'pending' || currentView === 'all') {
        setupDragAndDrop();
    }
}

function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = `task-item ${task.status}`;
    li.dataset.taskId = task.id;
    li.draggable = task.status === 'pending';

    const priorityNumber = task.status === 'pending' ? index + 1 : '';
    const isCompleted = task.status === 'completed';

    // Format dates
    const scheduledDate = task.scheduledFor ? formatTaskDate(task.scheduledFor) : null;
    const completedDate = task.completedAt ? formatTaskDate(task.completedAt, true) : null;

    li.innerHTML = `
        <div class="task-controls">
            <div class="task-priority">${priorityNumber}</div>
            <div class="task-checkbox ${isCompleted ? 'completed' : ''}"
                 onclick="toggleTaskComplete('${task.id}')">
            </div>
        </div>

        <div class="task-content-container">
            <div class="task-content">${escapeHtml(task.content)}</div>

            <div class="task-meta">
                ${scheduledDate ? `<div class="task-date ${getDateClass(task.scheduledFor)}">${scheduledDate}</div>` : ''}
                ${completedDate ? `<div class="task-date">Completed ${completedDate}</div>` : ''}
            </div>

            ${task.extractedUrls && task.extractedUrls.length > 0 ? `
                <div class="task-urls">
                    ${task.extractedUrls.map(url =>
                        `<a href="#" class="task-url" onclick="openUrl('${url}')" title="${url}">
                            ${shortenUrl(url)}
                        </a>`
                    ).join('')}
                </div>
            ` : ''}
        </div>

        ${task.status === 'pending' ? `
            <div class="task-actions">
                <button class="task-action-btn" onclick="moveTask('${task.id}', 'up')" title="Move up">↑</button>
                <button class="task-action-btn" onclick="moveTask('${task.id}', 'down')" title="Move down">↓</button>
            </div>
        ` : ''}
    `;

    return li;
}

function formatTaskDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (includeTime) {
        return date.toLocaleDateString();
    }

    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '📅 Today';
    if (diffDays === 1) return '📅 Tomorrow';
    if (diffDays === -1) return '📅 Yesterday';
    if (diffDays < 0) return `📅 ${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `📅 In ${diffDays} days`;

    return '📅 ' + date.toLocaleDateString();
}

function getDateClass(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays < 0) return 'overdue';
    return '';
}

function shortenUrl(url) {
    if (url.length <= 40) return url;

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname + urlObj.search;

        if (domain.length >= 37) {
            return domain.substring(0, 37) + '...';
        }

        const availableLength = 40 - domain.length - 3;
        if (path.length > availableLength) {
            return domain + path.substring(0, availableLength) + '...';
        }

        return url;
    } catch {
        return url.substring(0, 37) + '...';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function toggleTaskComplete(taskId) {
    try {
        await ipcRenderer.invoke('complete-task', taskId);
        await loadTasks();
    } catch (error) {
        console.error('Error completing task:', error);
        alert('Error completing task: ' + error.message);
    }
}

async function moveTask(taskId, direction) {
    try {
        await ipcRenderer.invoke('move-task', taskId, direction);
        await loadTasks();
    } catch (error) {
        console.error('Error moving task:', error);
        alert('Error moving task: ' + error.message);
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

function setupDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item[draggable="true"]');

    taskItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
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

    const afterElement = getDragAfterElement(taskList, e.clientY);

    if (afterElement == null) {
        taskList.appendChild(draggedElement);
    } else {
        taskList.insertBefore(draggedElement, afterElement);
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
    const taskItems = [...document.querySelectorAll('.task-item[draggable="true"]')];
    const newOrder = taskItems.map(item => item.dataset.taskId);

    // Find which task moved and in which direction
    const oldOrder = tasks.filter(t => t.status === 'pending').map(t => t.id);

    for (let i = 0; i < newOrder.length; i++) {
        if (newOrder[i] !== oldOrder[i]) {
            const taskId = newOrder[i];
            const oldIndex = oldOrder.indexOf(taskId);
            const direction = i < oldIndex ? 'up' : 'down';
            const moves = Math.abs(i - oldIndex);

            try {
                // Make multiple moves to reach desired position
                for (let j = 0; j < moves; j++) {
                    await ipcRenderer.invoke('move-task', taskId, direction);
                }
                break;
            } catch (error) {
                console.error('Error updating task priority:', error);
            }
        }
    }

    // Reload tasks to reflect changes
    await loadTasks();
}

function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
        taskList.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        taskList.classList.remove('hidden');
    }
}

function showEmptyState(message = '📝 No tasks found') {
    emptyState.querySelector('p').textContent = message;
    emptyState.classList.remove('hidden');
    taskList.classList.add('hidden');
}

function hideEmptyState() {
    emptyState.classList.add('hidden');
    taskList.classList.remove('hidden');
}

async function handleImportTasks() {
    // Placeholder for import functionality
    alert('Import functionality will be implemented in the next phase');
}

async function handleExportTasks() {
    // Placeholder for export functionality
    alert('Export functionality will be implemented in the next phase');
}

// Global functions for onclick handlers
window.toggleTaskComplete = toggleTaskComplete;
window.moveTask = moveTask;
window.openUrl = openUrl;