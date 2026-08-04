const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const { Resend } = require('resend');
const mongoose   = require('mongoose');
const AppError   = require('./AppError');

/* ── Resend client ────────────────────────────────
   Sends over plain HTTPS (port 443), same as any other API call — unlike
   raw SMTP sockets, there's no port to get silently blocked/filtered by
   a host's outbound network rules. That's what was causing requests to
   hang for minutes against smtp.zoho.in:465 on Render before timing out. */
let _resend = null;
const getResend = () => {
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};


/* ── OtpRecord schema ────────────────────────────── */
const OtpRecordSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  purpose:   { type: String, required: true },
  codeHash:  { type: String, required: true },
  expiresAt: { type: Date,   required: true },
}, { timestamps: false });

OtpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpRecordSchema.index({ email: 1, purpose: 1 });

const OtpRecord = mongoose.models.OtpRecord
  || mongoose.model('OtpRecord', OtpRecordSchema);

/* ── Helpers ─────────────────────────────────────── */
const SALT_ROUNDS     = 10;
const OTP_EXPIRES_MIN = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
const generateCode    = () => String(crypto.randomInt(100000, 999999));

/* ── Digit colors for the gradient effect ─────────── */
const DIGIT_COLORS = ['#22d3ee', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'];

/* ── Build individual digit cells ─────────────────── */
const buildDigitCells = (code) =>
  code.split('').map((digit, i) => `
    <td style="
      width:44px;height:52px;
      background:rgba(99,102,241,0.15);
      border:1.5px solid rgba(99,102,241,0.45);
      border-radius:10px;
      text-align:center;
      vertical-align:middle;
      font-size:28px;
      font-weight:800;
      color:${DIGIT_COLORS[i]};
      font-family:'Courier New',monospace;
    ">${digit}</td>
  `).join('');

/* ── Email HTML builder ──────────────────────────── */
const buildEmailHtml = (code, purpose, expiresMin) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>SkillSphere OTP</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',system-ui,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td align="center" style="
              background:linear-gradient(135deg,#0ea5e9 0%,#6366f1 50%,#a855f7 100%);
              border-radius:16px 16px 0 0;
              padding:36px 24px 32px;
            ">
              <div style="margin-bottom:14px;">
                <svg width="52" height="52" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="19" fill="rgba(255,255,255,0.15)"/>
                  <path d="M20 4 A16 16 0 0 1 36 20" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                  <path d="M20 36 A16 16 0 0 1 4 20" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                  <circle cx="20" cy="4"  r="2.5" fill="white"/>
                  <circle cx="36" cy="20" r="2"   fill="rgba(255,255,255,0.7)"/>
                  <circle cx="20" cy="36" r="2.5" fill="rgba(255,255,255,0.8)"/>
                  <circle cx="4"  cy="20" r="2"   fill="rgba(255,255,255,0.6)"/>
                  <circle cx="20" cy="20" r="4" fill="white"/>
                  <circle cx="20" cy="20" r="2" fill="#6366f1"/>
                </svg>
              </div>
              <div style="font-size:26px;font-weight:800;color:white;letter-spacing:-0.03em;line-height:1;">
                Skill<span style="opacity:0.85">Sphere</span>
              </div>
              <div style="margin-top:6px;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:0.1em;font-weight:500;">
                AI-POWERED HIRING INTELLIGENCE
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#1a1a2e;padding:36px 32px 28px;">
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f1f5f9;">
                Hi there,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
                ${purpose === 'signup'
                  ? 'You recently created a SkillSphere account. To complete your registration, please use the verification code below.'
                  : 'You recently requested to reset your SkillSphere password. Use the verification code below to proceed.'}
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="
                    background:linear-gradient(135deg,#1e1b4b,#0f172a);
                    border:1.5px solid rgba(99,102,241,0.4);
                    border-radius:14px;
                    padding:28px 16px;
                  ">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.15em;color:#818cf8;margin-bottom:20px;text-transform:uppercase;">
                      Your Verification Code
                    </div>

                    <!-- Each digit in its own table cell — never wraps -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;border-collapse:separate;border-spacing:8px 0;">
                      <tr>${buildDigitCells(code)}</tr>
                    </table>

                    <div style="
                      display:inline-block;
                      background:rgba(99,102,241,0.12);
                      border:1px solid rgba(99,102,241,0.25);
                      border-radius:20px;
                      padding:6px 16px;
                      font-size:12px;
                      color:#a5b4fc;
                      font-weight:500;
                    ">
                      &#9201; This code expires in ${expiresMin} minutes
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                Enter this code on the verification screen to
                ${purpose === 'signup' ? 'complete your account setup.' : 'reset your password.'}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              background:#12122a;
              border-radius:0 0 16px 16px;
              padding:20px 32px;
              border-top:1px solid rgba(99,102,241,0.15);
              text-align:center;
            ">
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                If you didn't request this, you can safely ignore this email.<br/>
                This email was sent by <span style="color:#6366f1;">SkillSphere</span> — AI-Powered Hiring Intelligence.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

/* ══════════════════════════════════════════════════
   sendOtp
══════════════════════════════════════════════════ */
const sendOtp = async (email, purpose) => {
  const code      = generateCode();
  const codeHash  = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

  await OtpRecord.findOneAndUpdate(
    { email: email.toLowerCase(), purpose },
    { codeHash, expiresAt },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const subject = purpose === 'signup'
    ? 'Your SkillSphere verification code'
    : 'Reset your SkillSphere password';

  try {
    const { error } = await getResend().emails.send({
      from:    process.env.EMAIL_FROM,
      to:      email,
      subject,
      html:    buildEmailHtml(code, purpose, OTP_EXPIRES_MIN),
    });
    if (error) throw error;
  } catch (err) {
    console.error('[Resend] sendOtp error:', err.message || err);
    throw new AppError('Failed to send OTP email. Please try again.', 500);
  }
};

/* ══════════════════════════════════════════════════
   verifyOtp
══════════════════════════════════════════════════ */
const verifyOtp = async (email, purpose, code) => {
  const record = await OtpRecord.findOne({
    email:     email.toLowerCase(),
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (!record)
    throw new AppError('OTP has expired or was not found. Please request a new one.', 400);

  const isMatch = await bcrypt.compare(String(code), record.codeHash);
  if (!isMatch)
    throw new AppError('Incorrect OTP code. Please try again.', 400);

  await OtpRecord.deleteOne({ _id: record._id });
};

module.exports = { sendOtp, verifyOtp };