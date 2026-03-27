// ── Shared i18n ───────────────────────────────────────────────────────────────

export type I18nString = { pt: string; en: string };

// ── Courses ───────────────────────────────────────────────────────────────────

export interface CourseScheduleEntry {
  id?: string;
  turma: I18nString;
  período: I18nString;
  horário: string;
  dias: I18nString;
  vagas?: number;
  inscritos?: number;
}

export interface CourseHighlightEntry {
  icon: string;
  text: I18nString;
}

export interface Course {
  id?: string;
  title: I18nString;
  subtitle: I18nString;
  status: I18nString;
  description: I18nString;
  highlights: CourseHighlightEntry[];
  schedule: CourseScheduleEntry[];
  published?: boolean;
  order?: number;
}

// ── Site config ───────────────────────────────────────────────────────────────

export interface SiteConfig {
  title: string;
  description: string;
  keywords?: string;
  contactEmail?: string;
  gbpDescription?: string;
  gbpCategories?: string;
  gbpAttributes?: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  total: number;
  unique?: number;
  hourly?: Record<string, number>;
  log?: string[];
}

// ── Agenda ────────────────────────────────────────────────────────────────────

export interface AgendaBooking {
  name: string;
  course?: string;
  formador?: string;
}

/** Keyed by `"${day}-${slot}"` strings. */
export type AgendaData = Record<string, AgendaBooking | null>;

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id?: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
  tab?: string;
}

// ── Form submissions ──────────────────────────────────────────────────────────

export interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface StudentSubmission {
  fullName: string;
  email: string;
  phone?: string;
  program: string;
  turma?: string;
  startDate?: string;
  contactPreference?: string;
  needsTransport?: boolean;
  notes?: string;
}

export interface FormadorSubmission {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento?: string;
  nif?: string;
  areas: string[];
  habilitacoes: string;
  capCcp: string;
  experiencia: string;
  linkedin?: string;
  dias: string[];
  periodos: string[];
  modalidade: string;
  motivacao: string;
  termos?: boolean;
}

// ── Raw Sheets data ───────────────────────────────────────────────────────────

/** Each tab is a 2D array: first row is headers, rest are data rows. */
export interface RawData {
  formadores: string[][];
  alunos: string[][];
  contactos: string[][];
}
