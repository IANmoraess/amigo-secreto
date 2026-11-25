# Auditoria de Segurança — Projeto Amigo Secreto

**Data da auditoria:** 2026-11-25  
**Tipo:** Análise estática de código, arquitetura, banco de dados, configuração de infraestrutura e validação controlada em ambiente local (somente leitura)  
**Referências:** OWASP Top 10 (2025), OWASP API Security Top 10 (2023), OWASP Cheat Sheet Series, Cloudflare Workers/Pages/D1 Security Best Practices

---

## 1. Resumo executivo

A aplicação **Amigo Secreto** apresenta uma base de engenharia limpa e bem estruturada para um MVP: utiliza consultas SQL parametrizadas em 100% dos repositórios, geração criptograficamente segura de tokens (256 bits) e de aleatoriedade (`crypto.getRandomValues` com *rejection sampling*), armazenamento exclusivo de hashes SHA-256 dos tokens no D1, comparação em tempo constante para autenticação administrativa e renderização segura em React sem uso de HTML bruto (`dangerouslySetInnerHTML`).

Contudo, a auditoria identificou **problemas reais de segurança e de arquitetura** que **impedem a publicação imediata com garantia plena das propriedades de privacidade e disponibilidade prometidas**:

| Gravidade | Confirmadas | Suspeitas | Recomendações Preventivas |
| :--- | :---: | :---: | :---: |
| **CRÍTICA** | 0 | 0 | 0 |
| **ALTA** | 3 | 0 | 0 |
| **MÉDIA** | 5 | 0 | 0 |
| **BAIXA** | 3 | 0 | 0 |
| **INFORMATIVA** | 0 | 0 | 2 |

**Destaques prioritários:**
1. **[ALTA] Exposição potencial de tokens de participantes em logs da Cloudflare (`observability.enabled: true` + tokens na URL):** o Worker registra metadados de invocação com URL/path enquanto os tokens individuais trafegam no caminho da URL (`/api/sorteio/:token`).
2. **[ALTA] Condição de corrida (TOCTOU) no cadastro de participantes concorrente ao sorteio:** `addParticipantService` valida `status === 'draft'` em consulta separada do `INSERT`, permitindo incluir participante órfão sem token e sem resultado caso concorra com `POST /api/admin/events/:id/draw`.
3. **[ALTA — Arquitetural] Modelo de entrega de links permite ao organizador acessar resultados individuais:** embora o painel oculte os tokens em lista aberta, a resposta de `POST /api/admin/events/:id/draw` entrega todos os tokens em claro ao navegador do organizador, e a tabela `draws` armazena associações em claro no D1.
4. **[MÉDIA] Rate limiting em memória por isolado é ineficaz em produção serverless**, há ausência de limites de tamanho de payload e de número máximo de participantes, faltam cabeçalhos de segurança críticos no frontend (`Content-Security-Policy` e `X-Frame-Options`), falta integridade referencial composta por `event_id` na tabela `draws`, e o fallback silencioso de CORS para `http://localhost:5173` não falha fechado em produção.

---

## 2. Escopo

Foram inspecionados integralmente os arquivos do repositório (excluindo `node_modules/`, `dist/` e `.wrangler/`):

- **Backend (`backend/`):**
  - `src/index.js`
  - `src/middleware/adminAuth.js`, `src/middleware/rateLimit.js`
  - `src/routes/admin.js`, `src/routes/sorteio.js`
  - `src/services/drawService.js`, `src/services/eventService.js`, `src/services/revealService.js`
  - `src/repositories/eventRepository.js`, `src/repositories/participantRepository.js`, `src/repositories/drawRepository.js`
  - `src/utils/crypto.js`, `src/utils/validation.js`
  - `migrations/0001_initial.sql`
  - `wrangler.jsonc`, `package.json`, `package-lock.json`, `.dev.vars.example` (e verificação estrutural de `.dev.vars` sem exposição de valores)
  - `test/draw.test.js`, `test/api-and-security.test.js`, `test/database.test.js`, `test/helpers/d1TestDb.js`
- **Frontend (`frontend/`):**
  - `index.html`, `vite.config.js`, `public/_headers`, `package.json`, `package-lock.json`, `.env.example`
  - `src/App.jsx`, `src/main.jsx`, `src/index.css`, `src/services/api.js`
  - `src/pages/Home.jsx`, `src/pages/Admin.jsx`, `src/pages/Reveal.jsx`
  - `src/components/*.jsx` e `src/components/admin/*.jsx`
- **Documentação e controle de versão:** `.gitignore`, `PROJECT_SPEC.md`, `README.md`.

**Limitações de escopo (conforme restrições da auditoria):**
- Nenhum código foi modificado, nenhum dado de banco foi alterado e não houve testes contra recursos publicados na Cloudflare.
- A verificação real de políticas de borda da Cloudflare (WAF, D1 remoto, Cloudflare Pages live headers e Workers Logs em produção) depende da conta de produção e não pôde ser testada diretamente.

---

## 3. Arquitetura e superfície de ataque

