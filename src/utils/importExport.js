/**
 * Import and export functionality for todo lists
 */

const fs = require('fs');
const path = require('path');
const TaskRepository = require('../storage/taskRepository');

class ImportExportManager {
  constructor() {
    this.taskRepo = new TaskRepository();
  }

  /**
   * Parse user's existing todo format
   */
  parseExistingTodoFormat(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const tasks = [];

    lines.forEach((line, index) => {
      // Skip headers like "To do:"
      if (line.trim() === 'To do:' || line.trim() === '') {
        return;
      }

      let content = line.trim();
      let status = 'pending';
      let urls = [];

      // Check for completion status
      if (content.endsWith('- Done')) {
        status = 'completed';
        content = content.replace(/ - Done$/, '');
      } else if (content.endsWith('- IN_PROGRESS')) {
        // Keep as pending but could add a note
        content = content.replace(/ - IN_PROGRESS$/, '') + ' (in progress)';
      } else if (content.endsWith('- Review')) {
        content = content.replace(/ - Review$/, '') + ' (needs review)';
      }

      // Extract URLs using regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const extractedUrls = content.match(urlRegex) || [];

      tasks.push({
        content: content.trim(),
        status: status,
        priority: index,
        extractedUrls: extractedUrls,
        createdAt: new Date().toISOString(),
        completedAt: status === 'completed' ? new Date().toISOString() : null
      });
    });

    return tasks;
  }

  /**
   * Import tasks from text file
   */
  async importFromTextFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const tasks = this.parseExistingTodoFormat(content);

      this.taskRepo.initialize();

      const imported = [];
      for (const taskData of tasks) {
        const task = this.taskRepo.createTask(
          taskData.content,
          null // No scheduling in existing format
        );

        if (taskData.status === 'completed') {
          this.taskRepo.markCompleted(task.id);
        }

        imported.push(task);
      }

      return imported;
    } catch (error) {
      throw new Error(`Failed to import tasks: ${error.message}`);
    }
  }

  /**
   * Import tasks from JSON format
   */
  async importFromJSON(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      this.taskRepo.initialize();

      const imported = [];
      const tasks = Array.isArray(data) ? data : data.tasks || [];

      for (const taskData of tasks) {
        const task = this.taskRepo.createTask(
          taskData.content,
          taskData.scheduledFor || null
        );

        if (taskData.status === 'completed') {
          this.taskRepo.markCompleted(task.id);
        }

        imported.push(task);
      }

      return imported;
    } catch (error) {
      throw new Error(`Failed to import JSON: ${error.message}`);
    }
  }

  /**
   * Export tasks to text format
   */
  async exportToTextFile(filePath, includeCompleted = true) {
    try {
      this.taskRepo.initialize();

      const pendingTasks = this.taskRepo.getAllPendingTasks();
      let completedTasks = [];

      if (includeCompleted) {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        completedTasks = this.taskRepo.getCompletedInRange(startDate, endDate);
      }

      let content = 'TODO List\n\n';

      if (pendingTasks.length > 0) {
        content += 'Pending:\n\n';
        pendingTasks.forEach((task, index) => {
          const scheduled = task.scheduledFor ? ` (scheduled: ${task.scheduledFor})` : '';
          content += `${task.content}${scheduled}\n\n`;
        });
      }

      if (completedTasks.length > 0) {
        content += 'Completed:\n\n';
        completedTasks.forEach(task => {
          const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '';
          content += `${task.content} - Done (${completedDate})\n\n`;
        });
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return { pending: pendingTasks.length, completed: completedTasks.length };
    } catch (error) {
      throw new Error(`Failed to export to text: ${error.message}`);
    }
  }

  /**
   * Export tasks to JSON format
   */
  async exportToJSON(filePath, includeCompleted = true) {
    try {
      this.taskRepo.initialize();

      let tasks = this.taskRepo.getAllPendingTasks();

      if (includeCompleted) {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const completedTasks = this.taskRepo.getCompletedInRange(startDate, endDate);
        tasks = [...tasks, ...completedTasks];
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalTasks: tasks.length,
        tasks: tasks.map(task => ({
          id: task.id,
          content: task.content,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          scheduledFor: task.scheduledFor,
          extractedUrls: task.extractedUrls
        }))
      };

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
      return { total: tasks.length };
    } catch (error) {
      throw new Error(`Failed to export to JSON: ${error.message}`);
    }
  }

  /**
   * Export tasks to CSV format
   */
  async exportToCSV(filePath, includeCompleted = true) {
    try {
      this.taskRepo.initialize();

      let tasks = this.taskRepo.getAllPendingTasks();

      if (includeCompleted) {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const completedTasks = this.taskRepo.getCompletedInRange(startDate, endDate);
        tasks = [...tasks, ...completedTasks];
      }

      // CSV headers
      let content = 'Content,Status,Priority,Created At,Completed At,Scheduled For,URLs\n';

      tasks.forEach(task => {
        const urls = task.extractedUrls ? task.extractedUrls.join('; ') : '';
        const row = [
          this.csvEscape(task.content),
          task.status,
          task.priority || '',
          task.createdAt || '',
          task.completedAt || '',
          task.scheduledFor || '',
          this.csvEscape(urls)
        ].join(',');

        content += row + '\n';
      });

      fs.writeFileSync(filePath, content, 'utf8');
      return { total: tasks.length };
    } catch (error) {
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Export tasks to Markdown format
   */
  async exportToMarkdown(filePath, includeCompleted = true) {
    try {
      this.taskRepo.initialize();

      const pendingTasks = this.taskRepo.getAllPendingTasks();
      let completedTasks = [];

      if (includeCompleted) {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        completedTasks = this.taskRepo.getCompletedInRange(startDate, endDate);
      }

      let content = '# TODO List\n\n';
      content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

      if (pendingTasks.length > 0) {
        content += '## 📋 Pending Tasks\n\n';
        pendingTasks.forEach((task, index) => {
          const scheduled = task.scheduledFor ? ` *(scheduled: ${task.scheduledFor})*` : '';
          content += `${index + 1}. ${task.content}${scheduled}\n`;

          if (task.extractedUrls && task.extractedUrls.length > 0) {
            task.extractedUrls.forEach(url => {
              content += `   - 🔗 [${url}](${url})\n`;
            });
          }
          content += '\n';
        });
      }

      if (completedTasks.length > 0) {
        content += '## ✅ Completed Tasks\n\n';
        completedTasks.forEach(task => {
          const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '';
          content += `- [x] ${task.content} *(completed: ${completedDate})*\n`;

          if (task.extractedUrls && task.extractedUrls.length > 0) {
            task.extractedUrls.forEach(url => {
              content += `   - 🔗 [${url}](${url})\n`;
            });
          }
          content += '\n';
        });
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return { pending: pendingTasks.length, completed: completedTasks.length };
    } catch (error) {
      throw new Error(`Failed to export to Markdown: ${error.message}`);
    }
  }

  /**
   * Escape CSV fields
   */
  csvEscape(field) {
    if (!field) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Get supported import formats
   */
  getSupportedImportFormats() {
    return ['txt', 'json'];
  }

  /**
   * Get supported export formats
   */
  getSupportedExportFormats() {
    return ['txt', 'json', 'csv', 'md'];
  }
}

module.exports = ImportExportManager;