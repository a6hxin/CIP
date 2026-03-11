/**
 * analyzers/git-analyzer/repo_cloner.js
 * Standalone git repository cloning utility
 */

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');

const REPOS_BASE = path.join(__dirname, '../../data/repos');

/**
 * Clone a repository with shallow depth
 * @param {string} url - Remote git URL
 * @param {string} repoId - Unique ID for the local clone
 * @param {object} opts
 * @param {number} opts.depth - Shallow clone depth (default: 200)
 * @param {string} opts.branch - Branch to clone (default: default branch)
 * @returns {Promise<{repoId, localPath, clonedAt}>}
 */
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

/**
 * Pull latest changes for an existing clone
 */
async function pullLatest(repoId) {
  const localPath = path.join(REPOS_BASE, repoId);
  const git = simpleGit(localPath);
  await git.pull();
}

/**
 * Remove a local clone from disk
 */
async function removeClone(repoId) {
  const localPath = path.join(REPOS_BASE, repoId);
  await fs.remove(localPath);
}

/**
 * Check if a repo is already cloned
 */
async function isCloned(repoId) {
  const localPath = path.join(REPOS_BASE, repoId);
  return fs.pathExists(path.join(localPath, '.git'));
}

module.exports = { cloneRepository, pullLatest, removeClone, isCloned };
