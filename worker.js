/**
 * APEXFX Cloudflare Worker Proxy
 * Deploy at: https://workers.cloudflare.com (free, no credit card)
 * Never sleeps. No cold starts. 100k requests/day free.
 */

const OANDA_TOKEN  = "391364c0ba92bb6e2301f02126fa5424-5f926a79acd1d6e071cdb14946a52be4";
const OANDA_ACCT   = "101-001-38845298-001";
const OANDA_REST   = "https://api-fxpractice.oanda.com/v3";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status=200){
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-cache" }
  });
}

async function oanda(path){
  const r = await fetch(OANDA_REST + path, {
    headers: {
      "Authorization": `Bearer ${OANDA_TOKEN}`,
      "Accept-Datetime-Format": "RFC3339",
    }
  });
  return r.json();
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (path === "/" || path === "/health") {
      return json({ status: "ok", account: OANDA_ACCT, time: new Date().toISOString() });
    }

    if (path === "/account") {
      const data = await oanda(`/accounts/${OANDA_ACCT}/summary`);
      return json(data);
    }

    if (path === "/prices") {
      const inst = url.searchParams.get("instruments") || "XAU_USD,EUR_USD";
      const data = await oanda(`/accounts/${OANDA_ACCT}/pricing?instruments=${encodeURIComponent(inst)}`);
      return json(data);
    }

    return json({ error: "Not found" }, 404);
  }
};
