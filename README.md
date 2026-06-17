# Mobile AI Coder

Mobile AI Coder is a **powerful agentic AI coding assistant** that runs entirely on your device (including Termux on Android). It connects to any OpenAI-compatible API and provides a premium dark-themed chat interface where an AI agent can read/write files, execute commands, and manage GitHub repositories.

Includes a **TUI (Terminal User Interface)** for easy server management directly from the terminal.

[🇧🇷 Ver versão em Português](#português)

---

## 🚀 Key Features

- **Chat History & Persistence** — All your conversations are saved locally in a SQLite database. Create new chats, switch between previous sessions, and never lose your context.
- **TypeScript Frontend** — The entire web interface has been migrated to TypeScript for better maintainability and type safety.
- **Categorized Settings** — A dedicated configuration screen organized into logical subcategories (LLM Config, GitHub, General, and Tools).
- **Multiple Providers** — Supports both OpenAI-compatible endpoints and Opencode Zen with easy switching.
- **Real-Time LLM Streaming** — Token-by-token text and reasoning display using Server-Sent Events (SSE).
- **Thinking Extraction** — Supports native `reasoning_content`, `<think>` tags (DeepSeek-R1), and `<thought>` tags.
- **GitHub-Powered Agent** — Dedicated tools (`github_get_user`, `github_list_repos`, `github_create_repo`, `github_push_files`) to manage your repositories directly from the chat.
- **Background Process Management** — Server commands (like `npm run dev`) are automatically detected and run in the background.
- **TUI Launcher** — Terminal interface to start/stop the server, check for updates, and install dependencies with a single command.

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Persistence**: Portable SQLite-based storage.
- **Frontend**: TypeScript + Vanilla HTML/CSS
- **Bundler**: `esbuild` for ultra-fast builds.
- **Fonts**: Outfit (UI) + JetBrains Mono (code).
- **Communication**: Server-Sent Events (SSE).
- **TUI**: `blessed` — terminal UI library.

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended).

### Quick Install (one-liner)

```bash
curl -fsSL https://raw.githubusercontent.com/deivid22srk/mobile-ai-coder/main/install.sh | bash
```

This clones the repo, installs dependencies, and configures the **`coder`** command in your `~/.bashrc`. After that, just type `coder` anywhere to launch the TUI.

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/deivid22srk/mobile-ai-coder.git
cd mobile-ai-coder

# Install dependencies
npm install

# Build the frontend assets
npm run build

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

---

## 💻 TUI Launcher

The TUI provides a terminal-based menu to manage the server without remembering commands.

| Command | Description |
|---|---|
| `coder` | Launch the TUI from anywhere (after running install.sh) |
| `npm run tui` | Alternative way to launch the TUI |

### TUI Options

- **▶ Start Server** — starts the backend. Changes to **Stop Server** when running.
- **◖ Check for Updates** — fetches and pulls the latest changes from GitHub.
- **⚡ Install Dependencies** — shown when `node_modules` is missing.
- **✕ Exit** — stops the server and quits.

Navigate with **Tab** / **Arrow keys** / **Enter**, or click with your mouse.

---

## ⚙️ Configuration

On first launch, the app creates a `config.json` with defaults. You can change all settings via the ⚙️ gear icon in the app.

| Setting | Default | Description |
|---|---|---|
| `apiUrl` | *(empty)* | OpenAI-compatible API endpoint |
| `apiKey` | `0` | API authentication key |
| `model` | `qwen-plus` | Default LLM model |
| `workspacePath` | `./workspace` | Sandboxed directory for file operations |
| `systemPrompt` | *(built-in)* | Agent system instructions |
| `githubToken` | *(empty)* | GitHub PAT for unlocking `github_*` tools |

---

## 🇧🇷 Português

O **Mobile AI Coder** é um assistente de codificação agente local que roda inteiramente no seu dispositivo.

### Destaques:
- **Histórico de Chat** — Todas as conversas são salvas automaticamente. Continue de onde parou.
- **Interface em TypeScript** — Código mais robusto e fácil de manter.
- **Configurações Categorizadas** — Telas específicas para LLM, GitHub, Geral e Ferramentas.
- **Múltiplos Providers** — Suporte a endpoints OpenAI-compatíveis e Opencode Zen.
- **TUI (Interface de Terminal)** — Gerencie o servidor com um menu interativo.

### Instalação rápida

```bash
curl -fsSL https://raw.githubusercontent.com/deivid22srk/mobile-ai-coder/main/install.sh | bash
```

### Como rodar manualmente:
1. `npm install`
2. `npm run build`
3. `npm start`

---

## 📄 License

MIT License — use, modify, and distribute freely.