### Fluxo de dados e fronteiras de confiança
1. **Navegador do Organizador (`/admin` no Cloudflare Pages)** → envia `Authorization: Bearer <ADMIN_TOKEN>` → **Cloudflare Worker (`/api/admin/*`)** → **Cloudflare D1**.
2. **Navegador do Participante (`/sorteio/:token` no Cloudflare Pages)** → envia `:token` na URL → **Cloudflare Worker (`/api/sorteio/:token*`)** → **Cloudflare D1**.

### Pontos de entrada (superfície de ataque)
- **Rotas públicas (sem autenticação de conta):**
  - `GET /api/health`
  - `GET /api/sorteio/:token`
  - `POST /api/sorteio/:token/reveal`
- **Rotas administrativas (autenticadas por segredo estático único):**
  - `GET /api/admin/verify`
  - `POST /api/admin/events`
  - `GET /api/admin/events/:id`
  - `POST /api/admin/events/:id/participants`
  - `DELETE /api/admin/events/:id/participants/:participantId`
  - `POST /api/admin/events/:id/draw`
- **Superfície estática (Cloudflare Pages):** SPA React com roteamento client-side (`/`, `/admin`, `/sorteio/:token`) e cabeçalhos definidos em `frontend/public/_headers`.

### Ativos críticos
1. **Associações do sorteio (`draws.giver_id -> draws.receiver_id`)**: confidencialidade e integridade (imutabilidade após sorteio).
2. **Tokens individuais dos participantes**: confidencialidade em trânsito, na memória do navegador do organizador e fora de logs.
3. **Credencial administrativa (`ADMIN_TOKEN`)**: controla integralmente a criação/gestão de todos os eventos.
4. **Cotas gratuitas de Cloudflare Workers e D1**: disponibilidade do serviço contra abuso automatizado.

---

## 4. Vulnerabilidades encontradas

### [VULN-01] Exposição de tokens individuais em logs da Cloudflare e histórico devido ao uso do token na URL com `observability.enabled: true`
- **Status:** Confirmada
- **Gravidade:** ALTA
- **Probabilidade:** Alta | **Impacto:** Alto | **Facilidade de exploração:** Fácil (para operador/acesso à conta Cloudflare) / Média (via histórico/proxies) | **Prioridade:** P0 (Imediata)
- **Arquivos e trechos envolvidos:**
  - `backend/wrangler.jsonc` (linhas 14–16): `"observability": { "enabled": true }`
  - `backend/src/routes/sorteio.js` (linhas 11 e 18): `sorteioRoutes.get('/:token', ...)` e `sorteioRoutes.post('/:token/reveal', ...)`
  - `frontend/src/services/api.js` (linhas 75–78): envio do token no path da URL da API
- **Descrição e exploração:** No Cloudflare Workers, `observability.enabled: true` habilita o Workers Logs, que registra metadados das requisições HTTP, incluindo a URL/caminho acessado. Como o token secreto do participante faz parte do path (`/api/sorteio/:token`), cada acesso de um participante grava o token em texto puro nos logs da Cloudflare, permitindo que qualquer pessoa com acesso ao painel da Cloudflare (incluindo o próprio organizador) recupere os links e revele o resultado de terceiros — violando diretamente o requisito de que tokens não apareçam em logs. Adicionalmente, tokens no path do frontend (`/sorteio/:token`) ficam gravados no histórico do navegador e podem vazar em logs de proxies corporativos.
- **Consequências:** Quebra da privacidade dos resultados e violação direta da política de não persistência de tokens em texto puro ou logs.
- **Como corrigir:**
  1. Desabilitar `observability.enabled` (`false`) em `backend/wrangler.jsonc` ou configurar filtros/redação que impeçam o registro de URLs.
  2. Refatorar a API de participante para receber o token via cabeçalho HTTP (ex.: `Authorization: Bearer <token>` ou `X-Participant-Token`) em endpoints fixos (`GET /api/sorteio/access` e `POST /api/sorteio/reveal`), removendo o token da URL da API.
  3. No frontend, considerar transportar o token no fragmento da URL (`/sorteio#<token>`), pois fragmentos nunca são enviados ao servidor HTTP nem registrados em logs de servidor/CDN.
- **Como testar a correção:** Verificar em `wrangler.jsonc` que a observabilidade não registra paths sensíveis, inspecionar a aba Network do DevTools confirmando que as URLs chamadas pela API não contêm o token, e confirmar nos testes que os endpoints aceitam o token via cabeçalho e rejeitam ausência/invalidez com `404`.

---

### [VULN-02] Condição de corrida (TOCTOU) no cadastro de participantes concorrente ao sorteio
- **Status:** Confirmada
- **Gravidade:** ALTA
- **Probabilidade:** Baixa a Média | **Impacto:** Alto | **Facilidade de exploração:** Média | **Prioridade:** P0 (Imediata)
- **Arquivos e trechos envolvidos:**
  - `backend/src/services/eventService.js` (linhas 57–72): `addParticipantService` verifica `event.status !== 'draft'` e depois chama `createParticipant(...)` de forma incondicional.
  - `backend/src/repositories/participantRepository.js` (linhas 12–17): `INSERT INTO participants (id, event_id, name) VALUES (?, ?, ?)`.
  - `backend/src/services/eventService.js` (linhas 110–156): `executeEventDrawService` lê participantes antes do `batch()`.
