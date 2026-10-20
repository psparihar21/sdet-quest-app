import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm02')!;

export const m02: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm02-l1',
        title: 'OOP the way SDET interviews ask it',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'From JavaScript to Java: what changes',
            body: `You already think in objects in JavaScript. Java adds **static types, classes as the only unit of code, and checked contracts**.

| Concept | JavaScript / TypeScript | Java |
|---|---|---|
| Types | Dynamic (TS adds static checks) | Static, checked by the compiler |
| Class members | public by default | package-private by default; use private/protected/public |
| Interfaces | TS only, erased at runtime | Real runtime types; a class can implement many |
| Inheritance | extends one class | extends one class, implements many interfaces |
| Null safety | undefined / null | null + Optional<T> |
| Equality | === on references | == on references, .equals() for value |

**The four pillars — with automation examples interviewers expect:**

| Pillar | Meaning | In a test framework |
|---|---|---|
| Encapsulation | Hide state, expose behaviour | A page object keeps locators private and exposes applyLeave(days) |
| Inheritance | IS-A reuse | LeavePage extends BasePage to reuse waits and navigation |
| Polymorphism | One type, many implementations | WebDriver driver = new ChromeDriver() — tests depend on the WebDriver interface |
| Abstraction | Show what, hide how | An interface ApiClient with RestAssured and Playwright implementations |

**Why is WebDriver an interface and ChromeDriver a class?** WebDriver is the *contract* (get, findElement, quit). ChromeDriver, FirefoxDriver and RemoteWebDriver *implement* it. Programming to the interface lets the same tests run on any browser or on a Grid — the driver factory picks the implementation.`,
          },
          {
            kind: 'learn',
            title: 'Interfaces vs abstract classes, static, final, access',
            body: `| | Interface | Abstract class |
|---|---|---|
| Purpose | A capability/contract (Clickable, Reportable) | Shared base with common code (BasePage) |
| State | Constants only | Instance fields allowed |
| Methods | abstract, default, static (Java 8+), private (9+) | Any |
| A class can have | Many | One |
| Constructor | No | Yes |

**static** — belongs to the class, not an instance (a shared config loader, utility methods). Static mutable state is dangerous in parallel tests: every thread shares it.

**final** — a final variable can't be reassigned (the object it points to can still change); a final method can't be overridden; a final class can't be extended (String is final).

**Access modifiers:** private (class) < package-private (no keyword) < protected (package + subclasses) < public.

**Constructors** initialise a new object: same name as the class, no return type. If you write none, Java adds a no-arg default constructor; once you write one, it doesn't. Constructors can be overloaded and chained — \`this(...)\` calls another constructor of the same class, \`super(...)\` calls the parent's and must be the first statement. Page objects typically take the driver in the constructor (constructor injection), which makes dependencies explicit and testable.

~~~java
public abstract class BasePage {
    protected final WebDriver driver;            // subclasses use it, nobody reassigns it
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    protected BasePage(WebDriver driver) { this.driver = driver; }

    protected WebElement visible(By locator) {
        return new WebDriverWait(driver, TIMEOUT)
            .until(ExpectedConditions.visibilityOfElementLocated(locator));
    }
    public abstract boolean isLoaded();           // every page must define it
}
~~~

**Exceptions:** checked (IOException — must be declared or caught) vs unchecked (RuntimeException: NullPointerException, IllegalArgumentException). Selenium's exceptions are unchecked. Catch specific exceptions, add context (screenshot, URL), and rethrow — never swallow a failure.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m02-q1', 'm02-q2', 'm02-q3', 'm02-q4'] },
          { kind: 'practice', title: 'Code reading: design a driver factory', problemId: 'java-driver-factory' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m02-oop' },
        ],
      },
      {
        id: 'm02-l2',
        title: 'Collections and HashMap internals',
        minutes: 35,
        sections: [
          {
            kind: 'learn',
            title: 'Choosing the right collection',
            body: `| Need | Use | Why |
|---|---|---|
| Ordered list, index access | ArrayList | O(1) get(i); amortised O(1) add at end |
| Frequent inserts/removes at ends | ArrayDeque | Queue/stack; faster than LinkedList |
| Unique items, fast contains | HashSet | O(1) average |
| Unique, keep insertion order | LinkedHashSet | Predictable iteration |
| Unique, sorted | TreeSet | O(log n), red-black tree |
| Key → value | HashMap | O(1) average, one null key allowed |
| Key → value, sorted keys | TreeMap | Range queries (headMap, ceilingKey) |
| Shared across threads | ConcurrentHashMap | Fine-grained locking, no null keys/values |

**Window handles are a Set<String>** (unique, unordered) — a classic interview question. **findElements returns List<WebElement>** (ordered, may be empty, never null).

**Comparable vs Comparator:** Comparable is the class's *natural* order (compareTo inside the class). Comparator is an *external* order you pass in — e.g. sort test cases by priority then name:

~~~java
cases.sort(Comparator.comparing(TestCase::priority).reversed()
                     .thenComparing(TestCase::name));
~~~

**Generics** give compile-time type safety: List<String> can't accidentally hold an Integer. Wildcards: \`? extends T\` to read, \`? super T\` to write ("PECS").`,
          },
          { kind: 'visual', title: 'Inside a HashMap', vizId: 'hashmap-buckets', caption: 'Java computes hashCode(), spreads it, and masks it to a bucket. Equal hash codes collide; equals() decides identity.' },
          { kind: 'video', title: 'Watch: HashMap internals animated', video: VIDEOS.hashmap },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m02-q5', 'm02-q6', 'm02-q7'] },
          { kind: 'practice', title: 'LRU cache (JS, runs)', problemId: 'js-lru-cache' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m02-hashmap' },
        ],
      },
      {
        id: 'm02-l3',
        title: 'Strings, streams, lambdas and Optional',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Immutable strings and the string pool',
            body: `**String is immutable.** Every "change" creates a new object. Reasons: safe sharing between threads, safe as HashMap keys (hash never changes), security (a validated path can't be modified later), and it enables the **string pool**: identical literals share one object.

~~~java
String a = "leave";
String b = "leave";
String c = new String("leave");
a == b        // true  – same pooled object
a == c        // false – new object on the heap
a.equals(c)   // true  – same characters. Always compare strings with equals()
~~~

| | String | StringBuilder | StringBuffer |
|---|---|---|---|
| Mutable | No | Yes | Yes |
| Thread-safe | Yes (immutable) | No | Yes (synchronized) |
| Use | Values, keys | Building strings in a loop | Legacy code |

Concatenating in a loop with + creates a new String each iteration — O(n²) characters copied. Use StringBuilder.`,
          },
          {
            kind: 'learn',
            title: 'Streams and functional interfaces',
            body: `Streams are like JavaScript array methods, but lazy until a terminal operation.

| JavaScript | Java stream |
|---|---|
| arr.filter(f) | stream.filter(predicate) |
| arr.map(f) | stream.map(function) |
| arr.flatMap(f) | stream.flatMap(x -> x.stream()) |
| arr.reduce(f, init) | stream.reduce(init, op) |
| groupBy (lodash) | collect(Collectors.groupingBy(...)) |

~~~java
// Failed test names, slowest first
List<String> names = results.stream()
    .filter(r -> r.status() == Status.FAILED)
    .sorted(Comparator.comparingLong(TestResult::durationMs).reversed())
    .map(TestResult::name)
    .toList();

// Count by status
Map<Status, Long> counts = results.stream()
    .collect(Collectors.groupingBy(TestResult::status, Collectors.counting()));
~~~

**Functional interfaces** have one abstract method, so a lambda can implement them: Predicate<T> (test), Function<T,R> (apply), Consumer<T> (accept), Supplier<T> (get).

**Optional<T>** makes "maybe missing" explicit: \`findUser(email).map(User::name).orElse("Guest")\`. Don't call get() without checking; don't use Optional for fields or parameters.`,
          },
          {
            kind: 'learn',
            title: 'Exception handling, string handling and lambda expressions in test code',
            body: `**Exception handling — the hierarchy interviewers ask about:**
- \`Throwable\` → \`Error\` (OutOfMemoryError — don't catch) and \`Exception\`.
- **Checked** exceptions (IOException, SQLException) must be declared or caught — the compiler enforces it.
- **Unchecked** exceptions (RuntimeException: NullPointerException, IllegalArgumentException, Selenium's NoSuchElementException, TimeoutException) don't.

~~~java
// try-with-resources closes the connection even if the assertion fails
try (Connection c = DriverManager.getConnection(url, user, pass);
     PreparedStatement ps = c.prepareStatement("SELECT status FROM leave_request WHERE id = ?")) {
  ps.setLong(1, requestId);
  try (ResultSet rs = ps.executeQuery()) {
    assertTrue(rs.next(), "leave request " + requestId + " not found");
    assertEquals("APPROVED", rs.getString("status"));
  }
} catch (SQLException e) {
  throw new IllegalStateException("DB check failed for request " + requestId, e); // keep the cause
}
~~~

Rules for **test code**: never swallow exceptions (\`catch (Exception e) {}\` turns a failure into a false pass); wrap with context and the original cause; use \`finally\`/try-with-resources for cleanup; assert expected exceptions explicitly (\`assertThrows(IllegalArgumentException.class, () -> svc.apply(-1))\`); and don't use exceptions for normal control flow (e.g. catching NoSuchElementException to check "is it absent?" — use \`findElements(...).isEmpty()\` instead).

**String handling:** strings are immutable, so \`s + x\` in a loop creates a new object each time — use **StringBuilder** (or StringBuffer if shared across threads). Compare with \`equals\` / \`equalsIgnoreCase\`, never \`==\`. Common test utilities: \`trim()\`/\`strip()\` UI text, \`String.format\` / text blocks for payloads, \`split("\\\\s+")\`, \`replaceAll\` with regex, \`String.join\`, \`chars()\` for counting. Normalise before asserting (whitespace, case, currency formatting) — a lot of "flaky" UI assertions are really string-handling bugs.

**Lambda expressions** are short implementations of a **functional interface** (one abstract method): \`(a, b) -> a + b\`. Method references are a shorter form: \`String::trim\`, \`WebElement::getText\`. In frameworks you meet them as: \`wait.until(d -> d.findElement(SAVE).isEnabled())\`, \`list.removeIf(r -> r.isCancelled())\`, \`Comparator.comparing(Leave::start)\`, and Supplier-based lazy data builders. Lambdas can only capture **effectively final** local variables.`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m02-q8', 'm02-q9', 'm02-q10', 'm02-q14'] },
          { kind: 'practice', title: 'Streams: analyse test results', problemId: 'java-result-analyzer' },
        ],
      },
      {
        id: 'm02-l4',
        title: 'Memory, garbage collection and concurrency',
        minutes: 35,
        sections: [
          { kind: 'visual', title: 'Stack vs heap', vizId: 'stack-heap', caption: 'Step through method calls, object allocation and garbage collection.' },
          {
            kind: 'learn',
            title: 'Memory model in one page',
            body: `- **Stack** (one per thread): method frames, primitives, references. Freed automatically when the method returns. Too-deep recursion → StackOverflowError.
- **Heap** (shared): every object and array. Reclaimed by the **garbage collector** when unreachable. Heap exhaustion → OutOfMemoryError.
- **GC basics:** most objects die young, so the heap is split into a young generation (cheap, frequent collections) and old generation. G1 is the default collector since Java 9; ZGC targets very low pauses.
- **Memory leaks in Java** are references you forgot about: static collections that only grow, caches without eviction, listeners never removed, ThreadLocals never cleared on pooled threads, unclosed resources.

**Java Memory Model (JMM):** without synchronisation, one thread's writes may not be *visible* to another (CPU caches, reordering). \`volatile\` guarantees visibility, not atomicity. \`synchronized\` and locks give both mutual exclusion and visibility.`,
          },
          { kind: 'visual', title: 'A race condition, step by step', vizId: 'race-condition', caption: 'Two threads approve leave against the same balance. Compare no locking with a lock.' },
          {
            kind: 'learn',
            title: 'Thread safety for parallel test execution',
            body: `**Multithreading basics:** a thread is an independent path of execution inside one JVM; create work with Runnable/Callable and run it on an ExecutorService rather than new Thread(). **Synchronization** (the synchronized keyword, locks) makes a block execute by one thread at a time and publishes its writes to other threads.

Parallel TestNG runs share one JVM: **anything static is shared between test threads.**

~~~java
public final class DriverManager {
    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();
    public static WebDriver get() { return DRIVER.get(); }
    public static void set(WebDriver d) { DRIVER.set(d); }
    public static void quit() {
        WebDriver d = DRIVER.get();
        if (d != null) d.quit();
        DRIVER.remove();               // avoid leaks on pooled threads
    }
}
~~~

| Tool | Use |
|---|---|
| ThreadLocal<T> | One instance per thread (driver, test context) |
| AtomicInteger / LongAdder | Lock-free counters (pass/fail metrics) |
| ConcurrentHashMap | Shared caches (auth tokens per role) |
| synchronized / ReentrantLock | Compound check-then-act operations |
| ExecutorService | Run tasks on a fixed pool of threads |
| CompletableFuture | Compose async calls: supplyAsync(...).thenCombine(...).orTimeout(5, SECONDS) |

~~~java
CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> api.getUser(id), pool);
CompletableFuture<List<Leave>> leaves = CompletableFuture.supplyAsync(() -> api.getLeaves(id), pool);
Report r = user.thenCombine(leaves, Report::new).orTimeout(5, TimeUnit.SECONDS).join();
~~~`,
          },
          { kind: 'video', title: 'Watch: race conditions in Java', video: VIDEOS.raceCondition },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m02-q11', 'm02-q12', 'm02-q13'] },
          { kind: 'practice', title: 'Code reading: thread-safe metrics', problemId: 'java-thread-safe-metrics' },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m02-threadlocal' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm02-q14', skill: 'java', moduleId: 'm02', type: 'multi', difficulty: 2,
      prompt: 'Which exception-handling habits belong in good test code?',
      options: opts('catch (Exception e) {} so one bad step does not stop the test', 'try-with-resources for connections and streams', 'Rethrow with context and keep the original cause', 'assertThrows for behaviour that must throw', 'Catch NoSuchElementException to check that an element is absent'),
      answer: ['b', 'c', 'd'],
      explanation: 'Swallowing exceptions hides failures, and using exceptions as control flow is slow and unclear — findElements(...).isEmpty() states the intent.',
    },
    {
      id: 'm02-q1', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 1,
      prompt: 'In `WebDriver driver = new ChromeDriver();`, which is true?',
      options: opts('WebDriver is a class and ChromeDriver is an interface', 'WebDriver is an interface; ChromeDriver is a class implementing it (polymorphism)', 'Both are abstract classes', 'This line does not compile'),
      answer: ['b'],
      explanation: 'Tests depend on the WebDriver interface; the concrete class is chosen at runtime. That is what lets a driver factory swap Chrome, Firefox or RemoteWebDriver without touching tests.',
    },
    {
      id: 'm02-q2', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 2,
      prompt: 'You need a base class for all page objects that holds the driver and shared wait helpers. Best choice?',
      options: opts('Interface with default methods', 'Abstract class', 'Final class', 'Enum'),
      answer: ['b'],
      explanation: 'Shared state (the driver field) and shared implementation point to an abstract class. Interfaces can\'t hold instance state.',
      misconceptions: { a: 'Default methods can share behaviour, but an interface cannot hold the driver as instance state.' },
    },
    {
      id: 'm02-q3', skill: 'java', moduleId: 'm02', type: 'predict', difficulty: 2, codeLang: 'java',
      prompt: 'What happens?',
      code: `final List<String> ids = new ArrayList<>();
ids.add("T-1");
ids = new ArrayList<>();`,
      options: opts('Runs fine', 'Compile error on the last line', 'Compile error on ids.add', 'Runtime exception'),
      answer: ['b'],
      explanation: 'final prevents reassigning the reference, not mutating the object it points to. add() is fine; reassignment is a compile error.',
    },
    {
      id: 'm02-q4', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 2,
      prompt: 'A test catches NoSuchElementException, logs "not found" and continues. What is the problem?',
      options: opts('Nothing, logging is enough', 'The failure is swallowed, so the test can pass while the feature is broken', 'NoSuchElementException is a checked exception and must be declared', 'Logs slow tests down'),
      answer: ['b'],
      explanation: 'Swallowed exceptions create false passes. Add context (screenshot, URL) and rethrow, or assert explicitly.',
    },
    {
      id: 'm02-q5', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 2,
      prompt: 'What does driver.getWindowHandles() return, and why?',
      options: opts('List<String>, because windows are ordered', 'Set<String>, because handles are unique and order isn\'t guaranteed', 'String[]', 'Map<String, WebDriver>'),
      answer: ['b'],
      explanation: 'Handles are unique identifiers with no guaranteed order — exactly what a Set models. Loop and compare with the parent handle to switch.',
    },
    {
      id: 'm02-q6', skill: 'java', moduleId: 'm02', type: 'multi', difficulty: 3,
      prompt: 'You override equals() in a TestCase class but not hashCode(), then put TestCase objects in a HashSet. What can happen?',
      options: opts('"Equal" objects may land in different buckets, so duplicates are stored', 'contains() can return false for an equal object', 'Compile error', 'HashSet automatically calls equals() on every element, so it still works'),
      answer: ['a', 'b'],
      explanation: 'The contract: equal objects must have equal hash codes. Without it the set looks in the wrong bucket and never calls equals().',
    },
    {
      id: 'm02-q7', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 3,
      prompt: 'Parallel tests share a cache of auth tokens per role. Which map?',
      options: opts('HashMap', 'TreeMap', 'ConcurrentHashMap', 'Hashtable'),
      answer: ['c'],
      explanation: 'ConcurrentHashMap is built for concurrent access with fine-grained locking; computeIfAbsent makes "fetch token once per role" atomic. Hashtable locks the whole map and is legacy.',
    },
    {
      id: 'm02-q8', skill: 'java', moduleId: 'm02', type: 'predict', difficulty: 2, codeLang: 'java',
      prompt: 'What does this print?',
      code: `String a = "qa";
String b = "q" + "a";
String c = new String("qa");
System.out.println((a == b) + " " + (a == c) + " " + a.equals(c));`,
      options: opts('true false true', 'true true true', 'false false true', 'false false false'),
      answer: ['a'],
      explanation: '"q" + "a" is a compile-time constant, so it is the same pooled literal as a. new String creates a separate object; equals compares characters.',
    },
    {
      id: 'm02-q9', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 2,
      prompt: 'Building a 10,000-line CSV of test data in a single thread. Best choice?',
      options: opts('String with += in a loop', 'StringBuilder', 'StringBuffer', 'String.concat in a loop'),
      answer: ['b'],
      explanation: 'StringBuilder appends in place. += creates a new String every iteration (quadratic copying). StringBuffer adds unnecessary synchronisation.',
    },
    {
      id: 'm02-q10', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 2,
      prompt: 'Which functional interface fits `r -> r.status() == FAILED`?',
      options: opts('Supplier<TestResult>', 'Consumer<TestResult>', 'Predicate<TestResult>', 'Function<TestResult, String>'),
      answer: ['c'],
      explanation: 'A Predicate takes a value and returns boolean — what filter() expects.',
    },
    {
      id: 'm02-q11', skill: 'java', moduleId: 'm02', type: 'mcq', difficulty: 2,
      prompt: 'Why store the WebDriver in a ThreadLocal in a parallel TestNG suite?',
      options: opts('It makes the driver faster', 'Each test thread gets its own driver instance; a static field would be shared and tests would drive each other\'s browsers', 'ThreadLocal is required by Selenium Grid', 'To avoid calling quit()'),
      answer: ['b'],
      explanation: 'Static fields are shared by every thread. ThreadLocal gives each thread its own value. Always remove() it in teardown.',
    },
    {
      id: 'm02-q12', skill: 'java', moduleId: 'm02', type: 'debug', difficulty: 3, codeLang: 'java',
      prompt: 'Run with 8 parallel threads, the final count is often below the number of passed tests. Why?',
      code: `public class Metrics {
    private static int passed = 0;
    public static void pass() { passed++; }
}`,
      options: opts('int overflows', 'passed++ is read-modify-write and not atomic, so concurrent increments are lost', 'static methods can\'t be called from threads', 'The JIT removes the increment'),
      answer: ['b'],
      explanation: 'Two threads can read the same value and both write value+1. Use AtomicInteger.incrementAndGet() or synchronise.',
      misconceptions: { a: 'Overflow needs over 2 billion increments; this is a lost-update race.' },
    },
    {
      id: 'm02-q13', skill: 'java', moduleId: 'm02', type: 'multi', difficulty: 3,
      prompt: 'Which are common causes of memory leaks in a long-running Java test runner?',
      options: opts('A static List that every test appends screenshots to', 'ThreadLocals never removed on pooled threads', 'Local variables inside methods', 'Caches with no eviction', 'Using StringBuilder'),
      answer: ['a', 'b', 'd'],
      explanation: 'Leaks are reachable-but-unneeded objects. Locals die with their stack frame.',
    },
  ],
  problems: [
    {
      kind: 'js', id: 'js-lru-cache', title: 'LRU cache', skill: 'java', moduleId: 'm02', difficulty: 3,
      statement: 'Implement `runLru(capacity, ops)` that simulates an LRU cache. `ops` is a list of `["put", key, value]` or `["get", key]`. Return the results of every `get` in order (`-1` when missing). When full, `put` evicts the **least recently used** key; both `get` and `put` count as use.',
      examples: [{ input: 'runLru(2, [["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["get",3]])', output: '[1, -1, 3]', explain: 'get(1) makes 1 recent, so put(3) evicts 2.' }],
      constraints: ['O(1) per operation expected', 'Keys are numbers or strings'],
      functionName: 'runLru',
      starter: `function runLru(capacity: number, ops: (string | number)[][]): number[] {
  // Hint: a JavaScript Map remembers insertion order.
  return [];
}`,
      tests: [
        { args: [2, [['put', 1, 1], ['put', 2, 2], ['get', 1], ['put', 3, 3], ['get', 2], ['get', 3]]], expected: [1, -1, 3] },
        { args: [1, [['put', 'a', 5], ['put', 'b', 6], ['get', 'a'], ['get', 'b']]], expected: [-1, 6] },
        { args: [2, [['put', 1, 1], ['put', 1, 10], ['put', 2, 2], ['put', 3, 3], ['get', 1]]], expected: [-1] },
        { args: [2, [['get', 9]]], expected: [-1], hidden: true },
        { args: [3, [['put', 1, 1], ['put', 2, 2], ['put', 3, 3], ['get', 1], ['put', 4, 4], ['get', 2], ['get', 1]]], expected: [1, -1, 1], hidden: true },
      ],
      hints: ['On every access, delete the key and set it again so it moves to the "most recent" end.', 'The first key from map.keys() is the least recently used.'],
      solution: {
        code: `function runLru(capacity: number, ops: (string | number)[][]): number[] {
  const cache = new Map<string | number, number>();
  const out: number[] = [];
  for (const [op, key, value] of ops) {
    if (op === 'get') {
      if (!cache.has(key)) { out.push(-1); continue; }
      const v = cache.get(key)!;
      cache.delete(key); cache.set(key, v);
      out.push(v);
    } else {
      cache.delete(key);
      cache.set(key, value as number);
      if (cache.size > capacity) cache.delete(cache.keys().next().value!);
    }
  }
  return out;
}`,
        explanation: 'Map keeps insertion order, so delete+set moves a key to the end; the first key is the eviction candidate. In Java, LinkedHashMap with accessOrder=true and removeEldestEntry() is the idiomatic equivalent.',
        time: 'O(1) per operation', space: 'O(capacity)',
      },
      javaEquivalent: `class Lru<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    Lru(int capacity) { super(16, 0.75f, true); this.capacity = capacity; } // accessOrder = true
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> e) { return size() > capacity; }
}`,
      followUps: ['Implement it without LinkedHashMap: HashMap + doubly linked list.', 'Make it thread-safe. What are the trade-offs of synchronising every method?'],
    },
    {
      kind: 'java', id: 'java-driver-factory', title: 'Design a thread-safe driver factory', skill: 'java', moduleId: 'm02', difficulty: 3,
      statement: 'Write a `DriverFactory` that creates a WebDriver for a browser name ("chrome", "firefox", or "remote" using a Grid URL from config), stores it per thread, and cleans up. Tests call `DriverFactory.get()`.',
      starter: `public final class DriverFactory {
    // TODO: one driver per thread
    public static void init(String browser) {
    }
    public static WebDriver get() {
        return null;
    }
    public static void quit() {
    }
}`,
      checklist: [
        'Uses ThreadLocal<WebDriver> (not a plain static field)',
        'Switch/factory method maps browser name → implementation, programming to the WebDriver interface',
        'Remote option builds RemoteWebDriver from a configured URL, not a hard-coded one',
        'Unknown browser throws IllegalArgumentException with a clear message',
        'quit() null-checks, calls driver.quit() and ThreadLocal.remove()',
        'Private constructor / final class: it is a utility, not meant to be instantiated',
      ],
      hints: ['ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();', 'Selenium 4 Manager resolves local drivers; you don\'t need WebDriverManager.'],
      solution: {
        code: `public final class DriverFactory {
    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();
    private DriverFactory() {}

    public static void init(String browser) {
        WebDriver driver = switch (browser.toLowerCase()) {
            case "chrome"  -> new ChromeDriver(new ChromeOptions().addArguments("--headless=new"));
            case "firefox" -> new FirefoxDriver();
            case "remote"  -> new RemoteWebDriver(Config.gridUrl(), new ChromeOptions());
            default -> throw new IllegalArgumentException("Unsupported browser: " + browser);
        };
        DRIVER.set(driver);
    }

    public static WebDriver get() {
        WebDriver d = DRIVER.get();
        if (d == null) throw new IllegalStateException("Driver not initialised for this thread");
        return d;
    }

    public static void quit() {
        WebDriver d = DRIVER.get();
        if (d != null) d.quit();
        DRIVER.remove();
    }
}`,
        explanation: 'ThreadLocal isolates drivers between parallel threads; the switch keeps creation in one place (factory pattern) and returns the WebDriver interface. remove() matters because TestNG reuses pool threads.',
        time: 'O(1)', space: 'One driver per thread',
      },
      followUps: ['Where do you call init() and quit() in TestNG (which annotations)?', 'How would you add BrowserStack capabilities without touching tests?'],
    },
    {
      kind: 'java', id: 'java-result-analyzer', title: 'TestResultAnalyzer with streams', skill: 'java', moduleId: 'm02', difficulty: 3,
      statement: 'Given `record TestResult(String name, String suite, Status status, long durationMs)`, implement `failedNames()` (sorted), `topNSlowest(int n)`, and `passRateBySuite()` (Map<String, Double>, 0–100) using streams.',
      starter: `public class TestResultAnalyzer {
    private final List<TestResult> results;
    public TestResultAnalyzer(List<TestResult> results) { this.results = results; }

    public List<String> failedNames() { return null; }
    public List<TestResult> topNSlowest(int n) { return null; }
    public Map<String, Double> passRateBySuite() { return null; }
}`,
      checklist: [
        'failedNames filters FAILED, maps to name, sorts, collects',
        'topNSlowest sorts by durationMs descending and uses limit(n)',
        'passRateBySuite uses groupingBy(suite, ...) with averagingDouble or partitioning',
        'Handles an empty list without exceptions',
        'Defensive copy or unmodifiable list for the input',
      ],
      hints: ['Collectors.groupingBy(TestResult::suite, Collectors.averagingDouble(r -> r.status() == Status.PASSED ? 100 : 0))'],
      solution: {
        code: `public List<String> failedNames() {
    return results.stream().filter(r -> r.status() == Status.FAILED)
        .map(TestResult::name).sorted().toList();
}
public List<TestResult> topNSlowest(int n) {
    return results.stream()
        .sorted(Comparator.comparingLong(TestResult::durationMs).reversed())
        .limit(n).toList();
}
public Map<String, Double> passRateBySuite() {
    return results.stream().collect(Collectors.groupingBy(TestResult::suite,
        Collectors.averagingDouble(r -> r.status() == Status.PASSED ? 100.0 : 0.0)));
}`,
        explanation: 'Each method is a pipeline: filter → map/sort → collect. averagingDouble over a 0/100 indicator gives a percentage per group in one pass.',
        time: 'O(n log n) for sorting', space: 'O(n)',
      },
      followUps: ['topNSlowest in O(n log k) instead of sorting everything?', 'How would you also flag tests that both passed and failed (flaky) in the same run?'],
    },
    {
      kind: 'java', id: 'java-thread-safe-metrics', title: 'Thread-safe TestMetrics', skill: 'java', moduleId: 'm02', difficulty: 3,
      statement: 'Implement `TestMetrics` with `incrementPass()`, `incrementFail()`, and `passRate()` (0–100) that is correct when called from many test threads at once.',
      starter: `public class TestMetrics {
    private int pass;
    private int fail;
    public void incrementPass() { pass++; }
    public void incrementFail() { fail++; }
    public double passRate() { return 100.0 * pass / (pass + fail); }
}`,
      checklist: [
        'Counters use AtomicInteger/LongAdder (or all methods synchronised)',
        'passRate handles zero total without dividing by zero',
        'passRate reads a consistent snapshot (or documents that it is approximate)',
        'No static mutable state',
      ],
      hints: ['AtomicInteger.incrementAndGet() is atomic.', 'Reading pass and fail separately can interleave with writes; is that acceptable for a dashboard metric?'],
      solution: {
        code: `public class TestMetrics {
    private final AtomicInteger pass = new AtomicInteger();
    private final AtomicInteger fail = new AtomicInteger();
    public void incrementPass() { pass.incrementAndGet(); }
    public void incrementFail() { fail.incrementAndGet(); }
    /** Approximate while tests are running; exact once they have finished. */
    public double passRate() {
        int p = pass.get(), f = fail.get();
        return p + f == 0 ? 0.0 : 100.0 * p / (p + f);
    }
}`,
        explanation: 'Atomic counters remove the lost-update race. The two reads in passRate are not one atomic snapshot — fine for reporting; if you need exactness, guard both counters with one lock.',
        time: 'O(1)', space: 'O(1)',
      },
      followUps: ['When would LongAdder beat AtomicInteger?', 'How does a TestNG ITestListener collect these safely?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m02-oop', modes: ['java', 'full-sdet3'], skill: 'java', level: 'L2', kind: 'technical',
      prompt: 'Explain the four OOP pillars using examples from an automation framework you have built or used.',
      rubric: [
        { id: 'enc', point: 'Encapsulation: private locators/state behind page methods', any: ['encapsulation', 'private', 'hide the locator', 'hides'] },
        { id: 'inh', point: 'Inheritance: BasePage / BaseTest reuse', any: ['inheritance', 'basepage', 'base page', 'basetest', 'base test', 'extends'] },
        { id: 'poly', point: 'Polymorphism: WebDriver interface / overriding / overloading', any: ['polymorphism', 'webdriver driver = new', 'interface', 'override', 'overload'] },
        { id: 'abs', point: 'Abstraction: interfaces/abstract classes hide implementation', any: ['abstraction', 'abstract class', 'abstract method', 'hide implementation', 'contract'] },
        { id: 'why', point: 'Says why it matters: maintainability, reuse, swapping implementations', any: ['maintain', 'reuse', 'swap', 'change in one place', 'readable'] },
      ],
      redFlags: [{ any: ['encapsulation means inheritance'], note: 'Encapsulation is about hiding state behind methods, not reuse.' }],
      structure: 'Pillar → one-line definition → concrete framework example → why it helps. Four times, then a one-line summary.',
      modelAnswer: `"**Encapsulation:** page objects keep their locators private and expose intent — applyLeave(type, days) — so tests never touch By locators, and a UI change is fixed in one class.
**Inheritance:** every page extends BasePage, which holds the driver and shared wait helpers; every test class extends BaseTest for setup and teardown.
**Polymorphism:** tests use the WebDriver interface; the factory returns ChromeDriver, FirefoxDriver or RemoteWebDriver. Overriding isLoaded() per page is runtime polymorphism; overloaded type(locator, text) helpers are compile-time.
**Abstraction:** an ApiClient interface hides whether we call REST Assured or a mock.
Together they keep the framework maintainable: when we moved to Grid, only the factory changed."`,
      followUp: 'Composition vs inheritance: when would you NOT make LeavePage extend BasePage?',
      revision: ['m02', 'm06'],
    },
    {
      id: 'iv-m02-hashmap', modes: ['java', 'full-sdet3'], skill: 'java', level: 'L3', kind: 'technical',
      prompt: 'How does a HashMap work internally? What happens on a collision, and when does it resize?',
      rubric: [
        { id: 'hash', point: 'hashCode() → spread → bucket index (capacity − 1 mask)', any: ['hashcode', 'hash code', 'bucket', 'index'] },
        { id: 'coll', point: 'Collisions chain in the bucket; equals() identifies the key', any: ['collision', 'linked list', 'chain', 'equals'] },
        { id: 'tree', point: 'Java 8+: large buckets become red-black trees (O(log n))', any: ['tree', 'red black', 'treeif', 'log n'] },
        { id: 'resize', point: 'Load factor 0.75, capacity 16, doubles and rehashes', any: ['load factor', '0.75', 'resize', 'rehash', 'double'] },
        { id: 'contract', point: 'equals/hashCode contract, immutable keys', any: ['contract', 'immutable', 'mutable key', 'override both'] },
        { id: 'thread', point: 'Not thread-safe → ConcurrentHashMap', any: ['thread safe', 'concurrenthashmap', 'concurrent hash map', 'not synchronized'] },
      ],
      structure: 'put/get path → collision → resize → contract → thread safety.',
      modelAnswer: '"A HashMap is an array of buckets, 16 by default. On put, it calls key.hashCode(), spreads the bits and masks with capacity−1 to choose a bucket. If the bucket has entries, it walks them comparing hash and equals(); a match replaces the value, otherwise it appends. Since Java 8, a bucket with more than 8 entries (and capacity ≥ 64) becomes a red-black tree, so worst case is O(log n). When size exceeds capacity × 0.75 it doubles and redistributes entries. Keys must honour the equals/hashCode contract and should be immutable — if a key\'s hash changes after insertion you can\'t find it again. HashMap isn\'t thread-safe; in parallel tests I use ConcurrentHashMap."',
      followUp: 'What happens if two different keys have the same hashCode but are not equal?',
      revision: ['m02', 'm03'],
    },
    {
      id: 'iv-m02-threadlocal', modes: ['java', 'framework', 'full-sdet3'], skill: 'java', level: 'L3', kind: 'technical',
      prompt: 'Your parallel Selenium suite sometimes types into the wrong browser. What is likely wrong and how do you fix it?',
      rubric: [
        { id: 'static', point: 'Shared static WebDriver across threads', any: ['static', 'shared driver', 'shared webdriver', 'same driver'] },
        { id: 'tl', point: 'Use ThreadLocal<WebDriver> per thread', any: ['threadlocal', 'thread local'] },
        { id: 'cleanup', point: 'Quit and remove() in teardown', any: ['remove', 'quit', 'teardown', 'aftermethod', 'after method'] },
        { id: 'other', point: 'Other shared state: test data, page objects, static helpers', any: ['test data', 'page object', 'shared state', 'singleton'] },
        { id: 'config', point: 'TestNG parallel config / thread-count awareness', any: ['parallel=', 'parallel methods', 'thread count', 'testng.xml', 'data provider'] },
      ],
      structure: 'Symptom → root cause → fix → verify → prevent.',
      modelAnswer: '"That\'s almost always a WebDriver held in a static field or a singleton, so all test threads share one browser. I\'d move it into ThreadLocal<WebDriver> inside a DriverFactory: init in @BeforeMethod, get() everywhere, quit() plus remove() in @AfterMethod(alwaysRun = true). Then check for other shared state — static page objects, shared test users, static report builders. I\'d verify by running with parallel="methods" and a higher thread-count, and add a code-review rule: no mutable statics in the test layer."',
      followUp: 'Why is calling remove() important when TestNG uses a thread pool?',
      revision: ['m02', 'm06'],
    },
  ],
  flashcards: [
    { id: 'fc-m02-1', skill: 'java', moduleId: 'm02', front: 'Why is String immutable?', back: 'Thread safety, safe HashMap keys, security, and it enables the string pool.' },
    { id: 'fc-m02-2', skill: 'java', moduleId: 'm02', front: 'Interface vs abstract class (one line)', back: 'Interface = contract, many per class, no instance state. Abstract class = shared base with state and code, one per class.' },
    { id: 'fc-m02-3', skill: 'java', moduleId: 'm02', front: 'equals/hashCode contract', back: 'Equal objects must have equal hash codes. Override both or hash-based collections break.' },
    { id: 'fc-m02-4', skill: 'java', moduleId: 'm02', front: 'volatile vs synchronized', back: 'volatile = visibility only. synchronized = mutual exclusion + visibility.' },
    { id: 'fc-m02-5', skill: 'java', moduleId: 'm02', front: 'HashMap defaults', back: 'Capacity 16, load factor 0.75, resize ×2; bucket → tree after 8 entries (Java 8+).' },
    { id: 'fc-m02-6', skill: 'java', moduleId: 'm02', front: 'Data structure returned by getWindowHandles()', back: 'Set<String> — unique, unordered.' },
  ],
};
