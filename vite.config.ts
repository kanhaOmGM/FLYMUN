import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'api-serverless-dev',
        configureServer(server) {
          server.middlewares.use('/api/send-invite', async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const parsed = body ? JSON.parse(body) : {};
                const { email, name, role, committee, country } = parsed;
                const cleanEmail = String(email || '').toLowerCase().trim();
                const apiKey = (env.RESEND_API_KEY || process.env.RESEND_API_KEY || '').trim();
                const fromSender = (env.RESEND_FROM || process.env.RESEND_FROM || 'FLY MUN <onboarding@resend.dev>').trim();

                if (apiKey && apiKey !== 're_your_api_key_here' && apiKey.startsWith('re_')) {
                  const { Resend } = await import('resend');
                  const resend = new Resend(apiKey);
                  const { data, error } = await resend.emails.send({
                    from: fromSender,
                    to: [cleanEmail],
                    replyTo: 'futureleadersyouthemail@gmail.com',
                    subject: `Conference Reminder & Official Credentials: ${name} (${role})`,
                    html: `<p>Dear ${name}, this is your official FLY MUN credentials for ${committee} (${country}).</p>`,
                  });

                  if (error) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: error.message || 'Resend error' }));
                    return;
                  }

                  res.statusCode = 200;
                  res.end(JSON.stringify({ success: true, message: `Dispatched to ${cleanEmail}`, id: data?.id }));
                } else {
                  // Simulated dispatch for local development
                  res.statusCode = 200;
                  res.end(
                    JSON.stringify({
                      success: true,
                      simulated: true,
                      message: `[Dev Mode] Reminder simulated for ${cleanEmail}`,
                      id: `dev_${Date.now()}`,
                    })
                  );
                }
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || 'Server error' }));
              }
            });
          });
        },
      },
    ],
  };
});