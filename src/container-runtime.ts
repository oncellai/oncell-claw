/**
 * Container runtime abstraction for OnCell-Claw.
 * Replaces Docker with OnCell cells — each group gets a persistent cell.
 *
 * OnCell cells provide: persistent filesystem, database, search, shell access.
 * No Docker required. Each cell auto-pauses when idle and resumes in 200ms.
 */
import { logger } from './logger.js';

// OnCell replaces Docker — no container binary needed
export const CONTAINER_RUNTIME_BIN = 'oncell';

export function hostGatewayArgs(): string[] {
  return []; // Not needed — OnCell cells have full network access
}

export function readonlyMountArgs(
  _hostPath: string,
  _containerPath: string,
): string[] {
  return []; // Not needed — files are uploaded to cells via API
}

export function stopContainer(_name: string): void {
  // OnCell cells auto-pause — no manual stop needed
  logger.debug({ name: _name }, 'Cell auto-pauses when idle');
}

export function ensureContainerRuntimeRunning(): void {
  // OnCell is a cloud service — always available
  const apiKey = process.env.ONCELL_API_KEY;
  if (!apiKey) {
    console.error(
      '\n╔════════════════════════════════════════════════════════════════╗',
    );
    console.error(
      '║  FATAL: ONCELL_API_KEY not set                                ║',
    );
    console.error(
      '║                                                                ║',
    );
    console.error(
      '║  OnCell-Claw uses OnCell instead of Docker.                   ║',
    );
    console.error(
      '║  Get an API key at https://oncell.ai                          ║',
    );
    console.error(
      '║  Then set ONCELL_API_KEY in your .env file.                   ║',
    );
    console.error(
      '╚════════════════════════════════════════════════════════════════╝\n',
    );
    throw new Error('ONCELL_API_KEY is required');
  }
  logger.info('OnCell runtime ready');
}

export function cleanupOrphans(): void {
  // OnCell cells auto-pause — no orphan cleanup needed
  logger.debug('OnCell cells auto-pause when idle — no orphan cleanup needed');
}
