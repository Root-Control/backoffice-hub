import { v4 as uuidv4 } from 'uuid';

export type EntityType =
  | 'tenant'
  | 'application'
  | 'client'
  | 'domain'
  | 'branding';

/**
 * Generates a unique UUID v4 for each request.
 * Always generates a new UUID, ignoring any provided request_id.
 */
export function ensureRequestId(
  providedRequestId: string | undefined,
  action: 'create' | 'update' | 'delete',
  entityType: EntityType,
  entityKey: string,
): string {
  // Always generate unique UUID v4 for each request
  // Ignore any provided request_id from headers
  return uuidv4();
}

