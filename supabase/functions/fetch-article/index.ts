import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const RequestSchema = z.object({
  url: z.string().url().min(1).max(2048),
})

function normalizeText(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function pickTag(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = html.match(re)
  return m ? normalizeText(m[1]) : null
}

function pickMeta(html: string, property: string): string | null {
  const re = new RegExp(`<meta[^>]*\\b(?:property|name)=["']${property}["'][^>]*\\bcontent=["']([^"']+)["']`, 'i')
  const m = html.match(re)
  return m ? decodeEntities(m[1]) : null
}

function pickLink(html: string, rel: string): string | null {
  const re = new RegExp(`<link[^>]*\\brel=["']${rel}["'][^>]*\\bhref=["']([^"']+)["']`, 'i')
  const m = html.match(re)
  return m ? decodeEntities(m[1]) : null
}

function toAbsoluteUrl(base: string, url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url, base).href
  } catch {
    return url
  }
}

function extractImage(html: string, baseUrl: string): string | null {
  return (
    toAbsoluteUrl(baseUrl, pickMeta(html, 'og:image')) ??
    toAbsoluteUrl(baseUrl, pickMeta(html, 'twitter:image')) ??
    toAbsoluteUrl(baseUrl, pickMeta(html, 'image')) ??
    null
  )
}

function extractTitle(html: string): string | null {
  return (
    pickMeta(html, 'og:title') ??
    pickMeta(html, 'twitter:title') ??
    pickTag(html, 'title') ??
    null
  )
}

function extractDescription(html: string): string | null {
  return (
    pickMeta(html, 'og:description') ??
    pickMeta(html, 'twitter:description') ??
    pickMeta(html, 'description') ??
    null
  )
}

function extractAuthor(html: string): string | null {
  return (
    pickMeta(html, 'author') ??
    pickMeta(html, 'article:author') ??
    null
  )
}

function extractPublishedAt(html: string): string | null {
  const raw =
    pickMeta(html, 'article:published_time') ??
    pickMeta(html, 'published_time') ??
    pickMeta(html, 'datePublished') ??
    pickMeta(html, 'publish-date') ??
    null
  if (!raw) return null
  try {
    return new Date(raw).toISOString()
  } catch {
    return null
  }
}

function extractArticleContent(html: string, baseUrl: string): string | null {
  const body =
    html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>[\s\S]*?<\/div>/i)?.[0] ??
    html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>[\s\S]*?<\/div>/i)?.[0] ??
    html.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>[\s\S]*?<\/div>/i)?.[0] ??
    html

  const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => normalizeText(m[1]))
    .filter(
      (p) =>
        p.length > 45 &&
        !/^(advertisement|subscribe|follow us|read more|share this|related articles|comments|newsletter|sign up|login|register|privacy policy|terms of service)$/i.test(
          p
        )
    )

  if (!paragraphs.length) return null
  return paragraphs.map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}</p>`).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { url } = parsed.data

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'BarakahNewsBot/1.0 (+https://barakah.app)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch article: HTTP ${res.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const html = await res.text()
    const content = extractArticleContent(html, url)
    const title = extractTitle(html)
    const description = extractDescription(html)
    const imageUrl = extractImage(html, url)
    const author = extractAuthor(html)
    const publishedAt = extractPublishedAt(html)

    if (!content && !title && !description) {
      return new Response(
        JSON.stringify({ error: 'Unable to extract article content from the provided URL' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        url,
        title,
        description,
        author,
        published_at: publishedAt,
        image_url: imageUrl,
        content,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
