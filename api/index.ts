import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { body, param, query, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { Resend } from 'resend';
import { timingSafeEqual } from 'crypto';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/** Escape user-controlled strings for HTML email bodies */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Contact notification HTML — aligned with site theme (black / cream-400 / white borders)
 * and design-taste constraints: single accent, no emoji, neutral sophistication.
 */
function contactNotificationHtml(params: {
  name: string;
  email: string;
  subjectLine: string;
  message: string;
}): string {
  const nameSafe = escapeHtml(params.name);
  const emailDisplay = escapeHtml(params.email);
  const subjectLine = escapeHtml(params.subjectLine);
  const messageSafe = escapeHtml(params.message);
  const mailtoHref = `mailto:${encodeURIComponent(params.email)}`;
  // Tailwind theme: cream-400 #D4B896, black surfaces, border-white/10 ~ #262626
  const cream = '#D4B896';
  const creamSoft = '#E3D4C0';
  const black = '#000000';
  const surface = '#050505';
  const hairline = '#262626';
  const labelGray = '#737373';
  const bodyGray = '#a3a3a3';
  const textMain = '#fafafa';
  const sans =
    "'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<title>Portfolio contact</title>
</head>
<body style="margin:0;padding:0;background-color:${black};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${black};padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:${surface};border:1px solid ${hairline};border-radius:2px;">
        <tr>
          <td style="height:1px;background-color:${cream};line-height:1px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px 28px;">
            <p style="margin:0 0 12px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${cream};">
              Portfolio · Contact
            </p>
            <p style="margin:0 0 10px;font-family:${sans};font-size:24px;font-weight:600;letter-spacing:-0.03em;line-height:1.15;color:${textMain};">
              Inbound message
            </p>
            <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.55;color:${bodyGray};max-width:42em;">
              Someone used the contact form on your site. Reply to this email to respond directly.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="height:1px;background-color:${hairline};line-height:1px;font-size:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 18px 28px;">
            <p style="margin:0 0 6px;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${labelGray};">
              Name
            </p>
            <p style="margin:0 0 18px;font-family:${sans};font-size:17px;font-weight:500;line-height:1.4;color:${textMain};">
              ${nameSafe}
            </p>
            <p style="margin:0 0 6px;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${labelGray};">
              Email
            </p>
            <p style="margin:0 0 18px;font-family:${sans};font-size:15px;line-height:1.4;">
              <a href="${mailtoHref}" style="color:${cream};text-decoration:none;border-bottom:1px solid rgba(212,184,150,0.45);">${emailDisplay}</a>
            </p>
            <p style="margin:0 0 6px;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${labelGray};">
              Subject
            </p>
            <p style="margin:0;font-family:${sans};font-size:15px;line-height:1.5;color:${textMain};">
              ${subjectLine}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 28px 28px;">
            <p style="margin:0 0 10px;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${labelGray};">
              Message
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding:20px 18px;background-color:${black};border:1px solid ${hairline};border-radius:2px;">
                  <div style="margin:0;font-family:${sans};font-size:15px;line-height:1.65;color:${creamSoft};white-space:pre-wrap;word-break:break-word;">
                    ${messageSafe}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 26px 28px;text-align:center;border-top:1px solid ${hairline};">
            <p style="margin:18px 0 0;font-family:${sans};font-size:11px;line-height:1.55;color:${labelGray};letter-spacing:0.02em;">
              <span style="color:${bodyGray};">Sent from your portfolio contact form. Use </span><strong style="color:${textMain};font-weight:600;">Reply</strong><span style="color:${bodyGray};"> to reach the sender.</span>
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-family:${sans};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#525252;text-align:center;">
        Automated notification
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Service request notification HTML — same design system as contactNotificationHtml.
 * Sections mirror the 7-step ClientRequestForm wizard.
 */
function serviceRequestHtml(fields: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  projectType?: string;
  mainGoal?: string;
  targetAudience?: string;
  domainName?: string;
  pagesNeeded?: string[];
  features?: string[];
  cmsNeeded?: string;
  mobileFriendly?: string;
  colorPreferences?: string;
  designStyle?: string;
  websitesYouLike?: string;
  hasLogo?: string;
  brandFonts?: string;
  contentProvider?: string;
  imageProvider?: string;
  existingContent?: string;
  budget?: string;
  launchDate?: string;
  maintenance?: string;
  additionalNotes?: string;
}): string {
  const e = escapeHtml;
  const cream = '#C49A3C';
  const creamSoft = '#D4B896';
  const black = '#000000';
  const surface = '#050505';
  const hairline = '#262626';
  const sectionBg = '#0a0a0a';
  const labelGray = '#737373';
  const bodyGray = '#a3a3a3';
  const textMain = '#fafafa';
  const sans = "'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif";

  const field = (label: string, value?: string | string[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '';
    const display = Array.isArray(value) ? value.join(', ') : value;
    return `
      <tr>
        <td style="padding:0 0 16px 0;">
          <p style="margin:0 0 4px;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${labelGray};">${label}</p>
          <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.5;color:${textMain};">${e(display)}</p>
        </td>
      </tr>`;
  };

  const section = (title: string, rows: string) => {
    if (!rows.trim()) return '';
    return `
      <tr>
        <td style="padding:0 28px 4px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding:16px 0 12px 0;border-top:1px solid ${hairline};">
                <p style="margin:0;font-family:${sans};font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${cream};">${title}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 8px 0;background-color:${sectionBg};border-radius:2px;padding:14px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${rows}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  };

  const contactRows = [
    field('Name', fields.name),
    field('Email', fields.email),
    field('Phone', fields.phone),
    field('Company', fields.company),
    field('Existing Website', fields.website),
  ].join('');

  const projectRows = [
    field('Website Type', fields.projectType),
    field('Main Goal', fields.mainGoal),
    field('Target Audience', fields.targetAudience),
    field('Domain Name', fields.domainName),
  ].join('');

  const scopeRows = [
    field('Pages Needed', fields.pagesNeeded),
    field('Features', fields.features),
    field('CMS Needed', fields.cmsNeeded),
    field('Mobile-Friendly', fields.mobileFriendly),
  ].join('');

  const designRows = [
    field('Color Preferences', fields.colorPreferences),
    field('Design Style', fields.designStyle),
    field('Reference Websites', fields.websitesYouLike),
    field('Has Logo', fields.hasLogo),
    field('Brand Fonts', fields.brandFonts),
  ].join('');

  const contentRows = [
    field('Content Provider', fields.contentProvider),
    field('Image Provider', fields.imageProvider),
    field('Existing Content', fields.existingContent),
  ].join('');

  const timelineRows = [
    field('Budget Range', fields.budget),
    field('Launch Date', fields.launchDate),
    field('Ongoing Maintenance', fields.maintenance),
  ].join('');

  const notesRows = field('Additional Notes', fields.additionalNotes);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Service Request</title>
</head>
<body style="margin:0;padding:0;background-color:${black};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${black};padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:${surface};border:1px solid ${hairline};border-radius:2px;">
        <tr>
          <td style="height:2px;background-color:${cream};line-height:2px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 28px 20px 28px;">
            <p style="margin:0 0 10px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${cream};">
              Services · New Request
            </p>
            <p style="margin:0 0 8px;font-family:${sans};font-size:24px;font-weight:600;letter-spacing:-0.03em;line-height:1.15;color:${textMain};">
              ${e(fields.name)} wants to build something.
            </p>
            <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.55;color:${bodyGray};">
              A new project request came through your services page. All details are below.
            </p>
          </td>
        </tr>
        ${section('01 · Contact', contactRows)}
        ${section('02 · Project Overview', projectRows)}
        ${section('03 · Scope', scopeRows)}
        ${section('04 · Design', designRows)}
        ${section('05 · Content', contentRows)}
        ${section('06 · Timeline &amp; Budget', timelineRows)}
        ${section('07 · Notes', notesRows)}
        <tr>
          <td style="padding:20px 28px 26px 28px;border-top:1px solid ${hairline};">
            <p style="margin:0;font-family:${sans};font-size:11px;line-height:1.55;color:${labelGray};letter-spacing:0.02em;">
              <span style="color:${bodyGray};">Reply to </span><a href="mailto:${encodeURIComponent(fields.email)}" style="color:${creamSoft};text-decoration:none;border-bottom:1px solid rgba(212,184,150,0.4);">${e(fields.email)}</a><span style="color:${bodyGray};"> to respond directly.</span>
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-family:${sans};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#525252;text-align:center;">
        Automated notification · tomiwaaluko.com
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Client confirmation email — sent to the person who submitted the service request */
function clientConfirmationHtml(fields: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  projectType?: string;
  mainGoal?: string;
  targetAudience?: string;
  domainName?: string;
  pagesNeeded?: string[];
  features?: string[];
  cmsNeeded?: string;
  mobileFriendly?: string;
  colorPreferences?: string;
  designStyle?: string;
  websitesYouLike?: string;
  hasLogo?: string;
  brandFonts?: string;
  contentProvider?: string;
  imageProvider?: string;
  existingContent?: string;
  budget?: string;
  launchDate?: string;
  maintenance?: string;
  additionalNotes?: string;
}): string {
  const e = escapeHtml;
  const cream = '#C49A3C';
  const creamSoft = '#D4B896';
  const black = '#000000';
  const surface = '#050505';
  const hairline = '#262626';
  const sectionBg = '#0a0a0a';
  const labelGray = '#737373';
  const bodyGray = '#a3a3a3';
  const textMain = '#fafafa';
  const sans = "'Segoe UI',Roboto,'Helvetica Neue',Helvetica,Arial,sans-serif";

  const field = (label: string, value?: string | string[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '';
    const display = Array.isArray(value) ? value.join(', ') : value;
    return `
      <tr>
        <td style="padding:0 0 16px 0;">
          <p style="margin:0 0 4px;font-family:${sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${labelGray};">${label}</p>
          <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.5;color:${textMain};">${e(display)}</p>
        </td>
      </tr>`;
  };

  const section = (title: string, rows: string) => {
    if (!rows.trim()) return '';
    return `
      <tr>
        <td style="padding:0 28px 4px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding:16px 0 12px 0;border-top:1px solid ${hairline};">
                <p style="margin:0;font-family:${sans};font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${cream};">${title}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 8px 0;background-color:${sectionBg};border-radius:2px;padding:14px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${rows}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  };

  const contactRows = [
    field('Name', fields.name),
    field('Email', fields.email),
    field('Phone', fields.phone),
    field('Company', fields.company),
    field('Existing Website', fields.website),
  ].join('');

  const projectRows = [
    field('Website Type', fields.projectType),
    field('Main Goal', fields.mainGoal),
    field('Target Audience', fields.targetAudience),
    field('Domain Name', fields.domainName),
  ].join('');

  const scopeRows = [
    field('Pages Needed', fields.pagesNeeded),
    field('Features', fields.features),
    field('CMS Needed', fields.cmsNeeded),
    field('Mobile-Friendly', fields.mobileFriendly),
  ].join('');

  const designRows = [
    field('Color Preferences', fields.colorPreferences),
    field('Design Style', fields.designStyle),
    field('Reference Websites', fields.websitesYouLike),
    field('Has Logo', fields.hasLogo),
    field('Brand Fonts', fields.brandFonts),
  ].join('');

  const contentRows = [
    field('Content Provider', fields.contentProvider),
    field('Image Provider', fields.imageProvider),
    field('Existing Content', fields.existingContent),
  ].join('');

  const timelineRows = [
    field('Budget Range', fields.budget),
    field('Launch Date', fields.launchDate),
    field('Ongoing Maintenance', fields.maintenance),
  ].join('');

  const notesRows = field('Additional Notes', fields.additionalNotes);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Request Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:${black};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${black};padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:${surface};border:1px solid ${hairline};border-radius:2px;">
        <tr>
          <td style="height:2px;background-color:${cream};line-height:2px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 28px 20px 28px;">
            <p style="margin:0 0 10px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${cream};">
              Request Confirmed
            </p>
            <p style="margin:0 0 8px;font-family:${sans};font-size:24px;font-weight:600;letter-spacing:-0.03em;line-height:1.15;color:${textMain};">
              Thanks, ${e(fields.name)}.
            </p>
            <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.55;color:${bodyGray};">
              I've received your project request and will review it shortly. Expect a response within 24 &ndash; 48 hours. Below is a copy of what you submitted for your records.
            </p>
          </td>
        </tr>
        ${section('01 · Contact', contactRows)}
        ${section('02 · Project Overview', projectRows)}
        ${section('03 · Scope', scopeRows)}
        ${section('04 · Design', designRows)}
        ${section('05 · Content', contentRows)}
        ${section('06 · Timeline &amp; Budget', timelineRows)}
        ${section('07 · Notes', notesRows)}
        <tr>
          <td style="padding:20px 28px 26px 28px;border-top:1px solid ${hairline};">
            <p style="margin:0;font-family:${sans};font-size:11px;line-height:1.55;color:${labelGray};letter-spacing:0.02em;">
              <span style="color:${bodyGray};">If you have any questions in the meantime, email tomiwaaluko02@gmail.com with this form attached.</span>
            </p>
            <p style="margin:12px 0 0;font-family:${sans};font-size:13px;line-height:1.55;color:${textMain};">
              &mdash; Tomiwa Aluko
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-family:${sans};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#525252;text-align:center;">
        Automated confirmation · tomiwaaluko.com
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const app = express();
const PORT = process.env.PORT || 5000;

// Deliberately NOT using `app.set('trust proxy', n)` - see rateLimitKey below
// for why a hop count cannot be chosen correctly for this deployment.


// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SECURITY: this was `rejectUnauthorized: false`, which disables certificate
  // verification entirely - the client would accept any certificate, so anyone
  // able to intercept the connection could read and modify traffic to the
  // database. Neon presents a certificate signed by a public CA, so normal
  // verification works; the flag was never actually required.
  ssl: { rejectUnauthorized: true },
});

pool.connect()
  .then((client) => {
    console.log('Connected to Neon PostgreSQL');
    client.release();
  })
  .catch((err) => console.error('PostgreSQL connection error:', err));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Initialize Tables
const initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS guestbook (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log('Guestbook table ensured.');
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
};
initDB();

// Baseline security headers. The API served none.
app.use(helmet());

/**
 * CORS allowlist.
 *
 * SECURITY: this was a bare `cors()`, which reflects `Access-Control-Allow-Origin: *`
 * and lets any site on the internet call these endpoints from a visitor's
 * browser. Origins come from ALLOWED_ORIGINS (comma-separated).
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const DEFAULT_ORIGINS = [
  'https://tomiwaaluko.com',
  'https://www.tomiwaaluko.com',
];

const allowedOrigins =
  ALLOWED_ORIGINS.length > 0
    ? ALLOWED_ORIGINS
    : process.env.NODE_ENV === 'production'
      ? DEFAULT_ORIGINS
      : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests with no Origin (curl, server-to-server, same-origin
      // navigations) are allowed through; the rate limits below are what
      // constrain non-browser callers.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }),
);

/**
 * Rate-limit key.
 *
 * Getting this wrong is worse than having no limiter, so it is worth spelling
 * out. In production the browser calls the RELATIVE path `/api/...`, which
 * `vercel.json` rewrites server-side to the Render host. The real chain is:
 *
 *     browser -> Vercel edge -> Render LB -> this process
 *
 * Render never talks to the visitor. So `req.ip` - with any `trust proxy` hop
 * count - resolves to Vercel's egress address, identical for every visitor on
 * earth. Every caller would share one bucket, and five requests would 429 the
 * contact and services forms for everyone, permanently, for free.
 *
 * The visitor's own address is the LEFTMOST X-Forwarded-For entry, appended by
 * Vercel's edge. That is what we key on.
 *
 * The trade-off, stated plainly: a caller who reaches the Render host directly
 * can set that header themselves and get a fresh bucket per request. That is
 * acceptable here because these limits are abuse heuristics, not an
 * authorization boundary - nothing behind them is protected by the limit alone
 * (the destructive route has its own token, and the mail routes send only fixed
 * templates). Sharing one global bucket, by contrast, is a guaranteed outage
 * triggered by any single actor. Given a choice between "bypassable by a
 * determined attacker" and "trivially DoS-able by anyone", take the former.
 *
 * If the API is ever served from its own origin rather than through the Vercel
 * rewrite, revisit this - `req.ip` with a correct hop count becomes right again.
 */
function rateLimitKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

const limiterDefaults = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  // We supply our own key, so the library's trust-proxy heuristics do not apply.
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { success: false, error: 'Too many requests. Please try again later.' },
};

