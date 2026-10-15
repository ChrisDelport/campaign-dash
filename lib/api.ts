// Typed API client for the Laravel backend.
// Chris Delport <chrisd@chrisd.co.za>
//
// All calls go through api() so error handling lives in exactly one place:
// non-2xx responses are unpacked from Laravel's validation envelope
// ({message, errors}) and rethrown as a single readable Error that the UI
// can show verbatim. NEXT_PUBLIC_API_URL points at the API origin
// (default http://localhost:8000; CORS on the API side must allow this
// origin - see FRONTEND_URL in the API's .env).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Client {
  id: number;
  name: string;
}

export interface Campaign {
  id: number;
  client_id: number;
  name: string;
  start_date: string;
  end_date: string | null;
}

export interface CampaignRecord {
  user_id: string;
  video_url: string;
  custom_fields?: Record<string, unknown>;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.message ?? `Request failed with status ${res.status}`;
    const errors = body?.errors
      ? ` (${Object.values(body.errors).flat().join("; ")})`
      : "";
    throw new Error(`${message}${errors}`);
  }

  return res.json() as Promise<T>;
}

export function listClients(): Promise<{ data: Client[] }> {
  return api("/clients");
}

export function createClient(name: string): Promise<{ data: Client }> {
  return api("/clients", { method: "POST", body: JSON.stringify({ name }) });
}

export function listCampaigns(): Promise<{ data: Campaign[] }> {
  return api("/campaigns");
}

export function createCampaign(input: {
  client_id: number;
  name: string;
  start_date: string;
  end_date?: string;
}): Promise<{ data: Campaign }> {
  return api("/campaigns", { method: "POST", body: JSON.stringify(input) });
}

export function importCampaignData(
  campaignId: number,
  records: CampaignRecord[],
): Promise<{ queued: number }> {
  return api(`/campaigns/${campaignId}/data`, {
    method: "POST",
    body: JSON.stringify(records),
  });
}

