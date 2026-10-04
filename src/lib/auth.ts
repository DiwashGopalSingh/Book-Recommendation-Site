/**
 * Community Library Authentication System
 * Includes session helpers and account management.
 */

export interface UserPreferences {
  genres: string[];
  interests: string[];
  readingGoal?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  avatar?: string;
  joinedDate?: string;
  preferences?: UserPreferences;
}

const AUTH_COOKIE_NAME = 'cl_session';
const USER_STORAGE_KEY = 'library_user';

/**
 * Check if the user is authenticated in the browser.
 * Requires BOTH a valid auth cookie AND a stored user profile.
 * A stale cookie alone (e.g. from a previous session) is not enough.
 */
export function checkIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  // Check cookie
  const hasCookie = document.cookie
    .split(';')
    .some((item) => item.trim().startsWith(`${AUTH_COOKIE_NAME}=`));

  // Check localStorage for a valid user object
  let hasUser = false;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      hasUser = !!(parsed?.email); // must be a real user object with an email
    }
  } catch (_) {}

  // Both must be present — a stale cookie alone won't bypass the login gate
  return hasCookie && hasUser;
}

/**
 * Clear any stale/incomplete session data (e.g. cookie without user profile, or vice versa).
 * Call this on app load to ensure a consistent auth state.
 */
export function clearStaleSession(): void {
  if (typeof window === 'undefined') return;

  const hasCookie = document.cookie
    .split(';')
    .some((item) => item.trim().startsWith(`${AUTH_COOKIE_NAME}=`));

  let hasUser = false;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      hasUser = !!(parsed?.email);
    }
  } catch (_) {}

  // If one exists without the other, clear everything for a clean state
  if (hasCookie !== hasUser) {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Retrieve current user profile
 */
export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}

  return null;
}

/**
 * Perform sign in with email and password
 */
export function signInUser(
  email: string,
  pass: string
): { success: boolean; user?: UserProfile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();

  // Check for locally registered accounts in localStorage
  if (typeof window !== 'undefined') {
    try {
      const storedAccounts = JSON.parse(
        localStorage.getItem('registered_accounts') || '[]'
      );
      const matched = storedAccounts.find(
        (acc: any) =>
          acc.email.toLowerCase() === cleanEmail && acc.password === pass
      );
      if (matched) {
        const user: UserProfile = {
          email: matched.email,
          name: matched.name || 'Community Reader',
          joinedDate: 'Recent',
          preferences: matched.preferences || undefined,
        };
        saveUserSession(user);
        return { success: true, user };
      }
    } catch (_) {}
  }

  return {
    success: false,
    error: 'Invalid email or password. Please verify your credentials or create an account.',
  };
}

/**
 * Perform sign up and auto-login
 */
export function signUpUser(
  name: string,
  email: string,
  pass: string,
  preferences?: UserPreferences
): { success: boolean; user?: UserProfile; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !pass) {
    return { success: false, error: 'Email and password are required.' };
  }

  const user: UserProfile = {
    email: cleanEmail,
    name: name.trim() || 'Community Reader',
    joinedDate: 'Today',
    preferences: preferences || undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = JSON.parse(
        localStorage.getItem('registered_accounts') || '[]'
      );
      // Remove any existing with same email
      const filtered = stored.filter((a: any) => a.email !== cleanEmail);
      filtered.push({
        name: user.name,
        email: cleanEmail,
        password: pass,
        preferences: user.preferences,
      });
      localStorage.setItem('registered_accounts', JSON.stringify(filtered));
    } catch (_) {}
  }

  saveUserSession(user);
  return { success: true, user };
}

/**
 * Update current user preferences and broadcast change
 */
export function updateUserPreferences(preferences: UserPreferences): UserProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const user: UserProfile = JSON.parse(raw);
    user.preferences = preferences;

    // Update active user session
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    // Update registered accounts list
    const stored = JSON.parse(
      localStorage.getItem('registered_accounts') || '[]'
    );
    const updated = stored.map((acc: any) => {
      if (acc.email?.toLowerCase() === user.email?.toLowerCase()) {
        return { ...acc, preferences };
      }
      return acc;
    });
    localStorage.setItem('registered_accounts', JSON.stringify(updated));

    // Notify listeners
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: { preferences } }));

    return user;
  } catch (err) {
    console.error('Failed to update user preferences:', err);
    return null;
  }
}

/**
 * Save user session to cookie and localStorage
 */
export function saveUserSession(user: UserProfile) {
  if (typeof window === 'undefined') return;

  // Set auth cookie valid for 7 days
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${maxAge}; SameSite=Lax`;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Clear session cookie and storage
 */
export function logoutUser() {
  if (typeof window === 'undefined') return;

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  localStorage.removeItem(USER_STORAGE_KEY);
}

