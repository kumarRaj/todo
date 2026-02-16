/**
 * Test for GUI edit functionality bug where tasks disappear after editing
 *
 * Bug: When editing a task in the GUI, hashtags are lost because the edit
 * function retrieves content from the display element which has hashtags stripped.
 */

const TaskRepository = require('../../src/storage/taskRepository');
const path = require('path');
const fs = require('fs');

describe('GUI Edit Functionality Bug', () => {
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

    test('repository behavior: editing content without hashtags loses tags (backend behavior)', async () => {
        // This test documents the correct BACKEND behavior:
        // When content without hashtags is provided, tags are lost (this is expected)
        // The FIX is in the GUI layer to prevent this from happening unintentionally

        // Create a task with hashtags
        const originalContent = 'Fix the authentication bug #work #urgent';
        const task = repo.createTask(originalContent);
        const taskId = task.id;

        // Verify task is created with tags
        let taskFromDb = repo.getTaskById(taskId);
        expect(taskFromDb).toBeTruthy();
        expect(taskFromDb.content).toBe(originalContent);
        expect(taskFromDb.tags).toEqual(['work', 'urgent']);

        // Verify task appears in work filter
        let workTasks = repo.getTasksFilteredByWorkPersonal('work');
        expect(workTasks).toHaveLength(1);
        expect(workTasks[0].id).toBe(taskId);

        // Simulate what happens when content WITHOUT hashtags is sent to backend
        // (This simulates the OLD buggy GUI behavior)
        const contentWithoutHashtags = 'Fix the authentication bug - investigated today';

        // Update task content with no hashtags
        repo.updateTaskContent(taskId, contentWithoutHashtags);

        // Get updated task
        taskFromDb = repo.getTaskById(taskId);
        expect(taskFromDb.content).toBe(contentWithoutHashtags);

        // EXPECTED BACKEND BEHAVIOR: Tags are lost because content has no hashtags
        expect(taskFromDb.tags).toEqual([]); // This is correct backend behavior

        // EXPECTED BACKEND BEHAVIOR: Task no longer appears in work filter
        workTasks = repo.getTasksFilteredByWorkPersonal('work');
        expect(workTasks).toHaveLength(0); // Task filtered out due to no work tag

        // Task should still exist in 'both' filter
        const allTasks = repo.getTasksFilteredByWorkPersonal('both');
        expect(allTasks).toHaveLength(1);
        expect(allTasks[0].id).toBe(taskId);
    });

    test('proper edit should preserve hashtags when included in new content', () => {
        // Create task with hashtags
        const originalContent = 'Review pull request #work';
        const task = repo.createTask(originalContent);
        const taskId = task.id;

        // Proper edit - user manually adds hashtags back
        const editedContent = 'Review pull request and merge #work #done';
        repo.updateTaskContent(taskId, editedContent);

        // Task should preserve work tag and add done tag
        const updatedTask = repo.getTaskById(taskId);
        expect(updatedTask.tags).toEqual(['work', 'done']);

        // Should still appear in work filter
        const workTasks = repo.getTasksFilteredByWorkPersonal('work');
        expect(workTasks).toHaveLength(1);
    });

    test('editing task without hashtags should work normally', () => {
        // Create task without hashtags
        const originalContent = 'Buy groceries';
        const task = repo.createTask(originalContent + ' #work'); // Gets default work tag
        const taskId = task.id;

        // Edit without hashtags
        const editedContent = 'Buy groceries and milk';
        repo.updateTaskContent(taskId, editedContent);

        // Should lose tags (this is expected when user removes hashtags)
        const updatedTask2 = repo.getTaskById(taskId);
        expect(updatedTask2.tags).toEqual([]);

        // Should not appear in work filter
        const workTasks = repo.getTasksFilteredByWorkPersonal('work');
        expect(workTasks).toHaveLength(0);
    });
});