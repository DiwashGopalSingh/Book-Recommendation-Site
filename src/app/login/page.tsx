'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthTabs } from '@/components/auth';
import { DUMMY_ACCOUNT, signInUser, signUpUser, checkIsAuthenticated, getCurrentUser, logoutUser } from '@/lib/auth';
import { ArrowLeft, BookOpen, ShieldCheck, Sparkles, KeyRound, Check, LogOut, ArrowRight, UserCheck } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const hasActiveSession =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('library_active_session') === 'true';

    if (hasActiveSession && checkIsAuthenticated()) {
      setIsLoggedIn(true);
      setCurrentUser(getCurrentUser());
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, []);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleToggleMode = () => {
    setIsSignUp((prev) => !prev);
    setError(null);
  };

  // 1-Click Fill Demo Account
  const handleAutoFillDemo = () => {
    setFormData({
      name: DUMMY_ACCOUNT.name,
      email: DUMMY_ACCOUNT.email,
      password: DUMMY_ACCOUNT.password,
    });
    setError(null);
    setToastMessage('Demo account credentials auto-filled!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const result = signUpUser(formData.name, formData.email, formData.password);
      if (result.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('library_active_session', 'true');
        }
        setToastMessage(`Account created! Welcome, ${result.user?.name || 'Reader'}!`);
        setTimeout(() => {
          router.push(redirectTarget);
        }, 1000);
      } else {
        setError(result.error || 'Failed to create account.');
        setLoading(false);
      }
    } else {
      const result = signInUser(formData.email, formData.password);
      if (result.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('library_active_session', 'true');
        }
        setToastMessage(`Signed in as ${result.user?.name}! Opening library...`);
        setTimeout(() => {
          router.push(redirectTarget);
        }, 800);
      } else {
        setError(result.error || 'Invalid credentials.');
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setFormData({ name: '', email: '', password: '' });
    setToastMessage('Signed out successfully.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const signInFields = {
    header: 'Sign In to Library',
    subHeader: 'Access your private reading shelves, bookmarks, and public-domain catalog.',
    errorField: error || undefined,
    fields: [
      {
        id: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'reader@library.community',
        type: 'email' as const,
        value: formData.email,
        onChange: handleInputChange('email'),
      },
      {
        id: 'password',
        label: 'Password',
        required: true,
        placeholder: '••••••••',
        type: 'password' as const,
        value: formData.password,
        onChange: handleInputChange('password'),
      },
    ],
    submitButton: loading ? 'Signing In...' : 'Sign In to Account',
    textVariantButton: "Don't have an account? Create Free Account",
  };

  const signUpFields = {
    header: 'Create Free Account',
    subHeader: 'Join the community library. 100% free, private shelves, zero tracking.',
    errorField: error || undefined,
    fields: [
      {
        id: 'name',
        label: 'Display Name / Nickname',
        required: true,
        placeholder: 'e.g. Elizabeth Bennet',
        type: 'text' as const,
        value: formData.name,
        onChange: handleInputChange('name'),
      },
      {
        id: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'reader@library.community',
        type: 'email' as const,
        value: formData.email,
        onChange: handleInputChange('email'),
      },
      {
        id: 'password',
        label: 'Password',
        required: true,
        placeholder: '•••••••• (min 6 characters)',
        type: 'password' as const,
        value: formData.password,
        onChange: handleInputChange('password'),
      },
    ],
    submitButton: loading ? 'Creating Account...' : 'Create Free Account',
    textVariantButton: 'Already have an account? Sign In',
  };

  const currentFields = isSignUp ? signUpFields : signInFields;

  return (
    <main className="relative min-h-screen w-full bg-neutral-950 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-neutral-900/95 px-4 py-3 text-sm text-teal-300 shadow-2xl backdrop-blur-md border border-teal-500/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="font-serif text-base font-bold text-white tracking-wide">
              Open Classics
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-teal-400 bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.5 rounded">
              Member Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="hidden sm:inline">Tracker-Free · Private Reading Protection</span>
        </div>
      </header>

      {/* Main Form or Already-Logged-In Banner */}
      {isLoggedIn && currentUser ? (
        <div className="relative z-30 flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-teal-500/30 bg-neutral-950/95 p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(0,0,0,0.8)] text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40">
              <UserCheck className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Currently Signed In</h2>
            <p className="mt-1 text-sm text-teal-400 font-medium">{currentUser.name}</p>
            <p className="text-xs text-neutral-400">{currentUser.email}</p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={redirectTarget}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-98 transition-all"
              >
                <span>Enter Community Library</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-neutral-900/80 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white hover:border-red-500/40 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 text-red-400" />
                <span>Switch Account / Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <AuthTabs
          formFields={currentFields}
          handleSubmit={handleSubmit}
          goTo={handleToggleMode}
        >
          {/* Dummy Account Helper Card */}
          {!isSignUp && (
            <div className="rounded-xl border border-teal-500/30 bg-teal-950/30 p-3.5 text-left backdrop-blur-sm shadow-inner transition-all hover:border-teal-500/50">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  Dummy Test Account
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400/80 bg-teal-900/50 px-1.5 py-0.5 rounded border border-teal-500/20">
                  Instant Access
                </span>
              </div>
              <div className="mt-2 text-xs text-neutral-300 space-y-0.5 font-mono">
                <p>
                  <span className="text-neutral-500">Email:</span>{' '}
                  <span className="text-teal-200 select-all">{DUMMY_ACCOUNT.email}</span>
                </p>
                <p>
                  <span className="text-neutral-500">Password:</span>{' '}
                  <span className="text-teal-200 select-all">{DUMMY_ACCOUNT.password}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 py-2 text-xs font-semibold text-teal-200 hover:text-white transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Auto-Fill Demo Credentials</span>
              </button>
            </div>
          )}
        </AuthTabs>
      )}
    </main>
  );
}

export default function DedicatedLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}
