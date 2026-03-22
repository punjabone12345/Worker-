const OANDA_TOKEN = "391364c0ba92bb6e2301f02126fa5424-5f926a79acd1d6e071cdb14946a52be4";
const OANDA_ACCT  = "101-001-38845298-001";
const OANDA_BASE  = "https://api-fxpractice.oanda.com/v3";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-cache, no-store"
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url  = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    if (path === "/" || path === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", account: OANDA_ACCT, time: new Date().toISOString() }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    if (path === "/account") {
      const data = await oandaGet("/accounts/" + OANDA_ACCT + "/summary");
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    if (path === "/prices") {
      const inst = url.searchParams.get("instruments") || "XAU_USD,EUR_USD";
      const data = await oandaGet("/accounts/" + OANDA_ACCT + "/pricing?instruments=" + encodeURIComponent(inst));
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...CORS, "Content-Type": "application/json" }
    });

  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
}

async function oandaGet(path) {
  const r = await fetch(OANDA_BASE + path, {
    headers: {
      "Authorization": "Bearer " + OANDA_TOKEN,
      "Accept-Datetime-Format": "RFC3339"
    }
  });
  return r.json();
}
