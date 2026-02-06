/**
 * Task model and business logic
 */

const { v4: uuidv4 } = require('uuid');
const { format, parseISO } = require('date-fns');

class Task {
  constructor({
    id = uuidv4(),
    content,
    priority = 0,
    status = 'pending',
    createdAt = new Date().toISOString(),
    completedAt = null,
    scheduledFor = null,
    updatedAt = new Date().toISOString(),
    extractedUrls = []
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
  }

  /**
   * Extract URLs from task content using regex
   */
  extractUrls(content) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return content.match(urlRegex) || [];
  }

  /**
   * Mark task as completed
   */
  complete() {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
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
      extractedUrls: JSON.stringify(this.extractedUrls)
    };
  }

  /**
   * Create Task from database row
   */
  static fromJSON(data) {
    return new Task({
      ...data,
      extractedUrls: data.extractedUrls ? JSON.parse(data.extractedUrls) : []
    });
  }
}

module.exports = Task;