/**
 * None of these endpoints had any throttle. Two send real email and one writes
 * to the database, all without authentication.
 *
 * Limits are per visitor and sized so a human filling in a form never sees a
 * 429 even after several corrections, while bulk submission is bounded.
 */
const emailLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

const writeLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

const readLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 1000,
  limit: 120,
});

/**
 * Backstop for the cheap always-on routes. Generous: /api/health is polled by
 * the client as a cold-start warm-up, and by the keep-alive workflow.
 */
const healthLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 1000,
  limit: 240,
});

// Throttle the body-carrying routes BEFORE the JSON parser runs.
//
// app-level middleware runs in registration order, so mounting the parser
// first would mean every request - including ones about to be 429'd - costs a
// full socket read and a JSON.parse. Cheap for the caller, not for a free-tier
// dyno.
//
// Scoped with app.post rather than app.use so guestbook READS are not caught by
// the write limiter. These are the only places these three limiters are
// applied: running the same limiter instance twice in one request would count
// the request twice and silently halve the limit.
app.post('/api/contact', emailLimiter);
app.post('/api/collaborate', emailLimiter);
app.post('/api/guestbook', writeLimiter);

// Explicit body size limit rather than relying on the default.
// 128kb comfortably exceeds the sum of the per-field validation caps below, so
// a payload can never be rejected by the parser when the validators would have
// accepted it (which would surface as a confusing 413).
app.use(express.json({ limit: '128kb' }));

