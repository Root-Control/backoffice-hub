import { createHash } from 'crypto';

export type EntityType =
  | 'tenant'
  | 'client'
  | 'subtenant'
  | 'domain'
  | 'branding';

/**
 * Ensures a request_id exists.
 * If provided, returns it. Otherwise generates a deterministic one.
 */
export function ensureRequestId(
  providedRequestId: string | undefined,
  action: 'create' | 'update' | 'delete',
  entityType: EntityType,
  entityKey: string,
): string {
  if (providedRequestId) {
    return providedRequestId;
  }

  // Generate deterministic request_id using SHA256 hash
  const timestamp = Date.now();
  const input = `${action}|${entityType}|${entityKey}|${timestamp}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return hash.substring(0, 32);
}

