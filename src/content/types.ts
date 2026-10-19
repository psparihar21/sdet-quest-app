import { z } from 'zod';

/** Skill categories. These drive mastery, readiness weighting and the weakness queue. */
export const SKILLS = [
  'fundamentals',
  'java',
  'dsa',
  'sql',
  'selenium',
  'playwright',
  'api',
  'framework',
  'cicd',
  'devops',
  'performance',
  'security',
  'mobile',
  'distributed',
  'ai',
  'agents',
  'mcp',
  'cursor',
  'qaStrategy',
  'leadership',
  'metrics',
  'systemDesign',
  'behavioral',
] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  fundamentals: 'Testing Fundamentals',
  java: 'Java',
  dsa: 'DSA',
  sql: 'SQL',
  selenium: 'Selenium',
  playwright: 'Playwright',
  api: 'API Testing',
  framework: 'Framework Architecture',
  cicd: 'CI/CD',
  devops: 'DevOps',
  performance: 'Performance',
  security: 'Security',
  mobile: 'Mobile',
  distributed: 'Distributed Systems',
  ai: 'AI Testing',
  agents: 'AI Agents',
  mcp: 'MCP',
  cursor: 'AI Coding Agents',
  qaStrategy: 'QA Strategy',
  leadership: 'Leadership',
  metrics: 'QA Metrics',
  systemDesign: 'System Design',
  behavioral: 'Behavioral',
};

const skill = z.enum(SKILLS);

/** Curriculum areas A–I from the master prompt. */
export const AREAS = {
  A: 'Testing foundations',
  B: 'Java & DSA',
  C: 'Selenium & automation architecture',
  D: 'Playwright',
  E: 'API & database',
  F: 'CI/CD & DevOps',
  G: 'Performance, security & mobile',
  H: 'Distributed systems & AI',
  I: 'Leadership & system design',
} as const;
export type Area = keyof typeof AREAS;

export const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'] as const;
export const LEVEL_LABELS: Record<(typeof LEVELS)[number], string> = {
  L1: 'SDET fundamentals',
  L2: 'SDET automation',
  L3: 'Senior SDET',
  L4: 'SDET 3',
  L5: 'Automation Architect',
  L6: 'QA Lead',
  L7: 'AI/Agentic QA',
  L8: 'Principal',
};

export const optionSchema = z.object({ id: z.string(), text: z.string() });

export const questionSchema = z
  .object({
    id: z.string(),
    skill,
    moduleId: z.string(),
    type: z.enum(['mcq', 'multi', 'tf', 'predict', 'debug', 'scenario']),
    prompt: z.string().min(5),
    code: z.string().optional(),
    codeLang: z.enum(['java', 'js', 'ts', 'sql', 'text', 'yaml']).optional(),
    options: z.array(optionSchema).min(2),
    answer: z.array(z.string()).min(1),
    explanation: z.string().min(10),
    /** Why a specific wrong option is tempting; shown when the learner picks it. */
    misconceptions: z.record(z.string()).optional(),
    difficulty: z.number().int().min(1).max(5),
    followUp: z.string().optional(),
  })
  .refine((q) => q.answer.every((a) => q.options.some((o) => o.id === a)), {
    message: 'answer ids must exist in options',
  })
  .refine((q) => q.type === 'multi' || q.answer.length === 1, {
    message: 'only multi questions may have more than one answer',
  });
export type Question = z.infer<typeof questionSchema>;

export const codeTestSchema = z.object({
  args: z.array(z.unknown()),
  expected: z.unknown(),
  hidden: z.boolean().optional(),
  note: z.string().optional(),
});

const solutionSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  time: z.string(),
  space: z.string(),
});

export const jsProblemSchema = z.object({
  kind: z.literal('js'),
  id: z.string(),
  title: z.string(),
  skill,
  moduleId: z.string(),
  difficulty: z.number().int().min(1).max(5),
  statement: z.string(),
  examples: z.array(z.object({ input: z.string(), output: z.string(), explain: z.string().optional() })),
  constraints: z.array(z.string()),
  functionName: z.string(),
  starter: z.string(),
  tests: z.array(codeTestSchema).min(2),
  /** When true, result arrays are compared ignoring order. */
  unordered: z.boolean().optional(),
  hints: z.array(z.string()).min(1),
  solution: solutionSchema,
  javaEquivalent: z.string().optional(),
  followUps: z.array(z.string()),
});

