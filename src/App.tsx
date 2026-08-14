import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TopNav } from './components/TopNav';
import type { TabId } from './components/TopNav';
import { LoginPage } from './pages/LoginPage';
import { OnboardingModal } from './components/OnboardingModal';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import { MUNHostingPage } from './pages/MUNHostingPage';
import { AboutPage } from './pages/AboutPage';
import { getUserProfile } from './services/userService';
import type { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Inner app that consumes both Theme and Auth contexts
// ---------------------------------------------------------------------------

function AppInner() {
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const getInitialTab = (): TabId => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'about') return 'about';
    if (path === 'gallery') return 'gallery';
    if (path === 'mun') return 'mun';
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Sync tab with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch user profile from Firestore whenever user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileChecked(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    getUserProfile(user.uid).then((p) => {
      if (cancelled) return;
      setProfile(p);
      setProfileChecked(true);
      setProfileLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setProfileChecked(true);
      setProfileLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  // ── Loading state ─────────────────────────────────────────────────────
  if (authLoading || (user && profileLoading && !profileChecked)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{
          background: theme === 'dark' ? '#000000' : '#faf8f5',
          color: theme === 'dark' ? '#ffffff' : '#172554',
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme === 'dark' ? '#94a3b8' : '#172554' }} />
      </div>
    );
  }

  // ── Not logged in → Login page or Public About page ───────────────────
  if (!user) {
    if (activeTab === 'about') {
      return (
        <AboutPage
          onBack={() => {
            setActiveTab('home');
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }
    return <LoginPage />;
  }

  // ── Logged in but no profile → Onboarding modal ──────────────────────
  const needsOnboarding = profileChecked && (!profile || !profile.isOnboarded || !profile.role || !profile.country || !profile.committee);

  // ── Main dashboard ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{
        background: theme === 'dark' ? '#000000' : '#faf8f5',
        color: theme === 'dark' ? '#ffffff' : '#172554',
      }}
    >
      {needsOnboarding && (
        <OnboardingModal
          uid={user.uid}
          email={user.email || ''}
          displayName={user.displayName || ''}
          onComplete={() => {
            // Re-fetch profile after onboarding
            getUserProfile(user.uid).then(setProfile);
          }}
        />
      )}

      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      <main className="flex-1">
        {activeTab === 'home'    && <HomePage profile={profile} />}
        {activeTab === 'mun'     && profile && <MUNHostingPage profile={profile} />}
        {activeTab === 'mun'     && !profile && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme === 'dark' ? '#94a3b8' : '#172554' }} />
          </div>
        )}
        {activeTab === 'gallery' && <GalleryPage />}
        {activeTab === 'about'   && (
          <AboutPage
            onBack={() => {
              setActiveTab('home');
              window.history.pushState({}, '', '/');
            }}
          />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App — wraps in providers
// ---------------------------------------------------------------------------

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;