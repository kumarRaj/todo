#!/usr/bin/env node

/**
 * Release CLI - Automated release workflow for Todo App
 */

const { program } = require('commander');
const { buildMacOS } = require('../src/release/buildMacOS');
const { validateFormat, checkForDuplicate } = require('../src/release/version');
const { checkVersionConflict, publishToGitHub, checkPublishReadiness } = require('../src/release/publishRelease');
const { generateReleaseNotes, generateFallbackNotes } = require('../src/release/generateNotes');
const { handleError, createError } = require('../src/release/errors');
const logger = require('../src/release/logger');
const fs = require('fs');

async function executeRelease(options) {
  try {
    logger.section('Todo App Release Workflow');

    // Phase 1: Validate version
    if (options.releaseVersion) {
      logger.step('Validating version format', 1, 3);
      const validation = validateFormat(options.releaseVersion);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      logger.success(`Version ${validation.parsed.tag} is valid`);
    } else {
      logger.warn('No version specified - will use package.json version');
    }

    // Phase 2: Build
    if (!options.skipBuild) {
      logger.step('Building macOS package', 2, 3);
      logger.info('Running electron-builder...');

      const artifact = await buildMacOS({ skipBuild: false });
      logger.success('Build complete');
      logger.artifact(artifact);

      // Store artifact for next phases
      global.releaseArtifact = artifact;
    } else {
      logger.step('Using existing build artifact', 2, 3);

      const artifact = await buildMacOS({ skipBuild: true });
      logger.success('Found existing build artifact');
      logger.artifact(artifact);

      global.releaseArtifact = artifact;
    }

    // Phase 3: GitHub Publishing
    logger.step('Publishing to GitHub', 3, 4);

    // Check GitHub CLI readiness
    const publishReadiness = await checkPublishReadiness();
    if (!publishReadiness.ready) {
      if (!publishReadiness.ghInstalled) {
        throw createError('GENERAL_ERROR', 'GitHub CLI (gh) is not installed', 'Install from: https://cli.github.com/');
      }
      if (!publishReadiness.authenticated) {
        throw createError('AUTH_ERROR', 'GitHub authentication required', 'Run: gh auth login');
      }
    }

    logger.info('GitHub CLI authenticated and ready');

    // Check for version conflicts
    if (options.releaseVersion) {
      logger.info(`Checking for version conflicts: ${options.releaseVersion}`);
      await checkVersionConflict(options.releaseVersion);
      logger.success('No version conflicts found');
    }

    // Generate release notes if not provided
    let releaseNotes;
    if (options.notes) {
      logger.info(`Using release notes from file: ${options.notes}`);
      releaseNotes = fs.readFileSync(options.notes, 'utf8');
    } else {
      logger.info('Generating release notes from git history...');
      releaseNotes = await generateReleaseNotes();
      logger.success('Auto-generated release notes');
    }

    // Create GitHub release
    const releaseOptions = {
      version: options.releaseVersion || '1.0.0', // Default version if none specified
      title: options.releaseVersion || '1.0.0',
      notes: releaseNotes,
      isDraft: options.draft || false,
      assetPath: global.releaseArtifact ? global.releaseArtifact.path : null
    };

    logger.info('Creating GitHub release...');
    const release = await publishToGitHub(releaseOptions);

    logger.success('Release published successfully');
    logger.release(release);

    // Phase 4: Summary
    logger.step('Release complete', 4, 4);

    logger.summary([
      { name: 'Version validation', success: true },
      { name: 'macOS build', success: true },
      { name: 'GitHub publishing', success: true },
      { name: 'Release complete', success: true }
    ]);

  } catch (error) {
    handleError(error);
  }
}

program
  .name('release')
  .description('Automated release workflow for Todo App')
  .version('1.0.0')
  .option('--release-version <version>', 'specify version (e.g., 1.2.3)')
  .option('--notes <file>', 'path to release notes file')
  .option('--draft', 'create as draft release')
  .option('--skip-build', 'skip build phase, use existing artifacts')
  .action(executeRelease);

program.parse();