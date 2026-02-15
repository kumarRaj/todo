/**
 * Task model and business logic
 */

const { v4: uuidv4 } = require('uuid');
const { format, parseISO } = require('date-fns');

class Task {
  // Valid task statuses
  static STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    WAITING: 'waiting',
    COMPLETED: 'completed'
  };

  constructor({
    id = uuidv4(),
    content,
    priority = 0,
    status = Task.STATUS.PENDING,
    createdAt = new Date().toISOString(),
    completedAt = null,
    scheduledFor = null,
    updatedAt = new Date().toISOString(),
    extractedUrls = [],
    tags = []
  }) {
    this.id = id;
    this.content = content;
    this.priority = priority;
    this.status = status;
    this.createdAt = createdAt;
    this.completedAt = completedAt;
    this.scheduledFor = scheduledFor;
    this.updatedAt = updatedAt;
    this.extractedUrls = this.extractUrls(content);
    this.tags = this.extractTags(content);
  }

  /**
   * Extract URLs from task content using regex
   */
  extractUrls(content) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return content.match(urlRegex) || [];
  }

  /**
   * Extract hashtags from task content using regex
   */
  extractTags(content) {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex) || [];
    // Remove # prefix and convert to lowercase for consistency
    return matches.map(tag => tag.substring(1).toLowerCase());
  }

  /**
   * Mark task as completed
   */
  complete() {
    this.status = Task.STATUS.COMPLETED;
    this.completedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Mark task as in progress
   */
  startProgress() {
    this.status = Task.STATUS.IN_PROGRESS;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Mark task as waiting
   */
  setWaiting() {
    this.status = Task.STATUS.WAITING;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Change task status
   */
  setStatus(status) {
    if (!Object.values(Task.STATUS).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    this.status = status;
    this.updatedAt = new Date().toISOString();

    // Set completion timestamp when marked as completed
    if (status === Task.STATUS.COMPLETED) {
      this.completedAt = new Date().toISOString();
    } else if (this.completedAt) {
      // Clear completion timestamp if changed from completed
      this.completedAt = null;
    }

    return this;
  }

  /**
   * Get display info for status
   */
  getStatusDisplay() {
    const statusMap = {
      [Task.STATUS.PENDING]: { icon: '⚪', label: 'New task', color: '#6b7280' },
      [Task.STATUS.IN_PROGRESS]: { icon: '🚀', label: 'In Progress', color: '#f59e0b' },
      [Task.STATUS.WAITING]: { icon: '🕐', label: 'Waiting', color: '#8b5cf6' },
      [Task.STATUS.COMPLETED]: { icon: '✅', label: 'Completed', color: '#10b981' }
    };
    return statusMap[this.status] || statusMap[Task.STATUS.PENDING];
  }

  /**
   * Schedule task for a specific date
   */
  schedule(date) {
    this.scheduledFor = date instanceof Date ? date.toISOString().split('T')[0] : date;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Update task priority
   */
  setPriority(priority) {
    this.priority = priority;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      id: this.id,
      content: this.content,
      priority: this.priority,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      scheduledFor: this.scheduledFor,
      updatedAt: this.updatedAt,
      extractedUrls: JSON.stringify(this.extractedUrls),
      tags: JSON.stringify(this.tags)
    };
  }

  /**
   * Create Task from database row
   */
  static fromJSON(data) {
    return new Task({
      ...data,
      extractedUrls: data.extractedUrls ? JSON.parse(data.extractedUrls) : [],
      tags: data.tags ? JSON.parse(data.tags) : []
    });
  }
}

module.exports = Task;