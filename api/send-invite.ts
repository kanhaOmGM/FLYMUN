import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Vercel Serverless Function: /api/send-invite
// Securely dispatches official personalized HTML reminder & assignment emails via Resend
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { email, name, role, committee, country, portalUrl } = req.body || {};

    if (!email || !name || !role) {
      return res.status(400).json({
        error: 'Missing required fields: email, name, and role are mandatory.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const rawPortalUrl = portalUrl || process.env.VITE_PORTAL_URL || 'https://flymun.vercel.app';
    const targetUrl = rawPortalUrl.includes('#') ? rawPortalUrl : `${rawPortalUrl.replace(/\/$/, '')}/#/mun`;
    const apiKey = (process.env.RESEND_API_KEY || '').trim();

    const emailSubject = `Conference Reminder & Official Credentials: ${name} (${role})`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; color: #172554; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 28px; }
          .title { font-size: 28px; font-weight: 900; color: #172554; margin: 0 0 6px 0; }
          .subtitle { font-size: 13px; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .alert-box { background: #fef08a33; border: 1px solid #fde047; border-radius: 12px; padding: 14px 18px; margin: 18px 0; font-size: 14px; font-weight: 700; color: #172554; }
          .card { background: #faf8f5; border-radius: 12px; border: 1px solid #cbd5e1; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .row:last-child { margin-bottom: 0; }
          .label { font-weight: bold; color: #475569; }
          .value { font-weight: 800; color: #172554; }
          .badge { display: inline-block; background: #fef08a; color: #172554; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 12px; border: 1px solid #fde047; }
          .btn-container { text-align: center; margin: 32px 0 20px 0; }
          .btn { display: inline-block; background-color: #fef08a; color: #172554; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 900; font-size: 15px; border: 1px solid #fde047; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">FLY MUN</h1>
            <p class="subtitle">Future Leaders Youth International Model UN</p>
          </div>

          <div class="alert-box">
             Official Conference Reminder & Credentials
          </div>

          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 14px;">
            Dear <strong>${name}</strong>,
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This is an official reminder regarding your upcoming participation in the <strong>FLY Model United Nations Conference</strong>. Below are your assigned credentials and committee seat:
          </p>

          <div class="card">
            <div class="row">
              <span class="label">Participant Name:</span>
              <span class="value">${name}</span>
            </div>
            <div class="row">
              <span class="label">Assigned Role:</span>
              <span class="value"><span class="badge">${role}</span></span>
            </div>
            <div class="row">
              <span class="label">Committee:</span>
              <span class="value">${committee || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Representation:</span>
              <span class="value">${country || 'N/A'}</span>
            </div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            To access the <strong>Interactive MUN Workspace</strong>, synchronized debate timers, General Speakers List, and resolution voting, please sign in with your email address (<strong>${cleanEmail}</strong>):
          </p>

          <div class="btn-container">
            <a href="${targetUrl}" class="btn">Enter Interactive MUN Workspace →</a>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} FLY Model United Nations. Fostering diplomatic excellence & global leadership.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // ── Resend API Dispatch ────────────────────────────────────────────────
    if (apiKey && apiKey !== 're_your_api_key_here') {
      const resend = new Resend(apiKey);
      const fromSender = (process.env.RESEND_FROM || 'FLY MUN <onboarding@resend.dev>').trim();

      const { data, error } = await resend.emails.send({
        from: fromSender,
        to: [cleanEmail],
        replyTo: "futureleadersyouthemail@gmail.com",
        subject: emailSubject,
        html: emailHtml,
      });

      if (error) {
        console.error('Resend dispatch error:', error);
        return res.status(400).json({
          error: error.message || 'Failed to dispatch email via Resend API.',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Reminder email successfully dispatched to ${cleanEmail}`,
        id: data?.id,
      });
    } else {
      // Fallback if no valid API key is set yet
      console.log(`[SIMULATED EMAIL DISPATCH] To: ${cleanEmail} | Subject: ${emailSubject}`);
      return res.status(200).json({
        success: true,
        simulated: true,
        message: `Simulated dispatch for ${cleanEmail}. Add RESEND_API_KEY in Vercel to send live emails.`,
      });
    }
  } catch (error: any) {
    console.error('Email API route error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal Server Error while dispatching email.',
    });
  }
}
