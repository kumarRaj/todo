/**
 * Test for GUI IPC edit workflow to identify why entire tasks disappear
 *
 * This test simulates the exact IPC calls made by the GUI during editing
 * to identify where the task gets lost.
 */

const TaskRepository = require('../../src/storage/taskRepository');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

describe('GUI IPC Edit Workflow', () => {
    let repo;
    let testDbPath;

    beforeEach(() => {
        // Use test database
        process.env.TODO_ENV = 'test';
        testDbPath = path.join(require('os').homedir(), '.todo-app', 'tasks-test.db');

        // Remove test database if it exists
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }

        repo = new TaskRepository();
        repo.initialize();
    });

    afterEach(() => {
        if (repo) {
            repo.close();
        }
        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        delete process.env.TODO_ENV;
    });

    test('simulate exact GUI edit workflow - update-task-content IPC call', async () => {
        // Create a task with hashtags like GUI would
        const originalContent = 'Debug the payment system #work #urgent';
        const task = repo.createTask(originalContent);
        const taskId = task.id;

        console.log('Original task created:', task);

        // Verify task exists and is visible in work filter
        let workTasks = repo.getTasksFilteredByWorkPersonal('work');
        expect(workTasks).toHaveLength(1);
        expect(workTasks[0].id).toBe(taskId);

        // Simulate what happens when user edits in GUI
        // User sees stripped content: "Debug the payment system" (no hashtags)
        // User edits to: "Debug the payment system - found the issue"
        const strippedContent = originalContent.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
        const editedContent = strippedContent + ' - found the issue';

        console.log('Stripped content:', strippedContent);
        console.log('Edited content:', editedContent);

        // This is the IPC call made by the GUI when saving edit
        try {
            const result = await repo.updateTaskContent(taskId, editedContent);
            console.log('Update result:', result);
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }

        // Check if task still exists
        const updatedTask = repo.getTaskById(taskId);
        console.log('Updated task:', updatedTask);

        expect(updatedTask).toBeTruthy();
        expect(updatedTask.content).toBe(editedContent);

        // Check if task is still in work filter
        workTasks = repo.getTasksFilteredByWorkPersonal('work');
        console.log('Work tasks after update:', workTasks);

        // This is where the bug manifests - task disappears from work filter
        expect(workTasks).toHaveLength(1); // This may fail due to the bug
    });

    test('trace step-by-step what happens during edit', async () => {
        // Create task
        const originalContent = 'Fix authentication bug #work';
        const task = repo.createTask(originalContent);
        const taskId = task.id;

        console.log('Step 1 - Original task:', {
            id: task.id,
            content: task.content,
            tags: task.tags
        });

        // Get task as GUI would for editing
        const taskForEdit = repo.getTaskById(taskId);
        console.log('Step 2 - Task retrieved for edit:', {
            id: taskForEdit.id,
            content: taskForEdit.content,
            tags: taskForEdit.tags
        });

        // Simulate stripped content shown in GUI
        const strippedContent = taskForEdit.content.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
        console.log('Step 3 - Stripped content shown to user:', strippedContent);

        // User edits (typical case - just adds more text)
        const editedContent = strippedContent + ' - tested locally';
        console.log('Step 4 - User edited content:', editedContent);

        // Update task (this is where the issue might occur)
        const updatedTask = repo.updateTaskContent(taskId, editedContent);
        console.log('Step 5 - Updated task returned:', {
            id: updatedTask?.id,
            content: updatedTask?.content,
            tags: updatedTask?.tags
        });

        // Check what's in database
        const taskFromDb = repo.getTaskById(taskId);
        console.log('Step 6 - Task from database:', {
            id: taskFromDb?.id,
            content: taskFromDb?.content,
            tags: taskFromDb?.tags
        });

        // Check all tasks
        const allTasks = repo.getAllTasks();
        console.log('Step 7 - All tasks in database:', allTasks.length);

        // Check filtered tasks
        const workTasks = repo.getTasksFilteredByWorkPersonal('work');
        console.log('Step 8 - Tasks in work filter:', workTasks.length);

        const bothTasks = repo.getTasksFilteredByWorkPersonal('both');
        console.log('Step 9 - Tasks in both filter:', bothTasks.length);

        // Assertions
        expect(taskFromDb).toBeTruthy();
        expect(taskFromDb.content).toBe(editedContent);
        expect(allTasks).toHaveLength(1);
        expect(bothTasks).toHaveLength(1);

        // This is the critical test - does it still appear in work filter?
        console.log('Final check - work filter should contain 1 task but contains:', workTasks.length);
        expect(workTasks).toHaveLength(1);
    });

    test('check if task gets deleted vs just filtered out', async () => {
        // Create task
        const task = repo.createTask('Test task #work');
        const taskId = task.id;

        // Edit to remove hashtags
        const editedContent = 'Test task - updated';
        repo.updateTaskContent(taskId, editedContent);

        // Check if task exists at all
        const taskExists = repo.getTaskById(taskId);
        const allTasks = repo.getAllTasks();
        const bothTasks = repo.getTasksFilteredByWorkPersonal('both');
        const workTasks = repo.getTasksFilteredByWorkPersonal('work');

        console.log('Task exists:', !!taskExists);
        console.log('All tasks count:', allTasks.length);
        console.log('Both filter count:', bothTasks.length);
        console.log('Work filter count:', workTasks.length);

        // Task should exist but not be in work filter
        expect(taskExists).toBeTruthy();
        expect(allTasks).toHaveLength(1);
        expect(bothTasks).toHaveLength(1);
        expect(workTasks).toHaveLength(0); // This is expected - no work tag
    });
});