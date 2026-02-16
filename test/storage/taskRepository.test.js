/**
 * Task Repository Integration Tests
 *
 * Tests the TaskRepository operations with real SQLite database
 * using the test database environment.
 */

const { setupTestDatabase, cleanupTestDatabase } = require('../helpers/testDatabase');
const TaskRepository = require('../../src/storage/taskRepository');

describe('TaskRepository - Edit Task Functionality', () => {
  let db;
  let taskRepo;

  beforeAll(async () => {
    db = await setupTestDatabase();
    taskRepo = new TaskRepository();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(() => {
    // Clear any existing test data between tests
    const { getTestDatabaseHelper } = require('../helpers/testDatabase');
    const helper = getTestDatabaseHelper();
    if (helper) {
      helper.clearTasks();
    }
  });

  describe('updateTaskContent', () => {
    it('should update task content and persist to database', () => {
      // Arrange - Create a task first
      const originalContent = 'Original task content #work';
      const task = taskRepo.createTask(originalContent);
      const taskId = task.id;

      // Act - Update the content
      const newContent = 'Updated task content #personal';
      const updatedTask = taskRepo.updateTaskContent(taskId, newContent);

      // Assert - Check returned task
      expect(updatedTask).not.toBeNull();
      expect(updatedTask.content).toBe(newContent);
      expect(updatedTask.id).toBe(taskId);

      // Assert - Verify database persistence
      const taskFromDb = taskRepo.getTaskById(taskId);
      expect(taskFromDb.content).toBe(newContent);
      expect(taskFromDb.updatedAt).not.toBe(task.createdAt);
    });

    it('should re-extract URLs when content is updated', () => {
      // Arrange
      const originalContent = 'Check out https://github.com';
      const task = taskRepo.createTask(originalContent);

      // Act - Update with new URL
      const newContent = 'Visit https://example.com and https://docs.github.com';
      const updatedTask = taskRepo.updateTaskContent(task.id, newContent);

      // Assert - URLs should be re-extracted
      expect(updatedTask.extractedUrls).toHaveLength(2);
      expect(updatedTask.extractedUrls).toContain('https://example.com');
      expect(updatedTask.extractedUrls).toContain('https://docs.github.com');

      // Assert - Verify database persistence of URLs
      const taskFromDb = taskRepo.getTaskById(task.id);
      expect(taskFromDb.extractedUrls).toHaveLength(2);
    });

    it('should re-extract tags when content is updated', () => {
      // Arrange
      const originalContent = 'Original task #work';
      const task = taskRepo.createTask(originalContent);

      // Act - Update with different tags
      const newContent = 'Updated task #personal #important';
      const updatedTask = taskRepo.updateTaskContent(task.id, newContent);

      // Assert - Tags should be re-extracted
      expect(updatedTask.tags).toHaveLength(2);
      expect(updatedTask.tags).toContain('personal');
      expect(updatedTask.tags).toContain('important');

      // Assert - Verify database persistence of tags
      const taskFromDb = taskRepo.getTaskById(task.id);
      expect(taskFromDb.tags).toContain('personal');
      expect(taskFromDb.tags).toContain('important');
    });

    it('should handle empty or whitespace content', () => {
      // Arrange
      const originalContent = 'Original task #work';
      const task = taskRepo.createTask(originalContent);

      // Act & Assert - Empty content should not be allowed
      expect(() => {
        taskRepo.updateTaskContent(task.id, '');
      }).toThrow();

      expect(() => {
        taskRepo.updateTaskContent(task.id, '   ');
      }).toThrow();
    });

    it('should return null for non-existent task ID', () => {
      // Act
      const result = taskRepo.updateTaskContent('non-existent-id', 'New content');

      // Assert
      expect(result).toBeNull();
    });

    it('should preserve other task properties when updating content', () => {
      // Arrange
      const originalContent = 'Original task #work';
      const task = taskRepo.createTask(originalContent);

      // Change status and priority
      taskRepo.changeTaskStatus(task.id, 'in_progress');

      // Get the task after status change to get accurate values
      const taskAfterStatusChange = taskRepo.getTaskById(task.id);
      const originalPriority = taskAfterStatusChange.priority;
      const originalCreatedAt = taskAfterStatusChange.createdAt;

      // Act - Update content
      const newContent = 'Updated task content #personal';
      const updatedTask = taskRepo.updateTaskContent(task.id, newContent);

      // Assert - Other properties should be preserved
      expect(updatedTask.status).toBe('in_progress');
      expect(updatedTask.priority).toBe(originalPriority);
      expect(updatedTask.createdAt).toBe(originalCreatedAt);
      expect(updatedTask.completedAt).toBeNull();
    });

    it('should update the updatedAt timestamp', () => {
      // Arrange
      const originalContent = 'Original task #work';
      const task = taskRepo.createTask(originalContent);
      const originalUpdatedAt = task.updatedAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        // Act
        const newContent = 'Updated task content';
        const updatedTask = taskRepo.updateTaskContent(task.id, newContent);

        // Assert
        expect(updatedTask.updatedAt).not.toBe(originalUpdatedAt);
        expect(new Date(updatedTask.updatedAt).getTime()).toBeGreaterThan(
          new Date(originalUpdatedAt).getTime()
        );
      }, 10);
    });
  });
});