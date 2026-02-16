/**
 * Test database helper utilities
 */

const DatabaseManager = require('../../src/storage/database');
const fs = require('fs');
const path = require('path');
const os = require('os');

class TestDatabaseHelper {
  constructor() {
    this.dbManager = null;
    this.testDbPath = null;
  }

  /**
   * Initialize a fresh test database
   */
  setupDatabase() {
    // Ensure we're in test mode
    process.env.TODO_ENV = 'test';

    // Clean up any existing test database first
    this.cleanupDatabase();

    // Create new database manager and initialize
    this.dbManager = new DatabaseManager();
    this.testDbPath = this.dbManager.getDbPath();

    // Initialize fresh database
    this.dbManager.initialize();

    return this.dbManager.getConnection();
  }

  /**
   * Clean up test database
   */
  cleanupDatabase() {
    // Close existing connection if it exists
    if (this.dbManager) {
      try {
        this.dbManager.close();
      } catch (error) {
        // Ignore close errors
      }
      this.dbManager = null;
    }

    // Calculate test db path if not already set
    if (!this.testDbPath) {
      const homeDir = os.homedir();
      const appDir = path.join(homeDir, '.todo-app');
      this.testDbPath = path.join(appDir, 'tasks-test.db');
    }

    // Remove test database file if it exists
    if (fs.existsSync(this.testDbPath)) {
      try {
        fs.unlinkSync(this.testDbPath);
      } catch (error) {
        // Ignore file deletion errors in tests
      }
    }
  }

  /**
   * Get database connection for tests
   */
  getConnection() {
    if (!this.dbManager) {
      throw new Error('Database not initialized. Call setupDatabase() first.');
    }
    return this.dbManager.getConnection();
  }

  /**
   * Clear all tasks from test database without recreating it
   */
  clearTasks() {
    if (!this.dbManager) {
      throw new Error('Database not initialized. Call setupDatabase() first.');
    }
    const db = this.dbManager.getConnection();
    db.prepare('DELETE FROM tasks').run();
  }

  /**
   * Verify test database path
   */
  getTestDbPath() {
    return this.testDbPath;
  }
}

// Global test database instance
let testDbHelper = null;

/**
 * Setup test database before each test suite
 */
function setupTestDatabase() {
  testDbHelper = new TestDatabaseHelper();
  return testDbHelper.setupDatabase();
}

/**
 * Cleanup test database after each test suite
 */
function cleanupTestDatabase() {
  if (testDbHelper) {
    testDbHelper.cleanupDatabase();
    testDbHelper = null;
  }
}

/**
 * Get current test database helper
 */
function getTestDatabaseHelper() {
  return testDbHelper;
}

module.exports = {
  TestDatabaseHelper,
  setupTestDatabase,
  cleanupTestDatabase,
  getTestDatabaseHelper
};