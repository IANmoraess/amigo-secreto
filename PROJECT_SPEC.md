# Projeto: Amigo Secreto

## 1. Objetivo

Desenvolver uma aplicação web para organizar sorteios de amigo secreto entre familiares e amigos que estão em locais diferentes.

A aplicação deve permitir que um organizador crie um evento, cadastre os participantes, realize o sorteio e disponibilize um acesso individual para cada participante descobrir quem tirou.

O projeto deve ser simples, econômico e totalmente funcional, utilizando serviços com planos gratuitos.

O foco inicial é construir um MVP (Minimum Viable Product), priorizando as regras de negócio, segurança, privacidade e organização do código.

A interface deve ser agradável, moderna e responsiva, mas sem exagerar na complexidade visual nesta primeira versão.

---

## 2. Tecnologias obrigatórias

### Frontend
- React.
- Vite.
- JavaScript (ES6+).
- Tailwind CSS.
- React Router para navegação.
- Lucide React para ícones.

### Backend
- JavaScript utilizando Cloudflare Workers.
- Hono para organização das rotas da API.

### Banco de dados
- Cloudflare D1 (SQLite).

### Infraestrutura
- Cloudflare Pages para hospedagem do frontend.
- Cloudflare Workers para execução do backend.
- Wrangler CLI para desenvolvimento e publicação.

### Ferramentas
- Node.js.
- npm.
- Git.

Não utilizar Laravel, Next.js, NestJS ou outros frameworks desnecessários para este projeto.

Não utilizar Docker, VPS ou servidores tradicionais.

O projeto deve utilizar módulos JavaScript (ES Modules).

---

## 3. Funcionalidades principais

### 3.1. Criação de evento

O organizador deve conseguir:

- Criar um evento de amigo secreto.
- Informar o nome do evento.
- Cadastrar os participantes.
- Visualizar os participantes cadastrados.
- Remover participantes antes da realização do sorteio.
- Conferir os participantes antes de iniciar.
- Iniciar o sorteio quando estiver tudo pronto.

Cada participante deve possuir um identificador único.

Não permitir iniciar um sorteio com menos de dois participantes.

### 3.2. Realização do sorteio

O sorteio deve acontecer integralmente no backend, envolvendo todos os participantes de uma única vez.

Regras obrigatórias:

1. Nenhum participante pode tirar a si mesmo.
2. Cada participante deve sortear exatamente uma pessoa.
3. Cada participante deve ser sorteado exatamente uma vez.
4. Todos os participantes devem possuir um resultado.
5. O sorteio deve acontecer uma única vez por evento.
6. Não permitir modificar participantes depois que o sorteio for realizado.
7. Não permitir executar novamente um sorteio já concluído.

Utilizar um algoritmo de embaralhamento que garanta a ausência de pares iguais e de destinatários repetidos.

Utilizar aleatoriedade criptograficamente segura, disponível no ambiente do Cloudflare Workers.

A geração dos resultados deve ocorrer de maneira atômica, utilizando transação no banco de dados para evitar resultados incompletos.

Caso ocorra uma falha durante o processo, nenhuma associação parcial deve permanecer gravada.

### 3.3. Acesso individual

Após o sorteio, cada participante deve receber um link individual contendo um token aleatório e seguro.

Exemplo:

https://amigosecreto.pages.dev/sorteio/TOKEN_INDIVIDUAL

O participante deve conseguir:

- Acessar o link pelo celular ou computador.
- Visualizar uma página de apresentação.
- Clicar em um botão para revelar seu amigo secreto.
- Visualizar somente o nome da pessoa sorteada.
- Consultar novamente seu próprio resultado pelo mesmo link.

O token deve ser suficientemente longo e imprevisível para impedir tentativas simples de adivinhação.

Armazenar preferencialmente o hash do token no banco de dados, mantendo o token original apenas durante a geração dos links.

Não utilizar IDs sequenciais ou nomes como mecanismo de autenticação.

### 3.4. Revelação do resultado

Quando o participante solicitar a revelação:

1. O backend valida o token.
2. Identifica o participante.
3. Verifica se o evento foi sorteado.
4. Consulta o resultado correspondente.
5. Registra a primeira revelação.
6. Retorna somente o nome da pessoa sorteada.

Caso o participante já tenha revelado o resultado, o sistema deve permitir consultar novamente seu próprio resultado.

Não realizar um novo sorteio quando a página for atualizada ou acessada novamente.

A revelação deve ser idempotente: chamadas repetidas retornam o mesmo resultado, sem modificar a associação.

---

## 4. Segurança e privacidade

A segurança deve ser implementada no backend, nunca dependendo apenas de esconder informações no frontend.