/**
 * Kill switch for the client confirmation email.
 *
 * That email is the only one this API sends to a caller-supplied address, so
 * it is the only outbound path that can be aimed at a third party. Defaults on,
 * but can be turned off from the environment without a deploy if it is ever
 * abused.
 */
const CONFIRMATION_EMAILS_ENABLED =
  process.env.DISABLE_CONFIRMATION_EMAILS !== 'true';

/**
 * Reduce a submitted name to something safe to place in an email addressed to
 * a third party.
 *
 * Length-capping `name` was not enough. It is the ONLY caller-supplied value
 * that still reaches the confirmation recipient, and `.trim()` strips only
 * leading and trailing whitespace - internal newlines survive, and the
 * text/plain part is not HTML-escaped. So ~100 characters of attacker-authored
 * text, complete with line breaks and a URL that every mail client
 * auto-linkifies, could be delivered to any address from a domain with aligned
 * SPF/DKIM/DMARC:
 *
 *     name = "there,\n\nYour invoice is overdue. Pay: https://x.example/p\n\nBilling"
 *     -> "Hi there,\n\nYour invoice is overdue. Pay: https://x.example/p\n\nBilling,"
 *
 * Restricting to letters, marks, spaces, apostrophes, hyphens and periods
 * removes the newlines, the colon, and the slashes a URL needs. Anything that
 * does not look like a name falls back to a neutral greeting rather than being
 * partially rendered.
 */
