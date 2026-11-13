import { PROBLEMS } from '@/content';
import { drillLang, firstWrong, makeGaps, orderBlocks, scramble, syntaxChips } from '@/lib/codeDrill';

const code = ['function findDuplicates(ids) {', '  const seen = new Set();', '  const dupes = new Set();', '  for (const id of ids) {', '    if (seen.has(id)) dupes.add(id);', '    else seen.add(id);', '  }', '  return [...dupes];', '}'].join('\n');

describe('order the lines', () => {
  it('groups a long solution into at most seven blocks and loses no line', () => {
    const blocks = orderBlocks(code);
    expect(blocks.length).toBeLessThanOrEqual(7);
    expect(blocks.map((b) => b.text).join('\n')).toBe(code);
  });

  it('scrambles deterministically, never into the solved order', () => {
    const blocks = orderBlocks(code);
    const mixed = scramble(blocks, 'p1');
    expect(mixed).toEqual(scramble(blocks, 'p1'));
    expect(mixed.map((b) => b.id).sort()).toEqual(blocks.map((b) => b.id));
    expect(firstWrong(mixed, blocks)).toBeGreaterThanOrEqual(0);
    expect(firstWrong(blocks, blocks)).toBe(-1);
    expect(firstWrong(blocks.slice(0, 2), blocks)).toBe(2);
  });

  it('treats identical lines as interchangeable', () => {
    const blocks = orderBlocks('a();\nb();\na();');
    expect(firstWrong([blocks[2], blocks[1], blocks[0]], blocks)).toBe(-1);
  });
});

describe('fill the gaps', () => {
  it('removes syntax that can be put back exactly, with the answer among four options', () => {
    const { parts, gaps } = makeGaps(code, 'js', 'p1');
    expect(gaps.length).toBeGreaterThan(0);
    expect(parts.map((p) => (typeof p === 'number' ? gaps[p].token : p)).join('')).toBe(code);
    for (const g of gaps) {
      expect(g.options).toContain(g.token);
      expect(new Set(g.options).size).toBe(g.options.length);
      expect(g.options).toHaveLength(4);
    }
  });

  it('blanks real syntax, not a variable that happens to share its name', () => {
    const src = 'function f(min, max, map) {\n  const set = new Set([min, max]);\n  return Math.max(...set);\n}';
    const { parts, gaps } = makeGaps(src, 'js', 'p3', 5);
    const before = (i: number) => String(parts[parts.indexOf(i) - 1]);
    gaps.forEach((g, i) => {
      if (['max', 'min', 'map', 'set'].includes(g.token)) expect(before(i).endsWith('.'), g.token).toBe(true);
    });
    expect(gaps.map((g) => g.token)).toEqual(expect.arrayContaining(['Set', 'max']));
  });

  it('matches SQL keywords whatever their case and spacing', () => {
    const { parts, gaps } = makeGaps('select name\nfrom employees\ngroup  by name\nhaving count(*) > 1', 'sql', 'p2');
    expect(gaps.map((g) => g.token)).toContain('group  by');
    expect(parts.map((p) => (typeof p === 'number' ? gaps[p].token : p)).join('')).toContain('having count(*)');
  });
});

describe('syntax chips', () => {
  it('offers the syntax the solution uses, in the order it is needed', () => {
    const labels = syntaxChips(code, 'js').map((c) => c.label);
    expect(labels.slice(0, 2)).toEqual(['const', 'return']);
    expect(labels).toEqual(expect.arrayContaining(['new Set()', 'for…of', 'if', '.has()', '.add()']));
    expect(labels.indexOf('new Set()')).toBeLessThan(labels.indexOf('.has()'));
  });
});

describe('every authored problem', () => {
  it('produces a well-formed drill', () => {
    for (const p of PROBLEMS) {
      const lang = drillLang(p);
      const blocks = orderBlocks(p.solution.code);
      expect(blocks.length, p.id).toBeGreaterThan(0);
      expect(blocks.map((b) => b.text).join('\n'), p.id).toBe(p.solution.code.split('\n').filter((l) => l.trim()).join('\n'));
      const { parts, gaps } = makeGaps(p.solution.code, lang, p.id);
      expect(parts.map((x) => (typeof x === 'number' ? gaps[x].token : x)).join(''), p.id).toBe(p.solution.code);
      for (const g of gaps) expect(g.options, p.id).toContain(g.token);
      expect(Array.isArray(syntaxChips(p.solution.code, lang))).toBe(true);
    }
  });
});
