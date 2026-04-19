# Second Level Vertex Design

## Goal

Add a second level that teaches vertex form:

```text
y = a(x - h)^2 + k
```

The level should unlock only after the player completes level one. Level one success shows an explicit "enter level two" action; the app must not switch levels automatically.

## Player Experience

Level two is a vertex-focused challenge. The start and goal platforms are fixed for the level, and the player controls three sliders:

- `a`: parabola opening direction and steepness.
- `h`: vertex horizontal position.
- `k`: vertex vertical position.

The canvas shows a translucent circular target zone for the vertex. The target circle is placed left and low in the scene so the level clearly demonstrates horizontal movement through `h`.

The platform layout is designed around a valid target solution. Because the target vertex is left of center, the left platform sits lower and the right platform sits higher according to each platform's distance from the target axis of symmetry. This keeps the level solvable while making the curve read naturally from left to right.

## Passing Rules

The run passes only when all of these checks pass:

- `a` is a real upward-opening parabola parameter: `a > 0`.
- `a` is within the level's acceptable steepness range.
- The vertex `(h, k)` is inside the circular vertex target zone.
- The curve height at the fixed left contact x is close enough to the left platform height.
- The curve height at the fixed right contact x is close enough to the right platform height.

The level may store exact target values internally, but those values must not appear in player feedback.

## Feedback

Level two feedback is multi-item diagnostic feedback. A failed run can report several problems at once instead of only the first failure.

Feedback must give direction without revealing the correct answer. Examples:

- "The vertex is still to the right of the target circle."
- "The vertex is still above the target circle."
- "The opening is too steep."
- "The left contact point is too low."
- "The right contact point is too high."

Feedback should avoid exact target values, exact passing ranges, or "set h to ..." style hints.

## Flow

Level one remains the initial level. After level one succeeds:

- The success review panel includes an "enter level two" button.
- The player stays on level one until they press that button.
- Pressing the button switches the active level to level two and resets the run phase for the new level.

Each level owns its current parameters, attempts, failures, last result, and ghost trails. Failed trails from level one should not appear in level two.

## UI

The app keeps the current two-column structure:

- Game view: canvas, mission brief, current track, platforms, rider, ghost trails.
- Teaching panel: status, controls, feedback, run review.

Level two changes the control panel from one slider to three sliders. The control panel shows the current vertex-form expression and labels the sliders in student-facing language:

- `a` for opening.
- `h` for left/right movement.
- `k` for up/down movement.

The canvas should add:

- A translucent circular vertex target zone.
- A visible vertex marker on the current curve.
- Fixed left and right platforms.
- Current vertex-form parabola.
- Existing run playback and rider presentation.

## Architecture

Keep the change focused. Upgrade the current first-level-specific structure into a lightweight two-level structure without a broad rewrite.

Add `src/game/config/levelTwo.ts` with:

- Level title and mission copy.
- Slider ranges and initial values for `a`, `h`, and `k`.
- Domain and sampling settings.
- Vertex target center and radius.
- Left and right platform anchors.
- Left and right contact x positions.
- Tolerances for vertex, steepness, and platform height checks.

Extend the math layer with vertex-form helpers:

- `evaluateVertexParabola({ a, h, k }, x)`.
- `getVertex({ h, k })`.
- `sampleVertexParabolaPoints(...)`.

Extend simulation so level two can return:

- A deterministic playback path.
- A success or failure result.
- A diagnostic list for all failed checks.

Keep the existing `editing`, `running`, `failed`, and `success` phase model. Extend state to account for the active level and that level's parameter shape.

Rendering should remain deterministic. The renderer can branch on level render data rather than reaching directly into a single hard-coded level config.

## Testing

Add or update tests for:

- Vertex-form evaluation, sampling, and vertex extraction.
- A known valid level two parameter set passing all checks.
- Directional diagnostics for invalid `a`, vertex outside the target circle, left contact too high or low, and right contact too high or low.
- First-level success showing an explicit level-two entry button.
- The app not switching to level two automatically.
- Level two rendering and controls showing three sliders.
- Level two run review showing multi-item direction feedback without exact target values.

Run the full test suite and production build after implementation.

## Out of Scope

- Directly dragging the vertex on the canvas.
- Revealing exact correct values in feedback.
- Automatically entering level two after level one.
- Mixing level one and level two failed ghost trails.
