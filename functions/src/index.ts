import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
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
app.use(cors({ origin: true }));
app.use(express.json());

const ADMIN_EMAIL = 'faroforma@gmail.com';

// ── Auth Middleware ──────────────────────────────────────────────────────────

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[Auth] Checking admin permissions for path:', req.path);
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[Auth] Missing or invalid Authorization header');
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(`[Auth] Token verified for: ${decodedToken.email}`);
    if (decodedToken.email === ADMIN_EMAIL) {
      (req as any).user = decodedToken;
      next();
    } else {
      console.warn(`[Auth] Access denied for: ${decodedToken.email}`);
      res.status(403).json({ error: 'Proibido' });
    }
  } catch (error: any) {
    console.error('[Auth] Token verification failed:', error.message);
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
  console.log(`[Sheets] Fetching tab: ${tabName}`);
  const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
  const spreadsheetId = SPREADSHEET_ID.value();

  if (!raw || !spreadsheetId) {
    throw new Error('Missing Sheets configuration');
  }

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tabName}!A:Z`,
    });
    console.log(`[Sheets] Success fetching ${tabName}: ${response.data.values?.length || 0} rows`);
    return response.data.values || [];
  } catch (err: any) {
    console.error(`[Sheets] Error fetching ${tabName}:`, err.message);
    throw err;
  }
}

async function appendToSheet(tabName: string, values: string[]) {
  const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
  const spreadsheetId = SPREADSHEET_ID.value();

  if (!raw || !spreadsheetId) {
    throw new Error('Missing Sheets configuration');
  }

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

  if (!raw || !spreadsheetId) {
    throw new Error('Missing Sheets configuration');
  }

  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  // rowIndex is 0-based index from our data, but sheets are 1-based and we have a header row
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
    console.warn('Mail credentials missing, skipping email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"FaroForma" <${user}>`,
    ...options
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  console.log(`[Express] Incoming Request - Method: ${req.method}, URL: ${req.url}, OriginalURL: ${req.originalUrl}, Path: ${req.path}`);
  next();
});

