/**
 * Release system constants
 */

module.exports = {
  // Build paths
  DIST_DIR: 'dist',
  MAC_BUILD_PATH: 'dist/mac-arm64/Todo App.app',
  MAC_DMG_PATH: 'dist/Todo App-1.0.0-arm64.dmg',

  // Supported platforms
  PLATFORMS: {
    MAC_ARM64: 'mac-arm64',
    MAC_X64: 'mac-x64',
    WIN_X64: 'win-x64',
    LINUX_X64: 'linux-x64'
  },

  // Timeout values (milliseconds)
  BUILD_TIMEOUT: 300000, // 5 minutes
  PUBLISH_TIMEOUT: 60000, // 1 minute
  GIT_TIMEOUT: 10000,     // 10 seconds

  // GitHub CLI settings
  GH_CLI_REQUIRED_VERSION: '2.0.0',

  // Exit codes
  EXIT_CODES: {
    SUCCESS: 0,
    BUILD_FAILED: 1,
    VALIDATION_FAILED: 2,
    GITHUB_API_ERROR: 3,
    VERSION_CONFLICT: 4,
    AUTH_ERROR: 5,
    NETWORK_ERROR: 6,
    GENERAL_ERROR: 7
  },

  // File validation
  MIN_DMG_SIZE: 50 * 1024 * 1024, // 50MB minimum
  MAX_DMG_SIZE: 500 * 1024 * 1024, // 500MB maximum

  // Git settings
  GIT_LOG_FORMAT: '%H|%s|%an|%ai',

  // Release notes
  COMMIT_TYPES: {
    INCLUDE: ['feat:', 'fix:', 'docs:', 'perf:'],
    EXCLUDE: ['chore:', 'refactor:', 'build:', 'test:']
  }
};