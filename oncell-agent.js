/**
 * OnCell Claw — cell agent code
 * Deployed to an OnCell cell per conversation group.
 * https://oncell.ai/dashboard/deploy
 */
module.exports = {
  async execute(ctx, params) {
    const { prompt, sessionId, assistantName } = params;
    if (params.claudeMd) ctx.store.write("CLAUDE.md", params.claudeMd);
    if (params.tasks) ctx.db.set("ipc:tasks", params.tasks);
    if (params.groups) ctx.db.set("ipc:groups", params.groups);
    let cmd = "claude --print";
    if (sessionId) cmd += " --resume " + sessionId;
    const envCmd = "export ANTHROPIC_API_KEY=\"" + (process.env.ANTHROPIC_API_KEY || "") + "\" && ";
    const result = ctx.shell(envCmd + "echo " + JSON.stringify(prompt) + " | " + cmd);
    let newSessionId = sessionId;
    const match = result.stdout.match(/Session ID: ([a-f0-9-]+)/);
    if (match) newSessionId = match[1];
    return {
      status: result.exitCode === 0 ? "success" : "error",
      result: result.stdout,
      newSessionId,
      error: result.exitCode !== 0 ? result.stderr : undefined,
    };
  },
  async sync_files(ctx, params) {
    for (const file of params.files || []) ctx.store.write(file.path, file.content);
    return { synced: (params.files || []).length };
  },
};
