const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

const REPOS_DIR = path.join(__dirname, '../../data/repos');

async function cloneRepo(url, repoId) {
  const dest = path.join(REPOS_DIR, repoId);
  await fs.ensureDir(dest);

  const git = simpleGit();
  await git.clone(url, dest, ['--depth', '50']);

  const meta = await getRepoMeta(repoId);
  return meta;
}

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

async function removeRepo(repoId) {
  const dest = path.join(REPOS_DIR, repoId);
  await fs.remove(dest);
}

function getRepoPath(repoId) {
  return path.join(REPOS_DIR, repoId);
}

module.exports = { cloneRepo, getRepoMeta, getCommitTimeline, getContributors, removeRepo, getRepoPath };
