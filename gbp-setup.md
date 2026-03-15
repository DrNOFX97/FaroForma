# Criar Perfil Google Business Profile (GBP)

## 1. Criar o perfil
1. Vai a **business.google.com**
2. Clica "Adicionar empresa"
3. Preenche com os dados abaixo

## 2. Dados da empresa

| Campo | Valor |
|---|---|
| Nome | FaroForma |
| Categoria principal | Centro de formação profissional |
| Categorias secundárias | Escola de línguas · Serviço de tutoria · Centro de estudos · Aluguer de salas |
| Morada | Rua Conselheiro Sebastião Teles 2A, 8000-256 Faro |
| Telefone principal | 289 820 831 |
| Telefone 2 | 91 781 23 79 |
| Telefone 3 | 96 240 95 70 |
| Website | https://www.faroforma.pt |
| Email | faroforma@gmail.com |
| Horário seg–sex | 09:00 – 22:00 |
| Horário sábado | 09:00 – 18:00 |

## 3. Verificar o perfil
O Google envia um código por **correio postal** (5–7 dias) ou **SMS**.
Sem verificação o perfil não aparece nas pesquisas.

## 4. Depois de verificado

### Atualizar o sameAs no index.html
1. Vai ao perfil no Google Maps
2. Copia o URL da barra do browser
3. Em `index.html`, substitui:
   ```json
   "sameAs": []
   ```
   por:
   ```json
   "sameAs": ["URL_DO_GOOGLE_MAPS_AQUI"]
   ```

### Otimizações a fazer logo após verificação
Ver plano completo em `memory/seo-plan.md` — Parte 2, Semanas 1 e 2:
- Auditoria de categorias vs concorrentes
- Preencher atributos (WiFi, MB Way, acesso cadeira rodas, etc.)
- Descrição do perfil (750 chars) com keywords
- Adicionar todos os serviços com descrições
- Carregar primeiras fotos (salas, exterior, certificados)
