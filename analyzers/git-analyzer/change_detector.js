/**
 * analyzers/git-analyzer/change_detector.js
 * Detect high-churn files and code velocity metrics from git history
 */

const simpleGit = require('simple-git');
const path = require('path');

const REPOS_BASE = path.join(__dirname, '../../data/repos');

/**
 * Compute file-level churn by counting how often each file has been modified
 * @param {string} repoId
 * @param {object} opts
 * @returns {Promise<{churnRate, mostChanged, fileChurn}>}
 */
async function detectChanges(repoId, opts = {}) {
  const { limit = 500 } = opts;
  const repoPath = path.join(REPOS_BASE, repoId);
  const git = simpleGit(repoPath);

  // Use git log --name-only to get per-commit changed files
  const raw = await git.raw([
    'log', `--max-count=${limit}`, '--name-only', '--pretty=format:', '--diff-filter=M',
  ]);

  const fileChangeCounts = {};
  raw.trim().split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('commit')) {
      fileChangeCounts[trimmed] = (fileChangeCounts[trimmed] || 0) + 1;
    }
  });

  const totalUniqueFiles = Object.keys(fileChangeCounts).length;
  const totalChanges = Object.values(fileChangeCounts).reduce((a, b) => a + b, 0);

  const mostChanged = Object.entries(fileChangeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([file, changes]) => ({ file, changes }));

  // Churn rate: ratio of heavily modified files (changed >5 times) to total files
  const heavyChurn = Object.values(fileChangeCounts).filter(v => v > 5).length;
  const churnRate = totalUniqueFiles > 0
    ? parseFloat(((heavyChurn / totalUniqueFiles) * 100).toFixed(1))
    : 0;

  return {
    churnRate,
    mostChanged,
    fileChurn: fileChangeCounts,
    totalUniqueFiles,
    totalChanges,
  };
}

/**
 * Detect files modified in the last N days
 */
async function recentlyModified(repoId, days = 30) {
  const repoPath = path.join(REPOS_BASE, repoId);
  const git = simpleGit(repoPath);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const raw = await git.raw([
    'log', `--since=${since}`, '--name-only', '--pretty=format:', '--diff-filter=M',
  ]);

  const files = [...new Set(
    raw.trim().split('\n').map(l => l.trim()).filter(Boolean)
  )];

  return { files, days, since };
}

module.exports = { detectChanges, recentlyModified };
