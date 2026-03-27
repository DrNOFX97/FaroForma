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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const googleapis_1 = require("googleapis");
const nodemailer_1 = __importDefault(require("nodemailer"));
const zod_1 = require("zod");
const admin = __importStar(require("firebase-admin"));
const sheetsSchema_1 = require("./sheetsSchema");
const generative_ai_1 = require("@google/generative-ai");
const crypto_1 = __importDefault(require("crypto"));
admin.initializeApp();
const GOOGLE_SERVICE_ACCOUNT_JSON = (0, params_1.defineSecret)("GOOGLE_SERVICE_ACCOUNT_JSON");
const SPREADSHEET_ID = (0, params_1.defineSecret)("SPREADSHEET_ID");
const GMAIL_USER = (0, params_1.defineSecret)("GMAIL_USER");
const GMAIL_APP_PASSWORD = (0, params_1.defineSecret)("GMAIL_APP_PASSWORD");
const GEMINI_API_KEY = (0, params_1.defineSecret)("GEMINI_API_KEY");
const N8N_WEBHOOK_URL = (0, params_1.defineSecret)("N8N_WEBHOOK_URL");
const WA_TOKEN = (0, params_1.defineSecret)("WA_TOKEN");
const WA_PHONE_NUMBER_ID = (0, params_1.defineSecret)("WA_PHONE_NUMBER_ID");
const WHATSAPP_PHONE = "351917812379";
async function notifyN8n(type, data) {
    const url = N8N_WEBHOOK_URL.value();
    if (!url)
        return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data }),
        });
    }
    catch (err) {
        console.warn('[n8n] webhook failed:', err);
    }
}
async function notifyWhatsApp(message) {
    const token = WA_TOKEN.value();
    const phoneNumberId = WA_PHONE_NUMBER_ID.value();
    if (!token || !phoneNumberId)
        return;
    try {
        await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: WHATSAPP_PHONE,
                type: 'text',
                text: { body: message },
            }),
        });
    }
    catch (err) {
        console.warn('[WhatsApp] notification failed:', err);
    }
}
const TRANSLATE_MAX_DEPTH = 6;
const TRANSLATE_MAX_STRING = 2000;
async function autoTranslate(data) {
    if (!data)
        return {};
    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey)
        return data;
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    async function processObject(obj, depth) {
        if (depth > TRANSLATE_MAX_DEPTH)
            return;
        if (typeof obj.pt === 'string' && obj.pt.length > 0 &&
            (obj.en === undefined || obj.en === null || (typeof obj.en === 'string' && obj.en.trim() === ''))) {
            const text = obj.pt.slice(0, TRANSLATE_MAX_STRING).replace(/[`\\]/g, ' ');
            const prompt = `Translate this text from a professional training center in Portugal to UK English. Keep the professional and educational tone. Return ONLY the translated text.\n\nText: ${text}`;
            try {
                const result = await model.generateContent(prompt);
                obj.en = result.response.text().trim();
            }
            catch (err) {
                console.error('Translation failed:', err);
            }
        }
        else {
            for (const key of Object.keys(obj)) {
                const val = obj[key];
                if (Array.isArray(val)) {
                    for (const item of val) {
                        if (item !== null && typeof item === 'object') {
                            await processObject(item, depth + 1);
                        }
                    }
                }
                else if (val !== null && typeof val === 'object') {
                    await processObject(val, depth + 1);
                }
            }
        }
    }
    const result = JSON.parse(JSON.stringify(data));
    await processObject(result, 0);
    return result;
}
const ALLOWED_ORIGINS = ['https://faroforma.pt', 'https://www.faroforma.pt'];
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)({ origin: ALLOWED_ORIGINS }));
app.use(express_1.default.json());
app.use((_req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});
const publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados pedidos. Tente novamente mais tarde.' },
});
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados pedidos. Tente novamente mais tarde.' },
});
app.use('/api/admin', adminLimiter);
let adminEmailsCache = null;
let adminEmailsFetch = null;
const ADMIN_CACHE_TTL = 5 * 60 * 1000;
async function getAdminEmails() {
    if (adminEmailsCache && Date.now() - adminEmailsCache.ts < ADMIN_CACHE_TTL) {
        return adminEmailsCache.emails;
    }
    if (adminEmailsFetch)
        return adminEmailsFetch;
    adminEmailsFetch = admin.firestore().collection('config').doc('admins').get()
        .then(doc => {
        const emails = (doc.exists ? doc.data()?.emails : null) ?? [];
        adminEmailsCache = { emails, ts: Date.now() };
        return emails;
    })
        .catch(() => adminEmailsCache?.emails ?? [])
        .finally(() => { adminEmailsFetch = null; });
    return adminEmailsFetch;
}
async function createAuditLog(req, action, target, details = {}) {
    const user = req.user;
    if (!user)
        return;
    try {
        await admin.firestore().collection('audit_log').add({
            timestamp: new Date().toISOString(),
            userEmail: user.email,
            userName: user.name || user.email.split('@')[0],
            action,
            target,
            details
        });
    }
    catch (err) {
        console.error('Audit log failed:', err);
    }
}
const isAdmin = async (req, res, next) => {
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
            req.user = decodedToken;
            next();
        }
        else {
            res.status(403).json({ error: 'Proibido' });
        }
    }
    catch {
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
    turma: zod_1.z.string().optional().default(''),
    startDate: zod_1.z.string().min(1),
    contactPreference: zod_1.z.string().min(1),
    needsTransport: zod_1.z.boolean().optional().default(false),
    notes: zod_1.z.string().optional().default(''),
});
let sheetsClient = null;
let sheetsSpreadsheetId = null;
function getSheetsClient() {
    const raw = GOOGLE_SERVICE_ACCOUNT_JSON.value();
    const spreadsheetId = SPREADSHEET_ID.value();
    if (!raw || !spreadsheetId)
        throw new Error('Missing Sheets configuration');
    if (!sheetsClient) {
        const credentials = JSON.parse(raw);
        const auth = new googleapis_1.google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        sheetsClient = googleapis_1.google.sheets({ version: 'v4', auth });
        sheetsSpreadsheetId = spreadsheetId;
    }
    return { sheets: sheetsClient, spreadsheetId: sheetsSpreadsheetId };
}
async function getSheetData(tabName) {
    const { sheets, spreadsheetId } = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabName}!A:Z`,
    });
    const rows = response.data.values || [];
    return rows.filter(row => row.some(cell => {
        if (cell === undefined || cell === null)
            return false;
        return String(cell).trim() !== '';
    }));
}
async function appendToSheet(tabName, values) {
    const { sheets, spreadsheetId } = getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tabName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
}
async function updateSheetRow(tabName, rowIndex, values) {
    const { sheets, spreadsheetId } = getSheetsClient();
    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
}
async function deleteSheetRow(tabName, rowIndex) {
    const { sheets, spreadsheetId } = getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === tabName);
    const sheetId = sheet?.properties?.sheetId;
    if (sheetId === undefined)
        throw new Error(`Sheet ${tabName} not found`);
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
function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
async function sendMail(options) {
    const user = GMAIL_USER.value();
    const pass = GMAIL_APP_PASSWORD.value();
    if (!user || !pass) {
        console.warn('[Mail] Credentials missing, skipping email.');
        return;
    }
    const transporter = nodemailer_1.default.createTransport({
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
async function notifyAdmins(subject, html) {
    const admins = await getAdminEmails();
    const fallback = GMAIL_USER.value();
    const recipients = admins.length > 0 ? admins : (fallback ? [fallback] : []);
    await Promise.all(recipients.map(to => sendMail({ to, subject, html }).catch(() => { })));
}
app.post('/api/inscricao-formadores', publicLimiter, async (req, res) => {
    const parsed = FormadoresSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Dados inválidos' });
        return;
    }
    const d = parsed.data;
    const timestamp = new Date().toISOString();
    try {
        const row = [];
        row[sheetsSchema_1.F.TIMESTAMP] = timestamp;
        row[sheetsSchema_1.F.NOME] = d.nome;
        row[sheetsSchema_1.F.EMAIL] = d.email;
        row[sheetsSchema_1.F.TELEFONE] = d.telefone;
        row[sheetsSchema_1.F.DATA_NASCIMENTO] = d.dataNascimento;
        row[sheetsSchema_1.F.NIF] = d.nif;
        row[sheetsSchema_1.F.AREAS] = d.areas.join(', ');
        row[sheetsSchema_1.F.HABILITACOES] = d.habilitacoes;
        row[sheetsSchema_1.F.CAP_CCP] = d.capCcp;
        row[sheetsSchema_1.F.EXPERIENCIA] = d.experiencia;
        row[sheetsSchema_1.F.LINKEDIN] = d.linkedin;
        row[sheetsSchema_1.F.DIAS] = d.dias.join(', ');
        row[sheetsSchema_1.F.PERIODOS] = d.periodos.join(', ');
        row[sheetsSchema_1.F.MODALIDADE] = d.modalidade;
        row[sheetsSchema_1.F.MOTIVACAO] = d.motivacao;
        let emailConf = 'Não';
        try {
            await sendMail({
                to: d.email,
                subject: 'FaroForma — Candidatura recebida',
                html: `<p>Olá <strong>${escHtml(d.nome)}</strong>,</p><p>Recebemos a sua candidatura como formador. Analisaremos o seu perfil e entraremos em contacto brevemente.</p><p>Obrigado pelo interesse em fazer parte da equipa FaroForma.</p>`,
            });
            emailConf = 'Sim';
        }
        catch { }
        row[sheetsSchema_1.F.EMAIL_CONF] = emailConf;
        await appendToSheet('Formadores', row);
        notifyN8n('formador', d).catch(() => { });
        notifyAdmins(`[Formador] Nova candidatura — ${d.nome}`, `<h2>Nova candidatura de formador</h2>
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
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`).catch(() => { });
        res.status(201).json({ message: 'Inscrição recebida com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Erro interno' });
    }
});
app.post('/api/contact', publicLimiter, async (req, res) => {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Dados inválidos' });
    const d = parsed.data;
    try {
        const row = [];
        row[sheetsSchema_1.C.TIMESTAMP] = new Date().toISOString();
        row[sheetsSchema_1.C.NOME] = d.name;
        row[sheetsSchema_1.C.EMAIL] = d.email;
        row[sheetsSchema_1.C.TELEFONE] = d.phone;
        row[sheetsSchema_1.C.ASSUNTO] = d.subject;
        row[sheetsSchema_1.C.MENSAGEM] = d.message;
        await appendToSheet('Contactos', row);
        notifyN8n('contacto', d).catch(() => { });
        const waMsg = `📩 *Nova mensagem — FaroForma*\n👤 ${d.name}\n📧 ${d.email}${d.phone ? `\n📞 ${d.phone}` : ''}${d.subject ? `\n📌 ${d.subject}` : ''}\n\n${d.message}`;
        notifyWhatsApp(waMsg).catch(() => { });
        await notifyAdmins(`[Contacto] ${d.name} — ${d.subject || 'sem assunto'}`, `<h2>Nova mensagem de contacto</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Nome</strong></td><td>${escHtml(d.name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escHtml(d.email)}</td></tr>
        ${d.phone ? `<tr><td><strong>Telefone</strong></td><td>${escHtml(d.phone)}</td></tr>` : ''}
        ${d.subject ? `<tr><td><strong>Assunto</strong></td><td>${escHtml(d.subject)}</td></tr>` : ''}
      </table>
      <p><strong>Mensagem:</strong></p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">${escHtml(d.message)}</blockquote>
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`);
        res.status(201).json({ message: 'Mensagem enviada com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao processar contacto' });
    }
});
app.post('/api/student', publicLimiter, async (req, res) => {
    const parsed = StudentSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Dados inválidos' });
    const d = parsed.data;
    try {
        const transportLabel = d.needsTransport ? 'Sim (+2,50 €/viagem/dia)' : 'Não';
        const row = [];
        row[sheetsSchema_1.A.TIMESTAMP] = new Date().toISOString();
        row[sheetsSchema_1.A.NOME] = d.fullName;
        row[sheetsSchema_1.A.EMAIL] = d.email;
        row[sheetsSchema_1.A.TELEFONE] = d.phone;
        row[sheetsSchema_1.A.PROGRAMA] = d.program;
        row[sheetsSchema_1.A.TURMA] = d.turma;
        row[sheetsSchema_1.A.DATA_INICIO] = d.startDate;
        row[sheetsSchema_1.A.PREFERENCIA_CONTACTO] = d.contactPreference;
        row[sheetsSchema_1.A.TRANSPORTE] = transportLabel;
        row[sheetsSchema_1.A.NOTAS] = d.notes;
        let emailConf = 'Não';
        try {
            await sendMail({
                to: d.email,
                subject: 'FaroForma — Inscrição recebida',
                html: `<p>Olá <strong>${escHtml(d.fullName)}</strong>,</p><p>Recebemos a sua inscrição para <strong>${escHtml(d.program)}</strong>${d.turma ? ` (${escHtml(d.turma)})` : ''}. Entraremos em contacto brevemente através do seu meio de contacto preferido.</p>${d.needsTransport ? `<p>Confirmamos que solicitou transporte com taxa adicional de <strong>2,50 € por viagem/dia</strong>.</p>` : ''}<p>Obrigado por escolher a FaroForma.</p>`,
            });
            emailConf = 'Sim';
        }
        catch { }
        row[sheetsSchema_1.A.EMAIL_CONF] = emailConf;
        await appendToSheet('Alunos', row);
        notifyN8n('aluno', d).catch(() => { });
        if (d.turma && d.program) {
            const turmaKey = d.turma.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            admin.firestore().collection('courses')
                .where('title.pt', '==', d.program).limit(1).get()
                .then(snapshot => {
                if (!snapshot.empty) {
                    const update = {};
                    update[`enrolledCounts.${turmaKey}`] = admin.firestore.FieldValue.increment(1);
                    return snapshot.docs[0].ref.update(update);
                }
            })
                .catch(() => { });
        }
        notifyAdmins(`[Aluno] Nova inscrição — ${d.fullName}`, `<h2>Nova inscrição de aluno</h2>
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
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`).catch(() => { });
        res.status(201).json({ message: 'Inscrição recebida com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao processar inscrição' });
    }
});
app.get('/api/admin/data', isAdmin, async (req, res) => {
    try {
        const [formadores, alunos, contactos] = await Promise.all([
            getSheetData('Formadores'), getSheetData('Alunos'), getSheetData('Contactos'),
        ]);
        res.json({ formadores, alunos, contactos });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter dados' });
    }
});
app.get('/api/admin/audit-log', isAdmin, async (req, res) => {
    try {
        const snap = await admin.firestore().collection('audit_log').orderBy('timestamp', 'desc').limit(50).get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter log' });
    }
});
app.post('/api/admin/sync-headers', isAdmin, async (req, res) => {
    const { sheets, spreadsheetId } = getSheetsClient();
    const tabs = [
        { name: 'Formadores', headers: ['Timestamp', 'Nome', 'Email', 'Telefone', 'DataNascimento', 'NIF', 'Areas', 'Habilitacoes', 'CAP_CCP', 'Experiencia', 'LinkedIn', 'Dias', 'Periodos', 'Modalidade', 'Motivacao', 'EmailConfirmacao'] },
        { name: 'Alunos', headers: ['Timestamp', 'Nome', 'Email', 'Telefone', 'Programa', 'Turma', 'DataInicio', 'PreferenciaContacto', 'Transporte', 'Notas', 'EmailConfirmacao'] },
        { name: 'Contactos', headers: ['Timestamp', 'Nome', 'Email', 'Telefone', 'Assunto', 'Mensagem'] },
    ];
    try {
        for (const tab of tabs) {
            await sheets.spreadsheets.values.update({ spreadsheetId, range: `${tab.name}!A1`, valueInputOption: 'RAW', requestBody: { values: [tab.headers] } });
        }
        res.json({ message: 'Headers actualizados' });
    }
    catch (err) {
        console.error('sync-headers error:', err);
        res.status(500).json({ error: 'Erro ao sincronizar cabeçalhos' });
    }
});
const ALLOWED_TABS = ['Formadores', 'Alunos', 'Contactos'];
app.post('/api/admin/update-row', isAdmin, async (req, res) => {
    const { tabName, rowIndex, values } = req.body;
    if (!tabName || rowIndex === undefined || !Array.isArray(values))
        return res.status(400).json({ error: 'Dados inválidos' });
    if (!ALLOWED_TABS.includes(tabName))
        return res.status(400).json({ error: 'Separador inválido' });
    try {
        await updateSheetRow(tabName, rowIndex, values);
        await createAuditLog(req, 'UPDATE_ROW', tabName, { rowIndex, label: values[1] });
        res.json({ message: 'Atualizado com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
});
app.delete('/api/admin/delete-row', isAdmin, async (req, res) => {
    const { tabName, rowIndex } = req.body;
    if (!tabName || rowIndex === undefined)
        return res.status(400).json({ error: 'Dados inválidos' });
    if (!ALLOWED_TABS.includes(tabName))
        return res.status(400).json({ error: 'Separador inválido' });
    try {
        await deleteSheetRow(tabName, rowIndex);
        await createAuditLog(req, 'DELETE_ROW', tabName, { rowIndex });
        res.json({ message: 'Eliminado com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao eliminar linha' });
    }
});
app.delete('/api/admin/bulk-delete', isAdmin, async (req, res) => {
    const { tabName, rowIndices } = req.body;
    if (!tabName || !Array.isArray(rowIndices) || rowIndices.length === 0)
        return res.status(400).json({ error: 'Dados inválidos' });
    if (!ALLOWED_TABS.includes(tabName))
        return res.status(400).json({ error: 'Separador inválido' });
    if (rowIndices.length > 100)
        return res.status(400).json({ error: 'Máximo de 100 registos por operação' });
    try {
        const sorted = [...rowIndices].sort((a, b) => b - a);
        for (const idx of sorted)
            await deleteSheetRow(tabName, idx);
        await createAuditLog(req, 'BULK_DELETE', tabName, { count: sorted.length, indices: sorted });
        res.json({ message: `${sorted.length} registos eliminados` });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao eliminar registos' });
    }
});
app.post('/api/admin/update-formador', isAdmin, async (req, res) => {
    const { rowIndex, values } = req.body;
    if (rowIndex === undefined || !Array.isArray(values))
        return res.status(400).json({ error: 'Dados inválidos' });
    try {
        await updateSheetRow('Formadores', rowIndex, values);
        await createAuditLog(req, 'UPDATE_FORMADOR', 'Formadores', { rowIndex, nome: values[sheetsSchema_1.F.NOME] });
        res.json({ message: 'Atualizado com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
});
app.get('/api/admin/config', isAdmin, async (req, res) => {
    try {
        const doc = await admin.firestore().collection('config').doc('siteMeta').get();
        res.json(doc.exists ? doc.data() : {});
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter configurações' });
    }
});
app.post('/api/admin/config', isAdmin, async (req, res) => {
    try {
        const data = await autoTranslate(req.body);
        await admin.firestore().collection('config').doc('siteMeta').set(data, { merge: true });
        await createAuditLog(req, 'UPDATE_CONFIG', 'config/siteMeta', data);
        res.json({ message: 'Configurações guardadas' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar' });
    }
});
const ALLOWED_ROOMS = ['sala1', 'sala2'];
app.get('/api/admin/agenda', isAdmin, async (req, res) => {
    const room = req.query.room || 'sala1';
    if (!ALLOWED_ROOMS.includes(room)) {
        res.status(400).json({ error: 'Sala inválida' });
        return;
    }
    try {
        const doc = await admin.firestore().collection('agenda').doc(room).get();
        res.json(doc.exists ? doc.data() : {});
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter agenda' });
    }
});
app.post('/api/admin/agenda', isAdmin, async (req, res) => {
    const room = req.query.room || 'sala1';
    if (!ALLOWED_ROOMS.includes(room)) {
        res.status(400).json({ error: 'Sala inválida' });
        return;
    }
    try {
        await admin.firestore().collection('agenda').doc(room).set(req.body);
        await createAuditLog(req, 'UPDATE_AGENDA', `agenda/${room}`, { slots: Object.keys(req.body).length });
        res.json({ message: 'Agenda atualizada' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao salvar' });
    }
});
app.get('/api/courses', async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('courses').get();
        const courses = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(c => c.published !== false)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        res.json(courses);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter cursos' });
    }
});
app.get('/api/admin/courses', isAdmin, async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('courses').get();
        const courses = snapshot.docs
            .map(doc => {
            const { id: _id, ...data } = doc.data();
            void _id;
            return { id: doc.id, ...data };
        })
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        res.json(courses);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter cursos' });
    }
});
app.post('/api/admin/courses/retranslate', isAdmin, async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('courses').get();
        const results = [];
        for (const doc of snapshot.docs) {
            const { id: _id, ...raw } = doc.data();
            void _id;
            const translated = await autoTranslate(raw);
            await doc.ref.set(translated);
            results.push(doc.id);
        }
        res.json({ ok: true, updated: results.length });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao traduzir cursos' });
    }
});
app.post('/api/admin/courses', isAdmin, async (req, res) => {
    const { id, ...raw } = req.body;
    try {
        const data = await autoTranslate(raw);
        const col = admin.firestore().collection('courses');
        if (typeof id === 'string' && id.trim() !== '') {
            await col.doc(id).set(data);
            await createAuditLog(req, 'UPDATE_COURSE', `courses/${id}`, { title: data.title?.pt });
        }
        else {
            const ref = await col.add(data);
            await createAuditLog(req, 'CREATE_COURSE', `courses/${ref.id}`, { title: data.title?.pt });
        }
        res.json({ message: 'Curso guardado com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar curso' });
    }
});
app.patch('/api/admin/courses/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const allowed = ['published', 'order'];
    const update = {};
    for (const key of allowed) {
        if (key in req.body)
            update[key] = req.body[key];
    }
    if (Object.keys(update).length === 0)
        return res.status(400).json({ error: 'Nenhum campo válido' });
    try {
        await admin.firestore().collection('courses').doc(id).update(update);
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar curso' });
    }
});
app.delete('/api/admin/courses/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await admin.firestore().collection('courses').doc(id).delete();
        await createAuditLog(req, 'DELETE_COURSE', `courses/${id}`);
        res.json({ message: 'Curso removido com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao remover curso' });
    }
});
app.get('/api/admin/notif-state', isAdmin, async (req, res) => {
    const uid = req.user.uid;
    try {
        const doc = await admin.firestore().collection('notifState').doc(uid).get();
        res.json(doc.exists ? doc.data() : { lastViewedAt: null, lastSeen: {} });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter estado de notificações' });
    }
});
app.post('/api/admin/notif-state', isAdmin, async (req, res) => {
    const uid = req.user.uid;
    const { lastViewedAt, lastSeen } = req.body;
    try {
        const update = {};
        if (typeof lastViewedAt === 'string')
            update.lastViewedAt = lastViewedAt;
        if (lastSeen && typeof lastSeen === 'object')
            update.lastSeen = lastSeen;
        if (Object.keys(update).length === 0) {
            res.status(400).json({ error: 'Nada para guardar' });
            return;
        }
        await admin.firestore().collection('notifState').doc(uid).set(update, { merge: true });
        res.json({ message: 'Estado guardado' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar estado de notificações' });
    }
});
app.get('/api/admin/admins', isAdmin, async (req, res) => {
    try {
        const doc = await admin.firestore().collection('config').doc('admins').get();
        const emails = (doc.exists ? doc.data()?.emails : null) ?? [];
        res.json({ emails });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter administradores' });
    }
});
app.post('/api/admin/admins', isAdmin, async (req, res) => {
    const { emails } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!Array.isArray(emails) || emails.some(e => typeof e !== 'string' || !emailRegex.test(e))) {
        return res.status(400).json({ error: 'Emails inválidos' });
    }
    try {
        await admin.firestore().collection('config').doc('admins').set({ emails });
        adminEmailsCache = { emails, ts: Date.now() };
        res.json({ message: 'Administradores guardados' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar administradores' });
    }
});
app.post('/api/track-visit', publicLimiter, async (req, res) => {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const hourKey = now.getHours().toString();
    const ts = now.toISOString();
    const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const ipHash = crypto_1.default.createHash('sha256').update(rawIp).digest('hex').slice(0, 12);
    const parts = rawIp.split('.');
    const maskedIp = parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.x` : rawIp.slice(0, 8) + '…';
    try {
        const docRef = admin.firestore().collection('analytics').doc(dateKey);
        await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(docRef);
            const entry = { ts, ip: maskedIp };
            if (!doc.exists) {
                t.set(docRef, { total: 1, unique: 1, hourly: { [hourKey]: 1 }, log: [entry], ipHashes: [ipHash] });
            }
            else {
                const data = doc.data() || {};
                const newTotal = (data.total || 0) + 1;
                const newHourly = { ...data.hourly };
                newHourly[hourKey] = (newHourly[hourKey] || 0) + 1;
                const log = data.log || [];
                const newLog = [...log, entry].slice(-200);
                const ipHashes = data.ipHashes || [];
                const isNew = !ipHashes.includes(ipHash);
                const newHashes = isNew ? [...ipHashes, ipHash].slice(-500) : ipHashes;
                const newUnique = isNew ? (data.unique || 0) + 1 : (data.unique || 0);
                t.update(docRef, { total: newTotal, unique: newUnique, hourly: newHourly, log: newLog, ipHashes: newHashes });
            }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao registar visita' });
    }
});
app.get('/api/admin/analytics', isAdmin, async (req, res) => {
    const dateKey = new Date().toISOString().split('T')[0];
    try {
        const doc = await admin.firestore().collection('analytics').doc(dateKey).get();
        if (!doc.exists) {
            res.json({ total: 0, unique: 0, hourly: {} });
            return;
        }
        const { ipHashes: _stripped, ...safe } = doc.data();
        res.json(safe);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter analytics' });
    }
});
const CMS_SECTIONS = ['hero', 'about', 'services', 'tutoring'];
app.get('/api/cms/:section', async (req, res) => {
    const section = req.params.section;
    if (!CMS_SECTIONS.includes(section)) {
        res.status(400).json({ error: 'Secção inválida' });
        return;
    }
    try {
        const doc = await admin.firestore().collection('cms').doc(section).get();
        res.json(doc.exists ? doc.data() : {});
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter secção CMS' });
    }
});
app.post('/api/cms/:section', isAdmin, async (req, res) => {
    const section = req.params.section;
    if (!CMS_SECTIONS.includes(section)) {
        res.status(400).json({ error: 'Secção inválida' });
        return;
    }
    try {
        const data = await autoTranslate(req.body);
        await admin.firestore().collection('cms').doc(section).set(data, { merge: true });
        await createAuditLog(req, 'UPDATE_CMS', `cms/${section}`);
        res.json({ message: 'Secção atualizada com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar secção CMS' });
    }
});
app.get('/health', (req, res) => res.send('OK'));
exports.api = (0, https_1.onRequest)({
    region: "europe-west1",
    memory: "256MiB",
    secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, SPREADSHEET_ID, GMAIL_USER, GMAIL_APP_PASSWORD, N8N_WEBHOOK_URL, GEMINI_API_KEY, WA_TOKEN, WA_PHONE_NUMBER_ID]
}, app);
//# sourceMappingURL=index.js.map