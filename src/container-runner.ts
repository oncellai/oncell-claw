/**
 * OnCell Cell Runner for oncell-claw
 *
 * Replaces NanoClaw's Docker container-runner. Instead of spawning Docker
 * containers, this creates/resumes OnCell cells per group. Each cell has
 * persistent storage, database, and shell access.
 */
import { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

import { CONTAINER_TIMEOUT, DATA_DIR } from './config.js';
import { resolveGroupFolderPath, resolveGroupIpcPath } from './group-folder.js';
import { logger } from './logger.js';
import { RegisteredGroup } from './types.js';

// OnCell config
const ONCELL_API_KEY = process.env.ONCELL_API_KEY || '';
const ONCELL_BASE_URL = process.env.ONCELL_API_URL || 'https://api.oncell.ai';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Track cell IDs per group
const cellMapPath = path.join(DATA_DIR, 'oncell-cells.json');
function loadCellMap(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(cellMapPath, 'utf8'));
  } catch {
    return {};
  }
}
function saveCellMap(map: Record<string, string>): void {
  fs.mkdirSync(path.dirname(cellMapPath), { recursive: true });
  fs.writeFileSync(cellMapPath, JSON.stringify(map, null, 2));
}

// Agent code that runs inside each cell
const CELL_AGENT_CODE = [
  'module.exports = {',
  '  async execute(ctx, params) {',
  '    const { prompt, sessionId, assistantName } = params;',
  '    if (params.claudeMd) ctx.store.write("CLAUDE.md", params.claudeMd);',
  '    if (params.tasks) ctx.db.set("ipc:tasks", params.tasks);',
  '    if (params.groups) ctx.db.set("ipc:groups", params.groups);',
  '    let cmd = "claude --print";',
  '    if (sessionId) cmd += " --resume " + sessionId;',
  '    const envCmd = "export ANTHROPIC_API_KEY=\\"" + (process.env.ANTHROPIC_API_KEY || "") + "\\" && ";',
  '    const result = ctx.shell(envCmd + "echo " + JSON.stringify(prompt) + " | " + cmd);',
  '    let newSessionId = sessionId;',
  '    const match = result.stdout.match(/Session ID: ([a-f0-9-]+)/);',
  '    if (match) newSessionId = match[1];',
  '    return {',
  '      status: result.exitCode === 0 ? "success" : "error",',
  '      result: result.stdout,',
  '      newSessionId,',
  '      error: result.exitCode !== 0 ? result.stderr : undefined,',
  '    };',
  '  },',
  '  async sync_files(ctx, params) {',
  '    for (const file of params.files || []) ctx.store.write(file.path, file.content);',
  '    return { synced: (params.files || []).length };',
  '  },',
  '};',
].join('\n');

async function oncellFetch(
  method: string,
  apiPath: string,
  body?: unknown,
): Promise<any> {
  const url = ONCELL_BASE_URL + apiPath;
  const headers: Record<string, string> = {
    Authorization: 'Bearer ' + ONCELL_API_KEY,
  };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined;
  const json = await res.json();
  if (!res.ok)
    throw new Error(
      'OnCell API error (' + res.status + '): ' + JSON.stringify(json),
    );
  return json;
}

async function getOrCreateCell(groupFolder: string): Promise<string> {
  const cellMap = loadCellMap();

  if (cellMap[groupFolder]) {
    try {
      await oncellFetch(
        'GET',
        '/api/v1/cells/' + encodeURIComponent(cellMap[groupFolder]),
      );
      return cellMap[groupFolder];
    } catch {
      delete cellMap[groupFolder];
    }
  }

  logger.info({ group: groupFolder }, 'Creating OnCell cell for group');
  const cell = await oncellFetch('POST', '/api/v1/cells', {
    customer_id: 'claw-' + groupFolder,
    tier: 'starter',
    permanent: true,
    agent: CELL_AGENT_CODE,
    secrets: { ANTHROPIC_API_KEY },
  });

  const cellId = cell.cell_id || cell.id;
  cellMap[groupFolder] = cellId;
  saveCellMap(cellMap);
  logger.info({ group: groupFolder, cellId }, 'OnCell cell created');
  return cellId;
}

export interface ContainerInput {
  prompt: string;
  sessionId?: string;
  groupFolder: string;
  chatJid: string;
  isMain: boolean;
  isScheduledTask?: boolean;
  assistantName?: string;
  script?: string;
}

export interface ContainerOutput {
  status: 'success' | 'error';
  result: string | null;
  newSessionId?: string;
  error?: string;
}

