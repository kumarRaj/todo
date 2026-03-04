/**
 * Integration tests for release workflow
 */

describe('Release Module Integration', () => {
  test('all release modules can be imported without errors', () => {
    // Test that all modules can be imported successfully
    expect(() => require('../../src/release/constants')).not.toThrow();
    expect(() => require('../../src/release/errors')).not.toThrow();
    expect(() => require('../../src/release/fsUtils')).not.toThrow();
    expect(() => require('../../src/release/gitUtils')).not.toThrow();
    expect(() => require('../../src/release/githubCli')).not.toThrow();
    expect(() => require('../../src/release/logger')).not.toThrow();
    expect(() => require('../../src/release/version')).not.toThrow();
    expect(() => require('../../src/release/buildMacOS')).not.toThrow();
    expect(() => require('../../src/release/publishRelease')).not.toThrow();
    expect(() => require('../../src/release/generateNotes')).not.toThrow();
  });

  test('release CLI script exists and has correct structure', () => {
    const releasePath = require('path').resolve('scripts/release.js');
    const fs = require('fs');

    expect(fs.existsSync(releasePath)).toBe(true);

    const content = fs.readFileSync(releasePath, 'utf8');
    expect(content).toContain('executeRelease');
    expect(content).toContain('buildMacOS');
    expect(content).toContain('publishToGitHub');
    expect(content).toContain('generateReleaseNotes');
  });

  test('release constants are properly defined', () => {
    const constants = require('../../src/release/constants');

    expect(constants.EXIT_CODES).toBeDefined();
    expect(constants.PLATFORMS).toBeDefined();
    expect(constants.BUILD_TIMEOUT).toBeDefined();
    expect(constants.COMMIT_TYPES).toBeDefined();

    expect(typeof constants.BUILD_TIMEOUT).toBe('number');
    expect(constants.BUILD_TIMEOUT).toBeGreaterThan(0);
  });

  test('version validation works correctly', () => {
    const { parseVersion, validateFormat } = require('../../src/release/version');

    // Valid versions
    expect(validateFormat('1.0.0').valid).toBe(true);
    expect(validateFormat('1.2.3-alpha').valid).toBe(true);
    expect(validateFormat('v1.0.0').valid).toBe(true);

    // Invalid versions
    expect(validateFormat('abc').valid).toBe(false);
    expect(validateFormat('1.0').valid).toBe(false);

    // Test parsing
    const parsed = parseVersion('1.2.3');
    expect(parsed.major).toBe(1);
    expect(parsed.minor).toBe(2);
    expect(parsed.patch).toBe(3);
    expect(parsed.tag).toBe('v1.2.3');
  });

  test('error handling creates proper error objects', () => {
    const { ReleaseError, createError } = require('../../src/release/errors');

    const error = createError('BUILD_FAILED', 'Test error');
    expect(error).toBeInstanceOf(ReleaseError);
    expect(error.message).toBe('Test error');
    expect(error.exitCode).toBe(1); // BUILD_FAILED exit code
  });

  test('release notes generation works with mock data', () => {
    const { categorizeCommits, formatMarkdown } = require('../../src/release/generateNotes');

    const mockCommits = [
      { message: 'feat: add new feature', hash: 'abc123', author: 'Dev', date: '2023-01-01' },
      { message: 'fix: resolve bug', hash: 'def456', author: 'Dev', date: '2023-01-01' }
    ];

    const categorized = categorizeCommits(mockCommits);
    expect(categorized.features).toHaveLength(1);
    expect(categorized.fixes).toHaveLength(1);

    const markdown = formatMarkdown(categorized);
    expect(markdown).toContain('## 🎉 Features');
    expect(markdown).toContain('## 🐛 Fixes');
  });
});