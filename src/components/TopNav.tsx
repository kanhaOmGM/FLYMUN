import React, { useState } from 'react';
import {
  LogOut,
  User,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';
import { isOrganiserRole } from '../types';

export type TabId = 'home' | 'mun' | 'gallery' | 'about';

interface TopNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  profile?: UserProfile | null;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, setActiveTab, profile }) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const dark = theme === 'dark';

  const [showSupportModal, setShowSupportModal] = useState(false);

  const tabs: { id: TabId; label: string; icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: 'mun', label: 'MUN Hosting' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'about', label: 'About Us', icon: Info },
  ];

  const handleTabClick = (id: TabId) => {
    setActiveTab(id);
    const newHash = id === 'home' ? '#/' : `#/${id}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  };

  // Dark mode strictly uses grey, black and white
  const roleBadgeColor = dark ? '#ffffff' : '#172554';
  const panelBg = dark ? '#000000' : '#ffffff';
  const panelBorder = dark ? '#27272a' : '#e2e8f0';

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b transition-colors duration-300 shadow-sm"
        style={{
          background: panelBg,
          borderColor: panelBorder,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Top Left Text Brand: FLY MUN (Redirects to Homepage) */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <button
                onClick={() => handleTabClick('home')}
                className={`font-serif text-2xl sm:text-3xl tracking-tight cursor-pointer hover:opacity-80 transition-all select-none flex-shrink-0 ${activeTab === 'home' ? 'font-normal' : 'font-normal opacity-85'
                  }`}
                style={{ color: dark ? '#ffffff' : '#172554' }}
                title="Return to FLY MUN Homepage"
              >
                FLY MUN
              </button>

              {/* Active User Badge */}
              {profile && profile.isOnboarded && (
                <div
                  className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border truncate max-w-md"
                  style={{
                    background: dark ? '#18181b' : '#fef08a33',
                    borderColor: dark ? '#3f3f46' : '#fde047',
                    color: dark ? '#ffffff' : '#172554',
                  }}
                >
                  <User className="h-3.5 w-3.5 flex-shrink-0" style={{ color: dark ? '#ffffff' : '#172554' }} />
                  <span className="font-bold truncate">{profile.name || profile.displayName}</span>
                  <span style={{ color: dark ? '#52525b' : '#94a3b8' }}>|</span>
                  <span style={{ color: roleBadgeColor }}>{profile.role}</span>
                  {!isOrganiserRole(profile.role) && (
                    <>
                      <span style={{ color: dark ? '#52525b' : '#94a3b8' }}>|</span>
                      <span className="truncate" style={{ color: dark ? '#d4d4d8' : '#1e3a8a' }}>
                        {profile.committee === 'Not Applicable' ? 'N/A' : profile.committee.split('(')[1]?.replace(')', '') || profile.committee}
                      </span>
                      <span style={{ color: dark ? '#52525b' : '#94a3b8' }}>|</span>
                      <span className="truncate font-bold" style={{ color: dark ? '#ffffff' : '#172554' }}>
                        {profile.country.startsWith('N/A') ? 'N/A' : profile.country}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Nav tabs & Actions */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              {tabs.map(({ id, label, icon: TabIcon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTabClick(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 ${isActive ? 'font-bold' : 'font-medium opacity-70 hover:opacity-100'
                      }`}
                    style={{
                      background: 'transparent',
                      color: isActive
                        ? (dark ? '#ffffff' : '#172554')
                        : (dark ? '#a1a1aa' : '#64748b'),
                      border: '1px solid transparent',
                    }}
                  >
                    {TabIcon && (
                      <TabIcon
                        className="h-3.5 w-3.5 flex-shrink-0"
                        style={{
                          color: isActive
                            ? (dark ? '#ffffff' : '#172554')
                            : (dark ? '#a1a1aa' : '#64748b'),
                        }}
                      />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="ml-1 px-2.5 py-1.5 rounded-lg font-mono text-xs transition-all duration-200 flex items-center justify-center"
                style={{
                  background: dark ? '#18181b' : '#faf8f5',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #e2e8f0',
                }}
              >
                {dark ? 'LIGHT' : 'DARK'}
              </button>

              {/* Sign out */}
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center"
                style={{
                  background: dark ? '#18181b' : '#faf8f5',
                  color: dark ? '#ffffff' : '#dc2626',
                  border: dark ? '1px solid #3f3f46' : '1px solid #e2e8f0',
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Contact Support Button (Positioned to the RIGHT of Logout) */}
              <button
                onClick={() => setShowSupportModal(true)}
                className="px-2.5 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 shadow-sm ml-1"
                style={{
                  background: dark ? '#18181b' : '#faf8f5',
                  color: dark ? '#ffffff' : '#172554',
                  border: `1px solid ${dark ? '#3f3f46' : '#cbd5e1'}`,
                }}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Support</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Contact Support Modal ────────────────────────────────────────── */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl transition-colors duration-300 relative"
            style={{
              background: dark ? '#121212' : '#ffffff',
              borderColor: panelBorder,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background: dark ? '#18181b' : '#fef08a',
                    border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                  }}
                >
                  <HelpCircle className="h-5 w-5" style={{ color: dark ? '#ffffff' : '#172554' }} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    FLY MUN Support & Secretariat
                  </h3>
                  <p className="text-xs font-medium" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
                    24/7 Conference Assistance & Secretariat Desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-lg hover:opacity-75 transition"
                style={{ color: dark ? '#a1a1aa' : '#475569' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-6">
              <div className="p-4 rounded-2xl border flex items-start gap-3.5" style={{ background: dark ? '#000000' : '#faf8f5', borderColor: panelBorder }}>
                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: dark ? '#ffffff' : '#172554' }} />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    Official Secretariat Email
                  </h4>
                  <p className="text-xs font-mono mt-0.5" style={{ color: dark ? '#d4d4d8' : '#1e3a8a' }}>
                    support@flymun.org
                  </p>
                  <p className="text-[11px] mt-1 font-medium" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
                    For roster queries, credential verification, and general conference inquiries.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-start gap-3.5" style={{ background: dark ? '#000000' : '#faf8f5', borderColor: panelBorder }}>
                <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: dark ? '#ffffff' : '#172554' }} />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    Live Delegate Helpdesk
                  </h4>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: dark ? '#d4d4d8' : '#334155' }}>
                    Reach out to your Committee Chair or the Event Organiser via the Interactive MUN Workspace.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-start gap-3.5" style={{ background: dark ? '#000000' : '#faf8f5', borderColor: panelBorder }}>
                <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: dark ? '#ffffff' : '#172554' }} />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    Interactive MUN Platform Support
                  </h4>
                  <p className="text-[11px] font-medium" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
                    Having trouble claiming your seat or accessing your account? Use the "Login with Link" tool on the sign-in page or contact the Event Organiser.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-3 rounded-xl font-extrabold text-sm shadow-sm transition"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              Close Helpdesk
            </button>
          </div>
        </div>
      )}
    </>
  );
};