Requisitos obrigatórios:

- Não disponibilizar a lista completa de resultados em nenhuma rota pública.
- Não permitir consultar resultados por ID de participante.
- Utilizar tokens criptograficamente seguros.
- Armazenar hashes dos tokens.
- Validar todas as operações recebidas pela API.
- Proteger as rotas administrativas com autenticação.
- Não expor informações sensíveis em mensagens de erro.
- Utilizar consultas parametrizadas no banco.
- Impedir que um participante consulte o resultado de outro.
- Não disponibilizar endpoints que retornem todos os resultados.
- Aplicar limites básicos contra tentativas excessivas de acesso.

### Privacidade do organizador

O organizador pode visualizar os nomes dos participantes e o status geral do evento, mas não deve ter acesso às associações entre quem tirou quem.

O backend não deve oferecer nenhuma rota administrativa que retorne os resultados completos.

### Entrega dos links individuais

A entrega dos links deve preservar a privacidade.

O painel administrativo pode disponibilizar uma forma de distribuição individual, mas não deve apresentar uma lista contendo todos os tokens e resultados de maneira acessível ao organizador.

Considerar uma estratégia de entrega individual, como geração de links em sessões separadas de distribuição, sem armazenar os tokens em texto puro.

Não implementar envio de e-mail ou WhatsApp automaticamente nesta primeira versão.

---

## 5. Banco de dados

Utilizar Cloudflare D1.

Criar inicialmente as seguintes tabelas:

### events

Campos:
- id
- name
- status
- created_at
- drawn_at

Status possíveis:
- draft
- completed

### participants

Campos:
- id
- event_id
- name
- token_hash
- has_revealed
- created_at

### draws

Campos:
- id
- event_id
- giver_id
- receiver_id
- created_at

### Restrições

Implementar:

- Chave estrangeira entre participantes e eventos.
- Chave estrangeira entre sorteios e participantes.
- Unicidade de token_hash.
- Unicidade de giver_id por evento.
- Unicidade de receiver_id por evento.
- Impedir giver_id igual a receiver_id.
- Índices para consultas frequentes.

Garantir que as restrições de unicidade sejam compostas com event_id quando necessário.

Utilizar transações para garantir consistência.

Evitar armazenar informações desnecessárias.

---

## 6. Arquitetura do projeto

Organizar o projeto em duas aplicações independentes: frontend e backend.

Estrutura inicial sugerida:

amigo-secreto/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── Reveal.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   └── utils/
│   ├── migrations/
│   ├── test/
│   ├── package.json
│   └── wrangler.jsonc
│
├── .gitignore
└── README.md

A estrutura pode ser adaptada quando necessário, mantendo a simplicidade.

### Responsabilidades

- components: componentes reutilizáveis da interface.
- pages: páginas principais.
- services: comunicação com a API.
- hooks: lógica reutilizável do React.
- routes: definição das rotas da API.
- services (backend): regras de negócio.
- repositories: operações com o banco de dados.
- middleware: autenticação e validações.
- utils: funções auxiliares.

Evitar abstrações desnecessárias e arquivos criados apenas para aumentar a quantidade de camadas.

---

## 7. Interface visual

Desenvolver uma interface minimalista, moderna, responsiva e agradável.

A aplicação deve transmitir uma sensação de confraternização, surpresa e simplicidade.

### Identidade visual inicial

Utilizar uma estética natalina discreta.

Sugestão de cores:
- Verde escuro.
- Verde suave.
- Branco ou creme.
- Vermelho em pequenos detalhes.
- Tons neutros para textos e superfícies.

Utilizar tipografia legível, bom espaçamento, bordas arredondadas e componentes consistentes.

Evitar excesso de gradientes, sombras, animações e elementos decorativos.

A interface deve funcionar bem principalmente em dispositivos móveis.

### Página inicial

Deve conter:
- Nome do projeto.
- Uma breve descrição.
- Botão para acessar a área administrativa.
- Uma apresentação simples do funcionamento.

### Painel administrativo

Deve conter:
- Formulário para criar evento.
- Cadastro de participantes.
- Listagem de participantes.
- Opção para remover participantes antes do sorteio.
- Botão para iniciar o sorteio.
- Confirmação antes de realizar o sorteio.
- Indicação do status do evento.

Não exibir os resultados individuais.

### Página do participante

Deve conter:
- Nome do evento.
- Mensagem de boas-vindas.
- Ilustração simples de um presente.
- Botão para revelar o amigo secreto.
- Área para exibir o resultado.
- Mensagem de resultado já revelado.

Após a revelação, apresentar o nome sorteado de maneira destacada.

### Experiência do usuário

