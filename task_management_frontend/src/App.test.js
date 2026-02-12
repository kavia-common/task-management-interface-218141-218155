import { render, screen } from '@testing-library/react';
import App from './App';

test('renders task manager header', () => {
  render(<App />);
  const header = screen.getByText(/task manager/i);
  expect(header).toBeInTheDocument();
});
