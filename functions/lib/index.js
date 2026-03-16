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
admin.initializeApp();
const GOOGLE_SERVICE_ACCOUNT_JSON = (0, params_1.defineSecret)("GOOGLE_SERVICE_ACCOUNT_JSON");
const SPREADSHEET_ID = (0, params_1.defineSecret)("SPREADSHEET_ID");
const GMAIL_USER = (0, params_1.defineSecret)("GMAIL_USER");
const GMAIL_APP_PASSWORD = (0, params_1.defineSecret)("GMAIL_APP_PASSWORD");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
const publicLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados pedidos. Tente novamente mais tarde.' },
});
let adminEmailsCache = null;
const ADMIN_CACHE_TTL = 5 * 60 * 1000;
async function getAdminEmails() {
    if (adminEmailsCache && Date.now() - adminEmailsCache.ts < ADMIN_CACHE_TTL) {
        return adminEmailsCache.emails;
    }
    try {
        const doc = await admin.firestore().collection('config').doc('admins').get();
        const emails = (doc.exists ? doc.data()?.emails : null) ?? [];
        adminEmailsCache = { emails, ts: Date.now() };
        return emails;
    }
    catch {
        return adminEmailsCache?.emails ?? [];
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
    catch (error) {
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
        await appendToSheet('Formadores', [
            timestamp, d.nome, d.email, d.telefone, d.dataNascimento, d.nif,
            d.areas.join(', '), d.habilitacoes, d.capCcp, d.experiencia, d.linkedin,
            d.dias.join(', '), d.periodos.join(', '), d.modalidade, d.motivacao,
        ]);
        await sendMail({
            to: d.email,
            subject: 'FaroForma — Candidatura recebida',
            html: `<p>Olá <strong>${escHtml(d.nome)}</strong>,</p><p>Recebemos a sua candidatura como formador. Analisaremos o seu perfil e entraremos em contacto brevemente.</p><p>Obrigado pelo interesse em fazer parte da equipa FaroForma.</p>`,
        }).catch(() => { });
        await notifyAdmins(`[Formador] Nova candidatura — ${d.nome}`, `<h2>Nova candidatura de formador</h2>
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
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`);
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
        await appendToSheet('Contactos', [new Date().toISOString(), d.name, d.email, d.phone, d.subject, d.message]);
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
        await appendToSheet('Alunos', [new Date().toISOString(), d.fullName, d.email, d.phone, d.program, d.turma, d.startDate, d.contactPreference, transportLabel, d.notes]);
        await sendMail({
            to: d.email,
            subject: 'FaroForma — Inscrição recebida',
            html: `<p>Olá <strong>${escHtml(d.fullName)}</strong>,</p><p>Recebemos a sua inscrição para <strong>${escHtml(d.program)}</strong>${d.turma ? ` (${escHtml(d.turma)})` : ''}. Entraremos em contacto brevemente através do seu meio de contacto preferido.</p>${d.needsTransport ? `<p>Confirmamos que solicitou transporte com taxa adicional de <strong>2,50 € por viagem/dia</strong>.</p>` : ''}<p>Obrigado por escolher a FaroForma.</p>`,
        }).catch(() => { });
        await notifyAdmins(`[Aluno] Nova inscrição — ${d.fullName}`, `<h2>Nova inscrição de aluno</h2>
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
      <p><a href="https://faroforma.pt/admin">Aceder ao Backoffice</a></p>`);
        res.status(201).json({ message: 'Inscrição recebida com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao processar inscrição' });
    }
});
app.get('/api/admin/diag', isAdmin, async (req, res) => {
    try {
        const { sheets, spreadsheetId } = getSheetsClient();
        const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'spreadsheetId,properties/title,sheets/properties/title' });
        res.json({
            spreadsheetId,
            title: meta.data.properties?.title,
            tabs: meta.data.sheets?.map(s => s.properties?.title),
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
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
app.post('/api/admin/update-row', isAdmin, async (req, res) => {
    const { tabName, rowIndex, values } = req.body;
    if (!tabName || rowIndex === undefined || !Array.isArray(values))
        return res.status(400).json({ error: 'Dados inválidos' });
    try {
        await updateSheetRow(tabName, rowIndex, values);
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
    try {
        await deleteSheetRow(tabName, rowIndex);
        res.json({ message: 'Eliminado com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao eliminar linha' });
    }
});
app.post('/api/admin/update-formador', isAdmin, async (req, res) => {
    const { rowIndex, values } = req.body;
    if (rowIndex === undefined || !Array.isArray(values))
        return res.status(400).json({ error: 'Dados inválidos' });
    try {
        await updateSheetRow('Formadores', rowIndex, values);
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
        await admin.firestore().collection('config').doc('siteMeta').set(req.body, { merge: true });
        res.json({ message: 'Configurações guardadas' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar' });
    }
});
app.get('/api/admin/agenda', isAdmin, async (req, res) => {
    const room = req.query.room || 'sala1';
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
    try {
        await admin.firestore().collection('agenda').doc(room).set(req.body);
        res.json({ message: 'Agenda atualizada' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao salvar' });
    }
});
app.get('/api/courses', async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('courses').orderBy('title').get();
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(courses);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter cursos' });
    }
});
app.get('/api/admin/courses', isAdmin, async (req, res) => {
    try {
        const snapshot = await admin.firestore().collection('courses').orderBy('title').get();
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(courses);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter cursos' });
    }
});
app.post('/api/admin/courses', isAdmin, async (req, res) => {
    const { id, ...data } = req.body;
    try {
        if (id) {
            await admin.firestore().collection('courses').doc(id).set(data, { merge: true });
        }
        else {
            await admin.firestore().collection('courses').add(data);
        }
        res.json({ message: 'Curso guardado com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao guardar curso' });
    }
});
app.delete('/api/admin/courses/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await admin.firestore().collection('courses').doc(id).delete();
        res.json({ message: 'Curso removido com sucesso' });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao remover curso' });
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
    if (!Array.isArray(emails) || emails.some(e => typeof e !== 'string')) {
        return res.status(400).json({ error: 'Dados inválidos' });
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
app.post('/api/track-visit', async (req, res) => {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const hourKey = now.getHours().toString();
    try {
        const docRef = admin.firestore().collection('analytics').doc(dateKey);
        await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(docRef);
            if (!doc.exists) {
                t.set(docRef, { total: 1, hourly: { [hourKey]: 1 } });
            }
            else {
                const data = doc.data() || {};
                const newTotal = (data.total || 0) + 1;
                const newHourly = { ...data.hourly };
                newHourly[hourKey] = (newHourly[hourKey] || 0) + 1;
                t.update(docRef, { total: newTotal, hourly: newHourly });
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
        res.json(doc.exists ? doc.data() : { total: 0, hourly: {} });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao obter analytics' });
    }
});
app.get('/api/cms/:section', async (req, res) => {
    const section = req.params.section;
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
    try {
        await admin.firestore().collection('cms').doc(section).set(req.body, { merge: true });
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
    secrets: [GOOGLE_SERVICE_ACCOUNT_JSON, SPREADSHEET_ID, GMAIL_USER, GMAIL_APP_PASSWORD]
}, app);
//# sourceMappingURL=index.js.map