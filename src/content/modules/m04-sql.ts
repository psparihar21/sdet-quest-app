import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm04')!;

export const m04: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm04-l1',
        title: 'Querying for validation: filters, joins, aggregation',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'Why SDETs write SQL',
            body: `UI and API tests tell you what the system *shows*; the database tells you what it *stored*. SDETs use SQL to **set up data, verify state after an action, and investigate bugs**.

The practice database here is a small HRMS: \`employees\`, \`departments\`, \`leave_requests\`, \`leave_balances\`, \`attendance\`. Every query runs in a real SQLite engine **in your browser**, on a fresh copy each time.

**Logical order of a SELECT** (not the order you write it):
FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

That is why you can't use a SELECT alias in WHERE, and why aggregate filters go in HAVING.

**Aggregations:** COUNT(*) (rows), COUNT(col) (non-NULL values), COUNT(DISTINCT col), SUM, AVG, MIN, MAX — combined with GROUP BY to get one row per group. Every non-aggregated column in the SELECT must appear in GROUP BY.

| Join | Keeps |
|---|---|
| INNER | Only rows that match on both sides |
| LEFT | Every left row; NULLs where the right side has no match |
| RIGHT | Every right row (SQLite ≥ 3.39 supports it; often rewritten as LEFT) |
| FULL OUTER | Everything from both sides |
| SELF | A table joined to itself (employee → manager) |

**The validation workhorse:** LEFT JOIN … WHERE right.id IS NULL finds *missing* related rows — employees with no department, approved leave with no balance deduction.`,
          },
          { kind: 'visual', title: 'Joins visualised', vizId: 'sql-joins', caption: 'Pick a join type and see which rows of employees × departments survive.' },
          { kind: 'video', title: 'Watch: joins animated', video: VIDEOS.sqlJoins },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m04-q1', 'm04-q2', 'm04-q3'] },
          { kind: 'practice', title: 'Employees without a department', problemId: 'sql-no-department' },
          { kind: 'practice', title: 'Approved leave days per department', problemId: 'sql-leave-by-dept' },
          { kind: 'practice', title: 'Employee and manager (self join)', problemId: 'sql-self-join' },
        ],
      },
      {
        id: 'm04-l2',
        title: 'Subqueries, CTEs and window functions',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'Readable multi-step queries',
            body: `**Subquery** — a query inside another: \`WHERE salary > (SELECT AVG(salary) FROM employees)\`.

**CTE** (\`WITH name AS (...)\`) — names an intermediate result. Easier to read, review and debug than nested subqueries; recursive CTEs walk hierarchies (org charts).

**Window functions** compute across related rows *without collapsing them* (unlike GROUP BY):

~~~sql
SELECT name, department_id, salary,
       RANK()       OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dense,
       ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
FROM employees;
~~~

| Salaries | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 120k | 1 | 1 | 1 |
| 120k | 2 | 1 | 1 |
| 95k  | 3 | 3 | 2 |

Classic interview question: **second-highest salary** per department → DENSE_RANK = 2.`,
          },
          { kind: 'video', title: 'Watch: window functions', video: VIDEOS.sqlWindow },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m04-q4', 'm04-q5'] },
          { kind: 'practice', title: 'Highest paid per department', problemId: 'sql-top-paid' },
          { kind: 'practice', title: 'Balance consistency check', problemId: 'sql-balance-check' },
          { kind: 'practice', title: 'Duplicate attendance rows', problemId: 'sql-duplicate-attendance' },
        ],
      },
      {
        id: 'm04-l3',
        title: 'Indexes, transactions, ACID and isolation',
        minutes: 25,
        sections: [
          {
            kind: 'learn',
            title: 'What breaks under load and concurrency',
            body: `**Indexes** speed up reads on filtered/joined columns (B-tree: O(log n) lookup instead of a full scan) but slow writes and use space. Test-relevant: a missing index shows up as a performance bug only at production data volumes.

**Transactions** group statements into one unit. **ACID**:
- **Atomicity** — all or nothing (approve leave *and* deduct balance, or neither).
- **Consistency** — constraints hold before and after.
- **Isolation** — concurrent transactions don't see each other's half-done work.
- **Durability** — committed data survives crashes.

**Isolation levels and the anomalies they allow:**

| Level | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| Read uncommitted | possible | possible | possible |
| Read committed (Postgres default) | — | possible | possible |
| Repeatable read (MySQL InnoDB default) | — | — | possible* |
| Serializable | — | — | — |

*Engine-specific. **Testing angle:** two leave requests submitted at the same instant can both pass a "balance ≥ days" check (a lost update). Tests for this fire concurrent requests and then assert the DB invariant (balance never negative). Fixes: row locks (SELECT … FOR UPDATE), optimistic versioning, or a constraint.

**Test data hygiene:** create what you need per test, isolate by unique IDs, clean up via transactions rolled back after the test or by deleting what the test created — never depend on shared mutable rows.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m04-q6', 'm04-q7'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m04-validate' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm04-q1', skill: 'sql', moduleId: 'm04', type: 'mcq', difficulty: 1,
      prompt: 'You need every employee, plus their department name **if they have one**. Which join?',
      options: opts('INNER JOIN', 'LEFT JOIN from employees', 'CROSS JOIN', 'RIGHT JOIN from employees'),
      answer: ['b'],
      explanation: 'LEFT JOIN keeps every row from the left table (employees) and fills NULL where no department matches.',
      misconceptions: { a: 'INNER JOIN silently drops employees with no department — exactly the rows a validation query often needs.' },
    },
    {
      id: 'm04-q2', skill: 'sql', moduleId: 'm04', type: 'mcq', difficulty: 2,
      prompt: 'Which clause filters **after** aggregation, e.g. departments with more than 3 employees?',
      options: opts('WHERE', 'HAVING', 'ORDER BY', 'ON'),
      answer: ['b'],
      explanation: 'WHERE filters rows before GROUP BY; HAVING filters groups after aggregation.',
    },
    {
      id: 'm04-q3', skill: 'sql', moduleId: 'm04', type: 'debug', difficulty: 2, codeLang: 'sql',
      prompt: 'This query should list employees whose department has no manager, but returns nothing. Why?',
      code: `SELECT e.name
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE d.manager_id = NULL;`,
      options: opts('JOIN must be LEFT JOIN', '= NULL is never true; use IS NULL', 'manager_id is not a column', 'Missing GROUP BY'),
      answer: ['b'],
      explanation: 'Any comparison with NULL yields UNKNOWN, so = NULL never matches. Use IS NULL.',
    },
    {
      id: 'm04-q4', skill: 'sql', moduleId: 'm04', type: 'mcq', difficulty: 2,
      prompt: 'Salaries 200, 150, 150, 100. What does DENSE_RANK() give the 100?',
      options: opts('4', '3', '2', '1'),
      answer: ['b'],
      explanation: 'DENSE_RANK leaves no gaps: 200→1, 150→2, 150→2, 100→3. RANK would give 4.',
    },
    {
      id: 'm04-q5', skill: 'sql', moduleId: 'm04', type: 'mcq', difficulty: 2,
      prompt: 'Main difference between GROUP BY and a window function with PARTITION BY?',
      options: opts('No difference', 'GROUP BY collapses rows into one per group; a window function keeps every row', 'Window functions only work on numbers', 'PARTITION BY sorts the result'),
      answer: ['b'],
      explanation: 'Window functions add a computed column per row (rank, running total, group average) without reducing the row count.',
    },
    {
      id: 'm04-q6', skill: 'sql', moduleId: 'm04', type: 'scenario', difficulty: 3,
      prompt: 'Two leave requests for the same employee arrive in the same millisecond; both pass the "balance ≥ days" check and the balance goes negative. Which ACID property/isolation problem is this, and what is the test?',
      options: opts(
        'Durability — test by restarting the DB',
        'A race (lost update) under insufficient isolation — fire concurrent requests and assert balance ≥ 0 afterwards',
        'Atomicity — test by sending one request',
        'Not a DB issue — add a UI double-click guard only',
      ),
      answer: ['b'],
      explanation: 'Check-then-act without locking lets both transactions read the old balance. Reproduce with concurrent API calls, then assert the invariant in the DB. A UI guard alone doesn\'t stop API clients.',
    },
    {
      id: 'm04-q7', skill: 'sql', moduleId: 'm04', type: 'multi', difficulty: 2,
      prompt: 'Which are good test-data practices for DB-touching automated tests?',
      options: opts('Each test creates its own data with unique identifiers', 'All tests share one "test user" row and update it', 'Clean up what the test created (or roll back a transaction)', 'Hard-code production employee IDs', 'Seed reference data once per environment, version-controlled'),
      answer: ['a', 'c', 'e'],
      explanation: 'Isolated, self-owned data makes tests parallel-safe and repeatable. Shared mutable rows cause flakiness; production IDs are a privacy and reliability risk.',
    },
  ],
  problems: [
    {
      kind: 'sql', id: 'sql-no-department', title: 'Employees without a department', skill: 'sql', moduleId: 'm04', difficulty: 1,
      statement: 'Return the **name** of every ACTIVE employee who is not assigned to an existing department. Any order.',
      starter: 'SELECT name\nFROM employees\n-- your query here\n;',
      expectedQuery: `SELECT e.name FROM employees e LEFT JOIN departments d ON d.id = e.department_id WHERE d.id IS NULL AND e.status = 'ACTIVE'`,
      orderMatters: false,
      hints: ['LEFT JOIN departments and look for NULLs on the department side.', 'Don\'t forget the status filter.'],
      solution: {
        code: `SELECT e.name
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
WHERE d.id IS NULL
  AND e.status = 'ACTIVE';`,
        explanation: 'LEFT JOIN + IS NULL finds orphans, including department_id values that point to a department that no longer exists — something "WHERE department_id IS NULL" alone would miss.',
        time: 'O(n) with an index on departments.id', space: 'O(1) extra',
      },
      followUps: ['Rewrite with NOT EXISTS. When is NOT IN dangerous? (Hint: NULLs.)'],
    },
    {
      kind: 'sql', id: 'sql-leave-by-dept', title: 'Approved leave days per department', skill: 'sql', moduleId: 'm04', difficulty: 2,
      statement: 'For each department with any **APPROVED** leave, return department **name** and total approved **days**, highest total first.',
      starter: 'SELECT d.name, SUM(lr.days) AS total_days\nFROM leave_requests lr\n-- joins, filter, grouping, ordering\n;',
      expectedQuery: `SELECT d.name, SUM(lr.days) FROM leave_requests lr JOIN employees e ON e.id = lr.employee_id JOIN departments d ON d.id = e.department_id WHERE lr.status = 'APPROVED' GROUP BY d.name ORDER BY SUM(lr.days) DESC`,
      orderMatters: true,
      hints: ['leave_requests → employees → departments.', 'Filter APPROVED before grouping (WHERE, not HAVING).'],
      solution: {
        code: `SELECT d.name, SUM(lr.days) AS total_days
FROM leave_requests lr
JOIN employees e   ON e.id = lr.employee_id
JOIN departments d ON d.id = e.department_id
WHERE lr.status = 'APPROVED'
GROUP BY d.name
ORDER BY total_days DESC;`,
        explanation: 'Join the chain, filter rows with WHERE, aggregate with GROUP BY, sort by the aggregate.',
        time: 'O(n log n) for the sort', space: 'O(groups)',
      },
      followUps: ['Include departments with zero approved days. Which join changes, and where does the status filter move?'],
    },
    {
      kind: 'sql', id: 'sql-self-join', title: 'Employee and manager', skill: 'sql', moduleId: 'm04', difficulty: 2,
      statement: 'Return **employee name** and **manager name** for every employee who has a manager, ordered by employee name.',
      starter: 'SELECT e.name, m.name\nFROM employees e\n-- join employees to itself\n;',
      expectedQuery: 'SELECT e.name, m.name FROM employees e JOIN employees m ON m.id = e.manager_id ORDER BY e.name',
      orderMatters: true,
      hints: ['Alias the same table twice: e for employee, m for manager.'],
      solution: {
        code: `SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON m.id = e.manager_id
ORDER BY e.name;`,
        explanation: 'A self join treats one table as two roles. INNER JOIN excludes the top of the hierarchy (no manager).',
        time: 'O(n log n)', space: 'O(n)',
      },
      followUps: ['List the full reporting chain up to the CEO with a recursive CTE.'],
    },
    {
      kind: 'sql', id: 'sql-top-paid', title: 'Highest paid per department', skill: 'sql', moduleId: 'm04', difficulty: 3,
      statement: 'Return **department name, employee name and salary** of the highest-paid ACTIVE employee in each department (all of them if tied), ordered by department name.',
      starter: 'WITH ranked AS (\n  SELECT ...\n)\nSELECT ...;',
      expectedQuery: `SELECT d.name, e.name, e.salary FROM employees e JOIN departments d ON d.id = e.department_id WHERE e.status='ACTIVE' AND e.salary = (SELECT MAX(e2.salary) FROM employees e2 WHERE e2.department_id = e.department_id AND e2.status='ACTIVE') ORDER BY d.name`,
      orderMatters: true,
      hints: ['RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) inside a CTE.', 'Keep rank = 1; RANK (not ROW_NUMBER) keeps ties.'],
      solution: {
        code: `WITH ranked AS (
  SELECT e.department_id, e.name, e.salary,
         RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rnk
  FROM employees e
  WHERE e.status = 'ACTIVE'
)
SELECT d.name, r.name, r.salary
FROM ranked r
JOIN departments d ON d.id = r.department_id
WHERE r.rnk = 1
ORDER BY d.name;`,
        explanation: 'Window function inside a CTE, then filter on the rank. The correlated-subquery version is equivalent but harder to extend (top 3, second-highest).',
        time: 'O(n log n)', space: 'O(n)',
      },
      followUps: ['Second-highest salary per department — RANK or DENSE_RANK, and why?'],
    },
    {
      kind: 'sql', id: 'sql-balance-check', title: 'Leave balance consistency check', skill: 'sql', moduleId: 'm04', difficulty: 4,
      statement: 'Data validation: `leave_balances.used` should equal the sum of **APPROVED** `leave_requests.days` for that employee and leave type in 2026. Return **employee_id, leave_type, used, approved_days** for every balance row where they differ (treat no approved requests as 0). Order by employee_id, leave_type.',
      starter: 'SELECT b.employee_id, b.leave_type, b.used, ...\nFROM leave_balances b\n;',
      expectedQuery: `SELECT b.employee_id, b.leave_type, b.used, COALESCE((SELECT SUM(days) FROM leave_requests r WHERE r.employee_id=b.employee_id AND r.leave_type=b.leave_type AND r.status='APPROVED' AND substr(r.start_date,1,4)='2026'),0) AS approved FROM leave_balances b WHERE b.year=2026 AND b.used <> COALESCE((SELECT SUM(days) FROM leave_requests r WHERE r.employee_id=b.employee_id AND r.leave_type=b.leave_type AND r.status='APPROVED' AND substr(r.start_date,1,4)='2026'),0) ORDER BY b.employee_id, b.leave_type`,
      orderMatters: true,
      hints: ['Aggregate approved requests per (employee_id, leave_type) in a CTE.', 'LEFT JOIN the balances to that CTE and COALESCE missing sums to 0.', 'Compare used with the sum.'],
      solution: {
        code: `WITH approved AS (
  SELECT employee_id, leave_type, SUM(days) AS days
  FROM leave_requests
  WHERE status = 'APPROVED' AND start_date LIKE '2026-%'
  GROUP BY employee_id, leave_type
)
SELECT b.employee_id, b.leave_type, b.used, COALESCE(a.days, 0) AS approved_days
FROM leave_balances b
LEFT JOIN approved a
  ON a.employee_id = b.employee_id AND a.leave_type = b.leave_type
WHERE b.year = 2026
  AND b.used <> COALESCE(a.days, 0)
ORDER BY b.employee_id, b.leave_type;`,
        explanation: 'This is a reconciliation query — the kind you run after a migration or as a nightly data-quality check. It surfaces two seeded bugs: employee 4 shows 3 SICK days used although their only sick request was cancelled, and employee 8 had 5 EARNED days deducted for a request that is still pending.',
        time: 'O(n log n)', space: 'O(groups)',
      },
      followUps: ['How would you turn this into an automated check that fails the nightly pipeline?', 'Which of the mismatches are real bugs, and which are rule questions for the product owner?'],
    },
    {
      kind: 'sql', id: 'sql-duplicate-attendance', title: 'Duplicate attendance rows', skill: 'sql', moduleId: 'm04', difficulty: 2,
      statement: 'An employee should have at most one attendance row per work_date. Return **employee_id, work_date and the row count** for every violation.',
      starter: 'SELECT employee_id, work_date, COUNT(*)\nFROM attendance\n;',
      expectedQuery: 'SELECT employee_id, work_date, COUNT(*) FROM attendance GROUP BY employee_id, work_date HAVING COUNT(*) > 1',
      orderMatters: false,
      hints: ['GROUP BY both columns.', 'Filter groups with HAVING.'],
      solution: {
        code: `SELECT employee_id, work_date, COUNT(*) AS rows_for_day
FROM attendance
GROUP BY employee_id, work_date
HAVING COUNT(*) > 1;`,
        explanation: 'GROUP BY + HAVING COUNT(*) > 1 is the standard duplicate finder. The real fix is a UNIQUE (employee_id, work_date) constraint — worth raising as a bug.',
        time: 'O(n log n)', space: 'O(groups)',
      },
      followUps: ['Delete the duplicates but keep the earliest row (ROW_NUMBER).'],
    },
  ],
  interviews: [
    {
      id: 'iv-m04-validate', modes: ['api-sql', 'full-sdet3'], skill: 'sql', level: 'L3', kind: 'technical',
      prompt: 'After a POST /leave-requests call returns 201, how do you verify the database state in an automated test? Mention what you check, how you get the data, and how you keep tests independent.',
      rubric: [
        { id: 'row', point: 'Verifies the created row by the ID returned from the API', any: ['id from the response', 'returned id', 'response id', 'by id', 'where id'] },
        { id: 'fields', point: 'Checks key fields and side effects (status, days, balance, audit)', any: ['status', 'balance', 'audit', 'side effect', 'pending', 'fields'] },
        { id: 'access', point: 'Accesses DB via a read-only user / helper / repository layer, not ad-hoc strings everywhere', any: ['jdbc', 'helper', 'repository', 'dao', 'read only', 'utility', 'db client', 'connection pool'] },
        { id: 'async', point: 'Handles async writes with polling and a timeout instead of sleeps', any: ['poll', 'eventually', 'retry until', 'awaitility', 'timeout', 'async'] },
        { id: 'isolation', point: 'Independent data: unique test data and cleanup/rollback', any: ['clean up', 'cleanup', 'teardown', 'rollback', 'unique', 'isolated', 'own data'] },
      ],
      redFlags: [{ any: ['production database', 'prod db'], note: 'Automated tests should not write to or depend on production data.' }],
      structure: 'What you assert → how you query → async handling → data isolation → where it lives in the framework.',
      modelAnswer: '"I take the ID from the 201 response and query leave_requests by that ID through a small DB helper in the framework, using a read-only test user. I assert status PENDING, the right employee, dates and days, and the side effects — no balance deduction yet, an audit row exists. If the write is asynchronous, for example through Kafka, I poll with a timeout instead of sleeping. Each test creates its own employee with a unique email, and teardown deletes what it created, so tests can run in parallel. I keep these DB checks to the cases where the API response can\'t prove correctness by itself."',
      followUp: 'When would you NOT validate the database directly, and rely on the API instead?',
      revision: ['m04', 'm09'],
    },
  ],
  flashcards: [
    { id: 'fc-m04-1', skill: 'sql', moduleId: 'm04', front: 'Find rows with no matching related row', back: 'LEFT JOIN … WHERE right.id IS NULL (or NOT EXISTS).' },
    { id: 'fc-m04-2', skill: 'sql', moduleId: 'm04', front: 'WHERE vs HAVING', back: 'WHERE filters rows before grouping; HAVING filters groups after aggregation.' },
    { id: 'fc-m04-3', skill: 'sql', moduleId: 'm04', front: 'RANK vs DENSE_RANK on 200,150,150,100', back: 'RANK: 1,2,2,4. DENSE_RANK: 1,2,2,3.' },
    { id: 'fc-m04-4', skill: 'sql', moduleId: 'm04', front: 'ACID', back: 'Atomicity, Consistency, Isolation, Durability.' },
    { id: 'fc-m04-5', skill: 'sql', moduleId: 'm04', front: 'Why "= NULL" never matches', back: 'Comparisons with NULL are UNKNOWN; use IS NULL / IS NOT NULL.' },
  ],
};
