const express = require('express');
const router = express.Router();
const dependencyScanner = require('../services/dependencyScanner');

router.get('/:repoId/scan', async (req, res, next) => {
  try {
    const result = await dependencyScanner.scan(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:repoId/vulnerabilities', async (req, res, next) => {
  try {
    const result = await dependencyScanner.checkVulnerabilities(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
