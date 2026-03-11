function mountDependencyGraph(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="section-card">
      <div class="card-header">
        <div class="card-title"><span class="icon">🔗</span> Dependency Graph</div>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" id="dep-zoom-in" style="padding:4px 10px">+</button>
          <button class="btn-secondary" id="dep-zoom-out" style="padding:4px 10px">−</button>
          <button class="btn-secondary" id="dep-reset" style="padding:4px 10px">Reset</button>
        </div>
      </div>
      <div class="dep-graph-wrapper">
        <div class="dep-canvas-area">
          <canvas id="dep-canvas"></canvas>
          <div id="dep-empty" class="empty-state"><span class="empty-icon">🔗</span><p>Run analysis to see dependency graph</p></div>
        </div>
        <div class="dep-stats" id="dep-stats">
          <div class="dep-stat"><div class="dep-stat-num" id="dep-total">—</div><div class="dep-stat-label">Total Deps</div></div>
          <div class="dep-stat"><div class="dep-stat-num" id="dep-direct">—</div><div class="dep-stat-label">Direct</div></div>
          <div class="dep-stat"><div class="dep-stat-num" id="dep-dev">—</div><div class="dep-stat-label">Dev Deps</div></div>
          <div class="dep-stat"><div class="dep-stat-num" id="dep-vulns" style="color:var(--accent-red)">—</div><div class="dep-stat-label">Vulnerabilities</div></div>
        </div>
      </div>
    </div>
  `;
}

let depGraph = { nodes: [], edges: [], scale: 1, offsetX: 0, offsetY: 0 };

function renderDependencyGraph(data) {
  const canvas = document.getElementById('dep-canvas');
  const empty = document.getElementById('dep-empty');
  if (!canvas) return;

  const deps = data.dependencies || [];
  if (deps.length === 0) return;

  empty.style.display = 'none';

  document.getElementById('dep-total').textContent = data.total || deps.length;
  document.getElementById('dep-direct').textContent = data.direct || deps.filter(d => !d.dev).length;
  document.getElementById('dep-dev').textContent = data.devCount || deps.filter(d => d.dev).length;
  document.getElementById('dep-vulns').textContent = data.vulnerabilities || 0;

  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width || 800;
  const H = 420;
  canvas.width = W;
  canvas.height = H;

  const centerNode = { id: 'root', label: data.name || 'project', x: W / 2, y: H / 2, isRoot: true };
  const nodes = [centerNode];
  const edges = [];

  const radius = Math.min(W, H) * 0.38;
  deps.slice(0, 40).forEach((dep, i) => {
    const angle = (i / Math.min(deps.length, 40)) * Math.PI * 2;
    const r = dep.dev ? radius * 0.65 : radius;
    nodes.push({
      id: dep.name,
      label: dep.name,
      x: W / 2 + Math.cos(angle) * r,
      y: H / 2 + Math.sin(angle) * r,
      dev: dep.dev,
      vulnerable: dep.vulnerable,
      version: dep.version,
    });
    edges.push({ from: 'root', to: dep.name });
  });

  depGraph = { nodes, edges, scale: 1, offsetX: 0, offsetY: 0 };
  drawDepGraph(canvas);

  document.getElementById('dep-zoom-in').onclick = () => { depGraph.scale = Math.min(depGraph.scale + 0.15, 2.5); drawDepGraph(canvas); };
  document.getElementById('dep-zoom-out').onclick = () => { depGraph.scale = Math.max(depGraph.scale - 0.15, 0.4); drawDepGraph(canvas); };
  document.getElementById('dep-reset').onclick = () => { depGraph.scale = 1; depGraph.offsetX = 0; depGraph.offsetY = 0; drawDepGraph(canvas); };

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left - depGraph.offsetX) / depGraph.scale;
    const my = (e.clientY - r.top - depGraph.offsetY) / depGraph.scale;
    const hit = depGraph.nodes.find(n => Math.hypot(n.x - mx, n.y - my) < 20);
    canvas.title = hit ? `${hit.label}${hit.version ? ' ' + hit.version : ''}${hit.vulnerable ? ' ⚠ VULNERABLE' : ''}` : '';
  });
}

function drawDepGraph(canvas) {
  const ctx = canvas.getContext('2d');
  const { nodes, edges, scale, offsetX, offsetY } = depGraph;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.lineWidth = 1;
  edges.forEach(edge => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = to.vulnerable ? 'rgba(248,81,73,0.3)' : 'rgba(88,166,255,0.15)';
    ctx.stroke();
  });

  nodes.forEach(node => {
    ctx.beginPath();
    const r = node.isRoot ? 16 : 8;
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

    if (node.isRoot) {
      ctx.fillStyle = '#58a6ff';
    } else if (node.vulnerable) {
      ctx.fillStyle = '#f85149';
    } else if (node.dev) {
      ctx.fillStyle = '#484f58';
    } else {
      ctx.fillStyle = '#3fb950';
    }
    ctx.fill();

    if (scale > 0.7) {
      ctx.fillStyle = '#e6edf3';
      ctx.font = `${Math.round(10 / scale)}px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      const label = node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label;
      ctx.fillText(label, node.x, node.y + r + 13);
    }
  });

  ctx.restore();
}
