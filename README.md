# build-with-ai

> An open-source, zero-API CLI that guides developers through building complete software projects with any AI by generating context-aware, copy-ready prompts at each step.

[![npm version](https://img.shields.io/npm/v/build-with-ai.svg)](https://www.npmjs.com/package/build-with-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero API Keys](https://img.shields.io/badge/AI_API-None_(100%25_Local)-green.svg)](README.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Kaap10/build-with-ai/pulls)

---

## Why build-with-ai?

Most developers get stuck when building projects with AI because they miss architectural steps or lose context across chat sessions.

`build-with-ai` solves this locally:
- **Zero API keys or accounts:** Works with any AI (ChatGPT, Claude, Gemini, Cursor, Copilot, DeepSeek, Local LLMs).
- **Automatic context injection:** Early architectural choices (database, frontend, auth) are automatically carried into future prompts.
- **Copy-to-clipboard:** Formats and copies prompts instantly.
- **Safe:** Never touches your source code; keeps all workflow state in `.buildwithai/`.

---

## Quickstart

Run directly with `npx` (no install required):

```bash
npx build-with-ai
```

Or install globally:

```bash
npm install -g build-with-ai
```

---

## How It Works

1. **`npx build-with-ai next`** -> Generates the next step prompt with your project context and copies it to clipboard.
2. **Consult your AI** -> Paste into your AI tool and implement the step.
3. **`npx build-with-ai done`** -> Saves key architectural decisions into `context.json` and advances.

---

## Commands

| Command | Description |
| :--- | :--- |
| `npx build-with-ai` | Smart launcher (opens action menu or starts init). |
| `npx build-with-ai init` | Starts interactive onboarding wizard (template, experience, project idea). |
| `npx build-with-ai next` | Generates and copies the prompt for the active step. |
| `npx build-with-ai done` | Records decisions, soft-checks outcomes, and advances step. |
| `npx build-with-ai back` | Moves to previous step without deleting history. |
| `npx build-with-ai status` | Displays visual progress bar, step checklist, and recorded decisions. |
| `npx build-with-ai resume` | Welcome-back dashboard summarizing current focus and progress. |
| `npx build-with-ai export` | Generates `README.md`, `BUILD_LOG.md`, and `.buildwithai/CONTEXT.md`. |
| `npx build-with-ai list` | Lists all available templates and step counts. |
| `npx build-with-ai reset` | Resets workflow state in `.buildwithai/` (never touches user code). |

---

## Architecture & Storage

All workflow state lives in a `.buildwithai/` folder in your project root:

```text
my-project/
├── .buildwithai/
│   ├── state.json        # Workflow progress and active step index
│   ├── context.json      # Structured decisions store (single source of truth)
│   ├── CONTEXT.md        # Regenerable markdown view of context.json
│   └── history/          # Archived raw AI responses (step-01.md, ...)
├── src/                  # Your application code (untouched by CLI)
├── README.md             # Generated on export
└── BUILD_LOG.md          # Generated on export
```

---

## Open Source & Contributing

Contributions are welcome. You can help by:
- Adding new workflow templates (e.g. CLI tools, mobile apps, extensions) in `templates/*.json`.
- Refining existing prompts and step definitions.
- Reporting issues and suggesting enhancements.

### Local Development

```bash
git clone https://github.com/Kaap10/build-with-ai.git
cd build-with-ai
npm install
npm test
npm link
```

---

## License

MIT (c) [build-with-ai contributors](LICENSE)
