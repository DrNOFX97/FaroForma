import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import { z } from "zod";
import * as admin from "firebase-admin";
import { F, A, C } from "./sheetsSchema";

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
  turma: z.string().optional().default(''),
  startDate: z.string().min(1),
  contactPreference: z.string().min(1),
  needsTransport: z.boolean().optional().default(false),
  notes: z.string().optional().default(''),
});

// ── Google Sheets Helper ───────────────────────────────────────────────────────

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let sheetsSpreadsheetId: string | null = null;

function getSheetsClient() {
  const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
  const spreadsheetId = SPREADSHEET_ID.value();

  if (!raw || !spreadsheetId) throw new Error('Missing Sheets configuration');

  if (!sheetsClient) {
    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
    sheetsSpreadsheetId = spreadsheetId;
  }

  return { sheets: sheetsClient, spreadsheetId: sheetsSpreadsheetId! };
}

async function getSheetData(tabName: string) {
  const { sheets, spreadsheetId } = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:Z`,
  });
  const rows = response.data.values || [];
  // Filter out blank rows (rows where every cell is empty/undefined/whitespace only)
  return rows.filter(row => row.some(cell => {
    if (cell === undefined || cell === null) return false;
    return String(cell).trim() !== '';
  }));
}

async function appendToSheet(tabName: string, values: string[]) {
  const { sheets, spreadsheetId } = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function updateSheetRow(tabName: string, rowIndex: number, values: string[]) {
  const { sheets, spreadsheetId } = getSheetsClient();
  const sheetRow = rowIndex + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

async function deleteSheetRow(tabName: string, rowIndex: number) {
  const { sheets, spreadsheetId } = getSheetsClient();
  
  // Get sheetId for the tabName
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === tabName);
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) throw new Error(`Sheet ${tabName} not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex, 
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  });
}

// ── Mail Helper ────────────────────────────────────────────────────────────────

function escHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
    from: '"FaroForma" <geral@faroforma.pt>',
    replyTo: user,
    ...options
  });
  return info;
}

