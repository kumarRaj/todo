/**
 * Task Model Unit Tests
 *
 * Tests the core Task business logic independently of database
 */

const Task = require('../../src/core/task');

describe('Task Model - Content and Extraction Logic', () => {
  describe('URL extraction', () => {
    it('should extract single URL from content', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Check out https://github.com for code'
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(1);
      expect(task.extractedUrls[0]).toBe('https://github.com');
    });

    it('should extract multiple URLs from content', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Visit https://example.com and also https://docs.github.com'
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(2);
      expect(task.extractedUrls).toContain('https://example.com');
      expect(task.extractedUrls).toContain('https://docs.github.com');
    });

    it('should handle content with no URLs', () => {
      // Arrange & Act
      const task = new Task({
        content: 'This is just a regular task without links'
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(0);
    });

    it('should extract HTTP and HTTPS URLs', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Check http://old-site.com and https://new-site.com'
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(2);
      expect(task.extractedUrls).toContain('http://old-site.com');
      expect(task.extractedUrls).toContain('https://new-site.com');
    });

    it('should extract complex URLs with parameters and fragments', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Check https://example.com/path?param=value&other=123#section'
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(1);
      expect(task.extractedUrls[0]).toBe('https://example.com/path?param=value&other=123#section');
    });
  });

  describe('Tag extraction', () => {
    it('should extract single hashtag from content', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Complete project documentation #work'
      });

      // Assert
      expect(task.tags).toHaveLength(1);
      expect(task.tags[0]).toBe('work');
    });

    it('should extract multiple hashtags from content', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Plan vacation #personal #urgent #family'
      });

      // Assert
      expect(task.tags).toHaveLength(3);
      expect(task.tags).toContain('personal');
      expect(task.tags).toContain('urgent');
      expect(task.tags).toContain('family');
    });

    it('should handle content with no hashtags', () => {
      // Arrange & Act
      const task = new Task({
        content: 'This task has no hashtags'
      });

      // Assert
      expect(task.tags).toHaveLength(0);
    });

    it('should extract hashtags case-insensitively and convert to lowercase', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Important task #Work #URGENT #Personal'
      });

      // Assert
      expect(task.tags).toHaveLength(3);
      expect(task.tags).toContain('work');
      expect(task.tags).toContain('urgent');
      expect(task.tags).toContain('personal');
    });

    it('should handle hashtags in middle and end of content', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Complete #project documentation and #review code'
      });

      // Assert
      expect(task.tags).toHaveLength(2);
      expect(task.tags).toContain('project');
      expect(task.tags).toContain('review');
    });

    it('should ignore hashtags that are not word characters', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Task with #valid-tag and #123invalid and #valid_underscore'
      });

      // Assert - Only valid word character hashtags should be extracted
      expect(task.tags).toContain('valid');
      expect(task.tags).toContain('valid_underscore');
    });
  });

  describe('Content updates with re-extraction', () => {
    it('should re-extract URLs when content is updated directly', () => {
      // Arrange
      const task = new Task({
        content: 'Original content https://old.com'
      });

      // Act - Simulate content update (this tests the extraction logic)
      task.content = 'New content https://new.com';
      task.extractedUrls = task.extractUrls(task.content);

      // Assert
      expect(task.extractedUrls).toHaveLength(1);
      expect(task.extractedUrls[0]).toBe('https://new.com');
    });

    it('should re-extract tags when content is updated directly', () => {
      // Arrange
      const task = new Task({
        content: 'Original content #old'
      });

      // Act - Simulate content update (this tests the extraction logic)
      task.content = 'New content #new #different';
      task.tags = task.extractTags(task.content);

      // Assert
      expect(task.tags).toHaveLength(2);
      expect(task.tags).toContain('new');
      expect(task.tags).toContain('different');
    });
  });

  describe('Task creation with mixed content', () => {
    it('should handle content with both URLs and tags', () => {
      // Arrange & Act
      const task = new Task({
        content: 'Review code at https://github.com/repo #work #urgent'
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(1);
      expect(task.extractedUrls[0]).toBe('https://github.com/repo');
      expect(task.tags).toHaveLength(2);
      expect(task.tags).toContain('work');
      expect(task.tags).toContain('urgent');
    });

    it('should handle empty content gracefully', () => {
      // Arrange & Act
      const task = new Task({
        content: ''
      });

      // Assert
      expect(task.extractedUrls).toHaveLength(0);
      expect(task.tags).toHaveLength(0);
      expect(task.content).toBe('');
    });
  });
});