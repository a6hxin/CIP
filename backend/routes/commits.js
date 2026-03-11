const express = require('express');
const router = express.Router();
const gitService = require('../services/gitService');

router.get('/:repoId/timeline', async (req, res, next) => {
  try {
    const { limit = 200, branch = 'HEAD' } = req.query;
    const data = await gitService.getCommitTimeline(req.params.repoId, {
      limit: Math.min(parseInt(limit) || 200, 1000),
      branch,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:repoId/contributors', async (req, res, next) => {
  try {
    const data = await gitService.getContributors(req.params.repoId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
