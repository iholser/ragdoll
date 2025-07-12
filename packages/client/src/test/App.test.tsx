import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('should render the main heading', () => {
    render(<App />);
    
    const heading = screen.getByRole('heading', { name: /RAG Chat Agent/i });
    expect(heading).toBeInTheDocument();
  });

  it('should render the upload section', () => {
    render(<App />);
    
    const uploadText = screen.getByText(/Upload documents/i);
    expect(uploadText).toBeInTheDocument();
  });

  it('should render the chat interface', () => {
    render(<App />);
    
    const chatTitle = screen.getByRole('heading', { name: /AI Chat Assistant/i });
    expect(chatTitle).toBeInTheDocument();
  });
});
