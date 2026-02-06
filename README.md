# TODO Management Application

A comprehensive TODO management application with both CLI and desktop GUI interfaces, designed for minimalistic and efficient task management.

## Project Overview

This application provides a dual-interface approach to TODO management:
- **CLI Application**: Fast command-line interface for power users
- **Desktop GUI**: Clean, minimalistic desktop application with drag-drop functionality
- **Cross-platform**: Works on Windows, macOS, and Linux

## Core Features

### ✅ Basic Functionality
- Add, view, and complete tasks
- Free-flow task input (no complex forms)
- Minimalistic design matching simple text-based todos

### ✅ Priority Management
- Move tasks up/down based on priority
- Higher position = higher priority
- Simple reordering via commands or drag-drop

### ✅ Task States & Tracking
- Mark tasks as completed with timestamps
- View all pending tasks
- Filter completed tasks by date range

### ✅ Scheduling
- Schedule tasks for specific dates
- View tasks by due date
- Date-based filtering and organization

### ✅ URL Integration
- Auto-detect URLs in task content
- Click to open URLs directly in browser
- Support for GitHub PRs, documentation links, etc.

### ✅ Import/Export
- Import existing todo lists
- Export for backup or sharing
- Parse various text-based todo formats

## Technical Architecture

### Technology Stack
- **Core Framework**: Electron + Node.js
- **Desktop GUI**: React with minimalistic styling
- **CLI Interface**: Commander.js
- **Database**: SQLite with better-sqlite3
- **Date Management**: date-fns library
- **URL Handling**: Electron's shell.openExternal()

### Project Structure
```
todo-app/
├── src/
│   ├── cli/           # CLI commands and interface
│   ├── gui/           # Electron + React desktop app
│   ├── core/          # Shared business logic
│   ├── storage/       # Database layer
│   └── utils/         # URL detection, date helpers
├── package.json
└── electron configs
```

### Data Model
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,              -- UUID
  content TEXT NOT NULL,            -- Todo text
  priority INTEGER NOT NULL,        -- Order (0 = highest)
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed'
  created_at TEXT NOT NULL,         -- ISO datetime
  completed_at TEXT,                -- ISO datetime, NULL if pending
  scheduled_for TEXT,               -- ISO date, NULL if not scheduled
  updated_at TEXT NOT NULL,         -- For sync/conflict resolution
  extracted_urls TEXT               -- JSON array of detected URLs
);
```

## Example Usage

### CLI Commands
```bash
# Add a new task
todo add "Review https://github.com/zalando-logistics/sort-pack-service/pull/555"

# List all pending tasks
todo list

# Complete a task
todo complete 1

# Move task priority
todo move 1 up
todo move 2 down

# Schedule a task
todo schedule 1 "2024-02-15"

# View completed tasks in date range
todo completed --from "2024-02-01" --to "2024-02-07"
```

### Desktop GUI
- Simple list view with drag-drop reordering
- Click URLs to open in browser
- Date picker for scheduling
- Filter views for pending/completed tasks

## Development Roadmap

### 🔄 Implementation Tasks

- [x] Initialize git repository
- [ ] Create README.md with comprehensive project plan and todo list
- [ ] Create project structure and setup development environment
- [ ] Implement core data layer (storage, models, CRUD operations)
- [ ] Build CLI application with basic CRUD functionality
- [ ] Implement priority management (move up/down functionality)
- [ ] Add task scheduling and date management features
- [ ] Implement completion tracking and time-range filtering
- [ ] Build desktop GUI application
- [ ] Implement URL detection and opening functionality
- [ ] Add import/export functionality for existing todo lists
- [ ] Test applications on different platforms
- [ ] Create user documentation and installation guides

### Progress Tracking
Each task will be committed separately to maintain a clear development history and enable easy resumption of work.

## Installation & Setup

### Prerequisites
- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - For cloning the repository

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **For Electron desktop app, rebuild native modules:**
   ```bash
   npx electron-rebuild
   ```

4. **Run the application:**
   ```bash
   # CLI version
   node src/cli/index.js --help

   # Desktop GUI version
   npm start
   ```

### Installation Methods

#### Method 1: Development Setup
Best for developers and users who want the latest features:

```bash
# Clone and setup
git clone <repository-url>
cd todo-app
npm install
npx electron-rebuild

