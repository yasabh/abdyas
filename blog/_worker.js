export default {
  async fetch(request, env, ctx) {
    const CANON = env.CANONICAL, url = new URL(request.url);

    // Force custom domain for any *.pages.dev host
    if (url.hostname.endsWith('.pages.dev') && url.hostname !== CANON) {
      url.hostname = CANON;
      return Response.redirect(url.toString(), 301);
    }

    // Serve the built Gatsby assets
    return env.ASSETS.fetch(request);
  }
}
