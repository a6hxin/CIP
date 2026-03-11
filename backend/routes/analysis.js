/**
 * routes/analysis.js — Code analysis endpoints
 */

const express = require('express');
const router = express.Router();
const complexityAnalyzer = require('../services/complexityAnalyzer');
const architectureDetector = require('../services/architectureDetector');

/**
 * GET /api/analysis/complexity/:repoId
 * Return per-file complexity metrics + aggregate scores
 */
router.get('/complexity/:repoId', async (req, res, next) => {
  try {
    const result = await complexityAnalyzer.analyze(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analysis/architecture/:repoId
 * Detect high-level architecture patterns and module relationships
 */
router.get('/architecture/:repoId', async (req, res, next) => {
  try {
    const result = await architectureDetector.detect(req.params.repoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
