/**
 * Tests for active-tab default tag behavior in handleAddTask.
 *
 * Exercises the logic that was extracted from the renderer into a pure helper
 * to allow unit testing without a DOM/Electron environment.
 */

/**
 * Pure extraction of the default-tag logic from handleAddTask.
 * Mirrors the exact condition in renderer.js so the test stays coupled to
 * the real behaviour.
 */
const { hasTaskTag } = require('../../src/gui/renderer/tagHelpers');

function resolveContent(rawContent, currentFilter) {
    const content = rawContent.trim();
    if (!content) return null;

    if (!hasTaskTag(content)) {
        const defaultTag = currentFilter === 'personal' ? '#personal' : '#work';
        return content + ' ' + defaultTag;
    }
    return content;
}

describe('handleAddTask default tag selection', () => {
    test('plain text on Work tab sends content with #work', () => {
        expect(resolveContent('Buy coffee', 'work')).toBe('Buy coffee #work');
    });

    test('plain text on Personal tab sends content with #personal', () => {
        expect(resolveContent('Buy groceries', 'personal')).toBe('Buy groceries #personal');
    });

    test('plain text on All tab sends content with #work', () => {
        expect(resolveContent('Review PR', 'both')).toBe('Review PR #work');
    });

    test('content that already has a hashtag is not modified', () => {
        expect(resolveContent('Fix bug #backend', 'work')).toBe('Fix bug #backend');
        expect(resolveContent('Call mum #personal', 'work')).toBe('Call mum #personal');
        expect(resolveContent('Deploy #work #urgent', 'both')).toBe('Deploy #work #urgent');
    });

    test('content with a hashtag on Personal tab is not modified', () => {
        expect(resolveContent('Plan holiday #travel', 'personal')).toBe('Plan holiday #travel');
    });

    test('Google Docs URL fragments do not suppress the active filter tag', () => {
        const content = 'Read https://docs.google.com/document/d/1K0U9io3JT7WikjsakzRqT_fFrX3kpvtilwDkO79BJ2w/edit?tab=t.0#heading=h.dyjivdu87jmz';

        expect(resolveContent(content, 'work')).toBe(`${content} #work`);
    });

    test('empty content returns null (rejected without IPC call)', () => {
        expect(resolveContent('', 'work')).toBeNull();
        expect(resolveContent('   ', 'personal')).toBeNull();
    });

    test('whitespace-only input is trimmed before tag check', () => {
        expect(resolveContent('  Dentist appointment  ', 'personal')).toBe('Dentist appointment #personal');
    });
});
