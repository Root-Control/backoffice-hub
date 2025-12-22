import { Injectable, Logger } from '@nestjs/common';
import { HubLambdaClient } from '../hub-lambda-client/hub-lambda-client';
import { OutboxService } from './outbox.service';
import { ensureRequestId, EntityType } from '../utils/request-id';
import { now } from '../utils/time';

export interface LastSync {
  ok: boolean;
  http_status: number;
  sync_id?: string;
  error_code?: string;
  error_message?: string;
  updated_at: Date;
  request_id: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private hubLambdaClient: HubLambdaClient,
    private outboxService: OutboxService,
  ) {}

  /**
   * Sync tenant to Stage 1 lambda
   */
  async syncTenant(
    doc: {
      _id: string | { toString(): string } | { toHexString(): string };
      enabled: boolean;
      name: string;
      password_check_endpoint: string;
      user_migrated_endpoint: string;
      slug: string;
      [key: string]: unknown;
    } | Record<string, unknown>,
    requestId?: string,
  ): Promise<LastSync> {
    const entityId =
      typeof (doc as any)._id === 'string'
        ? (doc as any)._id
        : (doc as any)._id?.toHexString?.() || (doc as any)._id.toString();
    const reqId = ensureRequestId(requestId, 'update', 'tenant', entityId);

    const payload = {
      request_id: reqId,
      tenant: {
        id: entityId,
        enabled: (doc as any).enabled,
        name: (doc as any).name,
        password_check_endpoint: (doc as any).password_check_endpoint,
        user_migrated_endpoint: (doc as any).user_migrated_endpoint,
        slug: (doc as any).slug,
        ...Object.fromEntries(
          Object.entries(doc as Record<string, unknown>).filter(
            ([key]) =>
              !['_id', 'enabled', 'name', 'password_check_endpoint', 'user_migrated_endpoint', 'slug', 'createdAt', 'updatedAt', 'deleted_at', 'last_sync'].includes(
                key,
              ),
          ),
        ),
      },
    };

    return this.sync('tenant', entityId, reqId, payload);
  }

  /**
   * Sync client to Stage 1 lambda
   */
  async syncClient(
    doc: {
      _id: string | { toString(): string } | { toHexString(): string };
      enabled: boolean;
      name: string;
      redirect_uris: string[];
      pkce_required?: boolean;
      [key: string]: unknown;
    } | Record<string, unknown>,
    requestId?: string,
  ): Promise<LastSync> {
    const entityId =
      typeof (doc as any)._id === 'string'
        ? (doc as any)._id
        : (doc as any)._id?.toHexString?.() || (doc as any)._id.toString();
    const reqId = ensureRequestId(requestId, 'update', 'client', entityId);

    const payload = {
      request_id: reqId,
      client: {
        id: entityId,
        enabled: (doc as any).enabled,
        name: (doc as any).name,
        redirect_uris: (doc as any).redirect_uris,
        pkce_required: (doc as any).pkce_required,
        ...Object.fromEntries(
          Object.entries(doc as Record<string, unknown>).filter(
            ([key]) =>
              !['_id', 'enabled', 'name', 'redirect_uris', 'pkce_required', 'createdAt', 'updatedAt', 'deleted_at', 'last_sync'].includes(
                key,
              ),
          ),
        ),
      },
    };

    return this.sync('client', entityId, reqId, payload);
  }

  /**
   * Sync subtenant to Stage 1 lambda
   */
  async syncSubtenant(
    doc: {
      _id: string | { toString(): string } | { toHexString(): string };
      tenant_id: string;
      enabled: boolean;
      name: string;
      [key: string]: unknown;
    } | Record<string, unknown>,
    requestId?: string,
  ): Promise<LastSync> {
    const entityId =
      typeof (doc as any)._id === 'string'
        ? (doc as any)._id
        : (doc as any)._id?.toHexString?.() || (doc as any)._id.toString();
    const reqId = ensureRequestId(requestId, 'update', 'subtenant', entityId);

    const payload = {
      request_id: reqId,
      subtenant: {
        id: entityId,
        tenant_id: (doc as any).tenant_id,
        enabled: (doc as any).enabled,
        name: (doc as any).name,
        ...Object.fromEntries(
          Object.entries(doc as Record<string, unknown>).filter(
            ([key]) =>
              !['_id', 'tenant_id', 'enabled', 'name', 'createdAt', 'updatedAt', 'deleted_at', 'last_sync'].includes(
                key,
              ),
          ),
        ),
      },
    };

    return this.sync('subtenant', entityId, reqId, payload);
  }

  /**
   * Sync domain to Stage 1 lambda
   */
  async syncDomain(
    doc: {
      _id: string | { toString(): string } | { toHexString(): string };
      host: string;
      enabled: boolean;
      tenant_id: string;
      default_subtenant_id?: string;
      client_id?: string;
      [key: string]: unknown;
    } | Record<string, unknown>,
    requestId?: string,
  ): Promise<LastSync> {
    const host = (doc as any).host;
    const reqId = ensureRequestId(requestId, 'update', 'domain', host);

    const payload = {
      request_id: reqId,
      domain: {
        host: host,
        enabled: (doc as any).enabled,
        tenant_id: (doc as any).tenant_id,
        default_subtenant_id: (doc as any).default_subtenant_id,
        client_id: (doc as any).client_id,
        ...Object.fromEntries(
          Object.entries(doc as Record<string, unknown>).filter(
            ([key]) =>
              !['_id', 'host', 'enabled', 'tenant_id', 'default_subtenant_id', 'client_id', 'createdAt', 'updatedAt', 'deleted_at', 'last_sync'].includes(
                key,
              ),
          ),
        ),
      },
    };

    return this.sync('domain', host, reqId, payload);
  }

  /**
   * Sync branding to Stage 1 lambda
   */
  async syncBranding(
    doc: {
      _id: string | { toString(): string } | { toHexString(): string };
      scope: string;
      tenant_id?: string;
      subtenant_id?: string;
      [key: string]: unknown;
    } | Record<string, unknown>,
    requestId?: string,
  ): Promise<LastSync> {
    const entityId =
      typeof (doc as any)._id === 'string'
        ? (doc as any)._id
        : (doc as any)._id?.toHexString?.() || (doc as any)._id.toString();
    const reqId = ensureRequestId(requestId, 'update', 'branding', entityId);

    const payload = {
      request_id: reqId,
      branding: {
        id: entityId,
        scope: (doc as any).scope,
        tenant_id: (doc as any).tenant_id,
        subtenant_id: (doc as any).subtenant_id,
        ...Object.fromEntries(
          Object.entries(doc as Record<string, unknown>).filter(
            ([key]) =>
              !['_id', 'scope', 'tenant_id', 'subtenant_id', 'createdAt', 'updatedAt', 'deleted_at', 'last_sync'].includes(
                key,
              ),
          ),
        ),
      },
    };

    return this.sync('branding', entityId, reqId, payload);
  }

  private async sync(
    entityType: EntityType,
    entityKey: string | { toString(): string },
    requestId: string,
    payload: Record<string, unknown>,
  ): Promise<LastSync> {
    const key = typeof entityKey === 'string' ? entityKey : entityKey.toString();
    let response;
    let error: string | undefined;

    try {
      switch (entityType) {
        case 'tenant':
          response = await this.hubLambdaClient.upsertTenant(
            payload as unknown as Parameters<typeof this.hubLambdaClient.upsertTenant>[0],
          );
          break;
        case 'client':
          response = await this.hubLambdaClient.upsertClient(
            payload as unknown as Parameters<typeof this.hubLambdaClient.upsertClient>[0],
          );
          break;
        case 'subtenant':
          response = await this.hubLambdaClient.upsertSubtenant(
            payload as unknown as Parameters<typeof this.hubLambdaClient.upsertSubtenant>[0],
          );
          break;
        case 'domain':
          response = await this.hubLambdaClient.upsertDomain(
            payload as unknown as Parameters<typeof this.hubLambdaClient.upsertDomain>[0],
          );
          break;
        case 'branding':
          response = await this.hubLambdaClient.upsertBranding(
            payload as unknown as Parameters<typeof this.hubLambdaClient.upsertBranding>[0],
          );
          break;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      response = {
        ok: false,
        error: {
          code: 'SYNC_ERROR',
          message: error,
        },
      };
    }

    const lastSync: LastSync = {
      ok: response.ok,
      http_status: response.ok ? 200 : 500,
      sync_id: response.sync_id,
      error_code: response.error?.code,
      error_message: response.error?.message,
      updated_at: now(),
      request_id: requestId,
    };

    // If sync failed, enqueue to outbox
    if (!response.ok) {
      await this.outboxService.enqueue(
        entityType,
        key,
        requestId,
        payload,
        error || response.error?.message,
      );
    }

    return lastSync;
  }
}

