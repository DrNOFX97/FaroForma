import { auth } from '../config/firebase';

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

  // Admin
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
  }
};
