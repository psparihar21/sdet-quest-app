import type { Video } from './types';

/**
 * Curated third-party videos. Each ID was checked on 2026-10-19 with YouTube's oEmbed
 * endpoint (HTTP 200 = public and embeddable) and the returned title/channel recorded here.
 * Relevance was judged from title, channel and length; the videos were not watched end to end,
 * so lessons never depend on them. Re-verify with `node scripts/verify-videos.mjs`.
 */
const V = (youtubeId: string, title: string, channel: string, why: string): Video => ({
  youtubeId,
  title,
  channel,
  url: `https://www.youtube.com/watch?v=${youtubeId}`,
  verifiedAt: '2026-10-19',
  why,
});

export const VIDEOS = {
  testPyramid: V('1Xbt3n4phFg', 'What is the testing pyramid?', 'The Test Lead', 'Short walkthrough of the pyramid layers and why the shape matters.'),
  beyondPyramid: V('IBvYFRSw4do', 'It’s Time We Go Beyond The Test Pyramid (& Do This Instead)', 'Modern Software Engineering', 'Dave Farley’s critique: a senior counterpoint worth knowing for interviews.'),
  verification: V('gQrSxbfUjug', 'Verification & Validation - Georgia Tech - Software Development Process', 'Udacity', 'Ninety-second academic definition of verification vs validation.'),
  bvaEp: V('P1Hv2sUPKeM', 'Boundary Value Analysis and Equivalence Partitioning: Software Testing Tutorial', 'Guru99', 'Three-minute refresher on the two most-asked test design techniques.'),
  hashmap: V('1CJbB6SzjVw', 'How HashMap Internally Works in Java With Animation', 'Java Techie', 'Animated buckets, hashing and collisions.'),
  raceCondition: V('RMR75VzYoos', 'Race Conditions in Java Multithreading', 'Jakob Jenkov', 'Clear explanation of read-modify-write races and critical sections.'),
  stackHeap: V('5OJRqkYbK-4', 'Stack vs Heap Memory - Simple Explanation', 'Alex Hyett', 'Five-minute mental model of stack frames vs heap objects.'),
  twoPointers: V('QzZ7nmouLTI', 'Two Pointers in 7 minutes | LeetCode Pattern', 'AlgoMasterIO', 'Pattern overview with typical problems.'),
  slidingWindow: V('y2d0VHdvfdc', 'Sliding Window in 7 minutes | LeetCode Pattern', 'AlgoMasterIO', 'Fixed and variable windows in one short video.'),
  sqlWindow: V('rIcB4zMYMas', 'SQL Window Functions | Clearly Explained | PARTITION BY, ORDER BY, ROW_NUMBER, RANK, DENSE_RANK', 'Maven Analytics', 'The ranking functions interviewers ask about, side by side.'),
  sqlJoins: V('Yh4CrPHVBdE', '6 SQL Joins you MUST know! (Animated + Practice)', 'Anton Putra', 'Animated join types.'),
  seleniumArch: V('ynJt8E3y6C4', 'School Of Basics | Selenium interview questions | How Selenium Works | Selenium Architecture', 'Automation Step by Step', 'How client bindings, driver and browser talk.'),
  pomFramework: V('Ktjt-pebRoc', 'Selenium Java Complete POM Framework | Step by Step from Scratch', 'Automation Step by Step', 'Long build-along of a Java POM framework (watch selectively).'),
  playwrightStart: V('WvsLGZnHmzw', 'Get Started with Playwright and VS Code (2025 edition)', 'Playwright', 'Official Playwright channel: install, run, debug in VS Code.'),
  browserContext: V('iJXXxNiF4iU', 'Browser vs BrowserContext vs Page in Playwright TypeScript Finally Explained!', 'Testing Talks with Faisal Khatri', 'The three-level object model with examples.'),
  pwVsSelenium: V('5s8_f0QWq34', 'Why does Playwright feel faster than Selenium? A byte-level comparison.', 'Naveen AutomationLabs', 'Protocol-level comparison (WebDriver HTTP vs persistent connection).'),
  httpStatus: V('qmpUfWN7hh4', 'HTTP Status Codes Explained In 5 Minutes', 'ByteByteGo', 'Status code families including 401 vs 403.'),
  contractTesting: V('IetyhDr48RI', '[Introduction to contract testing - Part 2] Contract testing and how Pact works', 'PactFlow', 'From the Pact maintainers: consumer-driven contracts.'),
  pwApi: V('P4Hswlt-KrI', 'Playwright API Testing with TypeScript (from scratch in 10 minutes)', 'Artem Bondar', 'APIRequestContext basics in TypeScript.'),
  restAssured: V('JJ7Tp7_fX4c', 'REST Assured API testing Beginner Tutorial | Part 1 - Getting Started', 'Automation Step by Step', 'given/when/then in Java.'),
  frameworkArch: V('lrUoCD1yrnU', 'How to Create an Architecture for Web Test Automation', 'Oracle Developers', 'Conference talk on layering a web automation architecture.'),
  flaky: V('CwfohDaRpig', '3 Reasons for Playwright Flaky Tests (and How To Fix It)', 'Artem Bondar', 'Concrete flaky-test causes and fixes.'),
  githubActions: V('R8_veQiYBjI', 'GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker', 'TechWorld with Nana', 'Workflows, jobs, steps, runners, with a Docker build.'),
  docker: V('Gjnup-PuquQ', 'Docker in 100 Seconds', 'Fireship', 'Two-minute mental model of images and containers.'),
  kubernetes: V('PziYflu8cB8', 'Kubernetes Explained in 100 Seconds', 'Fireship', 'Pods, nodes, control plane in two minutes.'),
  jmeter: V('NTyY8wKSvik', 'JMeter Load Testing | Load Testing Using JMeter | JMeter Tutorial For Beginners', 'Simplilearn', 'Thread groups, samplers and listeners.'),
  owasp: V('wUaeKEl1RCw', 'OWASP Top 10 Web Application Security Risks', 'Telusko', 'Tour of the OWASP Top 10 categories.'),
  appium: V('EH9zzKT4guE', 'School Of Basics | How Appium Works | Appium Architecture | Step by Step', 'Automation Step by Step', 'Client → Appium server → driver → device.'),
  kafka: V('uvb00oaa3k8', 'Kafka in 100 Seconds', 'Fireship', 'Topics, partitions, producers and consumers.'),
  llmJudge: V('trfUBIDeI1Y', 'LLM as a Judge: Scaling AI Evaluation Strategies', 'IBM Technology', 'Using a model to grade model output, and its limits.'),
  aiAgents: V('F8NKVhkZZWI', 'What are AI Agents?', 'IBM Technology', 'Agents vs plain LLM calls: reasoning, tools, memory.'),
  agentSkills: V('Lg-meK5IU8Q', 'What AI Agent Skills Are and How They Work', 'IBM Technology', 'Skills as packaged instructions and tools for agents.'),
  playwrightAgents: V('fsfaW7MokzQ', 'What are inbuilt Playwright Agents? Supercharge UI Automation with AI Agents', 'Rahul Shetty Academy', 'Planner, generator and healer agents demonstrated.'),
  mcp: V('eur8dUO9mvE', 'What is MCP? Integrate AI Agents with Databases & APIs', 'IBM Technology', 'Under four minutes: hosts, clients, servers, tools.'),
  mcpVsApi: V('7j1t3UZA1TY', 'MCP vs API: Simplifying AI Agent Integration with External Data', 'IBM Technology', 'Why a protocol layer on top of APIs helps agents.'),
  cursor: V('CZUtIIK4fdw', 'Cursor Deep Dive: How Senior Engineers Actually Use Cursor for 10x Productivity', 'ByteMonk', 'Rules, context and review habits for AI coding agents.'),
  dora: V('hbeyCECbLhk', 'Measuring Software Delivery With DORA Metrics', 'Modern Software Engineering', 'Throughput and stability metrics, and their misuse.'),
  testStrategy: V('BHq8ut1PzF4', 'Understanding Test Strategy in Software Testing', 'The Testing Academy', 'What a test strategy document covers.'),
  systemDesign: V('i7twT3x5yv8', 'System Design Interview: A Step-By-Step Guide', 'ByteByteGo', 'A repeatable structure for design rounds.'),
  star: V('UQrTMxouDUY', 'STAR Method - How to Ace Your Amazon Interview', 'Inside Amazon', 'The STAR structure from an interviewer’s side.'),
} satisfies Record<string, Video>;
