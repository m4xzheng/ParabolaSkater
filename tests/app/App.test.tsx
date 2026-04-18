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

  it('renders the game view on the left and the teaching panel on the right', () => {
    render(<App />);

    const gameView = screen.getByRole('region', { name: 'Game view' });
    const teachingPanel = screen.getByRole('complementary', {
      name: 'Teaching panel',
    });

    expect(gameView).toBeInTheDocument();
    expect(teachingPanel).toBeInTheDocument();
    expect(gameView.compareDocumentPosition(teachingPanel)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(within(gameView).getByLabelText('Parabola level canvas')).toBeInTheDocument();

    expect(
      within(teachingPanel).getByRole('heading', {
        name: '\u7b2c\u4e00\u5173\uff1a\u611f\u53d7 a \u7684\u529b\u91cf',
      }),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).getByText('\u8c03\u6574 a \u6765\u6539\u53d8\u629b\u7269\u7ebf\u5f27\u7ebf\u3002'),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).getByRole('button', { name: 'Go' }),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).getByLabelText('\u53c2\u6570 a'),
    ).toBeInTheDocument();
    expect(
      within(teachingPanel).getByText('Adjust a to shape the jump.'),
    ).toBeInTheDocument();
  });

  it('shows a running seam before resolving the run and resets back to editing', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: 'Teaching panel',
    });
    const slider = within(teachingPanel).getByLabelText('\u53c2\u6570 a');

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: 'Go' }));

    expect(within(teachingPanel).getByText('\u6b63\u5728\u8fd0\u884c')).toBeInTheDocument();
    expect(within(teachingPanel).getByText('Running the jump...')).toBeInTheDocument();
    expect(slider).toBeDisabled();
    expect(within(teachingPanel).getByRole('button', { name: 'Go' })).toBeDisabled();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(
      within(teachingPanel).getByText('Increase a a bit.'),
    ).toBeInTheDocument();

    const resetButton = within(teachingPanel).getByRole('button', {
      name: 'Try again',
    });
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);

    expect(within(teachingPanel).getByText('\u51c6\u5907\u8c03\u53c2')).toBeInTheDocument();
    expect(within(teachingPanel).getByText('Adjust a to shape the jump.')).toBeInTheDocument();
    expect(slider).not.toBeDisabled();
    expect(within(teachingPanel).getByRole('button', { name: 'Go' })).toBeEnabled();
  });
});