- **Descrição e exploração:** Existe uma janela de corrida (*Time-of-Check to Time-of-Use*) entre a leitura do status do evento e a inserção do participante. Se uma requisição `POST /api/admin/events/:id/participants` ler `status = 'draft'` simultaneamente à execução de `POST /api/admin/events/:id/draw` (ou logo antes do `batch()`), o `INSERT` pode concluir após o evento mudar para `'completed'` (ou sem entrar na lista lida pelo sorteio). A linha 69 (`requireEvent`) apenas relê o evento sem desfazer a inserção.
- **Consequências:** Um evento marcado como `completed` fica com um participante órfão (`token_hash = NULL` e sem par em `draws`), violando as regras "Todos os participantes devem possuir um resultado" e "Não permitir alterar participantes após o sorteio".
- **Como corrigir:**
  1. Tornar a inserção condicional no SQL:
     ```sql
     INSERT INTO participants (id, event_id, name)
     SELECT ?, ?, ?
     WHERE EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'draft')
     ```
     e validar `result.meta.changes === 1` (retornando `409 Conflict` caso seja `0`).
  2. Como defesa em profundidade no banco (`migrations/`), criar triggers SQLite `BEFORE INSERT` e `BEFORE DELETE` em `participants` que executem `RAISE(ABORT, 'Event already completed')` quando `events.status = 'completed'`.
  3. No sorteio, validar dentro do `batch` (ou via contagem consistente) que nenhum participante ficou sem `token_hash`.
- **Como testar a correção:** Criar teste automatizado disparando `addParticipant` e `executeEventDraw` concorrentemente (`Promise.all`) e também testar via SQL direto que tentar `INSERT`/`DELETE` em `participants` de um evento `completed` é bloqueado pelo banco.

---

### [VULN-03] Privacidade do organizador dependente de confiança operacional na entrega dos links e ausência de cifragem em repouso em `draws`
- **Status:** Confirmada (limitação arquitetural)
- **Gravidade:** ALTA
- **Probabilidade:** Média (se o organizador for curioso ou tiver a sessão comprometida) | **Impacto:** Alto | **Facilidade de exploração:** Fácil (para o organizador) | **Prioridade:** P1 (Alta — decisão arquitetural)
- **Arquivos e trechos envolvidos:**
  - `backend/src/services/eventService.js` (linhas 120–182): retorna `links: [{ participantId, name, token }]` na resposta HTTP do sorteio.
  - `frontend/src/components/admin/LinkDistribution.jsx` (linhas 10–12, 71–76): mantém todos os tokens na memória do navegador do organizador.
  - `backend/migrations/0001_initial.sql` (linhas 21–33): armazena `(giver_id, receiver_id)` em texto claro na tabela `draws`.
- **Descrição e exploração:** Embora não exista nenhuma rota administrativa que exponha a tabela `draws` e o frontend não exiba os links abertos em tela, o organizador recebe todos os tokens válidos na resposta JSON de `POST /api/admin/events/:id/draw` (acessível inclusive via DevTools → Network ou copiando e abrindo qualquer link). Além disso, quem tiver acesso ao painel da Cloudflare pode ler diretamente `SELECT * FROM draws` no D1.
- **Consequências:** Um organizador mal-intencionado ou curioso consegue descobrir quem tirou quem (embora abrir o link de outro participante marque `has_revealed = 1`, o que pode gerar indício ao participante se ele ainda não tiver acessado).
- **Como corrigir:**
  - **Curto prazo (MVP sem envio automático):** documentar explicitamente o modelo de ameaça (*honest-but-curious* limitado) — o sistema impede exposição acidental ao organizador, mas não substitui um canal independente de entrega.
  - **Evolução recomendada:** implementar entrega direta pelo backend (e-mail/SMS) sem retornar os tokens ao navegador do organizador, ou exigir um segredo/PIN definido pelo próprio participante para descriptografar seu par. Para proteção contra leitura casual no D1, cifrar `receiver_id` (ou o nome sorteado) com chave derivada do token do participante (ex.: AES-GCM com HKDF derivado do token bruto, que nunca é salvo no banco), tornando impossível ler a associação diretamente na tabela `draws` sem possuir o token individual.
- **Como testar a correção:** Caso adote cifragem derivada do token, validar que uma consulta direta à tabela `draws` não revela `receiver_id` em texto claro e que apenas o token original do participante consegue decifrar o destinatário.

---

