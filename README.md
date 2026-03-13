# FaroForma — Centro de Formação e Explicações

A **FaroForma** é uma plataforma moderna e integrada para a gestão de inscrições de formadores, alunos e serviços administrativos. O projeto combina uma interface de utilizador (UI) de alta performance com um sistema de backoffice robusto, automatizando a sincronização de dados com o ecossistema Google Workspace.

---

## 🚀 Funcionalidades Principais

### Website Público
*   **Landing Page Dinâmica:** Seções otimizadas para conversão (Hero, Serviços, Explicações).
*   **Gestão de Imagens:** Carrosséis automáticos com transições suaves (intervalos de 7s).
*   **Formulários Inteligentes:** Inscrição de Alunos, Candidaturas de Formadores e Contactos com validação em tempo real.
*   **SEO Dinâmico:** Meta tags controladas remotamente via Backoffice.

### Backoffice (Área Administrativa)
*   **Acesso Restrito:** Autenticação via Google Login restrita ao administrador oficial.
*   **Dashboard de Controlo:** Resumo estatístico de todas as entradas no sistema.
*   **Gestão de Inscrições:** Visualização em tempo real e edição manual de candidaturas diretamente na base de dados.
*   **Agenda Sala 1:** Mapa de ocupação semanal (Segunda a Sábado) com seleção inteligente de formadores e cursos.
*   **Exportação Documental:** Geração de PDFs e impressão formatada do mapa de ocupação.
*   **Configurações de Site:** Edição de títulos, descrições e contactos sem necessidade de novo deploy.

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework:** [React 19](https://react.dev/) com **TypeScript**.
- **Build Tool:** [Vite](https://vitejs.dev/).
- **Animações:** [Framer Motion](https://www.framer.com/motion/).
- **Ícones:** [Lucide React](https://lucide.dev/).
- **Routing:** React Router 7.

### Backend & Infraestrutura
- **Runtime:** [Node.js 22](https://nodejs.org/).
- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting).
- **Serverless:** [Firebase Functions (2nd Gen)](https://firebase.google.com/docs/functions) baseadas em Cloud Run.
- **Base de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore) para estado da app e [Google Sheets](https://www.google.com/sheets/about/) para registos permanentes.
- **Segurança:** [Google Secret Manager](https://cloud.google.com/secret-manager).
- **Email:** Nodemailer com Gmail SMTP.

---

## 💻 Configuração e Desenvolvimento

### Pré-requisitos
*   Node.js v22 ou superior.
*   Firebase CLI instalado (`npm install -g firebase-tools`).
*   Arquivo `.env` configurado na raiz.

### Instalação Local
```bash
# Instalar dependências do frontend
npm install

# Instalar dependências das funções
cd functions && npm install && cd ..

# Iniciar servidor de desenvolvimento
npm run dev
```

### Build e Deploy
```bash
# Build de produção
npm run build
cd functions && npm run build && cd ..

# Enviar para produção (Firebase)
firebase deploy --project faroformapt
```

---

## 🔒 Configuração de Ambiente

O projeto utiliza **Secrets** para proteger dados sensíveis. Certifique-se de que os seguintes valores estão configurados no Secret Manager do Google Cloud:

1.  `GOOGLE_SERVICE_ACCOUNT_JSON`: Chave da conta de serviço para acesso ao Sheets/Firestore.
2.  `SPREADSHEET_ID`: ID da Google Sheet onde os dados são guardados.
3.  `GMAIL_USER`: Email de envio (`faroforma@gmail.com`).
4.  `GMAIL_APP_PASSWORD`: Senha de aplicação de 16 caracteres gerada no Google.

---

## 📐 Arquitetura de Dados

O sistema opera com um fluxo de **Sincronização Dupla**:
1.  **Google Sheets:** Atua como o repositório de longa duração e interface amigável para consulta externa.
2.  **Firestore:** Atua como a base de dados de alta velocidade para o Backoffice e configurações dinâmicas do site.

---

## 📄 Licença e Créditos

© 2026 **FaroForma**. Todos os direitos reservados.
Desenvolvido com foco em performance, segurança e automatização.
