// Tiny client for the FastAPI backend. Uses same-origin /api/* paths, which the
// Vite dev server proxies to http://localhost:8000 (see vite.config.ts).

export interface HealthResponse {
  status: string;
  api_key_configured: boolean;
  agent_configured: boolean;
}

export interface ConfigResponse {
  agent_id: string | null;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(`health check failed: ${res.status}`);
  return res.json();
}

export async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error(`config fetch failed: ${res.status}`);
  return res.json();
}
