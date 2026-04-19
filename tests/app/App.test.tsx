import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/app/App';

describe('App teaching layout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders a mission-style game view alongside the teaching panel', () => {
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
    expect(within(gameView).getByText('山谷训练场')).toBeInTheDocument();
    expect(within(gameView).getByText(/这条滑道是一条抛物线/)).toBeInTheDocument();
    expect(
      within(gameView).getByText(/越大，轨道越陡。/, { selector: 'p' }),
    ).toBeInTheDocument();

    expect(
      within(teachingPanel).getByRole('heading', {
        name: '第一关：感受 a 的力量',
      }),
    ).toBeInTheDocument();
    expect(within(teachingPanel).getByRole('button', { name: '开始滑行' })).toBeInTheDocument();
    expect(within(teachingPanel).getByLabelText('参数 a')).toBeInTheDocument();
    expect(within(teachingPanel).getByText(/滑道满足/)).toBeInTheDocument();
  });

  it('stays in a visible playback state before resolving the run', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: '教学面板',
    });
    const slider = within(teachingPanel).getByLabelText('参数 a');

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: '开始滑行' }));

    expect(within(teachingPanel).getByText('正在运行')).toBeInTheDocument();
    expect(
      within(teachingPanel).getByRole('heading', { name: '正在观察这一趟滑行……' }),
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(within(teachingPanel).getByText('正在运行')).toBeInTheDocument();
    expect(
      within(teachingPanel).queryByRole('region', { name: '本轮复盘' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(
      within(teachingPanel).getByRole('heading', { name: '把 a 再调大一点。' }),
    ).toBeInTheDocument();

    const resetButton = within(teachingPanel).getByRole('button', {
      name: '重新调整',
    });
    expect(resetButton).toBeInTheDocument();
  });
});
