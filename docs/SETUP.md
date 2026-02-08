# Setup Guide

This guide covers installation and setup for the TODO Management Application.

## Prerequisites

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - For cloning the repository

## Quick Start

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

## Installation Methods

### Method 1: Development Setup
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

### Method 2: Manual Installation
For users who prefer manual setup:

1. Download and extract the source code
2. Open terminal in the extracted folder
3. Run `npm install` and `npx electron-rebuild`
4. Use the applications as described in [USAGE.md](USAGE.md)

## Troubleshooting Installation

### Common Issues:

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

## Development Setup

For development work:

```bash
# CLI with auto-reload
npm run cli

# Desktop with dev tools
npm run dev
```

## Global CLI Access

To make the CLI available system-wide:

```bash
npm link                     # Now use 'todo' command anywhere
todo add "Global task"
todo list
```

## Data Storage

Your tasks are stored locally in:
- **Location:** `~/.todo-app/tasks.db` (SQLite database)
- **Backup:** Use export functionality regularly
- **Migration:** Import feature supports various formats

## Platform-Specific Notes

### macOS
- No additional setup required
- App data stored in `~/.todo-app/`

### Windows
- Ensure Visual C++ Redistributable is installed
- App data stored in `%USERPROFILE%\.todo-app\`

### Linux
- May need to install `libgtk-3-0` and `libnss3`
- App data stored in `~/.todo-app/`

## Next Steps

After setup is complete:
- See [USAGE.md](USAGE.md) for detailed usage instructions
- See [DEPLOYMENT.md](DEPLOYMENT.md) for building distributable packages
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines