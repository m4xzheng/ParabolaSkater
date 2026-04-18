import { render, screen } from '@testing-library/react';
import App from '../../src/app/App';

describe('App shell', () => {
  it('renders the level title and launch controls', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: '\u5173\u5361 1\uff1a\u611f\u53d7 a \u7684\u529b\u91cf',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
    expect(screen.getByLabelText('\u53c2\u6570 a')).toBeInTheDocument();
  });
});
