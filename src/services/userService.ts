// ---------------------------------------------------------------------------
// userService – Firestore CRUD for `users` and `claimed_seats`
// ---------------------------------------------------------------------------

import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile, UserRole } from '../types';
import { isOrganiserRole } from '../types';

const P5_COUNTRIES = [
  'China',
  'France',
  'Russian Federation',
  'United Kingdom',
  'United States',
] as const;

export function isP5Country(country: string): boolean {
  return (P5_COUNTRIES as readonly string[]).includes(country);
}

/**
 * Generate a sanitized unique identifier for a seat.
 */
export function getSeatKey(role: string, committee: string, country: string, name: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${clean(role)}__${clean(committee)}__${clean(country)}__${clean(name)}`;
}

export interface ClaimedSeatRecord {
  seatKey: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  committee: string;
  country: string;
  claimedAt: number;
}

/**
 * Subscribe to all currently claimed seats in real-time.
 */
export function subscribeToClaimedSeats(
  callback: (claimedMap: Record<string, ClaimedSeatRecord>) => void
): () => void {
  const colRef = collection(db, 'claimed_seats');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, ClaimedSeatRecord> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          seatKey: d.id,
          uid: data.uid,
          email: data.email,
          name: data.name,
          role: data.role,
          committee: data.committee,
          country: data.country,
          claimedAt: data.claimedAt || Date.now(),
        };
      });
      callback(map);
    },
    (error) => {
      console.warn('claimed_seats listener warning:', error);
      callback({});
    }
  );
}

/**
 * Fetch a user profile from Firestore. Returns null if not found.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

/**
 * Create or merge a user profile in Firestore AND claim the seat.
 * Multiple Event Organisers / Admins are supported without seat collisions.
 */
export async function saveUserProfile(
  uid: string,
  data: {
    name: string;
    displayName: string;
    email: string;
    role: UserRole;
    committee: string;
    country: string;
  },
): Promise<void> {
  const isOrganiser = isOrganiserRole(data.role);
  // For Event Organisers / Admins, key by UID so each organizer has a distinct non-colliding seat record
  const seatKey = isOrganiser
    ? `event_organiser__${uid}`
    : getSeatKey(data.role, data.committee, data.country, data.name);

  const seatDocRef = doc(db, 'claimed_seats', seatKey);
  const seatSnap = await getDoc(seatDocRef);

  // If not an organiser role and already claimed by another user, reject
  if (!isOrganiser && seatSnap.exists()) {
    const existing = seatSnap.data();
    if (existing.uid && existing.uid !== uid) {
      throw new Error(
        `This seat (${data.name} - ${data.role} of ${data.committee}) has already been claimed by another user account (${existing.email}).`
      );
    }
  }

  // 1. Save seat claim
  await setDoc(
    seatDocRef,
    {
      seatKey,
      uid,
      email: data.email,
      name: data.name,
      role: data.role,
      committee: data.committee,
      country: data.country,
      claimedAt: Date.now(),
    },
    { merge: true }
  );

  // 2. Save user profile
  await setDoc(
    doc(db, 'users', uid),
    {
      ...data,
      isP5: isP5Country(data.country),
      isOnboarded: true,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
