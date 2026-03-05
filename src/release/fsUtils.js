/**
 * File system utilities for release operations
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createError } = require('./errors');
const { MIN_DMG_SIZE, MAX_DMG_SIZE, MAC_BUILD_PATH } = require('./constants');

/**
 * Find build artifact in expected location
 */
async function findArtifact(platform = 'mac-arm64', options = {}) {
  let artifactPath;
  const { requiredType = null } = options;

  switch (platform) {
    case 'mac-arm64':
      // Look for .dmg first, then .zip, then .app (unless a type is required)
      const distDir = path.resolve('dist');
      const appPath = path.resolve(MAC_BUILD_PATH);

      try {
        const files = await fs.readdir(distDir);

        if (requiredType === 'dmg') {
          const dmgFiles = files.filter(f => f.endsWith('-arm64.dmg'));
          if (dmgFiles.length === 0) {
            throw new Error('No DMG file found');
          }
          const dmgWithStats = await Promise.all(
            dmgFiles.map(async name => {
              const fullPath = path.join(distDir, name);
              const stats = await fs.stat(fullPath);
              return { name, fullPath, mtimeMs: stats.mtimeMs };
            })
          );
          dmgWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
          artifactPath = dmgWithStats[0].fullPath;
          await fs.access(artifactPath);
          break;
        }

        // Look for newest .dmg file in dist directory
        const dmgFiles = files.filter(f => f.endsWith('-arm64.dmg'));
        if (dmgFiles.length > 0) {
          const dmgWithStats = await Promise.all(
            dmgFiles.map(async name => {
              const fullPath = path.join(distDir, name);
              const stats = await fs.stat(fullPath);
              return { name, fullPath, mtimeMs: stats.mtimeMs };
            })
          );
          dmgWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
          artifactPath = dmgWithStats[0].fullPath;
          await fs.access(artifactPath);
          break;
        }

        // Look for .zip file in dist directory
        const zipFile = files.find(f => f.endsWith('-arm64-mac.zip'));

        if (zipFile) {
          artifactPath = path.join(distDir, zipFile);
          await fs.access(artifactPath);
        } else {
          throw new Error('No distributable file found');
        }
      } catch (error) {
        try {
          // Final fallback to app bundle
          await fs.access(appPath);
          artifactPath = appPath;
        } catch (appError) {
          const requiredHint = requiredType === 'dmg' ? `${distDir}/*.dmg` : `${distDir}/*.dmg, ${distDir}/*.zip, ${appPath}`;
          throw createError('VALIDATION_FAILED', 'No macOS build artifact found', `Checked: ${requiredHint}`);
        }
      }
      break;

    default:
      throw createError('GENERAL_ERROR', `Unsupported platform: ${platform}`);
  }

  return artifactPath;
}

/**
 * Validate that file path exists and is accessible
 */
async function validateFilePath(filePath) {
  try {
    const stats = await fs.stat(filePath);

    return {
      exists: true,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
        error: 'File not found'
      };
    }

    throw createError('VALIDATION_FAILED', `Cannot access file: ${filePath}`, error.message);
  }
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  const validation = await validateFilePath(filePath);

  if (!validation.exists) {
    throw createError('VALIDATION_FAILED', `File not found: ${filePath}`);
  }

  return validation.size;
}

/**
 * Calculate SHA256 hash of file or directory
 */
async function calculateHash(filePath) {
  try {
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } else if (stats.isDirectory()) {
      // For directories (like .app bundles), create hash based on directory structure and key files
      const hash = crypto.createHash('sha256');

      // Hash the directory path and size info
      hash.update(filePath);
      hash.update(stats.size.toString());
      hash.update(stats.mtime.toISOString());

      // Try to hash key files if they exist
      try {
        const infoPath = path.join(filePath, 'Contents', 'Info.plist');
        const infoBuffer = await fs.readFile(infoPath);
        hash.update(infoBuffer);
      } catch (error) {
        // Info.plist might not exist, continue
      }

      return hash.digest('hex');
    } else {
      throw new Error('Path is neither file nor directory');
    }
  } catch (error) {
    throw createError('VALIDATION_FAILED', `Cannot calculate hash for: ${filePath}`, error.message);
  }
}

/**
 * Validate build artifact meets requirements
 */
async function validateArtifact(artifactPath) {
  const validation = await validateFilePath(artifactPath);

  if (!validation.exists) {
    throw createError('VALIDATION_FAILED', `Artifact not found: ${artifactPath}`);
  }

  if (!validation.isFile && !validation.isDirectory) {
    throw createError('VALIDATION_FAILED', `Artifact is not a file or directory: ${artifactPath}`);
  }

  // Size validation for DMG files
  if (artifactPath.endsWith('.dmg')) {
    if (validation.size < MIN_DMG_SIZE) {
      throw createError('VALIDATION_FAILED', 'DMG file too small - build may be corrupted', `Size: ${validation.size} bytes`);
    }

    if (validation.size > MAX_DMG_SIZE) {
      throw createError('VALIDATION_FAILED', 'DMG file too large - unexpected size', `Size: ${validation.size} bytes`);
    }
  }

  // Validate macOS app bundle structure
  if (artifactPath.endsWith('.app')) {
    const contentsPath = path.join(artifactPath, 'Contents');
    const plistPath = path.join(contentsPath, 'Info.plist');

    try {
      await fs.access(contentsPath);
      await fs.access(plistPath);
    } catch (error) {
      throw createError('VALIDATION_FAILED', 'Invalid macOS app bundle structure', error.message);
    }
  }

  return {
    valid: true,
    size: validation.size,
    type: validation.isDirectory ? 'directory' : 'file',
    path: artifactPath
  };
}

/**
 * Create a build artifact information object
 */
async function createArtifactInfo(artifactPath) {
  await validateArtifact(artifactPath);

  const size = await getFileSize(artifactPath);
  const hash = await calculateHash(artifactPath);

  return {
    path: artifactPath,
    size,
    hash,
    timestamp: new Date().toISOString(),
    name: path.basename(artifactPath)
  };
}

module.exports = {
  findArtifact,
  validateFilePath,
  getFileSize,
  calculateHash,
  validateArtifact,
  createArtifactInfo
};