# Make CLI globally available (optional)
npm link
```

#### Method 2: Manual Installation
For users who prefer manual setup:

1. Download and extract the source code
2. Open terminal in the extracted folder
3. Run `npm install` and `npx electron-rebuild`
4. Use the applications as described in usage section

### Troubleshooting Installation

#### Common Issues:

**1. SQLite compilation errors:**
```bash
# Solution: Rebuild for your platform
npm rebuild better-sqlite3
# or for Electron:
npx electron-rebuild
```

**2. Permission errors (macOS/Linux):**
```bash
# Solution: Fix permissions
sudo chown -R $(whoami) ~/.npm
```

**3. Node.js version compatibility:**
```bash
# Ensure Node.js 18+ is installed
node --version
```

## Usage Guide

### CLI Application

The command-line interface provides fast, keyboard-driven task management:

#### Basic Commands

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

**Import/Export:**
```bash
# Import from text file (your existing format)
node src/cli/index.js import my-todos.txt

# Export to various formats
node src/cli/index.js export backup.json       # JSON format
node src/cli/index.js export tasks.md          # Markdown
node src/cli/index.js export data.csv          # CSV format
node src/cli/index.js export --no-completed tasks.txt  # Text without completed
```

#### Make CLI Globally Available
```bash
npm link                                # Now use 'todo' command anywhere
todo add "Global task"
todo list
```

### Desktop GUI Application

Launch the desktop application:
```bash
npm start
```

#### GUI Features:

**Adding Tasks:**
- Type in the input field at the top
- Optionally select a due date with the date picker
- Click "Add" or press Enter

**Managing Tasks:**
- **Complete**: Click the checkbox next to any task
- **Priority**: Drag and drop tasks to reorder by priority
- **URLs**: Click any detected URL to open in your default browser
- **View Modes**: Switch between Pending, All, or Completed views

**Keyboard Shortcuts:**
- `Cmd+N` (Mac) / `Ctrl+N` (Windows/Linux): Focus on new task input
- `Enter`: Add new task when input is focused

**Menu Options:**
- **File → Import Tasks**: Import from text or JSON files
- **File → Export Tasks**: Export with format options
- **View → Toggle Developer Tools**: Debug interface (F12)

### Data Storage

**Location:** `~/.todo-app/tasks.db` (SQLite database)

**Backup:** Export regularly using the export functionality:
```bash
node src/cli/index.js export backup-$(date +%Y%m%d).json
```

**Migration:** Use the import feature to migrate from other todo systems

## Sample Data Migration

Your existing todo format is fully supported:
```
Check for changes in sort pack post merge of dside - https://github.com/zalando-logistics/sort-pack-service/pull/555 - Done
Sort pack create PR for close LU - Review
Order bag for Swati - Done
pg_cron modify to 180 days - Created PR - https://github.com/zalando-logistics/sort-pack-service/pull/570 - IN_PROGRESS
```

## Building & Distribution

### Build Desktop Application

Create distributable packages for your platform:

```bash
# Build for current platform
npm run build

# Build for specific platforms (requires platform-specific setup)
npm run build -- --mac
npm run build -- --win
npm run build -- --linux
```

Output will be in the `dist/` directory.

### Cross-Platform Notes

**macOS:**
- App will be code-signed if certificates are available
- Creates `.dmg` installer and `.app` bundle
- Requires macOS for building macOS packages

**Windows:**
- Creates `.exe` installer and portable version
- Can be built from any platform with proper setup

**Linux:**
- Creates `.AppImage` for universal compatibility
- Also supports `.deb` and `.rpm` packages

### Development

**Project Structure:**
```
todo-app/
├── src/
│   ├── cli/           # CLI application
│   ├── gui/           # Electron desktop app
│   │   ├── main.js    # Electron main process
│   │   └── renderer/  # Frontend (HTML/CSS/JS)
│   ├── core/          # Business logic (Task model)
│   ├── storage/       # Database layer (SQLite)
│   └── utils/         # Helper utilities
├── package.json       # Dependencies and scripts
└── sample-todos.txt   # Example import file
```

**Running in Development:**
```bash
# CLI with auto-reload
npm run cli

# Desktop with dev tools
npm run dev
```

## FAQ

**Q: Where are my tasks stored?**
A: Tasks are stored locally in `~/.todo-app/tasks.db` using SQLite. No cloud sync required.

**Q: Can I sync between devices?**
A: Currently, sync is manual via export/import. Cloud sync may be added in future versions.

**Q: Does this work offline?**
A: Yes! The entire application works offline. No internet connection required.

**Q: How do I backup my data?**
A: Use the export functionality: `node src/cli/index.js export backup.json`

**Q: Can I import from other todo applications?**
A: The app supports text and JSON import. You can convert data from other apps to these formats.

**Q: Is my data secure?**
A: All data stays on your local machine. No telemetry or data collection.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup:
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Make your changes
5. Test both CLI and desktop apps
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with Electron for cross-platform desktop support
- Uses SQLite (better-sqlite3) for efficient local data storage
- CLI powered by Commander.js for professional command-line experience
- Date handling by date-fns for robust date operations

---

**Enjoy your new TODO management system! 🎉**

For support or feature requests, please open an issue on GitHub.