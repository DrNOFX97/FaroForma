import { auth, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type {
  RawData,
  Course,
  SiteConfig,
  AgendaData,
  AnalyticsData,
  AuditLogEntry,
  ContactSubmission,
  StudentSubmission,
  FormadorSubmission,
} from '../types/api';

export type { RawData } from '../types/api';

const API_BASE = '/api';

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export const apiService = {
  // Public
  async getCourses(): Promise<Course[]> {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error('Falha ao obter cursos');
    return res.json();
  },

  async submitStudent(data: StudentSubmission): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao enviar inscrição');
    return res.json();
  },

  async submitContact(data: ContactSubmission): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao enviar contacto');
    return res.json();
  },

  async submitFormador(data: FormadorSubmission): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/inscricao-formadores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao enviar inscrição de formador');
    return res.json();
  },

  async trackVisit(): Promise<void> {
    try {
      await fetch(`${API_BASE}/track-visit`, { method: 'POST' });
    } catch { /* silent fail */ }
  },

  // Admin
  async getNotifState(): Promise<{ lastViewedAt: string | null; lastSeen: Record<string, number> }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/notif-state`, { headers });
    if (!res.ok) return { lastViewedAt: null, lastSeen: {} };
    return res.json();
  },

  async saveNotifState(payload: { lastViewedAt?: string; lastSeen?: Record<string, number> }): Promise<void> {
    const headers = await getAuthHeaders();
    fetch(`${API_BASE}/admin/notif-state`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }).catch(() => {}); // fire-and-forget, non-blocking
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
    if (!res.ok) throw new Error('Erro ao obter analytics');
    return res.json();
  },

  async getCMS(section: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/cms/${section}`);
    if (!res.ok) throw new Error('Erro ao obter conteúdo');
    return res.json();
  },

  async updateCMS(section: string, data: Record<string, unknown>): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/cms/${section}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao guardar conteúdo');
    return res.json();
  },

  async uploadFile(path: string, file: File): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  async getAdminData(): Promise<RawData> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/data`, { headers });
    if (res.status === 403) throw new Error('ACCESS_DENIED');
    if (!res.ok) throw new Error('Erro ao obter dados');
    return res.json();
  },

  async updateFormador(rowIndex: number, values: unknown[]): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/update-formador`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rowIndex, values })
    });
    if (!res.ok) throw new Error('Erro ao atualizar formador');
    return res.json();
  },

  async updateRow(tabName: string, rowIndex: number, values: unknown[]): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/update-row`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tabName, rowIndex, values })
    });
    if (!res.ok) throw new Error('Erro ao atualizar registo');
    return res.json();
  },

  async deleteRow(tabName: string, rowIndex: number): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/delete-row`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ tabName, rowIndex })
    });
    if (!res.ok) throw new Error('Erro ao eliminar registo');
    return res.json();
  },

  async getConfig(): Promise<SiteConfig> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/config`, { headers });
    if (!res.ok) throw new Error('Erro ao obter configurações');
    return res.json();
  },

  async saveConfig(config: SiteConfig): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/config`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Erro ao guardar configurações');
    return res.json();
  },

  async getAgenda(room: string): Promise<AgendaData> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/agenda?room=${room}`, { headers });
    if (!res.ok) throw new Error('Erro ao obter agenda');
    return res.json();
  },

  async saveAgenda(room: string, agenda: AgendaData): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/agenda?room=${room}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(agenda)
    });
    if (!res.ok) throw new Error('Erro ao salvar agenda');
    return res.json();
  },

  async getAdminCourses(): Promise<Course[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses`, { headers });
    if (!res.ok) throw new Error('Erro ao obter cursos');
    return res.json();
  },

  async saveCourse(course: Course): Promise<{ ok: boolean; id?: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(course)
    });
    if (!res.ok) throw new Error('Erro ao guardar curso');
    return res.json();
  },

  async patchCourse(id: string, fields: Partial<Course>): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error('Erro ao atualizar curso');
    return res.json();
  },

  async retranslateCourses(): Promise<{ ok: boolean; updated: number }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses/retranslate`, { method: 'POST', headers });
    if (!res.ok) throw new Error('Erro ao traduzir cursos');
    return res.json();
  },

  async deleteCourse(id: string): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Erro ao remover curso');
    return res.json();
  },

  async getAdmins(): Promise<string[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/admins`, { headers });
    if (!res.ok) throw new Error('Erro ao obter administradores');
    const data = await res.json() as { emails: string[] };
    return data.emails;
  },

  async saveAdmins(emails: string[]): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/admins`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ emails })
    });
    if (!res.ok) throw new Error('Erro ao guardar administradores');
    return res.json();
  },

  async getAuditLog(): Promise<AuditLogEntry[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/audit-log`, { headers });
    if (!res.ok) throw new Error('Erro ao obter log');
    return res.json();
  },

  async bulkDelete(tabName: string, rowIndices: number[]): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/bulk-delete`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ tabName, rowIndices })
    });
    if (!res.ok) throw new Error('Erro ao eliminar registos');
    return res.json();
  },

  async syncHeaders(): Promise<{ ok: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/sync-headers`, { method: 'POST', headers });
    if (!res.ok) throw new Error('Erro ao sincronizar headers');
    return res.json();
  }
};
