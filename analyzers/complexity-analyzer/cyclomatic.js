/**
 * analyzers/complexity-analyzer/cyclomatic.js
 * Cyclomatic complexity calculation for JavaScript, TypeScript, and Python
 *
 * Cyclomatic Complexity = number of decision points + 1
 * Decision points: if, else if, for, while, do, case, catch, ternary, &&, ||, ??
 */

// Keywords/patterns that increase complexity by 1
const JS_DECISION_PATTERNS = [
  /\bif\s*\(/g,
  /\belse\s+if\s*\(/g,
  /\bfor\s*\(/g,
  /\bwhile\s*\(/g,
  /\bdo\s*\{/g,
  /\bcase\s+.+:/g,
  /\bcatch\s*\(/g,
  /\?\s*[^:]/g,          // ternary
  /&&/g,
  /\|\|/g,
  /\?\?/g,               // nullish coalescing
  /\bswitch\s*\(/g,
];

const PY_DECISION_PATTERNS = [
  /\bif\s+/g,
  /\belif\s+/g,
  /\bfor\s+/g,
  /\bwhile\s+/g,
  /\bexcept\b/g,
  /\band\b/g,
  /\bor\b/g,
];

/**
 * Calculate cyclomatic complexity of a source file
 * @param {string} content - Source code content
 * @param {string} filePath - Used to detect language
 * @returns {number} Complexity score (minimum 1)
 */
function calculateCyclomatic(content, filePath = '') {
  if (!content || content.trim().length === 0) return 1;

  // Strip string literals and comments to avoid false positives
  const cleaned = stripStringsAndComments(content, filePath);

  const isPython = filePath.endsWith('.py');
  const patterns = isPython ? PY_DECISION_PATTERNS : JS_DECISION_PATTERNS;

  let count = 1; // baseline
  patterns.forEach(pattern => {
    const matches = cleaned.match(new RegExp(pattern.source, 'g'));
    if (matches) count += matches.length;
  });

  return count;
}

/**
 * Strip string literals and single-line comments from source
 * to prevent keyword matches inside strings
 */
function stripStringsAndComments(content, filePath) {
  let result = content;

  // Remove template literals
  result = result.replace(/`[^`]*`/g, '""');
  // Remove double-quoted strings
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // Remove single-quoted strings
  result = result.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  // Remove single-line comments
  if (filePath.endsWith('.py')) {
    result = result.replace(/#.*/g, '');
  } else {
    result = result.replace(/\/\/.*/g, '');
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  return result;
}

/**
 * Classify a complexity number into a risk category
 */
function classifyComplexity(value) {
  if (value <= 5)  return { label: 'Simple',       risk: 'low',      color: '#238636' };
  if (value <= 10) return { label: 'Moderate',     risk: 'medium',   color: '#9e6a03' };
  if (value <= 20) return { label: 'Complex',      risk: 'high',     color: '#da6800' };
  return             { label: 'Very Complex',  risk: 'critical', color: '#cf222e' };
}

module.exports = { calculateCyclomatic, classifyComplexity };
