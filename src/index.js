export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const TARGET = new URL(env.TARGET_URL);

    // Redirect to canonical if needed
    if (url.hostname !== env.CANONICAL) {
      url.hostname = env.CANONICAL;
      return Response.redirect(url.toString(), 301);
    }

    // Build the proxied URL (keep path + query)
    const targetUrl = new URL(url.pathname + url.search, TARGET);

    const cache = caches.default;
    const cacheKey = new Request(targetUrl.toString(), { method: "GET" });

    // Try edge cache
    let res = await cache.match(cacheKey);
    if (!res) {
      const upstream = await fetch(targetUrl.toString(), {
        headers: { "user-agent": "CF-Worker-Mirror/1.0" },
      });
      let html = await upstream.text();

      // Inject <base> once, so relative links work
      if (!/<base\s/i.test(html)) {
        html = html.replace(
          /<head([^>]*)>/i,
          (m, g1) => `<head${g1}><base href="${TARGET.origin}/">`
        );
      }

      res = new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=30, s-maxage=60",
        },
      });

      ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }

    return res;
  },
};