function safeGreetingName(value: unknown): string {
  const raw = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || raw.length > 60) {
    return 'there';
  }
  return /^[\p{L}\p{M}'\-. ]+$/u.test(raw) ? raw : 'there';
}

/**
 * Admin gate for destructive routes.
 *
 * Compared in constant time: `===` short-circuits on the first differing byte,
 * so response timing would leak how much of the token an attacker has guessed.
 */
function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    console.error('ADMIN_TOKEN is not configured; refusing admin request.');
    res.status(503).json({ success: false, error: 'Not available.' });
    return;
  }

  const header = req.headers['authorization'];
  const provided =
    typeof header === 'string' && header.toLowerCase().startsWith('bearer ')
      ? header.slice(7).trim()
      : '';

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
}

// Swagger Documentation
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
// Swagger is opt-in via ENABLE_API_DOCS, NOT gated on NODE_ENV.
//
// Deliberate: a deployment that forgets to set NODE_ENV=production would, under
// a `NODE_ENV !== 'production'` check, silently publish the full API surface -
// every endpoint and its expected payload - to anonymous callers. Failing
// closed on a missing variable is the safer default.
if (process.env.ENABLE_API_DOCS === 'true') {
  try {
    const swaggerDocument = YAML.load('./swagger.yaml');
    app.use(
      '/api/docs',
      // helmet's default CSP is script-src 'self', which blocks the inline
      // bootstrap script Swagger UI ships with, leaving a blank page. Relax it
      // for this route only.
      helmet({ contentSecurityPolicy: false }),
      readLimiter,
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument),
    );
    console.log('Swagger UI registered at /api/docs');
  } catch (err) {
    console.error('Failed to load swagger.yaml; /api/docs not registered:', err);
  }
}

