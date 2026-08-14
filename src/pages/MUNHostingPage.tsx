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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import type {
  UserProfile,
  VotingSession,
  CommitteeTimerState,
  SpeakerQueueItem,
  CommitteeMotion,
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
  submitMotion,
  updateMotionStatus,
  subscribeToMotions,
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
  const isOrganiser = isOrganiserRole(profile.role);
  const isChair = profile.role === 'Chair' || isOrganiser;
  const isDelegate = profile.role === 'Delegate';

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

  // ── Voting Sessions State ────────────────────────────────────────────────
  const [sessions, setSessions] = useState<VotingSession[]>([]);
  const [votingLoading, setVotingLoading] = useState(true);

  // ── Debate Timer State (Synchronized) ─────────────────────────────────────
  const [timerDoc, setTimerDoc] = useState<CommitteeTimerState | null>(null);
  const [localSeconds, setLocalSeconds] = useState(60);
  const timerExpiredPlayedRef = useRef(false);

  // ── General Speakers List State ──────────────────────────────────────────
  const [speakers, setSpeakers] = useState<SpeakerQueueItem[]>([]);
  const [speakerLoading, setSpeakerLoading] = useState(true);

  // ── Motions State ────────────────────────────────────────────────────────
  const [motions, setMotions] = useState<CommitteeMotion[]>([]);

  // ── Listeners per Active Committee ───────────────────────────────────────
  useEffect(() => {
    setVotingLoading(true);
    setSpeakerLoading(true);

    const unsubVoting = subscribeToSessions((all) => {
      setSessions(all);
      setVotingLoading(false);
    });

    const unsubTimer = subscribeToTimer(activeCommittee, (t) => {
      setTimerDoc(t);
      if (t) {
        setLocalSeconds(t.remainingSeconds);
      }
    });

    const unsubSpeakers = subscribeToSpeakerQueue(activeCommittee, (list: SpeakerQueueItem[]) => {
      setSpeakers(list);
      setSpeakerLoading(false);
    });

    const unsubMotions = subscribeToMotions(activeCommittee, (mList) => {
      setMotions(mList);
    });

    return () => {
      unsubVoting();
      unsubTimer();
      unsubSpeakers();
      unsubMotions();
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

    // Ticking interval calculation based on server timestamp
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

  // ── Dark theme strictly uses grey, black and white ────────────────────────
  const dividerBorder = dark ? '#27272a' : '#e2e8f0';
  const headingColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';

  const activeSpeaker = speakers.find((s) => s.status === 'speaking');
  const userInQueue = speakers.find((s) => s.uid === profile.uid);

  // ── Gated Lock Screen for Non-Admins if Inactive ─────────────────────────
  if (!munState.isActive && !isOrganiser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div
          className="border-t pt-12 text-center"
          style={{ borderColor: '#ef4444' }}
        >
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
            <span>The Gallery section remains open and accessible in the top navigation bar.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      
      {/* ── Top Header Banner (Cardless, Divided by Line) ────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b" style={{ borderColor: dividerBorder }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight" style={{ color: headingColor }}>
              Interactive MUN Workspace
            </h1>
          </div>

          <p className="text-xs sm:text-sm font-normal" style={{ color: mutedText }}>
            Authenticated as: <strong className="font-semibold" style={{ color: headingColor }}>{profile.name || profile.displayName}</strong>{' '}
            (<span className="font-mono text-xs" style={{ color: dark ? '#ffffff' : '#172554' }}>{profile.role}</span>) ·{' '}
            Representation:{' '}
            <strong className="font-semibold" style={{ color: dark ? '#ffffff' : '#172554' }}>
              {profile.country.startsWith('N/A') ? 'Executive Board' : profile.country}
            </strong>
          </p>
        </div>

        {/* Committee Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-[280px]">
          <span className="text-xs font-mono font-medium whitespace-nowrap uppercase tracking-wider" style={{ color: mutedText }}>
            Chamber:
          </span>
          <div className="relative w-full sm:w-auto flex-1">
            <select
              value={activeCommittee}
              onChange={(e) => setActiveCommittee(e.target.value as CommitteeName)}
              className="w-full sm:min-w-[260px] max-w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 transition cursor-pointer"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                border: `1px solid ${dividerBorder}`,
                color: headingColor,
              }}
            >
              {COMMITTEES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: dark ? '#a1a1aa' : '#172554' }} />
          </div>
        </div>
      </div>

      {/* ── Workspace Sub-Tabs (Clean text tabs) ──────────────────────────── */}
      <div className="flex items-center gap-4 border-b pb-4 overflow-x-auto" style={{ borderColor: dividerBorder }}>
        {[
          ...(isOrganiser ? [{ id: 'admin', label: 'Admin Control Center' }] : []),
          { id: 'debate', label: 'Live Debate & Timers' },
          { id: 'voting', label: 'Voting & Resolutions' },
          { id: 'roster', label: 'Committee Roster' },
        ].map(({ id, label }) => {
          const isActive = workspaceTab === id;
          return (
            <button
              key={id}
              onClick={() => setWorkspaceTab(id as any)}
              className={`text-xs sm:text-sm transition whitespace-nowrap ${
                isActive ? 'font-bold' : 'font-medium opacity-70 hover:opacity-100'
              }`}
              style={{
                color: isActive ? (dark ? '#ffffff' : '#172554') : mutedText,
              }}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 0: ADMIN CONTROL CENTER (Event Organiser Only) ─────────────── */}
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
              isChair={isChair || isOrganiser}
              dark={dark}
              dividerBorder={dividerBorder}
              headingColor={headingColor}
              mutedText={mutedText}
            />

            {/* Motions Section */}
            <MotionsSection
              committeeId={activeCommittee}
              motions={motions}
              profile={profile}
              isChair={isChair || isOrganiser}
              dark={dark}
              dividerBorder={dividerBorder}
              headingColor={headingColor}
              mutedText={mutedText}
            />
          </div>

          {/* RIGHT 6 COLS: General Speakers List (GSL) */}
          <div className="lg:col-span-6 space-y-10">
            <GeneralSpeakersListSection
              committeeId={activeCommittee}
              speakers={speakers}
              speakerLoading={speakerLoading}
              profile={profile}
              isChair={isChair || isOrganiser}
              isDelegate={isDelegate}
              userInQueue={userInQueue}
              activeSpeaker={activeSpeaker}
              dark={dark}
              dividerBorder={dividerBorder}
              headingColor={headingColor}
              mutedText={mutedText}
            />
          </div>

        </div>
      )}

      {/* ── TAB 2: VOTING & RESOLUTIONS (Cardless) ─────────────────────────── */}
      {workspaceTab === 'voting' && (
        <div className="space-y-10">
          {/* Chair / Organiser creation panel */}
          {(isChair || isOrganiser) && (
            <CreateSessionSection
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
                <p style={{ color: mutedText }}>No voting sessions active for this committee. A Chair or Organiser can initialize one.</p>
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

      {/* ── TAB 3: COMMITTEE ROSTER (Cardless) ─────────────────────────────── */}
      {workspaceTab === 'roster' && (
        <CommitteeRosterSection
          activeCommittee={activeCommittee}
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
// 1. Cardless Debate Timer Section (Divided by Horizontal Lines)
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

      {/* Horizontal Divider */}
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

      {/* Horizontal Divider */}
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

      {/* Horizontal Divider */}
      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 4. Chair / Admin Controls */}
      {isChair ? (
        <div className="space-y-6">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                style={{
                  background: dark ? '#18181b' : '#faf8f5',
                  color: dark ? '#ffffff' : '#172554',
                  border: `1px solid ${dividerBorder}`,
                }}
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                }}
              >
                <Play className="h-4 w-4" /> Start / Resume
              </button>
            )}

            <button
              onClick={() => handleReset()}
              className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                color: dark ? '#d4d4d8' : '#172554',
                border: `1px solid ${dividerBorder}`,
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>

          {/* Horizontal Divider */}
          <div className="border-t" style={{ borderColor: dividerBorder }} />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold self-center mr-1" style={{ color: mutedText }}>
              Presets:
            </span>
            {[
              { label: '60s (Speaker)', m: 1, s: 0, mode: 'Speaker' as const },
              { label: '90s', m: 1, s: 30, mode: 'Speaker' as const },
              { label: '5m (Mod Caucus)', m: 5, s: 0, mode: 'Moderated Caucus' as const },
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

          {/* Horizontal Divider */}
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
// 2. Cardless General Speakers List Section (Divided by Horizontal Lines)
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
}) => {
  const [submittingHand, setSubmittingHand] = useState(false);

  const handleRaiseHand = async () => {
    setSubmittingHand(true);
    try {
      await addSpeakerToQueue(committeeId, {
        uid: profile.uid,
        name: profile.name || profile.displayName,
        country: profile.country,
      });
    } catch (e) {
      console.error(e);
    }
    setSubmittingHand(false);
  };

  const handleLowerHand = async () => {
    if (!userInQueue) return;
    setSubmittingHand(true);
    try {
      await removeSpeakerFromQueue(userInQueue.id);
    } catch (e) {
      console.error(e);
    }
    setSubmittingHand(false);
  };

  const handleNextSpeaker = async () => {
    if (activeSpeaker) {
      await setSpeakerStatus(activeSpeaker.id, 'completed');
    }
    const next = speakers.find((s) => s.status === 'waiting');
    if (next) {
      await setSpeakerStatus(next.id, 'speaking');
    }
  };

  const handleRemoveSpeaker = async (id: string) => {
    await removeSpeakerFromQueue(id);
  };

  const handleClear = async () => {
    if (confirm('Clear the entire speakers queue for this committee?')) {
      await clearSpeakerQueue(committeeId);
    }
  };

  const queueList = speakers.filter((s) => s.status !== 'completed');

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
            {queueList.length} in queue
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
              onClick={handleClear}
              className="text-xs px-2.5 py-1.5 rounded-lg border font-bold text-red-400 border-red-900/60 hover:bg-red-950 transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Divider */}
      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 2. Active Speaker Spotlight */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1" style={{ color: mutedText }}>
          Current Floor Holder
        </span>
        {activeSpeaker ? (
          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="font-black text-lg sm:text-xl" style={{ color: headingColor }}>
                {activeSpeaker.name}
              </h4>
              <p className="text-xs font-bold" style={{ color: dark ? '#ffffff' : '#1e3a8a' }}>
                {activeSpeaker.country}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-800 animate-pulse">
              LIVE SPEAKING
            </span>
          </div>
        ) : (
          <p className="text-xs font-medium italic py-2" style={{ color: mutedText }}>
            No delegate is currently on the floor.
          </p>
        )}
      </div>

      {/* Horizontal Divider */}
      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 3. Delegate Controls */}
      {isDelegate && (
        <>
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-xs font-bold block" style={{ color: headingColor }}>
                {userInQueue ? 'You are in the queue' : 'Request to Speak'}
              </span>
              <span className="text-[11px] font-medium" style={{ color: mutedText }}>
                {userInQueue
                  ? `Position: #${queueList.findIndex((s) => s.id === userInQueue.id) + 1}`
                  : 'Raise your hand to be placed on the GSL'}
              </span>
            </div>

            {userInQueue ? (
              <button
                onClick={handleLowerHand}
                disabled={submittingHand}
                className="px-4 py-2 rounded-xl text-xs font-bold border text-red-400 border-red-900/60 hover:bg-red-950 transition flex items-center gap-1.5"
              >
                <Hand className="h-3.5 w-3.5" /> Lower Hand
              </button>
            ) : (
              <button
                onClick={handleRaiseHand}
                disabled={submittingHand}
                className="px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                }}
              >
                <Hand className="h-3.5 w-3.5" /> Raise Hand
              </button>
            )}
          </div>

          {/* Horizontal Divider */}
          <div className="border-t" style={{ borderColor: dividerBorder }} />
        </>
      )}

      {/* 4. Speakers Queue List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {speakerLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: dark ? '#ffffff' : '#172554' }} />
          </div>
        ) : queueList.length === 0 ? (
          <div className="py-8 text-center text-xs italic font-medium" style={{ color: mutedText }}>
            Speakers queue is empty. Delegates can raise hands to join.
          </div>
        ) : (
          queueList.map((item, index) => {
            const isSpeaking = item.status === 'speaking';
            return (
              <div
                key={item.id}
                className="py-2.5 border-b flex items-center justify-between transition"
                style={{ borderColor: dividerBorder }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: isSpeaking ? (dark ? '#ffffff' : '#172554') : (dark ? '#27272a' : '#e2e8f0'),
                      color: isSpeaking ? (dark ? '#000000' : '#ffffff') : (dark ? '#ffffff' : '#334155'),
                    }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm truncate" style={{ color: headingColor }}>
                      {item.name}
                    </h5>
                    <p className="text-[11px] truncate opacity-80 font-medium" style={{ color: mutedText }}>
                      {item.country} {isSpeaking && '· [Speaking]'}
                    </p>
                  </div>
                </div>

                {isChair && (
                  <button
                    onClick={() => handleRemoveSpeaker(item.id)}
                    className="text-xs p-1 text-zinc-500 hover:text-red-400 transition"
                    title="Remove from queue"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Cardless Motions & Caucuses Section (Divided by Horizontal Lines)
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
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
            Motions &amp; Caucuses
          </h3>
        </div>

        {profile.role === 'Delegate' && (
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

      {/* Horizontal Divider */}
      <div className="border-t" style={{ borderColor: dividerBorder }} />

      {/* 2. Delegate Submit Form */}
      {openSubmit && (
        <>
          <form onSubmit={handleSubmitMotion} className="space-y-3 py-2">
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: mutedText }}>
                Motion Topic *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Allocation of resources"
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
                  max="30"
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
              {submitting ? 'Submitting…' : 'Submit Motion to Chair'}
            </button>
          </form>

          {/* Horizontal Divider */}
          <div className="border-t" style={{ borderColor: dividerBorder }} />
        </>
      )}

      {/* 3. Motions List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {motions.length === 0 ? (
          <div className="py-6 text-center text-xs italic font-medium" style={{ color: mutedText }}>
            No motions proposed yet for this session.
          </div>
        ) : (
          motions.map((m) => (
            <div
              key={m.id}
              className="py-3 border-b flex items-center justify-between gap-3 text-xs"
              style={{ borderColor: dividerBorder }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    {m.type}
                  </span>
                  <span style={{ color: mutedText }}>·</span>
                  <span style={{ color: mutedText }}>{Math.floor(m.totalTime / 60)}m / {m.speakingTime}s</span>
                </div>
                <h5 className="font-bold truncate mt-0.5" style={{ color: headingColor }}>
                  "{m.topic}"
                </h5>
                <p className="text-[10px] font-medium" style={{ color: mutedText }}>
                  By: {m.proposerName} ({m.proposerCountry})
                </p>
              </div>

              {isChair && m.status === 'pending' ? (
                <div className="flex items-center gap-1 flex-shrink-0">
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
                </div>
              ) : (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    background: m.status === 'passed' ? '#065f46' : m.status === 'failed' ? '#7f1d1d' : (dark ? '#18181b' : '#fef08a'),
                    color: m.status === 'passed' ? '#a7f3d0' : m.status === 'failed' ? '#fecaca' : (dark ? '#ffffff' : '#172554'),
                  }}
                >
                  {m.status}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Cardless Committee Roster Section
// ---------------------------------------------------------------------------

const CommitteeRosterSection: React.FC<{
  activeCommittee: string;
  dark: boolean;
  dividerBorder: string;
  headingColor: string;
  mutedText: string;
}> = ({ activeCommittee, dark, dividerBorder, headingColor, mutedText }) => {
  const delegates = ROSTER_MASTER_DATA.filter((r) => r.committee === activeCommittee);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
          {activeCommittee} — Official Delegate Roster
        </h3>
      </div>

      <div className="border-t" style={{ borderColor: dividerBorder }} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {delegates.map((entry) => (
          <div
            key={entry.id}
            className="pb-4 border-b flex items-center justify-between"
            style={{ borderColor: dividerBorder }}
          >
            <div>
              <h4 className="font-bold text-sm" style={{ color: headingColor }}>
                {entry.name}
              </h4>
              <p className="text-xs font-semibold" style={{ color: dark ? '#ffffff' : '#1e3a8a' }}>
                {entry.country}
              </p>
            </div>
            <span
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-medium"
              style={{
                background: dark ? '#18181b' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: `1px solid ${dividerBorder}`,
              }}
            >
              {entry.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Cardless Create Session Section (Chair / Organiser Only)
// ---------------------------------------------------------------------------

const CreateSessionSection: React.FC<{
  dark: boolean;
  dividerBorder: string;
  uid: string;
  displayName: string;
}> = ({ dark, dividerBorder, uid, displayName }) => {
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
      title: title.trim(),
      description: description.trim(),
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
          Create New Voting Session
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
              placeholder="e.g. Resolution on Global Preparedness"
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
              placeholder="Brief summary of the motion…"
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none font-medium"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
            />
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: labelColor }}>
                Vote Type
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
                  Procedural
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
                  Substantive (P5 Veto)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: labelColor }}>
                Council / Committee Members
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText }}
              />
            </div>
          </div>

          {isSubstantive && (
            <div
              className="text-xs font-bold p-3 rounded-lg flex items-start gap-2"
              style={{
                background: dark ? '#18181b' : '#fef08a33',
                color: dark ? '#ffffff' : '#172554',
                border: `1px solid ${dark ? '#3f3f46' : '#fde047'}`,
              }}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Substantive votes require ≥9 YES votes and are subject to P5 veto. Any P5 member voting NO will veto the resolution.
              </span>
            </div>
          )}

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
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </span>
            ) : (
              'Create Session'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. Cardless Session Item Component (Divided by Horizontal Lines)
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
        : session.result?.status === 'VETOED'
          ? <ShieldAlert className="h-5 w-5 text-red-500" />
          : <XCircle className="h-5 w-5 text-red-500" />
      : <Clock className="h-5 w-5" style={{ color: dark ? '#ffffff' : '#172554' }} />;

  const statusLabel =
    session.status === 'closed'
      ? session.result?.status || 'CLOSED'
      : 'OPEN';

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
                  background: dark ? '#18181b' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: `1px solid ${dividerBorder}`,
                }}
              >
                {statusLabel}
              </span>
              <span className="text-[10px] font-medium" style={{ color: mutedText }}>
                {session.isSubstantive ? 'Substantive (P5 Veto)' : 'Procedural'} ·{' '}
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
            <TallyBadge label="YES" count={yesCount} color={dark ? '#ffffff' : '#172554'} dark={dark} dividerBorder={dividerBorder} />
            <TallyBadge label="NO" count={noCount} color={dark ? '#ffffff' : '#dc2626'} dark={dark} dividerBorder={dividerBorder} />
            <TallyBadge label="ABSTAIN" count={abstainCount} color={dark ? '#a1a1aa' : '#64748b'} dark={dark} dividerBorder={dividerBorder} />
          </div>

          <div className="border-t" style={{ borderColor: dividerBorder }} />

          {/* 4. Vote Details */}
          {voteArray.length > 0 && (
            <>
              <div className="space-y-1">
                <p className="text-xs font-bold mb-2" style={{ color: mutedText }}>
                  Votes Cast
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
                          color: v.vote === 'YES' ? (dark ? '#ffffff' : '#172554') : v.vote === 'NO' ? '#ef4444' : '#a1a1aa',
                        }}
                      >
                        {v.vote}
                      </span>
                      {v.isP5 && (
                        <span className="text-[9px] font-bold ml-0.5" style={{ color: dark ? '#ffffff' : '#172554' }}>P5</span>
                      )}
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
                  Cast your vote:
                </p>
                <div className="flex gap-2">
                  {(['YES', 'NO', 'ABSTAIN'] as const).map((choice) => (
                    <button
                      key={choice}
                      onClick={() => handleCastVote(choice)}
                      disabled={castingVote}
                      className="px-4 py-2 rounded-lg font-bold text-sm transition disabled:opacity-50 shadow-sm"
                      style={{
                        background: dark
                          ? (choice === 'YES' ? '#27272a' : choice === 'NO' ? '#000000' : '#18181b')
                          : (choice === 'YES' ? '#fef08a' : choice === 'NO' ? '#fee2e2' : '#faf8f5'),
                        color: dark
                          ? '#ffffff'
                          : (choice === 'YES' ? '#172554' : choice === 'NO' ? '#dc2626' : '#475569'),
                        border: `1px solid ${dark ? '#3f3f46' : (choice === 'YES' ? '#fde047' : '#cbd5e1')}`,
                      }}
                    >
                      {castingVote ? <Loader2 className="h-4 w-4 animate-spin" /> : choice}
                    </button>
                  ))}
                </div>
                {profile.isP5 && session.isSubstantive && (
                  <p className="text-xs font-bold flex items-center gap-1" style={{ color: dark ? '#ffffff' : '#172554' }}>
                    <AlertTriangle className="h-3 w-3" />
                    As a P5 member, your NO vote will veto this substantive resolution.
                  </p>
                )}
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
                You voted: <strong>{myVote.vote}</strong>
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
                className="px-5 py-2 rounded-lg font-bold text-sm transition disabled:opacity-50 shadow-sm"
                style={{
                  background: dark ? '#27272a' : '#fef08a',
                  color: dark ? '#ffffff' : '#172554',
                  border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                }}
              >
                {closing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Evaluating…
                  </span>
                ) : (
                  'Close Voting & Evaluate'
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
                  background: dark ? '#18181b' : (session.result.status === 'PASSED' ? '#f0fdf4' : session.result.status === 'VETOED' ? '#fef2f2' : '#fff7ed'),
                  borderColor: dark ? '#3f3f46' : (session.result.status === 'PASSED' ? '#bbf7d0' : session.result.status === 'VETOED' ? '#fecaca' : '#fed7aa'),
                  color: dark ? '#ffffff' : (session.result.status === 'PASSED' ? '#166534' : session.result.status === 'VETOED' ? '#991b1b' : '#9a3412'),
                }}
              >
                <p className="font-bold mb-1" style={{ color: dark ? '#ffffff' : undefined }}>
                  {session.result.status === 'PASSED' && '✅ '}
                  {session.result.status === 'VETOED' && '🛑 '}
                  {session.result.status === 'FAILED' && '❌ '}
                  Result: {session.result.status}
                </p>
                <p>{session.result.reason}</p>
              </div>

              <div className="border-t" style={{ borderColor: dividerBorder }} />
            </>
          )}

          <p className="text-[10px] font-medium" style={{ color: mutedText }}>
            Created by {session.createdByName} · {new Date(session.createdAt).toLocaleString()}
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
