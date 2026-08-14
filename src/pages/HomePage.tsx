import React, { useState } from 'react';
import {
  Globe,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Compass,
  HeartHandshake,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ROSTER_MASTER_DATA, COMMITTEES } from '../data/rosterData';
import type { UserProfile } from '../types';
import { isOrganiserRole } from '../types';

// ---------------------------------------------------------------------------
// Delegate & Committee Data derived from Master Roster
// ---------------------------------------------------------------------------

interface DelegateSeat {
  name: string;
  country: string;
  post: string;
}

interface CommitteeConfig {
  id: string;
  name: string;
  delegates: DelegateSeat[];
}

const COMMITTEE_CARDS: CommitteeConfig[] = COMMITTEES.map((commName) => {
  const delegates = ROSTER_MASTER_DATA
    .filter((r) => r.committee === commName)
    .map((r) => ({
      name: r.name,
      country: r.country,
      post: r.role,
    }));

  const isWHO = commName.includes('WHO');
  const isIPC = commName.includes('IPC');

  return {
    id: isWHO ? 'who' : isIPC ? 'ipc' : 'icj',
    name: commName,
    delegates,
  };
});

// ---------------------------------------------------------------------------
// Seating Dot Component
// ---------------------------------------------------------------------------

interface SeatProps {
  delegate: DelegateSeat;
  dark: boolean;
}

const Seat: React.FC<SeatProps> = ({ delegate, dark }) => {
  const [hovered, setHovered] = useState(false);

  const badgeColor = dark ? '#ffffff' : '#172554';

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 cursor-default group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Seat dot */}
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-offset-1 transition-transform duration-200"
        style={{
          background: dark ? '#000000' : '#172554',
          borderColor: dark ? '#71717a' : '#fde047',
          outline: dark ? '2px solid #3f3f46' : '2px solid #fef08a',
          transform: hovered ? 'scale(1.4)' : 'scale(1)',
          boxShadow: hovered ? (dark ? '0 0 10px #ffffff66' : '0 0 10px #fde047cc') : 'none',
        }}
      />

      {/* Tooltip on hover */}
      {hovered && (
        <div
          className="absolute bottom-full mb-2 z-50 p-3 rounded-xl shadow-xl border text-xs whitespace-nowrap min-w-[150px] text-center animate-in fade-in zoom-in-95"
          style={{
            background: dark ? '#18181b' : '#ffffff',
            borderColor: dark ? '#3f3f46' : '#e2e8f0',
            color: dark ? '#ffffff' : '#172554',
          }}
        >
          <p className="font-bold text-sm tracking-tight">{delegate.name}</p>
          <p className="text-[11px] font-mono opacity-80 mt-0.5" style={{ color: dark ? '#d4d4d8' : '#475569' }}>
            {delegate.country}
          </p>
          <span
            className="inline-block mt-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
            style={{
              background: dark ? '#27272a' : '#fef08a',
              color: badgeColor,
              border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
            }}
          >
            {delegate.post}
          </span>
        </div>
      )}

      {/* Name below dot */}
      <div className="text-center" style={{ maxWidth: '80px' }}>
        <p
          className="text-[10px] font-semibold leading-tight truncate font-sans"
          style={{ color: dark ? '#ffffff' : '#172554' }}
        >
          {delegate.name.split(' ')[0]}
        </p>
        <p
          className="text-[9px] leading-tight truncate opacity-80 font-mono mt-0.5"
          style={{ color: dark ? '#a1a1aa' : '#475569' }}
        >
          {delegate.country.startsWith('N/A') ? 'Chair' : delegate.country}
        </p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Cardless CommitteeSection (Divided by Thin Horizontal Line)
// ---------------------------------------------------------------------------

