/**
 * Auto-generate release notes from git history
 */

const { getCommitsSince, getLatestTag } = require('./gitUtils');
const { COMMIT_TYPES } = require('./constants');

/**
 * Parse git log output into structured commit objects
 */
function parseGitLog(gitOutput) {
  if (!gitOutput || gitOutput.trim() === '') {
    return [];
  }

  return gitOutput.split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [hash, message, author, date] = line.split('|');
      return {
        hash: hash?.trim(),
        message: message?.trim(),
        author: author?.trim(),
        date: date?.trim()
      };
    })
    .filter(commit => commit.hash && commit.message);
}

/**
 * Filter commits based on conventional commit types
 */
function filterCommits(commits) {
  return commits.filter(commit =>
    COMMIT_TYPES.INCLUDE.some(type => commit.message.startsWith(type))
  );
}

/**
 * Categorize commits by type
 */
function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    docs: [],
    perf: []
  };

  commits.forEach(commit => {
    const message = commit.message;

    if (message.startsWith('feat:')) {
      categories.features.push(commit);
    } else if (message.startsWith('fix:')) {
      categories.fixes.push(commit);
    } else if (message.startsWith('docs:')) {
      categories.docs.push(commit);
    } else if (message.startsWith('perf:')) {
      categories.perf.push(commit);
    }
  });

  return categories;
}

/**
 * Format categorized commits as markdown
 */
function formatMarkdown(categorizedCommits) {
  let markdown = '';

  // Features section
  if (categorizedCommits.features.length > 0) {
    markdown += '## 🎉 Features\n\n';
    categorizedCommits.features.forEach(commit => {
      const cleanMessage = commit.message.replace(/^feat:\s*/, '');
      markdown += `- ${cleanMessage}\n`;
    });
    markdown += '\n';
  }

  // Fixes section
  if (categorizedCommits.fixes.length > 0) {
    markdown += '## 🐛 Fixes\n\n';
    categorizedCommits.fixes.forEach(commit => {
      const cleanMessage = commit.message.replace(/^fix:\s*/, '');
      markdown += `- ${cleanMessage}\n`;
    });
    markdown += '\n';
  }

  // Documentation section
  if (categorizedCommits.docs.length > 0) {
    markdown += '## 📚 Documentation\n\n';
    categorizedCommits.docs.forEach(commit => {
      const cleanMessage = commit.message.replace(/^docs:\s*/, '');
      markdown += `- ${cleanMessage}\n`;
    });
    markdown += '\n';
  }

  // Performance section
  if (categorizedCommits.perf.length > 0) {
    markdown += '## ⚡ Performance\n\n';
    categorizedCommits.perf.forEach(commit => {
      const cleanMessage = commit.message.replace(/^perf:\s*/, '');
      markdown += `- ${cleanMessage}\n`;
    });
    markdown += '\n';
  }

  // If no commits were categorized, provide a default message
  if (markdown.trim() === '') {
    markdown = 'No notable changes in this release.\n\nSee git history for detailed changes.\n';
  }

  return markdown.trim();
}

/**
 * Get commits for a release between two versions
 */
async function getCommitsForRelease(fromVersion = null, toVersion = 'HEAD') {
  try {
    // If no fromVersion provided, use latest tag
    if (!fromVersion) {
      fromVersion = await getLatestTag();
    }

    // If still no version (no tags), get all commits
    const commits = await getCommitsSince(fromVersion);

    // Filter to only include relevant commit types
    const filteredCommits = filterCommits(commits);

    return filteredCommits;
  } catch (error) {
    // If git operations fail, return empty array
    return [];
  }
}

/**
 * Generate complete release notes from git history
 */
async function generateReleaseNotes(fromVersion = null, toVersion = 'HEAD') {
  try {
    // Get commits for the release
    const commits = await getCommitsForRelease(fromVersion, toVersion);

    if (commits.length === 0) {
      return 'No notable changes in this release.\n\nSee git history for detailed changes.';
    }

    // Categorize commits
    const categorized = categorizeCommits(commits);

    // Format as markdown
    const markdown = formatMarkdown(categorized);

    return markdown;
  } catch (error) {
    return 'Unable to generate release notes from git history.\n\nSee git log for changes.';
  }
}

/**
 * Generate fallback notes for first release or when git history is unavailable
 */
function generateFallbackNotes() {
  return 'Initial release.\n\nSee git history for detailed changes.';
}

module.exports = {
  parseGitLog,
  filterCommits,
  categorizeCommits,
  formatMarkdown,
  getCommitsForRelease,
  generateReleaseNotes,
  generateFallbackNotes
};