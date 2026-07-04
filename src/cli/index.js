#!/usr/bin/env node

/**
 * CLI entry point for todo application
 */

const { Command } = require('commander');
const TaskRepository = require('../storage/taskRepository');
const { formatDate, parseDate } = require('../utils/dateHelpers');
const { openUrl } = require('../utils/urlHelpers');
const ImportExportManager = require('../utils/importExport');

const program = new Command();
const taskRepo = new TaskRepository();

// Ensure clean shutdown
process.on('SIGINT', () => {
  taskRepo.close();
  process.exit(0);
});

program
  .name('todo')
  .description('CLI TODO management application')
  .version('1.0.0');

// Add a new task
program
  .command('add <content>')
  .description('Add a new task')
  .option('-s, --schedule <date>', 'Schedule task for specific date (YYYY-MM-DD)')
  .action((content, options) => {
    try {
      // Add #work tag if no tags are present
      if (!/#\w+/.test(content)) {
        content += ' #work';
      }

      const scheduledFor = options.schedule ? parseDate(options.schedule) : null;
      const task = taskRepo.createTask(content, scheduledFor);

      console.log(`✅ Added task: ${task.content}`);
      if (task.scheduledFor) {
        console.log(`📅 Scheduled for: ${formatDate(task.scheduledFor)}`);
      }
      if (task.extractedUrls.length > 0) {
        console.log(`🔗 URLs detected: ${task.extractedUrls.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error adding task:', error.message);
      process.exit(1);
    }
  });

// List tasks
program
  .command('list')
  .alias('ls')
  .description('List all pending tasks')
  .option('-a, --all', 'Show all tasks (pending and completed)')
  .option('-c, --completed', 'Show only completed tasks')
  .option('-t, --tag <tag>', 'Filter tasks by tag (e.g. work, personal)')
  .action((options) => {
    try {
      let tasks;

      if (options.tag) {
        const tag = options.tag.replace(/^#/, '');
        tasks = taskRepo.getTasksByTag(tag);
      } else if (options.all) {
        tasks = taskRepo.getAllTasks();
      } else if (options.completed) {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        tasks = taskRepo.getCompletedInRange(startDate, endDate);
      } else {
        tasks = taskRepo.getAllPendingTasks();
      }

      if (tasks.length === 0) {
        console.log('📝 No tasks found');
        return;
      }

      const printTask = (task, prefix) => {
        const scheduled = task.scheduledFor ? ` 📅 ${formatDate(task.scheduledFor)}` : '';
        const completedAt = task.completedAt ? ` (completed ${formatDate(task.completedAt)})` : '';
        console.log(`${prefix} ${task.content}${scheduled}${completedAt}`);
        if (task.extractedUrls.length > 0) {
          task.extractedUrls.forEach(url => console.log(`    🔗 ${url}`));
        }
      };

      if (options.tag) {
        const pending = tasks.filter(t => t.status !== 'completed');
        const completed = tasks.filter(t => t.status === 'completed');

        console.log('\n📋 Tasks:\n');
        if (pending.length === 0) {
          console.log('  No pending tasks');
        } else {
          pending.forEach((task, i) => printTask(task, `${i + 1}.`));
        }

        console.log('\n✅ Completed:\n');
        if (completed.length === 0) {
          console.log('  No completed tasks');
        } else {
          completed.forEach((task, i) => printTask(task, `${i + 1}.`));
        }
      } else {
        console.log('\n📋 Tasks:\n');
        tasks.forEach((task, index) => {
          const prefix = options.all ?
            (task.status === 'pending' ? '⭕' : '✅') :
            `${index + 1}.`;
          printTask(task, prefix);
        });
      }
      console.log();
    } catch (error) {
      console.error('❌ Error listing tasks:', error.message);
      process.exit(1);
    }
  });

// Complete a task
program
  .command('complete <index>')
  .alias('done')
  .description('Mark a task as completed')
  .action((indexStr) => {
    try {
      const index = parseInt(indexStr) - 1;
      const pendingTasks = taskRepo.getAllPendingTasks();

      if (index < 0 || index >= pendingTasks.length) {
        console.error('❌ Invalid task index');
        process.exit(1);
      }

      const task = taskRepo.markCompleted(pendingTasks[index].id);
      console.log(`✅ Completed: ${task.content}`);
    } catch (error) {
      console.error('❌ Error completing task:', error.message);
      process.exit(1);
    }
  });

// Move task priority
program
  .command('move <index> <direction>')
  .description('Move task up or down in priority')
  .action((indexStr, direction) => {
    try {
      const index = parseInt(indexStr) - 1;
      const pendingTasks = taskRepo.getAllPendingTasks();

      if (index < 0 || index >= pendingTasks.length) {
        console.error('❌ Invalid task index');
        process.exit(1);
      }

      if (!['up', 'down'].includes(direction)) {
        console.error('❌ Direction must be "up" or "down"');
        process.exit(1);
      }

      const task = taskRepo.moveTask(pendingTasks[index].id, direction);
      console.log(`🔄 Moved task ${direction}: ${task.content}`);
    } catch (error) {
      console.error('❌ Error moving task:', error.message);
      process.exit(1);
    }
  });

// Schedule task
program
  .command('schedule <index> <date>')
  .description('Schedule a task for specific date (YYYY-MM-DD)')
  .action((indexStr, dateStr) => {
    try {
      const index = parseInt(indexStr) - 1;
      const pendingTasks = taskRepo.getAllPendingTasks();

      if (index < 0 || index >= pendingTasks.length) {
        console.error('❌ Invalid task index');
        process.exit(1);
      }

      const date = parseDate(dateStr);
      const task = taskRepo.scheduleTask(pendingTasks[index].id, date);

      console.log(`📅 Scheduled task for ${formatDate(date)}: ${task.content}`);
    } catch (error) {
      console.error('❌ Error scheduling task:', error.message);
      process.exit(1);
    }
  });

// Open URLs from a task
program
  .command('open <index>')
  .description('Open URLs from a task in browser')
  .action((indexStr) => {
    try {
      const index = parseInt(indexStr) - 1;
      const pendingTasks = taskRepo.getAllPendingTasks();

      if (index < 0 || index >= pendingTasks.length) {
        console.error('❌ Invalid task index');
        process.exit(1);
      }

      const task = pendingTasks[index];

      if (task.extractedUrls.length === 0) {
        console.log('🔗 No URLs found in this task');
        return;
      }

      console.log(`🔗 Opening ${task.extractedUrls.length} URL(s)...`);
      task.extractedUrls.forEach(url => {
        console.log(`Opening: ${url}`);
        openUrl(url);
      });
    } catch (error) {
      console.error('❌ Error opening URLs:', error.message);
      process.exit(1);
    }
  });

// Import tasks
program
  .command('import <file>')
  .description('Import tasks from a file (supports .txt, .json)')
  .action(async (filePath) => {
    try {
      const importManager = new ImportExportManager();
      const extension = filePath.split('.').pop().toLowerCase();

      let imported;
      if (extension === 'txt') {
        imported = await importManager.importFromTextFile(filePath);
      } else if (extension === 'json') {
        imported = await importManager.importFromJSON(filePath);
      } else {
        console.error('❌ Unsupported file format. Use .txt or .json files.');
        process.exit(1);
      }

      console.log(`✅ Imported ${imported.length} tasks from ${filePath}`);

      // Show summary
      const pending = imported.filter(t => t.status === 'pending').length;
      const completed = imported.filter(t => t.status === 'completed').length;
      console.log(`📋 ${pending} pending, ✅ ${completed} completed`);
    } catch (error) {
      console.error('❌ Error importing tasks:', error.message);
      process.exit(1);
    }
  });

// Export tasks
program
  .command('export <file>')
  .description('Export tasks to a file (supports .txt, .json, .csv, .md)')
  .option('-c, --completed', 'Include completed tasks (default: true)')
  .option('--no-completed', 'Exclude completed tasks')
  .action(async (filePath, options) => {
    try {
      const importManager = new ImportExportManager();
      const extension = filePath.split('.').pop().toLowerCase();
      const includeCompleted = options.completed !== false;

      let result;
      if (extension === 'txt') {
        result = await importManager.exportToTextFile(filePath, includeCompleted);
      } else if (extension === 'json') {
        result = await importManager.exportToJSON(filePath, includeCompleted);
      } else if (extension === 'csv') {
        result = await importManager.exportToCSV(filePath, includeCompleted);
      } else if (extension === 'md') {
        result = await importManager.exportToMarkdown(filePath, includeCompleted);
      } else {
        console.error('❌ Unsupported export format. Use .txt, .json, .csv, or .md files.');
        process.exit(1);
      }

      console.log(`✅ Exported tasks to ${filePath}`);

      if (result.pending !== undefined) {
        console.log(`📋 ${result.pending} pending, ✅ ${result.completed} completed`);
      } else {
        console.log(`📋 ${result.total} tasks exported`);
      }
    } catch (error) {
      console.error('❌ Error exporting tasks:', error.message);
      process.exit(1);
    }
  });

// Edit a task
program
  .command('edit <index> <content>')
  .description('Edit an existing task')
  .action((index, content, options) => {
    try {
      // Validate content
      if (!content || content.trim() === '') {
        console.error('❌ Task content cannot be empty');
        process.exit(1);
      }

      // Get all pending tasks to find the task by index
      const tasks = taskRepo.getAllPendingTasks();

      if (tasks.length === 0) {
        console.error('❌ No tasks found');
        process.exit(1);
      }

      // Convert 1-based index to 0-based
      const taskIndex = parseInt(index) - 1;

      if (taskIndex < 0 || taskIndex >= tasks.length) {
        console.error('❌ Task not found. Use a valid task number.');
        process.exit(1);
      }

      const taskToEdit = tasks[taskIndex];
      const updatedTask = taskRepo.updateTaskContent(taskToEdit.id, content);

      if (!updatedTask) {
        console.error('❌ Failed to update task');
        process.exit(1);
      }

      console.log(`✅ Updated task: ${updatedTask.content}`);

      // Show URLs if any were detected
      if (updatedTask.extractedUrls.length > 0) {
        console.log(`🔗 URLs detected: ${updatedTask.extractedUrls.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error updating task:', error.message);
      process.exit(1);
    }
  });

program.parse();