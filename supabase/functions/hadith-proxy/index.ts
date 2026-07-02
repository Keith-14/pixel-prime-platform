// Proxies sunnah.com pages so they can be displayed in-app inside an iframe
// without being blocked by X-Frame-Options. We rewrite <base> to sunnah.com so
// relative asset/link URLs resolve, and strip scripts to keep the reader lean.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED = new Set([
  "riyadussalihin",
  "adab",
  "shamail",
  "bukhari",
  "muslim",
  "abudawud",
  "tirmidhi",
  "nasai",
  "ibnmajah",
  "nawawi40",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const url = new URL(req.url);
    const path = (url.searchParams.get("path") || "").replace(/^\/+/, "");
    const root = path.split("/")[0];
    if (!root || !ALLOWED.has(root)) {
      return new Response("Invalid path", { status: 400, headers: CORS });
    }

    const target = `https://sunnah.com/${path}`;
    const upstream = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BarakahApp/1.0; +https://barakahapp.lovable.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, {
        status: 502,
        headers: CORS,
      });
    }

    let html = await upstream.text();

    // Inject a <base> so relative URLs (CSS, links) still resolve against sunnah.com
    const baseTag = `<base href="https://sunnah.com/">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    } else {
      html = baseTag + html;
    }

    // Rewrite same-site links to route through this proxy so navigation stays in-app.
    const proxyBase = `${url.origin}${url.pathname}?path=`;
    html = html.replace(
      /href=("|')https?:\/\/(?:www\.)?sunnah\.com\/([^"'#?]+)([^"']*)\1/gi,
      (_m, q, p, tail) => `href=${q}${proxyBase}${encodeURIComponent(p)}${tail}${q}`,
    );
    html = html.replace(
      /href=("|')\/([^"'#?]+)([^"']*)\1/gi,
      (_m, q, p, tail) => `href=${q}${proxyBase}${encodeURIComponent(p)}${tail}${q}`,
    );

    return new Response(html, {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`Proxy error: ${(e as Error).message}`, {
      status: 500,
      headers: CORS,
    });
  }
});