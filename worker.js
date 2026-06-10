export default {
  async fetch() {
    const r = await fetch("https://www.google.com");
    return new Response("Status: " + r.status);
  }
}
