# Relatório de Desenvolvimento: FaroForma
**Estado do Projeto:** Produção
**Data de Emissão:** 19 de Março de 2026

---

## 1. Resumo Executivo de Esforço

| Métrica | Valor |
| :--- | :--- |
| **Total de Horas Estimadas** | ~80 Horas |
| **Total de Commits** | 99 |
| **Sessões de Trabalho** | 18 sessões distintas |
| **Período de Atividade** | 9 dias (11–19 Mar 2026) |
| **Tempo de commit medido** | ~30h de atividade directa |
| **Linguagem Principal** | TypeScript (Frontend & Backend) |
| **Infraestrutura** | Firebase (Functions Gen2, Auth, Firestore, Hosting) |

> **Nota metodológica:** O tempo de 30h é medido pelos timestamps dos commits (períodos contínuos de commit < 2h = mesma sessão). As 80h totais incluem planeamento, debugging interactivo, análise de dados, testes manuais e comunicação — trabalho real que não gera commits.

---

## 2. Justificação Técnica por Bloco (65h)

### Bloco A — Infraestrutura e Backend (18h)
- Firebase Functions Gen2 (Node.js 24, europe-west1) com Express
- Google Sheets API via Service Account (Secret Manager)
- Sistema de email transacional: confirmações + notificações admin (Gmail SMTP / ImprovMX)
- Middleware `isAdmin` com verificação dinâmica de emails no Firestore (cache 5min)
- Rate limiting por IP (5 req/hora) nos endpoints públicos
- Gestão de segredos: 5 variáveis em Cloud Secret Manager (incluindo `GEMINI_API_KEY`)
- **Auto-tradução PT→EN via Gemini 1.5 Flash:** `autoTranslate()` percorre recursivamente objectos `{ pt, en }` e preenche o campo EN quando vazio — aplicado em `/api/admin/config`, `/api/admin/courses` e `/api/cms/:section`
- **Log de auditoria estruturado** (`createAuditLog`): regista email, nome, acção, alvo e detalhes em `Firestore audit_log` para todas as mutações admin

### Bloco B — Backoffice Completo (28h)
- **Dashboard:** Analytics em tempo real (Recharts), popup de visitantes com log horário e gráfico
- **Tabelas CRUD:** Alunos, Formadores, Contactos — pesquisa, edição inline, eliminação, exportação Excel (SheetJS)
- **Bulk delete** com checkboxes e confirmação; **paginação** 25 registos/página
- **Log de auditoria** de ações admin (Firestore `audit_log`) com utilizador, acção, alvo e detalhes
- **Email✓ status** por registo: confirmação capturada em coluna dedicada na Sheet
- **Agenda de Salas** (2 salas): agendamento semanal, exportação PDF profissional (jsPDF/html2canvas)
- **CMS Interno:** Hero, Sobre, Serviços, Explicações — edição PT/EN com preview ao vivo
- **Gestão de Cursos:** CRUD com horários por turma
- **SEO & Config:** `config/siteMeta` no Firestore, GBP description, metadados dinâmicos
- **Gestão de Admins:** lista de emails admin editável sem redeploy
- Sincronização automática com Sheets a cada 30 segundos
- Notificações em sino com contador de não lidos; pesquisa global no topbar

### Bloco C — Frontend Público (14h)
- React 19 + Vite + TypeScript SPA, Firebase Hosting com SPA fallback
- Internacionalização PT/EN UK completa (`LanguageProvider` + contexto)
- Framer Motion (animações, `MotionConfig reducedMotion="user"`)
- Formulários com validação Zod: registo de formador, aluno e contacto
- Responsividade mobile-first; glassmorphism; tema claro/escuro
- SEO técnico: JSON-LD LocalBusiness, OG completo, canonical, robots.txt, sitemap

### Bloco D — Qualidade, Segurança e Refinamentos (7h)
- Auditoria completa do admin (35 issues identificados e corrigidos em 3 rondas)
- Correcção de bug crítico: SPREADSHEET_ID errado no Secret Manager; recuperação de dados de versão anterior via Drive API
- Eliminação de `.reverse()` mutante; fix de stale closure em ConfigView
- Validação de tamanho em ImageUploader; bounce CSS em falta
- Non-blocking toast confirmations (substituição de `confirm()` em 4 componentes)
- Skeletons de loading; dirty-flag no CMS com confirmação non-blocking
- Rate limiting adicionado ao endpoint `track-visit`

