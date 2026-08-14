// ---------------------------------------------------------------------------
// votingService – Firestore CRUD for the `voting_sessions` collection
// ---------------------------------------------------------------------------

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { VotingSession, VoteRecord, VoteResult } from '../types';
import { evaluateUNSCVote } from './votingEngine';

const sessionsCol = () => collection(db, 'voting_sessions');

// ── Create ──────────────────────────────────────────────────────────────────

export async function createVotingSession(data: {
  title: string;
  description: string;
  isSubstantive: boolean;
  createdBy: string;
  createdByName: string;
  totalCouncilMembers?: number;
}): Promise<string> {
  const docRef = await addDoc(sessionsCol(), {
    title: data.title,
    description: data.description,
    isSubstantive: data.isSubstantive,
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    status: 'open',
    votes: {},
    result: null,
    totalCouncilMembers: data.totalCouncilMembers ?? 15,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ── Cast Vote ───────────────────────────────────────────────────────────────

export async function castVote(
  sessionId: string,
  voteRecord: VoteRecord,
): Promise<void> {
  const ref = doc(db, 'voting_sessions', sessionId);
  await updateDoc(ref, {
    [`votes.${voteRecord.uid}`]: {
      country: voteRecord.country,
      displayName: voteRecord.displayName,
      uid: voteRecord.uid,
      vote: voteRecord.vote,
      isP5: voteRecord.isP5,
    },
  });
}

// ── Close & Evaluate ────────────────────────────────────────────────────────

export async function closeAndEvaluate(
  sessionId: string,
  votes: Record<string, VoteRecord>,
  isSubstantive: boolean,
  totalCouncilMembers: number,
): Promise<VoteResult> {
  const voteArray = Object.values(votes);
  const result = evaluateUNSCVote(voteArray, isSubstantive, totalCouncilMembers);

  const ref = doc(db, 'voting_sessions', sessionId);
  await updateDoc(ref, {
    status: 'closed',
    result,
    closedAt: serverTimestamp(),
  });

  return result;
}

// ── Subscribe ───────────────────────────────────────────────────────────────

export function subscribeToSessions(
  callback: (sessions: VotingSession[]) => void,
): () => void {
  const q = query(sessionsCol(), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sessions: VotingSession[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : Date.now(),
        closedAt:
          data.closedAt instanceof Timestamp
            ? data.closedAt.toMillis()
            : undefined,
      } as VotingSession;
    });
    callback(sessions);
  });
}
