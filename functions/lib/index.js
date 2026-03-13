"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const googleapis_1 = require("googleapis");
const nodemailer_1 = __importDefault(require("nodemailer"));
const zod_1 = require("zod");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const GOOGLE_SERVICE_ACCOUNT_JSON = (0, params_1.defineSecret)("GOOGLE_SERVICE_ACCOUNT_JSON");
const SPREADSHEET_ID = (0, params_1.defineSecret)("SPREADSHEET_ID");
const GMAIL_USER = (0, params_1.defineSecret)("GMAIL_USER");
const GMAIL_APP_PASSWORD = (0, params_1.defineSecret)("GMAIL_APP_PASSWORD");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
const ADMIN_EMAIL = 'faroforma@gmail.com';
const isAdmin = async (req, res, next) => {
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
            req.user = decodedToken;
            next();
        }
        else {
            console.warn(`[Auth] Access denied for: ${decodedToken.email}`);
            res.status(403).json({ error: 'Proibido' });
        }
    }
    catch (error) {
        console.error('[Auth] Token verification failed:', error.message);
        res.status(401).json({ error: 'Token inválido' });
    }
};
const FormadoresSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    telefone: zod_1.z.string().min(1),
    dataNascimento: zod_1.z.string().optional().default(''),
    nif: zod_1.z.string().optional().default(''),
    areas: zod_1.z.array(zod_1.z.string()).min(1),
    habilitacoes: zod_1.z.string().min(1),
    capCcp: zod_1.z.string().min(1),
    experiencia: zod_1.z.string().optional().default(''),
    linkedin: zod_1.z.string().optional().default(''),
    dias: zod_1.z.array(zod_1.z.string()).min(1),
    periodos: zod_1.z.array(zod_1.z.string()).min(1),
    modalidade: zod_1.z.string().min(1),
    motivacao: zod_1.z.string().min(1),
});
const ContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional().default(''),
    subject: zod_1.z.string().optional().default(''),
    message: zod_1.z.string().min(1),
});
const StudentSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(1),
    program: zod_1.z.string().min(1),
    startDate: zod_1.z.string().min(1),
    contactPreference: zod_1.z.string().min(1),
    notes: zod_1.z.string().optional().default(''),
});
async function getSheetData(tabName) {
    console.log(`[Sheets] Fetching tab: ${tabName}`);
    const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
    const spreadsheetId = SPREADSHEET_ID.value();
    if (!raw || !spreadsheetId) {
        throw new Error('Missing Sheets configuration');
    }
    const credentials = JSON.parse(raw);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${tabName}!A:Z`,
        });
        console.log(`[Sheets] Success fetching ${tabName}: ${response.data.values?.length || 0} rows`);
        return response.data.values || [];
    }
    catch (err) {
        console.error(`[Sheets] Error fetching ${tabName}:`, err.message);
        throw err;
    }
}
async function appendToSheet(tabName, values) {
    const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
    const spreadsheetId = SPREADSHEET_ID.value();
    if (!raw || !spreadsheetId) {
        throw new Error('Missing Sheets configuration');
    }
    const credentials = JSON.parse(raw);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
}
async function updateSheetRow(tabName, rowIndex, values) {
    const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
    const spreadsheetId = SPREADSHEET_ID.value();
    if (!raw || !spreadsheetId) {
        throw new Error('Missing Sheets configuration');
    }
    const credentials = JSON.parse(raw);
    const auth = new googleapis_1.google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
}
async function sendMail(options) {
    const user = GMAIL_USER.value();
    const pass = GMAIL_APP_PASSWORD.value();
    if (!user || !pass) {
        console.warn('Mail credentials missing, skipping email.');
        return;
    }
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: { user, pass },
    });
    await transporter.sendMail({
        from: `"FaroForma" <${user}>`,
        ...options
    });
}
app.use((req, res, next) => {
    console.log(`[Express] Incoming Request - Method: ${req.method}, URL: ${req.url}, OriginalURL: ${req.originalUrl}, Path: ${req.path}`);
    next();
});
app.post('/api/inscricao-formadores', async (req, res) => {
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
    }
    catch (err) {
        console.error('Submission failed:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});
app.post('/api/contact', async (req, res) => {
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
    }
    catch (err) {
        console.error('Contact failed:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});
app.post('/api/student', async (req, res) => {
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
    }
    catch (err) {
        console.error('Student failed:', err);
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});
app.get('/api/admin/data', isAdmin, async (req, res) => {
    console.log('[Admin] Executing data fetch - v2');
    try {
        const [formadores, alunos, contactos] = await Promise.all([
            getSheetData('Formadores'),
            getSheetData('Alunos'),
            getSheetData('Contactos'),
        ]);
        res.json({ formadores, alunos, contactos });
    }
    catch (err) {
        console.error('[Admin] Data fetch failed:', err);
        res.status(500).json({ error: err.message || 'Erro ao obter dados das Sheets' });
    }
});
app.post('/api/admin/update-formador', isAdmin, async (req, res) => {
    const { rowIndex, values } = req.body;
    if (rowIndex === undefined || !Array.isArray(values)) {
        res.status(400).json({ error: 'Dados inválidos para atualização' });
        return;
    }
    try {
        await updateSheetRow('Formadores', rowIndex, values);
        res.json({ message: 'Formador atualizado com sucesso' });
    }
    catch (err) {
        console.error('[Admin] Update formador failed:', err);
        res.status(500).json({ error: err.message || 'Erro ao atualizar dados na Sheet' });
    }
});
app.get('/api/admin/config', isAdmin, async (req, res) => {
    console.log('[Admin] Executing /api/admin/config GET');
    try {
        const doc = await admin.firestore().collection('config').doc('siteMeta').get();
        res.json(doc.exists ? doc.data() : {});
    }
    catch (err) {
        console.error('[Admin] Config fetch failed:', err);
        res.status(500).json({ error: 'Erro ao obter configurações' });
    }
});
app.post('/api/admin/config', isAdmin, async (req, res) => {
    console.log('[Admin] Executing /api/admin/config POST');
    try {
        await admin.firestore().collection('config').doc('siteMeta').set(req.body, { merge: true });
        res.json({ message: 'Configurações guardadas' });
    }
    catch (err) {
        console.error('[Admin] Config save failed:', err);
        res.status(500).json({ error: 'Erro ao guardar configurações' });
    }
});
app.get('/api/admin/agenda', isAdmin, async (req, res) => {
    console.log('[Agenda] Fetching sala1 data');
    try {
        const doc = await admin.firestore().collection('agenda').doc('sala1').get();
        const data = doc.exists ? doc.data() : {};
        console.log(`[Agenda] Success: ${Object.keys(data).length} slots found`);
        res.json(data);
    }
    catch (err) {
        console.error('[Agenda] Fetch error:', err.message);
        res.status(500).json({ error: 'Erro ao obter agenda' });
    }
});
app.post('/api/admin/agenda', isAdmin, async (req, res) => {
    console.log('[Agenda] Saving sala1 data', JSON.stringify(req.body).substring(0, 100) + '...');
    try {
        await admin.firestore().collection('agenda').doc('sala1').set(req.body);
        console.log('[Agenda] Save success');
        res.json({ message: 'Agenda atualizada' });
    }
    catch (err) {
        console.error('[Agenda] Save error:', err.message);
        res.status(500).json({ error: 'Erro ao salvar agenda' });
    }
});
app.get('/', (req, res) => {
    res.send('API is running');
});
app.use((req, res) => {
    console.warn(`[Express] 404 NOT FOUND - Path: ${req.path}, OriginalURL: ${req.originalUrl}`);
    res.status(404).json({ error: `Route ${req.path} not found on Cloud Function` });
});
exports.api = (0, https_1.onRequest)({
    region: "europe-west1",
    memory: "256MiB",
    secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, SPREADSHEET_ID, GMAIL_USER, GMAIL_APP_PASSWORD]
}, app);
//# sourceMappingURL=index.js.map