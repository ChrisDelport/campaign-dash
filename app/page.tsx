"use client";
{/*
  Campaign Dashboard - single-page ops UI over the Laravel API.
  Chris Delport <chrisd@chrisd.co.za>

  Why one page: the whole product surface is four small forms plus a table.
  Splitting into routes would add navigation overhead without clarity at
  this size. If it grows (per-campaign detail, analytics views), the first
  split should be /campaigns/[id].

  Data flow: all state is client-side; refresh() re-pulls clients and
  campaigns after every mutation so the lists are always a truthful
  projection of the API. Import calls return the API's 202 body, and the
  queued count is surfaced to the user so the async behaviour is visible.
*/}

import { useCallback, useEffect, useState } from "react";
import {
  Campaign,
  Client,
  createCampaign,
  createClient,
  importCampaignData,
  listCampaigns,
  listClients,
} from "@/lib/api";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // client form
  const [clientName, setClientName] = useState("");

  // campaign form
  const [clientId, setClientId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // import form
  const [importCampaignId, setImportCampaignId] = useState("");
  const [payload, setPayload] = useState(
    JSON.stringify(
      [
        {
          user_id: "user-123",
          video_url: "https://example.com/video.mp4",
          custom_fields: { first_name: "John" },
        },
      ],
      null,
      2,
    ),
  );

  const refresh = useCallback(async () => {
    try {
      const [clientsRes, campaignsRes] = await Promise.all([
        listClients(),
        listCampaigns(),
      ]);
      setClients(clientsRes.data);
      setCampaigns(campaignsRes.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createClient(clientName);
      setClientName("");
      setNotice("Client created.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCampaign({
        client_id: Number(clientId),
        name: campaignName,
        start_date: startDate,
        ...(endDate ? { end_date: endDate } : {}),
      });
      setCampaignName("");
      setNotice("Campaign created.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    try {
      const records = JSON.parse(payload);
      const res = await importCampaignData(Number(importCampaignId), records);
      setNotice(`Accepted: ${res.queued} record(s) queued for processing.`);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Import failed (invalid JSON?)",
      );
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-8">
      <h1 className="text-2xl font-bold">Campaign Dashboard</h1>

      {error && (
        <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded bg-green-100 p-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Clients</h2>
        <form onSubmit={handleCreateClient} className="flex gap-2">
          <input
            className="flex-1 rounded border px-2 py-1"
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
          <button className="rounded bg-blue-600 px-4 py-1 text-white">
            Add client
          </button>
        </form>
        <ul className="list-disc pl-5 text-sm">
          {clients.map((c) => (
            <li key={c.id}>
              {c.name} <span className="text-gray-500">(#{c.id})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Create campaign</h2>
        <form onSubmit={handleCreateCampaign} className="grid grid-cols-2 gap-2">
          <select
            className="rounded border px-2 py-1"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="rounded border px-2 py-1"
            placeholder="Campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            required
          />
          <input
            type="date"
            className="rounded border px-2 py-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <input
            type="date"
            className="rounded border px-2 py-1"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="col-span-2 rounded bg-blue-600 px-4 py-1 text-white">
            Create campaign
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded border p-4">
        <h2 className="font-semibold">Import data</h2>
        <form onSubmit={handleImport} className="space-y-2">
          <select
            className="w-full rounded border px-2 py-1"
            value={importCampaignId}
            onChange={(e) => setImportCampaignId(e.target.value)}
            required
          >
            <option value="">Select campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} {c.name}
              </option>
            ))}
          </select>
          <textarea
            className="h-40 w-full rounded border px-2 py-1 font-mono text-xs"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
          <button className="rounded bg-blue-600 px-4 py-1 text-white">
            Import (202 queued)
          </button>
        </form>
      </section>

      <section className="space-y-2 rounded border p-4">
        <h2 className="font-semibold">Campaigns</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th>ID</th>
              <th>Name</th>
              <th>Client</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.client_id}</td>
                <td>{c.start_date}</td>
                <td>{c.end_date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}