### [VULN-04] Rate limiting em memória por isolado é ineficaz em produção no Cloudflare Workers e aceita `X-Forwarded-For`
- **Status:** Confirmada
- **Gravidade:** MÉDIA
- **Probabilidade:** Média | **Impacto:** Médio (esgotamento de cotas gratuitas D1/Workers e força bruta contra `ADMIN_TOKEN` fraco) | **Facilidade de exploração:** Fácil | **Prioridade:** P1 (Alta antes de produção pública)
- **Arquivos e trechos envolvidos:**
  - `backend/src/middleware/rateLimit.js` (linhas 7–51): `const buckets = new Map()` e fallback para `X-Forwarded-For`.
  - `backend/src/index.js` (linhas 9–10): limites `60/min` (admin) e `30/min` (sorteio).
- **Descrição e exploração:**
  1. Em produção na Cloudflare, requisições são distribuídas entre múltiplos isolados e PoPs sem memória compartilhada; cada isolado inicia com `Map` vazio e é reciclado frequentemente, permitindo exceder facilmente o limite configurado.
  2. Se mais de 1.000 IPs distintos acessarem dentro de 60 segundos, o laço de limpeza (linhas 30–34) remove apenas entradas expiradas, podendo crescer a memória do isolado.
  3. O fallback para `X-Forwarded-For` (linha 10) permite spoofing de IP caso o Worker seja acessado em um contexto sem `CF-Connecting-IP`.
  4. Cada requisição a `/api/sorteio/:token` que passa pela regex executa uma consulta `SELECT` no D1, criando vetor de esgotamento das cotas gratuitas de leitura do D1.
- **Consequências:** Esgotamento de cotas gratuitas da Cloudflare (DoS econômico/de disponibilidade) e tentativas automatizadas contra `ADMIN_TOKEN` caso a chave escolhida seja fraca.
- **Como corrigir:**
  1. Configurar **Cloudflare WAF Rate Limiting Rules** (disponível no plano gratuito) na frente do domínio/rota do Worker, ou utilizar o **Cloudflare Workers Rate Limiting API** (binding nativo) para controle na borda.
  2. Usar exclusivamente `CF-Connecting-IP` em produção (mantendo `'local'` apenas fora da Cloudflare) e limitar o tamanho máximo do `Map` em memória (evicção FIFO/LRU) no fallback local.
  3. Reduzir o limite de tentativas em `/api/admin/verify` (ex.: 10 req/min por IP).
- **Como testar a correção:** Validar em testes unitários que o rate limit retorna `429` + `Retry-After` ao atingir o teto, que cabeçalhos `X-Forwarded-For` forjados não contornam o limite quando `CF-Connecting-IP` existe, e validar a regra WAF no painel da Cloudflare após o deploy.

---

### [VULN-05] Ausência de limite de tamanho de corpo JSON e de teto de participantes/eventos
- **Status:** Confirmada
- **Gravidade:** MÉDIA
- **Probabilidade:** Média | **Impacto:** Médio (DoS / erro no `DB.batch()` / esgotamento de cotas D1) | **Facilidade de exploração:** Média | **Prioridade:** P1 (Alta)
- **Arquivos e trechos envolvidos:**
  - `backend/src/utils/validation.js` (linhas 9–22): `parseJsonBody` executa `await c.req.json()` sem limite de bytes.
  - `backend/src/services/eventService.js` (linhas 43–72, 110–156): sem limite de participantes por evento.
- **Descrição e exploração:** Não há verificação de tamanho máximo do corpo HTTP (ex.: 4 KB) nem teto de participantes por evento. Um payload JSON muito grande consome CPU/memória do Worker; um evento com centenas/milhares de participantes gera `1 + 2N` instruções SQL em um único `env.DB.batch()`, podendo falhar por limites do D1 ou consumir rapidamente a cota diária de escritas gratuitas.
- **Consequências:** Indisponibilidade do sorteio em eventos grandes ou consumo excessivo de recursos do Worker e D1.
- **Como corrigir:**
  1. Adicionar middleware de limite de tamanho de requisição (ex.: rejeitar com `413 Payload Too Large` corpos acima de `4096` bytes, verificando tanto `Content-Length` quanto o tamanho real lido).
  2. Definir limite máximo de participantes por evento (ex.: `MAX_PARTICIPANTS = 100` ou `200`, retornando `400` ou `409` ao exceder).
  3. Exigir `Content-Type: application/json` em rotas `POST` que recebem JSON.
- **Como testar a correção:** Criar testes enviando payload > 4 KB (esperar `413`) e tentando adicionar o participante `N + 1` acima do teto (esperar erro `400`).

---

### [VULN-06] Cabeçalhos HTTP de segurança incompletos no Frontend (ausência de CSP, `X-Frame-Options` e `Permissions-Policy`)
- **Status:** Confirmada
- **Gravidade:** MÉDIA
- **Probabilidade:** Baixa a Média | **Impacto:** Médio a Alto (Clickjacking e amplificação de eventual XSS) | **Facilidade de exploração:** Média | **Prioridade:** P1 (Alta)
- **Arquivos e trechos envolvidos:**
  - `frontend/public/_headers` (linhas 1–3): define apenas `X-Content-Type-Options: nosniff` e `Referrer-Policy: no-referrer`.
