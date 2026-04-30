// ============================================
// HOMEKEEPER - Email Service (Resend API)
// ============================================

const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY;

// Sender email - uses verified domain from Resend account
// Domain: rentkeeper.co (verified in Resend dashboard)
const SENDER_EMAIL = 'noreply@rentkeeper.co';
const SENDER_NAME = 'HomeKeeper';

/**
 * Send an email using Resend API
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Network error sending email' };
  }
}

/**
 * Send a support message email from HomeKeeper
 */
export async function sendSupportEmail({
  userEmail,
  message,
}: {
  userEmail: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Support Request from HomeKeeper</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
        <h1 style="color: #F59E0B; font-size: 24px; margin: 0 0 20px;">HomeKeeper Support Request</h1>
        
        <p style="color: #333; font-size: 16px; margin: 0 0 10px;"><strong>From:</strong> ${userEmail}</p>
        
        <div style="border-top: 1px solid #eee; margin: 20px 0; padding-top: 20px;">
          <h2 style="color: #333; font-size: 18px; margin: 0 0 10px;">Message:</h2>
          <p style="color: #555; font-size: 15px; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="border-top: 1px solid #eee; margin: 20px 0; padding-top: 20px; font-size: 12px; color: #999;">
          <p>Sent from HomeKeeper App</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: 'support@rentkeeper.co',
    subject: `[HomeKeeper] Support from ${userEmail}`,
    html,
  });
}