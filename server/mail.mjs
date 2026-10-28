// Provider-neutral password-reset email, via SMTP env vars only.
// No credentials live in the repo: set these in Vercel (or .env.local):
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_FROM
//   APP_BASE_URL (for example https://starpulse-beta.vercel.app)
// The reset link base is APP_BASE_URL, or Vercel's own VERCEL_URL when
// running on Vercel. It is deliberately NOT built from the request's Host
// header: a forgot-password request is unauthenticated, so a forged Host
// header must never be able to steer a victim's reset link to another site.
// If no base URL and no SMTP settings are configured, sending is skipped
// and the caller must fail safe (generic success + administrator fallback).

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

export function resetBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return '';
}

// Returns true when an email was accepted for delivery, false otherwise.
// The reset URL (which carries the raw token) is never logged here.
export async function sendPasswordResetEmail(to, resetUrl) {
  if (!mailConfigured() || !resetUrl) return false;
  try {
    const { default: nodemailer } = await import('nodemailer');
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: 'Reset your DQ.lk password',
      text: `You asked to reset your DQ.lk password.\n\nUse this link within 1 hour. It works once only:\n${resetUrl}\n\nIf you did not ask for this, ignore this email — your password has not changed, and you can still sign in with it. If you cannot sign in at all, contact your DQ.lk administrator.`,
      html: `<p>You asked to reset your DQ.lk password.</p><p><a href="${resetUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">Reset your password</a> — this link works once only and expires in 1 hour.</p><p>If you did not ask for this, ignore this email — your password has not changed. If you cannot sign in at all, contact your DQ.lk administrator.</p>`,
    });
    return true;
  } catch {
    // The error may mention the recipient; it must never mention the token
    // or the reset URL, which are not included in this log line.
    console.error('Password-reset email failed to send.');
    return false;
  }
}
