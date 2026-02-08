# TODO Management Application

A comprehensive, local-first TODO management application with both command-line and desktop interfaces.

## ✨ Features

- **🖥️ Dual Interface**: Fast CLI for power users, intuitive desktop GUI for visual management
- **📱 Cross-Platform**: Works on Windows, macOS, and Linux
- **🔒 Local-First**: All data stored locally in SQLite - no cloud dependencies
- **🔗 URL Integration**: Auto-detects and opens URLs directly from tasks
- **📊 Priority Management**: Drag-and-drop reordering with intelligent priority system
- **📅 Task Scheduling**: Set due dates and organize by time
- **📤 Import/Export**: Backup data and migrate from other todo systems
- **🎯 Status Tracking**: Pending → In Progress → Waiting → Completed workflow

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd todo-app
npm install
npx electron-rebuild

# CLI Usage
node src/cli/index.js add "Review pull request"
node src/cli/index.js list

# Desktop GUI
npm start
```

## 📋 Example Usage

### Command Line Interface
```bash
# Add tasks with URLs and scheduling
todo add "Review https://github.com/project/repo/pull/123"
todo add "Team meeting" --schedule 2026-02-15

# Manage priorities and status
todo move 1 up
todo complete 2
todo list --completed

# Import/Export for backup and migration
todo import my-old-todos.txt
todo export backup.json
```

### Desktop Application
- **Visual Management**: Drag-and-drop task reordering
- **One-Click Actions**: Complete, edit, delete with visual feedback
- **URL Integration**: Click links to open in browser
- **Status Indicators**: Color-coded task states
- **Date Picker**: Easy scheduling with calendar interface

## 🏗️ Architecture

Built with modern, reliable technologies:

- **🔧 Core Framework**: Electron + Node.js for cross-platform compatibility
- **🗃️ Database**: SQLite with better-sqlite3 for fast, reliable local storage
- **⚡ CLI**: Commander.js for professional command-line experience
- **🎨 GUI**: Vanilla JavaScript with clean, minimal styling
- **📅 Date Management**: date-fns for robust date operations

### Project Structure
```
src/
├── core/          # Task model with business logic
├── storage/       # SQLite database and repository pattern
├── cli/           # Command-line interface
├── gui/           # Electron desktop application
└── utils/         # Shared utilities (dates, URLs, import/export)
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Setup Guide](docs/SETUP.md)** | Installation, prerequisites, and troubleshooting |
| **[Usage Guide](docs/USAGE.md)** | Detailed CLI and GUI usage instructions |
| **[FAQ](docs/FAQ.md)** | Frequently asked questions and solutions |
| **[Deployment](docs/DEPLOYMENT.md)** | Building and distributing the application |
| **[Contributing](docs/CONTRIBUTING.md)** | Development setup and contribution guidelines |
| **[Development Guide](CLAUDE.md)** | Architecture and development patterns |

## 💾 Data Storage

- **Location**: `~/.todo-app/tasks.db`
- **Format**: SQLite database
- **Backup**: Use export functionality regularly
- **Privacy**: All data stays on your machine

## 🛠️ Development

```bash
# Development mode
npm run dev        # Desktop with developer tools
npm run cli        # CLI application

# Building
npm run build      # Create distributable packages

# Testing
npm test           # Run test suite (when implemented)
```

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for:

- Development setup instructions
- Code organization patterns
- Testing guidelines
- Pull request process

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Why This TODO App?

- **Privacy First**: Your tasks stay on your device
- **No Subscriptions**: Free and open source forever
- **Dual Interface**: Use CLI for speed, GUI for visual management
- **Data Portability**: Easy import/export in standard formats
- **Cross-Platform**: Works everywhere you do
- **Developer Friendly**: Built by developers, for developers

---

**Ready to get organized? Check out the [Setup Guide](docs/SETUP.md) to get started!** 🚀