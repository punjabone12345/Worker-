const OANDA_TOKEN = "3bd390b7df5a74cc7b41355f3680de4d-3d82122d27f629fe73efcc27f99d542a";
const OANDA_ACCT = "101-001-38845298-002";
const OANDA_BASE = "https://api-fxpractice.oanda.com/v3";

export default {
  async fetch(req) {
    const response = await fetch(`${OANDA_BASE}/accounts/${OANDA_ACCT}/summary`, {
      headers: {
        Authorization: `Bearer ${OANDA_TOKEN}`,
        "Accept-Datetime-Format": "RFC3339",
      },
    });

    const text = await response.text();

    return new Response(JSON.stringify({
      status: response.status,
      body: text
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
