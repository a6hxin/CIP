/**
 * complexityMap.js — Treemap visualization of cyclomatic complexity per file
 */

function mountComplexityMap(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="section-card">
      <div class="card-header">
        <div class="card-title"><span class="icon">🌡</span> Complexity Map</div>
        <span style="font-size:12px;color:var(--text-muted)">Size = lines of code · Color = complexity</span>
      </div>
      <div class="complexity-grid">
        <div>
          <div class="treemap-area" id="treemap-area">
            <div class="empty-state"><span class="empty-icon">🗺</span><p>Run analysis to see complexity map</p></div>
          </div>
        </div>
        <div class="complexity-legend" id="complexity-legend">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:4px">COMPLEXITY SCALE</div>
          ${['1–5 (Simple)', '6–10 (Moderate)', '11–20 (Complex)', '21+ (Very Complex)'].map((l, i) => `
            <div class="legend-item">
              <div class="legend-swatch" style="background:${complexityColor(i * 8 + 1)}"></div>
              <span>${l}</span>
            </div>
          `).join('')}
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin:16px 0 8px">TOP HOTSPOTS</div>
          <div class="hotspot-list" id="hotspot-list">
            <div style="color:var(--text-dim);font-size:12px">No data yet</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderComplexityMap(data) {
  const area = document.getElementById('treemap-area');
  const hotspotList = document.getElementById('hotspot-list');
  if (!area) return;

  const files = data.files || [];
  if (files.length === 0) {
    area.innerHTML = `<div class="empty-state"><span class="empty-icon">🗺</span><p>No file data found</p></div>`;
    return;
  }

  // Build treemap
  const treemapData = buildTreemap(files, area.clientWidth || 800, area.clientHeight || 420);
  area.innerHTML = treemapData.map(cell => `
    <div class="treemap-cell"
      style="
        left:${cell.x}px; top:${cell.y}px;
        width:${cell.w}px; height:${cell.h}px;
        background:${complexityColor(cell.complexity)};
        opacity: 0.85;
      "
      title="${cell.name} — complexity: ${cell.complexity}, lines: ${cell.lines}"
    >
      ${cell.w > 60 && cell.h > 30 ? `<span>${shortenName(cell.name)}</span>` : ''}
    </div>
  `).join('');

  // Hotspot list
  const hotspots = [...files].sort((a, b) => b.complexity - a.complexity).slice(0, 6);
  hotspotList.innerHTML = hotspots.map(f => `
    <div class="hotspot-item">
      <span class="hotspot-score" style="color:${complexityColor(f.complexity)}">${f.complexity}</span>
      <div>
        <div style="font-size:12px;color:var(--text)">${shortenName(f.name, 28)}</div>
        <div style="font-size:11px;color:var(--text-dim)">${f.lines} lines</div>
      </div>
    </div>
  `).join('');
}

// ─── Treemap layout (squarified) ──────────────────────────────────────────────
function buildTreemap(files, W, H) {
  if (!files.length) return [];
  const total = files.reduce((s, f) => s + (f.lines || 1), 0);
  const sorted = [...files].sort((a, b) => (b.lines || 1) - (a.lines || 1));
  const cells = [];
  squarify(sorted, { x: 0, y: 0, w: W, h: H }, total, W * H, cells);
  return cells;
}

function squarify(items, rect, totalSize, totalArea, cells) {
  if (!items.length) return;
  if (items.length === 1) {
    cells.push({ ...items[0], x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    return;
  }
  // Simple slice-and-dice for stability
  const isHoriz = rect.w >= rect.h;
  let remaining = [...items];
  let x = rect.x, y = rect.y;
  const scale = (rect.w * rect.h) / totalSize;

  remaining.forEach(item => {
    const area = (item.lines || 1) * scale;
    let w, h;
    if (isHoriz) {
      w = Math.max(area / rect.h, 2);
      h = rect.h;
    } else {
      w = rect.w;
      h = Math.max(area / rect.w, 2);
    }
    cells.push({ ...item, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    if (isHoriz) x += w; else y += h;
  });
}

// ─── Color scale ──────────────────────────────────────────────────────────────
function complexityColor(c) {
  if (c <= 5)  return '#238636'; // green
  if (c <= 10) return '#9e6a03'; // yellow
  if (c <= 20) return '#da6800'; // orange
  return '#cf222e';              // red
}

function shortenName(name, maxLen = 18) {
  if (!name) return '';
  const parts = name.split('/');
  const base = parts[parts.length - 1];
  return base.length > maxLen ? base.slice(0, maxLen - 1) + '…' : base;
}
