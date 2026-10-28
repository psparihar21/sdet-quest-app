import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

describe('security headers', () => {
  const headers = readFileSync('public/_headers', 'utf8');

  it('allows exactly the inline theme script in index.html', () => {
    const script = readFileSync('index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)![1];
    const hash = `sha256-${createHash('sha256').update(script).digest('base64')}`;
    expect(headers).toContain(`'${hash}'`);
  });

  it('never allows eval on the main page, and cuts the learner-code worker off the network', () => {
    const page = headers.split('\n/assets/')[0];
    expect(page).not.toContain('unsafe-eval');
    expect(headers).toMatch(/\/sandbox\/js\.worker-\*\n {2}! Content-Security-Policy\n {2}Content-Security-Policy:[^\n]*connect-src 'none'/);
  });
});
