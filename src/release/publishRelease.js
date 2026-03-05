/**
 * GitHub release publishing functionality
 */

const { createError } = require('./errors');
const { PUBLISH_TIMEOUT } = require('./constants');
const { parseVersion } = require('./version');
const { checkGhCli, listReleases, createRelease } = require('./githubCli');

/**
 * Check if version already exists on GitHub releases
 */
async function checkVersionConflict(versionString, options = {}) {
  const parsed = parseVersion(versionString);

  try {
    const releases = await listReleases(30, options);

    const duplicate = releases.find(release =>
      release.tagName === parsed.tag || release.tagName === parsed.clean
    );

    if (duplicate) {
      throw createError(
        'VERSION_CONFLICT',
        `Version ${parsed.tag} already exists on GitHub`,
        `Published: ${duplicate.publishedAt || 'Unknown date'}`
      );
    }

    return true;
  } catch (error) {
    // Re-throw VERSION_CONFLICT errors
    if (error.exitCode === 4) {
      throw error;
    }

    // For other errors (like auth issues), we can't verify duplicates
    // Let GitHub handle the conflict during release creation
    return true;
  }
}

/**
 * Publish release to GitHub with asset
 */
async function publishToGitHub(options) {
  const {
    version,
    title,
    notes,
    isDraft = false,
    assetPath = null,
    debug = false
  } = options;

  // Parse version to ensure proper formatting
  const parsed = parseVersion(version);

  // Check GitHub CLI is available and authenticated
  const ghStatus = await checkGhCli({ debug });

  if (!ghStatus.installed) {
    throw createError('GENERAL_ERROR', 'GitHub CLI (gh) is not installed', 'Install from: https://cli.github.com/');
  }

  if (!ghStatus.authenticated) {
    throw createError('AUTH_ERROR', 'GitHub authentication required', 'Run: gh auth login');
  }

  try {
    // Create the GitHub release
    const releaseOptions = {
      version: parsed.tag,
      title: title || parsed.tag,
      notes: notes || 'Release notes',
      isDraft,
      assetPath
    };

    const release = await createRelease({ ...releaseOptions, debug, timeout: PUBLISH_TIMEOUT });

    return {
      version: parsed.clean,
      tag: parsed.tag,
      url: release.url,
      downloadUrl: release.downloadUrl,
      isDraft
    };
  } catch (error) {
    // GitHub CLI errors are already handled by githubCli module
    throw error;
  }
}

/**
 * Check if we can publish (gh auth and network connectivity)
 */
async function checkPublishReadiness(options = {}) {
  try {
    const ghStatus = await checkGhCli(options);
    return {
      ready: ghStatus.installed && ghStatus.authenticated,
      ghInstalled: ghStatus.installed,
      authenticated: ghStatus.authenticated,
      message: ghStatus.stdout
    };
  } catch (error) {
    return {
      ready: false,
      ghInstalled: false,
      authenticated: false,
      error: error.message
    };
  }
}

module.exports = {
  checkVersionConflict,
  publishToGitHub,
  checkPublishReadiness
};