- **Descrição e exploração:** A ausência de `Content-Security-Policy` (`frame-ancestors 'none'`, `default-src 'self'`, `connect-src 'self' <API_URL>`) e de `X-Frame-Options: DENY` permite que a aplicação (incluindo `/sorteio/:token` e `/admin`) seja incorporada em um `<iframe>` de outro site (Clickjacking), além de remover a principal camada de contenção contra exfiltração caso surja alguma vulnerabilidade XSS futura.
- **Consequências:** Possibilidade de indução de clique (ex.: revelar resultado ou acionar ações em frame oculto) e ausência de defesa em profundidade contra XSS.
- **Como corrigir:** Atualizar `frontend/public/_headers` para incluir:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://<SEU-WORKER>.workers.dev; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Como testar a correção:** Conferir os cabeçalhos HTTP na resposta de produção do Cloudflare Pages (`curl -I https://<SEU-SITE>.pages.dev`) e verificar no Console do navegador que nenhum recurso legítimo é bloqueado pela CSP.

---

### [VULN-07] Tabela `draws` não impõe integridade referencial de mesmo `event_id` no schema SQL
- **Status:** Confirmada
- **Gravidade:** MÉDIA
- **Probabilidade:** Baixa (exige bug futuro ou inserção direta no banco) | **Impacto:** Alto (vazamento/associação cruzada entre eventos) | **Facilidade de exploração:** Difícil | **Prioridade:** P2 (Média)
- **Arquivos e trechos envolvidos:**
  - `backend/migrations/0001_initial.sql` (linhas 11–33).
- **Descrição e exploração:** A tabela `draws` possui chaves estrangeiras individuais para `events(id)` e `participants(id)`, mas o schema não impede que um registro em `draws` associe `event_id = A` a um `giver_id` ou `receiver_id` pertencente ao `event_id = B`. Atualmente essa proteção depende exclusivamente da lógica em JavaScript (`eventService.js`) e do `JOIN` em `drawRepository.js`.
- **Consequências:** Em caso de regressão no código backend, seria possível persistir associações cruzadas entre eventos diferentes.
- **Como corrigir:** Em uma nova migration (ou ajuste de schema antes da produção), adicionar `UNIQUE (event_id, id)` em `participants` e usar chaves estrangeiras compostas em `draws`:
  ```sql
  FOREIGN KEY (event_id, giver_id) REFERENCES participants(event_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (event_id, receiver_id) REFERENCES participants(event_id, id) ON DELETE RESTRICT
  ```
- **Como testar a correção:** Adicionar caso de teste em `backend/test/database.test.js` tentando inserir em `draws` um `giver_id` do evento A com `receiver_id` do evento B e confirmar que o SQLite rejeita com erro de `FOREIGN KEY`.

---

### [VULN-08] Fallback silencioso de CORS para `http://localhost:5173` quando `ALLOWED_ORIGIN` não está definida
- **Status:** Confirmada
- **Gravidade:** MÉDIA
- **Probabilidade:** Média (em erro de configuração no deploy) | **Impacto:** Médio | **Facilidade de exploração:** Fácil (se esquecer de configurar `ALLOWED_ORIGIN`) | **Prioridade:** P1 (Alta)
- **Arquivos e trechos envolvidos:**
  - `backend/src/index.js` (linhas 16–24): `parseAllowedOrigins` retorna `['http://localhost:5173']` quando `ALLOWED_ORIGIN` está ausente.
  - `backend/wrangler.jsonc` (linha 10): `database_id` com valor placeholder `00000000-0000-0000-0000-000000000000`.
- **Descrição e exploração:** Caso o Worker seja publicado em produção sem a variável/secret `ALLOWED_ORIGIN` configurada, o backend passa a autorizar silenciosamente requisições cross-origin vindas de `http://localhost:5173` (em vez de falhar fechado bloqueando todas as origens cross-site).
- **Consequências:** Exposição indevida de CORS para origem local em ambiente de produção e dificuldade de detectar falha de configuração.
- **Como corrigir:** Fazer `parseAllowedOrigins` retornar `[]` (falha fechada) quando `ALLOWED_ORIGIN` não estiver configurada, exigindo que o ambiente local a defina em `.dev.vars` (o que já ocorre).
- **Como testar a correção:** Adicionar teste em `api-and-security.test.js` passando `ALLOWED_ORIGIN: ''` no `env` e verificando que `Access-Control-Allow-Origin` não é retornado mesmo para `Origin: http://localhost:5173`.

---

### [VULN-09] Credencial administrativa única e estática sem escopo por evento nem expiração de sessão no frontend
- **Status:** Confirmada
- **Gravidade:** BAIXA
- **Probabilidade:** Baixa | **Impacto:** Médio | **Facilidade de exploração:** Média | **Prioridade:** P2 (Média)
- **Arquivos e trechos envolvidos:**
  - `backend/src/middleware/adminAuth.js` (linhas 9–31).
  - `frontend/src/pages/Admin.jsx` (linhas 24, 113–117).
