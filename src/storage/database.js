/**
 * SQLite database setup and management
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = this.getDbPath();
  }

  /**
   * Get database file path in user's home directory
   */
  getDbPath() {
    const homeDir = os.homedir();
    const appDir = path.join(homeDir, '.todo-app');

    // Create app directory if it doesn't exist
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    return path.join(appDir, 'tasks.db');
  }

  /**
   * Initialize database connection and create tables
   */
  initialize() {
    try {
      this.db = new Database(this.dbPath);
      this.createTables();
      this.migrate(); // Run migrations before creating indexes
      this.createIndexes();
      console.log(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create the tasks table
   */
  createTables() {
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        completed_at TEXT,
        scheduled_for TEXT,
        updated_at TEXT NOT NULL,
        extracted_urls TEXT,
        tags TEXT
      )
    `;

    this.db.exec(createTasksTable);
  }

  /**
   * Create database indexes for performance
   */
  createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_priority ON tasks(priority, status)',
      'CREATE INDEX IF NOT EXISTS idx_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_scheduled ON tasks(scheduled_for)',
      'CREATE INDEX IF NOT EXISTS idx_completed_range ON tasks(completed_at)',
      'CREATE INDEX IF NOT EXISTS idx_tags ON tasks(tags)'
    ];

    indexes.forEach(indexSql => {
      this.db.exec(indexSql);
    });
  }

  /**
   * Get database connection
   */
  getConnection() {
    if (!this.db) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Run database migrations (for future schema updates)
   */
  migrate() {
    const currentVersion = this.getDatabaseVersion();
    console.log(`Database version: ${currentVersion}`);

    // Migration v1: Add tags column
    if (currentVersion < 1) {
      console.log('Migrating database to version 1: Adding tags column...');
      try {
        // Check if tags column already exists
        const tableInfo = this.db.pragma('table_info(tasks)');
        const hasTagsColumn = tableInfo.some(column => column.name === 'tags');

        if (!hasTagsColumn) {
          this.db.exec('ALTER TABLE tasks ADD COLUMN tags TEXT');
          this.db.exec('CREATE INDEX IF NOT EXISTS idx_tags ON tasks(tags)');
        }

        this.setDatabaseVersion(1);
        console.log('Migration to version 1 completed successfully');
      } catch (error) {
        console.error('Migration to version 1 failed:', error);
        throw error;
      }
    }

    // Migration v2: Add default #work tags to existing tasks
    if (currentVersion < 2) {
      console.log('Migrating database to version 2: Adding default #work tags...');
      try {
        // Get all tasks that don't have tags or have empty/null tags
        const tasksNeedingTags = this.db.prepare(`
          SELECT id, content, tags FROM tasks
          WHERE tags IS NULL OR tags = '' OR tags = '[]'
        `).all();

        console.log(`Found ${tasksNeedingTags.length} tasks that need #work tags`);

        if (tasksNeedingTags.length > 0) {
          const updateStmt = this.db.prepare(`
            UPDATE tasks
            SET content = ?, tags = ?, updated_at = ?
            WHERE id = ?
          `);

          const transaction = this.db.transaction(() => {
            tasksNeedingTags.forEach(task => {
              // Add #work to content if no hashtags exist
              let newContent = task.content;
              if (!/#\w+/.test(newContent)) {
                newContent += ' #work';
              }

              // Set tags to ['work']
              const newTags = JSON.stringify(['work']);
              const updatedAt = new Date().toISOString();

              updateStmt.run(newContent, newTags, updatedAt, task.id);
            });
          });

          transaction();
          console.log(`Updated ${tasksNeedingTags.length} tasks with #work tags`);
        }

        this.setDatabaseVersion(2);
        console.log('Migration to version 2 completed successfully');
      } catch (error) {
        console.error('Migration to version 2 failed:', error);
        throw error;
      }
    }
  }

  /**
   * Get database version for migrations
   */
  getDatabaseVersion() {
    try {
      const result = this.db.pragma('user_version');
      return result[0].user_version;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set database version
   */
  setDatabaseVersion(version) {
    this.db.pragma(`user_version = ${version}`);
  }
}

module.exports = DatabaseManager;