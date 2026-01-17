/**
 * Header コンポーネントテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { Header } from '../Header';

describe('Header', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header showMenuIcon={false} />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('PromptManagement')).toBeInTheDocument();
  });

  it('shows menu icon when showMenuIcon is true', () => {
    const mockOnMenuClick = vi.fn();
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header showMenuIcon={true} onMenuClick={mockOnMenuClick} />
        </AuthProvider>
      </BrowserRouter>
    );
    const menuButton = screen.getByLabelText('open drawer');
    expect(menuButton).toBeInTheDocument();
  });
});