- **Descrição e exploração:** Existe um único `ADMIN_TOKEN` global que concede acesso administrativo a todos os eventos no banco. Além disso, no frontend, `adminKey` permanece em memória do componente `Admin` sem expiração por inatividade (até o usuário clicar em "Sair" ou fechar a aba).
- **Consequências:** Se o organizador deixar o painel aberto em um dispositivo compartilhado ou se o `ADMIN_TOKEN` vazar, qualquer evento cujo UUID seja conhecido pode ser consultado/manipulado (enquanto em `draft`).
- **Como corrigir:**
  1. Gerar `ADMIN_TOKEN` com no mínimo 256 bits de entropia (`openssl rand -base64 32`) e rotacioná-lo após grandes eventos.
  2. Adicionar timeout de inatividade no frontend (ex.: limpar `adminKey` após 15 minutos sem interação).
  3. Em versões futuras multi-organizador, adotar autenticação por evento ou contas individuais com tokens assinados e expiração curta.
- **Como testar a correção:** Verificar expiração automática do estado `adminKey` após o período de inatividade e confirmar que o uso de chave fraca está barrado no checklist de deploy.

---

### [VULN-10] Validação de nomes aceita caracteres de controle/direção Unicode e nomes duplicados no mesmo evento
- **Status:** Confirmada
- **Gravidade:** BAIXA
- **Probabilidade:** Média (erro operacional) | **Impacto:** Baixo | **Facilidade de exploração:** Fácil | **Prioridade:** P3 (Baixa)
- **Arquivos e trechos envolvidos:**
  - `backend/src/utils/validation.js` (linhas 24–49).
  - `backend/src/services/eventService.js` (linhas 57–72).
- **Descrição e exploração:** `validateEventName` e `validateParticipantName` não rejeitam caracteres de controle (`\u0000-\u001F`, `\u007F`) nem caracteres de controle bidirecional Unicode (`\u202A-\u202E`, `\u2066-\u2069`). Além disso, dois participantes com exatamente o mesmo nome podem ser cadastrados no mesmo evento (o que não causa XSS graças ao escape do React, mas causa ambiguidade real na revelação do amigo secreto).
- **Consequências:** Confusão visual (*UI spoofing* leve) ou ambiguidade para o participante que tira um nome repetido.
- **Como corrigir:** Rejeitar caracteres de controle/bidi em `validation.js` e adicionar restrição de unicidade de nome (case-insensitive) por evento ou alerta explícito ao organizador.
- **Como testar a correção:** Testar envio de strings contendo `\u0000` ou `\u202E` esperando `400`, e testar cadastro duplicado no mesmo evento.

---

### [VULN-11] Scripts de `postinstall` em dependências de desenvolvimento (`esbuild` e `workerd`)
- **Status:** Confirmada (superfície de cadeia de suprimentos)
- **Gravidade:** BAIXA
- **Probabilidade:** Baixa | **Impacto:** Alto (no ambiente de desenvolvimento/CI se comprometido) | **Facilidade de exploração:** Difícil | **Prioridade:** P3 (Preventiva)
- **Arquivos e trechos envolvidos:**
  - `backend/package.json` / `backend/package-lock.json` (`wrangler` → `esbuild@0.28.2`, `workerd@1.20261123.1`).
- **Descrição:** Embora `npm audit` tenha reportado **0 vulnerabilidades conhecidas** no frontend (88 pacotes, 9 de produção) e no backend (198 pacotes, 2 de produção), os pacotes `esbuild` e `workerd` executam scripts `postinstall`. Além disso, `package.json` usa faixas com `^`.
- **Como corrigir:** Usar `npm ci` em pipelines de build/deploy, manter `package-lock.json` versionado e auditar atualizações antes de aprovar scripts de instalação.
- **Como testar a correção:** Executar `npm audit` e `npm ci` em ambiente limpo antes de cada publicação.

---