Utilizar:
- Estados de carregamento.
- Mensagens de sucesso.
- Mensagens de erro.
- Confirmações para ações importantes.
- Animações leves quando fizer sentido.

Não utilizar dados fictícios como se fossem resultados reais.

---

## 8. Rotas da API

Utilizar Hono para organizar as rotas.

### Administração

POST /api/admin/events

Cria um evento.

POST /api/admin/events/:id/participants

Adiciona participantes.

DELETE /api/admin/events/:id/participants/:participantId

Remove participantes antes do sorteio.

POST /api/admin/events/:id/draw

Executa o sorteio.

GET /api/admin/events/:id

Consulta informações administrativas sem revelar os resultados.

### Participantes

GET /api/sorteio/:token

Valida o acesso e retorna informações básicas do evento e do participante.

POST /api/sorteio/:token/reveal

Revela ou recupera o resultado individual do participante.

Todas as rotas administrativas devem exigir autenticação.

As rotas públicas devem retornar apenas os dados estritamente necessários.

Não criar endpoints públicos para consultar listas de participantes, associações ou resultados completos.

---

## 9. Testes

Criar testes para validar as regras de negócio.

### Sorteio

- Um participante nunca pode tirar a si mesmo.
- Nenhum destinatário pode aparecer duas vezes.
- Todos os participantes devem possuir um resultado.
- O sorteio deve funcionar com diferentes quantidades de participantes.
- Não permitir sorteio com menos de dois participantes.
- Não permitir realizar o sorteio novamente.
- Não permitir alterar participantes após o sorteio.

### Segurança

- Token inválido não permite consultar resultados.
- Participante não consegue consultar resultado de outra pessoa.
- Nenhuma rota pública retorna todos os resultados.
- Rotas administrativas exigem autenticação.
- Tokens não devem aparecer em logs.
- Tentativas repetidas de revelação retornam somente o resultado do próprio participante.

### Banco de dados

- Validar as restrições de unicidade.
- Validar as chaves estrangeiras.
- Validar a consistência das transações.
- Verificar comportamento em caso de falha durante o sorteio.

---

## 10. Desenvolvimento local

O projeto deve funcionar localmente antes de ser publicado.

Frontend:

npm run dev

Backend:

npx wrangler dev

Utilizar o ambiente local do Cloudflare D1 durante o desenvolvimento.

Configurar corretamente as variáveis de ambiente e a comunicação entre frontend e backend.

Não depender da infraestrutura publicada para executar os testes.

---

## 11. Publicação

Preparar a aplicação para publicação gratuita na Cloudflare.

### Frontend
- Publicar utilizando Cloudflare Pages.
- Configurar o build do Vite.
- Configurar a URL da API.

### Backend
- Publicar utilizando Cloudflare Workers.
- Configurar o binding do D1.
- Configurar secrets administrativos.
- Configurar variáveis de ambiente.
- Aplicar as migrations no banco publicado.

Garantir que o frontend consiga se comunicar com a API publicada.

Configurar CORS adequadamente, permitindo somente as origens necessárias.

Verificar as cotas gratuitas vigentes antes da publicação.

---

## 12. Forma de trabalho

Desenvolver o projeto progressivamente.

Não implementar todas as funcionalidades em uma única etapa.

Seguir esta ordem:

1. Configuração inicial e estrutura do projeto.
2. Configuração do React, Vite e Tailwind CSS.
3. Desenvolvimento da interface inicial.
4. Configuração do Cloudflare Workers e Hono.
5. Criação do banco de dados e migrations.
6. Implementação e testes do algoritmo de sorteio.
7. Implementação das rotas administrativas.
8. Implementação do acesso individual.
9. Integração entre frontend e backend.
10. Testes completos de funcionamento e segurança.
11. Preparação para publicação.

Antes de cada etapa:

- Explicar brevemente o que será desenvolvido.
- Informar quais arquivos serão criados ou modificados.
- Apresentar os comandos necessários.
- Explicar as decisões técnicas importantes.

Não antecipar etapas futuras sem necessidade.

Manter o código simples, legível, modular e organizado.

Evitar dependências desnecessárias.

Não substituir regras de negócio por soluções apenas visuais.

Quando encontrar um problema, explicar a causa antes de propor a correção.

Ao concluir cada etapa, apresentar um pequeno resumo do que foi implementado e como testar.

## Resultado esperado

Uma aplicação web de amigo secreto funcional, responsiva e segura, que permita criar eventos, cadastrar participantes, realizar sorteios únicos e disponibilizar resultados individuais por meio de links privados.

O projeto deve ser gratuito dentro das cotas disponíveis, fácil de manter e preparado para receber melhorias visuais e funcionais no futuro.