// Nodemailer / Gmail SMTP was removed: Render's free tier blocks outbound
// SMTP (ETIMEDOUT on CONN), so /api/collaborate now sends through Resend's
// HTTPS API, same as /api/contact. The `resend` client is initialized near
// the top of this file from RESEND_API_KEY.

// Test endpoint
app.get('/api/hello', healthLimiter, (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express + TypeScript backend (Neon DB)!' });
});

// Health check endpoint
app.get('/api/health', healthLimiter, (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Contact form → Resend (portfolio site)
app.post('/api/contact',
  [

    body('name').trim().notEmpty().isLength({ max: 100 })
      .withMessage('Name is required (max 100 characters)'),
    body('email').trim().isEmail().isLength({ max: 254 })
      .withMessage('Valid email is required'),
    body('message').trim().notEmpty().isLength({ max: 5000 })
      .withMessage('Message is required (max 5000 characters)'),
    // Capped and CRLF-stripped: this value goes into a mail Subject header,
    // where an embedded newline would let a submitter append their own headers.
    body('subject').optional().trim().isLength({ max: 200 })
      .customSanitizer((value: string) => String(value).replace(/[\r\n]+/g, ' ')),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    if (!resend) {
      res.status(503).json({ success: false, error: 'Email service is not configured.' });
      return;
    }
    const to = process.env.EMAIL_TO || process.env.RESEND_TO;
    if (!to) {
      res.status(503).json({ success: false, error: 'Recipient address not configured.' });
      return;
    }
    const { name, email, subject, message } = req.body as {
      name: string;
      email: string;
      subject?: string;
      message: string;
    };
    const from =
      process.env.RESEND_FROM?.trim() || 'Portfolio <onboarding@resend.dev>';
    const subjectLabel = subject?.length ? subject : '(No subject)';
    const html = contactNotificationHtml({
      name,
      email,
      subjectLine: subjectLabel,
      message,
    });
    const textBody = [
      'PORTFOLIO · CONTACT',
      'Inbound message',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subjectLabel}`,
      '',
      'Message:',
      message,
      '',
      '—',
      'Sent from your portfolio contact form. Reply to respond.',
    ].join('\n');
    try {
      const result = await resend.emails.send({
        from,
        to: [to],
        replyTo: email,
        subject: subject?.length
          ? `Portfolio · ${subject}`
          : 'Portfolio · New contact',
        text: textBody,
        html,
      });
      if (result.error) {
        console.error('Resend error:', result.error);
        res.status(500).json({ success: false, error: 'Failed to send message.' });
        return;
      }
      res.status(201).json({ success: true, message: 'Message sent.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  }
);

// Collaboration endpoint (Email only for now, DB optional or future)
/**
 * Free-text fields on the service-request form. Every one of these is
 * interpolated into an outbound email, so each needs a length cap - previously
 * only `name` and `email` were validated at all and the rest were unbounded.
 */
const COLLABORATE_TEXT_FIELDS = [
  'company', 'phone', 'projectType', 'budget', 'timeline', 'description',
  'requirements', 'website', 'mainGoal', 'targetAudience', 'domainName',
  'cmsNeeded', 'mobileFriendly', 'colorPreferences', 'designStyle',
  'websitesYouLike', 'hasLogo', 'brandFonts', 'contentProvider',
  'imageProvider', 'existingContent', 'launchDate', 'maintenance',
  'additionalNotes',
] as const;

app.post('/api/collaborate',
  [

    // CRLF stripped for the same reason /api/contact strips it from its
    // subject: `name` is interpolated into the admin notification's Subject
    // header below, and an embedded newline is the header-injection primitive.
    body('name').trim().notEmpty().isLength({ max: 100 })
      .customSanitizer((value: string) => String(value).replace(/[\r\n]+/g, ' '))
      .withMessage('Name is required (max 100 characters)'),
    body('email').trim().isEmail().isLength({ max: 254 }).withMessage('Valid email is required'),
    body('source').optional().isIn(['services', 'collaborate']).withMessage('Invalid source'),
    ...COLLABORATE_TEXT_FIELDS.map((field) =>
      body(field).optional().isString().trim().isLength({ max: 2000 })
        .withMessage(`${field} must be 2000 characters or fewer`),
    ),
    body('pagesNeeded').optional().isArray({ max: 50 }),
    body('pagesNeeded.*').isString().trim().isLength({ max: 200 }),
    body('features').optional().isArray({ max: 50 }),
    body('features.*').isString().trim().isLength({ max: 200 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const {
      name, email, company, phone, projectType, budget, timeline, description, requirements,
      // New service request fields (all optional)
      website, mainGoal, targetAudience, domainName, pagesNeeded, features,
      cmsNeeded, mobileFriendly, colorPreferences, designStyle, websitesYouLike,
      hasLogo, brandFonts, contentProvider, imageProvider, existingContent,
      launchDate, maintenance, additionalNotes, source,
    } = req.body;

    try {
      // Build email body — include new fields when present
      const lines = [
        `Name: ${name}`,
        `Email: ${email}`,
      ];
      if (company) lines.push(`Company: ${company}`);
      if (phone) lines.push(`Phone: ${phone}`);
      if (website) lines.push(`Existing Website: ${website}`);
      if (projectType) lines.push(`Project Type: ${projectType}`);
      if (mainGoal) lines.push(`Main Goal: ${mainGoal}`);
      if (targetAudience) lines.push(`Target Audience: ${targetAudience}`);
      if (domainName) lines.push(`Domain Name: ${domainName}`);
      if (pagesNeeded?.length) lines.push(`Pages Needed: ${Array.isArray(pagesNeeded) ? pagesNeeded.join(', ') : pagesNeeded}`);
      if (features?.length) lines.push(`Features: ${Array.isArray(features) ? features.join(', ') : features}`);
      if (cmsNeeded) lines.push(`CMS Needed: ${cmsNeeded}`);
      if (mobileFriendly) lines.push(`Mobile-Friendly: ${mobileFriendly}`);
      if (colorPreferences) lines.push(`Color Preferences: ${colorPreferences}`);
      if (designStyle) lines.push(`Design Style: ${designStyle}`);
      if (websitesYouLike) lines.push(`Reference Websites: ${websitesYouLike}`);
      if (hasLogo) lines.push(`Has Logo: ${hasLogo}`);
      if (brandFonts) lines.push(`Brand Fonts: ${brandFonts}`);
      if (contentProvider) lines.push(`Content Provider: ${contentProvider}`);
      if (imageProvider) lines.push(`Image Provider: ${imageProvider}`);
      if (existingContent) lines.push(`Existing Content: ${existingContent}`);
      if (budget) lines.push(`Budget: ${budget}`);
      if (timeline) lines.push(`Timeline: ${timeline}`);
      if (launchDate) lines.push(`Launch Date: ${launchDate}`);
      if (maintenance) lines.push(`Maintenance: ${maintenance}`);
      if (description) lines.push(`Description: ${description}`);
      if (requirements) lines.push(`Requirements: ${requirements}`);
      if (additionalNotes) lines.push(`Additional Notes: ${additionalNotes}`);

      const subject = source === 'services'
        ? `New Service Request from ${name}`
        : 'New Collaboration Request';

      const html = source === 'services' ? serviceRequestHtml({
        name, email, phone, company, website,
        projectType, mainGoal, targetAudience, domainName,
        pagesNeeded: Array.isArray(pagesNeeded) ? pagesNeeded : (pagesNeeded ? [pagesNeeded] : undefined),
        features: Array.isArray(features) ? features : (features ? [features] : undefined),
        cmsNeeded, mobileFriendly, colorPreferences, designStyle, websitesYouLike,
        hasLogo, brandFonts, contentProvider, imageProvider, existingContent,
        budget, launchDate, maintenance, additionalNotes,
      }) : undefined;

      // Send via Resend (HTTPS API) instead of Nodemailer/Gmail SMTP.
      // Render's free tier blocks outbound SMTP (ETIMEDOUT on CONN), so the
      // old Gmail/Nodemailer path could never succeed in production. Resend
      // uses an HTTPS request and works fine from Render free.
      if (!resend) {
        res.status(503).json({ success: false, error: 'Email service is not configured.' });
        return;
      }
      const adminTo = process.env.EMAIL_TO || process.env.RESEND_TO;
      if (!adminTo) {
        res.status(503).json({ success: false, error: 'Recipient address not configured.' });
        return;
      }
      const fromAddress =
        process.env.RESEND_FROM?.trim() || 'Portfolio <onboarding@resend.dev>';
      const adminText = `You have received a new ${source === 'services' ? 'service' : 'collaboration'} request:\n\n${lines.join('\n')}`;

      const adminResult = await resend.emails.send({
        from: fromAddress,
        to: [adminTo],
        replyTo: email,
        subject,
        text: adminText,
        ...(html ? { html } : {}),
      });
      if (adminResult.error) {
        console.error('Resend admin notification error:', adminResult.error);
        res.status(500).json({ success: false, error: 'Failed to submit collaboration request.' });
        return;
      }

      // Send confirmation email to the client (services flow only).
      //
      // SECURITY: this is the one place the API sends mail to a CALLER-SUPPLIED
      // address, with caller-supplied content echoed back into the body. That
      // made it an open relay: anyone could POST {source:'services', email:
      // <victim>, name: '<phishing copy>'} and have this server deliver
      // attacker-authored mail to arbitrary recipients from a verified sending
      // domain - burning the domain's reputation and the Resend quota, and
      // lending the sender's credibility to the content.
      //
      // Two controls now apply. The route is rate limited (emailLimiter above),
      // and the confirmation body is a fixed template: it no longer reflects
      // the submitted field values back to the recipient, so an attacker cannot
      // use it to deliver chosen content. The name is included because it is
      // length-capped and escaped, and a confirmation without it reads oddly.
      if (source === 'services' && CONFIRMATION_EMAILS_ENABLED) {
        // The only caller-supplied value in this email, and it goes to an
        // address the caller chose. See safeGreetingName.
        const greeting = safeGreetingName(name);
        const confirmationText = [
          `Hi ${greeting},`,
          '',
          "Thanks for submitting your project request. I've received your details",
          'and will get back to you within 24-48 hours.',
          '',
          'For your records, a copy of the details you submitted was delivered',
          'with your request. If you did not submit this form, you can ignore',
          'this message.',
          '',
          '— Tomiwa Aluko',
        ].join('\n');

        // Fire-and-forget so the client confirmation doesn't block our 201.
        // If the confirmation fails we still consider the submission a success
        // because the admin notification already landed.
        resend.emails.send({
          from: fromAddress,
          to: [email],
          replyTo: adminTo,
          subject: 'Your project request has been received — Tomiwa Aluko',
          text: confirmationText,
          html: clientConfirmationHtml({ name: greeting, email }),
        }).then((r) => {
          if (r.error) console.error('Resend client confirmation error:', r.error);
        }).catch((err: unknown) => {
          console.error('Failed to send client confirmation email:', err);
        });
      }

      res.status(201).json({ success: true, message: 'Collaboration request submitted!' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to submit collaboration request.' });
    }
  }
);

// Guestbook endpoint. Unauthenticated by design, so it is rate limited and
// every field is length-capped - previously both were unbounded, so a script
// could fill the table with arbitrarily large rows.
app.post('/api/guestbook',
  [

    body('name').trim().notEmpty().isLength({ max: 80 })
      .withMessage('Name is required (max 80 characters)'),
    body('message').trim().notEmpty().isLength({ max: 1000 })
      .withMessage('Message is required (max 1000 characters)'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { name, message } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO guestbook (name, message) VALUES ($1, $2) RETURNING id',
        [name, message]
      );
      res.status(201).json({ success: true, message: 'Guestbook entry added!', id: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Failed to add guestbook entry.' });
    }
  }
);

app.get('/api/guestbook',
  readLimiter,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      // Explicit columns and a bounded page. `SELECT *` with no limit returned
      // the entire table on every call, which grows without bound and would
      // expose any column added to this table later.
      // Coerce explicitly. In Express 5 `req.query` is a recomputed getter, so
      // express-validator's .toInt() writes into a throwaway object and the
      // values arrive here as strings - the validators still run correctly on
      // the read, but the conversion is lost. Range is already enforced above.
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const result = await pool.query(
        'SELECT id, name, message, created_at FROM guestbook ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching guestbook:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch guestbook entries.' });
    }
  }
);

/**
 * SECURITY: admin only.
 *
 * This route was completely unauthenticated - anyone who knew the URL could
 * delete any guestbook entry, or walk the ids and empty the table.
 */
app.delete('/api/guestbook/:id',
  writeLimiter,
  requireAdminToken,
  [param('id').isInt({ min: 1 }).toInt()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM guestbook WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Entry not found.' });
        return;
      }
      res.json({ success: true, message: 'Entry deleted' });
    } catch (err) {
      console.error('Error deleting guestbook entry:', err);
      res.status(500).json({ success: false, error: 'Failed to delete entry.' });
    }
  }
);

/**
 * Proxy for the GitHub profile-view badge.
 *
 * SECURITY / availability: the success path previously computed `matches` and
 * `views` and then simply ended - it never called res.send/res.json. Every
 * successful request therefore hung until the client or proxy timed out,
 * holding a socket and an upstream connection open the whole time. A handful
 * of concurrent callers could exhaust the connection pool on Render's free
 * tier. The request timeout below also stops a slow upstream from pinning
 * resources indefinitely.
 */
app.get('/api/profile-views', readLimiter, async (_req: Request, res: Response) => {
  try {
    const response = await fetch(
      'https://komarev.com/ghpvc/?username=tomiwaaluko&label=PROFILE+VIEWS&style=flat',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from Komarev: ${response.statusText}`);
    }

    const svgText = await response.text();

    // The badge renders the count as the last <text> node, e.g. <text ...>3,523</text>.
    const matches = svgText.match(/>\s*([\d,]+)\s*<\/text>/g);
    let views = 0;

    if (matches && matches.length > 0) {
      const digits = matches[matches.length - 1].replace(/[^\d]/g, '');
      const parsed = Number.parseInt(digits, 10);
      if (Number.isFinite(parsed)) {
        views = parsed;
      }
    }

    res.json({ views });
  } catch (error) {
    console.error('Error fetching profile views:', error);
    res.status(502).json({ error: 'Failed to fetch profile views' });
  }
});