### Recomendações preventivas / Notas informativas
- **[INFO-01] Propriedade de ciclo único do algoritmo de Sattolo:** Para $n = 3$, qualquer derangement forma um único ciclo (então cada pessoa deduz o sorteio completo — limitação matemática inevitável de $n = 3$). Para $n \ge 4$, o algoritmo de Sattolo sempre produz um único ciclo de tamanho $n$ (nunca subciclos menores, como pares recíprocos $A \leftrightarrow B$). Se $k$ participantes combinarem de revelar seus resultados entre si formando uma cadeia $A \to B \to \dots \to Z$, saberão que $Z$ não tirou $A$ (enquanto $k < n$). Não viola nenhuma regra do sorteio, mas vale manter documentado.
- **[INFO-02] Verificação de XSS, SQLi e armazenamento local:** Confirmado que não há uso de `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `localStorage` ou `sessionStorage` para dados sensíveis, e todas as consultas D1 utilizam *prepared statements* com `.bind()`.

---

## 5. Cenários de ataque

1. **Vazamento de resultados via Workers Logs (exploração de VULN-01):**
   - *Ator:* operador com acesso à conta Cloudflare ou invasor que comprometa logs exportados.
   - *Caminho:* com `observability.enabled: true`, à medida que os participantes abrem seus links, o Worker recebe `GET /api/sorteio/<TOKEN>` e `POST /api/sorteio/<TOKEN>/reveal`. Os caminhos contendo `<TOKEN>` ficam registrados nos logs de invocação, permitindo consultar o resultado de cada participante sem precisar do banco de dados.
2. **Corrupção de sorteio por condição de corrida (exploração de VULN-02):**
   - *Ator:* organizador com duas abas abertas ou requisição automatizada concorrente.
   - *Caminho:* um participante é adicionado simultaneamente ao disparo do sorteio. O sorteio grava `status = 'completed'` para os $N$ participantes originais enquanto o participante $N+1$ é inserido sem `token_hash` e sem par em `draws`, quebrando o evento.
3. **Esgotamento de cotas gratuitas do D1/Workers (exploração de VULN-04 + VULN-05):**
   - *Ator:* terceiro externo sem autenticação.
   - *Caminho:* envio contínuo de requisições automatizadas para `/api/sorteio/<token-aleatorio-de-43-chars>` a partir de múltiplos PoPs/IPs. Cada requisição válida na regex executa um `SELECT` no D1, contornando o rate limiter em memória por isolado e podendo consumir a cota diária gratuita de leituras do D1 ou de requisições do Worker.
4. **Quebra de sigilo pelo próprio organizador (exploração de VULN-03):**
   - *Ator:* organizador curioso.
   - *Caminho:* ao clicar em "Realizar sorteio", abre a aba Network do DevTools e captura o JSON `links` retornado por `POST /api/admin/events/:id/draw`, ou consulta diretamente a tabela `draws` no painel D1 da Cloudflare.
5. **Clickjacking na página de revelação (exploração de VULN-06):**
   - *Ator:* site malicioso que conhece o link de um participante ou o endereço do painel.
   - *Caminho:* incorpora a página em `<iframe>` (sem `X-Frame-Options: DENY` ou `frame-ancestors 'none'`) para induzir cliques indesejados.

---

## 6. Problemas de arquitetura

1. **Transporte de segredos no path da URL (`/api/sorteio/:token`):** colocar credenciais de acesso em paths HTTP dificulta o isolamento contra logs de borda, proxies, ferramentas de observabilidade e histórico de navegação.
2. **Controle de taxa apenas na camada de aplicação (memória de isolado):** incompatível com a natureza distribuída e efêmera do Cloudflare Workers para defesa real contra abuso.
3. **Ausência de canal de entrega independente para links:** impede atingir privacidade criptográfica absoluta contra o próprio organizador na versão MVP.
4. **Segredo administrativo global único (`ADMIN_TOKEN`):** acopla todos os eventos sob uma única credencial, sem isolamento multi-evento/multi-organizador.
5. **Ambiente de testes desacoplado do runtime `workerd`:** a suíte atual testa o D1 via adaptador sobre `node:sqlite`, excelente para lógica e constraints SQLite, mas não cobre comportamentos específicos de rede/limites do runtime Cloudflare Workers ou do D1 remoto.

---

## 7. Recomendações (ordenadas por prioridade)

### Prioridade 0 — Corrigir antes de qualquer publicação
1. **Remover exposição de tokens em logs (`VULN-01`):** definir `"observability": { "enabled": false }` em `backend/wrangler.jsonc` e migrar a API de participante para receber o token por cabeçalho HTTP (e, idealmente, fragmento `#` na URL do frontend).
2. **Corrigir TOCTOU em `addParticipantService` (`VULN-02`):** converter `createParticipant` em `INSERT ... SELECT ... WHERE EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'draft')`, validar `meta.changes === 1` e adicionar triggers SQLite bloqueando `INSERT`/`DELETE` em `participants` quando `events.status = 'completed'`.

### Prioridade 1 — Corrigir antes de disponibilizar publicamente
3. **Configurar rate limiting na borda (`VULN-04`):** ativar Cloudflare WAF Rate Limiting Rules (ou Workers Rate Limiting API) e remover fallback inseguro para `X-Forwarded-For` em produção.
4. **Adicionar limites de payload e quantidade (`VULN-05`):** limitar corpo JSON a `4 KB` (`413`) e limitar participantes por evento (ex.: máximo 100–200).
5. **Completar cabeçalhos de segurança no Cloudflare Pages (`VULN-06`):** adicionar `Content-Security-Policy` (com `frame-ancestors 'none'`), `X-Frame-Options: DENY` e `Permissions-Policy` em `frontend/public/_headers`.
6. **Falhar fechado no CORS (`VULN-08`):** remover o fallback automático para `http://localhost:5173` em `parseAllowedOrigins` quando `ALLOWED_ORIGIN` não estiver definida; validar `database_id` real no deploy.

