/**
 * Release system error handling
 */

const { EXIT_CODES } = require('./constants');

/**
 * Custom error class for release operations
 */
class ReleaseError extends Error {
  constructor(message, exitCode = EXIT_CODES.GENERAL_ERROR, diagnostic = null) {
    super(message);
    this.name = 'ReleaseError';
    this.exitCode = exitCode;
    this.diagnostic = diagnostic;
  }

  /**
   * Create a formatted error message with diagnostic info
   */
  getFormattedMessage() {
    let formatted = `❌ ${this.message}`;

    if (this.diagnostic) {
      formatted += `\n   ${this.diagnostic}`;
    }

    // Add recovery suggestions based on error type
    const suggestion = this.getRecoverySuggestion();
    if (suggestion) {
      formatted += `\n   💡 ${suggestion}`;
    }

    return formatted;
  }

  /**
   * Get recovery suggestion based on exit code
   */
  getRecoverySuggestion() {
    switch (this.exitCode) {
      case EXIT_CODES.BUILD_FAILED:
        return 'Try: npm rebuild better-sqlite3 && npm run build';
      case EXIT_CODES.AUTH_ERROR:
        return 'Run: gh auth login';
      case EXIT_CODES.VERSION_CONFLICT:
        return 'Use a different version number or delete the existing release';
      case EXIT_CODES.NETWORK_ERROR:
        return 'Check internet connection and try again with --skip-build';
      case EXIT_CODES.VALIDATION_FAILED:
        return 'Verify the build completed successfully and files exist';
      default:
        return null;
    }
  }
}

/**
 * Exit code mapping for different error types
 */
const ERROR_TYPES = {
  BUILD_FAILED: EXIT_CODES.BUILD_FAILED,
  VALIDATION_FAILED: EXIT_CODES.VALIDATION_FAILED,
  GITHUB_API_ERROR: EXIT_CODES.GITHUB_API_ERROR,
  VERSION_CONFLICT: EXIT_CODES.VERSION_CONFLICT,
  AUTH_ERROR: EXIT_CODES.AUTH_ERROR,
  NETWORK_ERROR: EXIT_CODES.NETWORK_ERROR,
  GENERAL_ERROR: EXIT_CODES.GENERAL_ERROR
};

/**
 * Create error with appropriate exit code
 */
function createError(type, message, diagnostic = null) {
  const exitCode = ERROR_TYPES[type] || EXIT_CODES.GENERAL_ERROR;
  return new ReleaseError(message, exitCode, diagnostic);
}

/**
 * Handle and format error for output
 */
function handleError(error) {
  if (error instanceof ReleaseError) {
    console.error(error.getFormattedMessage());
    process.exit(error.exitCode);
  } else {
    // Unknown error - wrap in ReleaseError
    const releaseError = new ReleaseError(
      error.message || 'Unknown error occurred',
      EXIT_CODES.GENERAL_ERROR,
      error.stack
    );
    console.error(releaseError.getFormattedMessage());
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

module.exports = {
  ReleaseError,
  ERROR_TYPES,
  createError,
  handleError
};