function mountInsightsPanel(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="section-card">
      <div class="card-header">
        <div class="card-title"><span class="icon">📊</span> Repository Overview</div>
      </div>
      <div id="insights-metrics" class="insights-grid">
        ${renderSkeletonMetrics()}
      </div>
      <div class="ai-insights-section" id="ai-insights-section" style="display:none">
        <div class="ai-insights-title">✦ AI Insights</div>
        <div id="ai-insights-list"></div>
      </div>
    </div>
  `;
}

function renderInsightsPanel(data) {
  const metricsEl = document.getElementById('insights-metrics');
  const aiSection = document.getElementById('ai-insights-section');
  const aiList = document.getElementById('ai-insights-list');
  if (!metricsEl) return;

  const metrics = [
    {
      label: 'Avg Complexity',
      value: data.avgComplexity ?? '—',
      badge: getBadge(data.avgComplexity, [5, 10, 20]),
      color: getComplexityColor(data.avgComplexity),
    },
    {
      label: 'Total Files',
      value: data.totalFiles ?? '—',
      badge: { text: 'Scanned', cls: 'badge-info' },
      color: 'var(--accent)',
    },
    {
      label: 'Dependencies',
      value: data.totalDependencies ?? '—',
      badge: { text: data.vulnerabilities > 0 ? `${data.vulnerabilities} vulns` : 'Clean', cls: data.vulnerabilities > 0 ? 'badge-bad' : 'badge-good' },
      color: data.vulnerabilities > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
    },
    {
      label: 'Total Commits',
      value: data.totalCommits ?? '—',
      badge: { text: 'Analyzed', cls: 'badge-info' },
      color: 'var(--accent-purple)',
    },
    {
      label: 'Code Churn',
      value: data.churnRate ? `${data.churnRate}%` : '—',
      badge: getBadge(data.churnRate, [10, 25, 40], true),
      color: getChurnColor(data.churnRate),
    },
    {
      label: 'Health Score',
      value: data.healthScore ?? '—',
      badge: { text: getHealthLabel(data.healthScore), cls: getHealthBadge(data.healthScore) },
      color: getHealthColor(data.healthScore),
    },
  ];

  metricsEl.innerHTML = metrics.map(m => `
    <div class="insight-card">
      <div class="metric-value" style="color:${m.color}">${m.value}</div>
      <div class="metric-label">${m.label}</div>
      <span class="metric-badge ${m.badge.cls}">${m.badge.text}</span>
    </div>
  `).join('');

  const insights = data.aiInsights || [];
  if (insights.length > 0) {
    aiSection.style.display = 'block';
    aiList.innerHTML = insights.map(i => `
      <div class="ai-insight-item">${i}</div>
    `).join('');
  }
}

function renderSkeletonMetrics() {
  return Array(6).fill(0).map(() => `
    <div class="insight-card">
      <div class="skeleton" style="height:36px;width:80px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:14px;width:120px"></div>
    </div>
  `).join('');
}

function getBadge(val, thresholds, inverse = false) {
  if (val == null) return { text: '—', cls: 'badge-info' };
  const [low, mid, high] = thresholds;
  if (!inverse) {
    if (val <= low)  return { text: 'Low', cls: 'badge-good' };
    if (val <= mid)  return { text: 'Medium', cls: 'badge-warn' };
    if (val <= high) return { text: 'High', cls: 'badge-bad' };
    return { text: 'Critical', cls: 'badge-bad' };
  } else {
    if (val <= low)  return { text: 'Stable', cls: 'badge-good' };
    if (val <= mid)  return { text: 'Moderate', cls: 'badge-warn' };
    return { text: 'High Churn', cls: 'badge-bad' };
  }
}

function getComplexityColor(v) {
  if (!v) return 'var(--text)';
  if (v <= 5) return 'var(--accent-green)';
  if (v <= 10) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

function getChurnColor(v) {
  if (!v) return 'var(--text)';
  if (v <= 10) return 'var(--accent-green)';
  if (v <= 25) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

function getHealthLabel(v) {
  if (!v) return '—';
  if (v >= 80) return 'Healthy';
  if (v >= 60) return 'Fair';
  if (v >= 40) return 'Needs Work';
  return 'Critical';
}

function getHealthBadge(v) {
  if (!v) return 'badge-info';
  if (v >= 80) return 'badge-good';
  if (v >= 60) return 'badge-warn';
  return 'badge-bad';
}

function getHealthColor(v) {
  if (!v) return 'var(--text)';
  if (v >= 80) return 'var(--accent-green)';
  if (v >= 60) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}
