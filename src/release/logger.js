/**
 * Logger and output formatting for release operations
 */

const { EXIT_CODES } = require('./constants');

/**
 * ANSI color codes for console output
 */
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m'
};

/**
 * Log informational message
 */
function info(message, details = null) {
  console.log(`${COLORS.BLUE}ℹ${COLORS.RESET} ${message}`);
  if (details) {
    console.log(`   ${COLORS.GRAY}${details}${COLORS.RESET}`);
  }
}

/**
 * Log success message
 */
function success(message, details = null) {
  console.log(`${COLORS.GREEN}✓${COLORS.RESET} ${message}`);
  if (details) {
    console.log(`   ${COLORS.GRAY}${details}${COLORS.RESET}`);
  }
}

/**
 * Log error message
 */
function error(message, details = null) {
  console.error(`${COLORS.RED}✗${COLORS.RESET} ${message}`);
  if (details) {
    console.error(`   ${COLORS.GRAY}${details}${COLORS.RESET}`);
  }
}

/**
 * Log warning message
 */
function warn(message, details = null) {
  console.warn(`${COLORS.YELLOW}⚠${COLORS.RESET} ${message}`);
  if (details) {
    console.warn(`   ${COLORS.GRAY}${details}${COLORS.RESET}`);
  }
}

/**
 * Log step in process
 */
function step(message, stepNumber = null, totalSteps = null) {
  const prefix = stepNumber && totalSteps ? `[${stepNumber}/${totalSteps}]` : '';
  console.log(`${COLORS.CYAN}🚀${COLORS.RESET} ${prefix} ${message}`);
}

/**
 * Log progress during long-running operations
 */
function progress(message) {
  process.stdout.write(`${COLORS.GRAY}   ${message}...${COLORS.RESET}\r`);
}

/**
 * Clear progress line
 */
function clearProgress() {
  process.stdout.write('\r\x1b[K');
}

/**
 * Log section header
 */
function section(title) {
  console.log();
  console.log(`${COLORS.CYAN}${'='.repeat(60)}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN} ${title}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}${'='.repeat(60)}${COLORS.RESET}`);
  console.log();
}

/**
 * Log build artifact information
 */
function artifact(info) {
  console.log(`${COLORS.GREEN}📦 Build Artifact${COLORS.RESET}`);
  console.log(`   Path: ${info.path}`);
  console.log(`   Size: ${formatFileSize(info.size)}`);
  console.log(`   Hash: ${info.hash.substring(0, 12)}...`);
  console.log(`   Created: ${new Date(info.timestamp).toLocaleString()}`);
}

/**
 * Log release information
 */
function release(info) {
  console.log(`${COLORS.GREEN}🎉 Release Created${COLORS.RESET}`);
  console.log(`   Version: ${info.version}`);
  console.log(`   URL: ${info.url}`);
  if (info.downloadUrl) {
    console.log(`   Download: ${info.downloadUrl}`);
  }
  if (info.isDraft) {
    console.log(`   ${COLORS.YELLOW}Status: Draft (not published)${COLORS.RESET}`);
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);

  return `${size} ${sizes[i]}`;
}

/**
 * Log summary of operations
 */
function summary(operations) {
  console.log();
  console.log(`${COLORS.CYAN}📋 Summary${COLORS.RESET}`);

  operations.forEach(op => {
    const status = op.success ? `${COLORS.GREEN}✓${COLORS.RESET}` : `${COLORS.RED}✗${COLORS.RESET}`;
    const duration = op.duration ? ` (${op.duration}ms)` : '';
    console.log(`   ${status} ${op.name}${duration}`);
  });

  console.log();
}

/**
 * Log with timestamp for debugging
 */
function debug(message, data = null) {
  if (process.env.DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`${COLORS.GRAY}[${timestamp}] DEBUG: ${message}${COLORS.RESET}`);
    if (data) {
      console.log(`${COLORS.GRAY}${JSON.stringify(data, null, 2)}${COLORS.RESET}`);
    }
  }
}

module.exports = {
  info,
  success,
  error,
  warn,
  step,
  progress,
  clearProgress,
  section,
  artifact,
  release,
  summary,
  debug,
  formatFileSize
};