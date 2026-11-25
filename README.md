# Amigo Secreto

Aplicação web simples, segura e gratuita para organizar sorteios de amigo secreto entre familiares e amigos em locais diferentes.

---

## Como usar o sistema

### 1. Como Organizador (Administrador)

1. Acesse a página inicial e clique em **Acessar área do organizador** (ou vá diretamente para `/admin`).
2. Informe a **Chave administrativa** configurada no servidor (`ADMIN_TOKEN`). Ela fica apenas em memória enquanto você usa o painel.
3. Em **Criar novo evento**, digite o nome do amigo secreto (ex.: `Natal da Família 2026`) e clique em **Criar evento**.
4. **Anote ou copie o código do evento** exibido no topo. Caso feche a página antes do sorteio (ou queira acompanhar depois quem já visualizou), você pode usar esse código em **Abrir evento existente**.
5. Cadastre todos os participantes (mínimo de 2) e confira a lista. Enquanto o status for **Em preparação**, ainda é possível adicionar ou remover nomes.
6. Clique em **Realizar sorteio** e confirme no diálogo.
7. **Distribuição dos links (atenção!):**
   - Logo após o sorteio, será exibida uma **tela exclusiva de distribuição**.
   - Clique em **Copiar link** ao lado de cada nome e envie o link privadamente para a pessoa correspondente (WhatsApp, e-mail, etc.).
   - **Importante:** por segurança, o sistema guarda apenas o hash dos tokens no banco de dados. Os links **não podem ser recuperados** depois que você clicar em **Concluir distribuição** ou fechar a aba.
   - Não abra os links dos participantes, pois cada link revela quem aquela pessoa tirou.
8. Após concluir a distribuição, o painel passa a exibir apenas o resumo do evento (quem já visualizou ou ainda não visualizou o resultado), **sem nunca revelar quem tirou quem**.

### 2. Como Participante

1. Abra o link individual enviado pelo organizador (`/sorteio#TOKEN_INDIVIDUAL`) no celular ou computador.
2. Confira o nome do evento e a saudação com o seu nome (`Olá, [Seu Nome]!`).
3. Garanta que ninguém está olhando a sua tela e clique em **Revelar meu amigo secreto**.
4. O nome da pessoa que você tirou aparecerá em destaque.
5. Você pode fechar a página e abrir o **mesmo link** novamente quando quiser consultar o resultado de novo (nenhum novo sorteio será feito).

---

## O que alterar para rodar com segurança

Antes de usar com pessoas reais ou publicar na internet, faça estas configurações obrigatórias:

### 1. Trocar a chave administrativa (`ADMIN_TOKEN`)
- **Localmente:** edite o arquivo `backend/.dev.vars` (criado a partir de [backend/.dev.vars.example](file:///home/devaonet/amigo-secreto/backend/.dev.vars.example)) e substitua `ADMIN_TOKEN` por uma senha forte e longa.
- **Em produção (Cloudflare Workers):** nunca coloque a chave real no código nem no `wrangler.jsonc`. Cadastre-a como *secret* no Worker:
  ```bash
  # Exemplo para gerar uma chave aleatória forte no Linux/macOS:
  openssl rand -base64 32

  # Cadastrar o secret no Worker:
  cd backend
  npx wrangler secret put ADMIN_TOKEN
  ```

### 2. Restringir o CORS (`ALLOWED_ORIGIN`)
- **Localmente:** em `backend/.dev.vars`, mantenha `ALLOWED_ORIGIN=http://localhost:5173`.
- **Em produção:** defina `ALLOWED_ORIGIN` com a URL exata do seu site no Cloudflare Pages (sem barra no final e nunca use `*`):
  ```bash
  cd backend
  npx wrangler secret put ALLOWED_ORIGIN
  # Informe, por exemplo: https://seu-projeto.pages.dev
  ```
  *(Se precisar permitir mais de uma origem, separe por vírgula.)*

### 3. Configurar a URL da API no Frontend (`VITE_API_URL`)
- **Localmente:** em `frontend/.env.local` (baseado em [frontend/.env.example](file:///home/devaonet/amigo-secreto/frontend/.env.example)), use `VITE_API_URL=http://localhost:8787`.
- **Em produção (Cloudflare Pages):** nas variáveis de ambiente de *Build* do projeto no Pages, configure `VITE_API_URL` com a URL do Worker publicado (ex.: `https://amigo-secreto-api.seu-subdominio.workers.dev`).

### 4. Atualizar o `database_id` do D1 em produção
- Em [backend/wrangler.jsonc](file:///home/devaonet/amigo-secreto/backend/wrangler.jsonc), o campo `database_id` está com `00000000-0000-0000-0000-000000000000` apenas para uso local. Antes do deploy do backend, substitua-o pelo ID real gerado ao criar o banco D1 na Cloudflare.

---

## Desenvolvimento local e testes

### Banco D1 local
```bash
cd backend
npm run db:migrate:local
```

### Executar backend e frontend
Em dois terminais separados:
```bash
# Terminal 1 (API na porta 8787)
cd backend
npm run dev

# Terminal 2 (Frontend na porta 5173)
cd frontend
npm run dev
```

### Executar testes automatizados
```bash
cd backend
npm test
```

---

## Publicação gratuita na Cloudflare

Antes de publicar, verifique as cotas gratuitas vigentes do plano **Workers Free**, **D1** e **Cloudflare Pages** no painel da Cloudflare (suficientes para eventos familiares e grupos de amigos).

### 1. Publicar o Backend (D1 + Workers)
```bash
cd backend

# 1. Autenticar na Cloudflare (se ainda não estiver autenticado)
npx wrangler login

# 2. Criar o banco D1 remoto e copiar o database_id retornado para backend/wrangler.jsonc
npx wrangler d1 create amigo-secreto-db

# 3. Aplicar as migrations no banco remoto
npm run db:migrate:remote

# 4. Configurar os secrets de produção
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put ALLOWED_ORIGIN

# 5. Publicar o Worker
npm run deploy
```

### 2. Publicar o Frontend (Cloudflare Pages)
```bash
cd frontend

# Gerar build de produção (com VITE_API_URL configurado no ambiente de build)
npm run build
```
No painel do **Cloudflare Pages** (ou via `npx wrangler pages deploy dist`):
- **Diretório raiz / build:** `frontend`
- **Comando de build:** `npm run build`
- **Diretório de saída:** `dist`
- **Variável de ambiente (Production):** `VITE_API_URL` = URL do Worker publicado.
- **Roteamento SPA:** não adicione `404.html` para que o Cloudflare Pages sirva automaticamente `/index.html` em rotas como `/admin` e `/sorteio/:token`. Os cabeçalhos de segurança estão configurados em [frontend/public/_headers](file:///home/devaonet/amigo-secreto/frontend/public/_headers).

---

## Arquitetura e decisões técnicas

- **Frontend (`frontend/`):** React, Vite, Tailwind CSS, React Router e Lucide React.
- **Backend (`backend/`):** Cloudflare Workers com Hono e Cloudflare D1 (SQLite).
- **Algoritmo de Sattolo:** embaralhamento com aleatoriedade criptograficamente segura (`crypto.getRandomValues` sem viés de módulo) que gera um ciclo único entre todos os participantes, garantindo ausência de auto-sorteio e bijeção 1-para-1 sem comprometer nenhuma regra do sorteio.
- **Atomicidade no D1 (`env.DB.batch()`):** a atualização condicional do evento (`status = 'draft'` → `'completed'`), gravação dos hashes SHA-256 dos tokens e inserção dos pares em `draws` ocorrem em um único `batch` transacional.