async function notifyAdmins(subject: string, html: string) {
  const admins = await getAdminEmails();
  const fallback = GMAIL_USER.value();
  const recipients = admins.length > 0 ? admins : (fallback ? [fallback] : []);
  await Promise.all(recipients.map(to => sendMail({ to, subject, html }).catch(() => {})));
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
    const row: string[] = [];
    row[F.TIMESTAMP] = timestamp;
    row[F.NOME] = d.nome;
    row[F.EMAIL] = d.email;
    row[F.TELEFONE] = d.telefone;
    row[F.DATA_NASCIMENTO] = d.dataNascimento;
    row[F.NIF] = d.nif;
    row[F.AREAS] = d.areas.join(', ');
    row[F.HABILITACOES] = d.habilitacoes;
    row[F.CAP_CCP] = d.capCcp;
    row[F.EXPERIENCIA] = d.experiencia;
    row[F.LINKEDIN] = d.linkedin;
    row[F.DIAS] = d.dias.join(', ');
    row[F.PERIODOS] = d.periodos.join(', ');
    row[F.MODALIDADE] = d.modalidade;
    row[F.MOTIVACAO] = d.motivacao;

    await appendToSheet('Formadores', row);

    // Emails
    await sendMail({
      to: d.email,
      subject: 'FaroForma — Candidatura recebida',
      html: `<p>Olá <strong>${escHtml(d.nome)}</strong>,</p><p>Recebemos a sua candidatura como formador. Analisaremos o seu perfil e entraremos em contacto brevemente.</p><p>Obrigado pelo interesse em fazer parte da equipa FaroForma.</p>`,
    }).catch(() => {});

    await notifyAdmins(
      `[Formador] Nova candidatura — ${d.nome}`,
      `<h2>Nova candidatura de formador</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Nome</strong></td><td>${escHtml(d.nome)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escHtml(d.email)}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${escHtml(d.telefone)}</td></tr>
        <tr><td><strong>Áreas</strong></td><td>${escHtml(d.areas.join(', '))}</td></tr>
        <tr><td><strong>Habilitações</strong></td><td>${escHtml(d.habilitacoes)}</td></tr>
        <tr><td><strong>CAP/CCP</strong></td><td>${escHtml(d.capCcp)}</td></tr>
        <tr><td><strong>Dias</strong></td><td>${escHtml(d.dias.join(', '))}</td></tr>
        <tr><td><strong>Períodos</strong></td><td>${escHtml(d.periodos.join(', '))}</td></tr>
        <tr><td><strong>Modalidade</strong></td><td>${escHtml(d.modalidade)}</td></tr>
      </table>
      ${d.motivacao ? `<p><strong>Motivação:</strong><br>${escHtml(d.motivacao)}</p>` : ''}
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`
    );

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
    const row: string[] = [];
    row[C.TIMESTAMP] = new Date().toISOString();
    row[C.NOME] = d.name;
    row[C.EMAIL] = d.email;
    row[C.TELEFONE] = d.phone;
    row[C.ASSUNTO] = d.subject;
    row[C.MENSAGEM] = d.message;
    await appendToSheet('Contactos', row);
    
    await notifyAdmins(
      `[Contacto] ${d.name} — ${d.subject || 'sem assunto'}`,
      `<h2>Nova mensagem de contacto</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Nome</strong></td><td>${escHtml(d.name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escHtml(d.email)}</td></tr>
        ${d.phone ? `<tr><td><strong>Telefone</strong></td><td>${escHtml(d.phone)}</td></tr>` : ''}
        ${d.subject ? `<tr><td><strong>Assunto</strong></td><td>${escHtml(d.subject)}</td></tr>` : ''}
      </table>
      <p><strong>Mensagem:</strong></p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">${escHtml(d.message)}</blockquote>
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`
    );
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
    const transportLabel = d.needsTransport ? 'Sim (+2,50 €/viagem/dia)' : 'Não';
    const row: string[] = [];
    row[A.TIMESTAMP] = new Date().toISOString();
    row[A.NOME] = d.fullName;
    row[A.EMAIL] = d.email;
    row[A.TELEFONE] = d.phone;
    row[A.PROGRAMA] = d.program;
    row[A.TURMA] = d.turma;
    row[A.DATA_INICIO] = d.startDate;
    row[A.PREFERENCIA_CONTACTO] = d.contactPreference;
    row[A.TRANSPORTE] = transportLabel;
    row[A.NOTAS] = d.notes;
    await appendToSheet('Alunos', row);

    await sendMail({
      to: d.email,
      subject: 'FaroForma — Inscrição recebida',
      html: `<p>Olá <strong>${escHtml(d.fullName)}</strong>,</p><p>Recebemos a sua inscrição para <strong>${escHtml(d.program)}</strong>${d.turma ? ` (${escHtml(d.turma)})` : ''}. Entraremos em contacto brevemente através do seu meio de contacto preferido.</p>${d.needsTransport ? `<p>Confirmamos que solicitou transporte com taxa adicional de <strong>2,50 € por viagem/dia</strong>.</p>` : ''}<p>Obrigado por escolher a FaroForma.</p>`,
    }).catch(() => {});

    await notifyAdmins(
      `[Aluno] Nova inscrição — ${d.fullName}`,
      `<h2>Nova inscrição de aluno</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Nome</strong></td><td>${escHtml(d.fullName)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escHtml(d.email)}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${escHtml(d.phone)}</td></tr>
        <tr><td><strong>Programa</strong></td><td>${escHtml(d.program)}</td></tr>
        ${d.turma ? `<tr><td><strong>Turma</strong></td><td>${escHtml(d.turma)}</td></tr>` : ''}
        <tr><td><strong>Início pretendido</strong></td><td>${escHtml(d.startDate)}</td></tr>
        <tr><td><strong>Contacto preferido</strong></td><td>${escHtml(d.contactPreference)}</td></tr>
        <tr><td><strong>Transporte</strong></td><td>${transportLabel}</td></tr>
      </table>
      ${d.notes ? `<p><strong>Notas:</strong><br>${escHtml(d.notes)}</p>` : ''}
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`
    );
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


app.post('/api/admin/update-row', isAdmin as any, async (req: Request, res: Response) => {
  const { tabName, rowIndex, values } = req.body;
  if (!tabName || rowIndex === undefined || !Array.isArray(values)) return res.status(400).json({ error: 'Dados inválidos' });

  try {
    await updateSheetRow(tabName, rowIndex, values);
    res.json({ message: 'Atualizado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

app.delete('/api/admin/delete-row', isAdmin as any, async (req: Request, res: Response) => {
  const { tabName, rowIndex } = req.body;
  if (!tabName || rowIndex === undefined) return res.status(400).json({ error: 'Dados inválidos' });

  try {
    await deleteSheetRow(tabName, rowIndex);
    res.json({ message: 'Eliminado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao eliminar linha' });
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

// ── Admin Emails Routes ───────────────────────────────────────────────────────

app.get('/api/admin/admins', isAdmin as any, async (req: Request, res: Response) => {
  try {
    const doc = await admin.firestore().collection('config').doc('admins').get();
    const emails = (doc.exists ? (doc.data()?.emails as string[]) : null) ?? [];
    res.json({ emails });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao obter administradores' });
  }
});

app.post('/api/admin/admins', isAdmin as any, async (req: Request, res: Response) => {
  const { emails } = req.body;
  if (!Array.isArray(emails) || emails.some(e => typeof e !== 'string')) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  try {
    await admin.firestore().collection('config').doc('admins').set({ emails });
    adminEmailsCache = { emails, ts: Date.now() }; // invalidate cache immediately
    res.json({ message: 'Administradores guardados' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao guardar administradores' });
  }
});

// ── Analytics Route ──────────────────────────────────────────────────────────

app.post('/api/track-visit', publicLimiter, async (req: Request, res: Response) => {
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];
  const hourKey = now.getHours().toString();
  const ts = now.toISOString();

  try {
    const docRef = admin.firestore().collection('analytics').doc(dateKey);
    await admin.firestore().runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) {
        t.set(docRef, { total: 1, hourly: { [hourKey]: 1 }, log: [ts] });
      } else {
        const data = doc.data() || {};
        const newTotal = (data.total || 0) + 1;
        const newHourly = { ...data.hourly };
        newHourly[hourKey] = (newHourly[hourKey] || 0) + 1;
        const log: string[] = data.log || [];
        // keep last 200 entries
        const newLog = [...log, ts].slice(-200);
        t.update(docRef, { total: newTotal, hourly: newHourly, log: newLog });
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registar visita' });
  }
});

app.get('/api/admin/analytics', isAdmin as any, async (req: Request, res: Response) => {
  const dateKey = new Date().toISOString().split('T')[0];
  try {
    const doc = await admin.firestore().collection('analytics').doc(dateKey).get();
    res.json(doc.exists ? doc.data() : { total: 0, hourly: {} });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter analytics' });
  }
});

// ── CMS Routes ──────────────────────────────────────────────────────────────

app.get('/api/cms/:section', async (req: Request, res: Response) => {
  const section = req.params.section as string;
  try {
    const doc = await admin.firestore().collection('cms').doc(section).get();
    res.json(doc.exists ? doc.data() : {});
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter secção CMS' });
  }
});

app.post('/api/cms/:section', isAdmin as any, async (req: Request, res: Response) => {
  const section = req.params.section as string;
  try {
    await admin.firestore().collection('cms').doc(section).set(req.body, { merge: true });
    res.json({ message: 'Secção atualizada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao guardar secção CMS' });
  }
});

app.get('/health', (req, res) => res.send('OK'));

export const api = onRequest({ 
  region: "europe-west1", 
  memory: "256MiB",
  secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, SPREADSHEET_ID, GMAIL_USER, GMAIL_APP_PASSWORD]
}, app);
