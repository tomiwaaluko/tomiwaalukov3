import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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
              <span style="color:${bodyGray};">If you have any questions in the meantime, reply directly to this email.</span>
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

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
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

app.use(cors());
app.use(express.json());

// Swagger Documentation
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
console.log('Loading Swagger YAML...');
const swaggerDocument = YAML.load('./swagger.yaml');
console.log('Swagger Document Loaded:', swaggerDocument ? 'Yes' : 'No');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
console.log('Swagger Route Registered at /api/docs');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test endpoint
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express + TypeScript backend (Neon DB)!' });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Contact form → Resend (portfolio site)
app.post('/api/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('subject').optional().trim(),
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
app.post('/api/collaborate',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
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

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: email,
        subject,
        text: `You have received a new ${source === 'services' ? 'service' : 'collaboration'} request:\n\n${lines.join('\n')}`,
        ...(html ? { html } : {}),
      };
      await transporter.sendMail(mailOptions);

      // Send confirmation email to the client
      if (source === 'services') {
        const confirmationFields = {
          name, email, phone, company, website,
          projectType, mainGoal, targetAudience, domainName,
          pagesNeeded: Array.isArray(pagesNeeded) ? pagesNeeded : (pagesNeeded ? [pagesNeeded] : undefined),
          features: Array.isArray(features) ? features : (features ? [features] : undefined),
          cmsNeeded, mobileFriendly, colorPreferences, designStyle, websitesYouLike,
          hasLogo, brandFonts, contentProvider, imageProvider, existingContent,
          budget, launchDate, maintenance, additionalNotes,
        };
        const confirmationMail = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your project request has been received — Tomiwa Aluko',
          text: `Hi ${name},\n\nThanks for submitting your project request! I've received your details and will get back to you within 24-48 hours.\n\nHere's a summary of what you submitted:\n\n${lines.join('\n')}\n\nIf you have any questions, just reply to this email.\n\n— Tomiwa Aluko`,
          html: clientConfirmationHtml(confirmationFields),
        };
        // Fire-and-forget so client confirmation doesn't block the response
        transporter.sendMail(confirmationMail).catch((err: unknown) => {
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

// Guestbook endpoint
app.post('/api/guestbook',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('message').notEmpty().withMessage('Message is required'),
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

app.get('/api/guestbook', async (req: Request, res: Response) => {
  console.log('GET /api/guestbook called');
  try {
    const result = await pool.query('SELECT * FROM guestbook ORDER BY created_at DESC');
    console.log('Query success, rows:', result.rowCount);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching guestbook:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch guestbook entries.' });
  }
});

app.delete('/api/guestbook/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM guestbook WHERE id = $1', [id]);
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    console.error('Error deleting guestbook entry:', err);
    res.status(500).json({ success: false, error: 'Failed to delete entry.' });
  }
});

app.get('/api/profile-views', async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://komarev.com/ghpvc/?username=tomiwaaluko&label=PROFILE+VIEWS&style=flat', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Komarev: ${response.statusText}`);
    }

    const svgText = await response.text();
    // Simple regex to find the number in the SVG
    // Looking for the last occurrence of a number in text tags usually
    // The SVG structure roughly has: <text ...>3,523</text>
    // We can strip commas and look for digits

    // Logic from frontend was: last text node.
    // Regex strategy:
    const matches = svgText.match(/>\s*([\d,]+)\s*<\/text>/g);
    let views = 0;
    if (matches && matches.length > 0) {
      // Get the last match
      const lastMatch = matches[matches.length - 1];
      // Extract number string
      const numberStr = lastMatch.replace(/<\/?text>|>|\s|,/g, '');
      const parsed = parseInt(numberStr, 10);
      if (!isNaN(parsed)) {
        views = parsed;
      }
    }

    res.json({ views });

  } catch (error) {
    console.error('Error fetching profile views:', error);
    res.status(500).json({ error: 'Failed to fetch profile views' });
  }
});

app.get('/api/commit-stats', async (req: Request, res: Response) => {
  try {
    // Same GitHub username as DevActivity / frontend
    const response = await fetch(`https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=tomiwaaluko&t=${new Date().getTime()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch commit stats: ${response.statusText}`);
    }

    const svgText = await response.text();
    // Return the SVG text in a JSON object so the frontend can parse it
    res.json({ svg: svgText });

  } catch (error) {
    console.error('Error fetching commit stats:', error);
    res.status(500).json({ error: 'Failed to fetch commit stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});