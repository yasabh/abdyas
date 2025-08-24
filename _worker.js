export default {
  async fetch(request, env, ctx) {
    const TARGET = env.TARGET_URL || "https://example.com"; // set in Pages env vars
    const cache = caches.default;

    // Always mirror root of TARGET (simple version)
    const cacheKey = new Request(TARGET, { method: "GET" });

    // Try edge cache first
    let res = await cache.match(cacheKey);
    if (!res) {
      const upstream = await fetch(TARGET, {
        headers: { "user-agent": "CF-Worker-Mirror/1.0" },
      });
      const html = await upstream.text();

      // Optional: make relative links work by injecting <base>
      const withBase = /<base\s/i.test(html)
        ? html
        : html.replace(
            /<head([^>]*)>/i,
            (m, g1) => `<head${g1}><base href="${new URL(TARGET).origin}/">`
          );

      res = new Response(withBase, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          // Cache at edge 60s; browsers 30s
          "cache-control": "public, max-age=30, s-maxage=60",
        },
      });

      // Store in Cloudflare edge cache
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }

    return res;
  },
};
