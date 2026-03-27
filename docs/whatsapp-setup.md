# WhatsApp Notifications — Meta Cloud API Setup

Notificações de novas mensagens de contacto são enviadas para **91 781 23 79** via Meta WhatsApp Cloud API (gratuita).

## Pré-requisitos

- Conta Facebook / Meta (pessoal serve)
- Número de telefone para o remetente (pode ser um número novo ou o número da empresa — **não pode ser o mesmo 917 812 379 que vai receber**)

---

## Passo 1 — Criar App no Meta Developer

1. Aceder a https://developers.facebook.com
2. Clicar em **My Apps → Create App**
3. Tipo: **Business**
4. Dar um nome (ex: `FaroForma`) e clicar em **Create App**

---

## Passo 2 — Adicionar WhatsApp ao App

1. No dashboard do app, clicar em **Add Product**
2. Encontrar **WhatsApp** e clicar em **Set Up**
3. Associar a uma **Meta Business Account** (criar uma se não tiver)

---

## Passo 3 — Obter credenciais de teste

No painel WhatsApp → **API Setup**:

- **Phone Number ID** — copiar (ex: `123456789012345`)
- **Temporary access token** — copiar (válido 24h, só para testar)
- Em **To**, adicionar o número **+351 917 812 379** como destinatário de teste

Testar com o botão **Send Message** para confirmar que recebe no WhatsApp.

---

## Passo 4 — Obter token permanente

O token temporário expira em 24h. Para produção:

1. Aceder a https://business.facebook.com → **Settings → System Users**
2. Criar um **System User** com role *Admin*
3. Clicar em **Generate New Token** → selecionar o app FaroForma → permissões: `whatsapp_business_messaging`, `whatsapp_business_management`
4. Copiar o token gerado (não expira)

---

## Passo 5 — Configurar secrets no Firebase

```bash
# Token permanente do Meta
echo -n "O_TEU_TOKEN_PERMANENTE" | firebase functions:secrets:set WA_TOKEN --project faroformapt

# Phone Number ID (o ID do número remetente no Meta)
echo -n "O_TEU_PHONE_NUMBER_ID" | firebase functions:secrets:set WA_PHONE_NUMBER_ID --project faroformapt
```

---

## Passo 6 — Deploy

```bash
firebase deploy --only functions --project faroformapt
```

---

## Verificar

Submeter o formulário de contacto do site. Deve chegar uma mensagem ao **917 812 379** tipo:

```
📩 *Nova mensagem — FaroForma*
👤 Nome do cliente
📧 email@exemplo.com
📞 912345678
📌 Assunto

Texto da mensagem...
```

---

## Notas

- O número remetente (o que aparece no WhatsApp) é o número associado ao Meta App, não o 917 812 379.
- A Meta oferece **1 000 conversas grátis por mês**. Para um formulário de contacto, é mais do que suficiente.
- Se o número remetente não tiver enviado mensagem ao destinatário nas últimas 24h, é necessário usar um **template aprovado**. Para o primeiro uso, enviar uma mensagem manual do número de negócio para o 917 812 379 via WhatsApp Business.

---

## Links úteis

- Meta Developer Console: https://developers.facebook.com
- Meta Business Suite: https://business.facebook.com
- Docs API: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
- Secret Manager Firebase: https://console.cloud.google.com/security/secret-manager?project=faroformapt
