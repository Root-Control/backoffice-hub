export interface HubLambdaResponse {
  ok: boolean;
  sync_id?: string;
  id?: string;
  host?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UpsertTenantPayload {
  request_id: string;
  tenant: {
    id: string;
    enabled: boolean;
    name: string;
    password_check_endpoint: string;
    user_migrated_endpoint: string;
    lookup_email_endpoint: string;
    slug: string;
    [key: string]: unknown;
  };
}

export interface UpsertClientPayload {
  request_id: string;
  client: {
    id: string;
    enabled: boolean;
    name: string;
    redirect_uris: string[];
    pkce_required?: boolean;
    [key: string]: unknown;
  };
}

export interface UpsertSubtenantPayload {
  request_id: string;
  subtenant: {
    id: string;
    tenant_id: string;
    enabled: boolean;
    name: string;
    [key: string]: unknown;
  };
}

export interface UpsertDomainPayload {
  request_id: string;
  domain: {
    id: string;
    host: string;
    enabled: boolean;
    tenant_id: string;
    default_subtenant_id?: string;
    client_id?: string;
    [key: string]: unknown;
  };
}

export interface UpsertBrandingPayload {
  request_id: string;
  branding: {
    id: string;
    subtenant_id: string;
    enabled: boolean;
    [key: string]: unknown;
  };
}

