import { Router } from 'express';
import { z } from 'zod';
import { appendToSheet } from '../services/sheets';
import { sendMail } from '../services/mail';

const router = Router();

// ── Schemas ────────────────────────────────────────────────────────────────────

const FormadoresSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  telefone: z.string().min(1),
  dataNascimento: z.string().optional().default(''),
  nif: z.string().optional().default(''),
  areas: z.array(z.string()).min(1),
  habilitacoes: z.string().min(1),
  capCcp: z.string().min(1),
  experiencia: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  dias: z.array(z.string()).min(1),
  periodos: z.array(z.string()).min(1),
  modalidade: z.string().min(1),
  motivacao: z.string().min(1),
});

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  message: z.string().min(1),
});

const StudentSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  program: z.string().min(1),
  startDate: z.string().min(1),
  contactPreference: z.string().min(1),
  notes: z.string().optional().default(''),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/inscricao-formadores', async (req, res) => {
  const parsed = FormadoresSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  const timestamp = new Date().toISOString();

  try {
    await appendToSheet('Formadores', [
      timestamp,
      d.nome,
      d.email,
      d.telefone,
      d.dataNascimento,
      d.nif,
      d.areas.join(', '),
      d.habilitacoes,
      d.capCcp,
      d.experiencia,
      d.linkedin,
      d.dias.join(', '),
      d.periodos.join(', '),
      d.modalidade,
      d.motivacao,
    ]);
  } catch (err) {
    console.error('[Sheets] inscricao-formadores failed:', err);
    res.status(503).json({ error: 'Erro ao guardar dados. Tente novamente.' });
    return;
  }

  // Non-blocking: email failure doesn't affect response
  sendMail({
    to: d.email,
    subject: 'FaroForma — Candidatura recebida',
    html: `
      <p>Olá <strong>${d.nome}</strong>,</p>
      <p>Recebemos a sua candidatura para formador na FaroForma. Entraremos em contacto brevemente.</p>
      <p>Obrigado pelo interesse!</p>
      <p>— Equipa FaroForma</p>
    `,
  }).catch(err => console.error('[Mail] inscricao-formadores confirmation failed:', err));

  res.status(201).json({ message: 'Candidatura recebida com sucesso.' });
});

router.post('/contact', async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  const timestamp = new Date().toISOString();

  try {
    await appendToSheet('Contactos', [
      timestamp,
      d.name,
      d.email,
      d.phone,
      d.subject,
      d.message,
    ]);
  } catch (err) {
    console.error('[Sheets] contact failed:', err);
    res.status(503).json({ error: 'Erro ao guardar dados. Tente novamente.' });
    return;
  }

  const adminEmail = process.env.GMAIL_USER;
  if (adminEmail) {
    sendMail({
      to: adminEmail,
      subject: `FaroForma — Nova mensagem de ${d.name}`,
      html: `
        <p><strong>De:</strong> ${d.name} (${d.email})</p>
        <p><strong>Telefone:</strong> ${d.phone || 'N/A'}</p>
        <p><strong>Assunto:</strong> ${d.subject || 'N/A'}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${d.message.replace(/\n/g, '<br>')}</p>
      `,
    }).catch(err => console.error('[Mail] contact notification failed:', err));
  }

  res.status(201).json({ message: 'Mensagem recebida com sucesso.' });
});

router.post('/student', async (req, res) => {
  const parsed = StudentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const d = parsed.data;
  const timestamp = new Date().toISOString();

  try {
    await appendToSheet('Alunos', [
      timestamp,
      d.fullName,
      d.email,
      d.phone,
      d.program,
      d.startDate,
      d.contactPreference,
      d.notes,
    ]);
  } catch (err) {
    console.error('[Sheets] student failed:', err);
    res.status(503).json({ error: 'Erro ao guardar dados. Tente novamente.' });
    return;
  }

  sendMail({
    to: d.email,
    subject: 'FaroForma — Inscrição recebida',
    html: `
      <p>Olá <strong>${d.fullName}</strong>,</p>
      <p>Recebemos a sua inscrição para <strong>${d.program}</strong>. Entraremos em contacto em até 24h úteis.</p>
      <p>Obrigado!</p>
      <p>— Equipa FaroForma</p>
    `,
  }).catch(err => console.error('[Mail] student confirmation failed:', err));

  res.status(201).json({ message: 'Inscrição recebida com sucesso.' });
});

export default router;
