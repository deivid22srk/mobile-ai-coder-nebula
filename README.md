# Nebula Coder (Mobile AI Coder)

Um **agente de codificação com IA** que roda inteiramente no seu dispositivo (incluindo Termux no Android). Conecta-se a qualquer endpoint compatível com OpenAI e oferece uma interface web premium onde o agente pode ler/escrever arquivos, executar comandos e gerenciar repositórios GitHub.

Esta versão forkada substitui a interface original (TypeScript vanilla + HTML/CSS) por uma **interface totalmente nova em React + Vite + TypeScript** com estética moderna (paleta navy + violeta + ciano, inspirada em Linear / Vercel / Cursor).

---

## ✨ Destaques

- **Interface Nova em React + Vite** — "Nebula UI" com design system próprio (Inter + JetBrains Mono, gradientes violeta→ciano, dark navy)
- **Chat com streaming SSE em tempo real** — texto, raciocínio (reasoning), chamadas de ferramenta e planos, tudo token-a-token
- **Histórico de conversas persistente** em SQLite (chats agrupados por recência na sidebar)
- **Cards de tool call expansíveis** mostrando args e output de cada ferramenta invocada
- **Painel de plano** com barra de progresso mostrando os passos do agente
- **Sub-agentes** spawnados em background com chips visuais
- **Skills** carregadas de `.mobile-ai-coder/skills/` (criação, importação via URL, catálogo OpenAI)
- **Memória persistente** global ou por chat
- **Integração GitHub** — conectar conta, listar/criar repos, push de arquivos
- **File Explorer** com árvore + editor inline
- **Terminal manual** no workspace
- **Múltiplos providers** — Custom OpenAI-compatível ou Opencode Zen

---

## 🛠 Stack

| Camada      | Tecnologia                                            |
|-------------|-------------------------------------------------------|
| Backend     | Node.js + Express                                     |
| Persistência| SQLite (via `sql.js`)                                 |
| Frontend    | React 19 + TypeScript + Vite                          |
| Estilos     | CSS vanilla com design tokens (sem framework)         |
| Streaming   | Server-Sent Events (SSE)                              |
| Fontes      | Inter (UI) + JetBrains Mono (código)                  |

---

## 🚀 Como rodar

### Pré-requisitos
- Node.js v18+

### Instalação e execução (um comando só)

```bash
npm install
npm run dev
```

Esse comando usa `concurrently` para subir, em paralelo:

| Serviço | URL                    | Descrição                              |
|---------|------------------------|----------------------------------------|
| Backend | http://localhost:3000  | API Express + SQLite + agente SSE      |
| Web UI  | http://localhost:5173  | Vite dev server com a interface Nebula |

Abra **http://localhost:5173** no navegador.

### Scripts disponíveis

| Script               | O que faz                                                        |
|----------------------|------------------------------------------------------------------|
| `npm run dev`        | Sobe backend (3000) + Vite (5173) juntos com logs coloridos      |
| `npm start`          | Sobe apenas o backend Node                                       |
| `npm run start:web`  | Sobe apenas o Vite (a interface não vai ter backend pra falar)   |
| `npm run build`      | Build do bundle TypeScript legado (esbuild → public/bundle.js)   |
| `npm run build:web`  | Build de produção da interface React (gera web-ui/dist)          |
| `npm run tui`        | Abre a TUI em terminal (gerenciador do servidor)                 |

---

## ⚙️ Configuração

Na primeira execução, abre a tela de **Configurações** (ícone de engrenagem no header) e configura:

| Campo           | Default        | Descrição                                            |
|-----------------|----------------|------------------------------------------------------|
| `provider`      | `custom`       | `custom` (OpenAI-compatível) ou `opencode-zen`       |
| `apiUrl`        | *(vazio)*      | Endpoint base (ex: `https://api.openai.com/v1`)      |
| `apiKey`        | *(vazio)*      | Sua API key do LLM                                   |
| `model`         | `qwen-plus`    | Nome do modelo (use o picker para ver a lista)       |
| `workspacePath` | `./workspace`  | Pasta sandbox onde o agente lê/escreve arquivos      |
| `githubToken`   | *(vazio)*      | PAT para habilitar as ferramentas `github_*`         |

As configs são persistidas em `config.json` (não commitado).

---

## 🧩 Estrutura do projeto

```
mobile-ai-coder/
├── server.js              # Backend Express + agente SSE
├── tui.js                 # TUI em terminal (blessed)
├── src/                   # Frontend legado (esbuild → public/bundle.js)
├── public/                # Assets estáticos do frontend legado
├── web-ui/                # ⭐ Nova interface React + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts         # Cliente HTTP/SSE para o backend
│   │   ├── types.ts
│   │   ├── markdown.ts    # Renderer markdown leve
│   │   ├── index.css      # Design system Nebula (CSS puro)
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Composer.tsx
│   │       ├── MessageList.tsx
│   │       ├── SettingsScreen.tsx
│   │       ├── ModelPickerModal.tsx
│   │       ├── ExplorerModal.tsx
│   │       ├── TerminalModal.tsx
│   │       └── Icon.tsx
│   └── vite.config.ts     # Proxy /api → http://localhost:3000
├── database.sqlite        # Banco local (não commitado)
├── config.json            # Configurações (não commitado)
└── workspace/             # Sandbox do agente (não commitado)
```

---

## 📄 Licença

MIT — use, modifique e distribua livremente.
