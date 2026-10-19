import { opts, type ModuleBundle } from '../bundle';
import { VIDEOS } from '../videos';
import { OUTLINE } from '../outline';

const meta = OUTLINE.find((m) => m.id === 'm14')!;

export const m14: ModuleBundle = {
  module: {
    ...meta,
    lessons: [
      {
        id: 'm14-l1',
        title: 'Mobile testing and Appium architecture',
        minutes: 30,
        sections: [
          {
            kind: 'learn',
            title: 'What changes on mobile',
            body: `**App types:**
| Type | Built with | Automation context |
|---|---|---|
| Native | Kotlin/Java (Android), Swift (iOS) | NATIVE_APP |
| Hybrid | Native shell + WebView (Cordova, Ionic, some React Native screens) | Switch between NATIVE_APP and WEBVIEW_* contexts |
| Mobile web | Browser | Browser automation (Appium + Chrome/Safari, or Playwright emulation for layout) |

**Mobile-specific risks:** device/OS fragmentation, screen sizes and orientation, interrupted flows (calls, notifications, backgrounding), permissions (camera, location), flaky networks/offline mode, battery and memory, app upgrades preserving data, push notifications, deep links, biometric login, store review rules.

**Appium 2 architecture:** test client (Java/JS/Python, WebDriver protocol) → **Appium server** → **driver plugin** per platform (**UiAutomator2** for Android, **XCUITest** for iOS) → device/emulator/simulator. Same W3C protocol as Selenium, so your Selenium skills transfer; capabilities pick platform, device, app and automation name.

**Locators:** accessibility id (best — also improves accessibility), resource-id (Android), name/label (iOS), then class chain/predicate (iOS) or UiSelector; XPath on mobile is slow.

**Native-only testing tools:** Espresso (Android) and XCUITest (iOS) are faster and more reliable for teams that own the app code; Appium is best for cross-platform black-box suites.

**Device farms** (BrowserStack App Automate, Sauce Labs, AWS Device Farm, Firebase Test Lab): real devices on demand, parallel runs, video/logs per session. Strategy: emulators/simulators for fast PR feedback, a curated real-device matrix (top devices by your analytics) nightly.

**Mobile CI:** build the APK/IPA, upload to the farm via API, run tests in parallel, collect videos and logs, gate releases.`,
          },
          { kind: 'video', title: 'Watch: how Appium works', video: VIDEOS.appium },
          { kind: 'check', title: 'Check your understanding', questionIds: ['m14-q1', 'm14-q2', 'm14-q3', 'm14-q4'] },
          { kind: 'interview', title: 'Interview drill', interviewId: 'iv-m14-mobile' },
        ],
      },
    ],
  },
  questions: [
    {
      id: 'm14-q1', skill: 'mobile', moduleId: 'm14', type: 'mcq', difficulty: 2,
      prompt: 'In a hybrid app, Appium can\'t find an element inside a screen rendered in a WebView. What do you do?',
      options: opts('Use a longer wait', 'Switch the driver context from NATIVE_APP to the WEBVIEW context, then use web locators', 'Use coordinates', 'It\'s impossible'),
      answer: ['b'],
      explanation: 'WebView content lives in a separate context with a DOM.',
    },
    {
      id: 'm14-q2', skill: 'mobile', moduleId: 'm14', type: 'mcq', difficulty: 1,
      prompt: 'Which Appium driver automates Android?',
      options: opts('XCUITest', 'UiAutomator2 (or Espresso driver)', 'GeckoDriver', 'SafariDriver'),
      answer: ['b'],
      explanation: 'XCUITest is for iOS.',
    },
    {
      id: 'm14-q3', skill: 'mobile', moduleId: 'm14', type: 'mcq', difficulty: 2,
      prompt: 'Most robust cross-platform mobile locator?',
      options: opts('Absolute XPath', 'Accessibility id', 'Screen coordinates', 'Index of the element'),
      answer: ['b'],
      explanation: 'Stable, fast, platform-neutral — and it improves accessibility for real users.',
    },
    {
      id: 'm14-q4', skill: 'mobile', moduleId: 'm14', type: 'multi', difficulty: 2,
      prompt: 'Mobile-specific scenarios to cover:',
      options: opts('App backgrounded mid-form and resumed', 'Network drops during submission', 'Upgrade from the previous app version keeps data', 'Rotation during a flow', 'Desktop browser zoom'),
      answer: ['a', 'b', 'c', 'd'],
      explanation: 'Desktop zoom is a web concern, not a native mobile one.',
    },
  ],
  problems: [],
  interviews: [
    {
      id: 'iv-m14-mobile', modes: ['automation', 'qa-lead'], skill: 'mobile', level: 'L3', kind: 'design',
      prompt: 'How would you set up mobile test automation for an HR app on Android and iOS with a small team?',
      rubric: [
        { id: 'tool', point: 'Tool choice with reasoning (Appium vs Espresso/XCUITest)', any: ['appium', 'espresso', 'xcuitest', 'detox', 'because'] },
        { id: 'arch', point: 'Shared page objects/screens across platforms', any: ['page object', 'screen object', 'shared', 'cross platform', 'accessibility id'] },
        { id: 'devices', point: 'Emulators for PRs, real-device matrix from analytics', any: ['emulator', 'simulator', 'real device', 'device farm', 'browserstack', 'analytics'] },
        { id: 'scope', point: 'Risk-based scope (critical flows, API for logic)', any: ['critical', 'risk', 'api', 'smoke'] },
        { id: 'ci', point: 'CI integration and artifacts (video/logs)', any: ['ci', 'pipeline', 'video', 'logs', 'parallel'] },
        { id: 'mobile', point: 'Mobile-specific scenarios (interruptions, network, upgrades)', any: ['interrupt', 'background', 'offline', 'network', 'upgrade', 'permission'] },
      ],
      structure: 'Constraints → tool → architecture → device strategy → scope → CI → mobile-specific risks.',
      modelAnswer: '"With a small team I\'d use Appium 2 with Java or TypeScript so we reuse WebDriver skills and one suite covers both platforms, with screen objects that pick locators per platform and accessibility ids as the standard. Business rules stay in API tests; mobile automation covers ~15 critical journeys — login with biometrics fallback, apply leave, approve, view payslip. PRs run on emulators; nightly runs a real-device matrix on BrowserStack chosen from our analytics, with videos and logs attached. I\'d add manual exploratory charters for interruptions, offline mode and app upgrades. If the app team later wants faster feedback, Espresso/XCUITest tests in the app repos complement this."',
      followUp: 'Your real-device runs are 3× flakier than emulator runs. How do you investigate?',
      revision: ['m14'],
    },
  ],
  flashcards: [
    { id: 'fc-m14-1', skill: 'mobile', moduleId: 'm14', front: 'Appium 2 architecture', back: 'Client (WebDriver) → Appium server → driver (UiAutomator2 / XCUITest) → device.' },
    { id: 'fc-m14-2', skill: 'mobile', moduleId: 'm14', front: 'Hybrid app automation', back: 'Switch between NATIVE_APP and WEBVIEW contexts.' },
  ],
};
