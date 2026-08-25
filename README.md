# build-with-ai

> An open-source, zero-API CLI in plain JavaScript that guides beginners through building software projects with any AI by giving them the right prompt at each step.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://npmjs.com/package/build-with-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Zero-API](https://img.shields.io/badge/AI_API-None_(100%25_Local)-orange.svg)](README.md)

---

## Why `build-with-ai`?

Most beginners struggle to build real software with AI because they don't know:
- **What to ask next** (missing architectural phases)
- **How to prompt effectively** (getting overwhelmed by generic AI responses)
- **How to carry context forward** (forgetting earlier tech choices and database models)

**`build-with-ai` is your step-by-step orchestrator:**
- **Zero API keys or accounts:** Works locally with any AI model (ChatGPT, Claude, Gemini, DeepSeek, Cursor, Copilot, etc.).
- **Automatic context injection:** Every decision you make (database, framework, auth strategy) is automatically injected into future step prompts.
- **Copy-to-clipboard:** Prompts are formatted and copied to your clipboard instantly.
- **Never touches your source code:** Only manages workflow guidance inside a `.buildwithai/` folder.

---

## Installation & Quickstart

You can run it directly with `npx` or install globally:

```bash
# Run directly with npx
npx build-with-ai

# Or install globally
npm install -g build-with-ai
```

---

## Commands Reference

### 1. `npx build-with-ai` (No Subcommand)
- If `.buildwithai/` exists in the current folder: Displays quick progress and lets you jump straight to `next`, `resume`, `status`, or `export`.
- If not initialized: Offers to run the interactive project setup (`init`).

### 2. `npx build-with-ai init`
Starts the interactive wizard to set up your project:
- Choose from built-in templates (e.g. Full-Stack Web Application, Backend REST API).
- Set your experience level (Beginner, Intermediate, Experienced).
- Name your project and describe your one-line idea.
- Creates `.buildwithai/` with `state.json`, `context.json`, and empty `history/`.

### 3. `npx build-with-ai next`
- Loads your current step from the selected template.
- Dynamically resolves `{{dot.notation}}` placeholders against `context.json` (e.g. `{{decisions.database}}`).
- Automatically checks prerequisites (`requires`) and flags any missing decisions.
- Formats the step:
  ```text
  STEP X/N — <title>

  WHY THIS STEP: <goal>
  WHAT AI SHOULD PRODUCE: <expectedOutput>

  <the actual generated prompt>
  ```
- Automatically copies the prompt to your clipboard and confirms with `Prompt copied to clipboard`.

### 4. `npx build-with-ai done`
- Prompts you to record the outcome of the step:
  - **Enter short decisions:** Saved to `context.json` under the step's `writes` keys for future prompt injection.
  - **Paste full AI response:** Saved as markdown to `.buildwithai/history/step-XX.md`.
  - **Skip saving details:** Just marks the step complete.
- Non-blocking confirmation check for expected outcomes.
- Advances `currentStep` to the next phase.

### 5. `npx build-with-ai back`
- Decrements the active step number so you can revisit an earlier step.
- History files and recorded decisions are safely preserved.

### 6. `npx build-with-ai status`
- Shows project name, template, visual progress bar (`[████████░░] 60%`), completed/current/upcoming step checklist, and all recorded decisions.

### 7. `npx build-with-ai resume`
- Displays a clean "Welcome Back" overview with current focus, goal, progress, and next steps.

### 8. `npx build-with-ai export`
Generates comprehensive project documentation:
- `README.md` — Deterministic setup and overview populated from `context.json`.
- `BUILD_LOG.md` — Complete chronological build history from all saved `history/step-XX.md` files.
- `.buildwithai/CONTEXT.md` — Regenerable markdown view of `context.json`.

### 9. `npx build-with-ai list`
- Lists all available templates in `templates/*.json` with their titles and step counts.

### 10. `npx build-with-ai reset`
- Prompts for confirmation and resets `.buildwithai/`.
- Never touches or deletes your user source code files.

---

## Architecture & Storage

```
my-project/
├── .buildwithai/
│   ├── state.json        # Progress, currentStep, completedSteps (no large text)
│   ├── context.json      # Structured decisions store (single source of truth)
│   ├── CONTEXT.md        # Generated readable view of context.json
│   └── history/          # Raw AI responses
│       ├── step-01.md
│       ├── step-02.md
│       └── ...
├── src/                  # Your application code (untouched by CLI)
├── README.md             # Generated on export
└── BUILD_LOG.md          # Generated on export
```

### Separation Rules
1. **`state.json`**: Minimal workflow state (step index, timestamps, completed array).
2. **`context.json`**: Structured key-value decisions (e.g. `decisions.database = "PostgreSQL"`).
3. **`history/`**: Raw markdown logs of AI responses.
4. **`CONTEXT.md`**: Generated view of `context.json` only (re-generable anytime).

---

## Example Walkthrough: "Rahul builds an Expense Tracker"

Here is how a beginner (Rahul) uses `build-with-ai` to build a complete full-stack web application:

1. **Initialize Project:**
   ```bash
   mkdir expense-tracker && cd expense-tracker
   npx build-with-ai init
   ```
   Rahul selects `web-app` template, sets experience to `Beginner`, enters name `Expense Tracker`, and idea `A minimalist receipt and expense manager for freelancers`.

2. **Step 1 — Problem Discovery:**
   Rahul runs `npx build-with-ai next`. The prompt is copied to his clipboard. He pastes it into Claude/ChatGPT.
   The AI responds with target audience and value proposition.
   Rahul runs `npx build-with-ai done`, enters the value proposition, and the step completes.

3. **Step 3 — Tech Stack:**
   When Rahul reaches Step 3, the CLI automatically generates:
   > *"My experience level is Beginner and my project 'Expense Tracker' requires these MVP features: [Logged from Step 2]. Recommend a modern tech stack..."*
   Rahul chooses `Next.js`, `Tailwind CSS`, and `SQLite with Prisma`. He records these in `done`.

4. **Step 5 — Database Schema:**
   The CLI automatically references his chosen database:
   > *"For 'Expense Tracker' using SQLite with Prisma, please design the database schema..."*
   No need to remind the AI what database or project was picked—context is seamlessly threaded.

5. **Exporting Portfolio Documentation:**
   Once finished, Rahul runs `npx build-with-ai export`.
   He instantly gets a structured `README.md`, a complete `BUILD_LOG.md` tracking every design decision, and a portfolio-ready pitch.

---

## License

MIT (c) [build-with-ai contributors](LICENSE)
