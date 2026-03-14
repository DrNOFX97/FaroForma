import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import { z } from "zod";
import * as admin from "firebase-admin";

admin.initializeApp();

// Define secrets
const GOOGLE_SERVICE_ACCOUNT_JSON = defineSecret("GOOGLE_SERVICE_ACCOUNT_JSON");
const SPREADSHEET_ID = defineSecret("SPREADSHEET_ID");
const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");

const app = express();
app.set('trust proxy', 1); // Cloud Run sits behind Google's load balancer
app.use(cors({ origin: true }));
app.use(express.json());

const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos. Tente novamente mais tarde.' },
});

// ── Admin emails — Firestore config/admins ────────────────────────────────────

let adminEmailsCache: { emails: string[]; ts: number } | null = null;
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAdminEmails(): Promise<string[]> {
  if (adminEmailsCache && Date.now() - adminEmailsCache.ts < ADMIN_CACHE_TTL) {
    return adminEmailsCache.emails;
  }
  try {
    const doc = await admin.firestore().collection('config').doc('admins').get();
    const emails = (doc.exists ? (doc.data()?.emails as string[]) : null) ?? [];
    adminEmailsCache = { emails, ts: Date.now() };
    return emails;
  } catch {
    return adminEmailsCache?.emails ?? [];
  }
}

// ── Auth Middleware ──────────────────────────────────────────────────────────

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const adminEmails = await getAdminEmails();
    if (adminEmails.includes(decodedToken.email || '')) {
      (req as any).user = decodedToken;
      next();
    } else {
      res.status(403).json({ error: 'Proibido' });
    }
  } catch (error: any) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

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

// ── Google Sheets Helper ───────────────────────────────────────────────────────

