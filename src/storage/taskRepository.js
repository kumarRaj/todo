/**
 * Task repository for CRUD operations
 */

const Task = require('../core/task');
const DatabaseManager = require('./database');

class TaskRepository {
  constructor() {
    this.dbManager = new DatabaseManager();
    this.db = null;
  }

  /**
   * Initialize repository
   */
  initialize() {
    this.dbManager.initialize();
    this.db = this.dbManager.getConnection();
  }

  /**
   * Create a new task
   */
  createTask(content, scheduledFor = null) {
    if (!this.db) this.initialize();

    const task = new Task({ content, scheduledFor });

    // Set priority to be highest (lowest number) among pending tasks
    const maxPriorityResult = this.db.prepare(
      'SELECT MAX(priority) as maxPriority FROM tasks WHERE status = ?'
    ).get('pending');

    task.setPriority((maxPriorityResult.maxPriority || -1) + 1);

    const insertStmt = this.db.prepare(`
      INSERT INTO tasks (
        id, content, priority, status, created_at,
        completed_at, scheduled_for, updated_at, extracted_urls
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const taskData = task.toJSON();
    insertStmt.run(
      taskData.id,
      taskData.content,
      taskData.priority,
      taskData.status,
      taskData.createdAt,
      taskData.completedAt,
      taskData.scheduledFor,
      taskData.updatedAt,
      taskData.extractedUrls
    );

    return task;
  }

  /**
   * Get all pending tasks ordered by priority
   */
  getAllPendingTasks() {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status = 'pending'
      ORDER BY priority ASC
    `);

    const rows = selectStmt.all();
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get completed tasks in date range
   */
  getCompletedInRange(startDate, endDate) {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status = 'completed'
      AND completed_at >= ?
      AND completed_at <= ?
      ORDER BY completed_at DESC
    `);

    const rows = selectStmt.all(startDate, endDate);
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get task by ID
   */
  getTaskById(id) {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = selectStmt.get(id);

    return row ? Task.fromJSON(row) : null;
  }

  /**
   * Mark task as completed
   */
  markCompleted(taskId) {
    if (!this.db) this.initialize();

    const task = this.getTaskById(taskId);
    if (!task) return null;

    task.complete();
    this.updateTask(task);

    return task;
  }

  /**
   * Schedule a task
   */
  scheduleTask(taskId, date) {
    if (!this.db) this.initialize();

    const task = this.getTaskById(taskId);
    if (!task) return null;

    task.schedule(date);
    this.updateTask(task);

    return task;
  }

  /**
   * Move task to new priority position
   */
  moveTask(taskId, direction) {
    if (!this.db) this.initialize();

    const task = this.getTaskById(taskId);
    if (!task || task.status !== 'pending') return null;

    const allTasks = this.getAllPendingTasks();
    const currentIndex = allTasks.findIndex(t => t.id === taskId);

    if (currentIndex === -1) return null;

    let newIndex;
    if (direction === 'up') {
      newIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'down') {
      newIndex = Math.min(allTasks.length - 1, currentIndex + 1);
    } else {
      return null;
    }

    if (newIndex === currentIndex) return task;

    // Reorder tasks
    const reorderedTasks = [...allTasks];
    const [movedTask] = reorderedTasks.splice(currentIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    // Update priorities in database
    const transaction = this.db.transaction(() => {
      reorderedTasks.forEach((t, index) => {
        t.setPriority(index);
        this.updateTask(t);
      });
    });

    transaction();
    return this.getTaskById(taskId);
  }

  /**
   * Update existing task
   */
  updateTask(task) {
    if (!this.db) this.initialize();

    const updateStmt = this.db.prepare(`
      UPDATE tasks SET
        content = ?, priority = ?, status = ?,
        completed_at = ?, scheduled_for = ?, updated_at = ?,
        extracted_urls = ?
      WHERE id = ?
    `);

    const taskData = task.toJSON();
    updateStmt.run(
      taskData.content,
      taskData.priority,
      taskData.status,
      taskData.completedAt,
      taskData.scheduledFor,
      taskData.updatedAt,
      taskData.extractedUrls,
      taskData.id
    );
  }

  /**
   * Delete task
   */
  deleteTask(taskId) {
    if (!this.db) this.initialize();

    const deleteStmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = deleteStmt.run(taskId);

    return result.changes > 0;
  }

  /**
   * Get all tasks
   */
  getAllTasks() {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      ORDER BY
        CASE WHEN status = 'pending' THEN priority ELSE 999999 END,
        completed_at DESC
    `);

    const rows = selectStmt.all();
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Close database connection
   */
  close() {
    if (this.dbManager) {
      this.dbManager.close();
    }
  }
}

module.exports = TaskRepository;