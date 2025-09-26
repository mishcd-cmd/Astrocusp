import { supabase } from './supabase';
import { absoluteRedirect } from './urls';
import type { User } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  error: { message: string } | null;
}

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[auth] getCurrentUser error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('[auth] getCurrentUser exception:', error);
    return null;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('[auth] Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('[auth] Sign in error:', error);
      return { user: null, error: { message: error.message } };
    }

    console.log('[auth] Sign in successful for:', email);
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('[auth] Sign in exception:', error);
    return { user: null, error: { message: error.message || 'Sign in failed' } };
  }
}

// Sign up with email and password
export async function signUp(
  email: string, 
  password: string, 
  name?: string, 
  birthDate?: string
): Promise<AuthResult> {
  try {
    console.log('[auth] Attempting sign up for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name?.trim(),
          birth_date: birthDate,
        },
      },
    });

    if (error) {
      console.error('[auth] Sign up error:', error);
      return { user: null, error: { message: error.message } };
    }

    console.log('[auth] Sign up successful for:', email);
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('[auth] Sign up exception:', error);
    return { user: null, error: { message: error.message || 'Sign up failed' } };
  }
}

// Sign out current user
export async function signOut(): Promise<void> {
  try {
    console.log('[auth] Signing out user...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[auth] Sign out error:', error);
      throw new Error(error.message);
    }

    console.log('[auth] Sign out successful');
  } catch (error: any) {
    console.error('[auth] Sign out exception:', error);
    throw new Error(error.message || 'Sign out failed');
  }
}

// Reset password - send reset email
export async function resetPassword(email: string): Promise<{ error: { message: string } | null }> {
  try {
    console.log('[auth] Sending password reset email to:', email);
    
    // CRITICAL: Use password-reset route instead of auth/reset for proper token handling
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://www.astrocusp.com.au';
    const redirectTo = `${siteUrl}/auth/reset`;
    
    console.log('[auth] Using redirect URL:', redirectTo);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });

    if (error) {
      console.error('[auth] Reset password error:', error);
      return { error: { message: error.message } };
    }

    console.log('[auth] Reset email sent successfully');
    return { error: null };
  } catch (error: any) {
    console.error('[auth] Reset password exception:', error);
    return { error: { message: error.message || 'Failed to send reset email' } };
  }
}

// Wait for session to be established (used after auth operations)
export async function waitForSession(maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('[auth] Session established after', i + 1, 'attempts');
        return true;
      }
    } catch (error) {
      console.warn('[auth] Session check failed, attempt', i + 1, ':', error);
    }
    
    // Wait 500ms before next attempt
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.warn('[auth] Session not established after', maxAttempts, 'attempts');
  return false;
}

// Clear local auth data (for cleanup)
export async function clearLocalAuthData(): Promise<void> {
  try {
    console.log('[auth] Clearing local auth data...');
    
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear Supabase auth session
      window.localStorage.removeItem('astro-cusp-auth-session');
      
      // Clear any other auth-related items
      const keys = Object.keys(window.localStorage);
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session')
      );
      
      authKeys.forEach(key => {
        window.localStorage.removeItem(key);
      });
      
      console.log('[auth] Cleared', authKeys.length, 'auth-related localStorage items');
    }
  } catch (error) {
    console.error('[auth] Error clearing local auth data:', error);
  }
}

// Check if user has valid session
export async function hasValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[auth] Session check error:', error);
      return false;
    }
    
    return !!session?.access_token;
  } catch (error) {
    console.error('[auth] Session check exception:', error);
    return false;
  }
}

// Refresh current session
export async function refreshSession(): Promise<boolean> {
  try {
    console.log('[auth] Refreshing session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[auth] Session refresh error:', error);
      return false;
    }
    
    console.log('[auth] Session refreshed successfully');
    return !!data.session;
  } catch (error) {
    console.error('[auth] Session refresh exception:', error);
    return false;
  }
}