export default {
  async fetch(request, env, ctx) {
    const CANON = env.CANONICAL;
    const TARGET = new URL(env.TARGET_URL);
    const url = new URL(request.url);

    // 1) Force canonical host
    if (url.hostname !== CANON) {
      url.hostname = CANON;
      return Response.redirect(url.toString(), 301);
    }

    // 2) Only proxy GET/HEAD
    if (!["GET", "HEAD"].includes(request.method))
      return new Response("Method not allowed", { status: 405 });

    // 3) Build target URL (preserve path + query)
    const targetUrl = new URL(url.pathname + url.search, TARGET);

    // 4) Edge cache
    const cache = caches.default;
    const cacheKey = new Request(targetUrl.toString(), { method: "GET" });
    let res = await cache.match(cacheKey);
    if (!res) {
      const upstream = await fetch(targetUrl.toString(), {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
          "accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
        },
      });

      let html = await upstream.text();

      // 5) Keep relative links working
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
