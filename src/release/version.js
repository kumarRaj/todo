/**
 * Version validation and management
 */

const { createError } = require('./errors');
const { listReleases } = require('./githubCli');

/**
 * Parse version string into components
 */
function parseVersion(versionString) {
  // Remove 'v' prefix if present
  const cleanVersion = versionString.replace(/^v/, '');

  // Match semantic version pattern (major.minor.patch with optional pre-release)
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9\-\.]+))?$/);

  if (!match) {
    throw createError('GENERAL_ERROR', `Invalid version format: ${versionString}`, 'Use semantic versioning: 1.2.3 or 1.2.3-alpha.1');
  }

  const [, major, minor, patch, prerelease] = match;

  return {
    original: versionString,
    clean: cleanVersion,
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease: prerelease || null,
    tag: `v${cleanVersion}` // Always use 'v' prefix for git tags
  };
}

/**
 * Validate version format
 */
function validateFormat(versionString) {
  try {
    const parsed = parseVersion(versionString);
    return {
      valid: true,
      parsed
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Check if version already exists on GitHub
 */
async function checkForDuplicate(versionString) {
  const parsed = parseVersion(versionString);

  try {
    const releases = await listReleases();

    const duplicate = releases.find(release =>
      release.tagName === parsed.tag || release.tagName === parsed.clean
    );

    if (duplicate) {
      throw createError(
        'VERSION_CONFLICT',
        `Version ${parsed.tag} already exists on GitHub`,
        `Published: ${duplicate.publishedAt}`
      );
    }

    return false;
  } catch (error) {
    // Re-throw VERSION_CONFLICT errors
    if (error.exitCode === 4) {
      throw error;
    }

    // For other errors (like auth issues), we can't verify duplicates
    // Let GitHub handle the conflict during release creation
    return false;
  }
}

/**
 * Compare two version strings
 */
function compareVersions(version1, version2) {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);

  // Compare major.minor.patch
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  if (v1.patch !== v2.patch) return v1.patch - v2.patch;

  // Handle pre-release versions
  if (!v1.prerelease && !v2.prerelease) return 0;
  if (v1.prerelease && !v2.prerelease) return -1; // pre-release < release
  if (!v1.prerelease && v2.prerelease) return 1;  // release > pre-release

  // Both have pre-release, compare lexically
  return v1.prerelease.localeCompare(v2.prerelease);
}

/**
 * Generate next version based on current and increment type
 */
function generateNextVersion(currentVersion, incrementType = 'patch') {
  const parsed = parseVersion(currentVersion);

  let { major, minor, patch } = parsed;

  switch (incrementType) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
    default:
      patch++;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

module.exports = {
  parseVersion,
  validateFormat,
  checkForDuplicate,
  compareVersions,
  generateNextVersion
};