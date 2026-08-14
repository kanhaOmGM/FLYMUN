// ---------------------------------------------------------------------------
// committeeService – Real-time Firestore sync for GSL, Hand Raises, Timer, and Motions
// ---------------------------------------------------------------------------

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SpeakerQueueItem, CommitteeTimerState, CommitteeMotion, RaisedHandItem } from '../types';

// ===========================================================================
// 1. Real-Time Hand Raises (Task 3)
// ===========================================================================

export function subscribeToRaisedHands(
  committeeId: string,
  callback: (hands: RaisedHandItem[]) => void
): () => void {
  const q = query(
    collection(db, 'committee_hands'),
    where('committee', '==', committeeId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const hands: RaisedHandItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RaisedHandItem[];

      // Sort client-side by timestamp ascending
      hands.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      callback(hands);
    },
    (err) => {
      console.warn('subscribeToRaisedHands listener warning:', err);
      callback([]);
    }
  );
}

export async function raiseHand(
  committeeId: string,
  delegate: { uid: string; name: string; country: string }
): Promise<string> {
  // Prevent duplicate hand raise for the same user in this committee
  const q = query(
    collection(db, 'committee_hands'),
    where('committee', '==', committeeId),
    where('uid', '==', delegate.uid)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }

  const ref = await addDoc(collection(db, 'committee_hands'), {
    uid: delegate.uid,
    name: delegate.name,
    country: delegate.country,
    committee: committeeId,
    timestamp: Date.now(),
  });
  return ref.id;
}

export async function lowerHand(handId: string): Promise<void> {
  await deleteDoc(doc(db, 'committee_hands', handId));
}

export async function lowerMyHand(committeeId: string, uid: string): Promise<void> {
  const q = query(
    collection(db, 'committee_hands'),
    where('committee', '==', committeeId),
    where('uid', '==', uid)
  );
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

export async function clearAllRaisedHands(committeeId: string): Promise<void> {
  const q = query(
    collection(db, 'committee_hands'),
    where('committee', '==', committeeId)
  );
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

// ===========================================================================
// 2. General Speakers List (GSL) & Yields (Task 4)
// ===========================================================================

export function subscribeToSpeakerQueue(
  committeeId: string,
  callback: (items: SpeakerQueueItem[]) => void
): () => void {
  // Single field query to eliminate composite index requirement
  const q = query(
    collection(db, 'committee_speakers'),
    where('committee', '==', committeeId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: SpeakerQueueItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as SpeakerQueueItem[];

      // Sort client-side by order/timestamp ascending
      items.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return (a.timestamp || 0) - (b.timestamp || 0);
      });
      callback(items);
    },
    (err) => {
      console.warn('subscribeToSpeakerQueue listener warning:', err);
      callback([]);
    }
  );
}

export async function addSpeakerToQueue(
  committeeId: string,
  speaker: { uid?: string; name: string; country: string }
): Promise<string> {
  const ref = await addDoc(collection(db, 'committee_speakers'), {
    uid: speaker.uid || `manual_${Date.now()}`,
    name: speaker.name,
    country: speaker.country,
    committee: committeeId,
    timestamp: Date.now(),
    status: 'waiting',
    yieldType: null,
    yieldTarget: null,
  });
  return ref.id;
}

export async function removeSpeakerFromQueue(speakerId: string): Promise<void> {
  await deleteDoc(doc(db, 'committee_speakers', speakerId));
}

export async function setSpeakerStatus(
  speakerId: string,
  status: 'waiting' | 'speaking' | 'completed'
): Promise<void> {
  await updateDoc(doc(db, 'committee_speakers', speakerId), { status });
}

export async function yieldSpeakerFloor(
  speakerId: string,
  yieldType: 'Chair' | 'Delegate' | 'Questions',
  yieldTarget?: string
): Promise<void> {
  await updateDoc(doc(db, 'committee_speakers', speakerId), {
    yieldType,
    yieldTarget: yieldTarget || null,
  });
}

