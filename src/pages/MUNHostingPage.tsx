import React, { useState, useEffect, useRef } from 'react';
import {
  Gavel,
  Vote,
  Clock,
  Mic,
  Users,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Hand,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileText,
  Lock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  X,
  Share2,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import type {
  UserProfile,
  VotingSession,
  CommitteeTimerState,
  SpeakerQueueItem,
  CommitteeMotion,
  RaisedHandItem,
  MUNState,
} from '../types';
import { isOrganiserRole } from '../types';
import {
  startTimer,
  pauseTimer,
  resetTimer,
  subscribeToTimer,
  addSpeakerToQueue,
  removeSpeakerFromQueue,
  setSpeakerStatus,
  clearSpeakerQueue,
  subscribeToSpeakerQueue,
  moveSpeakerInQueue,
  yieldSpeakerFloor,
  submitMotion,
  updateMotionStatus,
  deleteMotion,
  subscribeToMotions,
  subscribeToRaisedHands,
  raiseHand,
  lowerHand,
  lowerMyHand,
  clearAllRaisedHands,
} from '../services/committeeService';
import {
  createVotingSession,
  castVote,
  closeAndEvaluate,
  subscribeToSessions,
} from '../services/votingService';
import { subscribeToMUNState } from '../services/systemService';
import { AdminWorkspacePanel } from '../components/AdminWorkspacePanel';
import { COMMITTEES, type CommitteeName, ROSTER_MASTER_DATA } from '../data/rosterData';

// ---------------------------------------------------------------------------
// Sound Synthesizer: Play alert chime when timer hits zero or on test
// ---------------------------------------------------------------------------

function playTimerAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.6);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.6);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio alert could not play:', err);
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MUNHostingPageProps {
  profile: UserProfile;
}

