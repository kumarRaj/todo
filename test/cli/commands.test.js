/**
 * CLI Commands Tests
 *
 * Tests CLI command workflows end-to-end with test database
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { setupTestDatabase, cleanupTestDatabase } = require('../helpers/testDatabase');

const execAsync = promisify(exec);

// Helper to run CLI commands with test environment
async function runCLICommand(command) {
  const fullCommand = `TODO_ENV=test node src/cli/index.js ${command}`;
  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd: process.cwd()
    });
    return { stdout, stderr, success: true };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      success: false,
      error: error.message
    };
  }
}

describe('CLI Commands - Edit Task Functionality', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clear test data before each test
    const { getTestDatabaseHelper } = require('../helpers/testDatabase');
    const helper = getTestDatabaseHelper();
    if (helper) {
      helper.clearTasks();
    }
  });

  describe('edit command', () => {
    it('should edit an existing task by index', async () => {
      // Arrange - Add a task first
      await runCLICommand('add "Original task content"');

      // Act - Edit the task
      const editResult = await runCLICommand('edit 1 "Updated task content"');

      // Assert - Command should succeed
      expect(editResult.success).toBe(true);
      expect(editResult.stdout).toContain('✅ Updated task:');
      expect(editResult.stdout).toContain('Updated task content');

      // Verify the task was actually updated by listing
      const listResult = await runCLICommand('list');
      expect(listResult.stdout).toContain('Updated task content');
      expect(listResult.stdout).not.toContain('Original task content');
    });

    it('should update task tags when editing content', async () => {
      // Arrange - Add a task with work tag
      await runCLICommand('add "Original task #work"');

      // Act - Edit to change tags
      const editResult = await runCLICommand('edit 1 "Updated task #personal #urgent"');

      // Assert
      expect(editResult.success).toBe(true);
      expect(editResult.stdout).toContain('Updated task #personal #urgent');

      // Verify tags were updated
      const listResult = await runCLICommand('list');
      expect(listResult.stdout).toContain('#personal #urgent');
      expect(listResult.stdout).not.toContain('#work');
    });

    it('should update task URLs when editing content', async () => {
      // Arrange - Add a task with URL
      await runCLICommand('add "Check https://old-site.com"');

      // Act - Edit to change URL
      const editResult = await runCLICommand('edit 1 "Visit https://new-site.com and https://docs.example.com"');

      // Assert
      expect(editResult.success).toBe(true);
      expect(editResult.stdout).toContain('🔗 URLs detected:');
      expect(editResult.stdout).toContain('https://new-site.com');
      expect(editResult.stdout).toContain('https://docs.example.com');
    });

    it('should handle editing non-existent task index', async () => {
      // Act - Try to edit non-existent task
      const editResult = await runCLICommand('edit 999 "New content"');

      // Assert
      expect(editResult.success).toBe(false);
      expect(editResult.stderr).toContain('❌ Task not found');
    });

    it('should handle empty or whitespace content', async () => {
      // Arrange - Add a task first
      await runCLICommand('add "Original task"');

      // Act - Try to edit with empty content
      const editResult = await runCLICommand('edit 1 ""');

      // Assert
      expect(editResult.success).toBe(false);
      expect(editResult.stderr).toContain('❌ Task content cannot be empty');
    });

    it('should preserve task status when editing content', async () => {
      // Arrange - Add and complete a task
      await runCLICommand('add "Task to complete"');
      await runCLICommand('complete 1');

      // Act - Edit the completed task
      const editResult = await runCLICommand('edit 1 "Updated completed task"');

      // Assert - Task should still be completed
      expect(editResult.success).toBe(true);

      // Verify by listing completed tasks
      const listResult = await runCLICommand('list --completed');
      expect(listResult.stdout).toContain('Updated completed task');
    });

    it('should show helpful message for edit command usage', async () => {
      // Act - Run edit command without arguments
      const helpResult = await runCLICommand('edit --help');

      // Assert
      expect(helpResult.success).toBe(true);
      expect(helpResult.stdout).toContain('edit <index> <content>');
      expect(helpResult.stdout).toContain('Edit an existing task');
    });

    it('should handle editing tasks with special characters', async () => {
      // Arrange
      await runCLICommand('add "Original task"');

      // Act - Edit with special characters
      const editResult = await runCLICommand('edit 1 "Updated task with émojis 🚀 and symbols @#$%"');

      // Assert
      expect(editResult.success).toBe(true);
      expect(editResult.stdout).toContain('Updated task with émojis 🚀 and symbols @#$%');
    });
  });

  describe('edit command edge cases', () => {
    it('should handle editing task with quotes in content', async () => {
      // Arrange
      await runCLICommand('add "Original task"');

      // Act - Edit with quoted content
      const editResult = await runCLICommand('edit 1 "Task with \\"quotes\\" inside"');

      // Assert
      expect(editResult.success).toBe(true);
      expect(editResult.stdout).toContain('Task with "quotes" inside');
    });

    it('should maintain task priority order when editing', async () => {
      // Arrange - Add multiple tasks
      await runCLICommand('add "First task"');
      await runCLICommand('add "Second task"');
      await runCLICommand('add "Third task"');

      // Act - Edit the middle task
      await runCLICommand('edit 2 "Updated second task"');

      // Assert - Order should be maintained
      const listResult = await runCLICommand('list');
      const lines = listResult.stdout.split('\n').filter(line => line.match(/^\d+\./));
      expect(lines[0]).toContain('First task');
      expect(lines[1]).toContain('Updated second task');
      expect(lines[2]).toContain('Third task');
    });
  });
});