// ApexFX Cloudflare Worker — deploy this at workers.dev
// ES Module format required
//
// Secrets (Cloudflare dashboard → your Worker → Settings → Variables and Secrets):
//   OANDA_TOKEN       your OANDA v20 personal access token
//   OANDA_ACCOUNT_ID  e.g. 101-001-38845298-002
// Never put the token in this file: it is public.

const OANDA_BASE = "https://api-fxpractice.oanda.com/v3";

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

function creds(env) {
  const token = env && env.OANDA_TOKEN;
  const account = env && env.OANDA_ACCOUNT_ID;
  return { token, account, ok: Boolean(token && account) };
}

async function oanda(path, env) {
  const { token } = creds(env);
  const res = await fetch(`${OANDA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { ok: res.ok, status: res.status, body };
}

// Capital.com quotes via TradingView. TradingView's socket only accepts its own
// origin, so the worker opens it and pipes frames straight through to the browser.
async function tvRelay() {
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  server.accept();

  let upstream = null;
  try {
    const res = await fetch("https://data.tradingview.com/socket.io/websocket?from=chart%2F&type=chart", {
      headers: { Upgrade: "websocket", Origin: "https://www.tradingview.com" },
    });
    upstream = res.webSocket;
  } catch (e) {
    upstream = null;
  }
  if (!upstream) {
    try { server.close(1011, "upstream unavailable"); } catch {}
    return json({ error: "TradingView unreachable" }, 502);
  }
  upstream.accept();

  upstream.addEventListener("message", (e) => {
    try { server.send(e.data); } catch {}
  });
  upstream.addEventListener("close", (e) => {
    try { server.close(e.code, e.reason); } catch {}
  });
  upstream.addEventListener("error", () => {
    try { server.close(1011, "upstream error"); } catch {}
  });
  server.addEventListener("message", (e) => {
    try { upstream.send(e.data); } catch {}
  });
  server.addEventListener("close", (e) => {
    try { upstream.close(e.code, e.reason); } catch {}
  });

  return new Response(null, { status: 101, webSocket: client });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const path = url.pathname;
    const { account, ok: hasCreds } = creds(env);

    // Connection check — also proves the OANDA token still works.
    if (path === "/health") {
      if (!hasCreds) {
        return json({
          status: "error",
          error: "OANDA_TOKEN / OANDA_ACCOUNT_ID secrets are not set on this Worker",
        });
      }
      const { ok, status, body } = await oanda(`/accounts/${account}`, env);
      if (!ok) {
        return json({
          status: "error",
          error: body?.errorMessage || `OANDA rejected the token (HTTP ${status})`,
        });
      }
      return json({
        status: "ok",
        account,
        balance: body?.account?.balance,
        time: new Date().toISOString(),
      });
    }

    if (!hasCreds) {
      return json({ error: "OANDA_TOKEN / OANDA_ACCOUNT_ID secrets are not set on this Worker" }, 500);
    }

    if (path === "/prices") {
      const instruments = url.searchParams.get("instruments") || "XAU_USD,EUR_USD,GBP_USD,USD_JPY,AUD_USD";
      const { ok, status, body } = await oanda(
        `/accounts/${account}/pricing?instruments=${encodeURIComponent(instruments)}`,
        env
      );
      if (!ok) return json({ error: "OANDA error", detail: body, status }, 502);
      return json(body);
    }

    // Real-time pricing stream — proxies OANDA's streaming endpoint (newline-delimited JSON).
    if (path === "/stream") {
      const instruments = url.searchParams.get("instruments") || "XAU_USD,EUR_USD,GBP_USD,USD_JPY,AUD_USD";
      const oandaResp = await fetch(
        `${OANDA_BASE}/accounts/${account}/pricing/stream?instruments=${encodeURIComponent(instruments)}`,
        { headers: { Authorization: `Bearer ${env.OANDA_TOKEN}` } }
      );
      return new Response(oandaResp.body, {
        status: oandaResp.status,
        headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store", ...CORS },
      });
    }

    if (path === "/candles") {
      const instrument = url.searchParams.get("instrument");
      const granularity = url.searchParams.get("granularity") || "D";
      const count = url.searchParams.get("count") || "2";
      const { ok, body } = await oanda(
        `/instruments/${instrument}/candles?granularity=${granularity}&count=${count}&price=M`,
        env
      );
      if (!ok) return json({ error: "OANDA error", detail: body }, 502);
      return json(body);
    }

    // Live Capital.com (NAS100) quote relay — one socket per client.
    if (path === "/tv") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return json({ error: "WebSocket upgrade required" }, 426);
      }
      return tvRelay();
    }

    if (path === "/account") {
      const { ok, body } = await oanda(`/accounts/${account}`, env);
      if (!ok) return json({ error: "OANDA error", detail: body }, 502);
      return json(body);
    }

    return json({ error: "Not found" }, 404);
  },
};
