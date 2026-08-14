import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Send,
  Users,
  Clock,
  Bell,
  CheckSquare,
  Square,
  Search,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { UserProfile, MUNState, CommitteeTimerState, CommitteeMotion } from '../types';
import { setMUNState, subscribeToMUNState } from '../services/systemService';
import { ROSTER_MASTER_DATA, COMMITTEES, type CommitteeName } from '../data/rosterData';
import { subscribeToTimer, subscribeToMotions } from '../services/committeeService';

interface AdminWorkspacePanelProps {
  profile: UserProfile;
}

export const AdminWorkspacePanel: React.FC<AdminWorkspacePanelProps> = ({ profile }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // ── Global MUN Lock State ────────────────────────────────────────────────
  const [munState, setMunStateLocal] = useState<MUNState>({
    isActive: true,
    updatedAt: Date.now(),
  });
  const [togglingLock, setTogglingLock] = useState(false);

  // ── Live Monitors for all Committees ─────────────────────────────────────
  const [timers, setTimers] = useState<Record<string, CommitteeTimerState | null>>({});
  const [motions, setMotions] = useState<Record<string, CommitteeMotion[]>>({});

  // ── Email Dispatch State (Reminder Dispatcher) ───────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendingBatch, setSendingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const [searchRoster, setSearchRoster] = useState('');
  const [filterCommittee, setFilterCommittee] = useState<string>('All');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  // ── Subscriptions ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubState = subscribeToMUNState((state) => {
      setMunStateLocal(state);
    });

    const unsubs = COMMITTEES.map((comm) => {
      const unsubT = subscribeToTimer(comm, (t) => {
        setTimers((prev) => ({ ...prev, [comm]: t }));
      });
      const unsubM = subscribeToMotions(comm, (m) => {
        setMotions((prev) => ({ ...prev, [comm]: m }));
      });
      return () => {
        unsubT();
        unsubM();
      };
    });

    return () => {
      unsubState();
      unsubs.forEach((u) => u());
    };
  }, []);

  // ── Toggle Lock Handler ──────────────────────────────────────────────────
  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const newState = !munState.isActive;
      await setMUNState(newState, profile.name || profile.displayName);
    } catch (err: any) {
      alert(`Failed to update workspace state: ${err?.message || 'Check permissions'}`);
    } finally {
      setTogglingLock(false);
    }
  };

  // ── Send Single Reminder ─────────────────────────────────────────────────
  const handleSendSingle = async (entry: typeof ROSTER_MASTER_DATA[0]) => {
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: entry.email,
          name: entry.name,
          role: entry.role,
          committee: entry.committee,
          country: entry.country,
          portalUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentMap((prev) => ({ ...prev, [entry.id]: true }));
        setEmailLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Reminder sent to ${entry.name} (${entry.email})`,
          ...prev,
        ]);
      } else {
        alert(`Error: ${data.error || 'Could not send reminder'}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // ── Filtered Roster ──────────────────────────────────────────────────────
  const filteredRoster = ROSTER_MASTER_DATA.filter((item) => {
    const matchComm = filterCommittee === 'All' || item.committee === filterCommittee;
    const matchSearch =
      searchRoster === '' ||
      item.name.toLowerCase().includes(searchRoster.toLowerCase()) ||
      item.country.toLowerCase().includes(searchRoster.toLowerCase()) ||
      item.email.toLowerCase().includes(searchRoster.toLowerCase()) ||
      item.role.toLowerCase().includes(searchRoster.toLowerCase());
    return matchComm && matchSearch;
  });

  // ── Selection Handlers ───────────────────────────────────────────────────
  const allFilteredSelected =
    filteredRoster.length > 0 &&
    filteredRoster.every((r) => selectedIds.has(r.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredRoster.forEach((r) => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredRoster.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // ── Send Batch Reminders ─────────────────────────────────────────────────
  const handleSendBatch = async (targetList: typeof ROSTER_MASTER_DATA) => {
    if (targetList.length === 0) {
      alert('No participants selected to email.');
      return;
    }

    if (!confirm(`Dispatch official reminder & credential emails to ${targetList.length} participant(s)?`)) {
      return;
    }

    setSendingBatch(true);
    setBatchProgress({ current: 0, total: targetList.length });

    let sentCount = 0;
    for (let i = 0; i < targetList.length; i++) {
      const entry = targetList[i];
      setBatchProgress({ current: i + 1, total: targetList.length });
      try {
        const res = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: entry.email,
            name: entry.name,
            role: entry.role,
            committee: entry.committee,
            country: entry.country,
            portalUrl: window.location.origin,
          }),
        });
        if (res.ok) {
          sentCount++;
          setSentMap((prev) => ({ ...prev, [entry.id]: true }));
          setEmailLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] Batch: Sent to ${entry.name} (${entry.email})`,
            ...prev,
          ]);
        }
      } catch (err) {
        console.error('Batch send error:', err);
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    setSendingBatch(false);
    setBatchProgress(null);
    alert(`Batch dispatch complete! Successfully sent ${sentCount} reminder emails.`);
  };

  // ── Dark theme: grey, black, and white ───────────────────────────────────
  const panelBg = dark ? '#000000' : '#ffffff';
  const panelBorder = dark ? '#27272a' : '#e2e8f0';
  const headingColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* ── Top Bar: Event Organiser Banner & Global MUN Lock Switch ──────── */}
      <div
        className="rounded-3xl border p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md transition-colors duration-300"
        style={{ background: panelBg, borderColor: panelBorder }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-6 w-6" style={{ color: dark ? '#ffffff' : '#172554' }} />
            <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight" style={{ color: headingColor }}>
              Admin Control Center
            </h2>
            <span
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase ml-2 tracking-wider font-semibold"
              style={{
                background: dark ? '#18181b' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
              }}
            >
              {profile.role || 'Event Organiser'}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-normal" style={{ color: mutedText }}>
            Welcome, <strong>{profile.name || profile.displayName}</strong>. You have unrestricted administrative authority over global workspace access, committee activity, and automated email dispatches.
          </p>
        </div>

        {/* Global Lock Switch */}
        <div
          className="p-4 rounded-2xl border flex items-center justify-between sm:justify-start gap-4 shadow-sm"
          style={{
            background: dark ? '#18181b' : '#faf8f5',
            borderColor: munState.isActive ? (dark ? '#3f3f46' : '#cbd5e1') : '#ef4444',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center ${munState.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-700' : 'bg-red-500/20 text-red-400 border-red-700'
                }`}
            >
              {munState.isActive ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: mutedText }}>
                Workspace Status
              </span>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: munState.isActive ? (dark ? '#ffffff' : '#172554') : '#ef4444' }}
              >
                {munState.isActive ? 'ACTIVE (Accessible)' : 'LOCKED (Gated)'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleLock}
            disabled={togglingLock}
            className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-transform duration-150 active:scale-95 flex items-center gap-2 shadow-sm"
            style={{
              background: munState.isActive ? '#dc2626' : (dark ? '#27272a' : '#fef08a'),
              color: munState.isActive ? '#ffffff' : (dark ? '#ffffff' : '#172554'),
              border: munState.isActive ? '1px solid #b91c1c' : (dark ? '1px solid #3f3f46' : '1px solid #fde047'),
            }}
          >
            {togglingLock ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : munState.isActive ? (
              <>
                <Lock className="h-4 w-4" /> Lock Workspace
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" /> Unlock Workspace
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Section 1: Live Committee Monitors ───────────────────────────── */}
      <div
        className="rounded-3xl border p-6 sm:p-8 shadow-md transition-colors duration-300 space-y-6"
        style={{ background: panelBg, borderColor: panelBorder }}
      >
        <div>
          <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
            Live Committee Monitors (WHO, IPC, ICJ)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMMITTEES.map((comm) => {
            const timer = timers[comm];
            const commMotions = motions[comm] || [];
            const activeM = commMotions.filter((m) => m.status === 'pending');
            const passedM = commMotions.filter((m) => m.status === 'passed');
            const isRunning = timer?.running;

            return (
              <div
                key={comm}
                className="rounded-2xl border p-5 transition shadow-sm flex flex-col justify-between"
                style={{ background: panelBg, borderColor: panelBorder }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif text-lg font-normal truncate" style={{ color: headingColor }} title={comm}>
                      {comm}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                        }`}
                    />
                  </div>

                  {/* Timer Display */}
                  <div className="p-3 rounded-xl border mb-3 text-center" style={{ background: dark ? '#18181b' : '#faf8f5', borderColor: panelBorder }}>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: mutedText }}>
                      {timer?.mode || 'Speaker'} Mode
                    </span>
                    <span className="text-2xl font-mono font-black" style={{ color: headingColor }}>
                      {timer ? `${Math.floor(timer.remainingSeconds / 60)}:${(timer.remainingSeconds % 60).toString().padStart(2, '0')}` : '01:00'}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase block mt-0.5 opacity-80" style={{ color: isRunning ? '#10b981' : mutedText }}>
                      {isRunning ? 'Timer Running' : 'Timer Paused'}
                    </span>
                  </div>

                  {/* Motions summary */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span style={{ color: mutedText }}>Pending Motions:</span>
                      <span className="font-mono font-bold" style={{ color: headingColor }}>{activeM.length}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span style={{ color: mutedText }}>Passed Caucuses:</span>
                      <span className="font-mono font-bold text-emerald-500">{passedM.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t text-[11px] font-mono font-medium flex items-center justify-between" style={{ borderColor: dark ? '#27272a' : '#f1f5f9' }}>
                  <span style={{ color: mutedText }}>
                    {ROSTER_MASTER_DATA.filter((r) => r.committee === comm).length} Assigned Delegates
                  </span>
                  <span style={{ color: dark ? '#ffffff' : '#172554' }}>Live Synced</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Invite your members (No email icon beside title) ─── */}
      <div
        className="rounded-3xl border p-6 sm:p-8 shadow-md transition-colors duration-300 space-y-6"
        style={{ background: panelBg, borderColor: panelBorder }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight" style={{ color: headingColor }}>
              Invite your members
            </h3>
            <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: mutedText }}>
              Select individuals to send reminder emails.
            </p>
          </div>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              const selectedList = ROSTER_MASTER_DATA.filter((r) => selectedIds.has(r.id));
              handleSendBatch(selectedList);
            }}
            disabled={sendingBatch || selectedIds.size === 0}
            className="px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition shadow-sm disabled:opacity-40"
            style={{
              background: dark ? '#27272a' : '#f4f4f5',
              color: dark ? '#ffffff' : '#172554',
              border: dark ? '1px solid #3f3f46' : '1px solid #cbd5e1',
            }}
          >
            {sendingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send Reminder to Selected ({selectedIds.size})</span>
          </button>

          <button
            onClick={() => handleSendBatch(filteredRoster)}
            disabled={sendingBatch || filteredRoster.length === 0}
            className="px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition shadow-sm border"
            style={{
              background: dark ? '#18181b' : '#faf8f5',
              borderColor: panelBorder,
              color: dark ? '#ffffff' : '#172554',
            }}
          >
            <Users className="h-4 w-4" />
            <span>Send Reminder to Everyone ({filteredRoster.length})</span>
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedText }} />
            <input
              type="text"
              value={searchRoster}
              onChange={(e) => setSearchRoster(e.target.value)}
              placeholder="Search by participant name, email, country, or role…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                border: `1px solid ${panelBorder}`,
                color: headingColor,
              }}
            />
          </div>

          <div className="sm:col-span-5 flex items-center gap-2">
            <select
              value={filterCommittee}
              onChange={(e) => setFilterCommittee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-slate-400"
              style={{
                background: dark ? '#18181b' : '#faf8f5',
                border: `1px solid ${panelBorder}`,
                color: headingColor,
              }}
            >
              <option value="All">All Committees ({ROSTER_MASTER_DATA.length})</option>
              {COMMITTEES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Roster Table with Multi-Select */}
        <div className="overflow-x-auto rounded-2xl border max-h-96" style={{ borderColor: panelBorder }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead style={{ background: dark ? '#18181b' : '#faf8f5', color: headingColor }}>
              <tr className="border-b" style={{ borderColor: panelBorder }}>
                <th className="p-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    title="Select All Filtered"
                    className="p-1 hover:opacity-80 transition"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="h-4 w-4 text-white" />
                    ) : (
                      <Square className="h-4 w-4" style={{ color: mutedText }} />
                    )}
                  </button>
                </th>
                <th className="p-3 font-extrabold">Participant Name</th>
                <th className="p-3 font-extrabold">Role</th>
                <th className="p-3 font-extrabold">Committee</th>
                <th className="p-3 font-extrabold">Representation</th>
                <th className="p-3 font-extrabold">Official Email</th>
                <th className="p-3 font-extrabold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: panelBorder }}>
              {filteredRoster.map((entry) => {
                const isSelected = selectedIds.has(entry.id);
                const isSent = sentMap[entry.id];
                return (
                  <tr
                    key={entry.id}
                    className="hover:opacity-90 transition-colors"
                    style={{
                      background: isSelected
                        ? (dark ? '#27272a' : '#f4f4f5')
                        : (dark ? '#000000' : '#ffffff'),
                    }}
                  >
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleRow(entry.id)}
                        className="p-1 hover:opacity-80 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-white" />
                        ) : (
                          <Square className="h-4 w-4" style={{ color: mutedText }} />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-bold" style={{ color: headingColor }}>
                      {entry.name}
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold"
                        style={{
                          background: dark ? '#18181b' : '#f4f4f5',
                          color: dark ? '#ffffff' : '#172554',
                          border: `1px solid ${panelBorder}`,
                        }}
                      >
                        {entry.role}
                      </span>
                    </td>
                    <td className="p-3 font-medium" style={{ color: mutedText }}>
                      {entry.committee}
                    </td>
                    <td className="p-3 font-bold" style={{ color: dark ? '#ffffff' : '#172554' }}>
                      {entry.country}
                    </td>
                    <td className="p-3 font-mono font-medium" style={{ color: mutedText }}>
                      {entry.email}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleSendSingle(entry)}
                        title="Send Reminder & Official Credentials"
                        className="px-3 py-1.5 rounded-lg font-bold text-[11px] border transition shadow-sm inline-flex items-center gap-1.5"
                        style={{
                          background: isSent ? (dark ? '#18181b' : '#f0fdf4') : (dark ? '#27272a' : '#f4f4f5'),
                          color: isSent ? '#10b981' : (dark ? '#ffffff' : '#172554'),
                          borderColor: isSent ? '#059669' : (dark ? '#3f3f46' : '#cbd5e1'),
                        }}
                      >
                        <Bell className="h-3 w-3" />
                        <span>{isSent ? 'Reminder Sent ✓' : 'Send Reminder'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Logs */}
        {emailLogs.length > 0 && (
          <div className="p-3.5 rounded-xl border max-h-32 overflow-y-auto font-mono text-[11px]" style={{ background: dark ? '#18181b' : '#faf8f5', borderColor: panelBorder }}>
            <div className="font-bold mb-1" style={{ color: headingColor }}>
              Recent Dispatch Log:
            </div>
            {emailLogs.map((log, i) => (
              <div key={i} className="text-emerald-400 font-medium">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
