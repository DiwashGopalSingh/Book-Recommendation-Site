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

const profileKey = 'library_user';
const preferencesKey = (email: string) => 'library_preferences_' + email;

export function getCurrentUser(): UserProfile | null {
  return JSON.parse(localStorage.getItem(profileKey) || 'null');
}

function cacheProfile(user: UserProfile | null) {
  if (user) {
    user.preferences = JSON.parse(localStorage.getItem(preferencesKey(user.email)) || 'null') ?? undefined;
    localStorage.setItem(profileKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(profileKey);
  }
  return user;
}

export async function loadCurrentUser() {
  const response = await fetch('/api/auth', { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to verify session');
  return cacheProfile((await response.json()).user);
}

async function authenticate(action: string, email: string, password: string, name?: string):
  Promise<{success: boolean; user?: UserProfile; error?: string}> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email: email.trim(), password, name }),
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.error };
    const user = cacheProfile(data.user)!;
    localStorage.setItem('library_account_change', String(Date.now()));
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
    return { success: true, user };
  } catch {
    return { success: false, error: 'Could not reach the sign-in service. Please try again.' };
  }
}

export const signInUser = (email: string, password: string) => authenticate('signin', email, password);
export const signUpUser = (name: string, email: string, password: string) => authenticate('signup', email, password, name);

export function updateUserPreferences(preferences: UserPreferences) {
  const user = getCurrentUser();
  if (!user) return null;
  localStorage.setItem(preferencesKey(user.email), JSON.stringify(preferences));
  cacheProfile(user);
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user } }));
  window.dispatchEvent(new CustomEvent('preferences-updated', { detail: { preferences } }));
  return user;
}

export async function logoutUser() {
  const response = await fetch('/api/auth', { method: 'DELETE' });
  if (!response.ok) throw new Error('Sign-out failed');
  cacheProfile(null);
  localStorage.setItem('library_account_change', String(Date.now()));
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }));
}
