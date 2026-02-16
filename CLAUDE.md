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
- `npm run install-mac` - Build and install to Applications folder (macOS only)

### Safety Guidelines
- **NEVER** use destructive commands like `rm -rf` without explicit user confirmation
- **NEVER** delete databases or user data files without explicit user consent and proper backups
- **ALWAYS** create backups before performing any database migrations or schema changes that could affect existing data
- Always ask before deleting files or directories in user spaces like `/Applications/`
- When building install scripts, prefer safe copy operations over destructive removal
- Database location: `~/.todo-app/tasks.db` contains all user data - treat with extreme care

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
- **Tags Extraction**: Automatic hashtag detection and extraction using `/#(\w+)/g` regex
- **Priority System**: Integer-based priority where lower numbers = higher priority
- **Scheduling**: Optional date-based scheduling
- **Audit Trail**: Created, updated, and completion timestamps

### Database Schema
SQLite database with single `tasks` table containing:
- `id` (TEXT PRIMARY KEY) - UUID
- `content` (TEXT) - Task description with hashtags
- `priority` (INTEGER) - Ordering position
- `status` (TEXT) - pending/in_progress/waiting/completed
- `created_at`, `completed_at`, `scheduled_for` (TEXT) - ISO dates
- `updated_at` (TEXT) - For sync/conflict resolution
- `extracted_urls` (TEXT) - JSON array of detected URLs
- `tags` (TEXT) - JSON array of extracted hashtags (added in v1 migration)

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
- `updateTaskContent(id, content)` - Modify task content with URL and tag re-extraction
- `updateTaskStatus(id, status)` - Change task state
- `updateTaskPriorities(tasks)` - Batch priority updates for drag-and-drop
- `getTasksFilteredByWorkPersonal(filter)` - Filter tasks by 'work', 'personal', or 'both'
- `getTasksByTag(tag)` - Get tasks containing a specific tag
- `getAllTags()` - Retrieve all unique tags from all tasks

## Development Workflow

### Adding New GUI Components

When adding new interactive elements to tasks:

1. **HTML Template**: Add markup to `createTaskElement()` function in `src/gui/renderer/renderer.js`
2. **CSS Styling**: Add styles to `src/gui/renderer/styles.css` following existing patterns
3. **Event Handlers**: Create functions and export them to `window` scope for onclick handlers
4. **State Management**: Use existing patterns - reload tasks after operations, no local state caching

### GUI Component Patterns

**Button Components**:
```javascript
<button class="action-btn specific-btn" onclick="functionName('${task.id}')" title="Tooltip">
    <span class="icon">📄</span>
</button>
```

**Conditional Rendering**:
```javascript
${task.status !== 'completed' ? `
    <!-- Content only for active tasks -->
` : ''}
```

**Global Function Export**:
```javascript
// At end of renderer.js
window.functionName = functionName;
```

**CSS Button Pattern**:
```css
.action-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    opacity: 0.7;
}
.action-btn:hover {
    background-color: #f0f9ff;
    opacity: 1;
}
```

### Git Workflow

**Commit Message Format**:
- Use imperative mood: "Add feature" not "Added feature"
- Keep first line under 50 characters
- Include detailed description explaining the "why"
- Reference line numbers when discussing specific code locations

**Safe Development Practices**:
- Always test both CLI and GUI interfaces after changes
- Rebuild native modules (`npx electron-rebuild`) if database operations fail
- Use `npm run dev` for development with DevTools enabled
- Test the built app (`npm run build`) before committing major changes

## Recent Features & Implementation Examples

### Hashtag Tags System with Work/Personal Filtering (Latest)

**Implementation Locations**:
- Core: `src/core/task.js:52-57` (extractTags method)
- Database: `src/storage/database.js:134-179` (migrations v1 & v2)
- Repository: `src/storage/taskRepository.js:380-460` (filtering methods)
- GUI: `src/gui/renderer/index.html:34-38`, `src/gui/renderer/renderer.js:190-196,271-285`
- CLI: `src/cli/index.js:34-37` (default tagging)

