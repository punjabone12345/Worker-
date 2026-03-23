const OANDA_TOKEN = "391364c0ba92bb6e2301f02126fa5424-5f926a79acd1d6e071cdb14946a52be4";
const OANDA_ACCT  = "101-001-38845298-001";
const OANDA_BASE  = "https://api-fxpractice.oanda.com/v3";

addEventListener("fetch", event => {
  event.respondWith(handle(event.request));
});

async function handle(req) {
  // Always add CORS headers to every response
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      }
    });
  }

  const url = new URL(req.url);
  const path = url.pathname;
  let data;

  try {
    if (path === "/health" || path === "/") {
      data = { status: "ok", account: OANDA_ACCT, time: new Date().toISOString() };
    } else if (path === "/account") {
      data = await oget("/accounts/" + OANDA_ACCT + "/summary");
    } else if (path === "/prices") {
      const inst = url.searchParams.get("instruments") || "XAU_USD,EUR_USD,GBP_USD,USD_JPY,USD_CAD,AUD_USD,NZD_USD,GBP_JPY";
      data = await oget("/accounts/" + OANDA_ACCT + "/pricing?instruments=" + encodeURIComponent(inst));
    } else {
      data = { error: "not found" };
    }
  } catch(e) {
    data = { error: e.message };
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Cache-Control": "no-cache",
    }
  });
}

async function oget(path) {
  const r = await fetch(OANDA_BASE + path, {
    headers: {
      "Authorization": "Bearer " + OANDA_TOKEN,
      "Accept-Datetime-Format": "RFC3339",
    }
  });
  return r.json();
}
