# OnCell Claw

**NanoClaw, but without Docker.** Each group gets a persistent cloud environment instead of a local container.

A fork of [NanoClaw](https://github.com/qwibitai/nanoclaw) by [Gavriel Cohen](https://github.com/qwibitai) that replaces Docker containers with [OnCell](https://oncell.ai) cells. Same messaging integrations, same Claude agent, same skills — no Docker required.

## What's different from NanoClaw

| | NanoClaw | OnCell Claw |
|---|---|---|
| Runtime | Docker containers on your machine | OnCell cells in the cloud |
| Setup | Install Docker, build image | Set `ONCELL_API_KEY` |
| Persistence | Container volumes | Built-in per-cell storage + database |
| Search | Not included | Built-in full-text search per cell |
| Idle cost | Docker container running | $0.003/hr (auto-pauses) |
| Resume | Container restart | 200ms |

**Everything else is the same** — WhatsApp, Telegram, Discord, Slack, Gmail channels, group isolation, task scheduler, CLAUDE.md memory, sessions, IPC, skills system.

## Quick Start

### Prerequisites

- **Node.js 22** (required — `better-sqlite3` doesn't build on Node 25+)

```bash
nvm install 22 && nvm use 22
```

### Setup

```bash
git clone https://github.com/oncellai/oncell-claw.git
cd oncell-claw
npm install
```

### 1. Get your keys

- **OnCell** — sign up at [oncell.ai](https://oncell.ai), create an API key
- **Anthropic** — get an API key at [console.anthropic.com](https://console.anthropic.com)

```bash
cp .env.example .env
# Add ONCELL_API_KEY and ANTHROPIC_API_KEY
```

### 2. Connect a messaging platform

```bash
claude
/add-whatsapp    # or /add-telegram, /add-discord, /add-slack
```

### 3. Start

```bash
npm start
```

No Docker. No container builds. Each group gets its own OnCell cell with persistent storage, database, and search.

## How it works

```
WhatsApp/Telegram/Discord message
    → NanoClaw orchestrator (unchanged)
    → Creates/resumes an OnCell cell for the group
    → Claude runs inside the cell with persistent filesystem
    → Response routes back to messaging platform
    → Cell auto-pauses when idle
```

The key change is `src/container-runner.ts` — Docker `spawn()` replaced with OnCell API calls. Everything else is untouched from NanoClaw.

## Why OnCell instead of Docker

- **No Docker install required** — OnCell is a cloud API
- **Persistent storage + database + search built in** — no volume mounts to manage
- **Auto-pause** — cells sleep when idle ($0.003/hr), wake in 200ms
- **Per-group isolation** — each group gets its own sandboxed environment
- **No container builds** — no Dockerfile, no image cache, no build times

## Credits

This is a fork of [NanoClaw](https://github.com/qwibitai/nanoclaw), created by [Gavriel Cohen](https://github.com/qwibitai). NanoClaw is an incredible project — lightweight, auditable, and secure. We've only changed the runtime layer (Docker → OnCell). All credit for the architecture, channels, skills system, and design goes to the NanoClaw team.

## What is OnCell

[OnCell](https://oncell.ai) provides per-user sandboxed environments with persistent storage, database, and search for AI agents. One API call creates an isolated environment.

- [oncell.ai](https://oncell.ai)
- [Documentation](https://oncell.ai/docs)
- [Discord](https://discord.gg/rAxyyCVDxs)

## License

MIT — same as NanoClaw. See [LICENSE](LICENSE) for full text.

Original copyright: Gavriel Cohen (2026)