**How it works**:
- Automatic hashtag extraction from task content using `/#(\w+)/g` regex
- Default #work tagging for new tasks when no hashtags present
- Visual tag badges with color coding (blue #work, green #personal, gray others)
- 3-state filter toggle (All/Work/Personal) integrated into section header
- Database migration system preserves existing data while adding tags functionality
- Clean GUI display hides hashtags from content, showing only as badges below

**Architecture Overview**:
```javascript
// Task model extracts tags automatically
extractTags(content) {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex) || [];
    return matches.map(tag => tag.substring(1).toLowerCase());
}

// Repository filtering method
getTasksFilteredByWorkPersonal(filter = 'both') {
    let whereClause = '';
    if (filter === 'work') {
        whereClause = `WHERE tags LIKE '%"work"%'`;
    } else if (filter === 'personal') {
        whereClause = `WHERE tags LIKE '%"personal"%'`;
    }
    // Query with filter applied
}

// GUI display strips hashtags from content
stripHashtagsFromContent(content) {
    return content.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
}
```

**Key Features**:
- **Dual Interface Support**: Both CLI and GUI fully support tags
- **Migration Safety**: Database v1 adds tags column, v2 adds default #work to existing tasks
- **Visual Hierarchy**: Tags as colored badges separate from task content
- **Minimal UI Impact**: Filter buttons integrated into existing section header
- **Future-Proof**: Supports any hashtag but filters on work/personal for simplicity

### Up/Down Arrow Task Reordering

**Implementation Location**: `src/gui/renderer/renderer.js:197-203`, `src/gui/renderer/styles.css:398-440`

**How it works**:
- Added conditional arrow buttons (`↑↓`) to active tasks only
- `moveTaskUp()` and `moveTaskDown()` functions handle reordering logic
- Uses existing `updateTaskPriorities()` system for persistence
- Buttons are styled consistently with existing UI patterns

**Code Pattern for Similar Features**:
```javascript
// In createTaskElement() function
${task.status !== 'completed' ? `
    <button class="move-btn move-up-btn" onclick="moveTaskUp('${task.id}')" title="Move task up">
        <span class="move-icon">↑</span>
    </button>
` : ''}

// Handler function
async function moveTaskUp(taskId) {
    // 1. Find task index in current order
    // 2. Create new order with task moved
    // 3. Call updateTaskPriorities() with new order
    // 4. Reload tasks to reflect changes
}

// Export to global scope
window.moveTaskUp = moveTaskUp;
```

**CSS Pattern for Action Buttons**:
```css
.move-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease, opacity 0.2s ease;
    opacity: 0.7;
    min-width: 24px;
    height: 24px;
}
.move-btn:hover {
    background-color: #f0f9ff;
    opacity: 1;
}
```

### Build and Deployment

**macOS Installation**:
- `npm run install-mac` builds and copies app to `/Applications/`
- Uses `dist/mac-arm64/Todo App.app` path (ARM64 optimized)
- **IMPORTANT**: Never use `rm -rf` in scripts without user confirmation

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

**Task Reordering**: Multiple ways to reorder tasks:
- **Drag and Drop**: Reorder by dragging tasks to new positions
- **Up/Down Arrows**: Click ↑↓ arrows for precise single-position moves
- Both methods use `updateTaskPriorities()` for batch priority updates

**Task Actions**: Each task has action buttons:
- **Up/Down arrows (↑↓)**: Move task one position up or down (active tasks only)
- **Edit button (✏️)**: Inline editing with multiline support
- **Status dropdown**: Quick status changes with visual context menu
- **Delete button (🗑️)**: Remove task with confirmation dialog

**Tags System**: Hashtag-based categorization with visual indicators:
- **Automatic Extraction**: #hashtags in content become colored badges
- **Visual Display**: Clean content with tags shown as colored pills below
- **Color Coding**: Blue (#work), Green (#personal), Gray (others)
- **Filter Toggle**: All/Work/Personal buttons integrated in section header
- **Default Tagging**: New tasks automatically get #work if no tags present

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

**Philosophy: "Touch It, Test It"**

This project follows a pragmatic testing approach focused on regression prevention and sustainable development practices:

- **New features**: Write tests first (TDD style)
- **Bug fixes**: Write a failing test that reproduces the bug, then fix it
- **Refactoring existing code**: Add tests before making changes
- **Leave untouched code alone**: No pressure to test everything immediately

**Daily Development Workflow:**

1. **Starting new work**: `npm run test:watch` in background
2. **New feature**: Write failing test → Implement → Green test
3. **Bug report**: Write failing test → Fix bug → Verify green
4. **Before commit**: `npm run test` (full suite)
5. **Refactor**: Test first, then refactor with confidence

**Test Environment:**
- All tests use `TODO_ENV=test` for isolated test database
- Tests automatically use `~/.todo-app/tasks-test.db`
- Fast feedback loop with Jest watch mode
- Clear separation between test and production data

**Test Structure:**
```
test/
├── core/
│   └── task.test.js              # Task model tests
├── storage/
│   └── taskRepository.test.js    # Repository integration tests
├── cli/
│   └── commands.test.js          # CLI command tests
├── utils/
│   ├── importExport.test.js      # File format handler tests
│   ├── dateHelpers.test.js       # Date utility tests
│   └── urlHelpers.test.js        # URL utility tests
└── helpers/
    └── testDatabase.js           # Test database setup utilities
```

**Test Categories:**
- **Unit tests**: Pure functions (URL extraction, date formatting, status validation)
- **Integration tests**: Repository operations with real test database
- **Command tests**: CLI workflows end-to-end
- **Business logic tests**: Task state transitions, validation rules

**Testing Commands:**
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:unit` - Run only unit tests (fast)
- `npm run test:integration` - Run integration tests with database

## Troubleshooting

### Common Issues

**SQLite Module Errors** (`NODE_MODULE_VERSION` mismatch):
```bash
npx electron-rebuild
# If that fails:
npm rebuild better-sqlite3
```

**GUI Not Updating After Changes**:
- Check if functions are exported to `window` scope
- Verify IPC handlers exist in `main.js` for data operations
- Ensure `loadTasks()` is called after data modifications

**Build Issues on macOS**:
- App builds to `dist/mac-arm64/Todo App.app` (not `dist/mac/`)
- Use full path in copy commands: `"dist/mac-arm64/Todo App.app"`
- Code signing warnings are normal for development builds

**Database Location**:
- Production: `~/.todo-app/tasks.db`
- Always use TaskRepository, never direct SQLite access
- Database is created automatically on first run
- Migrations run automatically on database initialization
- Current schema version: 2 (v1 adds tags column, v2 adds default #work tags)

### Quick Debugging

**Check Task Data**:
```bash
node src/cli/index.js list
```

**GUI Developer Tools**:
```bash
npm run dev  # Opens with DevTools enabled
```

**Verify Build Output**:
```bash
npm run build
ls -la dist/
```

### Making Changes Safely

1. **Test in Development**: `npm run dev` before building
2. **Test CLI Compatibility**: Ensure changes work in both interfaces
3. **Check Build Process**: Run `npm run build` to catch build-time errors
4. **Commit Frequently**: Small, focused commits with clear messages
5. **Export Global Functions**: All onclick handlers need `window.functionName = functionName`