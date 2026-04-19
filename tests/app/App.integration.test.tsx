import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { drawLevelSpy } = vi.hoisted(() => ({
  drawLevelSpy: vi.fn(),
}));

vi.mock('../../src/game/render/drawLevel', () => ({
  drawLevel: drawLevelSpy,
}));

import App from '../../src/app/App';
import { levelTwoConfig } from '../../src/game/config/levelTwo';

function createCanvasContextStub(): CanvasRenderingContext2D {
  return {} as CanvasRenderingContext2D;
}

async function completeLevelOneSuccess(): Promise<void> {
  const teachingPanel = screen.getByRole('complementary', {
    name: '教学面板',
  });
  const slider = within(teachingPanel).getByLabelText('参数 a');

  fireEvent.change(slider, { target: { value: '0.8' } });
  fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

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

  it('renders the game view on the left and the teaching panel on the right', () => {
    render(<App />);

    const gameView = screen.getByRole('region', { name: '游戏视图' });
    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });

    expect(gameView).toBeInTheDocument();
    expect(teachingPanel).toBeInTheDocument();
    expect(gameView.compareDocumentPosition(teachingPanel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(within(gameView).getByLabelText('抛物线关卡画布')).toBeInTheDocument();
    expect(
      within(gameView).getByRole('heading', { name: '把滑手送到右侧平台' }),
    ).toBeInTheDocument();
    expect(within(teachingPanel).getByRole('button', { name: '开始滑行' })).toBeInTheDocument();
  });

  it('keeps animating the run before the result is resolved', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });
    const slider = within(teachingPanel).getByLabelText('参数 a');

    const initialCall = drawLevelSpy.mock.calls.at(-1);
    expect(initialCall?.[1]).toMatchObject({
      activeLevel: 'level-one',
      playbackProgress: 0,
      showGhostTrails: true,
    });

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(within(teachingPanel).getByText('正在运行')).toBeInTheDocument();
    expect(
      within(teachingPanel).getByRole('heading', { name: '正在观察这一趟滑行...' }),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).queryByRole('region', { name: '本轮复盘' }),
    ).not.toBeInTheDocument();

    const midRunCall = drawLevelSpy.mock.calls.at(-1);
    expect(midRunCall?.[1].playbackProgress).toBeGreaterThan(0.2);
    expect(midRunCall?.[1].playbackProgress).toBeLessThan(0.8);
    expect(midRunCall?.[1].simulationResult?.outcome).toBe('too-flat');

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(
      within(teachingPanel).getByRole('heading', { name: '把 a 再调大一点。' }),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).getByRole('region', { name: '本轮复盘' }),
    ).toBeInTheDocument();
  });

  it('escalates shallow-run feedback and keeps failed ghost review available', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });
    const slider = within(teachingPanel).getByLabelText('参数 a');

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const reviewPanel = within(teachingPanel).getByRole('region', {
      name: '本轮复盘',
    });
    expect(within(reviewPanel).getByText('第 1 次尝试')).toBeInTheDocument();
    expect(within(reviewPanel).getByText('把 a 再调大一点。')).toBeInTheDocument();
    expect(
      within(reviewPanel).getByRole('checkbox', { name: '显示失败轨迹参考线' }),
    ).toBeChecked();

    fireEvent.click(within(teachingPanel).getByRole('button', { name: '重新调整' }));
    fireEvent.change(slider, { target: { value: '0.15' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(
      within(teachingPanel).getByRole('heading', { name: '轨道还是太平了。' }),
    ).toBeInTheDocument();

    const repeatedReviewPanel = within(teachingPanel).getByRole('region', {
      name: '本轮复盘',
    });
    expect(within(repeatedReviewPanel).getByText('第 2 次尝试')).toBeInTheDocument();
    expect(
      within(repeatedReviewPanel).getByText(
        '试着把 a 调到 0.45 到 1.05 之间，让轨道更有下坠感。',
      ),
    ).toBeInTheDocument();
    expect(
      within(repeatedReviewPanel).getByText('已记录 2 次失败轨迹，可对照观察。'),
    ).toBeInTheDocument();
  });

  it('wires failed ghost trails through drawLevel and updates when the toggle changes', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });
    const slider = within(teachingPanel).getByLabelText('参数 a');

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const firstFailureCall = drawLevelSpy.mock.calls.at(-1);
    expect(firstFailureCall?.[1]).toMatchObject({
      activeLevel: 'level-one',
      showGhostTrails: true,
      playbackProgress: 1,
    });
    expect(firstFailureCall?.[1].ghostResults).toHaveLength(1);

    fireEvent.click(within(teachingPanel).getByRole('button', { name: '重新调整' }));
    fireEvent.change(slider, { target: { value: '0.15' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const secondFailureCall = drawLevelSpy.mock.calls.at(-1);
    expect(secondFailureCall?.[1]).toMatchObject({
      activeLevel: 'level-one',
      showGhostTrails: true,
      playbackProgress: 1,
    });
    expect(secondFailureCall?.[1].ghostResults).toHaveLength(2);

    fireEvent.click(
      within(teachingPanel).getByRole('checkbox', {
        name: '显示失败轨迹参考线',
      }),
    );

    const toggledGhostCall = drawLevelSpy.mock.calls.at(-1);
    expect(toggledGhostCall?.[1]).toMatchObject({
      ghostResults: [],
      showGhostTrails: false,
    });
  });

  it('shows success completion messaging for a viable a value', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });
    const slider = within(teachingPanel).getByLabelText('参数 a');

    fireEvent.change(slider, { target: { value: '0.8' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(within(teachingPanel).getByText('过关')).toBeInTheDocument();
    expect(
      within(teachingPanel).getByText('这条轨道能把小滑手稳稳送到对面。'),
    ).toBeInTheDocument();

    const reviewPanel = within(teachingPanel).getByRole('region', {
      name: '本轮复盘',
    });
    expect(within(reviewPanel).getByText('挑战成功')).toBeInTheDocument();
    expect(within(reviewPanel).getByText('a = 0.80')).toBeInTheDocument();
    expect(
      within(reviewPanel).getByText('做得不错，这条抛物线刚好形成平稳的谷底滑道。'),
    ).toBeInTheDocument();
  });

  it('does not enter level two automatically after level-one success', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });

    expect(
      within(teachingPanel).getByRole('heading', { name: '第一关：感受 a 的力量' }),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).queryByRole('heading', { name: '第二关：移动顶点' }),
    ).not.toBeInTheDocument();
    expect(
      within(teachingPanel).getByRole('button', { name: '进入第二关' }),
    ).toBeInTheDocument();
  });

  it('shows a summary entry button after level-two success', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });

    fireEvent.click(within(teachingPanel).getByRole('button', { name: '进入第二关' }));
    fireEvent.change(within(teachingPanel).getByLabelText('参数 a'), {
      target: { value: String(levelTwoConfig.targetParameters.a) },
    });
    fireEvent.change(within(teachingPanel).getByLabelText('参数 h'), {
      target: { value: String(levelTwoConfig.targetParameters.h) },
    });
    fireEvent.change(within(teachingPanel).getByLabelText('参数 k'), {
      target: { value: String(levelTwoConfig.targetParameters.k) },
    });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(
      within(teachingPanel).getByRole('button', { name: '查看知识点总结' }),
    ).toBeInTheDocument();
  });

  it('passes the active level and vertex parameters through to drawLevel in level two', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });

    fireEvent.click(within(teachingPanel).getByRole('button', { name: '进入第二关' }));

    const initialLevelTwoCall = drawLevelSpy.mock.calls.at(-1);
    expect(initialLevelTwoCall?.[1]).toMatchObject({
      activeLevel: 'level-two',
      levelTwoParameters: {
        a: 0.4,
        h: 0,
        k: 2.2,
      },
    });

    fireEvent.change(within(teachingPanel).getByLabelText('参数 a'), {
      target: { value: String(levelTwoConfig.targetParameters.a) },
    });
    fireEvent.change(within(teachingPanel).getByLabelText('参数 h'), {
      target: { value: String(levelTwoConfig.targetParameters.h) },
    });
    fireEvent.change(within(teachingPanel).getByLabelText('参数 k'), {
      target: { value: String(levelTwoConfig.targetParameters.k) },
    });

    const updatedLevelTwoCall = drawLevelSpy.mock.calls.at(-1);
    expect(updatedLevelTwoCall?.[1]).toMatchObject({
      activeLevel: 'level-two',
      levelTwoParameters: levelTwoConfig.targetParameters,
    });
  });

  it('shows directional level-two diagnostics and resolves out of running', async () => {
    render(<App />);

    await completeLevelOneSuccess();

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });

    fireEvent.click(within(teachingPanel).getByRole('button', { name: '进入第二关' }));
    fireEvent.change(within(teachingPanel).getByLabelText('参数 a'), {
      target: { value: '1.15' },
    });
    fireEvent.change(within(teachingPanel).getByLabelText('参数 h'), {
      target: { value: '-0.35' },
    });
    fireEvent.change(within(teachingPanel).getByLabelText('参数 k'), {
      target: { value: '1.85' },
    });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(within(teachingPanel).queryByText('正在运行')).not.toBeInTheDocument();
    expect(
      within(teachingPanel).getByRole('heading', { name: '还有几处需要调整。' }),
    ).toBeInTheDocument();

    const feedbackPanel = within(teachingPanel)
      .getByRole('heading', { name: '还有几处需要调整。' })
      .closest('section') as HTMLElement;
    expect(within(feedbackPanel).getByRole('list')).toBeInTheDocument();
    expect(within(feedbackPanel).getByText(/偏左/)).toBeInTheDocument();
    expect(within(feedbackPanel).getAllByText(/偏高/).length).toBeGreaterThan(0);
    expect(within(feedbackPanel).queryByText(/1\.4|0\.9|0\.55/)).not.toBeInTheDocument();

    const reviewPanel = within(teachingPanel).getByRole('region', {
      name: '本轮复盘',
    });
    expect(within(reviewPanel).getByText(/a = 1\.15/)).toBeInTheDocument();
    expect(within(reviewPanel).getByText(/h = -0\.35/)).toBeInTheDocument();
    expect(within(reviewPanel).getByText(/k = 1\.85/)).toBeInTheDocument();
  });
});
