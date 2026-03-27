# WhatsApp Notifications — CallMeBot Setup

Notificações de novas mensagens de contacto são enviadas para **91 781 23 79** via CallMeBot.

O número está hardcoded no código (`functions/src/index.ts`). Só falta ativar o número e configurar a API key.

## Passos (fazer uma única vez)

1. No WhatsApp do número **917 812 379**, enviar a mensagem:
   ```
   I allow callmebot to send me messages
   ```
   para o número **+34 644 59 87 90** (número oficial do CallMeBot).

2. Recebes uma resposta automática com a tua API key, e.g. `Your API key is: 1234567`.

3. Guardar a API key no Firebase Secret Manager:
   ```bash
   echo -n "A_TUA_APIKEY" | firebase functions:secrets:set WHATSAPP_APIKEY --project faroformapt
   ```

4. Fazer deploy das functions:
   ```bash
   firebase deploy --only functions --project faroformapt
   ```

## Verificar

Submeter o formulário de contacto do site. Deve chegar uma mensagem WhatsApp ao 917 812 379.

## Referência

- Docs CallMeBot: https://www.callmebot.com/blog/free-api-whatsapp-messages/
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=faroformapt
