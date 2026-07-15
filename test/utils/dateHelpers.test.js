const { formatTaskCreationDate } = require('../../src/utils/dateHelpers');

describe('formatTaskCreationDate', () => {
  test('formats an ISO creation timestamp as day, abbreviated month, and year', () => {
    expect(formatTaskCreationDate('2026-07-15T12:00:00.000Z')).toBe('15 Jul 2026');
  });
});
