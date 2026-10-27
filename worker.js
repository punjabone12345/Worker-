// ApexFX Cloudflare Worker — deploy this at workers.dev
// ES Module format required

const OANDA_BASE = "https://api-fxpractice.oanda.com/v3";
const ACCOUNT_ID = "101-001-38845298-002";
const API_TOKEN = "22bc54a0ec2fad5906b7b8a877ac7e72-3478f64a1c61c2a26c8a76e51ea9b8d5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function oanda(path) {
  const res = await fetch(`${OANDA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const path = url.pathname;

    if (path === "/health") {
      return json({ status: "ok", account: ACCOUNT_ID, time: new Date().toISOString() });
    }

    if (path === "/prices") {
      const instruments = url.searchParams.get("instruments") || "XAU_USD,EUR_USD,GBP_USD,USD_JPY,AUD_USD";
      const { ok, body } = await oanda(`/accounts/${ACCOUNT_ID}/pricing?instruments=${encodeURIComponent(instruments)}`);
      if (!ok) return json({ error: "OANDA error", detail: body }, 502);
      return json(body);
    }

    // Real-time pricing stream — proxies OANDA's streaming endpoint (newline-delimited JSON).
    // Each PRICE line is pushed to the client as soon as OANDA emits it (millisecond latency).
    if (path === "/stream") {
      const instruments = url.searchParams.get("instruments") || "XAU_USD,EUR_USD,GBP_USD,USD_JPY,AUD_USD";
      const oandaResp = await fetch(`${OANDA_BASE}/accounts/${ACCOUNT_ID}/pricing/stream?instruments=${encodeURIComponent(instruments)}`, {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
      });
      return new Response(oandaResp.body, {
        status: oandaResp.status,
        headers: {
          "Content-Type": "application/x-ndjson",
          "Cache-Control": "no-store",
          ...CORS,
        },
      });
    }

    if (path === "/candles") {
      const instrument = url.searchParams.get("instrument");
      const granularity = url.searchParams.get("granularity") || "D";
      const count = url.searchParams.get("count") || "2";
      const { ok, body } = await oanda(`/instruments/${instrument}/candles?granularity=${granularity}&count=${count}&price=M`);
      if (!ok) return json({ error: "OANDA error", detail: body }, 502);
      return json(body);
    }

    if (path === "/account") {
      const { ok, body } = await oanda(`/accounts/${ACCOUNT_ID}`);
      if (!ok) return json({ error: "OANDA error", detail: body }, 502);
      return json(body);
    }

    return json({ error: "Not found" }, 404);
  },
};
