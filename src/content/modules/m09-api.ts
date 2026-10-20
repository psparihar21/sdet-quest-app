import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm09')!;

export const m09: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm09-l1',
        title: 'HTTP from the wire up',
        minutes: 30,
        sections: [
          { kind: 'visual', title: 'The life of a request', vizId: 'http-lifecycle', caption: 'DNS, TLS, gateway, service, database — and where each status code comes from.' },
          {
            kind: 'learn',
            title: 'Methods, status codes, headers',
            body: `| Method | Purpose | Safe | Idempotent |
|---|---|---|---|
| GET | Read | ✓ | ✓ |
| POST | Create / trigger | ✗ | ✗ (unless you add an idempotency key) |
| PUT | Replace whole resource | ✗ | ✓ |
| PATCH | Partial update | ✗ | not guaranteed |
| DELETE | Remove | ✗ | ✓ (second call → 404 or 204, same state) |

**Idempotent** = repeating the call leaves the server in the same state. It matters because clients and gateways **retry**: a retried non-idempotent POST can create two leave requests. Payment-style APIs accept an **Idempotency-Key** header to make POST safe to retry.

| Code | Meaning | Typical cause |
|---|---|---|
| 200 OK | Success with body | GET, PUT |
| **201 Created** | Resource created (often a Location header) | POST |
| 204 No Content | Success, no body | DELETE |
| 400 Bad Request | Malformed / invalid input | Missing field, bad JSON |
| **401 Unauthorized** | Not authenticated — *who are you?* | Missing/expired/invalid token |
| **403 Forbidden** | Authenticated but not allowed — *I know you, but no* | Employee calling a manager endpoint |
| 404 Not Found | No such resource (also used to hide existence) | Wrong id |
| 409 Conflict | State conflict | Overlapping leave, version mismatch |
| 422 Unprocessable | Valid JSON, failed business validation | days > balance |
| 429 Too Many Requests | Rate limited (Retry-After header) | Load, abuse |
| 500 / 502 / 503 / 504 | Server error / bad gateway / unavailable / gateway timeout | Bugs, dependency down |

**HTTPS** = HTTP over TLS: encryption, integrity and server identity via certificates. Test that HTTP redirects to HTTPS, certificates are valid, and nothing (cookies, tokens) travels over plain HTTP.

**Cookies:** Set-Cookie from the server, Cookie header back from the client. Session APIs depend on them — check HttpOnly/Secure/SameSite flags, expiry, and that logout clears them. API tools keep a cookie jar per client (REST Assured filters, Playwright request contexts).

**Headers you test:** Content-Type, Accept, Authorization, Cache-Control, Location, Retry-After, correlation/trace IDs, security headers (Strict-Transport-Security, Content-Security-Policy).

**REST vs SOAP:** REST is resource-oriented over HTTP verbs, usually JSON, contract by convention or OpenAPI. SOAP is an XML envelope protocol with a strict WSDL contract and built-in standards (WS-Security) — still common in payroll and banking integrations.`,
          },
          { kind: 'video', title: 'Watch: status codes in 5 minutes', video: VIDEOS.httpStatus },
          {
            kind: 'learn',
            title: 'Error handling: testing the unhappy paths',
            body: `Most API bugs live in **error handling**, not the happy path. For every endpoint, test that bad input gets the **right status**, a **consistent error body**, and **no side effects**.

| Situation | Expected |
|---|---|
| Malformed JSON / wrong type | 400 with field-level messages |
| Missing / invalid token | 401 (with \`WWW-Authenticate\`) |
| Valid user, not allowed | 403 — and no data leakage in the message |
| Unknown id | 404 (or 404 instead of 403 to hide existence) |
| Business rule broken (end before start, overlapping leave) | 409 or 422 |
| Too many requests | 429 with \`Retry-After\` |
| Dependency down | 502/503/504 — never a hanging request |

A consistent error contract (e.g. **RFC 9457 problem+json**):

~~~json
{ "type": "https://leaveflow.example/errors/overlap", "title": "Leave overlaps an existing request",
  "status": 409, "detail": "Request 812 already covers 2026-03-02", "instance": "/leaves" }
~~~

Check also: no stack traces, SQL or internal hostnames in error bodies (security); the record was **not** created after a 4xx (query it back); idempotent retries don't double-create; timeouts and 5xx from dependencies are mapped cleanly (mock them with WireMock or Playwright \`route\`). On the client side, test that the UI shows a useful message and keeps the user's input.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m09-q1', 'm09-q2', 'm09-q3', 'm09-q4', 'm09-q10'] },
        ],
      },
      {
        id: 'm09-l2',
        title: 'Auth, JWT, schemas, pagination and rate limits',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Authentication and authorization',
            body: `**Authentication** proves identity; **authorization** decides what that identity may do. Test them separately.

**OAuth 2.0** is a delegation framework: a client gets an **access token** from an authorization server (flows: authorization code + PKCE for apps with users, client credentials for service-to-service) and sends it as \`Authorization: Bearer <token>\`. **OpenID Connect** adds an ID token for login.

**JWT** = header.payload.signature, each base64url-encoded. The payload is **readable by anyone** — it's signed, not encrypted. Claims: sub, roles, exp (expiry, seconds since epoch), iat, iss, aud.

**JWT tests every SDET should know:**
- expired token → 401
- tampered payload (role changed to ADMIN) with the old signature → 401
- \`alg: none\` or wrong algorithm → 401
- valid token, wrong role → 403
- valid token, another user's resource id → 403/404 (IDOR)

**JSON Schema** validates shape: required fields, types, enums, formats. In REST Assured: \`body(matchesJsonSchemaInClasspath("leave.json"))\`. Schema checks catch breaking changes cheaply; value checks catch logic bugs — you need both.

**Serialization/deserialization:** map JSON ↔ objects (Jackson/Gson in Java, plain objects in TS). Test unknown fields, nulls, number precision (0.5 days), dates and time zones.

**Pagination:** offset/limit (simple, can skip/duplicate rows when data changes) vs cursor (stable). Test first/last page, empty page, page size limits, total counts, sorting stability.

**Rate limiting:** expect 429 with Retry-After after N calls; verify the limit resets; make sure your *own* test suite doesn't trip it.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m09-q5', 'm09-q6', 'm09-q7'] },
          { kind: 'practice', title: 'Decode a JWT and check expiry', problemId: 'js-jwt-expired' },
          { kind: 'practice', title: 'Collect all pages', problemId: 'js-paginate' },
        ],
      },
      {
        id: 'm09-l3',
        title: 'Tools and a production-grade API framework',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Postman, REST Assured and Playwright request',
            body: `| Tool | Best for |
|---|---|
| Postman / Newman | Exploration, collections, quick smoke in CI via Newman |
| REST Assured (Java) | Java teams; fluent given/when/then; Hamcrest matchers; schema validation |
| Playwright request (TS) | Same repo as UI tests; shares auth with browser contexts |

~~~java
given().spec(employeeSpec)                    // base URI, auth, content type, logging
    .body(new LeaveRequest("CASUAL", "2026-11-02", 1))
.when().post("/leave")
.then().statusCode(201)
    .body("status", equalTo("PENDING"))
    .body(matchesJsonSchemaInClasspath("schemas/leave.json"))
    .time(lessThan(800L));
~~~

**Framework layers:**
- **Config:** base URLs per environment, timeouts.
- **Auth:** token provider per role, cached until near expiry.
- **Clients:** one class per resource (LeaveClient.create(req)) returning typed responses — tests never build raw requests.
- **Builders/factories:** valid default payloads with overridable fields (\`aLeave().days(0.5).build()\`).
- **Assertions:** schema + business checks; custom matchers for common contracts (error format).
- **Logging:** request/response on failure only, with secrets masked.
- **Data:** create via API, delete in teardown; unique identifiers.

**Contract testing** (consumer-driven, e.g. Pact): the consumer records the requests it makes and the responses it relies on; the provider verifies it still satisfies them in CI. It catches breaking API changes *before* deployment without a full integration environment.`,
          },
          { kind: 'video', title: 'Watch: REST Assured basics', video: VIDEOS.restAssured },
          { kind: 'video', title: 'Watch: how Pact contract testing works', video: VIDEOS.contractTesting },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m09-q8', 'm09-q9'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m09-api-plan' },
          { kind: 'interview', title: 'Interview drill: PUT vs PATCH', interviewId: 'iv-m09-idempotency' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm09-q10', skill: 'api', moduleId: 'm09', type: 'multi', difficulty: 2,
      prompt: 'POST /leaves with an end date before the start date. What should your test assert?',
      options: opts('A 4xx status such as 400 or 422', 'An error body that names the invalid field', 'No leave record was created', 'A 500 with the stack trace for debugging', 'A 200 so the client does not crash'),
      answer: ['a', 'b', 'c'],
      explanation: 'Good error handling means the right 4xx, a useful and safe message, and no side effects. Stack traces in responses are an information leak.',
    },
    {
      id: 'm09-q1', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 1,
      prompt: 'POST /leave successfully creates a leave request. The most precise status code is…',
      options: opts('200 OK', '201 Created', '202 Accepted', '204 No Content'),
      answer: ['b'],
      explanation: '201 signals a new resource, usually with a Location header. 202 means accepted for async processing.',
      misconceptions: { a: '200 is a generic success; for creation, 201 is the precise answer interviewers look for.' },
    },
    {
      id: 'm09-q2', skill: 'api', moduleId: 'm09', type: 'multi', difficulty: 2,
      prompt: 'Which pairings are correct?',
      options: opts('No token → 401', 'Expired token → 401', 'Valid employee token calling a manager-only endpoint → 403', 'Valid token, wrong role → 401', 'Malformed JSON body → 400'),
      answer: ['a', 'b', 'c', 'e'],
      explanation: '401 = not authenticated ("who are you?"). 403 = authenticated but not allowed ("I know you, but no").',
      misconceptions: { d: 'The identity is known, so this is authorization — 403.' },
    },
    {
      id: 'm09-q3', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 2,
      prompt: 'Which method is idempotent?',
      options: opts('POST /leave', 'PUT /leave/42 with the full resource', 'POST /leave/42/approve without an idempotency key', 'None'),
      answer: ['b'],
      explanation: 'Replacing a resource with the same representation twice leaves the same state.',
    },
    {
      id: 'm09-q4', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 2,
      prompt: 'An employee applies for leave overlapping an existing approved request. Best status code?',
      options: opts('200', '404', '409 Conflict (or 422 with a clear error code)', '500'),
      answer: ['c'],
      explanation: 'It\'s a valid request that conflicts with current state. Whatever the team picks, test that it\'s consistent and the error body is useful.',
    },
    {
      id: 'm09-q5', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 2,
      prompt: 'Is the payload of a JWT secret?',
      options: opts('Yes, it is encrypted', 'No — it is base64url-encoded and signed; anyone can read it, nobody can change it undetected', 'Only the exp claim is secret', 'Depends on the browser'),
      answer: ['b'],
      explanation: 'Never put secrets in a JWT payload. Tests should verify tampering is rejected.',
    },
    {
      id: 'm09-q6', skill: 'api', moduleId: 'm09', type: 'multi', difficulty: 3,
      prompt: 'Good negative tests for a JWT-protected endpoint:',
      options: opts('Expired token', 'Payload role changed to ADMIN without re-signing', 'Token signed with "alg": "none"', 'Another user\'s resource id with a valid token', 'Same request twice with a valid token'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'The last one is an idempotency test, not a security negative.',
    },
    {
      id: 'm09-q7', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 2,
      prompt: 'Offset pagination (page=2&size=20) while new rows are inserted can…',
      options: opts('Never cause problems', 'Skip or duplicate rows between pages', 'Return 500', 'Ignore the size parameter'),
      answer: ['b'],
      explanation: 'Inserted rows shift offsets. Cursor pagination avoids it — and it\'s a good test to design.',
    },
    {
      id: 'm09-q8', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 3,
      prompt: 'What does consumer-driven contract testing catch that provider unit tests don\'t?',
      options: opts('Performance regressions', 'A provider change that breaks what a specific consumer relies on, before deployment', 'UI layout bugs', 'Database deadlocks'),
      answer: ['b'],
      explanation: 'The consumer\'s expectations become executable checks in the provider\'s pipeline.',
    },
    {
      id: 'm09-q9', skill: 'api', moduleId: 'm09', type: 'mcq', difficulty: 2,
      prompt: 'Tests in your suite build raw JSON strings and URLs everywhere. Best refactor?',
      options: opts('Copy-paste is fine for tests', 'Typed clients per resource plus payload builders with sensible defaults', 'Move everything to Postman', 'Store JSON in Excel'),
      answer: ['b'],
      explanation: 'Clients and builders centralise change: a renamed field is fixed once.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-jwt-expired', title: 'Is this JWT expired?', skill: 'api', moduleId: 'm09', difficulty: 2,
      statement: 'Write `jwtStatus(token, nowSec)` that decodes a JWT payload **without verifying the signature** (test-helper use only) and returns `"malformed"` if it does not have 3 dot-separated parts or the payload is not JSON, `"no-exp"` if there is no numeric `exp`, `"expired"` if `exp <= nowSec`, otherwise `"valid"`. The payload is base64url (`-` and `_` instead of `+` and `/`, padding removed).',
      examples: [{ input: 'jwtStatus(header + "." + b64url(\'{"sub":"7","exp":2000}\') + ".sig", 1000)', output: '"valid"' }],
      constraints: ['Use atob for base64 decoding', 'Never trust an unverified token in production code'],
      functionName: 'jwtStatus',
      starter: `function jwtStatus(token: string, nowSec: number): string {
  return 'todo';
}`,
      tests: [
        { args: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoyMDAwfQ.sig', 1000], expected: 'valid' },
        { args: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoyMDAwfQ.sig', 2000], expected: 'expired' },
        { args: ['not-a-token', 1], expected: 'malformed' },
        { args: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3In0.sig', 1], expected: 'no-exp' },
        { args: ['a.b@d.c', 1], expected: 'malformed', hidden: true },
        { args: ['eyJhbGciOiJIUzI1NiJ9.eyJyIjoiPz8_In0.sig', 5], expected: 'no-exp', hidden: true, note: 'payload uses base64url characters' },
      ],
      hints: ['token.split(".") must give exactly 3 parts.', 'Convert base64url to base64: replace - with + and _ with /, then pad with = to a multiple of 4.', 'Wrap atob + JSON.parse in try/catch.'],
      solution: {
        code: `function jwtStatus(token: string, nowSec: number): string {
  const parts = token.split('.');
  if (parts.length !== 3) return 'malformed';
  let payload: { exp?: unknown };
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    payload = JSON.parse(atob(b64));
  } catch {
    return 'malformed';
  }
  if (typeof payload.exp !== 'number') return 'no-exp';
  return payload.exp <= nowSec ? 'expired' : 'valid';
}`,
        explanation: 'Decoding shows why JWT payloads are not secret. Real services must verify the signature, algorithm, issuer and audience before trusting any claim.',
        time: 'O(n) in token length', space: 'O(n)',
      },
      followUps: ['Which claims besides exp would you assert in an auth test?', 'How do you get an expired token for a test without waiting an hour?'],
    },
    {
      kind: 'js', id: 'js-paginate', title: 'Collect all pages', skill: 'api', moduleId: 'm09', difficulty: 2,
      statement: '`pages` simulates a cursor-paginated API: `pages[cursor]` is `{ items: string[], next: string | null }` and the first cursor is `"start"`. Write `collectAll(pages)` returning all items in order. Stop when `next` is null, and **throw an Error** if a cursor repeats (an infinite pagination loop bug) or is missing.',
      examples: [{ input: 'collectAll({ start: { items: ["a"], next: "p2" }, p2: { items: ["b"], next: null } })', output: '["a", "b"]' }],
      constraints: ['Do not loop forever on a buggy API'],
      functionName: 'collectAll',
      starter: 'function collectAll(pages: Record<string, { items: string[]; next: string | null }>): string[] {\n  return [];\n}',
      tests: [
        { args: [{ start: { items: ['a'], next: 'p2' }, p2: { items: ['b'], next: null } }], expected: ['a', 'b'] },
        { args: [{ start: { items: [], next: null } }], expected: [] },
        { args: [{ start: { items: ['x', 'y'], next: 'c' }, c: { items: ['z'], next: 'd' }, d: { items: [], next: null } }], expected: ['x', 'y', 'z'], hidden: true },
      ],
      hints: ['Keep a Set of cursors you have visited.', 'A missing cursor key is also a bug worth reporting.'],
      solution: {
        code: `function collectAll(pages: Record<string, { items: string[]; next: string | null }>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let cursor: string | null = 'start';
  while (cursor !== null) {
    if (seen.has(cursor)) throw new Error('Pagination loop at cursor ' + cursor);
    const page = pages[cursor];
    if (!page) throw new Error('Missing page for cursor ' + cursor);
    seen.add(cursor);
    out.push(...page.items);
    cursor = page.next;
  }
  return out;
}`,
        explanation: 'A test helper that walks pages must defend against the API\'s bugs — otherwise your test hangs instead of failing with a clear message.',
        time: 'O(total items)', space: 'O(pages)',
      },
      followUps: ['How would you assert there are no duplicate items across pages?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m09-api-plan', modes: ['api-sql', 'full-sdet3'], skill: 'api', level: 'L3', kind: 'technical',
      prompt: 'How would you test a new POST /leave-requests endpoint? Give me categories and specific cases.',
      rubric: [
        { id: 'happy', point: 'Positive: 201, body, Location, persisted state', any: ['201', 'happy path', 'positive', 'created'] },
        { id: 'valid', point: 'Validation/negative: missing fields, bad types, boundaries', any: ['validation', 'missing field', 'negative', 'boundary', 'invalid', '400', '422'] },
        { id: 'auth', point: 'AuthN/AuthZ: 401, 403, other user\'s data', any: ['401', '403', 'auth', 'role', 'token'] },
        { id: 'business', point: 'Business rules: balance, overlap, holidays, half-days', any: ['balance', 'overlap', 'holiday', 'half day', 'business rule', '409'] },
        { id: 'contract', point: 'Schema/contract checks', any: ['schema', 'contract', 'json schema'] },
        { id: 'nfr', point: 'Idempotency/concurrency/performance/security', any: ['idempoten', 'concurren', 'duplicate', 'performance', 'response time', 'injection', 'rate limit'] },
        { id: 'side', point: 'Side effects: DB, events, notifications, audit', any: ['database', 'db', 'event', 'kafka', 'notification', 'audit'] },
      ],
      structure: 'Clarify the contract → positive → validation → auth → business rules → contract/schema → non-functional → side effects.',
      modelAnswer: '"I\'d start from the OpenAPI spec and acceptance criteria. Positive: 201 with the new id and Location, response matches the schema, row persisted as PENDING, event published for the manager notification. Validation: missing type, from after to, 0 days, 0.5 boundary, unknown leave type → 400/422 with a consistent error format. Auth: no token 401, expired 401, another employee\'s id in the path 403. Business rules: more days than balance, overlap with approved leave (409), weekends and holidays excluded from day count. Non-functional: duplicate submit with the same idempotency key creates one request, two concurrent requests can\'t overdraw the balance, P95 under the agreed budget. Most of this is fast API automation; only the happy path also gets a UI test."',
      followUp: 'Which three of these would you put in the PR smoke suite, and why?',
      revision: ['m09', 'm04'],
    },
    {
      id: 'iv-m09-idempotency', modes: ['api-sql', 'full-sdet3'], skill: 'api', level: 'L3', kind: 'technical',
      prompt: 'What is the difference between PUT and PATCH, and what does idempotency mean for testing?',
      rubric: [
        { id: 'put', point: 'PUT replaces the whole resource', any: ['replace', 'whole resource', 'entire', 'full'] },
        { id: 'patch', point: 'PATCH partially updates', any: ['partial', 'some fields', 'only the fields'] },
        { id: 'idem', point: 'Idempotent = same effect when repeated', any: ['same effect', 'same state', 'repeat', 'multiple times', 'twice'] },
        { id: 'which', point: 'PUT/DELETE/GET idempotent; POST not', any: ['post is not', 'post isn', 'get', 'delete'] },
        { id: 'test', point: 'How to test: send twice, compare state; retries; idempotency keys', any: ['send twice', 'call twice', 'retry', 'idempotency key', 'duplicate'] },
      ],
      structure: 'Definitions → which verbs → why it matters (retries) → concrete test.',
      modelAnswer: '"PUT replaces the entire resource with what you send; PATCH changes only the fields you send. Idempotent means sending the same request again leaves the server in the same state — GET, PUT and DELETE should be; POST usually isn\'t. It matters because clients, gateways and message consumers retry. To test it, I send the identical request twice and assert the second response is consistent and the database has one record and an unchanged state. For POST with an Idempotency-Key header, the retry must return the original result instead of creating a duplicate leave request."',
      followUp: 'Is DELETE still idempotent if the second call returns 404?',
      revision: ['m09'],
    },
  ],
  flashcards: [
    { id: 'fc-m09-1', skill: 'api', moduleId: 'm09', front: '401 vs 403', back: '401: not authenticated ("who are you?"). 403: authenticated but not allowed.' },
    { id: 'fc-m09-2', skill: 'api', moduleId: 'm09', front: 'Correct code for successful creation', back: '201 Created (with Location header).' },
    { id: 'fc-m09-3', skill: 'api', moduleId: 'm09', front: 'Idempotent methods', back: 'GET, PUT, DELETE (and HEAD/OPTIONS). POST is not, unless an idempotency key is used.' },
    { id: 'fc-m09-4', skill: 'api', moduleId: 'm09', front: 'Is a JWT payload secret?', back: 'No — base64url-encoded and signed, not encrypted.' },
    { id: 'fc-m09-5', skill: 'api', moduleId: 'm09', front: 'Contract testing in one line', back: 'Consumer expectations are verified against the provider in CI before deployment.' },
  ],
};
