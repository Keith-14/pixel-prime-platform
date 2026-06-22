import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Search, Loader2 } from 'lucide-react';
import { HADITH_BOOKS } from './Hadith';

const CREAM = '#FFF5E5';
const BROWN = '#2C1309';
const BROWN_ACCENT = '#B0431E';
const HERO_GRAD = 'linear-gradient(177deg, #78351A 2.14%, #CE5728 97.86%)';

type Hadith = {
  hadithnumber: number | string;
  arabicnumber?: number | string;
  text: string;
  reference?: { book?: number; hadith?: number };
};

type Edition = {
  metadata: { name: string; section?: Record<string, string> };
  hadiths: Hadith[];
};

const PAGE_SIZE = 25;

export const HadithBook = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const book = useMemo(() => {
    for (const g of HADITH_BOOKS) {
      const b = g.books.find((x) => x.slug === slug);
      if (b) return b;
    }
    return null;
  }, [slug]);

  const [data, setData] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!book?.edition) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${book.edition}.min.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed (${r.status})`);
        return r.json();
      })
      .then((j: Edition) => {
        if (cancel) return;
        // Many editions (e.g. eng-muslim) include placeholder entries with
        // empty text. Filter them out so the list only shows real hadiths
        // while preserving original hadith numbers.
        const cleaned: Edition = {
          ...j,
          hadiths: (j.hadiths || []).filter(
            (h) => typeof h.text === 'string' && h.text.trim().length > 0,
          ),
        };
        setData(cleaned);
      })
      .catch((e) => {
        if (cancel) return;
        setError(e?.message || 'Could not load this book.');
      })
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [book?.edition]);

  const filtered = useMemo(() => {
    if (!data) return [] as Hadith[];
    if (!query.trim()) return data.hadiths;
    const q = query.trim().toLowerCase();
    return data.hadiths.filter(
      (h) => String(h.hadithnumber).includes(q) || h.text.toLowerCase().includes(q),
    );
  }, [data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM, color: BROWN }}>
        <div className="text-center">
          <p className="mb-3">Book not found.</p>
          <button onClick={() => navigate('/hadith')} className="underline">Back to Hadith</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: CREAM }}>
      <div className="px-5 pt-12 pb-8" style={{ background: HERO_GRAD, color: '#FFF5E5' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/hadith')}
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,245,229,0.18)' }}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[17px] text-center px-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
            {book.name}
          </h1>
          <div className="w-10" />
        </div>
        {data && (
          <p className="mt-2 text-[12px] opacity-90 text-center">
            {data.hadiths.length.toLocaleString()} hadith
          </p>
        )}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: 'rgba(255,245,229,0.18)' }}>
          <Search className="h-4 w-4 opacity-80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by number or text"
            className="bg-transparent flex-1 outline-none placeholder:opacity-70 text-[13px]"
            style={{ color: '#FFF5E5' }}
          />
        </div>
      </div>

      <div
        className="relative px-5 pt-5"
        style={{ background: CREAM, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -20 }}
      >
        {loading && (
          <div className="flex items-center justify-center py-16" style={{ color: BROWN }}>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading book…</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border p-4 text-[13px]" style={{ borderColor: 'rgba(232,213,196,0.86)', color: BROWN }}>
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="space-y-3">
              {slice.map((h) => (
                <div
                  key={String(h.hadithnumber)}
                  className="rounded-2xl border p-4"
                  style={{ background: '#FFF5E5', borderColor: 'rgba(232,213,196,0.86)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(120,53,26,0.08)', color: BROWN_ACCENT, fontWeight: 700 }}
                    >
                      #{h.hadithnumber}
                    </span>
                  </div>
                  <p className="text-[14px] leading-[1.65]" style={{ color: BROWN, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {h.text}
                  </p>
                </div>
              ))}
              {slice.length === 0 && (
                <div className="text-center py-10 text-[13px]" style={{ color: BROWN }}>
                  No hadith match your search.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-full border text-[13px] disabled:opacity-40"
                  style={{ borderColor: 'rgba(232,213,196,0.86)', color: BROWN, fontWeight: 600 }}
                >
                  Previous
                </button>
                <span className="text-[12px]" style={{ color: BROWN }}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-full text-[13px] disabled:opacity-40"
                  style={{ background: HERO_GRAD, color: '#FFF5E5', fontWeight: 600 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HadithBook;