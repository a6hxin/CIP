/**
 * services/gitService.js — Git clone, log, and metadata operations
 */

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

const REPOS_DIR = path.join(__dirname, '../../data/repos');

/**
 * Clone a remote repository into data/repos/<repoId>
 */
async function cloneRepo(url, repoId) {
  const dest = path.join(REPOS_DIR, repoId);
  await fs.ensureDir(dest);

  const git = simpleGit();
  await git.clone(url, dest, ['--depth', '200']);

  const meta = await getRepoMeta(repoId);
  return meta;
}

/**
 * Get high-level metadata from an already-cloned repo
 */
async function getRepoMeta(repoId) {
  const repoPath = path.join(REPOS_DIR, repoId);
  const git = simpleGit(repoPath);

  const [log, remotes, branch] = await Promise.all([
    git.log(['--max-count=1']),
    git.getRemotes(true),
    git.revparse(['--abbrev-ref', 'HEAD']),
  ]);

  const allLog = await git.log(['--oneline']);
  const shortlog = await git.raw(['shortlog', '-sn', '--no-merges', 'HEAD']).catch(() => '');

  const contributorCount = shortlog.trim().split('\n').filter(Boolean).length;
  const repoUrl = remotes[0]?.refs?.fetch || '';
  const name = repoUrl.split('/').pop()?.replace('.git', '') || repoId;

  return {
    repoId,
    name,
    url: repoUrl,
    branch: branch.trim(),
    commitCount: allLog.total,
    contributorCount,
    lastCommit: log.latest?.date || null,
    lastCommitMsg: log.latest?.message || '',
  };
}

/**
 * Fetch commit timeline with author and date info
 */
async function getCommitTimeline(repoId, { limit = 200, branch = 'HEAD' } = {}) {
  const repoPath = path.join(REPOS_DIR, repoId);
  const git = simpleGit(repoPath);

  const log = await git.log({
    maxCount: limit,
    from: branch,
    format: {
      hash: '%H',
      message: '%s',
      author: '%an',
      date: '%aI',
    },
  });

  return {
    commits: log.all.map(c => ({
      hash: c.hash,
      message: c.message,
      author: c.author,
      date: c.date,
    })),
    total: log.total,
  };
}

/**
 * Returns per-author contribution counts
 */
async function getContributors(repoId) {
  const repoPath = path.join(REPOS_DIR, repoId);
  const git = simpleGit(repoPath);
  const raw = await git.raw(['shortlog', '-sne', '--no-merges', 'HEAD']).catch(() => '');

  const contributors = raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const match = line.trim().match(/^(\d+)\s+(.+?)\s+<(.+)>$/);
      if (!match) return null;
      return { commits: parseInt(match[1]), name: match[2], email: match[3] };
    })
    .filter(Boolean);

  return { contributors };
}

/**
 * Delete a cloned repository from disk
 */
async function removeRepo(repoId) {
  const dest = path.join(REPOS_DIR, repoId);
  await fs.remove(dest);
}

/**
 * Returns local path for a repo
 */
function getRepoPath(repoId) {
  return path.join(REPOS_DIR, repoId);
}

module.exports = { cloneRepo, getRepoMeta, getCommitTimeline, getContributors, removeRepo, getRepoPath };
