/**
 * GitHub CLI wrapper for release operations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { createError } = require('./errors');

const execAsync = promisify(exec);

/**
 * Execute GitHub CLI command with error handling
 */
async function execGhCommand(command, options = {}) {
  try {
    if (options.debug) {
      console.error(`[gh debug] command: gh ${command}`);
    }

    const { stdout, stderr } = await execAsync(`gh ${command}`, {
      timeout: options.timeout || 30000,
      ...options
    });

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  } catch (error) {
    // Parse gh CLI specific errors
    const errorMessage = error.stderr || error.message || 'Unknown gh error';
    const stderr = error.stderr ? String(error.stderr).trim() : '';
    const stdout = error.stdout ? String(error.stdout).trim() : '';
    const exitInfo = error.code ? `exit code: ${error.code}` : null;
    const signalInfo = error.signal ? `signal: ${error.signal}` : null;
    const diagnosticParts = [errorMessage];

    if (stderr && !errorMessage.includes(stderr)) {
      diagnosticParts.push(stderr);
    }

    if (stdout) {
      diagnosticParts.push(stdout);
    }

    if (exitInfo && !diagnosticParts.includes(exitInfo)) {
      diagnosticParts.push(exitInfo);
    }

    if (signalInfo && !diagnosticParts.includes(signalInfo)) {
      diagnosticParts.push(signalInfo);
    }

    const diagnosticMessage = diagnosticParts.join('\n');

    if (options.debug) {
      console.error('[gh debug] raw error:', error);
    }

    // Common gh CLI error patterns
    if (errorMessage.includes('error connecting to api.github.com')) {
      throw createError('NETWORK_ERROR', 'Cannot reach GitHub API', diagnosticMessage);
    }

    if (error.signal) {
      throw createError('NETWORK_ERROR', 'GitHub CLI terminated (possible timeout or network issue)', diagnosticMessage);
    }

    if (errorMessage.includes('not authenticated')) {
      throw createError('AUTH_ERROR', 'GitHub authentication required', diagnosticMessage);
    }

    if (errorMessage.includes('release already exists')) {
      throw createError('VERSION_CONFLICT', 'Release version already exists', diagnosticMessage);
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      throw createError('NETWORK_ERROR', 'Network error during GitHub operation', diagnosticMessage);
    }

    if (errorMessage.includes('API rate limit')) {
      throw createError('GITHUB_API_ERROR', 'GitHub API rate limit exceeded', diagnosticMessage);
    }

    // Generic GitHub API error
    throw createError('GITHUB_API_ERROR', 'GitHub CLI operation failed', diagnosticMessage);
  }
}

/**
 * Check if gh CLI is installed and authenticated
 */
async function checkGhCli(options = {}) {
  try {
    // Check if gh is installed
    await execAsync('which gh');

    // Check if authenticated
    const result = await execGhCommand('auth status', options);

    return {
      installed: true,
      authenticated: result.success,
      stdout: result.stdout
    };
  } catch (error) {
    if (error.code === 'ENOENT' || error.message.includes('command not found')) {
      throw createError('GENERAL_ERROR', 'GitHub CLI (gh) is not installed', 'Install from: https://cli.github.com/');
    }

    // Auth error will be thrown by execGhCommand
    throw error;
  }
}

/**
 * Get list of existing releases
 */
async function listReleases(limit = 30, options = {}) {
  const result = await execGhCommand(`release list --limit ${limit} --json tagName,name,publishedAt`, options);
  return JSON.parse(result.stdout || '[]');
}

/**
 * Create a new GitHub release
 */
async function createRelease(options) {
  const {
    version,
    title,
    notes,
    isDraft = false,
    assetPath = null,
    debug = false,
    timeout = null
  } = options;

  const notesFile = path.join(os.tmpdir(), `todo-release-notes-${Date.now()}.md`);
  await fs.writeFile(notesFile, notes || 'Release notes', 'utf8');

  let command = `release create "${version}" --title "${title}" --notes-file "${notesFile}"`;

  if (isDraft) {
    command += ' --draft';
  }

  if (assetPath) {
    command += ` "${assetPath}"`;
  }

  const result = await execGhCommand(command, { debug, timeout });

  try {
    await fs.unlink(notesFile);
  } catch (cleanupError) {
    // Best-effort cleanup; ignore failure.
  }

  // Parse release URL from output
  const urlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+/);
  const releaseUrl = urlMatch ? urlMatch[0] : null;

  return {
    version,
    tag: version,
    url: releaseUrl,
    downloadUrl: assetPath ? `${releaseUrl}/download/${version}/${assetPath.split('/').pop()}` : null,
    isDraft
  };
}

module.exports = {
  execGhCommand,
  checkGhCli,
  listReleases,
  createRelease
};