app.get('/api/commit-stats', readLimiter, async (_req: Request, res: Response) => {
  try {
    // Same GitHub username as DevActivity / frontend
    const response = await fetch(
      `https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=tomiwaaluko&t=${new Date().getTime()}`,
      { signal: AbortSignal.timeout(8000) },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch commit stats: ${response.statusText}`);
    }

    const svgText = await response.text();
    // Return the SVG text in a JSON object so the frontend can parse it
    res.json({ svg: svgText });

  } catch (error) {
    console.error('Error fetching commit stats:', error);
    res.status(502).json({ error: 'Failed to fetch commit stats' });
  }
});

/**
 * Catch-all error handler.
 *
 * Without one, Express's default handler responds with the error's stack trace
 * when NODE_ENV is not 'production' - and it also produces the wall-of-HTML
 * response for CORS rejections. Log the detail; return a generic body.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) {
    return;
  }

  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ success: false, error: 'Origin not allowed.' });
    return;
  }

  // Honour the error's own status for client errors. body-parser raises a 400
  // for malformed JSON and a 413 for an oversized body; reporting those as 500
  // blames the server for the caller's mistake, and the frontend branches on
  // `status >= 500` to decide whether to say "server error, try later".
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { statusCode?: number }).statusCode;

  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({
      success: false,
      error:
        status === 413
          ? 'Request body too large.'
          : 'Malformed request.',
    });
    return;
  }

  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});