function mountRepoInput(container, onAnalyze) {
  if (!container) return;

  container.innerHTML = `
    <div class="repo-input-wrapper">
      <div class="repo-input-label">
        Analyze any <span>Git repository</span>
      </div>
      <div class="repo-input-row">
        <input
          type="text"
          id="repo-url-input"
          class="repo-url-input"
          placeholder="https://github.com/owner/repository"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="analyze-btn" class="btn-primary">Analyze →</button>
        <button id="demo-btn" class="btn-secondary">Try Demo</button>
      </div>
      <div id="repo-meta" class="repo-meta" style="display:none">
        <span class="meta-chip"><span class="dot"></span> <span id="meta-name">—</span></span>
        <span class="meta-chip">🌿 <span id="meta-branch">—</span></span>
        <span class="meta-chip">📦 <span id="meta-commits">—</span> commits</span>
        <span class="meta-chip">👥 <span id="meta-contributors">—</span> contributors</span>
      </div>
    </div>
  `;

  const input = container.querySelector('#repo-url-input');
  const analyzeBtn = container.querySelector('#analyze-btn');
  const demoBtn = container.querySelector('#demo-btn');

  const DEMO_REPO = 'https://github.com/expressjs/express';

  analyzeBtn.addEventListener('click', async () => {
    const url = input.value.trim();
    if (!url) {
      input.focus();
      return;
    }
    setAnalyzeLoading(true);
    try {
      await onAnalyze(url);
      updateRepoMeta();
    } finally {
      setAnalyzeLoading(false);
    }
  });

  demoBtn.addEventListener('click', async () => {
    input.value = DEMO_REPO;
    setAnalyzeLoading(true);
    try {
      await onAnalyze(DEMO_REPO);
      updateRepoMeta();
    } finally {
      setAnalyzeLoading(false);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') analyzeBtn.click();
  });

  function setAnalyzeLoading(loading) {
    analyzeBtn.disabled = loading;
    analyzeBtn.textContent = loading ? 'Analyzing...' : 'Analyze →';
  }

  function updateRepoMeta() {
    const state = window.AppState;
    if (!state || !state.currentRepo) return;
    const meta = container.querySelector('#repo-meta');
    const { name, branch, commitCount, contributorCount } = state.currentRepo;
    container.querySelector('#meta-name').textContent = name || '—';
    container.querySelector('#meta-branch').textContent = branch || 'main';
    container.querySelector('#meta-commits').textContent = commitCount || '—';
    container.querySelector('#meta-contributors').textContent = contributorCount || '—';
    meta.style.display = 'flex';
  }
}
