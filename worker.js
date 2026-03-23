const OANDA_TOKEN = "391364c0ba92bb6e2301f02126fa5424-5f926a79acd1d6e071cdb14946a52be4";
const OANDA_ACCT  = "101-001-38845298-001";
const OANDA_BASE  = "https://api-fxpractice.oanda.com/v3";

addEventListener("fetch", event => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  const origin = request.headers.get("Origin") || "*";
  
  const CORS = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "false",
    "Vary": "Origin"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url  = new URL(request.url);
  const path = url.pathname;

  if (path === "/" || path === "/health") {
    return resp({ status: "ok", account: OANDA_ACCT, time: new Date().toISOString() }, CORS);
  }

  if (path === "/account") {
    const data = await oandaGet("/accounts/" + OANDA_ACCT + "/summary");
    return resp(data, CORS);
  }

  if (path === "/prices") {
    const inst = url.searchParams.get("instruments") || "XAU_USD,EUR_USD,GBP_USD,USD_JPY,USD_CAD,AUD_USD,NZD_USD,GBP_JPY";
    const data = await oandaGet("/accounts/" + OANDA_ACCT + "/pricing?instruments=" + encodeURIComponent(inst));
    return resp(data, CORS);
  }

  return resp({ error: "not found" }, CORS, 404);
}

function resp(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-cache" }
  });
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
