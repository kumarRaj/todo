/**
 * Date utility functions
 */

const { format, parseISO, isValid, parse } = require('date-fns');

/**
 * Format date for display
 */
function formatDate(dateInput) {
  try {
    let date;

    if (typeof dateInput === 'string') {
      // Try parsing ISO format first, then YYYY-MM-DD format
      date = parseISO(dateInput);
      if (!isValid(date)) {
        date = parse(dateInput, 'yyyy-MM-dd', new Date());
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return 'Invalid date';
    }

    if (!isValid(date)) {
      return 'Invalid date';
    }

    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Parse date from string input
 */
function parseDate(dateString) {
  try {
    // Try YYYY-MM-DD format first
    let date = parse(dateString, 'yyyy-MM-dd', new Date());

    if (!isValid(date)) {
      // Try ISO format
      date = parseISO(dateString);
    }

    if (!isValid(date)) {
      throw new Error(`Invalid date format: ${dateString}. Use YYYY-MM-DD format.`);
    }

    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    throw new Error(`Invalid date format: ${dateString}. Use YYYY-MM-DD format.`);
  }
}

/**
 * Check if date is today
 */
function isToday(dateString) {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

/**
 * Check if date is in the past
 */
function isPast(dateString) {
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

/**
 * Get relative date description
 */
function getRelativeDate(dateString) {
  const today = new Date().toISOString().split('T')[0];

  if (dateString === today) return 'Today';
  if (dateString < today) return 'Overdue';

  const taskDate = new Date(dateString + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  const diffDays = Math.ceil((taskDate - todayDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;

  return formatDate(dateString);
}

module.exports = {
  formatDate,
  parseDate,
  isToday,
  isPast,
  getRelativeDate
};