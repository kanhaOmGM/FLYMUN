export interface SingleGalleryItem {
  id: string;
  type: 'single';
  authorUid?: string;
  name: string;
  message: string;
  photoUrl: string;
  createdAt: number;
}

export interface InviteGalleryItem {
  id: string;
  type: 'invite';
  authorUid?: string;
  inviter: {
    name: string;
    message: string;
    photoUrl: string;
  };
  invitee: {
    name: string;
    message: string;
    photoUrl: string;
  };
  createdAt: number;
}

export type GalleryItem = SingleGalleryItem | InviteGalleryItem;

/** A pending invite stored in the `gallery_invites` Firestore collection. */
export interface GalleryInvite {
  id: string;
  inviter: {
    name: string;
    message: string;
    photoUrl: string;
  };
}

// ---------------------------------------------------------------------------
// User Profile (stored at Firestore `users/{uid}`)
// ---------------------------------------------------------------------------

export type UserRole = 'Chair' | 'Delegate' | 'Faculty Advisor' | 'Observer' | 'Event Organiser' | 'Admin';

/**
 * Check whether a given role has administrative / event organiser authority.
 */
export function isOrganiserRole(role?: string | null): boolean {
  if (!role) return false;
  const clean = role.toLowerCase().trim();
  return clean === 'event organiser' || clean === 'event organizer' || clean === 'admin' || clean === 'administrator';
}

export interface UserProfile {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  role: UserRole;
  committee: string;
  country: string;
  isP5: boolean;
  isOnboarded: boolean;
  createdAt?: number;
}

// ---------------------------------------------------------------------------
// Global MUN State (stored at Firestore `systemConfig/munState`)
// ---------------------------------------------------------------------------

export interface MUNState {
  isActive: boolean;
  updatedAt: number;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// Hand Raises
// ---------------------------------------------------------------------------

export interface RaisedHandItem {
  id: string;
  uid: string;
  name: string;
  country: string;
  committee: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// General Speakers List (GSL)
// ---------------------------------------------------------------------------

export interface SpeakerQueueItem {
  id: string;
  uid: string;
  name: string;
  country: string;
  committee: string;
  timestamp: number;
  status: 'waiting' | 'speaking' | 'completed';
  yieldType?: 'Chair' | 'Delegate' | 'Questions' | null;
  yieldTarget?: string;
  order?: number;
}

// ---------------------------------------------------------------------------
// Real-Time Committee Debate Timer
// ---------------------------------------------------------------------------

export interface CommitteeTimerState {
  committeeId: string;
  mode: 'Speaker' | 'Moderated Caucus' | 'Unmoderated Caucus' | 'General';
  running: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  updatedAt: number;
  topic?: string;
}

// ---------------------------------------------------------------------------
// Committee Motions
// ---------------------------------------------------------------------------

export interface CommitteeMotion {
  id: string;
  committeeId: string;
  proposerName: string;
  proposerCountry: string;
  topic: string;
  totalTime: number; // in seconds
  speakingTime: number; // in seconds
  type: 'Moderated Caucus' | 'Unmoderated Caucus' | 'Closure of Debate' | 'Adjournment' | 'Consultation of the Whole' | 'Formal Debate' | 'Other';
  status: 'pending' | 'active' | 'passed' | 'failed';
  createdAt: number;
}

// ---------------------------------------------------------------------------
// UNSC / General Voting
// ---------------------------------------------------------------------------

export interface VoteRecord {
  country: string;
  displayName: string;
  uid: string;
  vote: 'YES' | 'NO' | 'ABSTAIN';
  isP5: boolean;
}

export interface VoteResult {
  status: 'PASSED' | 'FAILED' | 'VETOED';
  reason: string;
}

export interface VotingSession {
  id: string;
  committeeId?: string;
  title: string;
  description: string;
  votingType?: 'Procedural' | 'Substantive';
  isSubstantive: boolean;
  createdBy: string;            // uid of the Chair
  createdByName: string;
  status: 'open' | 'closed';
  votes: Record<string, VoteRecord>;   // keyed by uid
  result: VoteResult | null;
  totalCouncilMembers: number;
  createdAt: number;
  closedAt?: number;
}