export async function moveSpeakerInQueue(
  speakerId: string,
  direction: 'up' | 'down',
  currentQueue: SpeakerQueueItem[]
): Promise<void> {
  const waitingQueue = currentQueue.filter((s) => s.status === 'waiting');
  const index = waitingQueue.findIndex((s) => s.id === speakerId);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= waitingQueue.length) return;

  const currentSpeaker = waitingQueue[index];
  const targetSpeaker = waitingQueue[targetIndex];

  // Swap timestamps to reorder
  const tempTimestamp = currentSpeaker.timestamp;
  await updateDoc(doc(db, 'committee_speakers', currentSpeaker.id), {
    timestamp: targetSpeaker.timestamp,
  });
  await updateDoc(doc(db, 'committee_speakers', targetSpeaker.id), {
    timestamp: tempTimestamp,
  });
}

export async function clearSpeakerQueue(committeeId: string): Promise<void> {
  const q = query(
    collection(db, 'committee_speakers'),
    where('committee', '==', committeeId)
  );
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}

// ===========================================================================
// 3. Real-Time Committee Debate Timer
// ===========================================================================

export function subscribeToTimer(
  committeeId: string,
  callback: (timer: CommitteeTimerState | null) => void
): () => void {
  const ref = doc(db, 'committee_timers', committeeId);

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback(snap.data() as CommitteeTimerState);
  });
}

export async function setTimerState(
  committeeId: string,
  timerState: CommitteeTimerState
): Promise<void> {
  await setDoc(doc(db, 'committee_timers', committeeId), timerState, { merge: true });
}

export async function startTimer(
  committeeId: string,
  remainingSeconds: number,
  totalSeconds: number,
  mode: 'Speaker' | 'Moderated Caucus' | 'Unmoderated Caucus' | 'General' = 'Speaker',
  topic: string = ''
): Promise<void> {
  await setDoc(doc(db, 'committee_timers', committeeId), {
    committeeId,
    mode,
    running: true,
    remainingSeconds,
    totalSeconds,
    updatedAt: Date.now(),
    topic,
  });
}

export async function pauseTimer(
  committeeId: string,
  remainingSeconds: number
): Promise<void> {
  await updateDoc(doc(db, 'committee_timers', committeeId), {
    running: false,
    remainingSeconds,
    updatedAt: Date.now(),
  });
}

export async function resetTimer(
  committeeId: string,
  totalSeconds: number,
  mode: 'Speaker' | 'Moderated Caucus' | 'Unmoderated Caucus' | 'General' = 'Speaker'
): Promise<void> {
  await setDoc(doc(db, 'committee_timers', committeeId), {
    committeeId,
    mode,
    running: false,
    remainingSeconds: totalSeconds,
    totalSeconds,
    updatedAt: Date.now(),
  });
}

// ===========================================================================
// 4. Motions (Task 2 Fix)
// ===========================================================================

export function subscribeToMotions(
  committeeId: string,
  callback: (motions: CommitteeMotion[]) => void
): () => void {
  // Query without orderBy inside Firestore to avoid composite indexing errors
  const q = query(
    collection(db, 'committee_motions'),
    where('committeeId', '==', committeeId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const motions: CommitteeMotion[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CommitteeMotion[];

      // Sort client-side by creation timestamp descending
      motions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(motions);
    },
    (err) => {
      console.warn('subscribeToMotions listener warning:', err);
      callback([]);
    }
  );
}

export async function submitMotion(
  committeeId: string,
  motion: Omit<CommitteeMotion, 'id' | 'createdAt' | 'committeeId'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'committee_motions'), {
    ...motion,
    committeeId,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateMotionStatus(
  motionId: string,
  status: 'pending' | 'active' | 'passed' | 'failed'
): Promise<void> {
  await updateDoc(doc(db, 'committee_motions', motionId), { status });
}

export async function deleteMotion(motionId: string): Promise<void> {
  await deleteDoc(doc(db, 'committee_motions', motionId));
}
