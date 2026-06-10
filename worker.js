export default {
  async fetch(request) {
    try {
      const r = await fetch("https://api-fxpractice.oanda.com/v3/accounts");
      const text = await r.text();

      return new Response(
        JSON.stringify({
          status: r.status,
          body: text.substring(0, 1000)
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: e.message
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};
