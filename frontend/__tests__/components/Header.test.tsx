import { render, screen, fireEvent } from '@testing-library/react';
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
      logOut: jest.fn() 
    });
    
    render(<Header />);
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText(/sign out/i)).not.toBeInTheDocument();
  });

  it('renders user info and sign out button when logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ 
      user: { displayName: 'John Doe', photoURL: 'http://example.com/photo.jpg', email: 'john@example.com' },
      userData: { role: 'user' },
      loading: false, 
      signInWithGoogle: jest.fn(), 
      logOut: jest.fn() 
    });
    
    render(<Header />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /john doe/i }));
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
