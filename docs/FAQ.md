# Frequently Asked Questions (FAQ)

## General Questions

**Q: Where are my tasks stored?**
A: Tasks are stored locally in `~/.todo-app/tasks.db` using SQLite. No cloud sync required.

**Q: Can I sync between devices?**
A: Currently, sync is manual via export/import. Cloud sync may be added in future versions.

**Q: Does this work offline?**
A: Yes! The entire application works offline. No internet connection required.

**Q: Is my data secure?**
A: All data stays on your local machine. No telemetry or data collection.

## Data Management

**Q: How do I backup my data?**
A: Use the export functionality:
```bash
node src/cli/index.js export backup.json
# Or for regular backups:
node src/cli/index.js export backup-$(date +%Y%m%d).json
```

**Q: Can I import from other todo applications?**
A: The app supports text and JSON import. You can convert data from other apps to these formats.

**Q: What happens if I lose my database file?**
A: Your tasks will be lost unless you have a backup. Regular exports are recommended for data safety.

**Q: Can I move my tasks to a different computer?**
A: Yes! Export your tasks on the old computer and import them on the new one:
```bash
# On old computer
node src/cli/index.js export all-tasks.json

# On new computer (after setup)
node src/cli/index.js import all-tasks.json
```

## Installation & Setup

**Q: Do I need to install anything besides Node.js?**
A: No, all dependencies are included. Just run `npm install` after cloning.

**Q: Why do I need to run `npx electron-rebuild`?**
A: This rebuilds native modules (like SQLite) for your specific platform and Node.js version.

**Q: Can I run this without installing Node.js?**
A: Not the source version. You'd need to use a pre-built executable (see [DEPLOYMENT.md](DEPLOYMENT.md)).

**Q: The CLI command is too long. Can I make it shorter?**
A: Yes! Run `npm link` in the project directory, then you can use `todo` instead of `node src/cli/index.js`.

## Usage Questions

**Q: How do I add a task with a URL?**
A: Just include the URL in your task description:
```bash
todo add "Review PR at https://github.com/user/repo/pull/123"
```
URLs are automatically detected and can be clicked in the GUI or opened with the `open` command.

**Q: Can I edit a task after creating it?**
A: Yes! In the GUI, click the edit button (✏️). The CLI doesn't have direct edit functionality yet - you'd need to delete and re-add.

**Q: How do I see completed tasks?**
A:
- CLI: `node src/cli/index.js list --completed`
- GUI: Switch to "Completed" view mode

**Q: What's the difference between "In Progress" and "Pending"?**
A:
- **Pending**: Task not yet started (default state)
- **In Progress**: Task is actively being worked on
- **Waiting**: Task is blocked or waiting for external input
- **Completed**: Task is finished

**Q: How do I change the priority of tasks?**
A:
- CLI: `node src/cli/index.js move 1 up` or `node src/cli/index.js move 2 down`
- GUI: Drag and drop tasks to reorder them

## Technical Questions

**Q: Why SQLite instead of a cloud database?**
A: This is designed to be a local-first application. Your data stays private and works without internet.

**Q: Can I run both CLI and GUI at the same time?**
A: Yes! They both use the same database file, so changes in one will be reflected in the other.

**Q: Does the GUI auto-refresh when I use CLI commands?**
A: The GUI should refresh when you switch back to it, but you might need to restart it occasionally if data seems out of sync.

**Q: Why does the app use Electron instead of a native GUI?**
A: Electron allows cross-platform compatibility and easier development with web technologies.

## Import/Export Questions

**Q: What file formats are supported for import?**
A: Text files (various todo formats), JSON files (including exports from this app), and CSV files.

**Q: Can I export only pending tasks?**
A: Yes:
```bash
node src/cli/index.js export --no-completed pending-only.json
```

**Q: My existing todo file has a weird format. Will it work?**
A: The import function is designed to handle various text-based formats. Try it with a small sample first.

**Q: Can I schedule regular exports?**
A: Not built-in, but you can create a system cron job or scheduled task:
```bash
# Daily backup (add to crontab)
0 2 * * * cd /path/to/todo-app && node src/cli/index.js export ~/backups/todo-$(date +\%Y\%m\%d).json
```

## Troubleshooting

**Q: The app won't start. What should I do?**
A: Try these steps:
1. Run `npx electron-rebuild`
2. Check Node.js version (`node --version` - needs 18+)
3. Try `npm run dev` to see error messages
4. Check if `~/.todo-app/` directory has proper permissions

**Q: I'm getting SQLite errors. How do I fix them?**
A:
```bash
npm rebuild better-sqlite3
# Or for Electron:
npx electron-rebuild
```

**Q: The CLI says "command not found" after `npm link`. Why?**
A: Check your PATH and npm configuration. Try:
```bash
npm config get prefix
# Make sure this directory is in your PATH
```

**Q: GUI is not showing my tasks. What's wrong?**
A:
1. Check if CLI shows tasks: `node src/cli/index.js list --all`
2. If CLI works but GUI doesn't, restart the GUI
3. Check console for errors (`Ctrl+Shift+I` or `Cmd+Opt+I`)

**Q: Can I recover deleted tasks?**
A: No built-in recovery. Deleted tasks are permanently removed. Regular backups are the only way to recover data.

## Performance Questions

**Q: How many tasks can the app handle?**
A: SQLite can handle millions of records, but the GUI might get slower with thousands of tasks. Consider archiving completed tasks regularly.

**Q: The app is running slowly. What can I do?**
A:
1. Export and delete old completed tasks
2. Check available disk space
3. Restart the application
4. Check for other resource-intensive applications

**Q: Does the app use a lot of memory?**
A: The Electron GUI uses more memory than native apps (typical for Electron), but the CLI is very lightweight.

## Feature Requests

**Q: Will there be mobile apps?**
A: Not currently planned. The focus is on desktop and CLI interfaces.

**Q: Can you add cloud sync?**
A: Possibly in future versions. Currently, manual export/import is the sync method.

**Q: Will there be team/collaboration features?**
A: This is designed as a personal todo app. Team features aren't currently planned.

**Q: Can you add time tracking?**
A: Not currently planned, but the timestamp data is available for basic time analysis.

## Getting More Help

If your question isn't answered here:

1. Check the other documentation files:
   - [SETUP.md](SETUP.md) - Installation and setup
   - [USAGE.md](USAGE.md) - Detailed usage instructions
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Building and distribution
   - [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

2. Search existing GitHub issues

3. Open a new issue with:
   - Operating system and version
   - Node.js version
   - Complete error messages
   - Steps to reproduce the problem

4. For development questions, see [CLAUDE.md](../CLAUDE.md) for architectural guidance