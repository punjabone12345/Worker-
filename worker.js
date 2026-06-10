const OANDA_TOKEN = "391364c0ba92bb6e2301f02126fa5424-5f926a79acd1d6e071cdb14946a52be4";
const OANDA_ACCT = "101-001-38845298-001";
const OANDA_BASE = "https://api-fxpractice.oanda.com/v3";

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const url = new URL(req.url);
    const path = url.pathname;
    let data;

    try {
      if (path === "/" || path === "/health") {
        data = {
          status: "ok",
          account: OANDA_ACCT,
          time: new Date().toISOString(),
        };
      } else if (path === "/account") {
        data = await oget(`/accounts/${OANDA_ACCT}/summary`);
      } else if (path === "/prices") {
        const inst =
          url.searchParams.get("instruments") ||
          "XAU_USD,EUR_USD,GBP_USD,USD_JPY,AUD_USD";

        data = await oget(
          `/accounts/${OANDA_ACCT}/pricing?instruments=${encodeURIComponent(inst)}`
        );
      } else if (path === "/candles") {
        const inst = url.searchParams.get("instrument") || "EUR_USD";
        const gran = url.searchParams.get("granularity") || "D";
        const count = url.searchParams.get("count") || "2";

        data = await oget(
          `/instruments/${inst}/candles?granularity=${gran}&count=${count}&price=M`
        );
      } else {
        data = { error: "not found" };
      }
    } catch (e) {
      data = { error: e.message };
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  };
}

async function oget(path) {
  const response = await fetch(OANDA_BASE + path, {
    headers: {
      Authorization: `Bearer ${OANDA_TOKEN}`,
      "Accept-Datetime-Format": "RFC3339",
    },
  });

  return response.json();
}
