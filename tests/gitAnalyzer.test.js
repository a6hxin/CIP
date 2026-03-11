const path = require('path');
const { getCommitLog } = require('../analyzers/git-analyzer/commit_tracker');
const { detectChanges } = require('../analyzers/git-analyzer/change_detector');

jest.mock('simple-git', () => {
  return () => ({
    log: jest.fn().mockResolvedValue({
      all: [
        { hash: 'abc1234def5678', message: 'fix: resolve null pointer', author_name: 'Alice', author_email: 'alice@example.com', date: '2024-11-01T10:00:00Z' },
        { hash: 'bcd2345efg6789', message: 'feat: add complexity map', author_name: 'Bob', author_email: 'bob@example.com', date: '2024-11-05T12:00:00Z' },
        { hash: 'cde3456fgh7890', message: 'chore: update deps', author_name: 'Alice', author_email: 'alice@example.com', date: '2024-11-08T09:00:00Z' },
      ],
      total: 3,
    }),
    raw: jest.fn().mockResolvedValue(
      'src/services/gitService.js\nsrc/services/gitService.js\nfrontend/app.js\n'
    ),
  });
});

describe('commit_tracker', () => {
  const FAKE_REPO_ID = 'test-repo-123';

  describe('getCommitLog()', () => {
    it('returns a commits array', async () => {
      const result = await getCommitLog(FAKE_REPO_ID);
      expect(result).toHaveProperty('commits');
      expect(Array.isArray(result.commits)).toBe(true);
    });

    it('shapes each commit correctly', async () => {
      const result = await getCommitLog(FAKE_REPO_ID);
      const c = result.commits[0];
      expect(c).toHaveProperty('hash');
      expect(c).toHaveProperty('abbreviatedHash');
      expect(c).toHaveProperty('message');
      expect(c).toHaveProperty('author');
      expect(c).toHaveProperty('date');
      expect(c.abbreviatedHash).toHaveLength(7);
    });

    it('builds authorStats correctly', async () => {
      const result = await getCommitLog(FAKE_REPO_ID);
      expect(result).toHaveProperty('authorStats');
      const alice = result.authorStats.find(a => a.name === 'Alice');
      expect(alice).toBeDefined();
      expect(alice.count).toBe(2);
    });

    it('builds weeklyActivity buckets', async () => {
      const result = await getCommitLog(FAKE_REPO_ID);
      expect(result).toHaveProperty('weeklyActivity');
      expect(Array.isArray(result.weeklyActivity)).toBe(true);
    });
  });
});

describe('change_detector', () => {
  const FAKE_REPO_ID = 'test-repo-123';

  describe('detectChanges()', () => {
    it('returns churnRate and mostChanged', async () => {
      const result = await detectChanges(FAKE_REPO_ID);
      expect(result).toHaveProperty('churnRate');
      expect(result).toHaveProperty('mostChanged');
      expect(Array.isArray(result.mostChanged)).toBe(true);
    });

    it('ranks most-changed file first', async () => {
      const result = await detectChanges(FAKE_REPO_ID);
      if (result.mostChanged.length > 1) {
        expect(result.mostChanged[0].changes).toBeGreaterThanOrEqual(result.mostChanged[1].changes);
      }
    });

    it('churnRate is a number between 0 and 100', async () => {
      const result = await detectChanges(FAKE_REPO_ID);
      expect(typeof result.churnRate).toBe('number');
      expect(result.churnRate).toBeGreaterThanOrEqual(0);
      expect(result.churnRate).toBeLessThanOrEqual(100);
    });
  });
});
