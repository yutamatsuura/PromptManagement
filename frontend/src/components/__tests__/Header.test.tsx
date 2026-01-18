/**
 * Header コンポーネントテスト
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { Header } from '../Header';

describe('Header', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('PromptManagement')).toBeInTheDocument();
  });

  it('renders app name', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('PromptManagement')).toBeInTheDocument();
  });
});
