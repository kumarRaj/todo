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

## Project Structure

```
.
├── .claude/                    # Claude Code configuration
├── .gitignore                  # Git ignore rules (excludes build artifacts)
├── CLAUDE.md                   # This development guide
├── LICENSE                     # MIT license
├── README.md                   # User documentation
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── sample-todos.txt            # Sample data for testing
├── src/
│   ├── cli/
│   │   └── index.js           # CLI entry point and commands
│   ├── core/
│   │   └── task.js            # Core Task domain model
│   ├── gui/
│   │   ├── main.js            # Electron main process
│   │   └── renderer/
│   │       ├── index.html     # GUI layout
│   │       ├── renderer.js    # Frontend JavaScript
│   │       └── styles.css     # GUI styling
│   ├── storage/
│   │   ├── database.js        # SQLite database setup
│   │   └── taskRepository.js  # Data access layer
│   └── utils/
│       ├── dateHelpers.js     # Date/time utilities
│       ├── importExport.js    # File format handlers
│       └── urlHelpers.js      # URL extraction utilities
└── test-export.md             # Test file for export functionality

Build artifacts (ignored by git):
├── dist/                      # Electron build outputs (generated)
├── node_modules/              # Dependencies (installed via npm)
└── ~/.todo-app/tasks.db       # User data (SQLite database)
```

## Architecture

### Layer Architecture
- **Core Business Logic** (`/src/core/`) - Task model with rich domain logic
- **Data Storage** (`/src/storage/`) - SQLite database management and repository pattern
- **CLI Interface** (`/src/cli/`) - Commander.js-based CLI with comprehensive commands
- **GUI Interface** (`/src/gui/`) - Electron main process + vanilla JS renderer
- **Utilities** (`/src/utils/`) - Import/export, date handling, URL detection

### Adding New Features

**New Task Properties/Behavior**:
1. Add property to Task model in `src/core/task.js`
2. Update database schema in `src/storage/database.js`
3. Modify TaskRepository methods in `src/storage/taskRepository.js`
4. Update both CLI and GUI interfaces to support the new property

**New CLI Commands**:
1. Add command definition in `src/cli/index.js`
2. Use existing TaskRepository methods or add new ones
3. Follow the established pattern: parse args → call repository → format output

**New GUI Features**:
1. Add IPC handler in `src/gui/main.js` (if data access needed)
2. Update `src/gui/renderer/renderer.js` for functionality
3. Update `src/gui/renderer/index.html` for UI elements
4. Style in `src/gui/renderer/styles.css`
5. Export global functions from renderer.js for onclick handlers

**New Import/Export Formats**:
1. Add format handlers in `src/utils/importExport.js`
2. Follow existing patterns for parsing and generation
3. Update CLI commands to support new format

**New Utility Functions**:
1. **Date/Time**: Add to `src/utils/dateHelpers.js`
2. **URL Processing**: Add to `src/utils/urlHelpers.js`
3. **General Utilities**: Create new files in `src/utils/`

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

### Development Patterns

**Data Flow**:
- CLI/GUI → TaskRepository → Database
- Never bypass TaskRepository for data access
- Task model handles business logic and validation
- Repository handles persistence and queries

**Feature Development Workflow**:
1. **Start with the core**: Define behavior in Task model
2. **Add persistence**: Update database schema and repository
3. **Build interfaces**: Add CLI commands and/or GUI features
4. **Test both interfaces**: Ensure feature parity between CLI and GUI

**Key Methods in TaskRepository**:
- `getAllTasks()` - Retrieve all tasks
- `addTask(content, priority)` - Create new task
- `updateTaskContent(id, content)` - Modify task content with URL re-extraction
- `updateTaskStatus(id, status)` - Change task state
- `updateTaskPriorities(tasks)` - Batch priority updates for drag-and-drop

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

### Code Organization Best Practices

**File Naming**:
- Use descriptive names that match their primary purpose
- Keep related functionality in the same file when it makes sense
- Create new utility files for distinct functional areas

**Dependency Direction**:
- Core (Task model) has no external dependencies
- Storage layer depends only on core
- Interfaces (CLI/GUI) depend on storage and core
- Utils are standalone and can be used by any layer

**State Management**:
- SQLite database is the single source of truth
- Task model enforces business rules and state transitions
- GUI refreshes from database after operations (no local state sync)
- CLI operations are stateless and query-fresh

**Error Handling**:
- Repository layer handles database errors
- Task model validates state transitions and data
- Interfaces handle user input validation and display errors appropriately

### Testing Strategy

Jest is configured but no tests exist yet. Recommended test structure:
- **Unit Tests**: Test Task model business logic independently
- **Integration Tests**: Test TaskRepository with actual SQLite database
- **CLI Tests**: Mock TaskRepository and test command parsing/output
- **Import/Export Tests**: Test file format handlers with sample data
- **E2E Tests**: Test complete workflows through both CLI and GUI interfaces

Create test files in `test/` directory matching the source structure:
```
test/
├── core/
│   └── task.test.js
├── storage/
│   └── taskRepository.test.js
├── cli/
│   └── commands.test.js
└── utils/
    ├── importExport.test.js
    └── dateHelpers.test.js
```