import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── XML helpers ─────────────────────────────────────────────────────────────

function pick(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (!m) return null;
  return decode(stripCData(m[1]).trim());
}

function pickAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function pickAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(decode(stripCData(m[1]).trim()));
  return out;
}

function stripCData(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(s: string | null): string | null {
  if (!s) return null;
  const result = s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return result || null;
}

// ─── HTML sanitizer: keep safe formatting tags ────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<\/?(?:div|span|section|aside|header|footer|nav|figure|figcaption|table|thead|tbody|tr|td|th|article|main)[^>]*>/gi, " ")
    .replace(/<img([^>]*)>/gi, (_: string, attrs: string) => {
      const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      const alt = attrs.match(/\balt=["']([^"']+)["']/i)?.[1] ?? "";
      return src ? `<img src="${src}" alt="${alt}">` : "";
    })
    .replace(/<a([^>]*)>([\s\S]*?)<\/a>/gi, (_: string, attrs: string, content: string) => {
      const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
      return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>` : content;
    })
    .replace(/<(\/?(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|b|i|br))[^>]*>/gi, "<$1>")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

// ─── OG meta extraction ──────────────────────────────────────────────────────

interface OGMeta {
  title: string | null;
  description: string | null;
  image: string | null;
  author: string | null;
  publishedTime: string | null;
  siteName: string | null;
}

function extractOGMeta(html: string): OGMeta {
  const metaRe = /<meta\s+([^>]+)>/gi;
  const metas: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const attrs = m[1];
    const prop =
      attrs.match(/\bproperty=["']([^"']+)["']/i)?.[1] ||
      attrs.match(/\bname=["']([^"']+)["']/i)?.[1];
    const content = attrs.match(/\bcontent=["']([^"']+)["']/i)?.[1];
    if (prop && content) metas[prop.toLowerCase()] = content;
  }
  // Also check <link rel="image_src">
  const linkImage = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1];
  return {
    title: metas["og:title"] || metas["twitter:title"] || null,
    description: metas["og:description"] || metas["twitter:description"] || metas["description"] || null,
    image: metas["og:image"] || metas["og:image:url"] || metas["twitter:image"] || metas["twitter:image:src"] || linkImage || null,
    author: metas["article:author"] || metas["author"] || null,
    publishedTime: metas["article:published_time"] || metas["article:modified_time"] || null,
    siteName: metas["og:site_name"] || null,
  };
}

// ─── Utilities: URL normalization & image reachability ───────────────────────

function toAbsoluteUrl(base: string, url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

async function isImageReachable(url: string): Promise<boolean> {
  // Try HEAD first; if not allowed, try GET with range. Retry up to 3 times with backoff.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000 + attempt * 2000);
      // Some servers block HEAD; use HEAD first, fallback to GET range if it fails.
      let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        // Try a small GET
        const controller2 = new AbortController();
        const timer2 = setTimeout(() => controller2.abort(), 8000 + attempt * 2000);
        res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: controller2.signal });
        clearTimeout(timer2);
      }
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.startsWith('image')) return true;
      // otherwise treat as unreachable and retry
    } catch {
      // swallow and retry
    }
    // exponential backoff
    await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
  }
  return false;
}

// ─── Article body extraction ─────────────────────────────────────────────────

const NOISE_PATTERNS = /^(advertisement|subscribe|follow us|read more|sign up for|newsletter|cookie policy|copyright|all rights reserved|terms of|privacy policy|share this|related articles|you may also like)/i;

function extractArticleHtml(html: string): string | null {
  // Prefer <article>, then common content class patterns, then <main>
  const body =
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[0] ||
    html.match(/<div[^>]+class="[^"]*(?:article-body|post-content|entry-content|article-content|story-body|news-body|content-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[0] ||
    html.match(/<div[^>]+(?:id|class)="[^"]*(?:content|article|post|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[0] ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[0] ||
    html;

  const sanitized = sanitizeHtml(body);
  const elements: string[] = [];
  const elementRe = /<(p|h[1-6]|ul|ol|blockquote)([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = elementRe.exec(sanitized)) !== null) {
    const tag = match[1];
    const full = match[0];
    const text = full.replace(/<[^>]+>/g, "").trim();
    if (tag === "p" && text.length < 25) continue;
    if (NOISE_PATTERNS.test(text)) continue;
    elements.push(full);
    if (elements.length >= 50) break;
  }
  return elements.length > 0 ? elements.join("\n") : null;
}

// ─── Per-article enrichment ──────────────────────────────────────────────────

export interface EnrichedArticle {
  content: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  og_description: string | null;
}

export async function fetchAndEnrichArticle(url: string, existingImage: string | null): Promise<EnrichedArticle> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BarakahNewsBot/2.0; +https://barakah.app)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { content: null, image_url: existingImage, author: null, published_at: null, og_description: null };

    const html = await res.text();
    const og = extractOGMeta(html);
    const articleHtml = extractArticleHtml(html);

    return {
      content: articleHtml,
      image_url: og.image || existingImage,
      author: og.author || null,
      published_at: og.publishedTime ? new Date(og.publishedTime).toISOString() : null,
      og_description: og.description || null,
    };
  } catch {
    return { content: null, image_url: existingImage, author: null, published_at: null, og_description: null };
  }
}

// ─── RSS image extraction ─────────────────────────────────────────────────────

function extractImage(itemXml: string): string | null {
  // Prefer media:content, then media:thumbnail, then enclosure, then first img in content
  const mediaContent = pickAttr(itemXml, "media:content", "url");
  if (mediaContent) return mediaContent;
  const mediaThumb = pickAttr(itemXml, "media:thumbnail", "url");
  if (mediaThumb) return mediaThumb;
  const enclosure = pickAttr(itemXml, "enclosure", "url");
  if (enclosure) return enclosure;
  const html = pick(itemXml, "content:encoded") || pick(itemXml, "description") || "";
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

// ─── RSS parser ───────────────────────────────────────────────────────────────

interface ParsedItem {
  guid: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  article_url: string;
  published_at: string | null;
  author: string | null;
  tags: string[];
}

function parseRss(xml: string): ParsedItem[] {
  const itemBlocks =
    xml.match(/<item[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ||
    [];
  const items: ParsedItem[] = [];
  for (const block of itemBlocks) {
    const title = pick(block, "title") || "";
    let link = pick(block, "link");
    if (!link) link = pickAttr(block, "link", "href");
    if (!title || !link) continue;
    const guid = pick(block, "guid") || pick(block, "id") || link;
    const description = stripHtml(pick(block, "description") || pick(block, "summary"));
    // Preserve full HTML from content:encoded — just sanitize it
    const rawContent = pick(block, "content:encoded") || pick(block, "content") || null;
    const content = rawContent ? sanitizeHtml(rawContent) : null;
    const pub = pick(block, "pubDate") || pick(block, "published") || pick(block, "updated");
    const author = stripHtml(pick(block, "dc:creator") || pick(block, "author"));
    const tags = pickAll(block, "category").filter(Boolean).slice(0, 10);
    items.push({
      guid,
      title,
      description,
      content,
      image_url: extractImage(block),
      article_url: link,
      published_at: pub ? new Date(pub).toISOString() : null,
      author,
      tags,
    });
  }
  return items;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: sources, error: srcErr } = await supabase
      .from("news_sources")
      .select("name, rss_url, category")
      .eq("is_active", true);
    if (srcErr) throw srcErr;

    let totalInserted = 0;
    const results: Record<string, number | string> = {};

    for (const src of sources ?? []) {
      try {
        const res = await fetch(src.rss_url, {
          headers: { "User-Agent": "BarakahNewsBot/2.0" },
        });
        if (!res.ok) {
          results[src.name] = `HTTP ${res.status}`;
          continue;
        }
        const xml = await res.text();
        const items = parseRss(xml);
        const rows = [];

        for (const it of items) {
          const rssTextLength = `${it.description ?? ""} ${it.content?.replace(/<[^>]+>/g, "") ?? ""}`.trim().length;
          // Start with RSS-provided candidates
          let enriched: EnrichedArticle = {
            content: it.content,
            image_url: it.image_url,
            author: it.author,
            published_at: it.published_at,
            og_description: null,
          };

          // Always try to enrich from the article page to prefer publisher's OG/twitter images
          try {
            const fetched = await fetchAndEnrichArticle(it.article_url, it.image_url);

            // Normalize image URLs and validate reachability
            if (fetched.image_url) {
              const abs = toAbsoluteUrl(it.article_url, fetched.image_url) || fetched.image_url;
              if (await isImageReachable(abs)) {
                fetched.image_url = abs;
              } else {
                // fallback to RSS candidate
                const rssImg = it.image_url;
                if (rssImg) {
                  const absRss = toAbsoluteUrl(it.article_url, rssImg) || rssImg;
                  fetched.image_url = (await isImageReachable(absRss)) ? absRss : null;
                } else {
                  fetched.image_url = null;
                }
              }
            } else if (it.image_url) {
              const absRss = toAbsoluteUrl(it.article_url, it.image_url) || it.image_url;
              fetched.image_url = (await isImageReachable(absRss)) ? absRss : null;
            }

            enriched = {
              content: fetched.content || it.content,
              image_url: fetched.image_url || it.image_url,
              author: it.author || fetched.author,
              published_at: fetched.published_at || it.published_at,
              og_description: fetched.og_description,
            };
          } catch (e) {
            console.warn('Enrichment error for', it.article_url, (e as Error).message);
          }

          rows.push({
            guid: it.guid,
            title: it.title,
            description: enriched.og_description || it.description,
            content: enriched.content || (it.description ? `<p>${it.description}</p>` : null),
            image_url: enriched.image_url,
            article_url: it.article_url,
            published_at: it.published_at || enriched.published_at,
            author: enriched.author,
            tags: it.tags,
            source_name: src.name,
            category: src.category,
          });
        }

        if (rows.length) {
          const { error } = await supabase.from("news_articles").upsert(rows, { onConflict: "guid" });
          if (error) {
            results[src.name] = `DB: ${error.message}`;
            continue;
          }
        }
        results[src.name] = rows.length;
        totalInserted += rows.length;
      } catch (e) {
        results[src.name] = `ERR: ${(e as Error).message}`;
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalProcessed: totalInserted, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