const CommitteeSection: React.FC<{ committee: CommitteeConfig; dark: boolean; isFirst?: boolean }> = ({
  committee,
  dark,
  isFirst,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Arrange delegates into rows
  const rows = [
    committee.delegates.slice(0, 4),
    committee.delegates.slice(4, 10),
    committee.delegates.slice(10, 18),
    committee.delegates.slice(18),
  ].filter((r) => r.length > 0);

  const dividerColor = dark ? '#27272a' : '#e2e8f0';

  return (
    <div
      className={`py-8 ${!isFirst ? 'border-t' : ''}`}
      style={{ borderColor: dividerColor }}
    >
      {/* Committee header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: dark ? '#ffffff' : '#172554' }}
          />
          <h3
            className="font-serif text-2xl sm:text-3xl font-normal tracking-tight"
            style={{ color: dark ? '#ffffff' : '#172554' }}
          >
            {committee.name}
          </h3>
          <span
            className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold ml-1 uppercase tracking-wider"
            style={{
              background: dark ? '#18181b' : '#fef08a',
              color: dark ? '#ffffff' : '#172554',
              border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
            }}
          >
            {committee.delegates.length} delegates
          </span>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: dark ? '#a1a1aa' : '#172554' }}
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {expanded && (
        <>
          {/* Podium / dais label */}
          <div className="flex justify-center mb-6">
            <div
              className="text-[10px] font-mono font-bold px-3.5 py-1 rounded-full tracking-widest uppercase"
              style={{
                background: dark ? '#18181b' : '#fef08a',
                color: dark ? '#ffffff' : '#172554',
                border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                letterSpacing: '0.18em',
              }}
            >
              Executive Board & Dais
            </div>
          </div>

          {/* Seat rows (arc arrangement) */}
          <div className="flex flex-col gap-6 items-center">
            {rows.map((row, ri) => (
              <div
                key={ri}
                className="flex flex-wrap justify-center gap-6"
                style={{
                  paddingLeft: `${ri * 12}px`,
                  paddingRight: `${ri * 12}px`,
                }}
              >
                {row.map((delegate) => (
                  <Seat
                    key={delegate.name}
                    delegate={delegate}
                    dark={dark}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap justify-center gap-4 pt-4">
            {[
              { label: 'Chair', color: dark ? '#ffffff' : '#172554' },
              { label: 'Delegate', color: dark ? '#a1a1aa' : '#1e3a8a' },
              { label: 'Faculty Advisor', color: dark ? '#d4d4d8' : '#334155' },
              { label: 'Observer', color: dark ? '#71717a' : '#64748b' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 font-mono text-[11px]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span
                  style={{ color: dark ? '#d4d4d8' : '#475569' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Official Awards Data
// ---------------------------------------------------------------------------

const OFFICIAL_AWARDS = [
  {
    index: '01',
    title: 'Best Delegate',
    desc: 'Awarded to the delegate who demonstrates exceptional leadership, diplomacy, research skills, public speaking ability, and strategic thinking throughout the conference.',
  },
  {
    index: '02',
    title: 'Outstanding Delegate',
    desc: 'Awarded to delegates who make significant contributions to committee discussions and consistently demonstrate excellent preparation and engagement.',
  },
  {
    index: '03',
    title: 'Honorable Mention',
    desc: 'Awarded to delegates who display remarkable potential, strong communication skills, and a commitment to collaboration.',
  },
  {
    index: '04',
    title: 'Best Position Paper',
    desc: 'Awarded to the delegate who submits the most comprehensive, persuasive, and well-researched position paper.',
  },
  {
    index: '05',
    title: 'Best Committee',
    desc: 'Awarded to the committee that demonstrates the highest overall level of debate, engagement, diplomacy, collaboration, professionalism, and substantive progress throughout the conference.',
  },
  {
    index: '06',
    title: 'Best Chair',
    desc: 'Awarded to the Chair who demonstrates exceptional leadership, impartiality, procedural knowledge, debate management, and professionalism while creating a fair and engaging committee environment.',
  },
];

// ---------------------------------------------------------------------------
// HomePage Component
// ---------------------------------------------------------------------------

interface HomePageProps {
  profile?: UserProfile | null;
}

export const HomePage: React.FC<HomePageProps> = ({ profile }) => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const headingColor = dark ? '#ffffff' : '#172554';
  const mutedText = dark ? '#a1a1aa' : '#475569';
  const dividerBorder = dark ? '#27272a' : '#e2e8f0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-20 font-sans">

      {/* ── 1. Editorial Terminal Hero Section ──────────────────────────── */}
      <div className="text-center space-y-6 pt-4">

        {/* Terminal Header Kicker / Live Indicator */}
        <div className="flex items-center justify-center gap-3">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border"
            style={{
              background: dark ? '#18181b' : '#faf8f5',
              borderColor: dividerBorder,
              color: dark ? '#d4d4d8' : '#334155',
            }}
          >

            <span>WELCOME TO THE FIRST EVER MUN BY FLY</span>
          </span>
        </div>

        {/* Logged in Welcome Chip */}
        {profile && profile.isOnboarded && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm text-xs font-mono animate-in fade-in"
            style={{
              background: dark ? '#18181b' : '#fef08a',
              borderColor: dark ? '#3f3f46' : '#fde047',
              color: dark ? '#ffffff' : '#172554',
            }}
          >

            <span>
              AUTHENTICATED: <strong>{profile.name || profile.displayName}</strong> [
              {isOrganiserRole(profile.role)
                ? `${profile.role} · Global Administration`
                : `${profile.country.startsWith('N/A') ? 'General' : profile.country} · ${profile.role} of ${profile.committee}`}
              ]
            </span>
          </div>
        )}

        {/* Editorial Serif Hero Title */}
        <div className="max-w-4xl mx-auto space-y-3">
          <h1
            className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.98]"
            style={{ color: headingColor }}
          >
            FL.Y Model UN
          </h1>
          <p
            className="font-serif italic text-2xl sm:text-3xl text-opacity-90 tracking-tight"
            style={{ color: dark ? '#d4d4d8' : '#1e3a8a' }}
          >
            Diplomacy in Action &amp; Next-Gen Leadership
          </p>
        </div>

        {/* Editorial Subtitle */}
        <p
          className="text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed"
          style={{ color: mutedText }}
        >
          Official simulation platform orchestrating specialized procedures for WHO, International Press Corps, and International Court of Justice.
        </p>
      </div>

      {/* ── 2. Top Info Highlights (Numbered Editorial Cards) ───────────── */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            num: '01',
            Icon: Globe,
            title: 'Specialized Committees',
            body: 'Simulation of global health directives in WHO, live journalistic reporting in IPC, and jurisprudence in the ICJ.',
          },
          {
            num: '02',
            Icon: Users,
            title: 'Interactive MUN Workspace',
            body: 'Synchronized delegate roster with real-time General Speakers List (GSL), debate timers, and caucus voting.',
          },
          {
            num: '03',
            Icon: Award,
            title: 'Diplomatic Recognition',
            body: 'Distinctions honoring Best Delegate, Best Journalist, Outstanding Advocate, and Honorable Mentions.',
          },
        ].map(({ num, Icon, title, body }) => (
          <div
            key={title}
            className="p-7 rounded-2xl border transition duration-200 shadow-sm flex flex-col justify-between"
            style={{
              background: dark ? '#000000' : '#ffffff',
              borderColor: dividerBorder,
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-semibold tracking-widest text-slate-500">
                  {num} //
                </span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: dark ? '#18181b' : '#fef08a',
                    border: dark ? '1px solid #3f3f46' : '1px solid #fde047',
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: dark ? '#ffffff' : '#172554' }} />
                </div>
              </div>
              <h3
                className="font-serif text-2xl font-normal mb-2.5 tracking-tight"
                style={{ color: headingColor }}
              >
                {title}
              </h3>
              <p className="text-sm font-normal leading-relaxed" style={{ color: mutedText }}>
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Conference Committee Seating (Cardless, Divided by Lines) ── */}
      <div className="border-t pt-12" style={{ borderColor: dividerBorder }}>
        <div className="text-center mb-10 space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500 block">
            CHAMBER ROSTER &amp; FLOOR PLAN
          </span>
          <h2
            className="font-serif text-3xl sm:text-5xl font-normal tracking-tight"
            style={{ color: headingColor }}
          >
            Conference Committee Seating
          </h2>
          <p
            className="font-normal text-sm sm:text-base max-w-xl mx-auto"
            style={{ color: mutedText }}
          >
            Hover over any seat dot to inspect assigned participants, country delegations, and diplomatic posts.
          </p>
        </div>

        <div>
          {COMMITTEE_CARDS.map((committee, index) => (
            <CommitteeSection
              key={committee.id}
              committee={committee}
              dark={dark}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>

      {/* ── 4. Awards Section (Cardless, Horizontally Scrollable) ──────── */}
      <div className="border-t pt-12" style={{ borderColor: dividerBorder }}>
        <div className="mb-8 space-y-1">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500 block">
            HONORS &amp; DISTINCTIONS
          </span>
          <h2
            className="font-serif text-3xl sm:text-5xl font-normal tracking-tight"
            style={{ color: headingColor }}
          >
            Official Conference Honors
          </h2>
          <p className="text-xs sm:text-sm font-normal" style={{ color: mutedText }}>
            Scroll horizontally to review the criteria for distinctions and commendations.
          </p>
        </div>

        {/* Horizontal Scrollable Container */}
        <div className="overflow-x-auto pb-6 pt-1 flex gap-5 snap-x">
          {OFFICIAL_AWARDS.map((award) => (
            <div
              key={award.title}
              className="min-w-[290px] sm:min-w-[320px] max-w-[340px] flex-shrink-0 p-6 rounded-2xl border transition shadow-sm flex flex-col justify-between snap-start"
              style={{
                background: dark ? '#000000' : '#ffffff',
                borderColor: dividerBorder,
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-semibold text-slate-500">
                    {award.index}
                  </span>
                  <Award className="h-4 w-4 opacity-70" style={{ color: headingColor }} />
                </div>
                <h3
                  className="font-serif text-xl sm:text-2xl font-normal mb-2 tracking-tight"
                  style={{ color: headingColor }}
                >
                  {award.title}
                </h3>
                <p
                  className="text-xs sm:text-sm leading-relaxed font-normal"
                  style={{ color: mutedText }}
                >
                  {award.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};