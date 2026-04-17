import { OnCell } from "@oncell/sdk";

let client: OnCell | null = null;

export function getOnCell(): OnCell {
  if (!client) {
    const apiKey = process.env.ONCELL_API_KEY;
    if (!apiKey) throw new Error("ONCELL_API_KEY required");
    client = new OnCell({ apiKey });
  }
  return client;
}

// Agent code injected into each user's cell
export const CLAW_AGENT_CODE = `
module.exports = {
  async chat(ctx, params) {
    var message = params.message;
    if (!message) return { error: "message required" };

    // Load persistent memory
    var memory = ctx.db.get("memory") || "";
    var history = ctx.db.get("history") || [];

    // Search past conversations for context
    var pastContext = ctx.search.query(message, 3);
    var contextBlock = pastContext.length > 0
      ? pastContext.map(function(r) { return r.content.substring(0, 300); }).join("\\n---\\n")
      : "";

    // List user files
    var files = ctx.store.list("files");

    // Build system prompt
    var systemPrompt = "You are Claw, a personal AI assistant with persistent memory. You remember everything across sessions.\\n\\n"
      + "## Your capabilities\\n"
      + "- Remember information the user tells you (preferences, facts, context)\\n"
      + "- Save and read files (notes, documents, code)\\n"
      + "- Search across all past conversations\\n"
      + "- Be concise, helpful, and friendly\\n\\n"
      + "## User memory\\n" + (memory || "No memory yet. Learn about the user as you chat.") + "\\n\\n"
      + "## User files\\n" + (files.length > 0 ? files.join(", ") : "No files yet.") + "\\n\\n"
      + "## Relevant past context\\n" + (contextBlock || "No relevant past context.") + "\\n\\n"
      + "## Instructions\\n"
      + "When the user shares preferences or important info, include a MEMORY line at the end:\\n"
      + "MEMORY: [thing to remember]\\n"
      + "When the user asks to save a note, include a SAVE line:\\n"
      + "SAVE: [filename] [content]";

    // Build messages
    var messages = [{ role: "system", content: systemPrompt }];
    var recentHistory = history.slice(-20);
    for (var i = 0; i < recentHistory.length; i++) {
      messages.push({ role: recentHistory[i].role, content: recentHistory[i].content });
    }
    messages.push({ role: "user", content: message });

    // Call LLM
    var apiKey = process.env.ANTHROPIC_API_KEY;
    var res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.filter(function(m) { return m.role !== "system"; }),
      }),
    });

    if (!res.ok) {
      var err = await res.text();
      return { error: "LLM failed: " + res.status, details: err };
    }

    var data = await res.json();
    var reply = data.content && data.content[0] ? data.content[0].text : "";

    // Parse MEMORY and SAVE actions from response
    var actions = [];
    var cleanReply = reply;

    var memoryMatch = reply.match(/MEMORY: (.+)/);
    if (memoryMatch) {
      var newMemory = (memory ? memory + "\\n" : "") + "- " + memoryMatch[1];
      ctx.db.set("memory", newMemory);
      actions.push({ type: "memory", content: memoryMatch[1] });
      cleanReply = cleanReply.replace(/MEMORY: .+/, "").trim();
    }

    var saveMatch = reply.match(/SAVE: (\\S+) (.+)/s);
    if (saveMatch) {
      ctx.store.write("files/" + saveMatch[1], saveMatch[2]);
      actions.push({ type: "save", filename: saveMatch[1] });
      cleanReply = cleanReply.replace(/SAVE: .+/s, "").trim();
    }

    // Save history
    history.push({ role: "user", content: message, ts: new Date().toISOString() });
    history.push({ role: "assistant", content: cleanReply, ts: new Date().toISOString() });
    ctx.db.set("history", history.slice(-50));

    // Index for search
    ctx.search.index("conv:" + Date.now(), "User: " + message + "\\nAssistant: " + cleanReply);

    return { reply: cleanReply, actions: actions };
  },

  async get_memory(ctx) {
    return { memory: ctx.db.get("memory") || "" };
  },

  async get_files(ctx) {
    return { files: ctx.store.list("files") };
  },

  async get_history(ctx) {
    return { messages: ctx.db.get("history") || [] };
  },

  async clear(ctx) {
    ctx.db.delete("memory");
    ctx.db.delete("history");
    return { cleared: true };
  },
};
`;
