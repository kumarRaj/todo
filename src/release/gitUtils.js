/**
 * Git utilities for release operations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { createError } = require('./errors');
const { GIT_TIMEOUT, GIT_LOG_FORMAT } = require('./constants');

const execAsync = promisify(exec);

/**
 * Execute git command with error handling
 */
async function execGitCommand(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(`git ${command}`, {
      timeout: options.timeout || GIT_TIMEOUT,
      ...options
    });

    return stdout.trim();
  } catch (error) {
    throw createError('GENERAL_ERROR', `Git command failed: ${command}`, error.message);
  }
}

/**
 * Get the latest git tag
 */
async function getLatestTag() {
  try {
    const result = await execGitCommand('describe --tags --abbrev=0');
    return result;
  } catch (error) {
    // No tags found
    return null;
  }
}

/**
 * Get all commits since a specific tag or from beginning
 */
async function getCommitsSince(fromTag = null) {
  let command = fromTag
    ? `log ${fromTag}..HEAD --format="${GIT_LOG_FORMAT}"`
    : `log --format="${GIT_LOG_FORMAT}"`;

  const result = await execGitCommand(command);

  if (!result) {
    return [];
  }

  return result.split('\n').map(line => {
    const [hash, message, author, date] = line.split('|');
    return {
      hash: hash?.trim(),
      message: message?.trim(),
      author: author?.trim(),
      date: date?.trim()
    };
  }).filter(commit => commit.hash && commit.message);
}

/**
 * Get current branch name
 */
async function getCurrentBranch() {
  return await execGitCommand('rev-parse --abbrev-ref HEAD');
}

/**
 * Create a new git tag
 */
async function createTag(version, message = null) {
  const tagMessage = message || `Release ${version}`;
  await execGitCommand(`tag -a "${version}" -m "${tagMessage}"`);
  return version;
}

/**
 * Check if working directory is clean (no uncommitted changes)
 */
async function isWorkingDirectoryClean() {
  try {
    const result = await execGitCommand('status --porcelain');
    return result.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get commit count between two references
 */
async function getCommitCount(from, to = 'HEAD') {
  const range = from ? `${from}..${to}` : to;
  const result = await execGitCommand(`rev-list --count ${range}`);
  return parseInt(result, 10) || 0;
}

/**
 * Check if a tag exists locally
 */
async function tagExists(tagName) {
  try {
    await execGitCommand(`rev-parse --verify "refs/tags/${tagName}"`);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  execGitCommand,
  getLatestTag,
  getCommitsSince,
  getCurrentBranch,
  createTag,
  isWorkingDirectoryClean,
  getCommitCount,
  tagExists
};