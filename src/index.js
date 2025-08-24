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
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "no-cache"
        }
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