app.post('/api/inscricao-formadores', async (req: Request, res: Response) => {
  const parsed = FormadoresSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos' });
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

    await sendMail({
      to: d.email,
      subject: 'FaroForma — Candidatura recebida',
      html: `
        <p>Olá <strong>${d.nome}</strong>,</p>
        <p>Recebemos a sua candidatura para formador na FaroForma. Entraremos em contacto brevemente.</p>
        <p>Obrigado pelo interesse!</p>
        <p>— Equipa FaroForma</p>
      `,
    }).catch(err => console.error('Mail failed:', err));

    res.status(201).json({ message: 'Sucesso' });
  } catch (err: any) {
    console.error('Submission failed:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

app.post('/api/contact', async (req: Request, res: Response) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos' });
    return;
  }

  const d = parsed.data;
  const timestamp = new Date().toISOString();

  try {
    await appendToSheet('Contactos', [
      timestamp,
      d.name,
      d.email,
      d.phone || '',
      d.subject || '',
      d.message,
    ]);

    const adminEmail = GMAIL_USER.value();
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `FaroForma — Nova mensagem de ${d.name}`,
        html: `
          <p><strong>De:</strong> ${d.name} (${d.email})</p>
          <p><strong>Telefone:</strong> ${d.phone || 'N/A'}</p>
          <p><strong>Assunto:</strong> ${d.subject || 'N/A'}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${d.message.replace(/\n/g, '<br>')}</p>
        `,
      }).catch(err => console.error('Admin mail failed:', err));
    }

    res.status(201).json({ message: 'Sucesso' });
  } catch (err: any) {
    console.error('Contact failed:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

app.post('/api/student', async (req: Request, res: Response) => {
  const parsed = StudentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos' });
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
      d.notes || '',
    ]);

    await sendMail({
      to: d.email,
      subject: 'FaroForma — Inscrição recebida',
      html: `
        <p>Olá <strong>${d.fullName}</strong>,</p>
        <p>Recebemos a sua inscrição para <strong>${d.program}</strong>. Entraremos em contacto em até 24h úteis.</p>
        <p>Obrigado!</p>
        <p>— Equipa FaroForma</p>
      `,
    }).catch(err => console.error('Student mail failed:', err));

    res.status(201).json({ message: 'Sucesso' });
  } catch (err: any) {
    console.error('Student failed:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

app.get('/api/admin/data', isAdmin as any, async (req: Request, res: Response) => {
  console.log('[Admin] Executing data fetch - v2');
  try {
    const [formadores, alunos, contactos] = await Promise.all([
      getSheetData('Formadores'),
      getSheetData('Alunos'),
      getSheetData('Contactos'),
    ]);

    res.json({ formadores, alunos, contactos });
  } catch (err: any) {
    console.error('[Admin] Data fetch failed:', err);
    res.status(500).json({ error: err.message || 'Erro ao obter dados das Sheets' });
  }
});

app.post('/api/admin/update-formador', isAdmin as any, async (req: Request, res: Response) => {
  const { rowIndex, values } = req.body;
  if (rowIndex === undefined || !Array.isArray(values)) {
    res.status(400).json({ error: 'Dados inválidos para atualização' });
    return;
  }

  try {
    await updateSheetRow('Formadores', rowIndex, values);
    res.json({ message: 'Formador atualizado com sucesso' });
  } catch (err: any) {
    console.error('[Admin] Update formador failed:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar dados na Sheet' });
  }
});


app.get('/api/admin/config', isAdmin as any, async (req: Request, res: Response) => {
  console.log('[Admin] Executing /api/admin/config GET');
  try {
    const doc = await admin.firestore().collection('config').doc('siteMeta').get();
    res.json(doc.exists ? doc.data() : {});
  } catch (err: any) {
    console.error('[Admin] Config fetch failed:', err);
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
});

app.post('/api/admin/config', isAdmin as any, async (req: Request, res: Response) => {
  console.log('[Admin] Executing /api/admin/config POST');
  try {
    await admin.firestore().collection('config').doc('siteMeta').set(req.body, { merge: true });
    res.json({ message: 'Configurações guardadas' });
  } catch (err: any) {
    console.error('[Admin] Config save failed:', err);
    res.status(500).json({ error: 'Erro ao guardar configurações' });
  }
});

app.get('/api/admin/agenda', isAdmin as any, async (req: Request, res: Response) => {
  console.log('[Agenda] Fetching sala1 data');
  try {
    const doc = await admin.firestore().collection('agenda').doc('sala1').get();
    const data = doc.exists ? doc.data() : {};
    console.log(`[Agenda] Success: ${Object.keys(data).length} slots found`);
    res.json(data);
  } catch (err: any) {
    console.error('[Agenda] Fetch error:', err.message);
    res.status(500).json({ error: 'Erro ao obter agenda' });
  }
});

app.post('/api/admin/agenda', isAdmin as any, async (req: Request, res: Response) => {
  console.log('[Agenda] Saving sala1 data');
  try {
    const db = admin.firestore();
    await db.collection('agenda').doc('sala1').set(req.body);
    console.log('[Agenda] Save success');
    res.json({ message: 'Agenda atualizada' });
  } catch (err: any) {
    console.error('[Agenda] SAVE ERROR DETAILS:', err.code, err.message, err.stack);
    res.status(500).json({ error: `Erro ao salvar no Firestore: ${err.message}` });
  }
});

// Root for health check
app.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

// Catch-all to help debug
app.use((req, res) => {
  console.warn(`[Express] 404 NOT FOUND - Path: ${req.path}, OriginalURL: ${req.originalUrl}`);
  res.status(404).json({ error: `Route ${req.path} not found on Cloud Function` });
});

export const api = onRequest({ 
  region: "europe-west1", 
  memory: "256MiB",
  secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, SPREADSHEET_ID, GMAIL_USER, GMAIL_APP_PASSWORD]
}, app);