export const MUNHostingPage: React.FC<MUNHostingPageProps> = ({ profile }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ── Global MUN Workspace Activation State ────────────────────────────────
  const [munState, setMunState] = useState<MUNState>({
    isActive: true,
    updatedAt: Date.now(),
  });

  useEffect(() => {
    const unsub = subscribeToMUNState((state) => {
      setMunState(state);
    });
    return () => unsub();
  }, []);

  // ── Role resolution ──────────────────────────────────────────────────────
  const isObserver = profile.role === 'Observer';
  const isOrganiser = isOrganiserRole(profile.role);
  const isChair = (profile.role === 'Chair' || isOrganiser) && !isObserver;
  const isDelegate = profile.role === 'Delegate' && !isObserver;

  // ── Committee Selection ──────────────────────────────────────────────────
  const [activeCommittee, setActiveCommittee] = useState<CommitteeName>(() => {
    if (COMMITTEES.includes(profile.committee as any)) {
      return profile.committee as CommitteeName;
    }
    return COMMITTEES[0];
  });

  // ── Sub-tab navigation ───────────────────────────────────────────────────
  const [workspaceTab, setWorkspaceTab] = useState<'admin' | 'debate' | 'voting' | 'roster'>(
    isOrganiser ? 'admin' : 'debate'
  );

  // ── Real-Time State ──────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [votingLoading, setVotingLoading] = useState(true);
  const [timerDoc, setTimerDoc] = useState<CommitteeTimerState | null>(null);
  const [localSeconds, setLocalSeconds] = useState(60);
  const timerExpiredPlayedRef = useRef(false);
  const [speakers, setSpeakers] = useState<SpeakerQueueItem[]>([]);
  const [speakerLoading, setSpeakerLoading] = useState(true);
  const [motions, setMotions] = useState<CommitteeMotion[]>([]);
  const [raisedHands, setRaisedHands] = useState<RaisedHandItem[]>([]);
  const [togglingHand, setTogglingHand] = useState(false);
  const [showHandsList, setShowHandsList] = useState(false);

  // ── Listeners per Active Committee ───────────────────────────────────────
  useEffect(() => {
    setVotingLoading(true);
    setSpeakerLoading(true);

    const unsubVoting = subscribeToSessions((all) => {
      setSessions(all);
      setVotingLoading(false);
    }, activeCommittee);

    const unsubTimer = subscribeToTimer(activeCommittee, (t) => {
      setTimerDoc(t);
      if (t) {
        setLocalSeconds(t.remainingSeconds);
      }
    });

    const unsubSpeakers = subscribeToSpeakerQueue(activeCommittee, (list) => {
      setSpeakers(list);
      setSpeakerLoading(false);
    });

    const unsubMotions = subscribeToMotions(activeCommittee, (mList) => {
      setMotions(mList);
    });

    const unsubHands = subscribeToRaisedHands(activeCommittee, (hands) => {
      setRaisedHands(hands);
    });

    return () => {
      unsubVoting();
      unsubTimer();
      unsubSpeakers();
      unsubMotions();
      unsubHands();
    };
  }, [activeCommittee]);

  // ── Local Synchronized Timer Tick ─────────────────────────────────────────
  useEffect(() => {
    if (!timerDoc) {
      setLocalSeconds(60);
      return;
    }

    if (!timerDoc.running) {
      setLocalSeconds(timerDoc.remainingSeconds);
      timerExpiredPlayedRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerDoc.updatedAt) / 1000);
      const remaining = Math.max(0, timerDoc.remainingSeconds - elapsed);
      setLocalSeconds(remaining);

      if (remaining === 0 && !timerExpiredPlayedRef.current) {
        timerExpiredPlayedRef.current = true;
        playTimerAlertSound();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerDoc]);

  // ── Hand Raise Toggle Handler ─────────────────────────────────────────────
  const isMyHandRaised = raisedHands.some((h) => h.uid === profile.uid);

  const handleToggleHand = async () => {
    if (togglingHand) return;
    setTogglingHand(true);
    try {
      if (isMyHandRaised) {
        await lowerMyHand(activeCommittee, profile.uid);
      } else {
        await raiseHand(activeCommittee, {
          uid: profile.uid,
          name: profile.name || profile.displayName,
          country: profile.country,
        });
      }
    } catch (err) {
      console.error('Error toggling hand raise:', err);
    } finally {
      setTogglingHand(false);
    }
  };

  // ── Dark theme palette ────────────────────────────────────────────────────
  const dividerBorder = dark ? '#27272a' : '#e2e8f0';
  const headingColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';

  const activeSpeaker = speakers.find((s) => s.status === 'speaking');
  const userInQueue = speakers.find((s) => s.uid === profile.uid && s.status === 'waiting');
  const activeOpenVote = sessions.find((s) => s.status === 'open');

  // ── Gated Lock Screen for Non-Admins if Inactive ─────────────────────────
  if (!munState.isActive && !isOrganiser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="border-t pt-12 text-center" style={{ borderColor: '#ef4444' }}>
          <div className="inline-flex p-4 rounded-2xl mb-6 border bg-red-500/10 border-red-500/30 text-red-500">
            <Lock className="h-12 w-12" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: headingColor }}>
            MUN Workspace Inactive
          </h2>

          <p className="text-sm sm:text-base font-medium max-w-lg mx-auto leading-relaxed" style={{ color: mutedText }}>
            The MUN Workspace is currently locked by the Event Organiser. Please wait for the session to be activated.
          </p>

          <div
            className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold"
            style={{ borderColor: dividerBorder, color: mutedText }}
          >
            <span>Conference: <strong>FLY Model United Nations</strong></span>
            <span>·</span>
            <span>Signed in as: <strong>{profile.name || profile.displayName} ({profile.role})</strong></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ── Active Real-Time Voting Popup / Banner (Task 7) ───────────────── */}
      {activeOpenVote && isDelegate && (
        <ActiveVoteDelegateBanner
          session={activeOpenVote}
          profile={profile}
          dark={dark}
          dividerBorder={dividerBorder}
        />
      )}

      {/* ── Committee Top Control Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b" style={{ borderColor: dividerBorder }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                background: dark ? '#18181b' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: `1px solid ${dividerBorder}`,
              }}
            >
              {profile.role} · {isObserver ? 'Read-Only Live Observer' : profile.country || 'Executive Secretariat'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Room
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight" style={{ color: headingColor }}>
            {activeCommittee} Workspace
          </h1>
        </div>

        {/* Action Controls: Hand Raise + Committee Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Delegate Hand Raise Button (Task 3) */}
          {isDelegate && (
            <button
              onClick={handleToggleHand}
              disabled={togglingHand}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                isMyHandRaised ? 'animate-bounce' : ''
              }`}
              style={{
                background: isMyHandRaised
                  ? (dark ? '#3f3f46' : '#fde047')
                  : (dark ? '#18181b' : '#ffffff'),
                color: isMyHandRaised
                  ? (dark ? '#ffffff' : '#172554')
                  : (dark ? '#ffffff' : '#172554'),
                border: `1px solid ${isMyHandRaised ? (dark ? '#71717a' : '#eab308') : dividerBorder}`,
              }}
            >
              <Hand className={`h-4 w-4 ${isMyHandRaised ? 'fill-current' : ''}`} />
              <span>{isMyHandRaised ? 'Hand Raised (Click to Lower)' : 'Raise Hand'}</span>
            </button>
          )}

          {/* Chair / Organiser Raised Hands Counter & Drawer Toggle */}
          {isChair && (
            <div className="relative">
              <button
                onClick={() => setShowHandsList(!showHandsList)}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition"
                style={{
                  background: raisedHands.length > 0 ? (dark ? '#27272a' : '#fef08a') : (dark ? '#18181b' : '#faf8f5'),
                  borderColor: raisedHands.length > 0 ? (dark ? '#3f3f46' : '#fde047') : dividerBorder,
                  color: dark ? '#ffffff' : '#172554',
                }}
              >
                <Hand className="h-3.5 w-3.5" />
                <span>{raisedHands.length} Hand{raisedHands.length !== 1 ? 's' : ''} Raised</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showHandsList && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl border p-3 z-50 space-y-2"
                  style={{
                    background: dark ? '#18181b' : '#ffffff',
                    borderColor: dividerBorder,
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: dividerBorder }}>
                    <span className="text-xs font-black uppercase" style={{ color: headingColor }}>
                      Raised Hands Queue
                    </span>
                    {raisedHands.length > 0 && (
                      <button
                        onClick={() => clearAllRaisedHands(activeCommittee)}
                        className="text-[10px] text-red-400 font-bold hover:underline"
                      >
                        Lower All
                      </button>
                    )}
                  </div>

                  {raisedHands.length === 0 ? (
                    <p className="text-xs py-3 text-center italic" style={{ color: mutedText }}>
                      No hands currently raised.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {raisedHands.map((h, idx) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-2 rounded-lg text-xs border"
                          style={{
                            background: dark ? '#27272a' : '#faf8f5',
                            borderColor: dividerBorder,
                          }}
                        >
                          <div>
                            <span className="font-bold block" style={{ color: headingColor }}>
                              #{idx + 1} {h.name}
                            </span>
                            <span className="text-[10px] font-medium" style={{ color: mutedText }}>
                              {h.country}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                await addSpeakerToQueue(activeCommittee, {
                                  uid: h.uid,
                                  name: h.name,
                                  country: h.country,
                                });
                                await lowerHand(h.id);
                              }}
                              title="Add to GSL"
                              className="px-2 py-1 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 border border-yellow-400/40 hover:bg-yellow-400/30"
                            >
                              + GSL
                            </button>
                            <button
                              onClick={() => lowerHand(h.id)}
                              title="Lower Hand"
                              className="p-1 rounded text-red-400 hover:bg-red-950"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Committee Switcher */}
          <div className="relative">
            <select
              value={activeCommittee}
              onChange={(e) => setActiveCommittee(e.target.value as CommitteeName)}
              className="appearance-none font-bold text-xs sm:text-sm pl-4 pr-10 py-2 rounded-lg transition-colors cursor-pointer"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                border: `1px solid ${dividerBorder}`,
                color: dark ? '#ffffff' : '#172554',
              }}
            >
              {COMMITTEES.map((c) => (
                <option key={c} value={c} style={{ background: dark ? '#18181b' : '#ffffff', color: dark ? '#ffffff' : '#172554' }}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: dark ? '#a1a1aa' : '#172554' }} />
          </div>
        </div>
      </div>

      {/* ── Workspace Sub-Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b pb-4 overflow-x-auto" style={{ borderColor: dividerBorder }}>
        {[
          ...(isOrganiser ? [{ id: 'admin', label: 'Admin Control Center' }] : []),
          { id: 'debate', label: 'Live Debate & Timers' },
          { id: 'voting', label: `Voting & Resolutions (${sessions.length})` },
          { id: 'roster', label: 'Committee Roster' },
        ].map(({ id, label }) => {
          const isActive = workspaceTab === id;
          return (
            <button
              key={id}
              onClick={() => setWorkspaceTab(id as any)}
              className={`text-xs sm:text-sm transition whitespace-nowrap pb-1 ${
                isActive ? 'font-bold border-b-2' : 'font-medium opacity-70 hover:opacity-100'
              }`}
              style={{
                color: isActive ? (dark ? '#ffffff' : '#172554') : mutedText,
                borderColor: isActive ? (dark ? '#ffffff' : '#172554') : 'transparent',
              }}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 0: ADMIN CONTROL CENTER ────────────────────────────────────── */}
      {workspaceTab === 'admin' && isOrganiser && (
        <AdminWorkspacePanel profile={profile} />
      )}

      {/* ── TAB 1: LIVE DEBATE & SYNCHRONIZED TIMERS (Cardless) ───────────── */}
      {workspaceTab === 'debate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT 6 COLS: Live Synced Debate Timer & Motions */}
          <div className="lg:col-span-6 space-y-10">
            <DebateTimerSection
              committeeId={activeCommittee}
              timerDoc={timerDoc}
              localSeconds={localSeconds}
              isChair={isChair}
              dark={dark}
              dividerBorder={dividerBorder}
              headingColor={headingColor}
              mutedText={mutedText}
            />

            {/* Motions Section (Task 2) */}
            <MotionsSection
              committeeId={activeCommittee}
              motions={motions}
              profile={profile}
              isChair={isChair}
              dark={dark}
              dividerBorder={dividerBorder}
              headingColor={headingColor}
              mutedText={mutedText}
              onStartTimerForMotion={async (m) => {
                await startTimer(
                  activeCommittee,
                  m.speakingTime > 0 ? m.speakingTime : m.totalTime,
                  m.totalTime,
                  m.type === 'Unmoderated Caucus' ? 'Unmoderated Caucus' : 'Moderated Caucus',
                  m.topic
                );
              }}
            />
          </div>

          {/* RIGHT 6 COLS: Persistent MyMUN-Styled General Speakers List (Task 4) */}
          <div className="lg:col-span-6 space-y-10">
            <GeneralSpeakersListSection
              committeeId={activeCommittee}
              speakers={speakers}
              speakerLoading={speakerLoading}
              profile={profile}
              isChair={isChair}
              isDelegate={isDelegate}
              userInQueue={userInQueue}
              activeSpeaker={activeSpeaker}
              dark={dark}
              dividerBorder={dividerBorder}
              headingColor={headingColor}
              mutedText={mutedText}
              onResetTimerForSpeaker={async () => {
                await resetTimer(activeCommittee, 60, 'Speaker');
              }}
            />
          </div>

        </div>
      )}

      {/* ── TAB 2: VOTING & RESOLUTIONS (Task 1 & Task 7) ─────────────────── */}
      {workspaceTab === 'voting' && (
        <div className="space-y-10">
          {/* Chair / Organiser creation panel */}
          {isChair && (
            <CreateSessionSection
              committeeId={activeCommittee}
              dark={dark}
              dividerBorder={dividerBorder}
              uid={user?.uid || ''}
              displayName={profile.name || profile.displayName}
            />
          )}

          {/* Sessions list */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black mb-6" style={{ color: headingColor }}>
              Official Voting Sessions & Motions
            </h2>

            {votingLoading ? (
              <div className="flex items-center justify-center py-16 border-t" style={{ borderColor: dividerBorder }}>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: dark ? '#ffffff' : '#172554' }} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 border-t font-medium" style={{ borderColor: dividerBorder }}>
                <p style={{ color: mutedText }}>No voting sessions active for {activeCommittee}. A Chair or Organiser can initialize one above.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    profile={profile}
                    dark={dark}
                    dividerBorder={dividerBorder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: COMMITTEE ROSTER (Task 3) ───────────────────────────────── */}
      {workspaceTab === 'roster' && (
        <CommitteeRosterSection
          activeCommittee={activeCommittee}
          raisedHands={raisedHands}
          speakers={speakers}
          dark={dark}
          dividerBorder={dividerBorder}
          headingColor={headingColor}
          mutedText={mutedText}
        />
      )}

    </div>
  );
};

// ---------------------------------------------------------------------------
// Active Vote Delegate Banner (Task 7 Live Popup)
// ---------------------------------------------------------------------------

const ActiveVoteDelegateBanner: React.FC<{
  session: VotingSession;
  profile: UserProfile;
  dark: boolean;
  dividerBorder: string;
}> = ({ session, profile, dark, dividerBorder }) => {
  const [submittingVote, setSubmittingVote] = useState(false);
  const myVote = session.votes?.[profile.uid];

  const handleVote = async (choice: 'YES' | 'NO' | 'ABSTAIN') => {
    setSubmittingVote(true);
    try {
      await castVote(session.id, {
        country: profile.country,
        displayName: profile.name || profile.displayName,
        uid: profile.uid,
        vote: choice,
        isP5: profile.isP5,
      });
    } catch (err) {
      console.error('Failed to cast vote:', err);
    } finally {
      setSubmittingVote(false);
    }
  };

  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border transition shadow-lg"
      style={{
        background: dark ? '#18181b' : '#fef08a22',
        borderColor: dark ? '#3f3f46' : '#fde047',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
              Live Committee Voting in Progress
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
              }}
            >
              {session.isSubstantive ? 'Substantive (2/3 Majority)' : 'Procedural (Simple Majority)'}
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold" style={{ color: dark ? '#ffffff' : '#172554' }}>
            "{session.title}"
          </h3>
          {session.description && (
            <p className="text-xs font-medium mt-0.5" style={{ color: dark ? '#a1a1aa' : '#475569' }}>
              {session.description}
            </p>
          )}
        </div>

        {myVote ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: dark ? '#ffffff' : '#172554' }}>
              Your Vote:
            </span>
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase border"
              style={{
                background: myVote.vote === 'YES' ? '#065f46' : myVote.vote === 'NO' ? '#7f1d1d' : '#3f3f46',
                color: '#ffffff',
                borderColor: myVote.vote === 'YES' ? '#059669' : myVote.vote === 'NO' ? '#dc2626' : '#71717a',
              }}
            >
              ✓ {myVote.vote}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVote('YES')}
              disabled={submittingVote}
              className="px-4 py-2 rounded-lg text-xs font-black uppercase text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm"
            >
              In Favor (Yes)
            </button>
            <button
              onClick={() => handleVote('NO')}
              disabled={submittingVote}
              className="px-4 py-2 rounded-lg text-xs font-black uppercase text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
            >
              Against (No)
            </button>
            {session.isSubstantive && (
              <button
                onClick={() => handleVote('ABSTAIN')}
                disabled={submittingVote}
                className="px-3 py-2 rounded-lg text-xs font-black uppercase text-zinc-300 bg-zinc-700 hover:bg-zinc-600 transition shadow-sm"
              >
                Abstain
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 1. Cardless Debate Timer Section
// ---------------------------------------------------------------------------

interface DebateTimerSectionProps {
  committeeId: string;
  timerDoc: CommitteeTimerState | null;
  localSeconds: number;
  isChair: boolean;
  dark: boolean;
  dividerBorder: string;
  headingColor: string;
  mutedText: string;
}

const DebateTimerSection: React.FC<DebateTimerSectionProps> = ({
  committeeId,
  timerDoc,
  localSeconds,
  isChair,
  dark,
  dividerBorder,
  headingColor,
  mutedText,
}) => {
  const [customMinutes, setCustomMinutes] = useState('1');
  const [customSeconds, setCustomSeconds] = useState('0');
  const [mode, setMode] = useState<'Speaker' | 'Moderated Caucus' | 'Unmoderated Caucus' | 'General'>('Speaker');
  const [topic, setTopic] = useState('');

  const isRunning = timerDoc?.running || false;
  const isExpired = localSeconds === 0;

  const total = timerDoc?.totalSeconds || 60;
  const progressPercent = total > 0 ? Math.min(100, Math.max(0, ((total - localSeconds) / total) * 100)) : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    const dur = parseInt(customMinutes, 10) * 60 + parseInt(customSeconds, 10);
    const initialSecs = localSeconds > 0 && localSeconds <= total ? localSeconds : dur > 0 ? dur : 60;
    await startTimer(committeeId, initialSecs, total > 0 ? total : initialSecs, mode, topic);
  };

  const handlePause = async () => {
    await pauseTimer(committeeId, localSeconds);
  };

  const handleReset = async (dur?: number) => {
    const targetDur = dur !== undefined ? dur : (parseInt(customMinutes, 10) * 60 + parseInt(customSeconds, 10)) || 60;
    await resetTimer(committeeId, targetDur, mode);
  };

  const setPreset = async (m: number, s: number, timerMode: typeof mode) => {
    setCustomMinutes(m.toString());
    setCustomSeconds(s.toString());
    setMode(timerMode);
    const dur = m * 60 + s;
    await resetTimer(committeeId, dur, timerMode);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
            Debate Timer
          </h3>
          <span
            className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{
              background: isRunning ? (dark ? '#18181b' : '#fef08a') : (dark ? '#000000' : '#faf8f5'),
              color: isRunning ? (dark ? '#ffffff' : '#172554') : mutedText,
              border: `1px solid ${dividerBorder}`,
            }}
          >
            {isRunning ? 'Running' : 'Paused'}
          </span>
        </div>

        <button
          onClick={playTimerAlertSound}
          title="Test Alert Chime"
          className="p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition"
          style={{
            background: dark ? '#18181b' : '#faf8f5',
            borderColor: dividerBorder,
            color: dark ? '#ffffff' : '#172554',
          }}
        >
          <Volume2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Test Bell</span>
        </button>
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 2. Timer Mode & Topic Info */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider" style={{ color: dark ? '#ffffff' : '#172554' }}>
          {timerDoc?.mode || mode}
        </span>
        {timerDoc?.topic && (
          <p className="text-xs font-medium italic mt-0.5 truncate" style={{ color: mutedText }}>
            "{timerDoc.topic}"
          </p>
        )}
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 3. Big Digital Clock Display */}
      <div className="text-center py-4">
        <div
          className="text-6xl sm:text-8xl font-mono font-black tracking-wider"
          style={{
            color: isExpired ? '#ef4444' : dark ? '#ffffff' : '#172554',
          }}
        >
          {formatTime(localSeconds)}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              background: isExpired ? '#ef4444' : dark ? '#ffffff' : '#172554',
            }}
          />
        </div>
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 4. Chair / Admin Controls */}
      {isChair ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 py-3 rounded-lg font-black text-sm flex items-center justify-center gap-2 border transition shadow-sm"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  borderColor: dark ? '#3f3f46' : '#fde047',
                }}
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex-1 py-3 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="h-4 w-4 fill-current" /> Start Timer
              </button>
            )}

            <button
              onClick={() => handleReset()}
              className="p-3 rounded-lg border font-bold transition"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                borderColor: dividerBorder,
                color: dark ? '#ffffff' : '#172554',
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '45s (GSL)', m: 0, s: 45, mode: 'Speaker' as const },
              { label: '60s (GSL)', m: 1, s: 0, mode: 'Speaker' as const },
              { label: '90s (GSL)', m: 1, s: 30, mode: 'Speaker' as const },
              { label: '5m (Mod)', m: 5, s: 0, mode: 'Moderated Caucus' as const },
              { label: '10m (Mod)', m: 10, s: 0, mode: 'Moderated Caucus' as const },
              { label: '10m (Unmod)', m: 10, s: 0, mode: 'Unmoderated Caucus' as const },
            ].map(({ label, m, s, mode: tMode }) => (
              <button
                key={label}
                onClick={() => setPreset(m, s, tMode)}
                className="text-xs px-2.5 py-1 rounded-lg border font-bold transition"
                style={{
                  background: dark ? '#18181b' : '#faf8f5',
                  borderColor: dividerBorder,
                  color: dark ? '#d4d4d8' : '#172554',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          {/* Custom Duration & Topic Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold"
                style={{ background: dark ? '#18181b' : '#faf8f5', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                Seconds
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={(e) => setCustomSeconds(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold"
                style={{ background: dark ? '#18181b' : '#faf8f5', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: dark ? '#18181b' : '#faf8f5', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
              >
                <option value="Speaker">Speaker</option>
                <option value="Moderated Caucus">Mod Caucus</option>
                <option value="Unmoderated Caucus">Unmod Caucus</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 text-xs font-medium" style={{ color: mutedText }}>
          Timer is synchronized in real-time with the Executive Board.
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Persistent MyMUN-Style General Speakers List (GSL) Section (Task 4)
// ---------------------------------------------------------------------------

interface GeneralSpeakersListSectionProps {
  committeeId: string;
  speakers: SpeakerQueueItem[];
  speakerLoading: boolean;
  profile: UserProfile;
  isChair: boolean;
  isDelegate: boolean;
  userInQueue?: SpeakerQueueItem;
  activeSpeaker?: SpeakerQueueItem;
  dark: boolean;
  dividerBorder: string;
  headingColor: string;
  mutedText: string;
  onResetTimerForSpeaker: () => Promise<void>;
}

const GeneralSpeakersListSection: React.FC<GeneralSpeakersListSectionProps> = ({
  committeeId,
  speakers,
  speakerLoading,
  profile,
  isChair,
  isDelegate,
  userInQueue,
  activeSpeaker,
  dark,
  dividerBorder,
  headingColor,
  mutedText,
  onResetTimerForSpeaker,
}) => {
  const [submittingHand, setSubmittingHand] = useState(false);
  const [manualCountry, setManualCountry] = useState('');
  const [addingSpeaker, setAddingSpeaker] = useState(false);
  const [gslError, setGslError] = useState<string | null>(null);
  const [yieldModalOpen, setYieldModalOpen] = useState(false);
  const [selectedYieldTarget, setSelectedYieldTarget] = useState('');

  // Rule 1 & Rule 3: Strictly filter candidate list to Delegates assigned to this committee (Chairs and Observers omitted)
  const activeSpeakerNames = new Set(
    speakers
      .filter((s) => s.status !== 'completed')
      .map((s) => s.name.toLowerCase().trim())
  );
  const activeSpeakerCountries = new Set(
    speakers
      .filter((s) => s.status !== 'completed')
      .map((s) => s.country.toLowerCase().trim())
  );

  const eligibleDelegates = ROSTER_MASTER_DATA.filter(
    (r) =>
      r.role === 'Delegate' &&
      r.committee === committeeId &&
      !activeSpeakerNames.has(r.name.toLowerCase().trim()) &&
      (r.country === 'Unassigned' || !activeSpeakerCountries.has(r.country.toLowerCase().trim()))
  );

  const handleAddCountryToQueue = async () => {
    if (!manualCountry) return;
    setGslError(null);
    setAddingSpeaker(true);
    const match = eligibleDelegates.find((d) => d.country === manualCountry || d.name === manualCountry);
    try {
      await addSpeakerToQueue(
        committeeId,
        {
          uid: match ? `delegate_${match.id}` : `manual_${Date.now()}`,
          name: match ? match.name : manualCountry,
          country: match ? match.country : manualCountry,
          role: 'Delegate',
          committee: committeeId,
        },
        {
          uid: profile.uid,
          role: profile.role,
          committee: profile.committee,
        }
      );
      setManualCountry('');
    } catch (err: any) {
      console.error('Failed to add speaker to GSL:', err);
      setGslError(err?.message || 'Failed to add delegate to Speakers List.');
    } finally {
      setAddingSpeaker(false);
    }
  };

  const handleNextSpeaker = async () => {
    if (activeSpeaker) {
      await setSpeakerStatus(activeSpeaker.id, 'completed');
    }
    const next = speakers.find((s) => s.status === 'waiting');
    if (next) {
      await setSpeakerStatus(next.id, 'speaking');
      await onResetTimerForSpeaker();
    }
  };

  const handleYield = async (type: 'Chair' | 'Delegate' | 'Questions') => {
    if (!activeSpeaker) return;
    await yieldSpeakerFloor(activeSpeaker.id, type, selectedYieldTarget);
    setYieldModalOpen(false);
  };

  const waitingQueue = speakers.filter((s) => s.status === 'waiting');

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
            General Speakers List (GSL)
          </h3>
          <span
            className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ background: dark ? '#18181b' : '#fef08a', color: dark ? '#ffffff' : '#172554' }}
          >
            {waitingQueue.length} in queue
          </span>
        </div>

        {isChair && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextSpeaker}
              className="text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-sm"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              Next Speaker →
            </button>
            <button
              onClick={() => {
                if (confirm('Clear the entire speakers queue for this committee?')) {
                  clearSpeakerQueue(committeeId);
                }
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border font-bold text-red-400 border-red-900/60 hover:bg-red-950 transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 2. Active Speaker Spotlight with Yields */}
      <div className="p-4 rounded-xl border" style={{ background: dark ? '#18181b' : '#faf8f5', borderColor: dividerBorder }}>
        <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1" style={{ color: mutedText }}>
          Current Floor Holder
        </span>
        {activeSpeaker ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-lg sm:text-xl" style={{ color: headingColor }}>
                  {activeSpeaker.name}
                </h4>
                <p className="text-xs font-bold" style={{ color: dark ? '#ffffff' : '#1e3a8a' }}>
                  {activeSpeaker.country}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-800 animate-pulse">
                LIVE ON FLOOR
              </span>
            </div>

            {/* Yield Indicator */}
            {activeSpeaker.yieldType && (
              <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-xs font-bold flex items-center gap-1.5" style={{ color: dark ? '#fde047' : '#854d0e' }}>
                <Share2 className="h-3.5 w-3.5" />
                <span>
                  Yielded floor to: <strong>{activeSpeaker.yieldType}</strong>
                  {activeSpeaker.yieldTarget ? ` (${activeSpeaker.yieldTarget})` : ''}
                </span>
              </div>
            )}

            {/* Yield Actions */}
            {(isChair || (isDelegate && activeSpeaker.uid === profile.uid)) && (
              <div className="pt-2 border-t flex flex-wrap items-center gap-2" style={{ borderColor: dividerBorder }}>
                <span className="text-[10px] font-bold uppercase" style={{ color: mutedText }}>
                  Yield Floor:
                </span>
                <button
                  onClick={() => handleYield('Chair')}
                  className="px-2.5 py-1 rounded text-[11px] font-bold border hover:opacity-80 transition"
                  style={{ background: dark ? '#27272a' : '#ffffff', borderColor: dividerBorder, color: headingColor }}
                >
                  To Chair
                </button>
                <button
                  onClick={() => handleYield('Questions')}
                  className="px-2.5 py-1 rounded text-[11px] font-bold border hover:opacity-80 transition"
                  style={{ background: dark ? '#27272a' : '#ffffff', borderColor: dividerBorder, color: headingColor }}
                >
                  To Questions
                </button>
                <button
                  onClick={() => setYieldModalOpen(true)}
                  className="px-2.5 py-1 rounded text-[11px] font-bold border hover:opacity-80 transition"
                  style={{ background: dark ? '#27272a' : '#ffffff', borderColor: dividerBorder, color: headingColor }}
                >
                  To Delegate…
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs font-medium italic py-2" style={{ color: mutedText }}>
            No delegate is currently on the floor.
          </p>
        )}
      </div>

      {/* Yield Target Picker Modal */}
      {yieldModalOpen && (
        <div className="p-3 rounded-xl border space-y-2" style={{ background: dark ? '#27272a' : '#ffffff', borderColor: dividerBorder }}>
          <span className="text-xs font-bold block" style={{ color: headingColor }}>
            Select delegate to yield floor to:
          </span>
          <select
            value={selectedYieldTarget}
            onChange={(e) => setSelectedYieldTarget(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: dark ? '#18181b' : '#faf8f5', border: `1px solid ${dividerBorder}`, color: headingColor }}
          >
            <option value="">-- Choose Delegate --</option>
            {eligibleDelegates.map((d) => (
              <option key={d.id} value={`${d.country} (${d.name})`}>
                {d.country !== 'Unassigned' ? `${d.country} — ${d.name}` : d.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setYieldModalOpen(false)}
              className="px-3 py-1 rounded text-xs font-bold"
              style={{ color: mutedText }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleYield('Delegate')}
              disabled={!selectedYieldTarget}
              className="px-3 py-1 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              Confirm Yield
            </button>
          </div>
        </div>
      )}

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 3. Read-Only Delegate GSL Position Indicator (Rule 2: Self-Addition Disallowed) */}
      {isDelegate && (
        <div
          className="p-3.5 rounded-xl border flex items-center justify-between"
          style={{
            background: dark ? '#18181b' : '#faf8f5',
            borderColor: dividerBorder,
          }}
        >
          <div>
            <span className="text-xs font-bold block" style={{ color: headingColor }}>
              {userInQueue ? 'You are on the General Speakers List' : 'General Speakers List Status'}
            </span>
            <span className="text-[11px] font-medium" style={{ color: mutedText }}>
              {userInQueue
                ? `Current Position: #${waitingQueue.findIndex((s) => s.id === userInQueue.id) + 1} in queue`
                : 'Moderated exclusively by the Executive Board (Committee Chair).'}
            </span>
          </div>

          {userInQueue && (
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-black"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: `1px solid ${dividerBorder}`,
              }}
            >
              Position #{waitingQueue.findIndex((s) => s.id === userInQueue.id) + 1}
            </span>
          )}
        </div>
      )}

      {/* 4. Chair Add Delegate to GSL (Strict Role & Committee Filtered) */}
      {isChair && (
        <div className="space-y-2">
          {gslError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{gslError}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <select
              value={manualCountry}
              onChange={(e) => {
                setManualCountry(e.target.value);
                setGslError(null);
              }}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                border: `1px solid ${dividerBorder}`,
                color: headingColor,
              }}
            >
              <option value="">-- Add Delegate to GSL --</option>
              {eligibleDelegates.map((d) => (
                <option key={d.id} value={d.country !== 'Unassigned' ? d.country : d.name}>
                  {d.country !== 'Unassigned' ? `${d.country} (${d.name})` : d.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCountryToQueue}
              disabled={!manualCountry || addingSpeaker}
              className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              {addingSpeaker ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>Add Speaker</span>
            </button>
          </div>
        </div>
      )}

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 5. Speakers Queue List with Reordering */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: mutedText }}>
          Speakers Queue
        </span>

        {speakerLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: dark ? '#ffffff' : '#172554' }} />
          </div>
        ) : waitingQueue.length === 0 ? (
          <div className="py-6 text-center text-xs italic font-medium" style={{ color: mutedText }}>
            Speakers List is currently empty.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {waitingQueue.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2.5 rounded-lg border text-xs transition"
                style={{
                  background: dark ? '#18181b' : '#faf8f5',
                  borderColor: dividerBorder,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-[11px] w-5 text-center" style={{ color: mutedText }}>
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold truncate block" style={{ color: headingColor }}>
                      {s.name}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: dark ? '#a1a1aa' : '#1e3a8a' }}>
                      {s.country}
                    </span>
                  </div>
                </div>

                {isChair && (
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <button
                        onClick={() => moveSpeakerInQueue(s.id, 'up', speakers)}
                        title="Move Up"
                        className="p-1 rounded hover:bg-zinc-800"
                        style={{ color: mutedText }}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                    )}
                    {idx < waitingQueue.length - 1 && (
                      <button
                        onClick={() => moveSpeakerInQueue(s.id, 'down', speakers)}
                        title="Move Down"
                        className="p-1 rounded hover:bg-zinc-800"
                        style={{ color: mutedText }}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => removeSpeakerFromQueue(s.id)}
                      title="Remove Speaker"
                      className="p-1 rounded text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Motions Section (Task 2 Fix)
// ---------------------------------------------------------------------------

interface MotionsSectionProps {
  committeeId: string;
  motions: CommitteeMotion[];
  profile: UserProfile;
  isChair: boolean;
  dark: boolean;
  dividerBorder: string;
  headingColor: string;
  mutedText: string;
  onStartTimerForMotion: (motion: CommitteeMotion) => Promise<void>;
}

const MotionsSection: React.FC<MotionsSectionProps> = ({
  committeeId,
  motions,
  profile,
  isChair,
  dark,
  dividerBorder,
  headingColor,
  mutedText,
  onStartTimerForMotion,
}) => {
  const [openSubmit, setOpenSubmit] = useState(false);
  const [topic, setTopic] = useState('');
  const [totalTime, setTotalTime] = useState('10');
  const [speakingTime, setSpeakingTime] = useState('60');
  const [motionType, setMotionType] = useState<CommitteeMotion['type']>('Moderated Caucus');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitMotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      await submitMotion(committeeId, {
        proposerName: profile.name || profile.displayName,
        proposerCountry: profile.country,
        topic: topic.trim(),
        totalTime: parseInt(totalTime, 10) * 60 || 600,
        speakingTime: parseInt(speakingTime, 10) || 60,
        type: motionType,
        status: 'pending',
      });
      setTopic('');
      setOpenSubmit(false);
    } catch (err) {
      console.error('Error proposing motion:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
            Motions &amp; Caucuses
          </h3>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
            style={{ background: dark ? '#18181b' : '#fef08a', color: headingColor }}
          >
            {motions.length}
          </span>
        </div>

        {profile.role !== 'Observer' && (
          <button
            onClick={() => setOpenSubmit(!openSubmit)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition shadow-sm"
            style={{
              background: dark ? '#27272a' : '#fef08a',
              color: dark ? '#ffffff' : '#172554',
              borderColor: dark ? '#3f3f46' : '#fde047',
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Submit Motion
          </button>
        )}
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 2. Submit Form */}
      {openSubmit && (
        <>
          <form onSubmit={handleSubmitMotion} className="space-y-3 py-2">
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                Motion Topic / Purpose *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Humanitarian Aid and Infrastructure Recovery"
                className="w-full px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: dark ? '#18181b' : '#ffffff', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                  Total (Mins)
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={totalTime}
                  onChange={(e) => setTotalTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: dark ? '#18181b' : '#ffffff', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                  Speaking (Secs)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  value={speakingTime}
                  onChange={(e) => setSpeakingTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: dark ? '#18181b' : '#ffffff', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                  Type
                </label>
                <select
                  value={motionType}
                  onChange={(e) => setMotionType(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: dark ? '#18181b' : '#ffffff', border: `1px solid ${dividerBorder}`, color: dark ? '#ffffff' : '#172554' }}
                >
                  <option value="Moderated Caucus">Moderated</option>
                  <option value="Unmoderated Caucus">Unmoderated</option>
                  <option value="Consultation of the Whole">Consultation</option>
                  <option value="Formal Debate">Formal Debate</option>
                  <option value="Closure of Debate">Closure of Debate</option>
                  <option value="Adjournment">Adjournment</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !topic.trim()}
              className="w-full py-2.5 rounded-lg font-bold text-xs shadow-sm transition"
              style={{
                background: dark ? '#27272a' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              {submitting ? 'Submitting Motion…' : 'Submit Motion to Committee'}
            </button>
          </form>

          <div className="border-t" style={{ borderColor: dividerBorder }} />
        </>
      )}

      {/* 3. Motions List */}
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {motions.length === 0 ? (
          <div className="py-6 text-center text-xs italic font-medium" style={{ color: mutedText }}>
            No motions proposed yet for this committee.
          </div>
        ) : (
          motions.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              style={{ background: dark ? '#18181b' : '#faf8f5', borderColor: dividerBorder }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    {m.type}
                  </span>
                  <span style={{ color: mutedText }}>·</span>
                  <span style={{ color: mutedText }}>{Math.floor(m.totalTime / 60)}m total / {m.speakingTime}s speech</span>
                </div>
                <h5 className="font-bold truncate mt-0.5 text-sm" style={{ color: headingColor }}>
                  "{m.topic}"
                </h5>
                <p className="text-[10px] font-medium" style={{ color: mutedText }}>
                  Proposed by: {m.proposerName} ({m.proposerCountry})
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isChair && m.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateMotionStatus(m.id, 'passed')}
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold text-emerald-400 border border-emerald-800 hover:bg-emerald-950 transition"
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => updateMotionStatus(m.id, 'failed')}
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold text-red-400 border border-red-800 hover:bg-red-950 transition"
                    >
                      Fail
                    </button>
                  </>
                )}

                {isChair && (
                  <button
                    onClick={() => onStartTimerForMotion(m)}
                    title="Set debate timer from this motion"
                    className="px-2 py-1 rounded text-[10px] font-bold bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 border border-yellow-400/40"
                  >
                    Timer ▶
                  </button>
                )}

                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    background: m.status === 'passed' ? '#065f46' : m.status === 'failed' ? '#7f1d1d' : (dark ? '#27272a' : '#fef08a'),
                    color: m.status === 'passed' ? '#a7f3d0' : m.status === 'failed' ? '#fecaca' : (dark ? '#ffffff' : '#172554'),
                  }}
                >
                  {m.status}
                </span>

                {isChair && (
                  <button
                    onClick={() => deleteMotion(m.id)}
                    className="p-1 text-red-400 hover:bg-red-950 rounded"
                    title="Delete Motion"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Committee Roster Section (Task 3 Real-Time Hand Sync)
// ---------------------------------------------------------------------------

const CommitteeRosterSection: React.FC<{
  activeCommittee: string;
  raisedHands: RaisedHandItem[];
  speakers: SpeakerQueueItem[];
  dark: boolean;
  dividerBorder: string;
  headingColor: string;
  mutedText: string;
}> = ({ activeCommittee, raisedHands, speakers, dark, dividerBorder, headingColor, mutedText }) => {
  const delegates = ROSTER_MASTER_DATA.filter((r) => r.committee === activeCommittee);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
          {activeCommittee} — Official Delegate Roster
        </h3>
        <span className="text-xs font-bold" style={{ color: mutedText }}>
          {delegates.length} Delegates Assigned
        </span>
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {delegates.map((entry) => {
          const isHandUp = raisedHands.some((h) => h.country === entry.country);
          const speakerItem = speakers.find((s) => s.country === entry.country && s.status !== 'completed');
          const isSpeaking = speakerItem?.status === 'speaking';
          const queueIndex = speakers.filter((s) => s.status === 'waiting').findIndex((s) => s.country === entry.country);

          return (
            <div
              key={entry.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                isHandUp ? 'ring-2 ring-yellow-400 shadow-md' : ''
              }`}
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                borderColor: isHandUp ? (dark ? '#eab308' : '#ca8a04') : dividerBorder,
              }}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm" style={{ color: headingColor }}>
                    {entry.name}
                  </h4>
                  {isHandUp && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-yellow-400 text-yellow-950 animate-bounce">
                      ✋ HAND RAISED
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold" style={{ color: dark ? '#ffffff' : '#1e3a8a' }}>
                  {entry.country}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                {isSpeaking && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-800">
                    🎤 Speaking
                  </span>
                )}
                {queueIndex !== -1 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-zinc-800 text-zinc-300">
                    GSL #{queueIndex + 1}
                  </span>
                )}
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-medium"
                  style={{
                    background: dark ? '#27272a' : '#ffffff',
                    color: mutedText,
                    border: `1px solid ${dividerBorder}`,
                  }}
                >
                  {entry.role}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Create Session Section (Task 1 & Task 7)
// ---------------------------------------------------------------------------

const CreateSessionSection: React.FC<{
  committeeId: string;
  dark: boolean;
  dividerBorder: string;
  uid: string;
  displayName: string;
}> = ({ committeeId, dark, dividerBorder, uid, displayName }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubstantive, setIsSubstantive] = useState(false);
  const [members, setMembers] = useState('15');
  const [submitting, setSubmitting] = useState(false);

  const inputBg = dark ? '#18181b' : '#faf8f5';
  const inputBorder = dark ? '#3f3f46' : '#cbd5e1';
  const inputText = dark ? '#ffffff' : '#172554';
  const labelColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await createVotingSession({
      committeeId,
      title: title.trim(),
      description: description.trim(),
      votingType: isSubstantive ? 'Substantive' : 'Procedural',
      isSubstantive,
      createdBy: uid,
      createdByName: displayName,
      totalCouncilMembers: parseInt(members, 10) || 15,
    });
    setTitle('');
    setDescription('');
    setIsSubstantive(false);
    setMembers('15');
    setOpen(false);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left transition-colors border-b"
        style={{ borderColor: dividerBorder, color: dark ? '#ffffff' : '#172554' }}
      >
        <span className="flex items-center gap-2 font-serif text-2xl font-normal">
          <Plus className="h-5 w-5" style={{ color: dark ? '#ffffff' : '#172554' }} />
          Create New Voting Session ({committeeId})
        </span>
        {open ? <ChevronUp className="h-5 w-5" style={{ color: dark ? '#a1a1aa' : 'inherit' }} /> : <ChevronDown className="h-5 w-5" style={{ color: dark ? '#a1a1aa' : 'inherit' }} />}
      </button>

      {open && (
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: labelColor }}>
              Motion / Resolution Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draft Resolution 1.1 on Sustainable Climate Action"
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 font-medium"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
            />
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: labelColor }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary of the resolution operative clauses…"
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none font-medium"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
            />
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: labelColor }}>
                Voting Rule Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubstantive(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                  style={{
                    background: !isSubstantive ? (dark ? '#27272a' : '#fef08a') : (dark ? '#000000' : '#faf8f5'),
                    color: !isSubstantive ? (dark ? '#ffffff' : '#172554') : (dark ? '#a1a1aa' : '#475569'),
                    border: `1px solid ${!isSubstantive ? (dark ? '#3f3f46' : '#fde047') : inputBorder}`,
                  }}
                >
                  Procedural (Simple Majority)
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubstantive(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                  style={{
                    background: isSubstantive ? (dark ? '#27272a' : '#fef08a') : (dark ? '#000000' : '#faf8f5'),
                    color: isSubstantive ? (dark ? '#ffffff' : '#172554') : (dark ? '#a1a1aa' : '#475569'),
                    border: `1px solid ${isSubstantive ? (dark ? '#3f3f46' : '#fde047') : inputBorder}`,
                  }}
                >
                  Substantive (2/3 Majority)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: labelColor }}>
                Total Committee Members
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
              />
            </div>
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          <button
            onClick={handleCreate}
            disabled={submitting || !title.trim()}
            className="px-6 py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-50 shadow-sm"
            style={{
              background: dark ? '#27272a' : '#fef08a',
              color: dark ? '#ffffff' : '#172554',
              border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Initializing…
              </span>
            ) : (
              'Start Voting Session'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. Session Item Component (Task 1 & Task 7 Live Synchronized Voting)
// ---------------------------------------------------------------------------

const SessionItem: React.FC<{
  session: VotingSession;
  profile: UserProfile;
  dark: boolean;
  dividerBorder: string;
}> = ({ session, profile, dark, dividerBorder }) => {
  const [expanded, setExpanded] = useState(session.status === 'open');
  const [castingVote, setCastingVote] = useState(false);
  const [closing, setClosing] = useState(false);

  const headingColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';

  const votes = session.votes || {};
  const voteArray = Object.values(votes);
  const yesCount = voteArray.filter((v) => v.vote === 'YES').length;
  const noCount = voteArray.filter((v) => v.vote === 'NO').length;
  const abstainCount = voteArray.filter((v) => v.vote === 'ABSTAIN').length;

  const myVote = profile.uid ? votes[profile.uid] : undefined;
  const isChair = profile.role === 'Chair' || isOrganiserRole(profile.role);
  const isDelegate = profile.role === 'Delegate';
  const canVote = isDelegate && session.status === 'open' && !myVote;
  const canClose = isChair && session.status === 'open';

  const handleCastVote = async (choice: 'YES' | 'NO' | 'ABSTAIN') => {
    setCastingVote(true);
    await castVote(session.id, {
      country: profile.country,
      displayName: profile.name || profile.displayName,
      uid: profile.uid,
      vote: choice,
      isP5: profile.isP5,
    });
    setCastingVote(false);
  };

  const handleClose = async () => {
    setClosing(true);
    await closeAndEvaluate(
      session.id,
      votes,
      session.isSubstantive,
      session.totalCouncilMembers,
    );
    setClosing(false);
  };

  const statusIcon =
    session.status === 'closed'
      ? session.result?.status === 'PASSED'
        ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        : <XCircle className="h-5 w-5 text-red-500" />
      : <Clock className="h-5 w-5 animate-spin text-yellow-500" />;

  const statusLabel =
    session.status === 'closed'
      ? session.result?.status || 'CLOSED'
      : 'VOTING OPEN';

  return (
    <div className="border-b pb-8 space-y-4" style={{ borderColor: dividerBorder }}>
      {/* 1. Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {statusIcon}
          <div className="min-w-0">
            <h3 className="font-black text-lg truncate" style={{ color: headingColor }}>
              {session.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{
                  background: session.status === 'open' ? '#059669' : (dark ? '#18181b' : '#fef08a'),
                  color: session.status === 'open' ? '#ffffff' : (dark ? '#ffffff' : '#172554'),
                  border: `1px solid ${dividerBorder}`,
                }}
              >
                {statusLabel}
              </span>
              <span className="text-[10px] font-medium" style={{ color: mutedText }}>
                {session.isSubstantive ? 'Substantive (2/3 Majority)' : 'Procedural (Simple Majority)'} ·{' '}
                {voteArray.length} vote{voteArray.length !== 1 ? 's' : ''} cast
              </span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5" style={{ color: dark ? '#a1a1aa' : mutedText }} /> : <ChevronDown className="h-5 w-5" style={{ color: dark ? '#a1a1aa' : mutedText }} />}
      </button>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* 2. Description */}
          {session.description && (
            <>
              <p className="text-sm font-medium" style={{ color: mutedText }}>
                {session.description}
              </p>
              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          {/* 3. Vote Tally */}
          <div className="flex gap-4 flex-wrap">
            <TallyBadge label="IN FAVOR (YES)" count={yesCount} color="#10b981" dark={dark} dividerBorder={dividerBorder} />
            <TallyBadge label="AGAINST (NO)" count={noCount} color="#ef4444" dark={dark} dividerBorder={dividerBorder} />
            <TallyBadge label="ABSTAIN" count={abstainCount} color="#94a3b8" dark={dark} dividerBorder={dividerBorder} />
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          {/* 4. Vote Details */}
          {voteArray.length > 0 && (
            <>
              <div className="space-y-1">
                <p className="text-xs font-bold mb-2" style={{ color: mutedText }}>
                  Live Votes Cast
                </p>
                <div className="flex flex-wrap gap-2">
                  {voteArray.map((v) => (
                    <span
                      key={v.uid}
                      className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium"
                      style={{
                        background: dark ? '#18181b' : '#faf8f5',
                        color: dark ? '#ffffff' : '#172554',
                        border: `1px solid ${dividerBorder}`,
                      }}
                    >
                      <span>{v.displayName}</span>
                      <span style={{ color: mutedText }}>({v.country})</span>
                      <span
                        className="font-extrabold ml-1"
                        style={{
                          color: v.vote === 'YES' ? '#10b981' : v.vote === 'NO' ? '#ef4444' : '#94a3b8',
                        }}
                      >
                        {v.vote}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          {/* 5. Delegate Voting Buttons */}
          {canVote && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: mutedText }}>
                  Cast your official vote:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCastVote('YES')}
                    disabled={castingVote}
                    className="px-4 py-2 rounded-lg font-bold text-sm transition text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  >
                    In Favor (Yes)
                  </button>
                  <button
                    onClick={() => handleCastVote('NO')}
                    disabled={castingVote}
                    className="px-4 py-2 rounded-lg font-bold text-sm transition text-white bg-red-600 hover:bg-red-700 shadow-sm"
                  >
                    Against (No)
                  </button>
                  {session.isSubstantive && (
                    <button
                      onClick={() => handleCastVote('ABSTAIN')}
                      disabled={castingVote}
                      className="px-4 py-2 rounded-lg font-bold text-sm transition text-zinc-300 bg-zinc-700 hover:bg-zinc-600 shadow-sm"
                    >
                      Abstain
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          {/* Already Voted */}
          {myVote && session.status === 'open' && (
            <>
              <div
                className="text-sm py-2 font-medium"
                style={{ color: dark ? '#ffffff' : '#172554' }}
              >
                Your vote has been cast: <strong>{myVote.vote}</strong>
              </div>

              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          {/* 6. Chair Close & Evaluate */}
          {canClose && (
            <>
              <button
                onClick={handleClose}
                disabled={closing}
                className="px-5 py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-50 shadow-sm"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                }}
              >
                {closing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Finalizing Tally…
                  </span>
                ) : (
                  'Close Voting & Finalize Outcome'
                )}
              </button>

              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          {/* 7. Official Result */}
          {session.result && (
            <>
              <div
                className="p-4 rounded-xl border text-sm font-medium"
                style={{
                  background: dark ? '#18181b' : (session.result.status === 'PASSED' ? '#f0fdf4' : '#fef2f2'),
                  borderColor: dark ? '#3f3f46' : (session.result.status === 'PASSED' ? '#bbf7d0' : '#fecaca'),
                  color: dark ? '#ffffff' : (session.result.status === 'PASSED' ? '#166534' : '#991b1b'),
                }}
              >
                <p className="font-bold mb-1" style={{ color: dark ? '#ffffff' : undefined }}>
                  {session.result.status === 'PASSED' ? '✅ Resolution Passed' : '❌ Resolution Failed'}
                </p>
                <p>{session.result.reason}</p>
              </div>

              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          <p className="text-[10px] font-medium" style={{ color: mutedText }}>
            Initialized by {session.createdByName} · {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TallyBadge: React.FC<{
  label: string;
  count: number;
  color: string;
  dark: boolean;
  dividerBorder: string;
}> = ({ label, count, color, dark, dividerBorder }) => (
  <div
    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold"
    style={{
      background: dark ? '#18181b' : '#faf8f5',
      border: `1px solid ${dividerBorder}`,
    }}
  >
    <span className="text-lg font-mono font-extrabold" style={{ color }}>{count}</span>
    <span className="text-xs" style={{ color: dark ? '#ffffff' : '#172554' }}>{label}</span>
  </div>
);