async function getSheetData(tabName: string) {
  const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
  const spreadsheetId = SPREADSHEET_ID.value();

  if (!raw || !spreadsheetId) throw new Error('Missing Sheets configuration');

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:Z`,
  });
  return response.data.values || [];
}

async function appendToSheet(tabName: string, values: string[]) {
  const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
  const spreadsheetId = SPREADSHEET_ID.value();

  if (!raw || !spreadsheetId) throw new Error('Missing Sheets configuration');

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function updateSheetRow(tabName: string, rowIndex: number, values: string[]) {
  const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
  const spreadsheetId = SPREADSHEET_ID.value();

  if (!raw || !spreadsheetId) throw new Error('Missing Sheets configuration');

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const sheetRow = rowIndex + 1; 
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

// ── Mail Helper ────────────────────────────────────────────────────────────────

async function sendMail(options: { to: string, subject: string, html: string }) {
  const user = GMAIL_USER.value();
  const pass = GMAIL_APP_PASSWORD.value();

  if (!user || !pass) {
    console.warn('[Mail] Credentials missing, skipping email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: `"FaroForma" <${user}>`,
    ...options
  });
  return info;
}

// ── Public Routes ─────────────────────────────────────────────────────────────

app.post('/api/inscricao-formadores', publicLimiter, async (req: Request, res: Response) => {
  const parsed = FormadoresSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos' });
    return;
  }

  const d = parsed.data;
  const timestamp = new Date().toISOString();

  try {
    await appendToSheet('Formadores', [
      timestamp, d.nome, d.email, d.telefone, d.dataNascimento, d.nif,
      d.areas.join(', '), d.habilitacoes, d.capCcp, d.experiencia, d.linkedin,
      d.dias.join(', '), d.periodos.join(', '), d.modalidade, d.motivacao,
    ]);

    // Emails
    await sendMail({
      to: d.email,
      subject: 'FaroForma — Candidatura recebida',
      html: `<p>Olá <strong>${d.nome}</strong>,</p><p>Recebemos a sua candidatura. Entraremos em contacto brevemente.</p>`,
    }).catch(() => {});

    const adminEmail = GMAIL_USER.value();
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `[ADMIN] Nova Candidatura: ${d.nome}`,
        html: `<h3>Nova Inscrição de Formador</h3><p><strong>Nome:</strong> ${d.nome}</p><p><strong>Email:</strong> ${d.email}</p><hr/><p><a href="https://faroformapt.web.app/admin">Aceder ao Backoffice</a></p>`,
      }).catch(() => {});
    }

    res.status(201).json({ message: 'Inscrição recebida com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

app.post('/api/contact', publicLimiter, async (req: Request, res: Response) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

  const d = parsed.data;
  try {
    await appendToSheet('Contactos', [new Date().toISOString(), d.name, d.email, d.phone, d.subject, d.message]);
    
    const adminEmail = GMAIL_USER.value();
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `FaroForma — Nova mensagem: ${d.name}`,
        html: `<p><strong>De:</strong> ${d.name} (${d.email})</p><p><strong>Mensagem:</strong></p><p>${d.message}</p>`,
      }).catch(() => {});
    }
    res.status(201).json({ message: 'Mensagem enviada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar contacto' });
  }
});

app.post('/api/student', publicLimiter, async (req: Request, res: Response) => {
  const parsed = StudentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });

  const d = parsed.data;
  try {
    await appendToSheet('Alunos', [new Date().toISOString(), d.fullName, d.email, d.phone, d.program, d.startDate, d.contactPreference, d.notes]);

    await sendMail({
      to: d.email,
      subject: 'FaroForma — Inscrição recebida',
      html: `<p>Olá <strong>${d.fullName}</strong>,</p><p>Recebemos a sua inscrição para ${d.program}.</p>`,
    }).catch(() => {});

    const adminEmail = GMAIL_USER.value();
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `[ADMIN] Novo Aluno: ${d.fullName}`,
        html: `<h3>Nova Inscrição</h3><p><strong>Nome:</strong> ${d.fullName}</p><p><strong>Programa:</strong> ${d.program}</p>`,
      }).catch(() => {});
    }
    res.status(201).json({ message: 'Inscrição recebida com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar inscrição' });
  }
});

// ── Admin Routes ─────────────────────────────────────────────────────────────

app.get('/api/admin/data', isAdmin as any, async (req: Request, res: Response) => {
  try {
    const [formadores, alunos, contactos] = await Promise.all([
      getSheetData('Formadores'), getSheetData('Alunos'), getSheetData('Contactos'),
    ]);
    res.json({ formadores, alunos, contactos });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter dados' });
  }
});

app.post('/api/admin/update-formador', isAdmin as any, async (req: Request, res: Response) => {
  const { rowIndex, values } = req.body;
  if (rowIndex === undefined || !Array.isArray(values)) return res.status(400).json({ error: 'Dados inválidos' });

  try {
    await updateSheetRow('Formadores', rowIndex, values);
    res.json({ message: 'Atualizado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

app.get('/api/admin/config', isAdmin as any, async (req: Request, res: Response) => {
  try {
    const doc = await admin.firestore().collection('config').doc('siteMeta').get();
    res.json(doc.exists ? doc.data() : {});
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
});

app.post('/api/admin/config', isAdmin as any, async (req: Request, res: Response) => {
  try {
    await admin.firestore().collection('config').doc('siteMeta').set(req.body, { merge: true });
    res.json({ message: 'Configurações guardadas' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao guardar' });
  }
});

app.get('/api/admin/agenda', isAdmin as any, async (req: Request, res: Response) => {
  const room = (req.query.room as string) || 'sala1';
  try {
    const doc = await admin.firestore().collection('agenda').doc(room).get();
    res.json(doc.exists ? doc.data() : {});
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter agenda' });
  }
});

app.post('/api/admin/agenda', isAdmin as any, async (req: Request, res: Response) => {
  const room = (req.query.room as string) || 'sala1';
  try {
    await admin.firestore().collection('agenda').doc(room).set(req.body);
    res.json({ message: 'Agenda atualizada' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// ── Course Routes ─────────────────────────────────────────────────────────────

app.get('/api/courses', async (req: Request, res: Response) => {
  try {
    const snapshot = await admin.firestore().collection('courses').orderBy('title').get();
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter cursos' });
  }
});

app.get('/api/admin/courses', isAdmin as any, async (req: Request, res: Response) => {
  try {
    const snapshot = await admin.firestore().collection('courses').orderBy('title').get();
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter cursos' });
  }
});

app.post('/api/admin/courses', isAdmin as any, async (req: Request, res: Response) => {
  const { id, ...data } = req.body;
  try {
    if (id) {
      await admin.firestore().collection('courses').doc(id).set(data, { merge: true });
    } else {
      await admin.firestore().collection('courses').add(data);
    }
    res.json({ message: 'Curso guardado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao guardar curso' });
  }
});

app.delete('/api/admin/courses/:id', isAdmin as any, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await admin.firestore().collection('courses').doc(id as string).delete();
    res.json({ message: 'Curso removido com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao remover curso' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

export const api = onRequest({ 
  region: "europe-west1", 
  memory: "256MiB",
  secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, SPREADSHEET_ID, GMAIL_USER, GMAIL_APP_PASSWORD]
}, app);
