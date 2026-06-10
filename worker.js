const OANDA_TOKEN = "e7c99118529d3a66dc1a701abe3c57d3-93b27b741d06960a4a380cc71c84d275";
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
