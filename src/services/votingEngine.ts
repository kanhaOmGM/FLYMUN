// ---------------------------------------------------------------------------
// votingEngine – Pure logic for UNSC P5 veto evaluation
// ---------------------------------------------------------------------------

import type { VoteRecord, VoteResult } from '../types';

export const P5_COUNTRIES = [
  'China',
  'France',
  'Russian Federation',
  'United Kingdom',
  'United States',
] as const;

/**
 * Evaluate a UNSC vote according to official rules:
 *
 * Procedural votes:
 *   - Simple majority (YES > NO). P5 veto does NOT apply.
 *
 * Substantive votes (resolutions, amendments, sanctions):
 *   - Requires ≥ 9 affirmative votes out of totalCouncilMembers (default 15).
 *   - Any P5 "NO" vote immediately vetoes the resolution.
 *   - P5 "ABSTAIN" does NOT trigger a veto.
 */
export function evaluateUNSCVote(
  votes: VoteRecord[],
  isSubstantive: boolean,
  totalCouncilMembers: number = 15,
): VoteResult {
  const totalYes = votes.filter((v) => v.vote === 'YES').length;

  // ── Procedural vote: simple majority ──────────────────────────────────
  if (!isSubstantive) {
    const totalNo = votes.filter((v) => v.vote === 'NO').length;
    return {
      status: totalYes > totalNo ? 'PASSED' : 'FAILED',
      reason:
        totalYes > totalNo
          ? `Passed by procedural majority (${totalYes} YES vs ${totalNo} NO).`
          : `Failed procedural majority (${totalYes} YES vs ${totalNo} NO).`,
    };
  }

  // ── Substantive vote: check P5 veto first ─────────────────────────────
  const p5VetoCast = votes.some((v) => v.isP5 && v.vote === 'NO');

  if (p5VetoCast) {
    const vetoingCountries = votes
      .filter((v) => v.isP5 && v.vote === 'NO')
      .map((v) => v.country);
    return {
      status: 'VETOED',
      reason: `Resolution failed due to P5 Veto cast by: ${vetoingCountries.join(', ')}.`,
    };
  }

  // ── Substantive vote: check 9-vote threshold ──────────────────────────
  const threshold = Math.min(9, totalCouncilMembers);
  if (totalYes >= threshold) {
    return {
      status: 'PASSED',
      reason: `Resolution passed with ${totalYes}/${threshold} required affirmative votes and zero vetoes.`,
    };
  } else {
    return {
      status: 'FAILED',
      reason: `Failed: Received ${totalYes}/${threshold} required affirmative votes.`,
    };
  }
}
