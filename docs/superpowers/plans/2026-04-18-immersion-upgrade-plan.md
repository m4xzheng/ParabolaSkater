# Immersion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current teaching demo into a more game-like sample level by making the run visibly play out, adding a mission-style introduction, and replacing the abstract rider dot with a readable skateboarder silhouette.

**Architecture:** Keep the deterministic simulation result as the source of truth, but add a lightweight playback layer in the app shell that reveals that result over time instead of resolving instantly. Extend the canvas renderer to draw a richer scene and a slope-aware rider silhouette while the panel copy introduces the run as a small level objective.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Canvas 2D API

---

## File Structure

- Modify: `src/app/App.tsx`
  Drives mission copy, timed playback state, and the game/panel composition.
- Modify: `src/game/ui/GameCanvas.tsx`
  Accepts playback progress and forwards richer render data to the canvas layer.
- Modify: `src/game/render/drawLevel.ts`
  Draws the scene background, start/goal markers, and skateboarder silhouette.
- Modify: `src/game/state/feedback.ts`
  Aligns panel copy with the mission-first presentation.
- Modify: `src/game/ui/ControlPanel.tsx`
  Reframes the control area around a level objective rather than a naked parameter editor.
- Modify: `src/styles/app.css`
  Adds mission card styling and supports the richer game presentation.
- Modify: `tests/app/App.test.tsx`
  Covers the mission-oriented UI shell.
- Modify: `tests/app/App.integration.test.tsx`
  Covers visible playback progress and the new mission copy.

## Task 1: Lock In the Immersion-Focused UI Expectations

**Files:**
- Modify: `tests/app/App.test.tsx`
- Modify: `tests/app/App.integration.test.tsx`

- [ ] **Step 1: Rewrite the app shell expectations around mission-style copy**
- [ ] **Step 2: Add an integration assertion that the run stays in a visible playback state before completion**
- [ ] **Step 3: Run `npm test -- --run tests/app/App.test.tsx tests/app/App.integration.test.tsx` and confirm failure**

## Task 2: Implement Timed Playback Instead of Instant Resolution

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/game/ui/GameCanvas.tsx`

- [ ] **Step 1: Add local playback state for an active simulation result and animation progress**
- [ ] **Step 2: Replace the zero-delay resolution with a 2–4 second timed playback loop**
- [ ] **Step 3: Pass playback progress into the canvas while keeping session outcome handling deterministic**
- [ ] **Step 4: Run the focused app tests and confirm the playback expectations pass**

## Task 3: Add Scene Framing and a Readable Skateboarder Silhouette

**Files:**
- Modify: `src/game/render/drawLevel.ts`
- Modify: `src/game/ui/ControlPanel.tsx`
- Modify: `src/game/state/feedback.ts`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add a mission brief that explains the left-to-right goal in game terms**
- [ ] **Step 2: Upgrade the canvas backdrop with clearer start/goal/platform scenery**
- [ ] **Step 3: Replace the dot rider with a slope-aware skateboarder silhouette**
- [ ] **Step 4: Run the full test suite and a production build**

## Self-Review

- Spec coverage:
  - Visible run playback: Task 2
  - Mission-style level introduction: Tasks 1 and 3
  - Less abstract rider: Task 3
- Placeholder scan:
  - No `TODO` or `TBD` placeholders remain.
- Type consistency:
  - Playback data stays local to the app/canvas boundary; deterministic simulation result types remain the shared contract.
