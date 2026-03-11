/**
 * analyzers/dependency-analyzer/npm_scanner.js
 * Deep NPM package scanning — reads package.json, lock files, and peer deps
 */

const path = require('path');
const fs = require('fs-extra');
const semver = require('semver');

const REPOS_BASE = path.join(__dirname, '../../data/repos');

/**
 * Scan a repository's NPM dependencies in detail
 * @param {string} repoId
 * @returns {Promise<ScanResult>}
 */
async function scanNpm(repoId) {
  const repoPath = path.join(REPOS_BASE, repoId);
  const pkgPath = path.join(repoPath, 'package.json');
  const lockPath = path.join(repoPath, 'package-lock.json');
  const yarnPath = path.join(repoPath, 'yarn.lock');

  if (!await fs.pathExists(pkgPath)) {
    return { error: 'No package.json found', dependencies: [] };
  }

  const pkg = await fs.readJson(pkgPath);

  const direct = parseDepMap(pkg.dependencies || {}, false);
  const dev = parseDepMap(pkg.devDependencies || {}, true);
  const peer = parseDepMap(pkg.peerDependencies || {}, false, true);
  const optional = parseDepMap(pkg.optionalDependencies || {}, false);

  const all = [...direct, ...dev, ...peer, ...optional];

  // Resolve actual installed versions from lock file
  let lockResolved = {};
  if (await fs.pathExists(lockPath)) {
    try {
      const lock = await fs.readJson(lockPath);
      lockResolved = extractLockVersions(lock);
    } catch (_) {}
  }

  const resolved = all.map(dep => ({
    ...dep,
    resolvedVersion: lockResolved[dep.name] || null,
    isOutdated: false, // would require npm registry lookup
  }));

  return {
    name: pkg.name,
    version: pkg.version,
    packageManager: await fs.pathExists(yarnPath) ? 'yarn' : 'npm',
    dependencies: resolved,
    total: resolved.length,
    direct: direct.length,
    devCount: dev.length,
    peerCount: peer.length,
  };
}

function parseDepMap(depObj, isDev, isPeer = false) {
  return Object.entries(depObj).map(([name, versionRange]) => ({
    name,
    versionRange,
    dev: isDev,
    peer: isPeer,
    vulnerable: false,
  }));
}

function extractLockVersions(lockData) {
  const map = {};
  // npm v2+ lock format
  const packages = lockData.packages || {};
  for (const [key, val] of Object.entries(packages)) {
    if (key.startsWith('node_modules/')) {
      const name = key.replace('node_modules/', '');
      map[name] = val.version;
    }
  }
  return map;
}

module.exports = { scanNpm };
