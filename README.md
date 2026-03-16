# FaroForma — Plataforma de Gestão Educativa

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-24.x-green.svg)
![React](https://img.shields.io/badge/react-19.x-blue.svg)
![Firebase](https://img.shields.io/badge/firebase-12.x-orange.svg)

> **FaroForma** é uma plataforma moderna para gestão de um centro de formação em Faro, integrando um site público de alta performance com um backoffice administrativo robusto ("Command Center").

---

## 🚀 Funcionalidades Principais

### 🌐 Frontend Público (SPA)
*   **Design Responsivo:** Interface moderna construída com React 19, Framer Motion e Lucide Icons.
*   **Multilanguage (i18n):** Suporte nativo para Português e Inglês em todas as páginas.
*   **Conteúdo Dinâmico:** Secções Hero, Sobre, Serviços e Explicações geridas via CMS.
*   **Inscrições Online:** Formulários de inscrição para alunos e formadores com validação em tempo real.
*   **SEO Local:** Otimizado para "Formação em Faro" com meta-tags dinâmicas e JSON-LD.

### 🎛️ Backoffice (Command Center)
*   **Dashboard Visual:** Métricas em tempo real, gráficos de crescimento (Recharts) e feed de atividade recente.
*   **CMS No-Code:** Editor completo para alterar textos, listas e imagens do site sem tocar em código.
*   **Gestão de Agenda:** Interface visual (drag-and-drop style) para gestão de ocupação de múltiplas salas.
*   **Media Manager:** Upload de imagens integrado com Firebase Storage.
*   **Base de Dados Híbrida:** Sincronização bidirecional entre Firestore (Configurações/CMS) e Google Sheets (Dados de Inscrições).
*   **Analytics Nativo:** Monitorização de tráfego e distribuição horária de visitantes.

---

## 🛠️ Arquitetura Técnica

O projeto segue uma arquitetura **Serverless** moderna, alojada no Google Cloud Platform via Firebase.

### Stack Tecnológico
*   **Frontend:** Vite, React 19, TypeScript, Framer Motion, React Hot Toast.
*   **Backend:** Firebase Functions (Node.js 24), Express.js.
*   **Database:** 
    *   **Firestore:** Metadados, CMS, Analytics, Configurações.
    *   **Google Sheets:** "Database" principal para registos de alunos e formadores (facilita a gestão administrativa).
*   **Storage:** Firebase Storage (Imagens e Documentos).
*   **Auth:** Firebase Auth (Google Sign-In) restrito a administradores.

### Estrutura do Projeto
```bash
/
├── functions/          # Backend (Cloud Functions)
│   ├── src/
│   │   ├── index.ts    # API Entrypoint (Express)
│   │   └── ...
├── src/                # Frontend (React)
│   ├── components/
│   │   ├── admin/      # Componentes do Backoffice (CMS, Agenda, Tables)
│   │   ├── sections/   # Secções do Site Público
│   │   └── ui/         # Componentes Genéricos
│   ├── config/         # Configuração Firebase
│   ├── context/        # Contexto Global (Idioma)
│   ├── data/           # Fallback Data (Dados estáticos de segurança)
│   ├── pages/          # Rotas Principais (Admin, Home)
│   └── services/       # API Client Centralizado
└── ...
```

---

## 📦 Instalação e Desenvolvimento

### Pré-requisitos
*   Node.js 24+
*   Conta Firebase com projeto criado (Plano Blaze necessário para Functions).
*   Google Service Account (JSON) para acesso às Sheets API.

### 1. Clonar o Repositório
```bash
git clone https://github.com/DrNOFX97/FaroForma.git
cd FaroForma
```

### 2. Configurar Variáveis de Ambiente
Crie um ficheiro `.env` na raiz com as chaves do Firebase:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Instalar Dependências
```bash
# Frontend
npm install

# Backend
cd functions && npm install && cd ..
```

### 4. Executar Localmente
```bash
npm run dev
```

---

## 🚀 Deploy (Produção)

O projeto utiliza Firebase Hosting e Cloud Functions. O comando de deploy compila ambos os ambientes.

```bash
npm run build && cd functions && npm run build && cd .. && firebase deploy --project faroformapt
```

---

## 🛡️ Segurança

*   **RBAC:** Acesso ao `/admin` protegido por verificação de email (whitelist) no backend.
*   **Firestore Rules:** Regras estritas para leitura pública (apenas CMS) e escrita restrita (apenas Admin).
*   **Validação:** Zod schemas no backend para validar todos os inputs de formulários.

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - consulte o ficheiro [LICENSE.md](LICENSE.md) para mais detalhes.

---

<p align="center">
  Desenvolvido com ❤️ para <strong>FaroForma</strong>.
</p>
