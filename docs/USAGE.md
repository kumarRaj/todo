# Usage Guide

This guide covers how to use both the CLI and desktop GUI versions of the TODO Management Application.

## CLI Application

The command-line interface provides fast, keyboard-driven task management:

### Basic Commands

**Add a new task:**
```bash
node src/cli/index.js add "Review pull request"
node src/cli/index.js add "Meeting at 3 PM" --schedule 2026-02-10
```

**List tasks:**
```bash
node src/cli/index.js list              # Pending tasks only
node src/cli/index.js list --all        # All tasks
node src/cli/index.js list --completed  # Completed tasks only
```

**Complete a task:**
```bash
node src/cli/index.js complete 1        # Mark first task as done
node src/cli/index.js done 2             # Alternative syntax
```

**Change task priority:**
```bash
node src/cli/index.js move 3 up         # Move task #3 higher priority
node src/cli/index.js move 1 down       # Move task #1 lower priority
```

**Schedule a task:**
```bash
node src/cli/index.js schedule 2 2026-02-15  # Schedule task #2 for Feb 15
```

**Open URLs from tasks:**
```bash
node src/cli/index.js open 1            # Open all URLs from task #1
```

### Import/Export

**Import from text file (your existing format):**
```bash
node src/cli/index.js import my-todos.txt
```

**Export to various formats:**
```bash
node src/cli/index.js export backup.json       # JSON format
node src/cli/index.js export tasks.md          # Markdown
node src/cli/index.js export data.csv          # CSV format
node src/cli/index.js export --no-completed tasks.txt  # Text without completed
```

### Global CLI Access

Make CLI globally available:
```bash
npm link                                # Now use 'todo' command anywhere
todo add "Global task"
todo list
```

### Example CLI Workflow

Here's a typical workflow using the CLI:

```bash
# Add some tasks
todo add "Review https://github.com/project/repo/pull/123"
todo add "Meeting with team at 2 PM" --schedule 2026-02-10
todo add "Update documentation"

# List pending tasks
todo list

# Complete a task
todo complete 1

# Move a task up in priority
todo move 2 up

# Export backup
todo export backup-$(date +%Y%m%d).json
```

## Desktop GUI Application

Launch the desktop application:
```bash
npm start
```

### GUI Features

**Adding Tasks:**
- Type in the input field at the top
- Optionally select a due date with the date picker
- Click "Add" or press Enter

**Managing Tasks:**
- **Complete**: Click the checkbox next to any task
- **Priority**: Drag and drop tasks to reorder by priority
- **URLs**: Click any detected URL to open in your default browser
- **View Modes**: Switch between Pending, All, or Completed views
- **Edit**: Click the edit button (✏️) to modify task content
- **Delete**: Click the delete button and confirm

**Visual Status Indicators:**
- **Pending tasks**: Default white background
- **In Progress tasks**: Yellow background with orange border
- **Waiting tasks**: Gray background with purple border
- **Completed tasks**: Strikethrough text

**Context Menu:**
- Right-click on any task for quick actions
- Change status, edit content, or delete

**Keyboard Shortcuts:**
- `Cmd+N` (Mac) / `Ctrl+N` (Windows/Linux): Focus on new task input
- `Enter`: Add new task when input is focused

**Menu Options:**
- **File → Import Tasks**: Import from text or JSON files
- **File → Export Tasks**: Export with format options
- **View → Toggle Developer Tools**: Debug interface (F12)

### Task Editing

**Inline Editing:**
1. Click the edit button (✏️) next to any task
2. The task content becomes editable
3. Modify the text as needed
4. Press Enter or click elsewhere to save
5. URLs are automatically re-detected and updated

**Status Changes:**
- Use the status dropdown or context menu
- Available states: Pending, In Progress, Waiting, Completed
- Status changes are reflected immediately with visual indicators

### Drag and Drop Priority

**Reorder Tasks:**
1. Click and hold on any active (non-completed) task
2. Drag the task up or down in the list
3. Drop it at the desired position
4. Priority numbers are automatically updated

## Data Management

### Data Storage
- **Location**: `~/.todo-app/tasks.db` (SQLite database)
- **Format**: Local SQLite database
- **Access**: Both CLI and GUI use the same database

### Backup Strategy
Create regular backups using the export functionality:
```bash
# Daily backup
node src/cli/index.js export backup-$(date +%Y%m%d).json

# Weekly backup with all tasks
node src/cli/index.js export --all weekly-backup-$(date +%Y%m%d).json
```

### Data Migration
Import from other TODO systems:
```bash
# From plain text file
node src/cli/index.js import old-todos.txt

# From JSON backup
node src/cli/index.js import backup.json
```

## Sample Data Migration

Your existing todo format is fully supported:
```
Check for changes in sort pack post merge of dside - https://github.com/zalando-logistics/sort-pack-service/pull/555 - Done
Sort pack create PR for close LU - Review
Order bag for Swati - Done
pg_cron modify to 180 days - Created PR - https://github.com/zalando-logistics/sort-pack-service/pull/570 - IN_PROGRESS
```

The import function will:
- Parse task content and status
- Extract URLs automatically
- Preserve completion state
- Set appropriate priorities based on order

## URL Integration

**Automatic URL Detection:**
- URLs in task content are automatically detected and stored
- Supported formats: HTTP/HTTPS URLs, GitHub links, etc.

**Opening URLs:**
- **CLI**: Use `node src/cli/index.js open <task-number>`
- **GUI**: Click directly on any blue/underlined URL
- Opens in your default web browser

**URL Examples:**
```bash
todo add "Review PR at https://github.com/project/repo/pull/123"
todo add "Check docs: https://example.com/documentation"
todo add "Meeting link: https://zoom.us/j/1234567890"
```

## Advanced Features

### Scheduling
```bash
# Schedule a task for a specific date
todo schedule 1 "2026-02-15"

# Add a task with scheduled date
todo add "Important meeting" --schedule "2026-02-20"
```

### Filtering and Views
```bash
# View only completed tasks
todo list --completed

# View all tasks including completed
todo list --all

# Export without completed tasks
todo export --no-completed current-tasks.txt
```

### Batch Operations
The GUI supports:
- Bulk selection (with checkbox selection)
- Batch status changes
- Mass priority reordering via drag-and-drop

## Tips and Best Practices

**Task Organization:**
- Use descriptive task names
- Include URLs for reference materials
- Set appropriate priorities using move commands or drag-drop
- Schedule important deadlines

**Data Safety:**
- Export backups regularly
- Keep backups in cloud storage or external drives
- Test import/export functionality periodically

**Workflow Integration:**
- Use CLI for quick task entry during development work
- Use GUI for task review and management sessions
- Combine both interfaces based on your current workflow needs

## Troubleshooting Usage Issues

**CLI Not Working:**
- Ensure Node.js is properly installed
- Check that you're in the correct directory
- Try running with full path: `node src/cli/index.js`

**GUI Won't Start:**
- Run `npx electron-rebuild` to rebuild native modules
- Check for error messages in the terminal
- Try `npm run dev` for debugging with developer tools

**Data Not Syncing:**
- CLI and GUI use the same database file
- If data seems out of sync, restart the GUI application
- Check file permissions on `~/.todo-app/tasks.db`

**Import/Export Issues:**
- Ensure file paths are correct and accessible
- Check file format matches expected structure
- Use absolute paths when in doubt