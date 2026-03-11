const path = require('path');
const fs = require('fs-extra');
const { calculateCyclomatic, classifyComplexity } = require('../analyzers/complexity-analyzer/cyclomatic');
const { detectHotspots, findRiskyIntersection } = require('../analyzers/complexity-analyzer/hotspot_detector');

describe('cyclomatic complexity', () => {
  it('returns 1 for empty/trivial code', () => {
    expect(calculateCyclomatic('const x = 1;')).toBe(1);
  });

  it('increments for each if statement', () => {
    const code = `
      function foo(x) {
        if (x > 0) return 1;
        if (x < 0) return -1;
        return 0;
      }
    `;
    expect(calculateCyclomatic(code)).toBeGreaterThanOrEqual(3);
  });

  it('increments for logical operators', () => {
    const code = `if (a && b || c) { return true; }`;
    const cc = calculateCyclomatic(code);
    expect(cc).toBeGreaterThanOrEqual(4); // 1 base + if + && + ||
  });

  it('does not count keywords inside string literals', () => {
    const code = `const msg = "if you want else do that";`;
    expect(calculateCyclomatic(code)).toBe(1);
  });

  it('handles ternary operators', () => {
    const code = `const result = x > 0 ? 'pos' : 'neg';`;
    expect(calculateCyclomatic(code)).toBeGreaterThan(1);
  });

  describe('classifyComplexity()', () => {
    it('classifies low complexity correctly', () => {
      expect(classifyComplexity(3).risk).toBe('low');
    });
    it('classifies medium complexity correctly', () => {
      expect(classifyComplexity(8).risk).toBe('medium');
    });
    it('classifies high complexity correctly', () => {
      expect(classifyComplexity(15).risk).toBe('high');
    });
    it('classifies critical complexity correctly', () => {
      expect(classifyComplexity(25).risk).toBe('critical');
    });
  });
});

describe('hotspot_detector', () => {
  const mockFiles = [
    { name: 'src/core/engine.js', lines: 800, complexity: 45 },
    { name: 'src/utils/helpers.js', lines: 50, complexity: 3 },
    { name: 'src/api/handler.js', lines: 320, complexity: 22 },
    { name: 'src/models/user.js', lines: 200, complexity: 12 },
    { name: 'src/index.js', lines: 10, complexity: 1 },
  ];

  describe('detectHotspots()', () => {
    it('returns an array', () => {
      expect(Array.isArray(detectHotspots(mockFiles))).toBe(true);
    });

    it('ranks by hotspot score descending', () => {
      const hotspots = detectHotspots(mockFiles);
      for (let i = 1; i < hotspots.length; i++) {
        expect(hotspots[i - 1].hotspotScore).toBeGreaterThanOrEqual(hotspots[i].hotspotScore);
      }
    });

    it('engine.js should be the top hotspot', () => {
      const hotspots = detectHotspots(mockFiles);
      expect(hotspots[0].name).toBe('src/core/engine.js');
    });

    it('includes riskLevel field', () => {
      const hotspots = detectHotspots(mockFiles);
      hotspots.forEach(h => {
        expect(['low', 'medium', 'high', 'critical']).toContain(h.riskLevel);
      });
    });

    it('handles empty input', () => {
      expect(detectHotspots([])).toEqual([]);
    });
  });

  describe('findRiskyIntersection()', () => {
    it('returns files present in both hotspots and churn list', () => {
      const hotspots = detectHotspots(mockFiles);
      const churn = [{ file: 'src/core/engine.js', changes: 42 }];
      const risky = findRiskyIntersection(hotspots, churn);
      expect(risky.length).toBe(1);
      expect(risky[0].name).toBe('src/core/engine.js');
      expect(risky[0].churnCount).toBe(42);
    });
  });
});
