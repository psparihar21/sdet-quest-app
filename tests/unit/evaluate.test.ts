import { evaluateChoice } from '@/lib/evaluate/choice';
import { evaluateAnswer, hasPhrase, normalize, scoreFromCovered } from '@/lib/evaluate/rubric';
import { interviewQuestionSchema, questionSchema, type Question } from '@/content/types';

const mcq: Question = questionSchema.parse({
  id: 'q',
  skill: 'api',
  moduleId: 'm09',
  type: 'mcq',
  prompt: 'Unauthenticated request returns?',
  options: [
    { id: 'a', text: '401' },
    { id: 'b', text: '403' },
  ],
  answer: ['a'],
  explanation: '401 means not authenticated.',
  misconceptions: { b: '403 is authenticated but forbidden.' },
  difficulty: 1,
});
const multi: Question = {
  ...mcq,
  type: 'multi',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
  ],
  answer: ['a', 'b'],
};

describe('choice evaluation', () => {
  it('scores a correct mcq', () => {
    expect(evaluateChoice(mcq, ['a'])).toMatchObject({ correct: true, score: 1 });
  });
  it('explains the misconception behind a wrong pick', () => {
    const r = evaluateChoice(mcq, ['b']);
    expect(r.correct).toBe(false);
    expect(r.notes).toEqual(['403 is authenticated but forbidden.']);
  });
  it('gives partial credit on multi-select and penalises wrong picks', () => {
    expect(evaluateChoice(multi, ['a']).score).toBe(0.5);
    expect(evaluateChoice(multi, ['a', 'c']).score).toBe(0);
    expect(evaluateChoice(multi, ['a', 'b'])).toMatchObject({ correct: true, score: 1 });
  });
});

describe('rubric evaluation', () => {
  const q = interviewQuestionSchema.parse({
    id: 'iv',
    modes: ['automation'],
    skill: 'framework',
    level: 'L3',
    kind: 'technical',
    prompt: 'What is a flaky test and how do you handle it?',
    rubric: [
      { id: 'def', point: 'Non-deterministic pass/fail without code change', any: ['intermittent', 'non deterministic', 'sometimes pass'] },
      { id: 'cause', point: 'Names root causes', any: ['timing', 'race condition', 'shared state', 'test data'] },
      { id: 'quar', point: 'Quarantine and track', any: ['quarantine', 'flaky rate'] },
    ],
    redFlags: [{ any: ['add sleep', 'thread.sleep'], note: 'Fixed sleeps hide timing bugs; use explicit waits.' }],
    structure: 'Define, cause, detect, fix, prevent.',
    modelAnswer: 'x',
    followUp: 'y',
    revision: ['m10'],
  });

  it('normalizes and matches whole-word phrases with inflections', () => {
    const t = normalize('Tests that are Non-Deterministic, quarantined.');
    expect(hasPhrase(t, 'non deterministic')).toBe(true);
    expect(hasPhrase(t, 'quarantine')).toBe(true);
    expect(hasPhrase(normalize('timingx'), 'timing')).toBe(false);
  });

  it('finds covered and missing points and red flags', () => {
    const r = evaluateAnswer(q, 'A flaky test passes and fails intermittently. Usually timing or shared state. We just add sleep.');
    expect(r.covered).toEqual(['def', 'cause']);
    expect(r.missing).toEqual(['quar']);
    expect(r.redFlags).toHaveLength(1);
    expect(r.technical).toBeCloseTo(5.7, 1);
  });

  it('caps depth and communication for one-liners', () => {
    const r = evaluateAnswer(q, 'intermittent');
    expect(r.depth).toBeLessThanOrEqual(2);
    expect(r.communication).toBeLessThanOrEqual(3);
  });

  it('rewards examples, trade-offs and structure', () => {
    const long = [
      'First, a flaky test is non deterministic: it can sometimes pass and sometimes fail with no code change.',
      'Second, the usual causes are timing, race conditions and shared test data. For example, in my team 12% of failures were data collisions.',
      'Then we quarantine it and track the flaky rate per suite. However, quarantine has a cost: coverage gaps, so each quarantined test gets an owner and an SLA.',
      'Finally, we fix the root cause rather than retrying, so the signal stays trustworthy.',
    ].join('\n');
    const r = evaluateAnswer(q, long);
    expect(r.technical).toBe(10);
    expect(r.signals).toMatchObject({ examples: true, tradeoffs: true, structure: true });
    expect(r.depth).toBeGreaterThanOrEqual(8);
    expect(r.communication).toBeGreaterThanOrEqual(7);
    expect(r.seniority).toMatch(/SDET 3|Lead/);
  });

  it('recomputes the score from learner-confirmed points', () => {
    expect(scoreFromCovered(q, ['def', 'cause', 'quar'])).toBe(10);
    expect(scoreFromCovered(q, [])).toBe(0);
  });
});
