import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../src/app/App';

describe('App integration', () => {
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
      within(teachingPanel).getByRole('heading', { name: 'Increase a a bit.' }),
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

  it('escalates shallow-run feedback and keeps failed ghost review available', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: 'Teaching panel',
    });
    const slider = within(teachingPanel).getByLabelText('\u53c2\u6570 a');

    fireEvent.change(slider, { target: { value: '0.2' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: 'Go' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const reviewPanel = within(teachingPanel).getByRole('region', {
      name: 'Run review',
    });
    expect(within(reviewPanel).getByText('Run 1')).toBeInTheDocument();
    expect(within(reviewPanel).getByText('Increase a a bit.')).toBeInTheDocument();
    expect(
      within(reviewPanel).getByRole('checkbox', { name: 'Show failed ghost trails' }),
    ).toBeChecked();

    fireEvent.click(within(teachingPanel).getByRole('button', { name: 'Try again' }));
    fireEvent.change(slider, { target: { value: '0.15' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: 'Go' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(
      within(teachingPanel).getByRole('heading', { name: 'The jump is still too flat.' }),
    ).toBeInTheDocument();

    const repeatedReviewPanel = within(teachingPanel).getByRole('region', {
      name: 'Run review',
    });
    expect(within(repeatedReviewPanel).getByText('Run 2')).toBeInTheDocument();
    expect(within(repeatedReviewPanel).getByText('2 failed ghost trail(s) ready to compare.')).toBeInTheDocument();

    const ghostToggle = within(repeatedReviewPanel).getByRole('checkbox', {
      name: 'Show failed ghost trails',
    });
    fireEvent.click(ghostToggle);
    expect(ghostToggle).not.toBeChecked();
  });

  it('shows success completion messaging for a viable a value', async () => {
    render(<App />);

    const teachingPanel = screen.getByRole('complementary', {
      name: 'Teaching panel',
    });
    const slider = within(teachingPanel).getByLabelText('\u53c2\u6570 a');

    fireEvent.change(slider, { target: { value: '0.8' } });
    fireEvent.click(within(teachingPanel).getByRole('button', { name: 'Go' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(within(teachingPanel).getByText('\u8fc7\u5173')).toBeInTheDocument();
    expect(within(teachingPanel).getByText('Nice work: that jump clears the gap.')).toBeInTheDocument();

    const reviewPanel = within(teachingPanel).getByRole('region', {
      name: 'Run review',
    });
    expect(within(reviewPanel).getByText('Success')).toBeInTheDocument();
    expect(within(reviewPanel).getByText('a = 0.80')).toBeInTheDocument();
    expect(
      within(reviewPanel).getByText('Nice work: this parabola gives a smooth jump arc.'),
    ).toBeInTheDocument();
  });
});
