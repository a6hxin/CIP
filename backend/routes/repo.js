/**
 * routes/repo.js — Repository management endpoints
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const gitService = require('../services/gitService');

// In-memory store (replace with DB in production)
const repos = new Map();

/**
 * POST /api/repo/clone
 * Clone or register a remote git repository
 */
router.post('/clone', async (req, res, next) => {
  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'A valid repository URL is required.' });
  }

  const repoId = uuidv4();
  try {
    const meta = await gitService.cloneRepo(url, repoId);
    repos.set(repoId, { ...meta, url, repoId, createdAt: new Date().toISOString() });
    res.json({ repoId, ...meta });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/repo/:id/info
 * Get metadata about a registered repo
 */
router.get('/:id/info', (req, res) => {
  const repo = repos.get(req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repository not found.' });
  res.json(repo);
});

/**
 * DELETE /api/repo/:id
 * Remove a repo from disk and memory
 */
router.delete('/:id', async (req, res, next) => {
  const repo = repos.get(req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repository not found.' });
  try {
    await gitService.removeRepo(req.params.id);
    repos.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/repo
 * List all registered repositories
 */
router.get('/', (req, res) => {
  res.json([...repos.values()]);
});

module.exports = router;
