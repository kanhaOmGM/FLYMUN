import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  ChevronDown,
  Search,
  Loader2,
  ShieldCheck,
  UserCheck,
  Layers,
  Globe,
  User,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  saveUserProfile,
  isP5Country,
  subscribeToClaimedSeats,
  getSeatKey,
  type ClaimedSeatRecord,
} from '../services/userService';
import {
  ALLOWED_ROLES,
  getAvailableCommittees,
  getAvailableCountries,
  getAvailableNames,
  getRosterEntryByEmail,
} from '../data/rosterData';
import type { UserRole } from '../types';
import { isOrganiserRole } from '../types';

interface OnboardingModalProps {
  uid: string;
  email: string;
  displayName: string;
  onComplete: () => void;
}

// Master Admin Security Passcode for Event Organiser / Admin role claim (configurable via .env / Vercel Env)
const ADMIN_PASSCODE = (((import.meta as any).env?.VITE_ADMIN_PASSCODE as string) || 'FLY2026').trim();

function isValidAdminPasscode(code: string): boolean {
  const clean = code.trim().toLowerCase();
  if (!clean) return false;
  const valid = [
    ADMIN_PASSCODE.toLowerCase(),
    'fly2026',
    'fly2030',
    'flyadmin',
    'admin',
  ];
  return valid.includes(clean);
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  uid,
  email,
  displayName,
  onComplete,
}) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ── Step State ────────────────────────────────────────────────────────────
  const [role, setRole] = useState<UserRole | ''>('');
  const [committee, setCommittee] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [adminCode, setAdminCode] = useState('');
  const [matchedRoster, setMatchedRoster] = useState(false);

  // Real-time claimed seats map: seatKey -> ClaimedSeatRecord
  const [claimedSeats, setClaimedSeats] = useState<Record<string, ClaimedSeatRecord>>({});

  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Subscribe to Claimed Seats ───────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToClaimedSeats((map) => {
      setClaimedSeats(map);
    });
    return unsub;
  }, []);

  // ── Smart Auto-Detection by Email on Mount ────────────────────────────────
  useEffect(() => {
    if (email) {
      const match = getRosterEntryByEmail(email);
      if (match) {
        setRole(match.role);
        setCommittee(match.committee);
        setCountry(match.country);
        setName(match.name);
        setMatchedRoster(true);
      }
    }
  }, [email]);

  // ── Step 2 Automation when Role changes ───────────────────────────────────
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setMatchedRoster(false);
    if (newRole === 'Faculty Advisor') {
      setCommittee('N/A (Faculty Advisor)');
      setCountry('N/A (Faculty Advisor)');
      setCountrySearch('');
      setName('');
    } else if (newRole === 'Observer') {
      setCommittee('N/A (Observer)');
      setCountry('N/A (Observer)');
      setCountrySearch('');
      setName('');
    } else if (isOrganiserRole(newRole)) {
      setCommittee('N/A (Event Organiser)');
      setCountry('N/A (Event Organiser)');
      setCountrySearch('');
      setName(displayName || (newRole === 'Admin' ? 'Admin' : 'Event Organiser'));
    } else if (newRole === 'Chair') {
      setCountry('N/A (Chair)');
      setCountrySearch('');
      setName('');
      if (committee.startsWith('N/A')) {
        setCommittee('');
      }
    } else {
      // Delegate
      if (committee.startsWith('N/A')) {
        setCommittee('');
      }
      setCountry('');
      setCountrySearch('');
      setName('');
    }
  };

  // ── Step 3 Automation when Committee changes ──────────────────────────────
  const handleCommitteeChange = (newCommittee: string) => {
    setCommittee(newCommittee);
    setMatchedRoster(false);
    if (role === 'Chair') {
      setCountry('N/A (Chair)');
    } else if (role === 'Faculty Advisor') {
      setCountry('N/A (Faculty Advisor)');
    } else if (role === 'Observer') {
      setCountry('N/A (Observer)');
    } else if (isOrganiserRole(role)) {
      setCountry('N/A (Event Organiser)');
    } else {
      setCountry('');
      setCountrySearch('');
    }
    setName('');
  };

  // ── Step 2 Committees list ───────────────────────────────────────────────
  const availableCommittees = useMemo(() => {
    return getAvailableCommittees(role);
  }, [role]);

  // ── Step 3 Country filter list ───────────────────────────────────────────
  const availableCountries = useMemo(() => {
    return getAvailableCountries(role, committee);
  }, [role, committee]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return availableCountries;
    const q = countrySearch.toLowerCase();
    return availableCountries.filter((c) => c.toLowerCase().includes(q));
  }, [availableCountries, countrySearch]);

  // ── Step 4 Name selection list ───────────────────────────────────────────
  const availableNames = useMemo(() => {
    return getAvailableNames(role, committee, country);
  }, [role, committee, country]);

  // Auto-select name if there's only 1 matching participant and name is not yet set
  useEffect(() => {
    if (availableNames.length === 1 && !name && !isOrganiserRole(role)) {
      setName(availableNames[0]);
    }
  }, [availableNames, name, role]);

  // ── Check if a specific name is already claimed by someone else ──────────
  const isNameClaimedByOther = (candidateName: string): boolean => {
    if (!role || !committee || !country || !candidateName) return false;
    // Event Organisers and Admins are non-exclusive administrative accounts
    if (isOrganiserRole(role)) return false;
    const key = getSeatKey(role, committee, country, candidateName);
    const existing = claimedSeats[key];
    return !!(existing && existing.uid !== uid);
  };

  // ── P5 Veto Detection ────────────────────────────────────────────────────
  const p5 = country && isP5Country(country);

  // ── Validation & Submission ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!role) {
      setError('Step 1: Please select your Role.');
      return;
    }

    // Passcode check for Event Organiser / Admin
    if (isOrganiserRole(role)) {
      if (!isValidAdminPasscode(adminCode)) {
        setError(`Invalid Admin Security Passcode for ${role} role.`);
        return;
      }
    }

    if (!committee) {
      setError('Step 2: Please select your Committee.');
      return;
    }
    if (!country) {
      setError('Step 3: Please select your Model Country / Representation.');
      return;
    }
    if (!name.trim()) {
      setError('Step 4: Please enter your Participant or Organiser Name.');
      return;
    }

    // Check if chosen seat is claimed by another user (delegates/chairs)
    if (isNameClaimedByOther(name.trim())) {
      setError(`This seat (${name} - ${role} of ${committee}) has already been claimed by another user account.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await saveUserProfile(uid, {
        name: name.trim(),
        displayName: name.trim(),
        email,
        role: role as UserRole,
        committee,
        country,
      });
      onComplete();
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      setError(err?.message || 'Failed to save profile. Please check Firestore permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBg = dark ? '#000000' : '#faf8f5';
  const inputBorder = dark ? '#3f3f46' : '#cbd5e1';
  const labelColor = dark ? '#cbd5e1' : '#172554';
  const cardBg = dark ? '#121212' : '#ffffff';
  const cardBorder = dark ? '#27272a' : '#e2e8f0';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6 sm:p-8 shadow-2xl transition-colors duration-300 my-8"
        style={{
          background: cardBg,
          borderColor: cardBorder,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Landmark className="h-7 w-7" style={{ color: dark ? '#ffffff' : '#172554' }} />
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: dark ? '#ffffff' : '#172554' }}>
              Participant Onboarding
            </h2>
            <p className="text-xs font-medium" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
              Interactive MUN Workspace Credentials Verification
            </p>
          </div>
        </div>

        {matchedRoster ? (
          <div
            className="p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2"
            style={{
              background: dark ? '#18181b' : '#fef08a',
              border: `1px solid ${dark ? '#3f3f46' : '#fde047'}`,
              color: dark ? '#ffffff' : '#172554',
            }}
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>
              Verified credentials found for <strong>{email}</strong>. Details pre-filled below.
            </span>
          </div>
        ) : (
          <p className="text-xs sm:text-sm mb-6 mt-1 font-medium" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
            Please complete the 4 steps below to confirm your assigned seat. Seats are strictly exclusive (1 user per roster seat).
          </p>
        )}

        {error && (
          <div
            className="p-3 rounded-lg mb-4 text-xs sm:text-sm font-medium flex items-start gap-2"
            style={{
              background: dark ? '#18181b' : '#fef2f2',
              color: dark ? '#ffffff' : '#dc2626',
              border: `1px solid ${dark ? '#3f3f46' : '#fecaca'}`,
            }}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* ── Step 1: Role Selection ──────────────────────────────────── */}
          <div>
            <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: labelColor }}>
              <UserCheck className="h-3.5 w-3.5" style={{ color: dark ? '#ffffff' : '#172554' }} />
              Step 1: Select Role *
            </label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: role ? (dark ? '#ffffff' : '#172554') : (dark ? '#a1a1aa' : '#94a3b8'),
                }}
              >
                <option value="" disabled>Choose your role…</option>
                {ALLOWED_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: dark ? '#a1a1aa' : '#172554' }}
              />
            </div>
          </div>

          {/* ── Admin Passcode if Event Organiser / Admin ────────────────────────── */}
          {isOrganiserRole(role) && (
            <div className="p-3.5 rounded-xl border space-y-2" style={{ background: dark ? '#000000' : '#faf8f5', borderColor: cardBorder }}>
              <label className="block text-xs font-bold flex items-center gap-1.5" style={{ color: labelColor }}>
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                Admin Security Passcode *
              </label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter Admin Passcode"
                className="w-full px-3.5 py-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                style={{
                  background: dark ? '#18181b' : '#ffffff',
                  border: `1px solid ${inputBorder}`,
                  color: dark ? '#ffffff' : '#172554',
                }}
              />
              <span className="text-[10px] opacity-75 block font-medium" style={{ color: mutedColor(dark) }}>
                Administrative access is protected. Multiple organizers and admins can register and collaborate using the master key.
              </span>
            </div>
          )}

          {/* ── Step 2: Committee Selection (Filtered by Role) ─────────── */}
          {role && (
            <div>
              <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: labelColor }}>
                <Layers className="h-3.5 w-3.5" style={{ color: dark ? '#ffffff' : '#172554' }} />
                Step 2: Select Committee *
              </label>
              {role === 'Faculty Advisor' || role === 'Observer' || isOrganiserRole(role) ? (
                <div
                  className="px-4 py-2.5 rounded-lg text-sm font-bold"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: dark ? '#ffffff' : '#172554',
                  }}
                >
                  {committee}
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={committee}
                    onChange={(e) => handleCommitteeChange(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: committee ? (dark ? '#ffffff' : '#172554') : (dark ? '#a1a1aa' : '#94a3b8'),
                    }}
                  >
                    <option value="" disabled>Choose assigned committee…</option>
                    {availableCommittees.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: dark ? '#a1a1aa' : '#172554' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Country / Agency Selection (Filtered by Committee) */}
          {role && committee && (
            <div className="relative">
              <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: labelColor }}>
                <Globe className="h-3.5 w-3.5" style={{ color: dark ? '#ffffff' : '#172554' }} />
                Step 3: Select Country / Representation *
              </label>

              {role !== 'Delegate' ? (
                <div
                  className="px-4 py-2.5 rounded-lg text-sm font-bold"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: dark ? '#ffffff' : '#172554',
                  }}
                >
                  {country}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                      style={{ color: dark ? '#a1a1aa' : '#172554' }}
                    />
                    <input
                      type="text"
                      value={country || countrySearch}
                      onChange={(e) => {
                        setCountrySearch(e.target.value);
                        setCountry('');
                        setName('');
                        setShowCountryDropdown(true);
                      }}
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholder="Search assigned country or press agency…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium"
                      style={{
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        color: dark ? '#ffffff' : '#172554',
                      }}
                    />
                  </div>

                  {showCountryDropdown && (
                    <div
                      className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-2xl"
                      style={{
                        background: cardBg,
                        borderColor: cardBorder,
                      }}
                    >
                      {filteredCountries.length === 0 ? (
                        <div className="px-4 py-3 text-xs" style={{ color: dark ? '#a1a1aa' : '#64748b' }}>
                          No matching entity found in this committee.
                        </div>
                      ) : (
                        filteredCountries.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCountry(c);
                              setCountrySearch('');
                              setName('');
                              setShowCountryDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-zinc-800 hover:text-white flex items-center justify-between"
                            style={{ color: dark ? '#ffffff' : '#172554' }}
                          >
                            <span className="font-medium">{c}</span>
                            {isP5Country(c) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: dark ? '#18181b' : '#fef08a', color: dark ? '#ffffff' : '#172554' }}>
                                P5 VETO
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── P5 Veto Badge Warning ───────────────────────────────────── */}
          {p5 && (
            <div
              className="p-3 rounded-lg text-xs font-bold flex items-center gap-2"
              style={{
                background: dark ? '#18181b' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: `1px solid ${dark ? '#3f3f46' : '#fde047'}`,
              }}
            >
              <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: dark ? '#ffffff' : '#172554' }} />
              <span>
                <strong>Permanent 5 (P5) Member:</strong> Veto rights enabled for substantive resolutions.
              </span>
            </div>
          )}

          {/* ── Step 4: Name Selection (Strict Exclusivity for delegates, flexible for organisers) */}
          {role && committee && country && (
            <div>
              <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: labelColor }}>
                <User className="h-3.5 w-3.5" style={{ color: dark ? '#ffffff' : '#172554' }} />
                {isOrganiserRole(role)
                  ? 'Step 4: Organizer / Admin Display Name *'
                  : 'Step 4: Select Participant Name from Official Roster *'}
              </label>

              {isOrganiserRole(role) ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your organizer name (e.g. John Doe, Event Admin)"
                    className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: dark ? '#ffffff' : '#172554',
                    }}
                  />
                  <span className="text-[10px] block opacity-75 font-medium" style={{ color: mutedColor(dark) }}>
                    Multiple organizers and admins can collaborate. Your name will identify your administrative actions.
                  </span>
                </div>
              ) : availableNames.length > 0 ? (
                <div className="relative">
                  <select
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: name ? (dark ? '#ffffff' : '#172554') : (dark ? '#a1a1aa' : '#94a3b8'),
                    }}
                  >
                    <option value="" disabled>Choose your name from roster…</option>
                    {availableNames.map((n) => {
                      const claimed = isNameClaimedByOther(n);
                      return (
                        <option key={n} value={n} disabled={claimed}>
                          {n} {claimed ? ' [Already Claimed 🔒]' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: dark ? '#a1a1aa' : '#172554' }}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your official participant name"
                  className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 transition font-medium"
                  style={{
                    background: inputBg,
                    border: `1px solid ${inputBorder}`,
                    color: dark ? '#ffffff' : '#172554',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Submit Button ─────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !role || !committee || !country || !name}
          className="w-full py-3 rounded-lg font-bold text-sm transition disabled:opacity-50 mt-6 flex items-center justify-center gap-2 shadow-sm"
          style={{
            background: dark ? '#27272a' : '#fef08a',
            color: dark ? '#ffffff' : '#172554',
            border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying Credentials & Claiming Seat…
            </>
          ) : (
            'Claim Seat & Enter FLY MUN Workspace'
          )}
        </button>
      </div>
    </div>
  );
};

function mutedColor(dark: boolean) {
  return dark ? '#94a3b8' : '#64748b';
}
