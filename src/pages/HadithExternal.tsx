import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Loader2 } from 'lucide-react';
import { HADITH_BOOKS } from './Hadith';

const CREAM = '#FFF5E5';
const BROWN_ACCENT = '#B0431E';
const HERO_GRAD = 'linear-gradient(177deg, #78351A 2.14%, #CE5728 97.86%)';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// Maps our internal slugs to the URL segment used by sunnah.com.
const SUNNAH_PATH: Record<string, string> = {
  riyadussalihin: 'riyadussalihin',
  adab: 'adab',
  shamail: 'shamail',
};

export const HadithExternal = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const book = useMemo(() => {
    for (const g of HADITH_BOOKS) {
      const b = g.books.find((x) => x.slug === slug);
      if (b) return b;
    }
    return null;
  }, [slug]);

  const path = slug ? SUNNAH_PATH[slug] : undefined;
  const proxyUrl = path
    ? `${SUPABASE_URL}/functions/v1/hadith-proxy?path=${encodeURIComponent(path)}`
    : null;

  if (!book || !proxyUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <button onClick={() => navigate('/hadith')} className="underline">Back to Hadith</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <div className="px-5 pt-12 pb-6" style={{ background: HERO_GRAD, color: '#FFF5E5' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/hadith')}
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,245,229,0.18)' }}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1
            className="text-[16px] text-center px-2 flex-1 truncate"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
          >
            {book.name}
          </h1>
          <a
            href={`https://sunnah.com/${path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,245,229,0.18)' }}
            aria-label="Open in browser"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="flex-1 relative" style={{ background: CREAM }}>
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color: BROWN_ACCENT }}
          >
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-[13px]">Loading book…</span>
          </div>
        )}
        <iframe
          key={proxyUrl}
          src={proxyUrl}
          title={book.name}
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 96px)', background: CREAM }}
          sandbox="allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
};

export default HadithExternal;