### Bloco E — Turmas, UX Admin e Estabilização (13h)
- **Secção Turmas pública:** nova secção no frontend com tabela de turmas por sala, consumindo dados do Firestore `agenda/`
- **Admin Turmas:** modal de edição de slot de turma acessível por clique na linha da tabela
- **Crash crítico corrigido** (React error #31): campo `diasExtra` no Firestore com objecto aninhado `{pt:{pt:"",en:""},en:""}` causava renderização de objecto como filho React — função `t()` em `Courses.tsx` refactorizada com guarda `typeof val !== 'string'`
- **Regras Firestore:** `config/siteMeta` passou de `allow read: if false` para `allow read: if true`; corrige erro "Missing or insufficient permissions" ao carregar metadados dinâmicos do site
- **Emails admin:** 3 emails registados em `config/admins` no Firestore (henrasgo@, custodio.guerreiro@, f.nuno.ss@) — sem redeploy necessário
- **TableView refactorizado:** coluna "Ações" removida; fluxo de edição/eliminação unificado via `DetailModal` em todas as tabelas (Alunos, Contactos, Formadores)
- **Prop `columnWidths`** adicionada a `TableView` para controlo granular de larguras de coluna
- **Checkboxes:** correcção de `text-overflow: ellipsis` em coluna de 3% que mostrava "..." junto ao checkbox — resolvido com `textOverflow: 'clip', overflow: 'visible'`
- **Cabeçalhos de tabela:** "NomeCompleto" → "Nome" (Alunos), "Tel" → "Telemóvel" (Formadores)
- **Sidebar admin reordenada:** "Editor de Páginas" movido para grupo "Configurações" (após "SEO & Definições")
- **Log de auditoria legível:** campo `entry.ts` corrigido para `entry.timestamp`; `entry.email` para `entry.userEmail`; mapa de labels expandido com variantes uppercase (DELETE_ROW, UPDATE_AGENDA, etc.); tempo relativo (agora / há Xm / há Xh)
- **TurmasView:** filtragem de valores legados — `horario` e `dias` validados contra conjuntos `PERIOD_SLOTS` e `WEEKDAYS`
- **Cards de cursos:** dimensões reduzidas no frontend público (padding, gap, border-radius, font-size)
- **Tipografia:** migração de Figtree → Cabinet Grotesk (títulos) + Satoshi (corpo) via Fontshare CDN

---

## 3. Resumo por Dia

| Dia | Commits | Principais Entregas |
| :--- | :---: | :--- |
| Seg 11 Mar | 2 | Setup inicial, estrutura de projeto |
| Ter 12 Mar | 12 | Hero, About, Serviços, Cursos, Explicações, i18n, Firebase Hosting |
| Qua 13 Mar | 20 | Formulários, Sheets API, emails, agenda, backoffice inicial |
| Qui 14 Mar | 9 | Cursos dinâmicos, agenda multi-sala, cleanup, segurança |
| Sex 15 Mar | 9 | Modularização admin, CMS, acessibilidade, email dinâmico |
| Sáb 16 Mar | 29 | Dashboard visual, analytics, CMS avançado, auditoria, 8 bug fixes |
| Dom 17 Mar | 18 | Audit log, bulk delete, paginação; auto-tradução Gemini; Turmas admin/público; tipografia; click-to-edit tables |
| Seg 18 Mar | — | Sessão de debugging e estabilização (sem commits) |
| Ter 19 Mar | — | Fix React error #31; regras Firestore; emails admin; refinamentos UX admin; tipografia final |
| **Total** | **99** | |

---

## 4. Log Completo de Commits (Git)

```
2026-03-17  style: switch to Cabinet Grotesk (heading) + Satoshi (body) via Fontshare
2026-03-17  style: switch fonts to Figtree (heading + body)
2026-03-17  feat(turmas): click row to open slot edit modal
2026-03-17  feat: add Turmas section (admin + public) and fix Courses display
2026-03-17  fix: resolve no-use-before-define error in Courses component
2026-03-17  feat: display course name in registration modal
2026-03-17  chore: revert hardcoded PLA course highlights
2026-03-17  feat: update PLA course highlights and improve analytics with unique visitor tracking
2026-03-17  feat: implement unread status tracking for dashboard cards and refactor course editor
2026-03-17  feat(admin): click row to open detail modal in all tables
2026-03-17  fix(admin): format phone/NIF/experience (strip .0) and birth date in detail modal
2026-03-17  fix(admin): detail modal shows correct fields per record type
2026-03-17  fix: resolution of build and TypeScript errors for deployment
2026-03-17  feat: auto-translation with Gemini AI, admin audit logs, and course editor redesign
2026-03-17  feat(admin): audit log, bulk delete, pagination, email status tracking
2026-03-17  fix: resolve UX bugs 5-8
2026-03-17  fix: resolve 4 audit bugs
2026-03-16  feat(analytics): visitor popup with hourly bar chart and access log
2026-03-16  chore: remove temp diag endpoint; fix SPREADSHEET_ID secret to correct sheet
2026-03-16  chore: add temp diag endpoint to verify spreadsheet ID
2026-03-16  chore: remove temporary reset-sheets endpoint and button
2026-03-16  feat(admin): add Reset Sheets button to clear all data and restore headers
2026-03-16  chore: remove temporary seed-headers endpoint and button
2026-03-16  feat(dashboard): add Corrigir Headers Alunos button in quick actions
2026-03-16  feat(dashboard): modern Top Áreas legend with donut chart and progress bars
2026-03-16  fix(api): filter blank rows from Google Sheets data
2026-03-16  feat(admin): auto-sync with Google Sheets every 30s + sync indicator
2026-03-16  fix(admin): format timestamp as clean date/time in Contactos table
2026-03-16  fix(admin): rename timestamp column to Data/Hora in Contactos table
2026-03-16  feat(admin): export tables as .xlsx instead of CSV
2026-03-16  feat(admin): show only ID, Nome, Telefone, Programa in Alunos table
2026-03-16  feat(admin): redesign EditFormadorModal to match detail modal style
2026-03-16  feat(admin): redesign detail modal — modern popup with grouped sections
2026-03-16  feat(admin): show only ID, Nome, Tel, Áreas, Dias, Período in FormadoresTable
2026-03-16  feat(courses): add transport option to course enrolment modal
2026-03-16  feat(student): add turma selection and transport option to registration form
2026-03-16  fix(tutoring): render icon field on teaching levels from CMS
2026-03-16  feat(cms): add PT/EN language toggle to preview panel
2026-03-16  fix(cms): seed editor and preview with static defaults when Firestore is empty
2026-03-16  feat(cms): show currently published content as reference panel
2026-03-16  fix(admin): tables always fit page width on desktop
2026-03-16  fix(admin): tables fill full width on desktop with column truncation
2026-03-16  feat(dashboard): compact stat cards with navigation and visitor popup
2026-03-16  fix(admin): mark notifications as read on open
2026-03-16  fix(admin): audit fixes — bugs, UX, performance across 12 components
2026-03-15  chore: update node engine to 24 and refresh readme with new architecture
2026-03-15  feat(admin): modularization, api service, toasts, visual dashboard, local SEO
2026-03-15  feat(a11y): add skip-to-content link
2026-03-15  fix: guard empty schedule array crash in Courses fetchCourse
2026-03-15  fix(a11y): add scope="col" to all admin table headers
2026-03-15  feat(admin): manage admin emails via backoffice
2026-03-15  feat(functions): admin notifications via Firestore email list + HTML escape
2026-03-15  perf(functions): Sheets auth client singleton
2026-03-15  refactor(admin): replace hardcoded Sheets column indices with named constants
2026-03-15  docs(claude): update CLAUDE.md to reflect current architecture
2026-03-15  feat(email): send from geral@faroforma.pt via ImprovMX forwarding
2026-03-14  feat: security, performance and accessibility improvements
2026-03-14  feat(admin): add dynamic courses, multi-room agenda and detailed registration views
2026-03-14  Move service account key to archive
2026-03-14  Organize important documents and legacy assets into dedicated folders
2026-03-14  Project Audit & Cleanup (3 commits): unused files, API normalization, env vars
2026-03-14  Force favicon refresh with versioning
2026-03-14  Update favicon to final version
2026-03-13  Final cleanup: documentation, reordered components, multi-language support
2026-03-13  Swap positions of Courses and Services in header and page
2026-03-13  Add custodio.guerreiro@gmail.com as authorized administrator
2026-03-13  Remove pass rate floating card from Tutoring section
2026-03-13  Implement smooth crossfade transitions for images in About and Tutoring sections
2026-03-13  Fix TypeScript errors and remove mock stats
2026-03-13  Implement British English (UK) translation and language switcher
2026-03-13  Update README.md with professional documentation and add GEMINI.md
2026-03-13  Secure Firebase config using environment variables
2026-03-13  Remove redundant website link and clean up unused icons
2026-03-13  Update favicon (2 commits)
2026-03-13  Add success feedback to Agenda synchronization
2026-03-13  Implement Agenda PDF export and Print with preview
2026-03-13  Implement intelligent trainer and course dropdowns in Agenda
2026-03-13  Add Agenda Sala 1 tab to Admin backoffice
2026-03-13  Replace admin sidebar with top header
2026-03-13  Add dropdowns to trainer edit modal
2026-03-12  Change image rotation interval to 7 seconds in Tutoring and About sections
2026-03-12  Reposition floating card in Tutoring section
2026-03-12  Fix Tutoring images and implement 3s carousel
2026-03-12  Fix unused import in Hero
2026-03-12  Configure Firebase Hosting & Functions, add Backoffice and adjust Hero
2026-03-12  Update favicon (2 commits)
2026-03-12  feat: add registration flows
2026-03-11  Set day (light) as default theme
2026-03-11  Initial commit — Centro CMG
```

---

*Documento gerado com base em análise de logs de desenvolvimento (git log --format="%ai|%s").*
*Tempo de commit medido: ~30h activas. Total estimado incluindo planeamento, debug e testes: ~80h.*
