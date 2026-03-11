/**
 * routes/dependencies.js — Dependency scanning endpoints
 */

const express = require('express');
const router = express.Router();
const dependencyScanner = require('../services/dependencyScanner');

/**
 * GET /api/dependencies/:repoId/scan
 * Scan and return all package dependencies
 */
router.get('/:repoId/scan', async (req, res, next) => {
  try {
    const result = await dependencyScanner.scan(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dependencies/:repoId/vulnerabilities
 * Returns vulnerability report for known CVEs
 */
router.get('/:repoId/vulnerabilities', async (req, res, next) => {
  try {
    const result = await dependencyScanner.checkVulnerabilities(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
