import { auth, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const API_BASE = '/api';

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export interface RawData {
  formadores: any[][];
  alunos: any[];
  contactos: any[];
}

export const apiService = {
  // Public
  async getCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error('Falha ao obter cursos');
    return res.json();
  },

  async submitStudent(data: any) {
    const res = await fetch(`${API_BASE}/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao enviar inscrição');
    return res.json();
  },

  async submitContact(data: any) {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao enviar contacto');
    return res.json();
  },

  async submitFormador(data: any) {
    const res = await fetch(`${API_BASE}/inscricao-formadores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Falha ao enviar inscrição de formador');
    return res.json();
  },

  async trackVisit() {
    try {
      await fetch(`${API_BASE}/track-visit`, { method: 'POST' });
    } catch (e) { /* silent fail */ }
  },

  // Admin
  async getAnalytics() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
    if (!res.ok) throw new Error('Erro ao obter analytics');
    return res.json();
  },

  async getCMS(section: string) {
    const res = await fetch(`${API_BASE}/cms/${section}`);
    if (!res.ok) throw new Error('Erro ao obter conteúdo');
    return res.json();
  },

  async updateCMS(section: string, data: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/cms/${section}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao guardar conteúdo');
    return res.json();
  },

  async uploadFile(path: string, file: File) {
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

  async updateFormador(rowIndex: number, values: any[]) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/update-formador`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rowIndex, values })
    });
    if (!res.ok) throw new Error('Erro ao atualizar formador');
    return res.json();
  },

  async updateRow(tabName: string, rowIndex: number, values: any[]) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/update-row`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tabName, rowIndex, values })
    });
    if (!res.ok) throw new Error('Erro ao atualizar registo');
    return res.json();
  },

  async deleteRow(tabName: string, rowIndex: number) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/delete-row`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ tabName, rowIndex })
    });
    if (!res.ok) throw new Error('Erro ao eliminar registo');
    return res.json();
  },

  async getConfig() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/config`, { headers });
    if (!res.ok) throw new Error('Erro ao obter configurações');
    return res.json();
  },

  async saveConfig(config: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/config`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Erro ao guardar configurações');
    return res.json();
  },

  async getAgenda(room: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/agenda?room=${room}`, { headers });
    if (!res.ok) throw new Error('Erro ao obter agenda');
    return res.json();
  },

  async saveAgenda(room: string, agenda: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/agenda?room=${room}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(agenda)
    });
    if (!res.ok) throw new Error('Erro ao salvar agenda');
    return res.json();
  },

  async getAdminCourses() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses`, { headers });
    if (!res.ok) throw new Error('Erro ao obter cursos');
    return res.json();
  },

  async saveCourse(course: any) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/courses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(course)
    });
    if (!res.ok) throw new Error('Erro ao guardar curso');
    return res.json();
  },

  async deleteCourse(id: string) {
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
    const data = await res.json();
    return data.emails;
  },

  async saveAdmins(emails: string[]) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/admins`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ emails })
    });
    if (!res.ok) throw new Error('Erro ao guardar administradores');
    return res.json();
  },

  async getAuditLog() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/audit-log`, { headers });
    if (!res.ok) throw new Error('Erro ao obter log');
    return res.json();
  },

  async bulkDelete(tabName: string, rowIndices: number[]) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/bulk-delete`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ tabName, rowIndices })
    });
    if (!res.ok) throw new Error('Erro ao eliminar registos');
    return res.json();
  },

  async syncHeaders() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/admin/sync-headers`, { method: 'POST', headers });
    if (!res.ok) throw new Error('Erro ao sincronizar headers');
    return res.json();
  }
};
