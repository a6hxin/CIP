/**
 * analyzers/complexity-analyzer/hotspot_detector.js
 * Identify high-risk files that combine high complexity with large size
 *
 * Hotspot Score = complexity * log2(lines) — files ranking high on both axes
 */

/**
 * Rank files by hotspot score and return top N
 * @param {Array<{name, lines, complexity}>} files
 * @param {number} topN
 * @returns {Array<Hotspot>}
 */
function detectHotspots(files, topN = 10) {
  if (!files || files.length === 0) return [];

  const scored = files
    .filter(f => f.lines > 10)
    .map(f => {
      const logLines = Math.log2(Math.max(f.lines, 2));
      const hotspotScore = Math.round(f.complexity * logLines);
      return {
        name: f.name,
        lines: f.lines,
        complexity: f.complexity,
        hotspotScore,
        riskLevel: classifyRisk(f.complexity, f.lines),
      };
    })
    .sort((a, b) => b.hotspotScore - a.hotspotScore)
    .slice(0, topN);

  return scored;
}

/**
 * Classify a file's risk level from its complexity and size
 */
function classifyRisk(complexity, lines) {
  if (complexity > 20 && lines > 200) return 'critical';
  if (complexity > 15 || lines > 500) return 'high';
  if (complexity > 10 || lines > 300) return 'medium';
  return 'low';
}

/**
 * Find files that appear in both high-complexity and high-churn lists
 * These are the most dangerous files in the codebase
 * @param {Array<Hotspot>} hotspots
 * @param {Array<{file, changes}>} churnFiles
 * @returns {Array}
 */
function findRiskyIntersection(hotspots, churnFiles) {
  const churnSet = new Set(churnFiles.map(c => c.file));
  return hotspots.filter(h => churnSet.has(h.name)).map(h => ({
    ...h,
    churnCount: churnFiles.find(c => c.file === h.name)?.changes || 0,
    combinedRisk: 'critical',
  }));
}

module.exports = { detectHotspots, classifyRisk, findRiskyIntersection };
