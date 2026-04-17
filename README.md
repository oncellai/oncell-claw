# OnCell Claw

**NanoClaw in the cloud — no Docker, no self-hosting.**

A fork of [NanoClaw](https://github.com/qwibitai/nanoclaw) by [Gavriel Cohen](https://github.com/qwibitai) that replaces Docker containers with [OnCell](https://oncell.ai) cells. Same messaging integrations, same Claude agent, same skills — but each group gets a persistent cloud environment instead of a local container.

## What's different from NanoClaw

| | NanoClaw | OnCell Claw |
|---|---|---|
| Runtime | Docker containers on your machine | OnCell cells in the cloud |
| Setup | Install Docker, build image | Set `ONCELL_API_KEY` |
| Persistence | Container volumes | Built-in per-cell storage + database |
| Search | Not included | Built-in full-text search per cell |
| Idle cost | Docker container running | $0.003/hr (auto-pauses) |
| Resume | Container restart | 200ms |
| Self-hosted | Yes (required) | No (cloud) |

**Everything else is the same** — WhatsApp, Telegram, Discord, Slack, Gmail channels, group isolation, task scheduler, CLAUDE.md memory, sessions, IPC, skills system.

## Quick Start

```bash
git clone https://github.com/oncellai/oncell-claw.git
cd oncell-claw
npm install
```

### 1. Get your keys

- **OnCell** — sign up at [oncell.ai](https://oncell.ai), get an API key
- **Anthropic** — get an API key for Claude

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

That's it. No Docker. No container builds. Each group gets its own OnCell cell with persistent storage, database, and search.

## How it works

```
WhatsApp/Telegram/Discord message
    → NanoClaw orchestrator (same as original)
    → Instead of Docker: creates/resumes an OnCell cell for the group
    → Claude runs inside the cell with persistent filesystem
    → Response routes back to the messaging platform
    → Cell auto-pauses when idle
```

The key change is in `src/container-runner.ts` — Docker `spawn()` calls are replaced with OnCell API calls. The orchestrator, channels, scheduler, and routing are untouched.

## Hosted version

Try it at [claw.oncell.ai](https://claw.oncell.ai) — connect your messaging apps without any setup.

## Credits

This is a fork of [NanoClaw](https://github.com/qwibitai/nanoclaw), created by [Gavriel Cohen](https://github.com/qwibitai). NanoClaw is an incredible project — lightweight, auditable, and secure. We've only changed the runtime layer (Docker → OnCell) to enable cloud hosting. All credit for the architecture, channels, skills system, and design goes to the NanoClaw team.

## What is OnCell

[OnCell](https://oncell.ai) provides per-user sandboxed environments with persistent storage, database, and search for AI agents. One API call creates an isolated environment. No Docker, no Kubernetes.

- [oncell.ai](https://oncell.ai)
- [Documentation](https://oncell.ai/docs)
- [Discord](https://discord.gg/rAxyyCVDxs)

## License

MIT — same as NanoClaw. See [LICENSE](LICENSE) for full text.

Original copyright: Gavriel Cohen (2026)
