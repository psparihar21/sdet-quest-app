import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm13')!;

export const m13: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm13-l1',
        title: 'Security testing an SDET can own',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'AuthN, AuthZ, sessions and the OWASP Top 10',
            body: `You're not a penetration tester — but you can automate the security checks that catch most real-world bugs, and talk about risk credibly. **Only test systems you are authorised to test.**

**Authentication:** login, lockout after N failures, password rules, MFA, password reset tokens (single use, expiring), no user enumeration ("invalid credentials" for both bad user and bad password).

**Authorization (the #1 OWASP risk: Broken Access Control):** build a **role × endpoint matrix** and automate it: every role against every endpoint, expected 200/403. Include **IDOR** checks — employee A requesting /leave/{B's id} must get 403/404.

**Session management:** cookies HttpOnly, Secure, SameSite; session invalidated on logout and password change; idle and absolute timeouts; new session id after login (no fixation).

**OWASP Top 10 (2021) in one line each:**
1. Broken access control — authorization matrix, IDOR
2. Cryptographic failures — HTTPS everywhere, no sensitive data in URLs/logs
3. Injection (SQL, command, …) — parameterised queries; test with quotes and payloads
4. Insecure design — threat modelling in refinement
5. Security misconfiguration — default creds, verbose errors, open admin panels, headers
6. Vulnerable components — dependency scanning (npm audit, OWASP Dependency-Check, Dependabot)
7. Identification & authentication failures — see above
8. Software & data integrity failures — signed artefacts, safe CI pipelines
9. Logging & monitoring failures — security events logged and alerted
10. SSRF — server fetching attacker-supplied URLs

**XSS:** user input rendered as HTML/JS. Test fields like leave reason with \`<img src=x onerror=alert(1)>\` and check it renders as text. Defences: output encoding, CSP. **CSRF:** a malicious site triggers a state-changing request with the victim's cookies. Defences: SameSite cookies, CSRF tokens; test that state-changing requests without the token fail.

**Sensitive data exposure & secrets:** PII masked in logs, API responses return only needed fields, no secrets in the front-end bundle or repo (secret scanning in CI).`,
          },
          { kind: 'video', title: 'Watch: OWASP Top 10 overview', video: VIDEOS.owasp },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m13-q1', 'm13-q2', 'm13-q3', 'm13-q4', 'm13-q5'] },
          { kind: 'practice', title: 'Generate an authorization test matrix', problemId: 'js-authz-matrix' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m13-security' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm13-q1', skill: 'security', moduleId: 'm13', type: 'mcq', difficulty: 2,
      prompt: 'Employee A calls GET /api/payslips/9812, which belongs to employee B, and gets B\'s payslip. This is…',
      options: opts('XSS', 'IDOR / broken access control', 'CSRF', 'Rate limiting'),
      answer: ['b'],
      explanation: 'Insecure Direct Object Reference: the server checks authentication but not ownership.',
    },
    {
      id: 'm13-q2', skill: 'security', moduleId: 'm13', type: 'mcq', difficulty: 2,
      prompt: 'Best defence against SQL injection?',
      options: opts('Escaping quotes manually', 'Parameterised queries / prepared statements', 'Hiding error messages', 'A WAF only'),
      answer: ['b'],
      explanation: 'Parameters are never parsed as SQL. Error hiding and WAFs are extra layers, not the fix.',
    },
    {
      id: 'm13-q3', skill: 'security', moduleId: 'm13', type: 'mcq', difficulty: 2,
      prompt: 'A leave "reason" containing <img src=x onerror=alert(1)> shows an alert to the manager. Category?',
      options: opts('Stored XSS', 'CSRF', 'SQL injection', 'Clickjacking'),
      answer: ['a'],
      explanation: 'The payload is stored and later rendered as HTML in another user\'s browser.',
    },
    {
      id: 'm13-q4', skill: 'security', moduleId: 'm13', type: 'multi', difficulty: 2,
      prompt: 'Good session cookie attributes:',
      options: opts('HttpOnly', 'Secure', 'SameSite=Lax or Strict', 'Expires in 10 years', 'Session id included in URLs'),
      answer: ['a', 'b', 'c'],
      explanation: 'Long-lived sessions and ids in URLs increase theft risk.',
    },
    {
      id: 'm13-q5', skill: 'security', moduleId: 'm13', type: 'mcq', difficulty: 1,
      prompt: 'The login page says "user not found" for unknown emails and "wrong password" otherwise. Risk?',
      options: opts('None', 'User enumeration — attackers learn which emails have accounts', 'XSS', 'Denial of service'),
      answer: ['b'],
      explanation: 'Use one generic message for both cases.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-authz-matrix', title: 'Authorization test matrix', skill: 'security', moduleId: 'm13', difficulty: 2,
      statement: 'Given `roles` (e.g. ["EMPLOYEE","MANAGER","HR_ADMIN"]) and `endpoints` as `{ name, allowed: string[] }`, return every test case `{ role, endpoint, expected }` where expected is 200 if the role is allowed, else 403. Order: endpoints in input order, roles in input order within each endpoint. Also include an unauthenticated case per endpoint with role "ANONYMOUS" and expected 401, placed **first** for that endpoint.',
      examples: [{ input: 'matrix(["EMP"], [{ name: "GET /leave", allowed: ["EMP"] }])', output: '[{role:"ANONYMOUS",endpoint:"GET /leave",expected:401},{role:"EMP",endpoint:"GET /leave",expected:200}]' }],
      constraints: ['This is the data a data-driven auth test iterates over'],
      functionName: 'matrix',
      starter: 'function matrix(roles: string[], endpoints: { name: string; allowed: string[] }[]) {\n  return [] as { role: string; endpoint: string; expected: number }[];\n}',
      tests: [
        { args: [['EMP'], [{ name: 'GET /leave', allowed: ['EMP'] }]], expected: [{ role: 'ANONYMOUS', endpoint: 'GET /leave', expected: 401 }, { role: 'EMP', endpoint: 'GET /leave', expected: 200 }] },
        {
          args: [['EMPLOYEE', 'MANAGER'], [{ name: 'POST /approve', allowed: ['MANAGER'] }]],
          expected: [{ role: 'ANONYMOUS', endpoint: 'POST /approve', expected: 401 }, { role: 'EMPLOYEE', endpoint: 'POST /approve', expected: 403 }, { role: 'MANAGER', endpoint: 'POST /approve', expected: 200 }],
        },
        { args: [['A'], []], expected: [] },
      ],
      hints: ['Nested loops: for each endpoint, push the anonymous case, then one case per role.'],
      solution: {
        code: `function matrix(roles: string[], endpoints: { name: string; allowed: string[] }[]) {
  const out: { role: string; endpoint: string; expected: number }[] = [];
  for (const e of endpoints) {
    out.push({ role: 'ANONYMOUS', endpoint: e.name, expected: 401 });
    for (const role of roles) out.push({ role, endpoint: e.name, expected: e.allowed.includes(role) ? 200 : 403 });
  }
  return out;
}`,
        explanation: 'Generating the matrix from one source of truth (the permission table) means a new endpoint or role is covered automatically — the cheapest high-value security automation there is.',
        time: 'O(endpoints × roles)', space: 'same',
      },
      followUps: ['How would you add IDOR checks (own resource vs someone else\'s) to this matrix?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m13-security', modes: ['api-sql', 'qa-lead', 'full-sdet3'], skill: 'security', level: 'L4', kind: 'technical',
      prompt: 'You are not a security engineer. What security testing would you still own as an SDET for an HR application?',
      rubric: [
        { id: 'authz', point: 'Authorization matrix / role checks / IDOR', any: ['authorization', 'role', 'idor', 'access control', 'matrix', '403'] },
        { id: 'authn', point: 'Authentication and session tests', any: ['authentication', 'session', 'lockout', 'logout', 'token', 'expired'] },
        { id: 'inject', point: 'Injection and XSS input tests', any: ['injection', 'xss', 'sql injection', 'payload', 'sanitiz'] },
        { id: 'data', point: 'Sensitive data/PII and secrets', any: ['pii', 'sensitive', 'mask', 'secret', 'salary', 'logs'] },
        { id: 'tools', point: 'Automated scanning in CI (dependencies, SAST/DAST, ZAP)', any: ['dependency', 'scan', 'zap', 'sast', 'dast', 'dependabot', 'snyk'] },
        { id: 'collab', point: 'Collaboration with security team; authorised scope', any: ['security team', 'pen test', 'penetration', 'authorised', 'authorized', 'escalate'] },
      ],
      structure: 'Scope and boundaries → what you automate → what you check manually → tooling in CI → when you escalate.',
      modelAnswer: '"HR data is sensitive — salaries, IDs, health-related leave — so access control is my top priority. I automate a role × endpoint matrix and IDOR checks so an employee can never read another\'s payslip. I cover authentication and sessions: expired and tampered tokens, logout invalidation, lockout, generic error messages. Input fields get XSS and injection payload tests, and I check PII is masked in logs and API responses only return what the UI needs. In CI we run dependency and secret scanning and a baseline OWASP ZAP scan against staging. Anything deeper — threat modelling, pen tests — I do with the security team, and I only test environments we\'re authorised to test."',
      followUp: 'A developer says "the UI hides the button for employees, so the endpoint is safe." Respond.',
      revision: ['m13', 'm09'],
    },
  ],
  flashcards: [
    { id: 'fc-m13-1', skill: 'security', moduleId: 'm13', front: 'IDOR', back: 'Accessing another user\'s object by changing an id; server checks auth but not ownership.' },
    { id: 'fc-m13-2', skill: 'security', moduleId: 'm13', front: 'XSS vs CSRF', back: 'XSS: attacker script runs in victim\'s page. CSRF: attacker site makes victim\'s browser send a state-changing request.' },
    { id: 'fc-m13-3', skill: 'security', moduleId: 'm13', front: '#1 OWASP Top 10 (2021)', back: 'Broken access control.' },
  ],
};
