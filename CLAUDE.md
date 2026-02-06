# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **dual-interface TODO management application** providing both CLI and desktop GUI built with Electron. The application uses SQLite for local storage and is designed for cross-platform compatibility (Windows, macOS, Linux).

## Development Commands

### Essential Commands
- `npm install` - Install dependencies
- `npm start` - Start desktop GUI application
- `npm run dev` - Start desktop GUI with developer tools enabled
- `npm run cli` - Run CLI version
- `node src/cli/index.js --help` - Show CLI help and available commands
- `npm test` - Run tests (Jest configured, but no tests implemented yet)
- `npm run build` - Build distributable packages with electron-builder

### Platform-Specific Setup
- `npx electron-rebuild` - Rebuild native modules for current platform (required after install)
- `npm rebuild better-sqlite3` - Fix SQLite compilation issues if needed

### Testing the Application
- **CLI Testing**: `node src/cli/index.js add "Test task"` then `node src/cli/index.js list`
- **Desktop Testing**: `npm start` launches the GUI
- **Import Testing**: Create a text file with tasks and use `node src/cli/index.js import filename.txt`

## Architecture

### Layer Architecture
- **Core Business Logic** (`/src/core/`) - Task model with rich domain logic
- **Data Storage** (`/src/storage/`) - SQLite database management and repository pattern
- **CLI Interface** (`/src/cli/`) - Commander.js-based CLI with comprehensive commands
- **GUI Interface** (`/src/gui/`) - Electron main process + vanilla JS renderer
- **Utilities** (`/src/utils/`) - Import/export, date handling, URL detection

### Key Architectural Patterns

**Repository Pattern**: TaskRepository abstracts all database operations. All data access goes through this layer, never direct SQL in business logic.

**Shared Core Logic**: Both CLI and GUI use the same Task model and TaskRepository, ensuring consistent behavior across interfaces.

**Status State Machine**: Tasks have 4 states (pending, in_progress, waiting, completed) with proper state transitions and business rules in the Task model.

**Interactive GUI Design**: Click-to-edit task content, visual status indicators with background colors, drag-and-drop priority reordering, and context menus for quick actions.

**Local-First Design**: All data stored in `~/.todo-app/tasks.db` SQLite database. No cloud dependencies.

## Data Model

### Core Entity: Task
Located in `src/core/task.js`, this is the central domain model with:
- **Status Management**: 4-state system with proper transitions
- **URL Extraction**: Automatic detection and storage of URLs in task content
- **Priority System**: Integer-based priority where lower numbers = higher priority
- **Scheduling**: Optional date-based scheduling
- **Audit Trail**: Created, updated, and completion timestamps

### Database Schema
SQLite database with single `tasks` table containing:
- `id` (TEXT PRIMARY KEY) - UUID
- `content` (TEXT) - Task description
- `priority` (INTEGER) - Ordering position
- `status` (TEXT) - pending/in_progress/waiting/completed
- `created_at`, `completed_at`, `scheduled_for` (TEXT) - ISO dates
- `updated_at` (TEXT) - For sync/conflict resolution
- `extracted_urls` (TEXT) - JSON array of detected URLs

## Development Notes

### Important Implementation Details

**React Dependencies**: React is in package.json but the GUI uses vanilla JavaScript. This appears to be either a future migration target or unused dependencies.

**CLI vs GUI Data Flow**:
- CLI: Direct TaskRepository calls with console output
- GUI: Electron IPC between main and renderer processes, both using same TaskRepository

**URL Detection**: Uses regex pattern in Task model to automatically extract and store URLs from task content.

**Priority Management**: Uses integer priorities that get automatically reordered when tasks are moved up/down.

### Common Development Tasks

**Adding New CLI Commands**:
1. Add command in `src/cli/index.js` using Commander.js pattern
2. Use TaskRepository methods for data operations
3. Follow existing patterns for error handling and user feedback

**Adding GUI Features**:
1. Add IPC handler in `src/gui/main.js`
2. Add renderer logic in `src/gui/renderer/`
3. Ensure feature parity with CLI when applicable
4. Add global function export in renderer.js if creating onclick handlers

**Database Changes**:
1. Modify schema in `src/storage/database.js`
2. Update TaskRepository methods in `src/storage/taskRepository.js`
3. Adjust Task model in `src/core/task.js` if needed

**Task Content Updates**:
- Use `updateTaskContent(taskId, newContent)` method for content changes
- Automatically re-extracts URLs when content is modified
- Updates `updated_at` timestamp for change tracking

### Import/Export System

The application supports multiple formats through `src/utils/importExport.js`:
- Text format (user's original todo format)
- JSON (structured data)
- CSV (spreadsheet compatibility)
- Markdown (documentation format)

Custom parser handles user's existing format with patterns like:
```
Task description - URL - Status
Task with IN_PROGRESS status - https://example.com - IN_PROGRESS
```

### Cross-Platform Considerations

- Database path: `~/.todo-app/tasks.db` (cross-platform home directory)
- URL opening: Uses Electron's `shell.openExternal()` for cross-platform browser launching
- Build system: electron-builder configured for .app (macOS), .exe (Windows), .AppImage (Linux)

### GUI Features

**Task Editing**: Click the edit button (✏️) or right-click for inline editing. Uses `updateTaskContent()` method with automatic URL re-extraction.

**Visual Status System**:
- In Progress tasks: Yellow background (#fef3c7) with orange border
- Waiting tasks: Gray background (#f3f4f6) with purple border
- Context menu for quick status changes

**Drag and Drop**: Reorder active tasks by dragging. Uses `updateTaskPriorities()` for batch priority updates.

**Task Actions**: Each task has edit, status, and delete buttons. Delete requires confirmation.

### Testing Architecture

Jest is configured but no tests exist yet. When implementing tests:
- Test Task model business logic separately from storage
- Mock TaskRepository for CLI command testing
- Test import/export functionality with sample data
- Consider integration tests for the full CLI workflow