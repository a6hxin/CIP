const path = require('path');
const fs = require('fs-extra');
const { getRepoPath } = require('./gitService');

async function scan(repoId) {
  const repoPath = getRepoPath(repoId);
  const pkgPath = path.join(repoPath, 'package.json');

  if (!await fs.pathExists(pkgPath)) {
    return { dependencies: [], total: 0, direct: 0, devCount: 0, vulnerabilities: 0 };
  }

  const pkg = await fs.readJson(pkgPath);
  const deps = Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
    name, version, dev: false, vulnerable: false,
  }));
  const devDeps = Object.entries(pkg.devDependencies || {}).map(([name, version]) => ({
    name, version, dev: true, vulnerable: false,
  }));

  const all = [...deps, ...devDeps];

  const reportPath = path.join(__dirname, '../../data/dependency_reports', `${repoId}.json`);
  await fs.ensureDir(path.dirname(reportPath));
  await fs.writeJson(reportPath, { repoId, scannedAt: new Date().toISOString(), all }, { spaces: 2 });

  return {
    name: pkg.name || 'project',
    version: pkg.version,
    dependencies: all,
    total: all.length,
    direct: deps.length,
    devCount: devDeps.length,
    vulnerabilities: 0, 
  };
}

async function checkVulnerabilities(repoId) {
  const repoPath = getRepoPath(repoId);
  const pkgPath = path.join(repoPath, 'package.json');
  const lockPath = path.join(repoPath, 'package-lock.json');

  if (!await fs.pathExists(pkgPath)) {
    return { vulnerabilities: [], total: 0 };
  }

  try {
    const { execSync } = require('child_process');
    const auditOutput = execSync('npm audit --json', {
      cwd: repoPath,
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString();

    const audit = JSON.parse(auditOutput);
    const vulns = Object.values(audit.vulnerabilities || {}).map(v => ({
      name: v.name,
      severity: v.severity,
      via: Array.isArray(v.via) ? v.via.filter(x => typeof x === 'string') : [],
      fixAvailable: !!v.fixAvailable,
    }));

    return { vulnerabilities: vulns, total: vulns.length };
  } catch (e) {
    if (e.stdout) {
      try {
        const audit = JSON.parse(e.stdout.toString());
        const vulns = Object.values(audit.vulnerabilities || {}).map(v => ({
          name: v.name,
          severity: v.severity,
          fixAvailable: !!v.fixAvailable,
        }));
        return { vulnerabilities: vulns, total: vulns.length };
      } catch (_) {}
    }
    return { vulnerabilities: [], total: 0, error: e.message };
  }
}

module.exports = { scan, checkVulnerabilities };
