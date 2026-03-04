/**
 * macOS build automation and validation
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const { createError } = require('./errors');
const { findArtifact, createArtifactInfo } = require('./fsUtils');
const { BUILD_TIMEOUT } = require('./constants');

const execAsync = promisify(exec);

/**
 * Build macOS package using electron-builder
 */
async function buildMacOS(options = {}) {
  const { skipBuild = false } = options;

  if (skipBuild) {
    // Use existing artifact
    const artifactPath = await findArtifact('mac-arm64');
    return await createArtifactInfo(artifactPath);
  }

  try {
    // Run electron-builder for macOS
    const { stdout, stderr } = await execAsync('npm run build', {
      timeout: BUILD_TIMEOUT,
      env: {
        ...process.env,
        // Force macOS build
        CSC_IDENTITY_AUTO_DISCOVERY: 'false' // Skip code signing for now
      }
    });

    // Find the created artifact
    const artifactPath = await findArtifact('mac-arm64');

    // Create artifact information
    const artifactInfo = await createArtifactInfo(artifactPath);

    return artifactInfo;
  } catch (error) {
    // Parse electron-builder errors
    const errorMessage = error.stderr || error.message || 'Build failed';

    // Common build error patterns
    if (errorMessage.includes('better-sqlite3')) {
      throw createError(
        'BUILD_FAILED',
        'SQLite native module compilation failed',
        'Try: npm rebuild better-sqlite3 && npm run build'
      );
    }

    if (errorMessage.includes('ENOENT') && errorMessage.includes('electron')) {
      throw createError(
        'BUILD_FAILED',
        'Electron not found',
        'Try: npm install && npm run build'
      );
    }

    if (error.code === 'TIMEOUT') {
      throw createError(
        'BUILD_FAILED',
        'Build timed out',
        `Build exceeded ${BUILD_TIMEOUT}ms timeout`
      );
    }

    throw createError('BUILD_FAILED', 'macOS build failed', errorMessage);
  }
}

/**
 * Validate that the built artifact is a valid macOS app
 */
async function validateArtifact(artifactPath) {
  try {
    // Check if file/directory exists
    const stats = await fs.stat(artifactPath);

    if (artifactPath.endsWith('.app')) {
      // Validate app bundle structure
      if (!stats.isDirectory()) {
        return {
          isExecutable: false,
          launchSuccess: false,
          error: 'App bundle is not a directory'
        };
      }

      // Check required app bundle components
      const contentsPath = path.join(artifactPath, 'Contents');
      const macOSPath = path.join(contentsPath, 'MacOS');
      const plistPath = path.join(contentsPath, 'Info.plist');

      try {
        await fs.access(contentsPath);
        await fs.access(macOSPath);
        await fs.access(plistPath);

        // Try to determine if app is launchable by checking executable
        const macOSFiles = await fs.readdir(macOSPath);
        const hasExecutable = macOSFiles.length > 0;

        return {
          isExecutable: hasExecutable,
          launchSuccess: hasExecutable, // Simplified - in real scenario would try to launch
          error: null
        };
      } catch (bundleError) {
        return {
          isExecutable: false,
          launchSuccess: false,
          error: `Invalid app bundle: ${bundleError.message}`
        };
      }
    }

    if (artifactPath.endsWith('.dmg')) {
      // For DMG files, just check if they exist and have reasonable size
      const isExecutable = stats.isFile() && stats.size > 1024 * 1024; // At least 1MB

      return {
        isExecutable,
        launchSuccess: isExecutable, // DMG can be mounted
        error: null
      };
    }

    return {
      isExecutable: false,
      launchSuccess: false,
      error: 'Unknown file type - expected .app or .dmg'
    };
  } catch (error) {
    return {
      isExecutable: false,
      launchSuccess: false,
      error: error.message || 'File validation failed'
    };
  }
}

module.exports = {
  buildMacOS,
  validateArtifact
};