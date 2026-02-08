# Deployment Guide

This guide covers building and distributing the TODO Management Application.

## Building Desktop Application

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

## Installing the Built Application

After building, you can install the application system-wide. The build process creates platform-specific packages in the `dist/` directory:

- **macOS**: `Todo App.app` (app bundle)
- **Windows**: `.exe` installer or unpacked executable
- **Linux**: `.AppImage`, `.deb`, or `.rpm` packages

Choose the installation method that works best for your platform:

## macOS Installation

### Method 1: Copy to Applications folder (Recommended)
```bash
# Copy the app bundle to Applications
cp -R "dist/mac-arm64/Todo App.app" /Applications/

# Or use Finder:
# 1. Open Finder and navigate to your project's dist/mac-arm64/ folder
# 2. Drag "Todo App.app" to your Applications folder
# 3. The app will now be available in Launchpad and Applications
```

### Method 2: Run from anywhere
```bash
# Make the app executable from any location
open "dist/mac-arm64/Todo App.app"

# Or double-click the app in Finder
```

### Method 3: Create an alias/shortcut
```bash
# Create a symlink in Applications (optional)
ln -s "$(pwd)/dist/mac-arm64/Todo App.app" /Applications/

# This keeps the original in your project but makes it available in Applications
```

### Usage After Installation

Once installed in Applications:
- **Launchpad**: Find "Todo App" in Launchpad
- **Spotlight**: Press `Cmd+Space` and type "Todo App"
- **Applications folder**: Open Applications folder and double-click "Todo App"
- **Dock**: You can drag the app to your Dock for quick access

### Uninstalling macOS App

To remove the application:
```bash
# Remove from Applications
rm -rf "/Applications/Todo App.app"

# Remove app data (optional - this deletes all your tasks!)
rm -rf ~/.todo-app/
```

## Windows Installation

### Method 1: Install using the installer (if built)
```cmd
# If you built with --win, run the installer
Todo App Setup 1.0.0.exe
```

### Method 2: Copy executable to Program Files
```cmd
# Copy to Program Files (requires admin privileges)
xcopy "dist\win-unpacked" "C:\Program Files\Todo App\" /E /I

# Or copy to a local directory
xcopy "dist\win-unpacked" "C:\Users\%USERNAME%\AppData\Local\Todo App\" /E /I
```

### Method 3: Run portable version
```cmd
# Navigate to the built directory and run directly
cd dist\win-unpacked
"Todo App.exe"
```

## Linux Installation

### Method 1: Install AppImage (Universal)
```bash
# Make the AppImage executable
chmod +x "dist/Todo App-1.0.0.AppImage"

# Move to local applications directory
mv "dist/Todo App-1.0.0.AppImage" ~/.local/bin/todo-app

# Or move to system-wide location (requires sudo)
sudo mv "dist/Todo App-1.0.0.AppImage" /usr/local/bin/todo-app
```

### Method 2: Install package (if built)
```bash
# For .deb packages (Ubuntu/Debian)
sudo dpkg -i "dist/Todo App_1.0.0_amd64.deb"

# For .rpm packages (Red Hat/CentOS/Fedora)
sudo rpm -i "dist/Todo App-1.0.0.x86_64.rpm"
```

### Method 3: Manual installation
```bash
# Copy to local applications
cp -r "dist/linux-unpacked" ~/.local/share/todo-app

# Create desktop entry
cat > ~/.local/share/applications/todo-app.desktop << EOF
[Desktop Entry]
Name=Todo App
Exec=$HOME/.local/share/todo-app/todo-app
Icon=$HOME/.local/share/todo-app/icon.png
Type=Application
Categories=Productivity;
EOF
```

## Installation Troubleshooting

### macOS
- **"App is damaged"**: Right-click the app → "Open" → "Open" again
- **Security warning**: System Preferences → Security & Privacy → "Open Anyway"
- **Permission denied**: `sudo cp -R "dist/mac-arm64/Todo App.app" /Applications/`

### Windows
- **Windows Defender**: Add exception or click "More info" → "Run anyway"
- **Installation fails**: Run installer as Administrator
- **App won't start**: Install Visual C++ Redistributable

### Linux
- **AppImage won't run**: Install FUSE: `sudo apt install fuse` (Ubuntu/Debian)
- **Permission denied**: `chmod +x Todo\ App-1.0.0.AppImage`
- **Missing dependencies**: Install `libgtk-3-0` and `libnss3`

## Cross-Platform Build Notes

### macOS
- App will be code-signed if certificates are available
- Creates `.dmg` installer and `.app` bundle
- Requires macOS for building macOS packages

### Windows
- Creates `.exe` installer and portable version
- Can be built from any platform with proper setup

### Linux
- Creates `.AppImage` for universal compatibility
- Also supports `.deb` and `.rpm` packages

## Build Configuration

Build settings are configured in `package.json` under the `build` section:

```json
{
  "build": {
    "appId": "com.raj.todo-app",
    "productName": "Todo App",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

## Distribution

Once built, the generated packages can be:
- Shared directly with users
- Uploaded to release pages on GitHub
- Distributed through platform-specific app stores
- Hosted on your own download server

## Release Process

1. Update version in `package.json`
2. Test on target platforms
3. Run build for all platforms
4. Test built packages on clean systems
5. Create release notes
6. Tag the release in git
7. Upload packages to distribution platform