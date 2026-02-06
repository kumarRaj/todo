/**
 * URL utility functions
 */

const { exec } = require('child_process');
const os = require('os');

/**
 * Open URL in default browser
 */
function openUrl(url) {
  let command;

  switch (os.platform()) {
    case 'darwin':
      command = `open "${url}"`;
      break;
    case 'win32':
      command = `start "" "${url}"`;
      break;
    case 'linux':
      command = `xdg-open "${url}"`;
      break;
    default:
      console.error('Unsupported platform for opening URLs');
      return;
  }

  exec(command, (error) => {
    if (error) {
      console.error(`Error opening URL: ${error.message}`);
    }
  });
}

/**
 * Extract URLs from text content
 */
function extractUrls(content) {
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  return content.match(urlRegex) || [];
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Get domain from URL
 */
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (_) {
    return null;
  }
}

/**
 * Shorten URL for display
 */
function shortenUrl(url, maxLength = 50) {
  if (url.length <= maxLength) return url;

  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const path = urlObj.pathname + urlObj.search;

  if (domain.length >= maxLength - 3) {
    return domain.substring(0, maxLength - 3) + '...';
  }

  const availableLength = maxLength - domain.length - 3;
  if (path.length > availableLength) {
    return domain + path.substring(0, availableLength) + '...';
  }

  return url;
}

module.exports = {
  openUrl,
  extractUrls,
  isValidUrl,
  getDomain,
  shortenUrl
};