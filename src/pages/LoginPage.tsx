import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ImageIcon,
  Gavel,
  Mail,
  Lock,
  User,
  AlertCircle,
  Rocket,
  KeyRound,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  X,
  Loader2,
  Globe2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, sendPasswordReset, error, clearError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const authFormRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartHere = () => {
    clearError();
    setIsRegister(true);
    if (authFormRef.current) {
      authFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => emailInputRef.current?.focus(), 150);
  };

  const handleLoginClick = () => {
    clearError();
    setIsRegister(false);
    if (authFormRef.current) {
      authFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => emailInputRef.current?.focus(), 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (isRegister) {
      await signUp(email, password, displayName);
    } else {
      await signIn(email, password);
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    await signInWithGoogle();
    setSubmitting(false);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      await sendPasswordReset(resetEmail.trim());
      setResetSuccess(`Password reset email sent to ${resetEmail.trim()}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send password reset email. Please verify the address.');
    } finally {
      setResetLoading(false);
    }
  };

  // Instagram-style two sections: Left Black Background, Right Grey Background
  const rightBg = dark ? '#0f172a' : '#f1f5f9';
  const rightBorder = dark ? '#334155' : '#cbd5e1';
  const rightCardBg = dark ? '#0a1128' : '#ffffff';

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden">

      {/* ── LEFT SECTION (Black Background - Full Viewport Fill Hero) ──────── */}
      <div
        className="lg:col-span-7 bg-black text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-800 min-h-screen"
        style={{ background: '#000000' }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider shadow-sm bg-zinc-900 border border-zinc-700 text-zinc-300"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OFFICIAL CONFERENCE PORTAL
          </span>

          <button
            onClick={toggleTheme}
            className="text-xs font-mono px-3 py-1.5 rounded-lg transition-colors border border-slate-800 hover:bg-slate-900 text-zinc-300 cursor-pointer"
          >
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Viewport-Filling Hero Section */}
        <div className="my-auto py-6 sm:py-10 space-y-4">
          <h1 className="font-serif text-6xl sm:text-8xl md:text-9xl lg:text-[9.5rem] xl:text-[11.5rem] font-normal tracking-tighter leading-[0.82] text-white select-none">
            FL.Y <span className="italic font-normal">MUN</span>
          </h1>

          <p className="font-serif italic text-xl sm:text-2xl md:text-3xl lg:text-4xl text-zinc-200 font-medium leading-snug tracking-tight max-w-2xl">
            Future Leaders. Youth International Model UN
          </p>

          <p className="text-sm sm:text-base font-normal text-zinc-400 max-w-xl leading-relaxed">
            Fostering diplomatic excellence, specialized committee debate, and next-generation global Leaders.hip.
          </p>

          {/* Action Buttons Directly Under Subheadings */}
          {/* <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={handleStartHere}
              className="py-3.5 px-7 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition duration-200 hover:opacity-95 shadow-md active:scale-95 cursor-pointer"
              style={{
                background: isRegister ? '#172554' : '#fef08a',
                color: isRegister ? '#ffffff' : '#172554',
                border: isRegister ? '1px solid #475569' : '1px solid #fde047',
              }}
            >
              <Rocket className="h-4 w-4" />
              <span>Start Here</span>
            </button>

            <button
              onClick={handleLoginClick}
              className="py-3.5 px-7 rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition duration-200 hover:opacity-95 shadow-md active:scale-95 cursor-pointer"
              style={{
                background: !isRegister ? '#1e293b' : '#000000',
                color: '#ffffff',
                border: '1px solid #475569',
              }}
            >
              <KeyRound className="h-4 w-4" />
              <span>Login</span>
            </button>
          </div> */}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>FL.Y MUN </span>
          <span>DIPLOMACY IN ACTION</span>
        </div>
      </div>

      {/* ── RIGHT SECTION (Grey Background like Instagram Split View) ─────── */}
      <div
        ref={authFormRef}
        className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-center transition-colors duration-300 min-h-screen"
        style={{
          background: rightBg,
        }}
      >
        <div
          className="w-full max-w-md mx-auto rounded-3xl border p-8 shadow-xl transition-colors duration-300"
          style={{
            background: rightCardBg,
            borderColor: rightBorder,
          }}
        >
          <div className="mb-6">
            <h2
              className="font-serif text-3xl sm:text-4xl font-normal mb-1.5 tracking-tight"
              style={{ color: dark ? '#ffffff' : '#172554' }}
            >
              {isRegister ? 'Register Account' : 'Sign In'}
            </h2>
            <p
              className="text-xs sm:text-sm font-normal"
              style={{ color: dark ? '#a1a1aa' : '#475569' }}
            >
              {isRegister
                ? 'Create credentials to Join Our MUN'
                : 'Welcome back! Sign in to Join Us.'}
            </p>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 p-3.5 rounded-xl mb-4 text-xs font-bold"
              style={{
                background: dark ? '#18181b' : '#fef2f2',
                color: dark ? '#ffffff' : '#dc2626',
                border: `1px solid ${dark ? '#3f3f46' : '#fecaca'}`,
              }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: dark ? '#cbd5e1' : '#172554' }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: dark ? '#a1a1aa' : '#172554' }}
                  />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                    style={{
                      background: dark ? '#000000' : '#faf8f5',
                      border: `1px solid ${dark ? '#3f3f46' : '#cbd5e1'}`,
                      color: dark ? '#ffffff' : '#172554',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-xs font-bold mb-1.5"
                style={{ color: dark ? '#cbd5e1' : '#172554' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: dark ? '#a1a1aa' : '#172554' }}
                />
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium"
                  style={{
                    background: dark ? '#000000' : '#faf8f5',
                    border: `1px solid ${dark ? '#3f3f46' : '#cbd5e1'}`,
                    color: dark ? '#ffffff' : '#172554',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-xs font-bold"
                  style={{ color: dark ? '#cbd5e1' : '#172554' }}
                >
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSuccess(null);
                      setResetError(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold transition hover:underline"
                    style={{ color: dark ? '#cbd5e1' : '#172554' }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: dark ? '#94a3b8' : '#172554' }}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-yellow-300 font-medium"
                  style={{
                    background: dark ? '#000000' : '#faf8f5',
                    border: `1px solid ${dark ? '#475569' : '#cbd5e1'}`,
                    color: dark ? '#ffffff' : '#172554',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-extrabold text-sm transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 mt-2"
              style={{
                background: dark ? '#172554' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #475569' : '1px solid #fde047',
              }}
            >
              <span>{submitting ? 'Please wait…' : isRegister ? 'Register' : 'Sign In'}</span>

            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: dark ? '#334155' : '#e2e8f0' }} />
            <span className="text-xs font-medium" style={{ color: dark ? '#94a3b8' : '#64748b' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: dark ? '#334155' : '#e2e8f0' }} />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm"
            style={{
              background: dark ? '#000000' : '#faf8f5',
              border: `1px solid ${dark ? '#475569' : '#cbd5e1'}`,
              color: dark ? '#ffffff' : '#172554',
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google Authentication
          </button>

          <p
            className="text-center text-xs sm:text-sm mt-6 font-medium"
            style={{ color: dark ? '#94a3b8' : '#64748b' }}
          >
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                clearError();
                setIsRegister(!isRegister);
              }}
              className="font-extrabold transition hover:underline ml-1"
              style={{ color: dark ? '#ffffff' : '#172554' }}
            >
              {isRegister ? 'Sign in here' : 'Register here'}
            </button>
          </p>

          {/* Admin / Organiser Access Note */}
          <div
            className="mt-5 p-3 rounded-2xl border text-center transition-colors"
            style={{
              background: dark ? '#18181b' : '#faf8f5',
              borderColor: rightBorder,
            }}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-semibold" style={{ color: dark ? '#d4d4d8' : '#1e3a8a' }}>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
              <span>Event Organiser & Admin Access</span>
            </div>
            <p className="text-[10px] mt-1 font-medium" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
              Multiple organizers & admins can sign in with individual accounts and enter the admin security key during onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ────────────────────────────────────────── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl transition-colors duration-300"
            style={{
              background: rightCardBg,
              borderColor: rightBorder,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-6 w-6" style={{ color: dark ? '#ffffff' : '#172554' }} />
                <h3 className="text-xl font-extrabold" style={{ color: dark ? '#ffffff' : '#172554' }}>
                  Reset Your Password
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg hover:opacity-75 transition"
                style={{ color: dark ? '#94a3b8' : '#475569' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm mb-4 font-medium" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
              Enter your registered email address below. We'll send you an official password reset link.
            </p>

            {resetSuccess && (
              <div
                className="p-3.5 rounded-xl mb-4 text-xs font-bold flex items-start gap-2"
                style={{
                  background: dark ? '#0e1a38' : '#ecfdf5',
                  color: dark ? '#ffffff' : '#065f46',
                  border: `1px solid ${dark ? '#475569' : '#a7f3d0'}`,
                }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div
                className="p-3.5 rounded-xl mb-4 text-xs font-bold flex items-start gap-2"
                style={{
                  background: dark ? '#0e1a38' : '#fef2f2',
                  color: dark ? '#ffffff' : '#dc2626',
                  border: `1px solid ${dark ? '#475569' : '#fecaca'}`,
                }}
              >
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{ color: dark ? '#cbd5e1' : '#172554' }}
                >
                  Account Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-yellow-300 font-medium"
                  style={{
                    background: dark ? '#000000' : '#faf8f5',
                    border: `1px solid ${dark ? '#475569' : '#cbd5e1'}`,
                    color: dark ? '#ffffff' : '#172554',
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition"
                  style={{
                    background: dark ? '#000000' : '#faf8f5',
                    borderColor: rightBorder,
                    color: dark ? '#94a3b8' : '#475569',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2"
                  style={{
                    background: dark ? '#172554' : '#fef08a',
                    color: dark ? '#ffffff' : '#172554',
                    border: dark ? '1px solid #475569' : '1px solid #fde047',
                  }}
                >
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
