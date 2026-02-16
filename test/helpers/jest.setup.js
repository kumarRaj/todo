/**
 * Jest global setup and teardown
 */

// Ensure test environment is set
process.env.TODO_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test setup (runs before all tests)
beforeAll(() => {
  // Suppress console.log during tests unless explicitly needed
  if (!process.env.JEST_VERBOSE) {
    global.console = {
      ...console,
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn()
    };
  }
});

// Global test cleanup
afterAll(() => {
  // Any global cleanup if needed
});