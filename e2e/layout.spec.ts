import { expect, test } from '@playwright/test';

// Layout guard: at every common width, no page scrolls sideways and no element pokes out past the viewport.
const WIDTHS = [375, 768, 1024, 1440, 1920];
const PAGES = [
  '/', '/feed', '/learn', '/learn/m01', '/learn/m01/m01-l1', '/learn/m04/m04-l1', '/learn/m11/m11-l2', '/learn/m22/m22-l2',
  '/lab', '/lab/js-test-order', '/lab/sql-balance-check', '/lab/java-driver-factory',
  '/arena', '/arena/dsa', '/revision', '/projects', '/progress', '/settings',
];

test.describe('responsive layout', () => {
  test.skip(({ isMobile }) => isMobile, 'widths are set explicitly; run once');
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const problems: string[] = [];
      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const found = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const out: string[] = [];
          if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
          for (const el of Array.from(document.querySelectorAll('main *'))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.right <= vw + 1) continue;
            // Allowed: content inside an element that scrolls horizontally on purpose.
            let p: Element | null = el.parentElement;
            let clipped = false;
            while (p && p !== document.body) {
              const ox = getComputedStyle(p).overflowX;
              if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { clipped = true; break; }
              p = p.parentElement;
            }
            if (!clipped) out.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)}`);
            if (out.length > 5) break;
          }
          return out;
        });
        for (const f of found) problems.push(`${path}: ${f}`);
      }
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
});
