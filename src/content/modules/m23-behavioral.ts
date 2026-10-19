import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm23')!;

const STAR_RUBRIC = [
  { id: 'situation', point: 'Situation: concrete context (team, product, stakes)', any: ['team', 'product', 'module', 'release', 'project', 'we were', 'at my'] },
  { id: 'task', point: 'Task: your specific responsibility', any: ['my role', 'i was responsible', 'my responsibility', 'i owned', 'i had to', 'task'] },
  { id: 'action', point: 'Action: what YOU did, in "I" statements', any: ['i built', 'i designed', 'i proposed', 'i introduced', 'i led', 'i analysed', 'i analyzed', 'i wrote', 'i set up', 'i changed', 'i worked'] },
  { id: 'result', point: 'Result: measured outcome', any: ['%', 'reduced', 'increased', 'improved', 'saved', 'from', 'hours', 'minutes'] },
  { id: 'learn', point: 'Reflection: what you learned / would do differently', any: ['learned', 'learnt', 'differently', 'next time', 'lesson'] },
];

export const m23: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm23-l1',
        title: 'STAR stories from your real work',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'How behavioral rounds are scored',
            body: `Interviewers score **evidence of behaviour**, not opinions about behaviour. "I always communicate well" scores nothing; "I noticed X, I did Y, it led to Z" scores.

**STAR**, about 2 minutes spoken:
- **Situation** (15%) — team, product, why it mattered.
- **Task** (10%) — *your* responsibility.
- **Action** (50%) — what *you* did, step by step, with your reasoning. Use "I", not "we".
- **Result** (25%) — numbers, outcome, what changed afterwards, and what you learned.

**Build 6–8 strong stories** that together answer the 15 common prompts (the Story Bank in the Interview Arena tracks coverage). One story can answer several prompts if you change the emphasis.

**The 15 prompts and the story type that answers each:**
| Prompt | Best story |
|---|---|
| Tell me about yourself | 60–90 s career summary |
| Your automation framework | Framework you built or own |
| Biggest automation challenge | Hard technical problem (flakiness, scale, legacy) |
| Biggest production bug | Incident + RCA + prevention |
| How did you reduce flaky tests? | Measured flaky-rate improvement |
| How do you decide what to automate? | Risk/ROI decision with an example |
| Developer disagrees with QA | Conflict resolved with evidence |
| Release with critical defects | Go/no-go decision under pressure |
| Mentoring junior engineers | Someone who grew under you |
| Estimating testing | An estimate, how you made it, how it turned out |
| Prioritizing under deadlines | What you cut, why, and how you communicated it |
| Convincing management to invest in automation | Business case with numbers |
| Tell me about a failure | Real mistake, ownership, lasting change |
| Tell me about a conflict | Same as disagreement, focus on relationship |
| A project you led | End-to-end ownership with results |

**Never invent.** Interviewers drill down three levels. Where you lack a number, find it (Jira, release notes, dashboards, CI history) or say honestly how you'd measure it. If your CV says "reduced regression time by 30%" or "95% automation coverage", be ready for: from what to what? measured how? over which period? what did *you* do vs the team?

**Two versions per story:** SDET 3 version (technical depth: framework design, debugging) and QA Lead version (decisions, stakeholders, people).

**"Tell me about yourself"** (60–90 s): present role and scope → 2–3 proof points with numbers → what you're looking for and why this role. Not your life story.`,
          },
          { kind: 'video', title: 'Watch: STAR from an interviewer\'s side', video: VIDEOS.star },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m23-q1', 'm23-q2', 'm23-q3'] },
          {
            kind: 'build',
            title: 'Write your first three STAR stories',
            task: 'In the Interview Arena\'s Story Bank, write three true stories from your work — good candidates are usually: the framework you built or own, a migration or big refactor, someone you mentored, a production issue you debugged, a release decision under pressure. If you imported a profile pack, its facts are shown next to behavioral questions. Mark which prompts each answers. Use [need: …] for any number you must look up.',
            acceptance: [
              'Each story has all four STAR parts',
              'Actions are written with "I", not "we"',
              'Results include a real number or an explicit [need: …] placeholder',
              'Together they cover at least 6 of the 15 prompts',
              'Nothing invented',
            ],
          },
          { kind: 'interview', title: 'Tell me about yourself', interviewId: 'iv-m23-about' },
          { kind: 'interview', title: 'Biggest production bug', interviewId: 'iv-m23-prodbug' },
          { kind: 'interview', title: 'Mentoring', interviewId: 'iv-m23-mentor' },
          { kind: 'interview', title: 'A failure', interviewId: 'iv-m23-failure' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm23-q1', skill: 'behavioral', moduleId: 'm23', type: 'mcq', difficulty: 1,
      prompt: 'Which part of a STAR answer deserves the most time?',
      options: opts('Situation', 'Task', 'Action', 'Result'),
      answer: ['c'],
      explanation: 'Interviewers assess what you did and why. Keep context brief.',
    },
    {
      id: 'm23-q2', skill: 'behavioral', moduleId: 'm23', type: 'mcq', difficulty: 2,
      prompt: 'You don\'t remember the exact number for a result. Best approach?',
      options: opts('Make up a plausible number', 'Look it up beforehand; if unknown, say so and describe how it was or would be measured', 'Avoid mentioning results', 'Say "a lot"'),
      answer: ['b'],
      explanation: 'Invented numbers collapse under follow-up questions and destroy credibility.',
    },
    {
      id: 'm23-q3', skill: 'behavioral', moduleId: 'm23', type: 'mcq', difficulty: 2,
      prompt: 'Your answer uses "we" throughout. Why is that a problem?',
      options: opts('It isn\'t', 'The interviewer can\'t tell what you personally did, so they can\'t score your behaviour', 'It sounds arrogant', 'It\'s too short'),
      answer: ['b'],
      explanation: 'Credit the team in one sentence, then describe your own actions with "I".',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m23-about', modes: ['behavioral', 'full-sdet3', 'full-qa-lead'], skill: 'behavioral', level: 'L4', kind: 'behavioral', cvGrounded: true,
      prompt: 'Tell me about yourself.',
      rubric: [
        { id: 'now', point: 'Current role and scope', any: ['currently', 'i am', 'i lead', 'team lead', 'sdet', 'responsible for'] },
        { id: 'proof', point: '2–3 proof points with numbers', any: ['%', 'reduced', 'automated', 'test cases', 'coverage', 'award'] },
        { id: 'arc', point: 'Brief career arc', any: ['before that', 'started', 'previously', 'years'] },
        { id: 'tech', point: 'Relevant technical depth for the role', any: ['selenium', 'playwright', 'api', 'java', 'framework', 'ci'] },
        { id: 'why', point: 'Why this role / what next', any: ['looking for', 'next', 'why', 'excited', 'want to'] },
      ],
      structure: 'Present (role, scope) → proof points → brief past → why this role. 60–90 seconds.',
      modelAnswer: '"(Shape — fill with your verified facts.) I\'m a [title] at [company], leading automation for [area or modules]. I own the automation roadmap, review code and sign off releases, and I\'ve mentored new joiners on our framework. Highlights: [real number of] automated cases across my modules, regression time cut by [real %], and leading our move to Playwright. Before that I [previous role and what it taught you]. I\'m now looking for an SDET 3 / QA Lead role where I can own test architecture across teams and bring AI-assisted testing into the workflow — which is why this role interests me."',
      followUp: 'Which of those achievements are you proudest of, and what exactly did you do?',
      revision: ['m23'],
    },
    {
      id: 'iv-m23-prodbug', modes: ['behavioral', 'full-sdet3', 'full-qa-lead'], skill: 'behavioral', level: 'L4', kind: 'behavioral', cvGrounded: true,
      prompt: 'Tell me about the biggest production bug you were involved with. How was it found, what did you do, and what changed afterwards?',
      rubric: [...STAR_RUBRIC, { id: 'rca', point: 'Root cause analysis and prevention', any: ['root cause', '5 whys', 'prevent', 'regression test', 'monitor', 'checklist'] }],
      structure: 'STAR + RCA: impact → how detected → your investigation → fix → root cause → prevention.',
      modelAnswer: '"(Use a real incident — Shape:) Users reported X; impact was Y customers. I pulled the logs and metrics, correlated by request id, and reproduced it in QA with data Z. Root cause was A, which our tests missed because B. We hot-fixed; I added an automated regression test and a monitor for the error pattern, and we added C to the review checklist. Since then, no recurrence."',
      followUp: 'Why didn\'t your existing tests catch it?',
      revision: ['m23', 'm01'],
    },
    {
      id: 'iv-m23-mentor', modes: ['behavioral', 'qa-lead', 'full-qa-lead'], skill: 'behavioral', level: 'L6', kind: 'behavioral', cvGrounded: true,
      prompt: 'How do you mentor junior engineers? Give a specific example.',
      rubric: [...STAR_RUBRIC, { id: 'method', point: 'Concrete mentoring methods (pairing, reviews, goals, feedback)', any: ['pair', 'code review', 'feedback', 'goal', 'one on one', '1:1', 'stretch'] }],
      structure: 'Your approach in one line → one specific person/story → methods → their growth → what you learned as a mentor.',
      modelAnswer: '"(Use a real new joiner you mentored.) My approach: clear expectations, pairing early, then increasing ownership. Example: a new joiner on the leave module. Week one we paired on a test end to end; I reviewed their PRs with explanations rather than fixes; by week three they owned the comp-off suite. I set a goal of one framework improvement per sprint. Result: [real outcome]. I learned to write down our conventions — it halved repeated review comments."',
      followUp: 'Tell me about a mentee who struggled. What did you do?',
      revision: ['m23', 'm20'],
    },
    {
      id: 'iv-m23-failure', modes: ['behavioral', 'full-sdet3', 'full-qa-lead'], skill: 'behavioral', level: 'L4', kind: 'behavioral', cvGrounded: true,
      prompt: 'Tell me about a time you failed.',
      rubric: [...STAR_RUBRIC, { id: 'own', point: 'Takes ownership without blaming others', any: ['my mistake', 'i should have', 'i missed', 'ownership', 'i underestimated', 'responsib'] }],
      structure: 'A real, meaningful failure → your part in it → what you did to recover → what you changed permanently.',
      modelAnswer: '"(Choose a real, moderate-stakes failure.) Shape: I underestimated X, which caused Y. I owned it with my manager immediately, recovered by Z, and permanently changed how I do W — for example, I now add buffer and explicit assumptions to estimates and review them at mid-sprint."',
      followUp: 'How do you know the change actually worked?',
      revision: ['m23'],
    },
  ],
  flashcards: [
    { id: 'fc-m23-1', skill: 'behavioral', moduleId: 'm23', front: 'STAR time split', back: 'Situation ~15%, Task ~10%, Action ~50%, Result ~25%.' },
    { id: 'fc-m23-2', skill: 'behavioral', moduleId: 'm23', front: 'Tell me about yourself — structure', back: 'Current role & scope → 2–3 proof points with numbers → brief arc → why this role. 60–90 s.' },
  ],
};
