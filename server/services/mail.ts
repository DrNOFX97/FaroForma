import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD env vars are required');

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const mailer = getTransporter();
  const from = process.env.GMAIL_USER;
  await mailer.sendMail({ from, ...opts });
}
