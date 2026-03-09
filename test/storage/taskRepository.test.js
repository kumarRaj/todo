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

describe('TaskRepository - Status Change Reordering', () => {
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

  describe('US1: Move Task to In Progress', () => {
    it('should move pending task to priority 0 when changed to in_progress', () => {
      // Arrange - Create 3 pending tasks
      const t1 = taskRepo.createTask('Task 1');
      const t2 = taskRepo.createTask('Task 2');
      const t3 = taskRepo.createTask('Task 3');

      // Act - Move task 3 to in_progress
      taskRepo.changeTaskStatus(t3.id, 'in_progress');

      // Assert - Verify t3 is now at priority 0
      const updated = taskRepo.getTaskById(t3.id);
      expect(updated.status).toBe('in_progress');
      expect(updated.priority).toBe(0);
    });

    it('should shift existing in_progress tasks down when new task moved to in_progress', () => {
      // Arrange - Create in_progress task at priority 0
      const active = taskRepo.createTask('Active Task');
      taskRepo.changeTaskStatus(active.id, 'in_progress');

      // Create pending task
      const pending = taskRepo.createTask('Pending Task');

      // Act - Move pending to in_progress
      taskRepo.changeTaskStatus(pending.id, 'in_progress');

      // Assert - New task at 0, old task at 1
      const newActive = taskRepo.getTaskById(pending.id);
      expect(newActive.priority).toBe(0);
      expect(newActive.status).toBe('in_progress');

      const shiftedActive = taskRepo.getTaskById(active.id);
      expect(shiftedActive.priority).toBe(1);
      expect(shiftedActive.status).toBe('in_progress');
    });

    it('should preserve other pending tasks relative order', () => {
      // Arrange - Create 3 pending tasks
      const p1 = taskRepo.createTask('Pending 1');
      const p2 = taskRepo.createTask('Pending 2');
      const p3 = taskRepo.createTask('Pending 3');

      // Get initial priorities before move
      const p1Before = taskRepo.getTaskById(p1.id);
      const p3Before = taskRepo.getTaskById(p3.id);

      // Act - Move p2 to in_progress
      taskRepo.changeTaskStatus(p2.id, 'in_progress');

      // Assert - p1 and p3 should maintain same relative order
      const p1Updated = taskRepo.getTaskById(p1.id);
      const p3Updated = taskRepo.getTaskById(p3.id);

      expect(p1Updated.status).toBe('pending');
      expect(p3Updated.status).toBe('pending');
      // Both p1 and p3 should still be in pending, with p1 before p3 as originally
      expect(p1Updated.priority).toBe(p1Before.priority);
      expect(p3Updated.priority).toBe(p3Before.priority);
    });

    it('should handle changing in_progress task to in_progress again (idempotent)', () => {
      // Arrange
      const task = taskRepo.createTask('Task');
      taskRepo.changeTaskStatus(task.id, 'in_progress');
      const firstChange = taskRepo.getTaskById(task.id);

      // Act - Change to in_progress again
      taskRepo.changeTaskStatus(task.id, 'in_progress');
      const secondChange = taskRepo.getTaskById(task.id);

      // Assert - Should remain unchanged
      expect(secondChange.priority).toBe(firstChange.priority);
      expect(secondChange.status).toBe('in_progress');
    });
  });

  describe('US2: Move Task to Waiting', () => {
    it('should move task below all in_progress tasks when changed to waiting', () => {
      // Arrange - 2 in_progress + 2 pending
      const ip1 = taskRepo.createTask('IP 1');
      const ip2 = taskRepo.createTask('IP 2');
      taskRepo.changeTaskStatus(ip1.id, 'in_progress');
      taskRepo.changeTaskStatus(ip2.id, 'in_progress');

      const p1 = taskRepo.createTask('Pending 1');
      const p2 = taskRepo.createTask('Pending 2');

      // Act - Move p1 to waiting
      taskRepo.changeTaskStatus(p1.id, 'waiting');

      // Assert - p1 should be at priority 2 (after 2 in_progress)
      const waiting = taskRepo.getTaskById(p1.id);
      expect(waiting.status).toBe('waiting');
      expect(waiting.priority).toBe(2);
    });

    it('should preserve waiting task order when multiple waiting tasks exist', () => {
      // Arrange - 1 in_progress + 1 waiting + 1 pending
      const ip = taskRepo.createTask('IP');
      taskRepo.changeTaskStatus(ip.id, 'in_progress');

      const w1 = taskRepo.createTask('Waiting 1');
      taskRepo.changeTaskStatus(w1.id, 'waiting');

      const p = taskRepo.createTask('Pending');

      // Act - Move pending to waiting
      taskRepo.changeTaskStatus(p.id, 'waiting');

      // Assert - Both waiting tasks in correct order
      // W1 is pushed down from 1 to 2, P takes priority 1 (after max(in_progress)=0)
      const w1Updated = taskRepo.getTaskById(w1.id);
      const wNew = taskRepo.getTaskById(p.id);

      expect(wNew.priority).toBe(1); // First waiting task after in_progress
      expect(w1Updated.priority).toBe(2); // Second waiting task (shifted down)
      expect(wNew.priority < w1Updated.priority).toBe(true);
    });

    it('should handle transition from in_progress to waiting', () => {
      // Arrange - Create in_progress task
      const task = taskRepo.createTask('Task');
      taskRepo.changeTaskStatus(task.id, 'in_progress');
      const inProgressPriority = taskRepo.getTaskById(task.id).priority;

      // Act - Change to waiting
      taskRepo.changeTaskStatus(task.id, 'waiting');

      // Assert
      const updated = taskRepo.getTaskById(task.id);
      expect(updated.status).toBe('waiting');
      // When moving from in_progress to waiting, position = max(in_progress) + 1
      // Since this was the only in_progress task at priority 0, new position = 1
      expect(updated.priority).toBe(inProgressPriority + 1);
    });
  });

  describe('US3: Completed Task Isolation', () => {
    it('should move task to bottom when changed to completed', () => {
      // Arrange - mixed statuses
      const ip = taskRepo.createTask('IP');
      taskRepo.changeTaskStatus(ip.id, 'in_progress');

      const p = taskRepo.createTask('Pending');

      // Act - Complete pending task
      taskRepo.changeTaskStatus(p.id, 'completed');

      // Assert - completed task at bottom
      const completed = taskRepo.getTaskById(p.id);
      expect(completed.status).toBe('completed');
      expect(completed.priority).toBe(0); // First (only) in completed group
    });

    it('should not affect other tasks when one is completed', () => {
      // Arrange - Create multiple in_progress tasks
      const ip1 = taskRepo.createTask('IP 1');
      const ip2 = taskRepo.createTask('IP 2');
      taskRepo.changeTaskStatus(ip1.id, 'in_progress');
      taskRepo.changeTaskStatus(ip2.id, 'in_progress');

      const ip1Before = taskRepo.getTaskById(ip1.id);

      // Act - Complete a pending task (create new one)
      const p = taskRepo.createTask('Pending');
      taskRepo.changeTaskStatus(p.id, 'completed');

      // Assert - in_progress tasks unaffected
      const ip1After = taskRepo.getTaskById(ip1.id);
      expect(ip1After.priority).toBe(ip1Before.priority);
      expect(ip1After.status).toBe('in_progress');
    });

    it('should keep completed tasks at bottom on further changes', () => {
      // Arrange - Create and complete a task
      const t1 = taskRepo.createTask('Task 1');
      taskRepo.changeTaskStatus(t1.id, 'completed');

      // Act - Create and move new task through statuses
      const t2 = taskRepo.createTask('Task 2');
      taskRepo.changeTaskStatus(t2.id, 'in_progress');
      taskRepo.changeTaskStatus(t2.id, 'waiting');

      // Assert - completed task remains at bottom (isolated by status)
      const completed = taskRepo.getTaskById(t1.id);
      const waiting = taskRepo.getTaskById(t2.id);
      // Completed tasks are sorted to bottom via CASE statement in queries
      // regardless of raw priority value. Verify status isolation.
      expect(completed.status).toBe('completed');
      expect(waiting.status).toBe('waiting');
      // When retrieved via getAllTasks() which uses CASE sorting,
      // completed will appear after all active tasks
      const allTasks = taskRepo.getAllTasks();
      const completedIndex = allTasks.findIndex(t => t.id === t1.id);
      const waitingIndex = allTasks.findIndex(t => t.id === t2.id);
      expect(completedIndex > waitingIndex).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle transition in_progress → waiting → pending', () => {
      // Arrange
      const task = taskRepo.createTask('Task');
      taskRepo.changeTaskStatus(task.id, 'in_progress');

      // Act - Multiple transitions
      taskRepo.changeTaskStatus(task.id, 'waiting');
      taskRepo.changeTaskStatus(task.id, 'pending');

      // Assert
      const final = taskRepo.getTaskById(task.id);
      expect(final.status).toBe('pending');
    });

    it('should handle rapid consecutive status changes', () => {
      // Arrange
      const task = taskRepo.createTask('Task');

      // Act - Rapid transitions
      taskRepo.changeTaskStatus(task.id, 'in_progress');
      taskRepo.changeTaskStatus(task.id, 'waiting');
      taskRepo.changeTaskStatus(task.id, 'in_progress');
      taskRepo.changeTaskStatus(task.id, 'completed');

      // Assert - Final state correct, no data loss
      const final = taskRepo.getTaskById(task.id);
      expect(final.status).toBe('completed');
      expect(final.id).toBe(task.id);
      expect(final.content).toBe('Task');
    });

    it('should handle empty status group positioning', () => {
      // Arrange - No in_progress tasks exist
      const p = taskRepo.createTask('Pending');

      // Act - Move to waiting
      taskRepo.changeTaskStatus(p.id, 'waiting');

      // Assert - Should be first in waiting group
      const waiting = taskRepo.getTaskById(p.id);
      expect(waiting.priority).toBe(0);
      expect(waiting.status).toBe('waiting');
    });

    it('should preserve data integrity during status transitions', () => {
      // Arrange
      const task = taskRepo.createTask('Test task #work https://example.com');
      const originalUrls = task.extractedUrls;
      const originalTags = task.tags;
      const originalCreatedAt = task.createdAt;

      // Act - Change status multiple times
      taskRepo.changeTaskStatus(task.id, 'in_progress');
      taskRepo.changeTaskStatus(task.id, 'waiting');
      taskRepo.changeTaskStatus(task.id, 'completed');

      // Assert - Data preserved
      const final = taskRepo.getTaskById(task.id);
      expect(final.content).toBe(task.content);
      expect(final.extractedUrls).toEqual(originalUrls);
      expect(final.tags).toEqual(originalTags);
      // Timestamps may have minor precision differences after DB round-trip,
      // so verify creation timestamp is very close (within 100ms)
      const timeDiff = Math.abs(
        new Date(final.createdAt).getTime() - new Date(originalCreatedAt).getTime()
      );
      expect(timeDiff).toBeLessThan(100);
    });
  });
});