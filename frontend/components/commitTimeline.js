/**
 * commitTimeline.js — Commit history bar chart + commit list
 */

function mountCommitTimeline(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="section-card">
      <div class="card-header">
        <div class="card-title"><span class="icon">📅</span> Commit Timeline</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="timeline-range" class="btn-secondary" style="cursor:pointer">
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      <div class="timeline-wrapper">
        <div id="commit-bar-chart" class="commit-bar-chart">
          <div class="empty-state"><span class="empty-icon">📅</span><p>Run analysis to see commit history</p></div>
        </div>
        <div id="commit-list" class="commit-list"></div>
      </div>
    </div>
  `;

  document.getElementById('timeline-range')?.addEventListener('change', (e) => {
    const data = window.AppState?.analysisData?.commits;
    if (data) renderCommitTimeline(data, parseInt(e.target.value));
  });
}

function renderCommitTimeline(data, days = 30) {
  const barChart = document.getElementById('commit-bar-chart');
  const commitList = document.getElementById('commit-list');
  if (!barChart) return;

  const commits = data.commits || [];
  if (commits.length === 0) {
    barChart.innerHTML = `<div class="empty-state"><span class="empty-icon">📅</span><p>No commits found</p></div>`;
    return;
  }

  // Group by period
  const now = Date.now();
  const cutoff = now - days * 86400000;
  const recentCommits = commits.filter(c => new Date(c.date).getTime() > cutoff);

  // Group into weeks
  const weeklyMap = {};
  recentCommits.forEach(c => {
    const d = new Date(c.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    weeklyMap[key] = (weeklyMap[key] || 0) + 1;
  });

  const sortedWeeks = Object.entries(weeklyMap).sort(([a], [b]) => a.localeCompare(b));
  const maxCount = Math.max(...sortedWeeks.map(([, v]) => v), 1);

  barChart.innerHTML = sortedWeeks.slice(-12).map(([week, count]) => `
    <div class="bar-chart-row">
      <div class="bar-chart-label">${formatWeek(week)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(count / maxCount) * 100}%">
          ${count > 3 ? count : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Recent commit list
  commitList.innerHTML = commits.slice(0, 20).map(c => `
    <div class="commit-item">
      <a class="commit-hash" href="${c.url || '#'}" target="_blank" rel="noopener">${c.hash?.slice(0, 7) || '—'}</a>
      <div class="commit-msg">${escapeHtml(c.message || '')}</div>
      <div class="commit-author">${escapeHtml(c.author || '')}</div>
      <div class="commit-date">${formatDate(c.date)}</div>
    </div>
  `).join('');
}

function formatWeek(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
