import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { signInWithPopup } from 'firebase/auth';
import { getDoc, setDoc } from 'firebase/firestore';

// Mock Firebase auth and firestore
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
  SAMLAuthProvider: jest.fn(),
  OAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  linkWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, cb) => { cb(null); return jest.fn(); })
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn())
}));

jest.mock('@/lib/firebase', () => ({
  auth: { tenantId: null, currentUser: { uid: '123' } },
  db: {}
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeNull();
    expect(result.current.userData).toBeNull();
  });

  it('handles Google login for new users', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'user1', email: 'test@example.com', displayName: 'Test User' }
    });
    
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(signInWithPopup).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        email: 'test@example.com',
        role: 'member',
        plan: 'free'
      })
    );
  });

  it('handles SSO login with tenant mapping', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { uid: 'user2', email: 'sso@example.com', displayName: 'SSO User' }
    });
    
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ role: 'admin', plan: 'pro', workspaces: [] })
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    
    await act(async () => {
      await result.current.signInWithSSO('saml.company', 'tenant123');
    });

    expect(signInWithPopup).toHaveBeenCalled();
    // It should merge the new tenantId into workspaces while preserving roles
    expect(setDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        tenant_id: 'tenant123',
        workspaces: ['tenant123']
      }),
      { merge: true }
    );
  });
});
