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
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
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

/**
 * Admin utility to manually register a participant and claim their seat.
 */
export async function adminRegisterParticipant(data: {
  name: string;
  email: string;
  role: UserRole;
  committee: string;
  country: string;
}): Promise<string> {
  const isOrganiser = isOrganiserRole(data.role);
  const syntheticUid = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const seatKey = isOrganiser
    ? `event_organiser__${syntheticUid}`
    : getSeatKey(data.role, data.committee, data.country, data.name);

  // 1. Claim seat in Firestore
  await setDoc(
    doc(db, 'claimed_seats', seatKey),
    {
      seatKey,
      uid: syntheticUid,
      email: data.email,
      name: data.name,
      role: data.role,
      committee: data.committee,
      country: data.country,
      claimedAt: Date.now(),
      registeredByAdmin: true,
    },
    { merge: true }
  );

  // 2. Pre-create user profile in Firestore
  await setDoc(
    doc(db, 'users', syntheticUid),
    {
      uid: syntheticUid,
      name: data.name,
      displayName: data.name,
      email: data.email,
      role: data.role,
      committee: data.committee,
      country: data.country,
      isP5: isP5Country(data.country),
      isOnboarded: true,
      registeredByAdmin: true,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return syntheticUid;
}

/**
 * Permanently ban an email and remove the member from all active rosters, claimed seats, and user collections.
 */
export async function adminBanAndRemoveMember(
  email: string,
  name?: string,
  reason?: string
): Promise<{ deletedSeats: number; deletedUsers: number }> {
  if (!email) throw new Error('Email is required to ban a member.');
  const cleanEmail = email.toLowerCase().trim();

  // 1. Record in banned_emails collection in Firestore
  const bannedDocRef = doc(db, 'banned_emails', cleanEmail.replace(/[^a-z0-9]/g, '_'));
  await setDoc(bannedDocRef, {
    email: cleanEmail,
    name: name || 'Unknown Participant',
    reason: reason || 'Permanently removed and banned by administrator',
    bannedAt: Date.now(),
  });

  // 2. Delete all claimed seats matching this email
  const seatsQuery = query(collection(db, 'claimed_seats'), where('email', '==', cleanEmail));
  const seatsSnap = await getDocs(seatsQuery);
  const batch1 = writeBatch(db);
  seatsSnap.forEach((d) => batch1.delete(d.ref));
  await batch1.commit();

  // 3. Delete any user profiles matching this email
  const usersQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
  const usersSnap = await getDocs(usersQuery);
  const batch2 = writeBatch(db);
  usersSnap.forEach((d) => batch2.delete(d.ref));
  await batch2.commit();

  // 4. Delete any custom participant entry
  try {
    const customDocRef = doc(db, 'custom_participants', cleanEmail.replace(/[^a-z0-9]/g, '_'));
    await deleteDoc(customDocRef);
  } catch (err) {
    console.warn('Custom participant deletion warning:', err);
  }

  // 5. Delete from committee speakers and hands if present
  try {
    const speakersQuery = query(collection(db, 'committee_speakers'), where('name', '==', name || ''));
    const speakersSnap = await getDocs(speakersQuery);
    const batch3 = writeBatch(db);
    speakersSnap.forEach((d) => batch3.delete(d.ref));
    await batch3.commit();
  } catch (err) {
    console.warn('Speaker cleanup warning:', err);
  }

  return {
    deletedSeats: seatsSnap.size,
    deletedUsers: usersSnap.size,
  };
}

/**
 * Remove an email from the banned list.
 */
export async function adminUnbanMember(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const bannedDocRef = doc(db, 'banned_emails', cleanEmail.replace(/[^a-z0-9]/g, '_'));
  await deleteDoc(bannedDocRef);
}

/**
 * Check whether an email is currently banned.
 */
export async function isEmailBanned(email: string): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const bannedDocRef = doc(db, 'banned_emails', cleanEmail.replace(/[^a-z0-9]/g, '_'));
  const snap = await getDoc(bannedDocRef);
  return snap.exists();
}

/**
 * Subscribe to real-time banned emails.
 */
export function subscribeToBannedEmails(
  callback: (bannedList: Array<{ email: string; name?: string; reason?: string; bannedAt?: number }>) => void
): () => void {
  const colRef = collection(db, 'banned_emails');
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as { email: string; name?: string; reason?: string; bannedAt?: number });
      callback(list);
    },
    (err) => {
      console.warn('Banned emails listener warning:', err);
      callback([]);
    }
  );
}

/**
 * Add a dynamic participant that persists in Firestore across all clients and appears on the seating chart/roster.
 */
export async function adminAddCustomParticipant(data: {
  name: string;
  email: string;
  role: UserRole;
  committee: string;
  country: string;
}): Promise<string> {
  const cleanEmail = data.email.toLowerCase().trim();
  const docKey = cleanEmail.replace(/[^a-z0-9]/g, '_');

  // 1. Save to custom_participants in Firestore
  const customRef = doc(db, 'custom_participants', docKey);
  await setDoc(customRef, {
    name: data.name.trim(),
    email: cleanEmail,
    role: data.role,
    committee: data.committee,
    model_country_assigned: data.country.trim() || (data.role === 'Chair' ? 'Unassigned' : 'General Representation'),
    addedAt: Date.now(),
  });

  // 2. Also register participant and claim seat
  return await adminRegisterParticipant({
    name: data.name.trim(),
    email: cleanEmail,
    role: data.role,
    committee: data.committee,
    country: data.country.trim() || (data.role === 'Chair' ? 'Unassigned' : 'General Representation'),
  });
}

/**
 * Subscribe to custom participants added by admins.
 */
export function subscribeToCustomParticipants(
  callback: (participants: Array<{ name: string; email: string; role: UserRole; committee: string; country: string }>) => void
): () => void {
  const colRef = collection(db, 'custom_participants');
  return onSnapshot(
    colRef,
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          committee: data.committee,
          country: data.model_country_assigned || data.country || 'Unassigned',
        };
      });
      callback(list);
    },
    (err) => {
      console.warn('Custom participants listener warning:', err);
      callback([]);
    }
  );
}

