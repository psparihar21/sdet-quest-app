import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm05')!;

export const m05: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm05-l1',
        title: 'How WebDriver works, and locators that survive',
        minutes: 30,
        sections: [
          { kind: 'visual', title: 'One command, one round trip', vizId: 'webdriver-flow', caption: 'Follow a findElement call from your Java code to the browser and back.' },
          {
            kind: 'learn',
            title: 'Locator strategy',
            body: `**Priority order** (most to least stable):
1. **Dedicated test attributes** — \`data-testid\` agreed with developers. The best fix for flaky locators is a conversation, not a cleverer XPath.
2. **id / name** — if stable (not generated like \`input-4821\`).
3. **CSS selectors** — fast, readable: \`form#leave-form button[type='submit']\`, \`[data-testid='leave-type'] option\`.
4. **XPath** — when you need text or to walk *up* the DOM.

**XPath you must know:**

| Need | XPath |
|---|---|
| By text | //button[normalize-space()='Apply'] |
| Partial / dynamic | //div[starts-with(@id,'leave-row-')] , contains(@class,'pending') |
| Parent | //span[text()='Pending']/.. |
| Ancestor | //td[text()='Asha']/ancestor::tr |
| Siblings | //td[text()='Asha']/following-sibling::td[3] , preceding-sibling:: |
| Row with condition | //tr[td[1]='Asha' and td[4]='PENDING']//button[.='Approve'] |

Absolute XPath (\`/html/body/div[3]/...\`) breaks on any layout change — never use it.

**Locators by purpose:** \`By.linkText\` for exact link text, \`By.partialLinkText\`, \`By.tagName\` (rarely useful), \`By.className\` (single class only).`,
          },
          { kind: 'video', title: 'Watch: Selenium architecture', video: VIDEOS.seleniumArch },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m05-q1', 'm05-q2', 'm05-q3'] },
        ],
      },
      {
        id: 'm05-l2',
        title: 'Synchronisation: waits and the famous exceptions',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'Implicit, explicit and fluent waits',
            body: `| Wait | Scope | Behaviour | Verdict |
|---|---|---|---|
| Thread.sleep | One line | Always waits the full time | Avoid: slow *and* still flaky |
| Implicit | Whole driver session | findElement polls up to N s | Simple, but hides problems and mixes badly with explicit waits |
| Explicit (WebDriverWait) | One condition | Polls until condition or timeout | **Default choice** |
| Fluent | One condition | Explicit wait + custom polling interval and ignored exceptions | For unusual conditions |

**Synchronization in one sentence:** the browser and your test run at different speeds, so every step must wait for the *state* it depends on. **AJAX** calls update the page after load without navigation — wait for the result (row appears, spinner disappears, text changes), never for a fixed time.

**Don't mix implicit and explicit waits** — the timeouts can stack unpredictably (an explicit wait on "invisibility" can take implicit × retries).

~~~java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.elementToBeClickable(By.id("apply"))).click();
wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".toast"), "Leave applied"));

Wait<WebDriver> fluent = new FluentWait<>(driver)
    .withTimeout(Duration.ofSeconds(20))
    .pollingEvery(Duration.ofMillis(500))
    .ignoring(NoSuchElementException.class, StaleElementReferenceException.class);
~~~

**presenceOfElementLocated** = in the DOM (may be hidden). **visibilityOfElementLocated** = in the DOM *and* displayed. **elementToBeClickable** = visible and enabled (not "not covered").

**The exceptions:**

| Exception | Meaning | Fix |
|---|---|---|
| NoSuchElementException | Locator matched nothing (yet) | Explicit wait; check frame/window; check the locator |
| StaleElementReferenceException | The element you held was re-rendered/removed | Re-find it; wait for the re-render to finish; locate lazily in page objects |
| ElementClickInterceptedException | Something covers it (spinner, toast, sticky header) | Wait for overlay invisibility; scroll; fix the real UI issue |
| ElementNotInteractableException | Present but hidden/disabled | Wait for visibility/clickability |
| TimeoutException | The wait condition never became true | Usually a real bug or wrong condition — read the screenshot |`,
          },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m05-q4', 'm05-q5', 'm05-q6'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m05-waits' },
        ],
      },
      {
        id: 'm05-l3',
        title: 'Frames, windows, alerts, Actions, JS, shadow DOM, Grid',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'The browser-context toolkit',
            body: `~~~java
// Frames: switch in, act, switch back
driver.switchTo().frame("payslip-frame");          // by name/id, index or WebElement
driver.switchTo().defaultContent();
wait.until(ExpectedConditions.frameToBeAvailableAndSwitchToIt(By.id("payslip-frame")));

// Windows/tabs: handles are a Set<String>
String parent = driver.getWindowHandle();
driver.switchTo().newWindow(WindowType.TAB);       // Selenium 4
for (String h : driver.getWindowHandles()) if (!h.equals(parent)) driver.switchTo().window(h);

// Alerts
Alert alert = wait.until(ExpectedConditions.alertIsPresent());
alert.getText(); alert.accept();  // or dismiss(), sendKeys()

// Actions: keyboard and mouse interactions — build a chain, perform() executes it
new Actions(driver).moveToElement(menu).click(submenu).perform();
new Actions(driver).keyDown(Keys.CONTROL).keyDown(Keys.SHIFT).sendKeys("k")
                   .keyUp(Keys.SHIFT).keyUp(Keys.CONTROL).perform();
new Actions(driver).dragAndDrop(src, target).perform();

// JavaScriptExecutor: arguments[0], arguments[1] are the extra parameters
((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView(true);", el);

// File upload: sendKeys the absolute path to <input type=file>
upload.sendKeys(Path.of("data/leave-proof.pdf").toAbsolutePath().toString());

// Shadow DOM (Selenium 4)
SearchContext root = driver.findElement(By.cssSelector("lf-date-picker")).getShadowRoot();
root.findElement(By.cssSelector("button.today")).click();

// Screenshots: page or one element
File page = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
File one = element.getScreenshotAs(OutputType.FILE);
~~~

Clicking with JavaScript bypasses the real user path (overlays, disabled state) — use it to diagnose, not to make a failing test pass.

**Downloads:** set the browser's download directory via options, then poll the folder for the file. **Cookies:** driver.manage().addCookie / getCookieNamed / deleteAllCookies — handy for injecting a session.

**Capabilities & Grid:** ChromeOptions (headless, window size, download prefs) are capabilities. **Selenium Grid 4** (router, distributor, nodes — usually Docker) runs RemoteWebDriver sessions in parallel across browsers.`,
          },
          { kind: 'visual', title: 'Selenium Grid', vizId: 'selenium-grid', caption: 'How parallel sessions are routed to browser nodes.' },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m05-q7', 'm05-q8', 'm05-q9'] },
          { kind: 'practice', title: 'Code reading: approve a pending leave row', problemId: 'java-approve-row' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm05-q1', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 1,
      prompt: 'Most robust locator for an "Apply leave" button?',
      options: opts('/html/body/div[2]/div/form/button[3]', 'By.cssSelector("[data-testid=\'apply-leave\']")', 'By.className("btn")', 'By.xpath("//button[3]")'),
      answer: ['b'],
      explanation: 'A dedicated test attribute is stable across layout and styling changes. Absolute and positional paths break on any DOM change.',
    },
    {
      id: 'm05-q2', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 2,
      prompt: 'You need the Approve button in the table row where the first cell is "Asha". Which XPath?',
      options: opts("//button[text()='Approve']", "//tr[td[1]='Asha']//button[normalize-space()='Approve']", "//td[text()='Asha']/button", "//*[@id='Asha']"),
      answer: ['b'],
      explanation: 'Filter the row by its cell, then descend to the button. The first option matches every row\'s button.',
    },
    {
      id: 'm05-q3', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 2,
      prompt: 'Why can a suite with many small findElement calls be slow on a remote Grid?',
      options: opts('Selenium caches nothing', 'Each WebDriver command is a separate HTTP round trip to the driver/Grid', 'XPath is always slow', 'The JVM garbage collector'),
      answer: ['b'],
      explanation: 'The W3C protocol is request/response per command. Network latency multiplies with chatty tests.',
    },
    {
      id: 'm05-q4', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 2,
      prompt: 'A spinner covers the page for 1–4 s after saving. Click on "Next" sometimes fails with ElementClickInterceptedException. Best fix?',
      options: opts('Thread.sleep(5000)', 'Wait for the spinner to become invisible, then click', 'Click with JavaScriptExecutor', 'Increase the implicit wait'),
      answer: ['b'],
      explanation: 'Wait on the real condition (spinner gone). JS click hides a genuine UI state; sleeps are slow and still flaky; implicit waits don\'t help with overlays.',
    },
    {
      id: 'm05-q5', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 2,
      prompt: 'StaleElementReferenceException most often means…',
      options: opts('The locator is wrong', 'The element was found but the DOM re-rendered, so the reference is no longer attached', 'The browser crashed', 'The page is in an iframe'),
      answer: ['b'],
      explanation: 'Re-locate after the re-render (or wait for it to finish). Page objects that locate lazily reduce this.',
    },
    {
      id: 'm05-q6', skill: 'selenium', moduleId: 'm05', type: 'multi', difficulty: 3,
      prompt: 'Which statements about waits are true?',
      options: opts('Implicit wait applies to every findElement in the session', 'Mixing implicit and explicit waits can make timeouts unpredictable', 'FluentWait lets you set polling interval and ignored exceptions', 'visibilityOfElementLocated passes for hidden elements in the DOM', 'Thread.sleep is the most reliable wait'),
      answer: ['a', 'b', 'c'],
      explanation: 'Visibility requires the element to be displayed — presence is the condition that accepts hidden elements.',
    },
    {
      id: 'm05-q7', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 1,
      prompt: 'Why must Actions chains end with perform()?',
      options: opts('perform() builds and executes the queued actions; without it nothing happens', 'It frees memory', 'It closes the browser', 'It is optional since Selenium 4'),
      answer: ['a'],
      explanation: 'Actions is a builder: moveToElement/click/keyDown only queue steps until perform().',
    },
    {
      id: 'm05-q8', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 2,
      prompt: 'An element is inside an iframe. findElement fails with NoSuchElementException. What first?',
      options: opts('Use a longer wait', 'Switch into the frame (frameToBeAvailableAndSwitchToIt), then find it', 'Use JavaScript to click it', 'Use By.tagName'),
      answer: ['b'],
      explanation: 'WebDriver only searches the current browsing context. Switch to the frame, then back with defaultContent().',
    },
    {
      id: 'm05-q9', skill: 'selenium', moduleId: 'm05', type: 'mcq', difficulty: 2,
      prompt: 'How do you locate a button inside a shadow root with Selenium 4?',
      options: opts('XPath through the shadow boundary', 'host.getShadowRoot().findElement(By.cssSelector(...))', 'Impossible without JavaScript', 'switchTo().shadow()'),
      answer: ['b'],
      explanation: 'getShadowRoot returns a SearchContext; inside it use CSS (XPath isn\'t supported in shadow roots).',
    },
  ],
  problems: [
    {
      kind: 'java', id: 'java-approve-row', title: 'Approve the pending leave for one employee', skill: 'selenium', moduleId: 'm05', difficulty: 2,
      statement: 'On /approvals a table lists requests (columns: Employee, Type, Days, Status, Action). Write a method `approveFor(String employee)` that clicks Approve in the row whose Employee is the given name and Status is PENDING, then waits until that row shows APPROVED.',
      starter: `public void approveFor(String employee) {
    // TODO
}`,
      checklist: [
        'Builds one XPath/CSS that scopes to the matching row (not a global "Approve" button)',
        'Uses an explicit wait for clickability before clicking',
        'Re-locates the row after clicking (the table re-renders) to avoid stale elements',
        'Waits for the status text to become APPROVED instead of sleeping',
        'Escapes or safely handles names with quotes (or documents the limitation)',
      ],
      hints: ["//tr[td[1][normalize-space()='Asha Rao'] and td[4]='PENDING']//button[normalize-space()='Approve']"],
      solution: {
        code: `public void approveFor(String employee) {
    By row = By.xpath(String.format("//tr[td[1][normalize-space()='%s'] and td[4]='PENDING']", employee));
    WebElement approve = wait.until(ExpectedConditions.elementToBeClickable(
        new ByChained(row, By.xpath(".//button[normalize-space()='Approve']"))));
    approve.click();
    By approvedRow = By.xpath(String.format("//tr[td[1][normalize-space()='%s'] and td[4]='APPROVED']", employee));
    wait.until(ExpectedConditions.visibilityOfElementLocated(approvedRow));
}`,
        explanation: 'Scope by row content, click when clickable, then wait for the observable outcome by locating fresh — never hold the old row reference across a re-render.',
        time: 'O(rows) DOM search', space: 'O(1)',
      },
      followUps: ['How would the same thing look in Playwright with getByRole and filter({ hasText })?'],
    },
  ],
  interviews: [
    {
      id: 'iv-m05-waits', modes: ['automation', 'full-sdet3'], skill: 'selenium', level: 'L2', kind: 'technical',
      prompt: 'Compare implicit, explicit and fluent waits. Which do you use in a framework and why?',
      rubric: [
        { id: 'imp', point: 'Implicit: global to the session, applies to findElement', any: ['implicit', 'global', 'every findelement', 'whole session'] },
        { id: 'exp', point: 'Explicit: WebDriverWait + ExpectedConditions for a specific condition', any: ['explicit', 'webdriverwait', 'expectedconditions', 'expected conditions', 'specific condition'] },
        { id: 'flu', point: 'Fluent: custom polling and ignored exceptions', any: ['fluent', 'polling', 'ignoring'] },
        { id: 'mix', point: 'Don\'t mix implicit and explicit', any: ['mix', 'not both', 'unpredictable', 'stack'] },
        { id: 'sleep', point: 'Avoid Thread.sleep: slow and still flaky', any: ['thread.sleep', 'sleep', 'hard wait', 'static wait'] },
        { id: 'choice', point: 'Framework default: explicit waits wrapped in helpers', any: ['helper', 'wrapper', 'base page', 'basepage', 'utility', 'default'] },
      ],
      structure: 'Three definitions → pitfalls → what I standardise in the framework and why.',
      modelAnswer: '"An implicit wait is set once on the driver and makes every findElement poll up to that timeout. An explicit wait — WebDriverWait with an ExpectedCondition — waits for one specific condition, like clickability or a toast\'s text. A fluent wait is an explicit wait with a custom polling interval and ignored exceptions. In a framework I keep the implicit wait at zero and wrap explicit waits in BasePage helpers like clickWhenReady(locator), because mixing the two stacks timeouts unpredictably, and Thread.sleep is both slow and still flaky. I use fluent waits for things like polling a background job status."',
      followUp: 'An explicit wait for invisibility takes 30 s instead of 10. Why might that be?',
      revision: ['m05'],
    },
  ],
  flashcards: [
    { id: 'fc-m05-1', skill: 'selenium', moduleId: 'm05', front: 'presence vs visibility vs clickable', back: 'Presence: in DOM. Visibility: in DOM and displayed. Clickable: visible and enabled.' },
    { id: 'fc-m05-2', skill: 'selenium', moduleId: 'm05', front: 'StaleElementReferenceException fix', back: 'Re-locate the element after the DOM re-renders; wait for the re-render to finish.' },
    { id: 'fc-m05-3', skill: 'selenium', moduleId: 'm05', front: 'XPath to go up to the row of a cell', back: "//td[text()='Asha']/ancestor::tr (or /.. for the direct parent)" },
    { id: 'fc-m05-4', skill: 'selenium', moduleId: 'm05', front: 'What does arguments[0] mean in executeScript?', back: 'The first extra argument passed after the script, e.g. a WebElement.' },
  ],
};
