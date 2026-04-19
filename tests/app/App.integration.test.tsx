import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { drawLevelSpy } = vi.hoisted(() => ({
  drawLevelSpy: vi.fn(),
}));

vi.mock('../../src/game/render/drawLevel', () => ({
  drawLevel: drawLevelSpy,
}));

import App from '../../src/app/App';

function createCanvasContextStub(): CanvasRenderingContext2D {
  return {} as CanvasRenderingContext2D;
}

function getTeachingPanel(): HTMLElement {
  return screen.getByRole('complementary');
}

function getButtons(panel = getTeachingPanel()): HTMLElement[] {
  return within(panel).getAllByRole('button');
}

function getSliders(panel = getTeachingPanel()): HTMLElement[] {
  return within(panel).getAllByRole('slider');
}

async function completeLevelOneSuccess(): Promise<void> {
  const teachingPanel = getTeachingPanel();
  const [slider] = getSliders(teachingPanel);

  fireEvent.change(slider, { target: { value: '0.8' } });
  fireEvent.click(getButtons(teachingPanel)[0]);

  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe('App integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    drawLevelSpy.mockClear();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      createCanvasContextStub(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('keeps animating the run before the result is resolved', async () => {
    render(<App />);

    const teachingPanel = getTeachingPanel();
    const [slider] = getSliders(teachingPanel);

    const initialCall = drawLevelSpy.mock.calls.at(-1);
    expect(initialCall?.[1]).toMatchObject({
      playbackProgress: 0,
      showGhostTrails: true,
    });

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(getButtons(teachingPanel)[0]);

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    const midRunCall = drawLevelSpy.mock.calls.at(-1);
    expect(midRunCall?.[1].playbackProgress).toBeGreaterThan(0.2);
    expect(midRunCall?.[1].playbackProgress).toBeLessThan(0.8);
    expect(midRunCall?.[1].simulationResult?.outcome).toBe('too-flat');

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(within(teachingPanel).getByRole('checkbox')).toBeInTheDocument();
  });

  it('tracks failed ghost trails and lets the user hide them', async () => {
    render(<App />);

    const teachingPanel = getTeachingPanel();
    const [slider] = getSliders(teachingPanel);

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(getButtons(teachingPanel)[0]);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const firstFailureCall = drawLevelSpy.mock.calls.at(-1);
    expect(firstFailureCall?.[1]).toMatchObject({
      showGhostTrails: true,
      playbackProgress: 1,
    });
    expect(firstFailureCall?.[1].ghostResults).toHaveLength(1);

    fireEvent.click(getButtons(teachingPanel)[0]);
    fireEvent.change(slider, { target: { value: '0.15' } });
    fireEvent.click(getButtons(teachingPanel)[0]);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const secondFailureCall = drawLevelSpy.mock.calls.at(-1);
    expect(secondFailureCall?.[1]).toMatchObject({
      showGhostTrails: true,
      playbackProgress: 1,
    });
    expect(secondFailureCall?.[1].ghostResults).toHaveLength(2);

    fireEvent.click(within(teachingPanel).getByRole('checkbox'));

    const toggledGhostCall = drawLevelSpy.mock.calls.at(-1);
    expect(toggledGhostCall?.[1]).toMatchObject({
      ghostResults: [],
      showGhostTrails: false,
    });
  });

  it('exposes level two entry after success without auto-entering', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = getTeachingPanel();

    expect(getSliders(teachingPanel)).toHaveLength(1);
    expect(getButtons(teachingPanel)).toHaveLength(2);
  });

  it('passes the active level and vertex parameters through to drawLevel in level two', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = getTeachingPanel();

    fireEvent.click(getButtons(teachingPanel)[1]);

    const initialLevelTwoCall = drawLevelSpy.mock.calls.at(-1);
    expect(initialLevelTwoCall?.[1]).toMatchObject({
      activeLevel: 'level-two',
      levelTwoParameters: {
        a: 0.4,
        h: 0,
        k: 2.2,
      },
    });

    const [aSlider, hSlider, kSlider] = getSliders(teachingPanel);

    fireEvent.change(aSlider, {
      target: { value: '0.55' },
    });
    fireEvent.change(hSlider, {
      target: { value: '-1.1' },
    });
    fireEvent.change(kSlider, {
      target: { value: '1.15' },
    });

    const updatedLevelTwoCall = drawLevelSpy.mock.calls.at(-1);
    expect(updatedLevelTwoCall?.[1]).toMatchObject({
      activeLevel: 'level-two',
      levelTwoParameters: {
        a: 0.55,
        h: -1.1,
        k: 1.15,
      },
    });
  });

  it('shows directional level-two diagnostics without leaking target numbers', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = getTeachingPanel();

    fireEvent.click(getButtons(teachingPanel)[1]);

    const [aSlider, hSlider, kSlider] = getSliders(teachingPanel);

    fireEvent.change(aSlider, {
      target: { value: '1.15' },
    });
    fireEvent.change(hSlider, {
      target: { value: '-0.35' },
    });
    fireEvent.change(kSlider, {
      target: { value: '1.85' },
    });
    fireEvent.click(getButtons(teachingPanel)[0]);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const feedbackList = within(teachingPanel).getByRole('list');

    expect(feedbackList).toBeInTheDocument();
    expect(feedbackList.textContent).not.toMatch(/-1\.1|1\.1[05]|0\.55/);

    const finalCall = drawLevelSpy.mock.calls.at(-1);
    expect(finalCall?.[1].simulationResult?.outcome).toBe('level-two-diagnostics');
  });
});
