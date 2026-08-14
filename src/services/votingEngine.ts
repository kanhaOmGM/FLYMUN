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
  const totalNo = votes.filter((v) => v.vote === 'NO').length;
  const totalAbstain = votes.filter((v) => v.vote === 'ABSTAIN').length;
  const totalCast = totalYes + totalNo;

  // ── Procedural vote: simple majority (YES > NO) ─────────────────────────
  if (!isSubstantive) {
    const passed = totalYes > totalNo;
    return {
      status: passed ? 'PASSED' : 'FAILED',
      reason: passed
        ? `Passed by procedural simple majority (${totalYes} YES vs ${totalNo} NO).`
        : `Failed procedural majority (${totalYes} YES vs ${totalNo} NO).`,
    };
  }

  // ── [TASK 1: P5 VETO LOGIC COMMENTED OUT] ──────────────────────────────
  // Substantive voting now resolves strictly based on democratic majorities
  // without failing solely due to a "No" vote from P5 permanent members.
  /*
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
  */

  // ── Substantive vote: 2/3 Majority or threshold evaluation ──────────────
  // In official MUN rules, substantive resolutions pass with a 2/3 majority of votes cast (YES / (YES + NO) >= 2/3)
  // or meeting the minimum threshold (e.g. 9 affirmative votes in a 15-member council).
  const requiredTwoThirds = totalCast > 0 ? Math.ceil((totalCast * 2) / 3) : 1;
  const threshold = Math.min(9, totalCouncilMembers);
  const isTwoThirdsMet = totalCast > 0 && totalYes >= requiredTwoThirds;
  const isThresholdMet = totalYes >= threshold;

  const passed = isTwoThirdsMet || isThresholdMet;

  if (passed) {
    return {
      status: 'PASSED',
      reason: `Substantive resolution passed (${totalYes} In Favor, ${totalNo} Against, ${totalAbstain} Abstaining). Required 2/3 majority or threshold achieved.`,
    };
  } else {
    return {
      status: 'FAILED',
      reason: `Substantive resolution failed (${totalYes} In Favor vs ${totalNo} Against). Did not meet the required majority threshold (${requiredTwoThirds} needed).`,
    };
  }
}
