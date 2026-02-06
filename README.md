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

*Coming soon after implementation*

## Sample Data Migration

The application will support importing your existing todo format:
```
Check for changes in sort pack post merge of dside - https://github.com/zalando-logistics/sort-pack-service/pull/555 - Done
Sort pack create PR for close LU - Review
Order bag for Swati - Done
pg_cron modify to 180 days - Created PR - https://github.com/zalando-logistics/sort-pack-service/pull/570 - IN_PROGRESS
```

## Contributing

*Guidelines to be added during development*

## License

*To be determined*