### Prioridade 2 — Melhorias recomendadas de integridade e governança
7. **Chaves estrangeiras compostas em `draws` (`VULN-07`):** adicionar `UNIQUE (event_id, id)` em `participants` e FKs compostas `(event_id, giver_id)` e `(event_id, receiver_id)`.
8. **Evolução do modelo de privacidade e sessão (`VULN-03`, `VULN-09`):** documentar claramente a fronteira de confiança do MVP, adicionar timeout de inatividade no painel admin e considerar cifragem dos pares em `draws` + entrega automatizada em versões futuras.

### Prioridade 3 — Higienização e manutenção contínua
9. **Sanitização de caracteres de controle/bidi e nomes duplicados (`VULN-10`).**
10. **Processo de `npm ci` + `npm audit` periódico (`VULN-11`).**

---

## 8. Testes realizados

Todas as verificações abaixo foram executadas em ambiente local, somente leitura, sem alterações no código ou banco:

| Verificação | Comando / Método | Resultado |
| :--- | :--- | :--- |
| **Suíte de testes automatizados (backend)** | `cd backend && npm test` (Vitest) | **3 arquivos, 20 testes aprovados** (`draw.test.js`: 13; `api-and-security.test.js`: 4; `database.test.js`: 3) |
| **Auditoria de dependências (frontend)** | `cd frontend && npm audit --json` | **0 vulnerabilidades** (88 pacotes totais, 9 de produção) |
| **Auditoria de dependências (backend)** | `cd backend && npm audit --json` | **0 vulnerabilidades** (198 pacotes totais, 2 de produção) |
| **Revisão estática de XSS / Storage** | Inspeção manual de todos os componentes React e `services/api.js` | Nenhuma ocorrência de `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `localStorage` ou `sessionStorage` |
| **Revisão estática de SQL Injection** | Inspeção manual de todos os repositórios e `0001_initial.sql` | 100% das queries utilizam `.prepare(...).bind(...)` |
| **Revisão de configuração de infraestrutura** | Inspeção de `wrangler.jsonc`, `public/_headers`, `.gitignore`, `index.js` | Identificadas `VULN-01`, `VULN-04`, `VULN-06` e `VULN-08` |

---

## 9. Riscos residuais

- **Compartilhamento voluntário de links:** qualquer participante pode encaminhar seu próprio link individual a terceiros; como não há login por participante no MVP, a posse do link equivale à posse do acesso.
- **Comprometimento do dispositivo do participante ou organizador:** malware, extensões maliciosas do navegador ou acesso físico ao aparelho desbloqueado podem ler a tela, a área de transferência (*clipboard*) ou o estado em memória.
- **Acesso privilegiado à conta Cloudflare:** enquanto a tabela `draws` armazenar pares em texto claro sem cifragem derivada do token, administradores da conta Cloudflare conseguem ler o D1 diretamente.
- **Limitações de ambiente não testado:** políticas de WAF/DDoS, certificados TLS/HSTS do domínio final e limites reais do D1 em produção só podem ser validados após o provisionamento na conta Cloudflare.

---

## 10. Parecer final

**Veredito: APROVADO COM RESTRIÇÕES — NÃO PUBLICAR EM PRODUÇÃO ANTES DE CORRIGIR OS ITENS P0 E P1.**

A aplicação possui excelente base de segurança no núcleo (criptografia adequada, SQL parametrizado, ausência de XSS, validação server-side e atomicidade básica no sorteio), mas apresenta **3 achados de gravidade ALTA** e **5 de gravidade MÉDIA** que precisam de tratamento ou mitigação explícita antes da exposição pública — em especial o risco de registro de tokens em logs da Cloudflare (`observability.enabled: true` + token no path) e a condição de corrida em `addParticipantService`.

### Checklist final de segurança pré-publicação
- [ ] Desabilitar `observability.enabled` em `backend/wrangler.jsonc` (ou remover o token do path da URL da API).
- [ ] Tornar `createParticipant` condicional a `status = 'draft'` no SQL e adicionar triggers de imutabilidade no D1.
- [ ] Remover fallback silencioso de `ALLOWED_ORIGIN` para `http://localhost:5173` (falhar fechado).
- [ ] Configurar `ADMIN_TOKEN` forte (mín. 32 bytes aleatórios) e `ALLOWED_ORIGIN` exato via `wrangler secret put`.
- [ ] Substituir `database_id` placeholder em `backend/wrangler.jsonc` pelo ID real do D1 remoto e aplicar `npm run db:migrate:remote`.
- [ ] Configurar `Content-Security-Policy`, `X-Frame-Options: DENY` e `Permissions-Policy` em `frontend/public/_headers`.
- [ ] Adicionar limite de tamanho do corpo JSON (`<= 4 KB`) e limite máximo de participantes por evento no backend.
- [ ] Ativar regra de Rate Limiting no Cloudflare WAF (ou Workers Rate Limiting API) para `/api/admin/*` e `/api/sorteio/*`.
- [ ] Adicionar integridade referencial composta por `event_id` em `draws`.
- [ ] Confirmar que `npm audit` e `npm test` passam sem falhas antes do deploy final.
