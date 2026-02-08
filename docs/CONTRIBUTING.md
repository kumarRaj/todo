# Contributing Guide

Thank you for considering contributing to the TODO Management Application! This guide will help you get started with development and contributions.

## Development Setup

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone <your-fork-url>
   cd todo-app
   ```
3. **Install dependencies:**
   ```bash
   npm install
   npx electron-rebuild
   ```
4. **Run in development mode:**
   ```bash
   # CLI with hot reload
   npm run cli

   # Desktop with developer tools
   npm run dev
   ```

## Project Architecture

### Core Principles
- **Repository Pattern**: All data access goes through TaskRepository
- **Shared Logic**: CLI and GUI use the same core business logic
- **Local-First**: SQLite database, no cloud dependencies
- **Dual Interface**: Feature parity between CLI and GUI when applicable

### Layer Architecture
```
src/
├── core/          # Business logic (Task model)
├── storage/       # Data persistence (TaskRepository, Database)
├── cli/           # Command-line interface
├── gui/           # Desktop GUI (Electron)
└── utils/         # Shared utilities
```

### Development Workflow
1. **Start with core**: Define behavior in Task model
2. **Add persistence**: Update database schema and repository
3. **Build interfaces**: Add CLI commands and/or GUI features
4. **Test both interfaces**: Ensure feature parity

## Adding New Features

### New Task Properties
1. Add property to `src/core/task.js`
2. Update database schema in `src/storage/database.js`
3. Modify TaskRepository methods in `src/storage/taskRepository.js`
4. Update both CLI and GUI interfaces

### New CLI Commands
1. Add command definition in `src/cli/index.js`
2. Use existing TaskRepository methods or add new ones
3. Follow pattern: parse args → call repository → format output
4. Add help text and examples

### New GUI Features
1. Add IPC handler in `src/gui/main.js` (if data access needed)
2. Update `src/gui/renderer/renderer.js` for functionality
3. Update `src/gui/renderer/index.html` for UI elements
4. Style in `src/gui/renderer/styles.css`
5. Export global functions from renderer.js for onclick handlers

### New Utility Functions
- **Date/Time**: Add to `src/utils/dateHelpers.js`
- **URL Processing**: Add to `src/utils/urlHelpers.js`
- **General Utilities**: Create new files in `src/utils/`

## Code Standards

### JavaScript Style
- Use ES6+ features where appropriate
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for short functions
- Use template literals for string interpolation
- Add JSDoc comments for public functions

### Error Handling
- Repository layer handles database errors
- Task model validates state transitions
- Interfaces handle user input validation
- Provide meaningful error messages

### File Organization
- Keep related functionality together
- Use descriptive file names
- Follow existing directory structure
- Create new utilities in `src/utils/`

## Testing

### Running Tests
```bash
npm test
```

### Test Structure
Create tests in `test/` directory matching source structure:
```
test/
├── core/
│   └── task.test.js
├── storage/
│   └── taskRepository.test.js
├── cli/
│   └── commands.test.js
└── utils/
    └── importExport.test.js
```

### Test Guidelines
- **Unit Tests**: Test business logic independently
- **Integration Tests**: Test with actual SQLite database
- **CLI Tests**: Mock TaskRepository, test command parsing
- **Import/Export Tests**: Use sample data files
- **GUI Tests**: Consider using Spectron for E2E testing

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Follow the conventional commit format:
```
type(scope): description

feat(cli): add task scheduling command
fix(gui): resolve drag-and-drop priority bug
docs(readme): update installation instructions
refactor(storage): simplify database queries
```

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Test both CLI and desktop applications
4. Update documentation if needed
5. Submit pull request with:
   - Clear description of changes
   - Screenshots for GUI changes
   - Test results
   - Breaking change notes (if any)

## Development Scripts

```bash
# Development
npm start          # Start desktop GUI
npm run dev        # Start desktop GUI with dev tools
npm run cli        # Run CLI application
npm test           # Run tests

# Building
npm run build      # Build for current platform
npm run build -- --mac --win --linux  # Build for all platforms

# Maintenance
npm run lint       # Check code style (if configured)
npm audit          # Check for security vulnerabilities
```

## Database Development

### Schema Changes
1. Update `src/storage/database.js`
2. Add migration logic if needed
3. Update TaskRepository methods
4. Test with existing data

### Repository Pattern
- All database access through TaskRepository
- Use parameterized queries to prevent SQL injection
- Handle errors appropriately
- Return consistent data structures

## GUI Development

### Electron Architecture
- Main process: `src/gui/main.js`
- Renderer process: `src/gui/renderer/`
- IPC for communication between processes

### UI Guidelines
- Keep interface minimal and clean
- Maintain consistency with existing design
- Support keyboard navigation
- Provide visual feedback for actions

### Adding UI Elements
1. Update HTML in `src/gui/renderer/index.html`
2. Add functionality in `src/gui/renderer/renderer.js`
3. Style in `src/gui/renderer/styles.css`
4. Add IPC handlers if data access needed

## Documentation

### Code Documentation
- Add JSDoc comments for public functions
- Document complex algorithms
- Include usage examples
- Update CLAUDE.md for architectural changes

### User Documentation
- Update USAGE.md for new features
- Update SETUP.md for installation changes
- Keep FAQ.md current with common issues
- Add screenshots for GUI features

## Release Process

### Version Management
1. Update version in `package.json`
2. Update changelog
3. Test on all platforms
4. Create git tag
5. Build distribution packages

### Testing Before Release
- Test CLI on multiple platforms
- Test desktop app builds
- Verify import/export functionality
- Check with sample data sets

## Common Development Tasks

### Adding New Import/Export Format
1. Add format handler in `src/utils/importExport.js`
2. Follow existing patterns for parsing/generation
3. Update CLI commands
4. Add test cases with sample data

### Modifying Task States
1. Update state definitions in `src/core/task.js`
2. Update database schema if needed
3. Modify GUI status indicators
4. Update CLI status commands

### Performance Optimization
- Profile database queries
- Optimize GUI rendering
- Consider lazy loading for large datasets
- Monitor memory usage in Electron

## Getting Help

### Resources
- [Electron Documentation](https://electronjs.org/docs)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Commander.js Documentation](https://github.com/tj/commander.js)

### Communication
- Open issues for bugs or feature requests
- Use discussions for questions
- Follow existing code patterns
- Ask questions in pull request comments

## Code of Conduct

### Guidelines
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and improve
- Maintain professional communication

### Reporting Issues
Report any conduct issues privately to maintainers.

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Git history and commit messages

Thank you for contributing to making this TODO application better! 🎉