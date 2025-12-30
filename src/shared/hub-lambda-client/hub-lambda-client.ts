import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HubLambdaResponse,
  UpsertTenantPayload,
  UpsertClientPayload,
  UpsertSubtenantPayload,
  UpsertDomainPayload,
  UpsertBrandingPayload,
} from './types';

@Injectable()
export class HubLambdaClient {
  private readonly logger = new Logger(HubLambdaClient.name);
  private readonly token: string;
  private readonly timeout: number;
  private readonly urls: {
    tenants: string;
    clients: string;
    subtenants: string;
    domains: string;
    branding: string;
  };

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('ADMIN_SYNC_TOKEN') || '';
    this.timeout = this.configService.get<number>('ADMIN_TIMEOUT_MS') || 8000;

    this.urls = {
      tenants: this.configService.get<string>('ADMIN_TENANTS_UPSERT_URL') || '',
      clients: this.configService.get<string>('ADMIN_CLIENTS_UPSERT_URL') || '',
      subtenants:
        this.configService.get<string>('ADMIN_SUBTENANTS_UPSERT_URL') || '',
      domains: this.configService.get<string>('ADMIN_DOMAINS_UPSERT_URL') || '',
      branding:
        this.configService.get<string>('ADMIN_BRANDING_UPSERT_URL') || '',
    };

    if (!this.token) {
      throw new Error('ADMIN_SYNC_TOKEN is required');
    }
  }

  private async makeRequest<T>(
    url: string,
    payload: T,
  ): Promise<HubLambdaResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Log the request body being sent to Lambda
    const bodyString = JSON.stringify(payload, null, 2);
    console.log(`[Lambda Request] URL: ${url}`);
    console.log(`[Lambda Request] Body:`, bodyString);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorBody;
        try {
          errorBody = JSON.parse(errorText);
        } catch {
          errorBody = { message: errorText };
        }

        return {
          ok: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorBody.message || `HTTP ${response.status}`,
            details: errorBody,
          },
        };
      }

      const data = await response.json();

      // Parse Stage 1 contract
      if (data.ok === true) {
        return {
          ok: true,
          sync_id: data.sync_id,
          id: data.id || data.host,
          host: data.host,
        };
      }

      if (data.ok === false && data.error) {
        return {
          ok: false,
          error: {
            code: data.error.code || 'UNKNOWN_ERROR',
            message: data.error.message || 'Unknown error',
            details: data.error.details,
          },
        };
      }

      // Unexpected response format
      return {
        ok: false,
        error: {
          code: 'UNEXPECTED_RESPONSE',
          message: 'Lambda returned unexpected response format',
          details: data,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            ok: false,
            error: {
              code: 'TIMEOUT',
              message: `Request timeout after ${this.timeout}ms`,
            },
          };
        }

        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          return {
            ok: false,
            error: {
              code: 'CONNECTION_ERROR',
              message: `Connection error: ${error.message}`,
            },
          };
        }
      }

      return {
        ok: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async upsertTenant(payload: UpsertTenantPayload): Promise<HubLambdaResponse> {
    if (!this.urls.tenants) {
      throw new Error('ADMIN_TENANTS_UPSERT_URL not configured');
    }
    return this.makeRequest(this.urls.tenants, payload);
  }

  async upsertClient(payload: UpsertClientPayload): Promise<HubLambdaResponse> {
    if (!this.urls.clients) {
      throw new Error('ADMIN_CLIENTS_UPSERT_URL not configured');
    }
    return this.makeRequest(this.urls.clients, payload);
  }

  async upsertSubtenant(
    payload: UpsertSubtenantPayload,
  ): Promise<HubLambdaResponse> {
    if (!this.urls.subtenants) {
      throw new Error('ADMIN_SUBTENANTS_UPSERT_URL not configured');
    }
    return this.makeRequest(this.urls.subtenants, payload);
  }

  async upsertDomain(payload: UpsertDomainPayload): Promise<HubLambdaResponse> {
    if (!this.urls.domains) {
      throw new Error('ADMIN_DOMAINS_UPSERT_URL not configured');
    }
    return this.makeRequest(this.urls.domains, payload);
  }

  async upsertBranding(
    payload: UpsertBrandingPayload,
  ): Promise<HubLambdaResponse> {
    if (!this.urls.branding) {
      throw new Error('ADMIN_BRANDING_UPSERT_URL not configured');
    }
    return this.makeRequest(this.urls.branding, payload);
  }
}

