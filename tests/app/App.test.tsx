import { render, screen, within } from '@testing-library/react';
import App from '../../src/app/App';

describe('App teaching layout', () => {
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
});
