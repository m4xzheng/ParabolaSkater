# Summary Page Design

## Goal

Add a post-level summary experience that appears after the player finishes level two.

The new flow should:

- keep the current "do not auto-jump" pattern,
- show an explicit action after level two success,
- open a dedicated summary page,
- summarize how the parameters in levels one and two affect the parabola image.

## Player Flow

The game flow becomes:

1. The player clears level one.
2. The player clicks "进入第二关".
3. The player clears level two.
4. The level-two success review shows a new button: "查看知识点总结".
5. The player clicks that button and enters a dedicated summary page.

The app must not enter the summary page automatically. It should only open after the player clicks the button from the level-two success state.

## Summary Page Structure

The summary page replaces the current game screen instead of appearing as a modal or inline panel.

It uses a single-page teaching layout with three major regions:

- Header area: page title and one-sentence recap.
- Visual comparison area: small graph-based examples showing how parameter changes affect the parabola.
- Knowledge card area: short rules, level connections, and common misconceptions.

The bottom of the page includes one primary action button. For this iteration, that button returns the player to the game view. This keeps the page useful now and leaves room to later change the action to "进入第三关".

## Content Strategy

The page uses a mixed presentation:

- top: image or graph comparisons,
- bottom: concise text cards.

This page should explain three layers of understanding:

1. Core rules
2. The relationship between level one and level two
3. Common misconceptions

The goal is not formal derivation. The page should feel like a teaching recap that reinforces what the player just experienced in the first two levels.

## Visual Comparison Content

The visual comparison area should contain multiple small comparison blocks.

### Block 1: Level One and `a`

Show several parabolas that differ in `a` so the player can see:

- `a > 0` opens upward,
- `a < 0` opens downward,
- larger `|a|` makes the parabola steeper.

This block should clearly connect back to level one, where the player only adjusted `a`.

### Block 2: Vertex Form Movement

Show vertex-form examples that isolate each parameter:

- changing `h` moves the graph left or right,
- changing `k` moves the graph up or down,
- changing `a` changes opening direction and steepness.

This block should visually reinforce that the vertex in vertex form is controlled by `(h, k)`.

### Block 3: Two-Level Connection

Include a compact visual explanation that level one focused on one parameter first, while level two required the player to coordinate multiple parameters together.

The point of this block is to help the player feel progression:

- level one: understand the effect of `a`,
- level two: understand how `a`, `h`, and `k` combine into one graph.

## Knowledge Cards

The lower section contains short, scannable cards.

Recommended cards:

- `a` changes opening direction and steepness.
- `h` moves the graph left and right.
- `k` moves the graph up and down.
- The vertex of `y = a(x - h)^2 + k` is `(h, k)`.
- Level one taught one parameter in isolation.
- Level two taught how multiple parameters work together.

Each card should stay brief and visual-first in tone. The cards should read like recap statements, not textbook paragraphs.

## Common Misconceptions

Add a dedicated section or subsection for mistakes students commonly make.

Include at least these points:

- `a < 0` does not make a valley; it makes the parabola open downward.
- larger `|a|` means steeper, not longer.
- in vertex form, the vertex is exactly `(h, k)`, not an estimate.
- changing `h` and `k` moves the whole graph, not just a single marker.

This section should be short and high-signal. It exists to correct likely misunderstandings from the first two levels.

## UI Behavior

The second-level success review panel gains a new explicit action for the summary page.

Behavior requirements:

- The button appears only after a successful level-two run.
- The button does not appear in level-one success.
- The button does not appear during editing, running, or failed states.
- Clicking the button switches the app from the game view to the summary page view.
- The summary page provides a "返回关卡" action that returns to the normal game screen.

The summary page itself should not show gameplay sliders, run buttons, rider playback, or ghost trails.

## Architecture

Keep the implementation narrowly scoped and compatible with the current app structure.

Recommended approach:

- extend app-level view state from a pure game flow into a small view mode such as `game` and `summary`,
- keep level progression logic in the existing session model,
- add a dedicated summary page component, for example `src/game/ui/SummaryPage.tsx`,
- keep the summary content driven by local configuration data rather than embedding large text blocks directly in `App.tsx`.

The summary page can render lightweight graph illustrations using the existing math helpers and canvas/SVG/HTML primitives already appropriate for the codebase. It does not need full gameplay rendering or simulation playback.

## Testing

Add or update tests for:

- level-two success showing a "查看知识点总结" button,
- clicking that button switching to the dedicated summary page,
- the summary page including visual comparison content,
- the summary page including knowledge cards,
- the summary page including common misconception content,
- the summary page return action switching back to the normal game view.

Run the full test suite and production build after implementation.

## Out of Scope

- auto-jumping into the summary page,
- turning the summary page into a modal,
- adding level-three navigation in this change,
- adding interactive parameter controls inside the summary page,
- replacing the current gameplay UI with a new global navigation system.
