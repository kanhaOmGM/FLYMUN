import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ROSTER_MASTER_DATA } from '../../src/data/rosterData';

// ---------------------------------------------------------------------------
// Vercel Serverless Function: /api/gsl/add
// Backend validation for General Speakers List (GSL) additions:
// 1. Rejects if requester is not a Chair or Admin (403)
// 2. Rejects if target candidate is not a Delegate (422)
// 3. Rejects if target candidate is not assigned to the active committee (400)
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { committeeId, candidate, requester } = req.body || {};

    if (!committeeId || !candidate) {
      return res.status(400).json({ error: 'committeeId and candidate details are mandatory.' });
    }

    // 1. Verify Requester Permissions (Only Chair, Event Organiser, Admin)
    if (
      requester &&
      requester.role !== 'Chair' &&
      requester.role !== 'Event Organiser' &&
      requester.role !== 'Admin'
    ) {
      return res.status(403).json({
        error: 'Forbidden: Only committee chairs or event organizers can add speakers to the General Speakers List.',
      });
    }

    // 2. Verify Requester Committee Authorization (if specified)
    if (
      requester &&
      requester.role === 'Chair' &&
      requester.committee &&
      requester.committee !== 'Unassigned' &&
      requester.committee !== committeeId
    ) {
      return res.status(403).json({
        error: `Forbidden: You are authorized for ${requester.committee}, not ${committeeId}.`,
      });
    }

    // 3. Verify Target Candidate Role (Rule 1: Only Delegates)
    if (candidate.role && candidate.role !== 'Delegate') {
      return res.status(422).json({
        error: 'Only delegates can be added to the Speakers List.',
      });
    }

    // 4. Verify Against Master Roster
    const candidateName = (candidate.name || '').trim().toLowerCase();
    const candidateCountry = (candidate.country || '').trim().toLowerCase();

    const rosterMatch = ROSTER_MASTER_DATA.find(
      (r) =>
        r.name.toLowerCase().trim() === candidateName ||
        (r.country !== 'Unassigned' && r.country.toLowerCase().trim() === candidateCountry && r.committee === committeeId)
    );

    if (rosterMatch) {
      if (rosterMatch.role !== 'Delegate') {
        return res.status(422).json({
          error: 'Only delegates can be added to the Speakers List.',
        });
      }

      if (rosterMatch.committee !== committeeId && rosterMatch.committee !== 'Unassigned') {
        return res.status(400).json({
          error: `Cannot add delegate: ${rosterMatch.name} is not assigned to this committee.`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Candidate ${candidate.name || candidate.country} validated successfully for ${committeeId}.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Internal Server Error validating GSL candidate.',
    });
  }
}
