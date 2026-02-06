/**
 * Electron main process
 */

const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const TaskRepository = require('../storage/taskRepository');
const ImportExportManager = require('../utils/importExport');

// Keep a global reference of the window object
let mainWindow;
let taskRepo;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default' // Restore native title bar for dragging
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(() => {
  // Initialize task repository
  taskRepo = new TaskRepository();
  taskRepo.initialize();

  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (taskRepo) {
      taskRepo.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (taskRepo) {
    taskRepo.close();
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: app.getName(),
      submenu: [
        { label: 'About ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Task',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('new-task')
        },
        { type: 'separator' },
        {
          label: 'Import Tasks',
          click: () => mainWindow.webContents.send('import-tasks')
        },
        {
          label: 'Export Tasks',
          click: () => mainWindow.webContents.send('export-tasks')
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'Ctrl+Command+F', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for renderer process
ipcMain.handle('get-tasks', async (event, filter) => {
  try {
    switch (filter) {
      case 'pending':
        return taskRepo.getAllPendingTasks();
      case 'all':
        return taskRepo.getAllTasks();
      case 'completed':
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        return taskRepo.getCompletedInRange(startDate, endDate);
      default:
        return taskRepo.getAllPendingTasks();
    }
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
});

ipcMain.handle('create-task', async (event, content, scheduledFor) => {
  try {
    return taskRepo.createTask(content, scheduledFor);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
});

ipcMain.handle('complete-task', async (event, taskId) => {
  try {
    return taskRepo.markCompleted(taskId);
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
});

ipcMain.handle('move-task', async (event, taskId, direction) => {
  try {
    return taskRepo.moveTask(taskId, direction);
  } catch (error) {
    console.error('Error moving task:', error);
    throw error;
  }
});

ipcMain.handle('schedule-task', async (event, taskId, date) => {
  try {
    return taskRepo.scheduleTask(taskId, date);
  } catch (error) {
    console.error('Error scheduling task:', error);
    throw error;
  }
});

ipcMain.handle('delete-task', async (event, taskId) => {
  try {
    return taskRepo.deleteTask(taskId);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
});

ipcMain.handle('get-all-tasks', async () => {
  try {
    return taskRepo.getAllTasks();
  } catch (error) {
    console.error('Error getting all tasks:', error);
    return [];
  }
});

ipcMain.handle('change-task-status', async (event, taskId, newStatus) => {
  try {
    return taskRepo.changeTaskStatus(taskId, newStatus);
  } catch (error) {
    console.error('Error changing task status:', error);
    throw error;
  }
});

ipcMain.handle('update-task-priorities', async (event, taskIdOrder) => {
  try {
    return taskRepo.updateTaskPriorities(taskIdOrder);
  } catch (error) {
    console.error('Error updating task priorities:', error);
    throw error;
  }
});

ipcMain.handle('update-task-content', async (event, taskId, newContent) => {
  try {
    return taskRepo.updateTaskContent(taskId, newContent);
  } catch (error) {
    console.error('Error updating task content:', error);
    throw error;
  }
});

ipcMain.handle('open-url', async (event, url) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('Error opening URL:', error);
    throw error;
  }
});

// Import tasks
ipcMain.handle('import-tasks', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Tasks',
      filters: [
        { name: 'Text files', extensions: ['txt'] },
        { name: 'JSON files', extensions: ['json'] },
        { name: 'All files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) return null;

    const filePath = result.filePaths[0];
    const importManager = new ImportExportManager();
    const extension = path.extname(filePath).toLowerCase();

    let imported;
    if (extension === '.txt') {
      imported = await importManager.importFromTextFile(filePath);
    } else if (extension === '.json') {
      imported = await importManager.importFromJSON(filePath);
    } else {
      throw new Error('Unsupported file format. Use .txt or .json files.');
    }

    return {
      success: true,
      count: imported.length,
      pending: imported.filter(t => t.status === 'pending').length,
      completed: imported.filter(t => t.status === 'completed').length
    };
  } catch (error) {
    console.error('Error importing tasks:', error);
    return { success: false, error: error.message };
  }
});

// Export tasks
ipcMain.handle('export-tasks', async (event, format = 'txt', includeCompleted = true) => {
  try {
    const filters = [];
    const defaultPath = `todo-export-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'txt':
        filters.push({ name: 'Text files', extensions: ['txt'] });
        break;
      case 'json':
        filters.push({ name: 'JSON files', extensions: ['json'] });
        break;
      case 'csv':
        filters.push({ name: 'CSV files', extensions: ['csv'] });
        break;
      case 'md':
        filters.push({ name: 'Markdown files', extensions: ['md'] });
        break;
      default:
        filters.push({ name: 'Text files', extensions: ['txt'] });
    }

    filters.push({ name: 'All files', extensions: ['*'] });

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Tasks',
      defaultPath: defaultPath + '.' + format,
      filters: filters
    });

    if (result.canceled) return null;

    const filePath = result.filePath;
    const importManager = new ImportExportManager();

    let exportResult;
    if (format === 'txt') {
      exportResult = await importManager.exportToTextFile(filePath, includeCompleted);
    } else if (format === 'json') {
      exportResult = await importManager.exportToJSON(filePath, includeCompleted);
    } else if (format === 'csv') {
      exportResult = await importManager.exportToCSV(filePath, includeCompleted);
    } else if (format === 'md') {
      exportResult = await importManager.exportToMarkdown(filePath, includeCompleted);
    }

    return {
      success: true,
      filePath: filePath,
      ...exportResult
    };
  } catch (error) {
    console.error('Error exporting tasks:', error);
    return { success: false, error: error.message };
  }
});