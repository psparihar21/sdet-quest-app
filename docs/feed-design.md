# Feed: product brief and design direction

Written 2026-11-13 before the feed rebuild. The first feed worked but read as the laptop screens squeezed onto a phone.

## Product brief

| Question | Answer |
|---|---|
| Who is it for? | A working QA engineer preparing for SDET 3 / QA Lead interviews who has no laptop time but spends 1-2 hours a day scrolling reels. |
| What is the pain? | Study needs a desk and a decision to start. Reels need neither, so reels win every evening. |
| What must the feed do? | Be as easy to start and continue as a reel app: open, thumb up, something new fills the screen. Every few swipes ask for an answer, so scrolling is practice and not just reading. |
| 10-star version | Short voiced explainers, daily goals, phone/laptop sync, an interviewer that talks back. |
| This version | One idea per screen, one swipe per card, quizzes you answer with a tap or a swipe, all graded by the existing engine. |
| Not building | Autoplay video, infinite novelty for its own sake, streak guilt, social features, notifications. |
| How we know it works | Cards seen and questions answered per day on the phone (already stored as attempts), and revision items cleared from the feed. |

## What was wrong (journey audit of the first feed)

1. **It scrolled like a web page.** Cards were taller than the screen and the app's top bar stayed on, so a swipe moved part of a card instead of landing on the next one.
2. **It looked like a form.** Every card was the same grey box with small text. Nothing told a lesson card from a quiz at a glance.
3. **Reading was dense.** Up to 600 characters and whole tables per card, at laptop type size.
4. **Quizzes were laptop quizzes.** Pick a radio, press "Check answer", read a paragraph.

## Design direction

- **Purpose:** replace reel scrolling with learning, one screen at a time.
- **Tone:** printed study cards and exam papers, not a software dashboard. Flat colour, big type, hard edges.
- **Memorable detail:** every card is a sheet of coloured paper; a right answer gets a rubber stamp.
- **Constraints:** no backend, works offline, existing grading and revision engine, strict content security policy (fonts are bundled, not loaded from another site), reduced-motion setting respected, keyboard and screen-reader usable.

### Rules

| Area | Rule |
|---|---|
| Scroll | The feed is full screen with no app chrome. Every card is exactly one screen and one swipe always lands on the next card. Long content scrolls inside its card. |
| Reading | One idea per card, about 380 characters at most, body text 18px or larger. A heading becomes a poster headline. Key terms are marked like a highlighter. |
| Tables | A table becomes a sideways deck: one row per slide, with dots. |
| Colour | Six paper colours (ink, cream, cobalt, forest, sun, clay). One lesson step keeps one colour, so a colour change means a new step. Quizzes are always cream exam paper. |
| Type | Bricolage Grotesque (bundled) for headlines and labels; the system font for body text. |
| Quiz: one answer | Tap a tile and it locks in at once. No separate check button. |
| Quiz: true/false | Drag the statement card right for True, left for False, or use the two buttons. |
| Quiz: several answers | Tick tiles, then "Lock in". |
| Feedback | A stamp (CORRECT / NOT QUITE / PARTLY), the right answer shown on the tiles, then the explanation and interviewer follow-up below. A run of right answers shows as a combo counter. |
| Flashcards | A real card that flips over, then three recall buttons. |
| Coding | Three cards per problem, all built from the reference solution. (1) Tap the lines into order; the assembled code then really runs. (2) Pick the missing syntax from four options. (3) Write the logic in a plain text box, with chips that insert the syntax this problem needs at the cursor, then run the real tests (JavaScript, SQL) or self-review against the checklist (Java). Only card 3 is graded. A problem that comes back for revision shows card 3 alone. |
| Interview drills | Typed in the feed and scored by the same rubric as on the lesson page. |
| Build tasks | Drafted and self-reviewed against the acceptance criteria in the feed. |
| Nothing leaves the feed | There are no "open the full page" cards. Every lesson step can be finished in portrait on a phone. |
| Card footer | Where the card comes from, a save button and an optional link to the same lesson in the laptop layout. Double-tap a card to save its lesson. |
| Desktop | The same phone-width column, centred, with previous/next buttons. |

### States

| State | Behaviour |
|---|---|
| Loading | Cards are built from local data in one pass; no spinner needed. More are appended one screen before the end. |
| Empty / caught up | A closing card: nothing due, nothing unread, links to the Coding Lab and Interview Arena. |
| Error | A broken card is skipped by the app-wide error boundary with a reload button; saved progress is untouched. |
| Partial | Not applicable any more: every step type has an in-feed card. Skill-level gaps from a diagnostic have no single card; the course order covers them. |
| Success | Stamp, combo counter, lesson progress bar fills. |
| Permission | Not applicable: no accounts or permissions. Storage-blocked and storage-full warnings show as a bar at the top. |
