import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the HTMLMediaElement API
beforeAll(() => {
  // Mock Audio element
  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.pause = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn();
});

test('renders radio app', () => {
  render(<App />);
  // Look for the logo instead of a button with specific text
  const logoElement = screen.getByAltText(/Radio Logo/i);
  expect(logoElement).toBeInTheDocument();
});
