const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const gitService = require('../services/gitService');

const repos = new Map();

router.post('/clone', async (req, res, next) => {
  const { url } = req.body;
  console.log('[Clone] Request received for:', url);
  
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL required.' });
  }

  const repoId = uuidv4();
  try {
    console.log('[Clone] Starting clone:', repoId);
    const meta = await gitService.cloneRepo(url, repoId);
    console.log('[Clone] Success:', meta);
    repos.set(repoId, { ...meta, url, repoId });
    res.json({ repoId, ...meta });
  } catch (err) {
    console.error('[Clone] Failed:', err.message);
    next(err);
  }
});

router.get('/:id/info', (req, res) => {
  const repo = repos.get(req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repository not found.' });
  res.json(repo);
});


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

router.get('/', (req, res) => {
  res.json([...repos.values()]);
});

module.exports = router;