export const sqlProblemSchema = z.object({
  kind: z.literal('sql'),
  id: z.string(),
  title: z.string(),
  skill,
  moduleId: z.string(),
  difficulty: z.number().int().min(1).max(5),
  statement: z.string(),
  starter: z.string(),
  /** Reference query. The learner's result set is compared with this one's. */
  expectedQuery: z.string(),
  orderMatters: z.boolean(),
  hints: z.array(z.string()).min(1),
  solution: solutionSchema,
  followUps: z.array(z.string()),
});

export const javaReadProblemSchema = z.object({
  kind: z.literal('java'),
  id: z.string(),
  title: z.string(),
  skill,
  moduleId: z.string(),
  difficulty: z.number().int().min(1).max(5),
  statement: z.string(),
  starter: z.string(),
  /** Self-check items: Java is not executed in the browser, the learner compares against these. */
  checklist: z.array(z.string()).min(1),
  hints: z.array(z.string()).min(1),
  solution: solutionSchema,
  followUps: z.array(z.string()),
});

export const problemSchema = z.discriminatedUnion('kind', [jsProblemSchema, sqlProblemSchema, javaReadProblemSchema]);
export type Problem = z.infer<typeof problemSchema>;
export type JsProblem = z.infer<typeof jsProblemSchema>;
export type SqlProblem = z.infer<typeof sqlProblemSchema>;
export type JavaProblem = z.infer<typeof javaReadProblemSchema>;

export const INTERVIEW_MODES = [
  'java',
  'dsa',
  'automation',
  'api-sql',
  'framework',
  'cicd',
  'system-design',
  'ai-mcp',
  'qa-lead',
  'behavioral',
  'full-sdet3',
  'full-qa-lead',
] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const rubricPointSchema = z.object({
  id: z.string(),
  point: z.string(),
  /** Any of these phrases (case-insensitive) counts as evidence of the point. */
  any: z.array(z.string()).min(1),
  weight: z.number().positive().default(1),
});

export const interviewQuestionSchema = z.object({
  id: z.string(),
  modes: z.array(z.enum(INTERVIEW_MODES)).min(1),
  skill,
  level: z.enum(LEVELS),
  kind: z.enum(['technical', 'design', 'behavioral', 'scenario']),
  prompt: z.string(),
  context: z.string().optional(),
  rubric: z.array(rubricPointSchema).min(2),
  /** Phrases that indicate a common misconception, with the correction. */
  redFlags: z.array(z.object({ any: z.array(z.string()), note: z.string() })).default([]),
  structure: z.string(),
  modelAnswer: z.string(),
  followUp: z.string(),
  revision: z.array(z.string()),
  /** Behavioral prompt that should be grounded in the learner's own CV. */
  cvGrounded: z.boolean().optional(),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type RubricPoint = z.infer<typeof rubricPointSchema>;

export const videoSchema = z.object({
  youtubeId: z.string().regex(/^[\w-]{11}$/),
  title: z.string(),
  channel: z.string(),
  url: z.string().url(),
  /** ISO date the video was checked to exist (oEmbed 200) and be on-topic. */
  verifiedAt: z.string(),
  why: z.string(),
});
export type Video = z.infer<typeof videoSchema>;

export const sectionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('learn'), title: z.string(), body: z.string() }),
  z.object({ kind: z.literal('visual'), title: z.string(), vizId: z.string(), caption: z.string() }),
  z.object({ kind: z.literal('video'), title: z.string(), video: videoSchema }),
  z.object({ kind: z.literal('check'), title: z.string(), questionIds: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal('practice'), title: z.string(), problemId: z.string() }),
  z.object({
    kind: z.literal('build'),
    title: z.string(),
    task: z.string(),
    acceptance: z.array(z.string()).min(1),
  }),
  z.object({ kind: z.literal('interview'), title: z.string(), interviewId: z.string() }),
]);
export type Section = z.infer<typeof sectionSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  minutes: z.number().int().positive(),
  sections: z.array(sectionSchema).min(1),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const moduleSchema = z.object({
  id: z.string().regex(/^m\d{2}$/),
  number: z.number().int(),
  title: z.string(),
  area: z.enum(Object.keys(AREAS) as [Area, ...Area[]]),
  level: z.enum(LEVELS),
  skills: z.array(skill).min(1),
  summary: z.string(),
  prerequisites: z.array(z.string()),
  tags: z.array(z.string()),
  /** Topics from the original prompt this module covers (feeds the traceability matrix). */
  topics: z.array(z.string()).min(1),
  lessons: z.array(lessonSchema),
  /** Original markdown file this module was migrated from. */
  source: z.string(),
});
export type Module = z.infer<typeof moduleSchema>;

export const flashcardSchema = z.object({
  id: z.string(),
  skill,
  moduleId: z.string(),
  front: z.string(),
  back: z.string(),
});
export type Flashcard = z.infer<typeof flashcardSchema>;
