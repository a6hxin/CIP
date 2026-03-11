const express = require('express');
const router = express.Router();
const complexityAnalyzer = require('../services/complexityAnalyzer');
const architectureDetector = require('../services/architectureDetector');

router.get('/complexity/:repoId', async (req, res, next) => {
  try {
    const result = await complexityAnalyzer.analyze(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/architecture/:repoId', async (req, res, next) => {
  try {
    const result = await architectureDetector.detect(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
