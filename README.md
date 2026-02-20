# TODO Management Application

<img width="794" height="596" alt="image" src="https://github.com/user-attachments/assets/fa690bd3-00a7-4b4c-aaa4-c4240090dab3" />


A comprehensive, local-first TODO management application with both command-line and desktop interfaces.

## 🚀 How to Use

### Desktop GUI Application
Start the visual interface:
```bash
npm start
```
Then use the intuitive desktop interface to:
- **Add tasks**: Type in the input field and press Enter
- **Edit tasks**: Click the ✏️ edit button or right-click for inline editing
- **Change status**: Use the dropdown menu (Pending → In Progress → Waiting → Completed)
- **Reorder tasks**: Drag-and-drop or use the ↑↓ arrow buttons
- **Filter by tags**: Use hashtags like #work #personal, then filter with buttons
- **Open URLs**: Click any detected links to open in your browser
- **Schedule tasks**: Add due dates with the calendar picker

### Command Line Interface
Use the CLI for fast task management:
```bash
# Essential commands
node src/cli/index.js add "Review pull request"
node src/cli/index.js add "Team meeting #work" --schedule 2026-02-15
node src/cli/index.js list
node src/cli/index.js complete 1
node src/cli/index.js --help  # See all available commands

# Advanced usage
node src/cli/index.js import my-old-todos.txt
node src/cli/index.js export backup.json
node src/cli/index.js list --completed
```

### Quick Task Examples
```bash
# Add tasks with URLs and tags
node src/cli/index.js add "Review https://github.com/project/repo/pull/123 #work"
node src/cli/index.js add "Buy groceries #personal"
node src/cli/index.js add "Deploy feature #work" --schedule tomorrow

# Manage your workflow
node src/cli/index.js status 1 in_progress    # Mark task as started
node src/cli/index.js move 2 up               # Increase priority
node src/cli/index.js list                    # See current tasks
```

## ✨ Features

- **🖥️ Dual Interface**: Fast CLI for power users, intuitive desktop GUI for visual management
- **📱 Cross-Platform**: Works on Windows, macOS, and Linux
- **🔒 Local-First**: All data stored locally in SQLite - no cloud dependencies
- **🔗 URL Integration**: Auto-detects and opens URLs directly from tasks
- **📊 Priority Management**: Drag-and-drop reordering with intelligent priority system
- **📅 Task Scheduling**: Set due dates and organize by time
- **🏷️ Hashtag Tags**: Use #work #personal tags with smart filtering
- **📤 Import/Export**: Backup data and migrate from other todo systems
- **🎯 Status Tracking**: Pending → In Progress → Waiting → Completed workflow

## 💾 Data Storage

- **Location**: `~/.todo-app/tasks.db`
- **Format**: SQLite database
- **Backup**: Use export functionality regularly
- **Privacy**: All data stays on your machine

## ⚙️ Setup & Installation

If you're setting up the app for the first time:

```bash
# Clone the repository
git clone <repository-url>
cd todo-app

# Install dependencies
npm install

# Rebuild native modules for your platform
npx electron-rebuild

# You're ready! Start using the app:
npm start                                    # Desktop GUI
node src/cli/index.js --help               # CLI help
```

### Troubleshooting Setup
- **SQLite errors**: Run `npm rebuild better-sqlite3`
- **Module version mismatch**: Run `npx electron-rebuild`
- **Build issues on macOS**: App builds to `dist/mac-arm64/` (ARM64 optimized)

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

## 🛠️ Development

For developers working on the codebase:

```bash
# Development mode
npm run dev        # Desktop with developer tools enabled
npm run cli        # CLI application shortcut

# Building and packaging
npm run build      # Create distributable packages for all platforms
npm run install-mac # Build and install to Applications folder (macOS)

# Testing
npm test           # Run test suite (when implemented)
```

See [Development Guide (CLAUDE.md)](CLAUDE.md) for detailed architecture information and development patterns.

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
