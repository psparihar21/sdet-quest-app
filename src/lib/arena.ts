import { INTERVIEWS } from '@/content';
import type { InterviewMode, InterviewQuestion } from '@/content/types';
import type { Attempt } from '@/store/types';

export const MODE_INFO: Record<InterviewMode, { title: string; blurb: string; boss?: boolean }> = {
  java: { title: 'Java round', blurb: 'OOP, collections, strings, concurrency — the Java questions SDET panels love.' },
  dsa: { title: 'DSA round', blurb: 'Approach, complexity and testing your own solution.' },
  automation: { title: 'Selenium & Playwright', blurb: 'Waits, locators, flakiness, architecture differences.' },
  'api-sql': { title: 'API & SQL', blurb: 'HTTP semantics, auth, contracts, DB validation.' },
  framework: { title: 'Framework architecture', blurb: 'Design and defend an automation framework.' },
  cicd: { title: 'CI/CD & DevOps', blurb: 'Pipelines, gates, Docker, parallelism.' },
  'system-design': { title: 'System design', blurb: 'Test platforms, runners, reporting, flaky detection.' },
  'ai-mcp': { title: 'AI agents & MCP', blurb: 'Agent loops, tool calling, MCP, evaluating AI.' },
  'qa-lead': { title: 'QA Lead strategy', blurb: 'Risk, release decisions, metrics, stakeholders.' },
  behavioral: { title: 'Behavioral (STAR)', blurb: 'Your real stories, structured. No invented details.' },
  'full-sdet3': { title: 'Boss: full SDET 3 mock', blurb: 'Mixed technical rounds, timed, one question at a time.', boss: true },
  'full-qa-lead': { title: 'Boss: full QA Lead mock', blurb: 'Strategy, leadership, design and behavioral, timed.', boss: true },
};

const FULL_SOURCES: Record<'full-sdet3' | 'full-qa-lead', InterviewMode[]> = {
  'full-sdet3': ['java', 'dsa', 'automation', 'api-sql', 'framework', 'cicd', 'system-design', 'full-sdet3'],
  'full-qa-lead': ['qa-lead', 'behavioral', 'system-design', 'full-qa-lead'],
};

export function poolFor(mode: InterviewMode): InterviewQuestion[] {
  if (mode === 'full-sdet3' || mode === 'full-qa-lead') {
    const sources = new Set(FULL_SOURCES[mode]);
    return INTERVIEWS.filter((q) => q.modes.some((m) => sources.has(m)));
  }
  return INTERVIEWS.filter((q) => q.modes.includes(mode));
}

/**
 * Choose questions for a session: never-answered first, then lowest previous score,
 * spread across skills for full mocks. Deterministic apart from a seeded shuffle for variety.
 */
export function pickQuestions(mode: InterviewMode, attempts: Attempt[], count: number, seed = Date.now()): string[] {
  const pool = poolFor(mode);
  const lastScore = new Map<string, number>();
  for (const a of attempts) if (a.itemType === 'interview') lastScore.set(a.itemId, a.score);
  let x = seed % 2147483647 || 1;
  const rand = () => ((x = (x * 48271) % 2147483647) / 2147483647);
  const ranked = pool
    .map((q) => ({ q, key: (lastScore.has(q.id) ? 1 + lastScore.get(q.id)! : 0) + rand() * 0.3 }))
    .sort((a, b) => a.key - b.key)
    .map((r) => r.q);
  if (mode !== 'full-sdet3' && mode !== 'full-qa-lead') return ranked.slice(0, count).map((q) => q.id);
  const out: InterviewQuestion[] = [];
  const skills = new Set<string>();
  for (const q of ranked) {
    if (out.length < count && !skills.has(q.skill)) {
      out.push(q);
      skills.add(q.skill);
    }
  }
  for (const q of ranked) if (out.length < count && !out.includes(q)) out.push(q);
  return out.map((q) => q.id);
}

/** Boss battles unlock after 5 scored interview answers — but the learner can override. */
export const BOSS_UNLOCK = 5;
