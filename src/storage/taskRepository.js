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
        completed_at, scheduled_for, updated_at, extracted_urls, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      taskData.extractedUrls,
      taskData.tags
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
   * Get all active tasks (pending, in_progress, waiting) ordered by priority
   */
  getAllActiveTasks() {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status IN ('pending', 'in_progress', 'waiting')
      ORDER BY priority ASC
    `);

    const rows = selectStmt.all();
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get tasks by specific status
   */
  getTasksByStatus(status) {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status = ?
      ORDER BY
        CASE WHEN status = 'completed' THEN completed_at ELSE updated_at END DESC
    `);

    const rows = selectStmt.all(status);
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get tasks grouped by status
   */
  getTasksGroupedByStatus() {
    if (!this.db) this.initialize();

    return {
      active: this.getAllActiveTasks(),
      pending: this.getTasksByStatus(Task.STATUS.PENDING),
      in_progress: this.getTasksByStatus(Task.STATUS.IN_PROGRESS),
      waiting: this.getTasksByStatus(Task.STATUS.WAITING),
      completed: this.getTasksByStatus(Task.STATUS.COMPLETED)
    };
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
   * Change task status
   */
  changeTaskStatus(taskId, status) {
    if (!this.db) this.initialize();

    const task = this.getTaskById(taskId);
    if (!task) return null;

    task.setStatus(status);
    this.updateTask(task);

    return task;
  }

  /**
   * Mark task as in progress
   */
  markInProgress(taskId) {
    return this.changeTaskStatus(taskId, Task.STATUS.IN_PROGRESS);
  }

  /**
   * Mark task as waiting
   */
  markWaiting(taskId) {
    return this.changeTaskStatus(taskId, Task.STATUS.WAITING);
  }

  /**
   * Mark task as pending
   */
  markPending(taskId) {
    return this.changeTaskStatus(taskId, Task.STATUS.PENDING);
  }

  /**
   * Update task priorities based on new order
   */
  updateTaskPriorities(taskIdOrder) {
    if (!this.db) this.initialize();

    // Start transaction for atomic update
    const updateStmt = this.db.prepare(`
      UPDATE tasks
      SET priority = ?, updated_at = ?
      WHERE id = ?
    `);

    const transaction = this.db.transaction(() => {
      taskIdOrder.forEach((taskId, index) => {
        const now = new Date().toISOString();
        updateStmt.run(index, now, taskId);
      });
    });

    transaction();
    return true;
  }

  /**
   * Update task content
   */
  updateTaskContent(taskId, newContent) {
    if (!this.db) this.initialize();

    const task = this.getTaskById(taskId);
    if (!task) return null;

    // Update the task content and extract URLs and tags
    task.content = newContent;
    task.extractedUrls = task.extractUrls(newContent);
    task.tags = task.extractTags(newContent);
    task.updatedAt = new Date().toISOString();

    // Update in database
    const updateStmt = this.db.prepare(`
      UPDATE tasks
      SET content = ?, extracted_urls = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      task.content,
      JSON.stringify(task.extractedUrls),
      JSON.stringify(task.tags),
      task.updatedAt,
      taskId
    );

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
    if (!task || task.status === 'completed') return null;

    const allTasks = this.getAllActiveTasks();
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
        extracted_urls = ?, tags = ?
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
      taskData.tags,
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
        CASE
          WHEN status = 'completed' THEN 999999
          ELSE priority
        END,
        completed_at DESC
    `);

    const rows = selectStmt.all();
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get tasks filtered by work/personal tags
   * @param {string} filter - 'work', 'personal', or 'both'
   */
  getTasksFilteredByWorkPersonal(filter = 'both') {
    if (!this.db) this.initialize();

    let whereClause = '';
    let params = [];

    if (filter === 'work') {
      whereClause = `WHERE tags LIKE '%"work"%'`;
    } else if (filter === 'personal') {
      whereClause = `WHERE tags LIKE '%"personal"%'`;
    }
    // 'both' filter returns all tasks (no WHERE clause)

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY
        CASE
          WHEN status = 'completed' THEN 999999
          ELSE priority
        END,
        completed_at DESC
    `);

    const rows = selectStmt.all(...params);
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get tasks that contain a specific tag
   * @param {string} tag - tag to search for
   */
  getTasksByTag(tag) {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT * FROM tasks
      WHERE tags LIKE ?
      ORDER BY
        CASE
          WHEN status = 'completed' THEN 999999
          ELSE priority
        END,
        completed_at DESC
    `);

    const rows = selectStmt.all(`%"${tag}"%`);
    return rows.map(row => Task.fromJSON(row));
  }

  /**
   * Get all unique tags from all tasks
   */
  getAllTags() {
    if (!this.db) this.initialize();

    const selectStmt = this.db.prepare(`
      SELECT DISTINCT tags FROM tasks
      WHERE tags IS NOT NULL AND tags != ''
    `);

    const rows = selectStmt.all();
    const allTags = new Set();

    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags);
        if (Array.isArray(tags)) {
          tags.forEach(tag => allTags.add(tag));
        }
      } catch (error) {
        // Skip invalid JSON
      }
    });

    return Array.from(allTags).sort();
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