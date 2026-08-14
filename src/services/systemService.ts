// ---------------------------------------------------------------------------
// systemService – Global MUN Workspace Activation & State in Firestore
// ---------------------------------------------------------------------------

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { MUNState } from '../types';

const SYSTEM_CONFIG_DOC = 'systemConfig/munState';

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
