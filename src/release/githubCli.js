/**
 * GitHub CLI wrapper for release operations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { createError } = require('./errors');

const execAsync = promisify(exec);

/**
 * Execute GitHub CLI command with error handling
 */
async function execGhCommand(command, options = {}) {
  try {
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

    // Common gh CLI error patterns
    if (errorMessage.includes('not authenticated')) {
      throw createError('AUTH_ERROR', 'GitHub authentication required', errorMessage);
    }

    if (errorMessage.includes('release already exists')) {
      throw createError('VERSION_CONFLICT', 'Release version already exists', errorMessage);
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      throw createError('NETWORK_ERROR', 'Network error during GitHub operation', errorMessage);
    }

    if (errorMessage.includes('API rate limit')) {
      throw createError('GITHUB_API_ERROR', 'GitHub API rate limit exceeded', errorMessage);
    }

    // Generic GitHub API error
    throw createError('GITHUB_API_ERROR', 'GitHub CLI operation failed', errorMessage);
  }
}

/**
 * Check if gh CLI is installed and authenticated
 */
async function checkGhCli() {
  try {
    // Check if gh is installed
    await execAsync('which gh');

    // Check if authenticated
    const result = await execGhCommand('auth status');

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
async function listReleases(limit = 30) {
  const result = await execGhCommand(`release list --limit ${limit} --json tagName,name,publishedAt`);
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
    assetPath = null
  } = options;

  let command = `release create "${version}" --title "${title}" --notes "${notes}"`;

  if (isDraft) {
    command += ' --draft';
  }

  if (assetPath) {
    command += ` "${assetPath}"`;
  }

  const result = await execGhCommand(command);

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