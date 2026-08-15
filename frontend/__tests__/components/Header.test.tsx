import { render, screen } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { useAuth } from '../../src/hooks/useAuth';

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('Header Component', () => {
  it('renders sign in button when logged out', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: null, 
      loading: false, 
      signInWithGoogle: jest.fn(), 
      logout: jest.fn() 
    });
    
    render(<Header />);
    
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('renders user info and sign out button when logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { displayName: 'John Doe', photoURL: 'http://example.com/photo.jpg' }, 
      loading: false, 
      signInWithGoogle: jest.fn(), 
      logout: jest.fn() 
    });
    
    render(<Header />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign in with Google/i)).not.toBeInTheDocument();
  });
});
