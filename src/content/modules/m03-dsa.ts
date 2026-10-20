import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm03')!;

export const m03: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm03-l1',
        title: 'Big-O and the hashing pattern',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'How interviewers judge a solution',
            body: `SDET coding rounds are rarely LeetCode-hard. They check that you can **turn a small problem into clean code, test it, and state its cost**. Always say both **time** and **space** complexity.

| Big-O | Meaning | Example |
|---|---|---|
| O(1) | Constant | Map lookup, array index |
| O(log n) | Halves the work each step | Binary search |
| O(n) | One pass | Counting with a map |
| O(n log n) | Sort-based | Sorting, then a pass |
| O(n²) | Every pair | Nested loops over the same list |

**The hashing pattern** turns "have I seen this?" from an O(n) scan into an O(1) lookup. It solves duplicates, frequency counts, two-sum, anagrams and grouping.

~~~ts
// Count failures by category — the most common SDET warm-up
function countBy(items: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item] = (counts[item] ?? 0) + 1;
  return counts;
}
~~~

In Java the same idea is \`map.merge(key, 1, Integer::sum)\`. Interviewers often ask *why* lookups are O(1): see the HashMap visual below.`,
          },
          { kind: 'visual', title: 'How a hash map stores keys', vizId: 'hashmap-buckets', caption: 'Insert keys and watch hashing pick a bucket, collisions chain, and the table resize.' },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m03-q1', 'm03-q2'] },
          { kind: 'practice', title: 'Find duplicate strings', problemId: 'js-find-duplicates' },
          { kind: 'practice', title: 'Valid anagram', problemId: 'js-valid-anagram' },
          { kind: 'practice', title: 'Two sum', problemId: 'js-two-sum' },
          { kind: 'practice', title: 'Group anagrams', problemId: 'js-group-anagrams' },
        ],
      },
      {
        id: 'm03-l2',
        title: 'Two pointers and sliding window',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Two indexes instead of two loops',
            body: `**Two pointers**: on sorted data (or from both ends of a string), move a left and right index toward each other. O(n) instead of O(n²).

**Sliding window**: keep a window [start, end] over a sequence; extend *end*, and shrink *start* when the window breaks a rule. Classic uses: longest substring without repeats, max sum of k consecutive values, "how many requests in the last 60 seconds" (rate limiting — a real SDET topic).

~~~ts
// Is it a palindrome, ignoring non-letters?
function isPalindrome(s: string): boolean {
  const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let i = 0, j = t.length - 1;
  while (i < j) if (t[i++] !== t[j--]) return false;
  return true;
}
~~~`,
          },
          { kind: 'visual', title: 'Sliding window, step by step', vizId: 'sliding-window', caption: 'Watch the window grow and shrink while finding the longest substring without repeating characters.' },
          { kind: 'video', title: 'Watch: sliding window in 7 minutes', video: VIDEOS.slidingWindow },
          { kind: 'check', title: 'Pattern recognition', questionIds: ['m03-q3', 'm03-q4'] },
          { kind: 'practice', title: 'Longest substring without repeats', problemId: 'js-longest-unique' },
          { kind: 'practice', title: 'Max load in any k-minute window', problemId: 'js-max-window-sum' },
        ],
      },
      {
        id: 'm03-l3',
        title: 'Stacks, queues, sorting and binary search',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Pick the structure that matches the access pattern',
            body: `- **Arrays** — contiguous, fixed size in Java (int[]), O(1) index access, O(n) insert/delete in the middle. JS arrays and Java's ArrayList grow dynamically. Classic array tasks: reverse in place, rotate, remove duplicates from a sorted array with two pointers, find max/min in one pass.
- **Stack (LIFO)** — nesting and undo: bracket/JSON validation, browser back history. In JS use an array with push/pop; in Java prefer \`ArrayDeque\` over the legacy \`Stack\` class.
- **Queue (FIFO)** — order of arrival: BFS, job queues, test execution queues. Java: \`ArrayDeque\` / \`LinkedList\` as \`Queue\`.
- **Deque** — both ends: sliding-window maximum.
- **Linked list** — O(1) insert/remove at a known node, O(n) access by index. Rare in SDET rounds except "reverse a list" or "detect a cycle" (fast/slow pointers).
- **Sorting** — O(n log n). Sorting first often unlocks two pointers or merging (merge intervals).
- **Binary search** — O(log n) on sorted data. Template: \`lo=0, hi=n-1; while (lo<=hi) { mid = (lo+hi)>>1; ... }\`. Use it to find the first failing build in a sorted history (that is what \`git bisect\` does).`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m03-q5', 'm03-q6'] },
          { kind: 'practice', title: 'Balanced brackets', problemId: 'js-valid-brackets' },
          { kind: 'practice', title: 'Binary search', problemId: 'js-binary-search' },
          { kind: 'practice', title: 'Merge overlapping intervals', problemId: 'js-merge-intervals' },
        ],
      },
      {
        id: 'm03-l4',
        title: 'Recursion, trees, graphs and SDET-flavoured problems',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'Graphs are everywhere in test infrastructure',
            body: `Test dependencies, service call graphs, page navigation — all graphs. Two traversals cover most questions:

- **BFS** (queue): level by level; shortest path in unweighted graphs.
- **DFS** (recursion or stack): explore deep first; cycle detection; topological sort.

**Topological sort** answers "in which order can I run these setup steps / tests so every dependency runs first?" Kahn's algorithm: count incoming edges, start from nodes with zero, remove them and repeat. If nodes remain, there is a cycle — report it instead of hanging.

**Prefix sums** turn repeated range totals into O(1) lookups: \`prefix[i] = prefix[i-1] + a[i-1]\`, and sum(i..j) = prefix[j+1] − prefix[i]. Useful for running pass rates and cumulative metrics.

**Recursion** checklist: base case, progress toward it, and the call stack cost (O(depth) space).`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m03-q7'] },
          { kind: 'practice', title: 'Parse failed tests from a log', problemId: 'js-parse-failures' },
          { kind: 'practice', title: 'Test execution order (topological sort)', problemId: 'js-test-order' },
          { kind: 'practice', title: 'Running pass rate (prefix sums)', problemId: 'js-running-pass-rate' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m03-approach' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm03-q1', skill: 'dsa', moduleId: 'm03', type: 'mcq', difficulty: 1,
      prompt: 'You must report which test IDs appear more than once in a list of 1 million IDs. Which approach is best?',
      options: opts('Nested loops comparing every pair', 'A HashSet of seen IDs while iterating once', 'Sort, then binary search each ID', 'Convert the list to a string and use indexOf'),
      answer: ['b'],
      explanation: 'One pass with a set: O(n) time, O(n) space. Nested loops are O(n²) — about 10¹² comparisons here.',
      misconceptions: { c: 'Sorting is O(n log n) and then you only need to compare neighbours; binary search per element adds work for nothing.' },
    },
    {
      id: 'm03-q2', skill: 'dsa', moduleId: 'm03', type: 'mcq', difficulty: 2,
      prompt: 'Why is HashMap lookup **average** O(1) but **worst case** worse?',
      options: opts('Because keys are sorted', 'Many keys can collide into one bucket, which then has to be scanned', 'Because the map copies itself on every get', 'It is always O(1)'),
      answer: ['b'],
      explanation: 'A good hash spreads keys across buckets. If many collide, a bucket becomes a list (O(n)); since Java 8 a crowded bucket becomes a balanced tree, giving O(log n).',
    },
    {
      id: 'm03-q3', skill: 'dsa', moduleId: 'm03', type: 'mcq', difficulty: 2,
      prompt: '"Find the maximum number of requests in any 5-minute period of a log" — which pattern?',
      options: opts('Sliding window', 'Binary search', 'Recursion', 'Topological sort'),
      answer: ['a'],
      explanation: 'A contiguous range moving along a sequence is the definition of a sliding window.',
    },
    {
      id: 'm03-q4', skill: 'dsa', moduleId: 'm03', type: 'predict', difficulty: 2, codeLang: 'ts',
      prompt: 'What does this return for `[1, 2, 3, 4, 6]` and target `10`?',
      code: `function pair(a: number[], t: number) {
  let i = 0, j = a.length - 1;
  while (i < j) {
    const s = a[i] + a[j];
    if (s === t) return [i, j];
    s < t ? i++ : j--;
  }
  return [];
}`,
      options: opts('[3, 4]', '[2, 4]', '[0, 4]', '[]'),
      answer: ['a'],
      explanation: '1+6=7 <10 → i=1; 2+6=8 → i=2; 3+6=9 → i=3; 4+6=10 → return [3, 4].',
    },
    {
      id: 'm03-q5', skill: 'dsa', moduleId: 'm03', type: 'mcq', difficulty: 1,
      prompt: 'Which structure validates that `{[()]}` is properly nested?',
      options: opts('Queue', 'Stack', 'Set', 'Binary search tree'),
      answer: ['b'],
      explanation: 'The most recently opened bracket must close first — last in, first out.',
    },
    {
      id: 'm03-q6', skill: 'dsa', moduleId: 'm03', type: 'mcq', difficulty: 2,
      prompt: 'A nightly build history of 512 builds is sorted by time; tests passed until some build and failed after. Minimum builds to check to find the first failing one?',
      options: opts('512', '256', 'About 9', '1'),
      answer: ['c'],
      explanation: 'Binary search halves the range each time: log₂(512) = 9. This is exactly what git bisect does.',
    },
    {
      id: 'm03-q7', skill: 'dsa', moduleId: 'm03', type: 'mcq', difficulty: 3,
      prompt: 'Topological sort of test dependencies finishes but 3 tests were never output. What does that mean?',
      options: opts('Those tests have no dependencies', 'There is a dependency cycle among them', 'The graph is too large', 'They should run in parallel'),
      answer: ['b'],
      explanation: 'In Kahn\'s algorithm, nodes on a cycle never reach zero incoming edges, so they are never emitted. Report the cycle.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-find-duplicates', title: 'Find duplicate strings', skill: 'dsa', moduleId: 'm03', difficulty: 1,
      statement: 'Given a list of test IDs, return every ID that appears **more than once**, each reported once, in the order its **second** occurrence appears.',
      examples: [
        { input: 'findDuplicates(["login", "leave", "login", "payroll", "leave", "login"])', output: '["login", "leave"]' },
        { input: 'findDuplicates(["a", "b"])', output: '[]' },
      ],
      constraints: ['0 ≤ n ≤ 10⁵', 'Aim for O(n) time'],
      functionName: 'findDuplicates',
      starter: `function findDuplicates(ids: string[]): string[] {
  // Hint: what do you need to remember about the IDs you have already seen?
  return [];
}`,
      tests: [
        { args: [['login', 'leave', 'login', 'payroll', 'leave', 'login']], expected: ['login', 'leave'] },
        { args: [['a', 'b']], expected: [] },
        { args: [[]], expected: [] },
        { args: [['x', 'x', 'x', 'x']], expected: ['x'], hidden: true },
        { args: [['B', 'b', 'B']], expected: ['B'], hidden: true, note: 'case-sensitive' },
      ],
      hints: ['Keep a Set of IDs you have seen.', 'Keep a second Set for IDs already reported, so "x" three times is reported once.', 'Sets preserve insertion order in JavaScript, so the reported set is already in second-occurrence order.'],
      solution: {
        code: `function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    else seen.add(id);
  }
  return [...dupes];
}`,
        explanation: 'One pass. "seen" answers "have I met this before?" in O(1); "dupes" de-duplicates the output. This is the HashSet pattern your diagnostic flagged as a gap.',
        time: 'O(n)', space: 'O(n)',
      },
      javaEquivalent: `List<String> findDuplicates(List<String> ids) {
    Set<String> seen = new HashSet<>();
    Set<String> dupes = new LinkedHashSet<>(); // keeps insertion order
    for (String id : ids) if (!seen.add(id)) dupes.add(id);
    return new ArrayList<>(dupes);
}`,
      followUps: ['Return counts instead (Map<String, Integer>). What changes?', 'The list is 50 GB and doesn\'t fit in memory. How would you find duplicates?', 'Why does Set.add returning false make the Java version shorter?'],
    },
    {
      kind: 'js', id: 'js-valid-anagram', title: 'Valid anagram', skill: 'dsa', moduleId: 'm03', difficulty: 1,
      statement: 'Return true if `b` is an anagram of `a` (same letters, same counts). Compare case-insensitively and ignore spaces.',
      examples: [{ input: 'isAnagram("Listen", "Silent")', output: 'true' }, { input: 'isAnagram("rat", "car")', output: 'false' }],
      constraints: ['Strings up to 10⁵ characters', 'O(n) preferred'],
      functionName: 'isAnagram',
      starter: 'function isAnagram(a: string, b: string): boolean {\n  return false;\n}',
      tests: [
        { args: ['Listen', 'Silent'], expected: true },
        { args: ['rat', 'car'], expected: false },
        { args: ['dormitory', 'dirty room'], expected: true },
        { args: ['aab', 'abb'], expected: false, hidden: true },
        { args: ['', ''], expected: true, hidden: true },
      ],
      hints: ['Normalise both strings first.', 'Count characters of one string up, the other down; every count must end at zero.'],
      solution: {
        code: `function isAnagram(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\\s+/g, '');
  const x = norm(a), y = norm(b);
  if (x.length !== y.length) return false;
  const counts = new Map<string, number>();
  for (const c of x) counts.set(c, (counts.get(c) ?? 0) + 1);
  for (const c of y) {
    const n = counts.get(c);
    if (!n) return false;
    counts.set(c, n - 1);
  }
  return true;
}`,
        explanation: 'Length check first, then a frequency map. Sorting both strings also works but costs O(n log n).',
        time: 'O(n)', space: 'O(k) for k distinct characters',
      },
      followUps: ['What changes for Unicode text with accents?', 'Write three test cases you would add as the interviewer.'],
    },
    {
      kind: 'js', id: 'js-two-sum', title: 'Two sum', skill: 'dsa', moduleId: 'm03', difficulty: 2,
      statement: 'Given test durations and a target, return the indexes `[i, j]` (i < j) of the first pair (by j, then i) that sums to the target, or `[]`. The array is **not** sorted.',
      examples: [{ input: 'twoSum([4, 7, 1, 9], 10)', output: '[2, 3]', explain: '1 + 9 = 10' }],
      constraints: ['O(n) expected'],
      functionName: 'twoSum',
      starter: 'function twoSum(nums: number[], target: number): number[] {\n  return [];\n}',
      tests: [
        { args: [[4, 7, 1, 9], 10], expected: [2, 3] },
        { args: [[3, 3], 6], expected: [0, 1] },
        { args: [[1, 2, 3], 100], expected: [] },
        { args: [[2, 8, 5, 5], 10], expected: [0, 1], hidden: true },
        { args: [[-1, 11, 0], 10], expected: [0, 1], hidden: true },
      ],
      hints: ['For each number x you need target − x. Have you seen it already?', 'Store value → index in a Map as you go.'],
      solution: {
        code: `function twoSum(nums: number[], target: number): number[] {
  const indexOf = new Map<number, number>();
  for (let j = 0; j < nums.length; j++) {
    const need = target - nums[j];
    if (indexOf.has(need)) return [indexOf.get(need)!, j];
    if (!indexOf.has(nums[j])) indexOf.set(nums[j], j);
  }
  return [];
}`,
        explanation: 'Look up the complement before inserting the current value, so a number never pairs with itself. Keeping the first index preserves the "earliest i" rule.',
        time: 'O(n)', space: 'O(n)',
      },
      followUps: ['If the array were sorted, how would you do it in O(1) space?', 'Return all pairs instead of the first.'],
    },
    {
      kind: 'js', id: 'js-group-anagrams', title: 'Group anagrams', skill: 'dsa', moduleId: 'm03', difficulty: 3,
      statement: 'Group words that are anagrams of each other. Return groups in order of each group\'s first word; words inside a group keep input order.',
      examples: [{ input: 'groupAnagrams(["eat","tea","tan","ate","nat","bat"])', output: '[["eat","tea","ate"],["tan","nat"],["bat"]]' }],
      constraints: ['Lower-case words'],
      functionName: 'groupAnagrams',
      starter: 'function groupAnagrams(words: string[]): string[][] {\n  return [];\n}',
      tests: [
        { args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], expected: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']] },
        { args: [[]], expected: [] },
        { args: [['a']], expected: [['a']] },
        { args: [['ab', 'ba', 'abc', 'cab', 'b']], expected: [['ab', 'ba'], ['abc', 'cab'], ['b']], hidden: true },
      ],
      hints: ['Two anagrams share the same sorted letters.', 'Use the sorted word as a Map key.'],
      solution: {
        code: `function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const key = [...w].sort().join('');
    const g = groups.get(key);
    if (g) g.push(w); else groups.set(key, [w]);
  }
  return [...groups.values()];
}`,
        explanation: 'A canonical key (sorted letters) maps every anagram to the same bucket. Map preserves insertion order, which gives the required group order.',
        time: 'O(n · k log k) for word length k', space: 'O(n · k)',
      },
      followUps: ['Use a 26-letter count as the key instead of sorting. What is the new complexity?'],
    },
    {
      kind: 'js', id: 'js-longest-unique', title: 'Longest substring without repeating characters', skill: 'dsa', moduleId: 'm03', difficulty: 3,
      statement: 'Return the length of the longest substring of `s` with no repeated characters.',
      examples: [{ input: 'longestUnique("abcabcbb")', output: '3', explain: '"abc"' }, { input: 'longestUnique("pwwkew")', output: '3', explain: '"wke"' }],
      constraints: ['0 ≤ |s| ≤ 10⁵', 'O(n)'],
      functionName: 'longestUnique',
      starter: 'function longestUnique(s: string): number {\n  return 0;\n}',
      tests: [
        { args: ['abcabcbb'], expected: 3 },
        { args: ['bbbbb'], expected: 1 },
        { args: ['pwwkew'], expected: 3 },
        { args: [''], expected: 0, hidden: true },
        { args: ['abba'], expected: 2, hidden: true, note: 'start must never move backwards' },
      ],
      hints: ['Keep a window [start, end] with all-unique characters.', 'Remember the last index of each character; when you see a repeat inside the window, jump start past it.', 'Careful: only jump forward — "abba" breaks solutions that move start backwards.'],
      solution: {
        code: `function longestUnique(s: string): number {
  const last = new Map<string, number>();
  let start = 0, best = 0;
  for (let end = 0; end < s.length; end++) {
    const prev = last.get(s[end]);
    if (prev !== undefined && prev >= start) start = prev + 1;
    last.set(s[end], end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}`,
        explanation: 'Variable-size sliding window. Each index enters and leaves the window at most once → O(n).',
        time: 'O(n)', space: 'O(k) distinct characters',
      },
      followUps: ['Return the substring itself.', 'At most two distinct characters instead of all-unique?'],
    },
    {
      kind: 'js', id: 'js-max-window-sum', title: 'Peak load in any k-minute window', skill: 'dsa', moduleId: 'm03', difficulty: 2,
      statement: '`requests[i]` is the number of API requests in minute i. Return the maximum total over any **k consecutive minutes** (0 if fewer than k minutes).',
      examples: [{ input: 'maxWindow([3, 1, 4, 1, 5, 9, 2], 3)', output: '16', explain: '5 + 9 + 2 = 16' }],
      constraints: ['1 ≤ k', 'O(n)'],
      functionName: 'maxWindow',
      starter: 'function maxWindow(requests: number[], k: number): number {\n  return -1;\n}',
      tests: [
        { args: [[3, 1, 4, 1, 5, 9, 2], 3], expected: 16 },
        { args: [[5], 1], expected: 5 },
        { args: [[1, 2], 3], expected: 0 },
        { args: [[0, 0, 7, 0, 0], 2], expected: 7, hidden: true },
      ],
      hints: ['Sum the first k values, then slide: add the new value, subtract the one leaving.'],
      solution: {
        code: `function maxWindow(requests: number[], k: number): number {
  if (requests.length < k) return 0;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += requests[i];
  let best = sum;
  for (let i = k; i < requests.length; i++) {
    sum += requests[i] - requests[i - k];
    best = Math.max(best, sum);
  }
  return best;
}`,
        explanation: 'Fixed-size window: each step is O(1), so the whole scan is O(n) instead of O(n·k).',
        time: 'O(n)', space: 'O(1)',
      },
      followUps: ['How does this relate to rate limiting an API at 100 requests per minute?'],
    },
    {
      kind: 'js', id: 'js-valid-brackets', title: 'Balanced brackets', skill: 'dsa', moduleId: 'm03', difficulty: 1,
      statement: 'Return true if every `(`, `[` and `{` in `s` is closed in the right order. Other characters are ignored (think: sanity-checking a JSON template).',
      examples: [{ input: 'isBalanced("{ \\"a\\": [1, (2)] }")', output: 'true' }, { input: 'isBalanced("([)]")', output: 'false' }],
      constraints: ['O(n)'],
      functionName: 'isBalanced',
      starter: 'function isBalanced(s: string): boolean {\n  return false;\n}',
      tests: [
        { args: ['{ "a": [1, (2)] }'], expected: true },
        { args: ['([)]'], expected: false },
        { args: [''], expected: true },
        { args: ['((('], expected: false, hidden: true },
        { args: ['}'], expected: false, hidden: true },
      ],
      hints: ['Push openers on a stack.', 'On a closer, the top of the stack must be its matching opener.', 'At the end, the stack must be empty.'],
      solution: {
        code: `function isBalanced(s: string): boolean {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const stack: string[] = [];
  for (const c of s) {
    if (c === '(' || c === '[' || c === '{') stack.push(c);
    else if (c in pairs && stack.pop() !== pairs[c]) return false;
  }
  return stack.length === 0;
}`,
        explanation: 'LIFO matches nesting. Popping an empty stack returns undefined, which fails the comparison — that handles a stray closer.',
        time: 'O(n)', space: 'O(n)',
      },
      followUps: ['Ignore brackets inside string literals. What extra state do you need?'],
    },
    {
      kind: 'js', id: 'js-binary-search', title: 'Binary search', skill: 'dsa', moduleId: 'm03', difficulty: 2,
      statement: 'Return the index of `target` in the ascending array `a`, or -1.',
      examples: [{ input: 'search([1, 3, 5, 7, 9], 7)', output: '3' }],
      constraints: ['O(log n)'],
      functionName: 'search',
      starter: 'function search(a: number[], target: number): number {\n  return -2;\n}',
      tests: [
        { args: [[1, 3, 5, 7, 9], 7], expected: 3 },
        { args: [[1, 3, 5, 7, 9], 4], expected: -1 },
        { args: [[], 1], expected: -1 },
        { args: [[2], 2], expected: 0, hidden: true },
        { args: [[1, 2, 3, 4, 5, 6, 7, 8], 1], expected: 0, hidden: true },
      ],
      hints: ['lo = 0, hi = n − 1, loop while lo <= hi.', 'Compare a[mid] with target and discard half.'],
      solution: {
        code: `function search(a: number[], target: number): number {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}`,
        explanation: 'Each iteration halves the search range. Off-by-one errors (lo < hi vs lo <= hi) are the usual bug — test with 0, 1 and 2 elements.',
        time: 'O(log n)', space: 'O(1)',
      },
      followUps: ['Return the first index of a duplicated value.', 'Why can (lo + hi) / 2 overflow in Java, and how do you avoid it?'],
    },
    {
      kind: 'js', id: 'js-merge-intervals', title: 'Merge overlapping leave periods', skill: 'dsa', moduleId: 'm03', difficulty: 3,
      statement: 'Given `[start, end]` day intervals (inclusive, unsorted), merge overlapping or touching ones (e.g. [1,3] and [4,5] → [1,5]) and return them sorted by start.',
      examples: [{ input: 'merge([[8,10],[1,3],[2,6]])', output: '[[1,6],[8,10]]' }],
      constraints: ['O(n log n)'],
      functionName: 'merge',
      starter: 'function merge(intervals: number[][]): number[][] {\n  return [];\n}',
      tests: [
        { args: [[[8, 10], [1, 3], [2, 6]]], expected: [[1, 6], [8, 10]] },
        { args: [[[1, 3], [4, 5]]], expected: [[1, 5]] },
        { args: [[]], expected: [] },
        { args: [[[1, 10], [2, 3]]], expected: [[1, 10]], hidden: true },
        { args: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]], hidden: true },
      ],
      hints: ['Sort by start.', 'Walk the list; if the next start ≤ current end + 1, extend the current end with max().'],
      solution: {
        code: `function merge(intervals: number[][]): number[][] {
  const sorted = intervals.map((x) => [...x]).sort((a, b) => a[0] - b[0]);
  const out: number[][] = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1] + 1) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}`,
        explanation: 'After sorting, only the last merged interval can overlap the next one. max() handles a contained interval like [2,3] inside [1,10].',
        time: 'O(n log n)', space: 'O(n)',
      },
      followUps: ['How would you detect a leave request that overlaps an existing approved one in SQL?'],
    },
    {
      kind: 'js', id: 'js-parse-failures', title: 'Parse failed tests from a log', skill: 'dsa', moduleId: 'm03', difficulty: 2,
      statement: 'A CI log has lines like `[FAIL] test_login: timeout`, `[PASS] test_leave`, `[FAIL] test_login: assertion`. Return the **unique failed test names, sorted alphabetically**.',
      examples: [{ input: 'failedTests("[FAIL] b: x\\n[PASS] a\\n[FAIL] a: y\\n[FAIL] b: z")', output: '["a", "b"]' }],
      constraints: ['Lines separated by \\n', 'Ignore malformed lines'],
      functionName: 'failedTests',
      starter: 'function failedTests(log: string): string[] {\n  return ["?"];\n}',
      tests: [
        { args: ['[FAIL] b: x\n[PASS] a\n[FAIL] a: y\n[FAIL] b: z'], expected: ['a', 'b'] },
        { args: [''], expected: [] },
        { args: ['[PASS] t1\nrandom noise\n[FAIL] t2: boom'], expected: ['t2'] },
        { args: ['  [FAIL] spaced_test: x  '], expected: ['spaced_test'], hidden: true },
      ],
      hints: ['Split on newlines, trim each line.', 'A regex like /^\\[FAIL\\]\\s+([^:]+):/ captures the name.', 'Collect into a Set, then sort.'],
      solution: {
        code: `function failedTests(log: string): string[] {
  const names = new Set<string>();
  for (const line of log.split('\\n')) {
    const m = line.trim().match(/^\\[FAIL\\]\\s+([^:\\s]+)/);
    if (m) names.add(m[1]);
  }
  return [...names].sort();
}`,
        explanation: 'Parse defensively: trim, match a strict pattern, skip anything else. A Set de-duplicates retries of the same test.',
        time: 'O(n log n) for sorting n names', space: 'O(n)',
      },
      followUps: ['Also return the failure reasons grouped by test.', 'How would you flag tests that both passed and failed in the same run (flaky)?'],
    },
    {
      kind: 'js', id: 'js-test-order', title: 'Test execution order', skill: 'dsa', moduleId: 'm03', difficulty: 4,
      statement: '`deps` maps each test to the tests that must run **before** it, e.g. `{ A: ["B", "C"], B: ["D"] }`. Return an execution order where every dependency runs first; when several tests are ready, pick the **alphabetically smallest**. Return `null` if there is a cycle.',
      examples: [{ input: 'order({ A: ["B", "C"], B: ["D"] })', output: '["C", "D", "B", "A"]' }],
      constraints: ['Tests may appear only as dependencies', 'Up to 10⁴ tests'],
      functionName: 'order',
      starter: 'function order(deps: Record<string, string[]>): string[] | null {\n  return [];\n}',
      tests: [
        { args: [{ A: ['B', 'C'], B: ['D'] }], expected: ['C', 'D', 'B', 'A'] },
        { args: [{}], expected: [] },
        { args: [{ A: ['B'], B: ['A'] }], expected: null },
        { args: [{ login: [], leave: ['login'], approve: ['leave', 'login'] }], expected: ['login', 'leave', 'approve'], hidden: true },
      ],
      hints: ['Count incoming edges (number of unmet dependencies) per test.', 'Repeatedly take the smallest test with zero unmet dependencies (Kahn\'s algorithm).', 'If you output fewer tests than exist, there is a cycle.'],
      solution: {
        code: `function order(deps: Record<string, string[]>): string[] | null {
  const nodes = new Set<string>();
  const pending = new Map<string, number>();
  const unlocks = new Map<string, string[]>();
  for (const [test, before] of Object.entries(deps)) {
    nodes.add(test);
    for (const b of before) {
      nodes.add(b);
      unlocks.set(b, [...(unlocks.get(b) ?? []), test]);
    }
  }
  for (const n of nodes) pending.set(n, deps[n]?.length ?? 0);
  const ready = [...nodes].filter((n) => pending.get(n) === 0);
  const out: string[] = [];
  while (ready.length) {
    ready.sort();
    const n = ready.shift()!;
    out.push(n);
    for (const next of unlocks.get(n) ?? []) {
      pending.set(next, pending.get(next)! - 1);
      if (pending.get(next) === 0) ready.push(next);
    }
  }
  return out.length === nodes.size ? out : null;
}`,
        explanation: 'Kahn\'s topological sort. Sorting the ready list makes the order deterministic (a priority queue would make that O(log n) per step).',
        time: 'O(V log V + E)', space: 'O(V + E)',
      },
      followUps: ['Which tests can run in parallel? (Hint: process the ready set level by level.)', 'Why are inter-test dependencies themselves a test-design smell?'],
    },
    {
      kind: 'js', id: 'js-running-pass-rate', title: 'Running pass rate', skill: 'dsa', moduleId: 'm03', difficulty: 2,
      statement: '`results[i]` is 1 (pass) or 0 (fail) for build i. Return the pass rate (0–100, rounded to the nearest integer) for each query `[from, to]` (inclusive). Answer each query in O(1) after O(n) preparation.',
      examples: [{ input: 'passRates([1,1,0,1], [[0,3],[2,2]])', output: '[75, 0]' }],
      constraints: ['Up to 10⁵ builds and queries'],
      functionName: 'passRates',
      starter: 'function passRates(results: number[], queries: number[][]): number[] {\n  return [];\n}',
      tests: [
        { args: [[1, 1, 0, 1], [[0, 3], [2, 2]]], expected: [75, 0] },
        { args: [[1, 0, 1], [[0, 0], [0, 1], [1, 2]]], expected: [100, 50, 50] },
        { args: [[0, 0, 1], [[0, 2]]], expected: [33], hidden: true },
      ],
      hints: ['Build prefix[i] = passes in results[0..i-1].', 'Passes in [from, to] = prefix[to + 1] − prefix[from].'],
      solution: {
        code: `function passRates(results: number[], queries: number[][]): number[] {
  const prefix = [0];
  for (const r of results) prefix.push(prefix[prefix.length - 1] + r);
  return queries.map(([from, to]) => Math.round(((prefix[to + 1] - prefix[from]) / (to - from + 1)) * 100));
}`,
        explanation: 'Prefix sums trade O(n) memory for O(1) range totals.',
        time: 'O(n + q)', space: 'O(n)',
      },
      followUps: ['A rolling 7-day pass rate for a dashboard: prefix sums or sliding window?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m03-flaky-window', modes: ['dsa', 'full-sdet3'], skill: 'dsa', level: 'L3', kind: 'technical',
      prompt: 'You receive a time-ordered stream of CI results (timestamp, testId, passed). Flag every test that fails 3 or more times within any 10-minute window. Explain your approach, complexity and how you would test it.',
      rubric: [
        { id: 'window', point: 'Sliding window over time, evicting results older than 10 minutes', any: ['sliding window', 'window', 'evict', 'older than', 'expire'] },
        { id: 'map', point: 'Per-test state in a hash map (test id → queue of failure timestamps)', any: ['hash map', 'hashmap', 'map', 'dictionary', 'per test'] },
        { id: 'queue', point: 'Queue/deque of failure times so eviction is O(1) amortised', any: ['queue', 'deque', 'linked list', 'pop from the front', 'poll'] },
        { id: 'complexity', point: 'O(n) time overall (each timestamp added and removed once); space bounded by failures in the window', any: ['o(n)', 'linear', 'amortized', 'amortised', 'each element once'] },
        { id: 'edge', point: 'Edge cases: exactly 10 minutes apart, out-of-order events, passes ignored, report a test once', any: ['boundary', 'exactly', 'out of order', 'late', 'duplicate', 'once', 'edge case'] },
      ],
      redFlags: [{ any: ['rescan all results', 'nested loop', 'for every result loop over all'], note: 'Rescanning history on every event is O(n²) on a busy CI stream.' }],
      structure: 'Clarify window rules → data structure → walk through an example → complexity → edge cases and tests.',
      modelAnswer: '"First I\'d clarify: is the window inclusive at exactly 10 minutes, can events arrive late, and should a test be reported once or every time it crosses the threshold? Then I keep a HashMap from testId to a deque of failure timestamps. For each failed result I push its timestamp, pop from the front while the oldest is more than 10 minutes older than the newest, and if the deque size reaches 3 I flag the test (once, using a Set of flagged ids). Passes are ignored. Each timestamp enters and leaves its deque once, so it\'s O(n) time; space is bounded by failures inside the window. Tests: failures exactly 10 minutes apart, 3 failures spread over 11 minutes (no flag), interleaved tests, passes between failures, and a large generated stream to check it stays linear. If events can be out of order I\'d buffer by a small watermark or sort per test first."',
      followUp: 'The stream is now 50,000 events per second across many CI runners. What changes in your design?',
      revision: ['m03', 'm10'],
    },
    {
      id: 'iv-m03-topk-slowest', modes: ['dsa', 'full-sdet3'], skill: 'dsa', level: 'L3', kind: 'technical',
      prompt: 'Given 5 million test-duration records, return the 10 slowest tests. Compare approaches and their complexity.',
      rubric: [
        { id: 'sort', point: 'Baseline: sort everything, O(n log n)', any: ['sort', 'n log n'] },
        { id: 'heap', point: 'Min-heap of size k: keep the k largest, O(n log k)', any: ['heap', 'priority queue', 'min heap', 'n log k'] },
        { id: 'space', point: 'Heap uses O(k) memory and works on a stream', any: ['o(k)', 'constant memory', 'stream', 'memory'] },
        { id: 'dupes', point: 'Clarifies duplicates: per test (aggregate by id first) vs per run; ties', any: ['aggregate', 'group by', 'per test', 'duplicate', 'tie', 'average', 'max'] },
        { id: 'alt', point: 'Mentions quickselect or doing it in SQL/the reporting tool', any: ['quickselect', 'quick select', 'order by', 'limit', 'database', 'sql'] },
      ],
      redFlags: [{ any: ['max heap of all', 'compare every pair'], note: 'Building a heap of all n items or comparing pairs misses the O(n log k) point.' }],
      structure: 'Clarify → simple approach → better approach → complexity comparison → edge cases.',
      modelAnswer: '"Clarify first: 10 slowest runs, or 10 slowest tests by average or max duration? If per test, I aggregate by testId in a HashMap first. The simple answer is sort descending and take 10 — O(n log n) time and O(n) memory. Better: keep a min-heap of size 10; for each record, push it, and if the heap grows past 10 pop the smallest. That\'s O(n log k) — effectively linear for k = 10 — with O(k) memory, and it works on a stream that doesn\'t fit in memory. Quickselect is O(n) average but needs everything in memory. In practice, if the data is already in a database, SELECT ... ORDER BY duration DESC LIMIT 10 with an index is the right answer. Tests: fewer than 10 records, ties, equal durations, negative or null durations as invalid data."',
      followUp: 'Now return the 10 tests whose duration regressed the most compared with last week. What changes?',
      revision: ['m03', 'm04'],
    },
    {
      id: 'iv-m03-setup-order', modes: ['dsa', 'full-sdet3'], skill: 'dsa', level: 'L4', kind: 'technical',
      prompt: 'Test fixtures declare dependencies (e.g. "approvedLeave" needs "employee" and "manager"; "manager" needs "department"). Write the logic that decides setup order, and explain what happens with a circular dependency.',
      rubric: [
        { id: 'graph', point: 'Models fixtures as a directed graph (adjacency list)', any: ['graph', 'directed', 'adjacency', 'edge', 'node'] },
        { id: 'topo', point: 'Topological sort (Kahn\'s algorithm with in-degrees, or DFS post-order)', any: ['topological', 'kahn', 'in degree', 'indegree', 'dfs', 'depth first'] },
        { id: 'cycle', point: 'Detects cycles: nodes left over (Kahn) or a back edge (DFS) → fail with the cycle path', any: ['cycle', 'circular', 'back edge', 'left over', 'remaining'] },
        { id: 'complexity', point: 'O(V + E) time', any: ['o(v + e)', 'v + e', 'v+e', 'linear', 'vertices and edges'] },
        { id: 'teardown', point: 'Teardown in reverse order; independent fixtures can be set up in parallel', any: ['reverse', 'teardown', 'tear down', 'parallel', 'same level'] },
      ],
      structure: 'Model → algorithm → cycle handling → complexity → practical extensions (teardown, parallel levels).',
      modelAnswer: '"It\'s a dependency graph: each fixture is a node, an edge goes from a dependency to the fixture that needs it. I\'d use Kahn\'s algorithm: compute in-degrees, start a queue with fixtures that have none (department), pop one, add it to the order, decrement its dependants and enqueue any that reach zero. That\'s O(V + E). If the output has fewer nodes than the graph, the remaining nodes are in a cycle — I fail fast with a clear message naming the cycle, e.g. manager → department → manager, rather than hanging or partially setting up. Teardown runs in the reverse order, and fixtures at the same level can be created in parallel. Tests: no dependencies, a chain, a diamond (shared dependency created once), a self-dependency and a longer cycle."',
      followUp: 'How does Playwright\'s fixture system or TestNG\'s dependsOnMethods solve the same problem, and what goes wrong with dependsOnMethods?',
      revision: ['m03', 'm10'],
    },
    {
      id: 'iv-m03-approach', modes: ['dsa', 'full-sdet3'], skill: 'dsa', level: 'L3', kind: 'technical',
      prompt: 'Walk me through how you would find all duplicate employee emails in a list of 2 million records. Talk about approach, complexity, and how you would test your solution.',
      rubric: [
        { id: 'hash', point: 'Uses a hash set / map for O(1) membership', any: ['hashset', 'hash set', 'hashmap', 'hash map', 'set', 'map', 'dictionary'] },
        { id: 'complexity', point: 'States O(n) time and O(n) space', any: ['o(n)', 'linear', 'o n'] },
        { id: 'normalise', point: 'Normalises emails (case, whitespace) before comparing', any: ['lowercase', 'lower case', 'case insensitive', 'trim', 'normalize', 'normalise'] },
        { id: 'alt', point: 'Mentions the sort-based alternative or memory trade-off', any: ['sort', 'n log n', 'memory', 'external', 'stream', 'database', 'group by'] },
        { id: 'tests', point: 'Lists test cases: empty, no duplicates, many duplicates, case variants', any: ['empty', 'edge case', 'no duplicates', 'test case', 'null'] },
      ],
      redFlags: [{ any: ['nested loop', 'two loops', 'compare every'], note: 'Nested loops are O(n²): 2 million records means ~4×10¹² comparisons.' }],
      structure: 'Clarify → brute force and its cost → optimal approach → complexity → edge cases/tests → scale follow-up.',
      modelAnswer: '"First I\'d clarify: are emails case-insensitive, and do I return each duplicate once? Brute force compares every pair — O(n²), far too slow for 2 million. Instead I iterate once, normalise each email (trim, lower-case), and keep a HashSet of seen values; anything already present goes into a duplicates set. That\'s O(n) time and O(n) space. If memory were tight I could sort and compare neighbours in O(n log n), or push it to the database with GROUP BY email HAVING COUNT(*) > 1. I\'d test empty input, no duplicates, all duplicates, case variants like Asha@x.com vs asha@x.com, and leading spaces."',
      followUp: 'Now the data is 200 GB in S3. What changes?',
      revision: ['m03', 'm04'],
    },
    {
      id: 'iv-m03-complexity', modes: ['dsa', 'full-sdet3'], skill: 'dsa', level: 'L3', kind: 'technical',
      prompt: 'You solved two-sum with a HashMap. What is the time and space complexity, and when would you prefer the two-pointer approach instead?',
      rubric: [
        { id: 'hash', point: 'HashMap version: O(n) time, O(n) space', any: ['o(n) time', 'linear time', 'o(n) space', 'o n'] },
        { id: 'sorted', point: 'Two pointers needs sorted input', any: ['sorted', 'sort first'] },
        { id: 'tp', point: 'Two pointers: O(1) extra space; O(n log n) if you must sort', any: ['o(1) space', 'constant space', 'n log n', 'no extra memory'] },
        { id: 'index', point: 'Sorting loses original indexes (sort value+index pairs)', any: ['index', 'original position', 'lose'] },
        { id: 'tradeoff', point: 'States the trade-off clearly', any: ['trade off', 'tradeoff', 'depends', 'memory', 'prefer'] },
      ],
      structure: 'Complexity of current solution → alternative → when each wins → edge cases.',
      modelAnswer: '"The HashMap solution is O(n) time and O(n) space: one pass, storing each value\'s index. Two pointers needs sorted data; then it\'s O(n) time and O(1) extra space. If the input isn\'t sorted, sorting costs O(n log n) and loses the original indexes unless I sort value–index pairs. So: unsorted input and indexes needed → HashMap; already sorted or memory-constrained → two pointers."',
      followUp: 'How would you test this function? List five cases.',
      revision: ['m03'],
    },
    {
      id: 'iv-m03-test-your-code', modes: ['dsa', 'java', 'full-sdet3'], skill: 'dsa', level: 'L3', kind: 'technical',
      prompt: 'You have just written a function that merges overlapping date ranges. As an SDET, how do you test your own solution before saying you are done?',
      rubric: [
        { id: 'empty', point: 'Empty and single-element input', any: ['empty', 'single', 'one element', 'null'] },
        { id: 'edge', point: 'Touching / contained / identical intervals', any: ['touch', 'adjacent', 'contained', 'inside', 'identical', 'same'] },
        { id: 'order', point: 'Unsorted input and output order', any: ['unsorted', 'order', 'sorted'] },
        { id: 'large', point: 'Large input / performance', any: ['large', 'performance', 'million', 'complexity'] },
        { id: 'mutate', point: 'Input not mutated / side effects', any: ['mutat', 'side effect', 'original array'] },
        { id: 'walk', point: 'Dry-runs an example by hand', any: ['dry run', 'walk through', 'trace', 'by hand'] },
      ],
      structure: 'Dry run → happy path → edge cases → invalid input → scale → side effects.',
      modelAnswer: '"First I dry-run the example by hand. Then: empty list, one interval, two disjoint, overlapping, touching like [1,3] and [4,5] depending on the rule, one fully inside another, identical intervals, unsorted input, reversed ranges as invalid input, and a large random input to check it stays O(n log n). I also check the original array isn\'t mutated. Saying these out loud is what separates an SDET from someone who only codes the happy path."',
      followUp: 'Which of those cases would you turn into a property-based test?',
      revision: ['m03'],
    },
  ],
  flashcards: [
    { id: 'fc-m03-1', skill: 'dsa', moduleId: 'm03', front: 'Pattern for "have I seen this before?"', back: 'Hash set / hash map — O(1) average lookups, O(n) total.' },
    { id: 'fc-m03-2', skill: 'dsa', moduleId: 'm03', front: 'Pattern for contiguous ranges (last k minutes, longest substring)', back: 'Sliding window — extend the end, shrink the start; O(n).' },
    { id: 'fc-m03-3', skill: 'dsa', moduleId: 'm03', front: 'Pattern for nested structure validation', back: 'Stack (LIFO).' },
    { id: 'fc-m03-4', skill: 'dsa', moduleId: 'm03', front: 'Order tasks so dependencies run first', back: 'Topological sort (Kahn\'s algorithm); leftover nodes mean a cycle.' },
    { id: 'fc-m03-5', skill: 'dsa', moduleId: 'm03', front: 'Range sums in O(1)', back: 'Prefix sums: sum(i..j) = prefix[j+1] − prefix[i].' },
  ],
};