export async function runContainerAgent(
  group: RegisteredGroup,
  input: ContainerInput,
  onProcess: (proc: ChildProcess, containerName: string) => void,
  onOutput?: (output: ContainerOutput) => Promise<void>,
): Promise<ContainerOutput> {
  const startTime = Date.now();
  const groupDir = resolveGroupFolderPath(group.folder);
  fs.mkdirSync(groupDir, { recursive: true });

  let cellId: string;
  try {
    cellId = await getOrCreateCell(group.folder);
  } catch (err: any) {
    logger.error(
      { group: group.name, error: err.message },
      'Failed to get/create cell',
    );
    return {
      status: 'error',
      result: null,
      error: 'Cell creation failed: ' + err.message,
    };
  }

  const cellName = 'oncell-' + group.folder;
  onProcess(null as any, cellName);

  logger.info(
    { group: group.name, cellId, isMain: input.isMain },
    'Executing in OnCell cell',
  );

  // Read CLAUDE.md
  let claudeMd = '';
  const claudeMdPath = path.join(groupDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    claudeMd = fs.readFileSync(claudeMdPath, 'utf8');
  }

  // Sync group files to cell
  const filesToSync: { path: string; content: string }[] = [];
  if (fs.existsSync(groupDir)) {
    const walk = (dir: string, prefix: string) => {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const rel = prefix ? prefix + '/' + f : f;
        if (fs.statSync(full).isDirectory()) walk(full, rel);
        else {
          try {
            filesToSync.push({
              path: 'group/' + rel,
              content: fs.readFileSync(full, 'utf8'),
            });
          } catch {
            /* skip binary */
          }
        }
      }
    };
    walk(groupDir, '');
  }

  if (filesToSync.length > 0) {
    try {
      await oncellFetch(
        'POST',
        '/api/v1/cells/' + encodeURIComponent(cellId) + '/request',
        {
          method: 'sync_files',
          params: { files: filesToSync },
        },
      );
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Failed to sync files to cell');
    }
  }

  // Execute
  try {
    const result = await oncellFetch(
      'POST',
      '/api/v1/cells/' + encodeURIComponent(cellId) + '/request',
      {
        method: 'execute',
        params: {
          prompt: input.prompt,
          sessionId: input.sessionId,
          groupFolder: group.folder,
          assistantName: input.assistantName,
          claudeMd,
        },
      },
    );

    const duration = Date.now() - startTime;
    logger.info(
      { group: group.name, cellId, duration, status: result.status },
      'Cell execution completed',
    );

    const output: ContainerOutput = {
      status: result.status || 'success',
      result: result.result || null,
      newSessionId: result.newSessionId,
      error: result.error,
    };

    if (onOutput && output.result) await onOutput(output);

    return output;
  } catch (err: any) {
    const duration = Date.now() - startTime;
    logger.error(
      { group: group.name, cellId, duration, error: err.message },
      'Cell execution failed',
    );
    return {
      status: 'error',
      result: null,
      error: 'Cell execution failed: ' + err.message,
    };
  }
}

export function writeTasksSnapshot(
  groupFolder: string,
  isMain: boolean,
  tasks: Array<{
    id: string;
    groupFolder: string;
    prompt: string;
    script?: string | null;
    schedule_type: string;
    schedule_value: string;
    status: string;
    next_run: string | null;
  }>,
): void {
  const groupIpcDir = resolveGroupIpcPath(groupFolder);
  fs.mkdirSync(groupIpcDir, { recursive: true });
  const filtered = isMain
    ? tasks
    : tasks.filter((t) => t.groupFolder === groupFolder);
  fs.writeFileSync(
    path.join(groupIpcDir, 'current_tasks.json'),
    JSON.stringify(filtered, null, 2),
  );
}

export interface AvailableGroup {
  jid: string;
  name: string;
  lastActivity: string;
  isRegistered: boolean;
}

export function writeGroupsSnapshot(
  groupFolder: string,
  isMain: boolean,
  groups: AvailableGroup[],
  _registeredJids: Set<string>,
): void {
  const groupIpcDir = resolveGroupIpcPath(groupFolder);
  fs.mkdirSync(groupIpcDir, { recursive: true });
  const visibleGroups = isMain ? groups : [];
  fs.writeFileSync(
    path.join(groupIpcDir, 'available_groups.json'),
    JSON.stringify(
      { groups: visibleGroups, lastSync: new Date().toISOString() },
      null,
      2,
    ),
  );
}
