// ---------------------------------------------------------------------------
// committeeService – Real-time Firestore sync for GSL, Timer, and Motions
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
  orderBy,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SpeakerQueueItem, CommitteeTimerState, CommitteeMotion } from '../types';

// ===========================================================================
// 1. General Speakers List (GSL)
// ===========================================================================

export function subscribeToSpeakerQueue(
  committeeId: string,
  callback: (items: SpeakerQueueItem[]) => void
): () => void {
  const q = query(
    collection(db, 'committee_speakers'),
    where('committee', '==', committeeId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const items: SpeakerQueueItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SpeakerQueueItem[];
    callback(items);
  });
}

export async function addSpeakerToQueue(
  committeeId: string,
  speaker: { uid: string; name: string; country: string }
): Promise<void> {
  await addDoc(collection(db, 'committee_speakers'), {
    uid: speaker.uid,
    name: speaker.name,
    country: speaker.country,
    committee: committeeId,
    timestamp: Date.now(),
    status: 'waiting',
  });
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
// 2. Real-Time Committee Debate Timer
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
// 3. Motions
// ===========================================================================

export function subscribeToMotions(
  committeeId: string,
  callback: (motions: CommitteeMotion[]) => void
): () => void {
  const q = query(
    collection(db, 'committee_motions'),
    where('committeeId', '==', committeeId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const motions: CommitteeMotion[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CommitteeMotion[];
    callback(motions);
  });
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
