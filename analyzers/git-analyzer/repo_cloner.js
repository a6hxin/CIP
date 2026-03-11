const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

const REPOS_BASE = path.join(__dirname, '../../data/repos');

async function cloneRepository(url, repoId, opts = {}) {
  const { depth = 200, branch } = opts;
  const localPath = path.join(REPOS_BASE, repoId);

  await fs.ensureDir(localPath);

  const cloneOpts = ['--depth', String(depth)];
  if (branch) cloneOpts.push('--branch', branch);

  const git = simpleGit();
  await git.clone(url, localPath, cloneOpts);

  return {
    repoId,
    localPath,
    clonedAt: new Date().toISOString(),
  };
}

async function pullLatest(repoId) {
  const localPath = path.join(REPOS_BASE, repoId);
  const git = simpleGit(localPath);
  await git.pull();
}

async function removeClone(repoId) {
  const localPath = path.join(REPOS_BASE, repoId);
  await fs.remove(localPath);
}

async function isCloned(repoId) {
  const localPath = path.join(REPOS_BASE, repoId);
  return fs.pathExists(path.join(localPath, '.git'));
}

module.exports = { cloneRepository, pullLatest, removeClone, isCloned };
