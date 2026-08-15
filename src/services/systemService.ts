// ---------------------------------------------------------------------------
// systemService – Global MUN Workspace Activation, Reset, & State in Firestore
// ---------------------------------------------------------------------------

import {
  doc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { MUNState } from '../types';
import { ROSTER_MASTER_DATA } from '../data/rosterData';

/**
 * Subscribe to the real-time global MUN activation lock state.
 */
export function subscribeToMUNState(callback: (state: MUNState) => void): () => void {
  const docRef = doc(db, 'systemConfig', 'munState');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
          updatedAt: data.updatedAt || Date.now(),
          updatedBy: data.updatedBy || 'Admin',
        });
      } else {
        // Default to active if document has not been initialized yet
        callback({
          isActive: true,
          updatedAt: Date.now(),
          updatedBy: 'System Default',
        });
      }
    },
    (error) => {
      console.warn('Firestore systemConfig subscription warning (using active fallback):', error);
      callback({
        isActive: true,
        updatedAt: Date.now(),
        updatedBy: 'Offline Fallback',
      });
    }
  );
}

/**
 * Update the global MUN activation state (Event Organiser only).
 */
export async function setMUNState(isActive: boolean, updatedBy?: string): Promise<void> {
  const docRef = doc(db, 'systemConfig', 'munState');
  await setDoc(
    docRef,
    {
      isActive,
      updatedAt: Date.now(),
      updatedBy: updatedBy || 'Event Organiser',
    },
    { merge: true }
  );
}

/**
 * Purge all collections in Firestore and reset the platform to a clean state with 101 official participants.
 */
export async function purgeAndSeedDatabase(): Promise<{
  deletedCounts: Record<string, number>;
  totalSeeded: number;
}> {
  const targetCollections = [
    'users',
    'claimed_seats',
    'committee_speakers',
    'committee_hands',
    'committee_motions',
    'voting_sessions',
    'committee_timers',
    'custom_participants',
    'banned_emails',
  ];

  const deletedCounts: Record<string, number> = {};

  // 1. Delete all documents across all dynamic collections
  for (const colName of targetCollections) {
    try {
      const snap = await getDocs(collection(db, colName));
      deletedCounts[colName] = snap.size;

      if (snap.size > 0) {
        // Firestore batches support up to 500 operations
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch (colErr) {
      console.warn(`Warning cleaning collection ${colName}:`, colErr);
      deletedCounts[colName] = 0;
    }
  }

  // 2. Reset system activation state
  try {
    const configRef = doc(db, 'systemConfig', 'munState');
    await setDoc(configRef, {
      isActive: true,
      updatedAt: Date.now(),
      updatedBy: 'System Wipe Routine',
    });
  } catch (confErr) {
    console.warn('Warning updating systemConfig:', confErr);
  }

  // 3. Clear local storage / session storage keys
  if (typeof window !== 'undefined') {
    try {
      const keysToClear = ['cached_roster', 'gsl_queue', 'fly_mun_draft', 'last_committee', 'attendance_cache'];
      keysToClear.forEach((k) => {
        window.localStorage.removeItem(k);
        window.sessionStorage.removeItem(k);
      });
    } catch (storageErr) {
      console.warn('Storage clear warning:', storageErr);
    }
  }

  // 4. Seed clean claimed seats records in Firestore for the 101 official participants
  let totalSeeded = 0;
  try {
    const batch = writeBatch(db);
    ROSTER_MASTER_DATA.forEach((participant) => {
      // Document key format: safe sanitized key
      const seatKey = `${participant.committee.replace(/[^a-zA-Z0-9]/g, '_')}_${participant.country.replace(/[^a-zA-Z0-9]/g, '_')}_${participant.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const seatRef = doc(db, 'claimed_seats', seatKey);
      batch.set(seatRef, {
        name: participant.name,
        email: participant.email,
        role: participant.role,
        committee: participant.committee,
        country: participant.country,
        claimedAt: Date.now(),
        isOfficialRoster: true,
      });
      totalSeeded++;
    });
    await batch.commit();
  } catch (seedErr) {
    console.warn('Warning seeding official claimed seats:', seedErr);
  }

  return {
    deletedCounts,
    totalSeeded,
  };
}
