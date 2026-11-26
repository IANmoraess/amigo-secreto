# Como rodar o Amigo Secreto localmente

Guia rápido para instalar, configurar e executar o projeto na sua máquina.

---

## Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (incluso com o Node.js)

> Não é necessário ter conta na Cloudflare para rodar localmente: o Wrangler emula o Worker e o banco D1 na sua máquina.

---

## 1. Instalar as dependências

Em um terminal na raiz do projeto, instale os pacotes do **backend** e do **frontend**:

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 2. Configurar as variáveis de ambiente

### Backend (`backend/.dev.vars`)

Copie o arquivo de exemplo:

```bash
cp backend/.dev.vars.example backend/.dev.vars
```

Edite `backend/.dev.vars` se quiser definir sua própria chave administrativa (`ADMIN_TOKEN`). Para uso local, mantenha `ALLOWED_ORIGIN=http://localhost:5173`.

### Frontend (`frontend/.env.local`)

Copie o arquivo de exemplo:

```bash
cp frontend/.env.example frontend/.env.local
```

O arquivo já vem apontando para `VITE_API_URL=http://localhost:8787`, que é a porta padrão do backend local.

---

## 3. Criar e migrar o banco de dados local (D1)

Na pasta `backend`, execute as migrations locais:

```bash
cd backend
npm run db:migrate:local
```

---

## 4. Executar o projeto

Abra **dois terminais** separados:

### Terminal 1 — Backend (API na porta `8787`)

```bash
cd backend
npm run dev
```

### Terminal 2 — Frontend (Site na porta `5173`)

```bash
cd frontend
npm run dev
```

Depois disso, acesse **http://localhost:5173** no navegador.
Para acessar a área do organizador, vá para **http://localhost:5173/admin** e informe o `ADMIN_TOKEN` definido em `backend/.dev.vars`.

---

## 5. Rodar os testes (opcional)

Para executar os testes automatizados do backend:

```bash
cd backend
npm test
```

Para gerar o build de produção do frontend:

```bash
cd frontend
npm run build
```
