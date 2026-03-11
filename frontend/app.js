/**
 * app.js — Main application entry point
 * Handles routing, global state, and component orchestration
 */

const API_BASE = 'http://localhost:3000/api';

// Global application state
const AppState = {
  currentRepo: null,
  repoId: null,
  currentView: 'dashboard',
  analysisData: {},
};

// ─── Router ───────────────────────────────────────────────────────────────────
function navigate(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`${viewName}-view`);
  const btn = document.querySelector(`[data-view="${viewName}"]`);

  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');

  AppState.currentView = viewName;

  // Lazy-load view data
  if (AppState.repoId) loadViewData(viewName);
}

async function loadViewData(viewName) {
  if (!AppState.repoId) return;
  switch (viewName) {
    case 'complexity':    await loadComplexity(); break;
    case 'dependencies':  await loadDependencies(); break;
    case 'commits':       await loadCommits(); break;
    case 'architecture':  break; // rendered by backend static image
    case 'dashboard':     await loadInsights(); break;
  }
}

// ─── Status indicator ─────────────────────────────────────────────────────────
function setStatus(state) {
  const dot = document.getElementById('status-indicator');
  if (dot) {
    dot.className = `status-dot ${state}`;
  }
}

// ─── Toast notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ─── Data loaders ─────────────────────────────────────────────────────────────
async function loadInsights() {
  if (AppState.analysisData.insights) {
    renderInsightsPanel(AppState.analysisData.insights);
    return;
  }
  try {
    setStatus('loading');
    const data = await apiGet(`/analysis/complexity/${AppState.repoId}`);
    AppState.analysisData.insights = data;
    renderInsightsPanel(data);
    setStatus('success');
  } catch (e) {
    console.error(e);
    setStatus('error');
    showToast('Failed to load insights', 'error');
  }
}

async function loadComplexity() {
  if (AppState.analysisData.complexity) {
    renderComplexityMap(AppState.analysisData.complexity);
    return;
  }
  try {
    setStatus('loading');
    const data = await apiGet(`/analysis/complexity/${AppState.repoId}`);
    AppState.analysisData.complexity = data;
    renderComplexityMap(data);
    setStatus('success');
  } catch (e) {
    console.error(e);
    setStatus('error');
    showToast('Failed to load complexity data', 'error');
  }
}

async function loadDependencies() {
  if (AppState.analysisData.dependencies) {
    renderDependencyGraph(AppState.analysisData.dependencies);
    return;
  }
  try {
    setStatus('loading');
    const data = await apiGet(`/dependencies/${AppState.repoId}/scan`);
    AppState.analysisData.dependencies = data;
    renderDependencyGraph(data);
    setStatus('success');
  } catch (e) {
    console.error(e);
    setStatus('error');
    showToast('Failed to load dependency data', 'error');
  }
}

async function loadCommits() {
  if (AppState.analysisData.commits) {
    renderCommitTimeline(AppState.analysisData.commits);
    return;
  }
  try {
    setStatus('loading');
    const data = await apiGet(`/commits/${AppState.repoId}/timeline`);
    AppState.analysisData.commits = data;
    renderCommitTimeline(data);
    setStatus('success');
  } catch (e) {
    console.error(e);
    setStatus('error');
    showToast('Failed to load commit history', 'error');
  }
}

// ─── Repo analysis trigger ────────────────────────────────────────────────────
async function analyzeRepo(repoUrl) {
  setStatus('loading');
  showToast('Cloning repository...', 'info');
  try {
    const result = await apiPost('/repo/clone', { url: repoUrl });
    AppState.repoId = result.repoId;
    AppState.currentRepo = result;
    showToast('Repository ready. Running analysis...', 'success');
    await loadInsights();
    showToast('Analysis complete!', 'success');
    setStatus('success');
  } catch (e) {
    console.error(e);
    setStatus('error');
    showToast('Failed to clone repository. Check the URL and try again.', 'error');
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Mount components
  mountRepoInput(document.getElementById('repo-input-mount'), analyzeRepo);
  mountInsightsPanel(document.getElementById('insights-panel-mount'));
  mountComplexityMap(document.getElementById('complexity-map-mount'));
  mountDependencyGraph(document.getElementById('dependency-graph-mount'));
  mountCommitTimeline(document.getElementById('commit-timeline-mount'));

  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  // Initial view
  navigate('dashboard');
});

// Expose globally for components
window.AppState = AppState;
window.showToast = showToast;
window.analyzeRepo = analyzeRepo;
