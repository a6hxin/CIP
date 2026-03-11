function calculateMetrics(files) {
  if (!files || files.length === 0) {
    return {
      totalFiles: 0,
      totalLines: 0,
      avgComplexity: 0,
      maxComplexity: 0,
      highComplexityFiles: 0,
      healthScore: 100,
      churnRate: 0,
      totalDependencies: 0,
      vulnerabilities: 0,
    };
  }

  const totalFiles = files.length;
  const totalLines = files.reduce((s, f) => s + (f.lines || 0), 0);
  const complexities = files.map(f => f.complexity || 1);

  const avgComplexity = parseFloat((complexities.reduce((a, b) => a + b, 0) / totalFiles).toFixed(2));
  const maxComplexity = Math.max(...complexities);
  const highComplexityFiles = files.filter(f => (f.complexity || 0) > 20).length;

  let healthScore = 100;
  if (avgComplexity > 5)  healthScore -= Math.min((avgComplexity - 5) * 3, 30);
  if (highComplexityFiles > 0) healthScore -= Math.min((highComplexityFiles / totalFiles) * 100 * 0.4, 40);
  healthScore = Math.max(0, Math.round(healthScore));

  return {
    totalFiles,
    totalLines,
    avgComplexity,
    maxComplexity,
    highComplexityFiles,
    healthScore,
    churnRate: 0, 
    totalDependencies: 0,
    vulnerabilities: 0,
  };
}

function mergeWithChurn(metrics, churnData) {
  return {
    ...metrics,
    churnRate: churnData.churnRate || 0,
    mostChangedFiles: churnData.mostChanged || [],
  };
}

function normalizeComplexity(value, max = 50) {
  return Math.round(Math.max(0, Math.min(100, 100 - (value / max) * 100)));
}

module.exports = { calculateMetrics, mergeWithChurn, normalizeComplexity };
