/**
 * analyzers/git-analyzer/commit_tracker.js
 * Extract and structure commit history from a cloned repository
 */

const simpleGit = require('simple-git');
const path = require('path');

const REPOS_BASE = path.join(__dirname, '../../data/repos');

/**
 * Get structured commit log for a repo
 * @param {string} repoId
 * @param {object} opts
 * @returns {Promise<{commits, total, authorStats, weeklyActivity}>}
 */
async function getCommitLog(repoId, opts = {}) {
  const { limit = 500, since, until, author } = opts;
  const repoPath = path.join(REPOS_BASE, repoId);
  const git = simpleGit(repoPath);

  const logOpts = { maxCount: limit };
  if (since)  logOpts['--since'] = since;
  if (until)  logOpts['--until'] = until;
  if (author) logOpts['--author'] = author;

  const log = await git.log(logOpts);

  const commits = log.all.map(c => ({
    hash: c.hash,
    abbreviatedHash: c.hash.slice(0, 7),
    message: c.message,
    author: c.author_name,
    email: c.author_email,
    date: c.date,
    timestamp: new Date(c.date).getTime(),
  }));

  const authorStats = buildAuthorStats(commits);
  const weeklyActivity = buildWeeklyActivity(commits);

  return { commits, total: log.total, authorStats, weeklyActivity };
}

/**
 * Group commits by author and compute per-author counts
 */
function buildAuthorStats(commits) {
  const map = {};
  commits.forEach(c => {
    if (!map[c.author]) map[c.author] = { name: c.author, email: c.email, count: 0, firstCommit: c.date, lastCommit: c.date };
    map[c.author].count++;
    if (new Date(c.date) < new Date(map[c.author].firstCommit)) map[c.author].firstCommit = c.date;
    if (new Date(c.date) > new Date(map[c.author].lastCommit)) map[c.author].lastCommit = c.date;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

/**
 * Bucket commits into ISO week keys for bar chart rendering
 */
function buildWeeklyActivity(commits) {
  const weekly = {};
  commits.forEach(c => {
    const d = new Date(c.date);
    d.setDate(d.getDate() - d.getDay()); // Sunday of the week
    const key = d.toISOString().slice(0, 10);
    weekly[key] = (weekly[key] || 0) + 1;
  });
  return Object.entries(weekly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

module.exports = { getCommitLog };
