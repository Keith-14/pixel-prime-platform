import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Flashlight, ScanLine, Check, Shield, Sparkles,
  ChevronLeft, ChevronRight, ExternalLink, X, Keyboard,
  AlertTriangle, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalLocation } from '@/contexts/LocationContext';
import scannerAlt1 from '@/assets/scanner-alt-1.jpg';
import scannerAlt2 from '@/assets/scanner-alt-2.jpg';
import { supabase } from '@/integrations/supabase/client';

// ─── Design tokens ────────────────────────────────────────────────────────────
const CREAM_BG = '#FFF5E5';
const CARD_CREAM = '#FBE6C8';
const BROWN = '#2C1309';
const BROWN_BTN = '#6B3520';
const MUTED = '#8A6A55';
const SERIF = "'Plus Jakarta Sans', sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
type HalalStatus = 'halal' | 'haram' | 'mushbooh' | 'unknown';

type ScanResult = {
  product_name: string;
  brand: string | null;
  status: HalalStatus;
  confidence: number | null;
  verdict: string | null;
  category: string | null;
  region: string | null;
  ingredients: Array<{ name: string; ok: boolean; note?: string | null }>;
  source?: string | null;
};

const ALTERNATIVES = [
  { brand: 'MEDINA ORGANICS', name: 'Medina Date Crisps', price: '$12.50', rating: '4.9', image: scannerAlt1 },
  { brand: 'PERSIAN HOUSE', name: 'Saffron Shortbread', price: '$14.00', rating: '4.8', image: scannerAlt2 },
];

// ─── Native BarcodeDetector ambient declaration ───────────────────────────────
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

const NATIVE_BARCODE_FORMATS = [
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93',
  'itf', 'codabar', 'qr_code', 'data_matrix', 'pdf417',
];

// ─── Camera helpers ───────────────────────────────────────────────────────────
async function openCamera(): Promise<MediaStream> {
  const strategies: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { facingMode: 'environment' } },
    { video: { facingMode: { ideal: 'environment' } } },
    { video: true },
  ];
  let lastErr: unknown;
  for (const c of strategies) {
    try { return await navigator.mediaDevices.getUserMedia(c); }
    catch (e) {
      lastErr = e;
      const n = (e as DOMException)?.name;
      if (n === 'NotAllowedError' || n === 'PermissionDeniedError') throw e;
    }
  }
  throw lastErr;
}

// ─── Main component ───────────────────────────────────────────────────────────
export const HalalScanner = () => {
  const navigate = useNavigate();
  const { location } = useGlobalLocation();

  const [view, setView] = useState<'scan' | 'result'>('scan');
  const [scanning, setScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  // Refs for camera & detector lifecycle
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const zxingReaderRef = useRef<any | null>(null);  // BrowserMultiFormatReader when loaded
  const useZXingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const handlingScanRef = useRef(false);

  // ── Stop camera & scan loop ──
  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ── Capture frame as base64 ──
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.82);
  }, []);

  // ── Analyze a found barcode via Supabase ──
  const analyzeBarcode = useCallback(async (barcode: string) => {
    if (!barcode || handlingScanRef.current) return;
    handlingScanRef.current = true;
    stopCamera();
    setScanning(false);
    setError(null);
    setAnalyzing(true);
    setLastBarcode(barcode);
    setScanResult(null);
    const imageBase64 = captureFrame();

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('scan-halal', {
        body: {
          barcode,
          ...(location ? { region: [location.city, location.country].filter(Boolean).join(', ') } : {}),
          ...(imageBase64 ? { imageBase64, imageMimeType: 'image/jpeg' } : {}),
        },
      });
      if (invokeError) throw invokeError;
      const result = data?.result;
      if (!result) throw new Error('No scan result returned');
      if (result.source === 'barcode_lookup_miss') {
        throw new Error('Barcode detected but no product data found. Try the ingredient label or enter manually.');
      }
      if (!mountedRef.current) return;
      setScanResult({
        product_name: result.product_name || 'Unknown Product',
        brand: result.brand ?? null,
        status: result.status || 'unknown',
        confidence: typeof result.confidence === 'number' ? result.confidence : null,
        verdict: result.verdict ?? null,
        category: result.category ?? null,
        region: result.region ?? null,
        ingredients: Array.isArray(result.ingredients) ? result.ingredients : [],
        source: result.source ?? null,
      });
      setView('result');
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || 'Could not analyze this barcode. Please try again.');
      setView('scan');
    } finally {
      handlingScanRef.current = false;
      if (mountedRef.current) setAnalyzing(false);
    }
  }, [captureFrame, location, stopCamera]);

  // ── Scan loop — runs on every animation frame ──
  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !mountedRef.current) return;

    const ready = video.readyState >= 2 && video.videoWidth > 0;

    if (ready) {
      if (useZXingRef.current && zxingReaderRef.current && canvas) {
        // ── ZXing fallback path (iOS < 17.4) ──
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          try {
            const result = zxingReaderRef.current.decodeFromCanvas(canvas);
            if (result && !handlingScanRef.current) {
              const text = result.getText();
              if (text) { analyzeBarcode(text.replace(/\D/g, '').trim() || text.trim()); return; }
            }
          } catch {
            // NotFoundException is thrown when no barcode found — this is normal
          }
        }
        rafRef.current = requestAnimationFrame(scanLoop);
      } else if (!useZXingRef.current && detectorRef.current) {
        // ── Native BarcodeDetector path (iOS 17.4+) ──
        detectorRef.current.detect(video).then((results) => {
          if (!mountedRef.current || handlingScanRef.current) return;
          if (results.length > 0) {
            const raw = results[0].rawValue;
            if (raw) { analyzeBarcode(raw.replace(/\D/g, '').trim() || raw.trim()); return; }
          }
          rafRef.current = requestAnimationFrame(scanLoop);
        }).catch(() => { if (mountedRef.current) rafRef.current = requestAnimationFrame(scanLoop); });
      }
    } else {
      rafRef.current = requestAnimationFrame(scanLoop);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start scanning ──
  const startScanning = useCallback(async () => {
    setError(null);
    stopCamera();

    try {
      const stream = await openCamera();
      streamRef.current = stream;
      if (!mountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }

      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.autoplay = true;
      await video.play().catch(() => {});

      // Wait for video to have dimensions
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) { resolve(); return; }
        const onReady = () => { video.removeEventListener('canplay', onReady); resolve(); };
        video.addEventListener('canplay', onReady);
        setTimeout(resolve, 3000);
      });

      if (!mountedRef.current) return;

      // ── Choose detector ──
      if ('BarcodeDetector' in window) {
        // Native API available (iOS 17.4+, Chrome, Edge)
        detectorRef.current = new BarcodeDetector({ formats: NATIVE_BARCODE_FORMATS });
        useZXingRef.current = false;
      } else {
        // Dynamically import ZXing as fallback (iOS 15–17.3)
        try {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          zxingReaderRef.current = new BrowserMultiFormatReader();
          useZXingRef.current = true;
        } catch {
          setError('Barcode scanning failed to initialise. Please enter the barcode manually.');
          stopCamera();
          return;
        }
      }

      setScanning(true);
      rafRef.current = requestAnimationFrame(scanLoop);

    } catch (err: any) {
      if (!mountedRef.current) return;
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Camera access was denied. Go to Settings → Privacy → Camera and allow access, then try again.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No camera found on this device. Please enter the barcode manually.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('Camera is in use by another app. Close other apps and try again.');
      } else {
        setError('Camera could not start. Please try again or enter the barcode manually.');
      }
      setScanning(false);
    }
  }, [scanLoop, stopCamera]);

  const stopScanning = useCallback(() => {
    stopCamera();
    setScanning(false);
  }, [stopCamera]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; stopCamera(); };
  }, [stopCamera]);

  const handleScanAnother = () => {
    setScanResult(null); setLastBarcode(null); setError(null); setView('scan');
  };

  const handleManualSubmit = () => {
    const barcode = manualBarcode.replace(/\D/g, '').trim();
    if (!barcode) { setError('Please enter a valid barcode number.'); return; }
    setManualOpen(false);
    setManualBarcode('');
    analyzeBarcode(barcode);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto" style={{ backgroundColor: CREAM_BG, color: BROWN }}>
      {/* Hidden canvas for frame capture & ZXing decoding */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {view === 'scan' ? (
        <ScanView
          onBack={() => navigate('/')}
          videoRef={videoRef}
          scanning={scanning}
          error={error}
          analyzing={analyzing}
          startScanning={startScanning}
          stopScanning={stopScanning}
          manualOpen={manualOpen}
          manualBarcode={manualBarcode}
          setManualOpen={setManualOpen}
          setManualBarcode={setManualBarcode}
          onManualSubmit={handleManualSubmit}
        />
      ) : (
        <ResultView
          onBack={() => navigate('/')}
          onScanAnother={handleScanAnother}
          result={scanResult}
          barcode={lastBarcode}
        />
      )}
    </div>
  );
};

// ─── Scan View ────────────────────────────────────────────────────────────────
const ScanView = ({
  onBack, videoRef, scanning, error, analyzing,
  startScanning, stopScanning, manualOpen, manualBarcode,
  setManualOpen, setManualBarcode, onManualSubmit,
}: {
  onBack: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  scanning: boolean;
  error: string | null;
  analyzing: boolean;
  startScanning: () => void;
  stopScanning: () => void;
  manualOpen: boolean;
  manualBarcode: string;
  setManualOpen: (open: boolean) => void;
  setManualBarcode: (v: string) => void;
  onManualSubmit: () => void;
}) => {
  useEffect(() => {
    startScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-5 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center -ml-1" aria-label="Back">
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} style={{ color: BROWN }} />
        </button>
        <h1 className="italic text-[17px] tracking-tight" style={{ fontFamily: SERIF, color: BROWN }}>
          Ingredient Scanner
        </h1>
        <div className="h-9 w-9" />
      </div>

      {/* Camera viewport */}
      <div
        className="relative w-full rounded-[28px] overflow-hidden mb-6"
        style={{ aspectRatio: '4 / 5', backgroundColor: '#1A1008' }}
      >
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

        {/* Live video feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Scan-line animation */}
        {scanning && (
          <div
            className="absolute left-6 right-6 h-[2px] z-10 animate-[scanline_2s_ease-in-out_infinite]"
            style={{ background: 'rgba(220,38,38,0.9)' }}
          />
        )}

        {/* Idle placeholder */}
        {!scanning && !analyzing && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <ScanLine className="h-14 w-14 text-white" strokeWidth={1} />
              <span className="text-[13px] text-white">Tap the button to start</span>
            </div>
          </div>
        )}

        {/* Analyzing overlay */}
        {analyzing && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="h-10 w-10 text-white animate-pulse" strokeWidth={1.5} />
              <span className="text-[13px] text-white font-medium">Analyzing with Barakah AI…</span>
            </div>
          </div>
        )}
      </div>

      {/* Caption */}
      <p className="text-center text-[15px] leading-snug" style={{ color: BROWN }}>
        Point camera at any barcode or ingredient list
      </p>
      <p className="text-center text-[13px] mt-1" style={{ color: MUTED }}>
        {analyzing ? 'Analyzing barcode with Barakah AI...' : 'Hold steady for best results'}
      </p>

      {/* Scan toggle button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={scanning ? stopScanning : startScanning}
          disabled={analyzing}
          className="h-14 w-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-60"
          style={{ backgroundColor: BROWN_BTN }}
          aria-label={scanning ? 'Stop scan' : 'Start scan'}
        >
          {analyzing
            ? <Sparkles className="h-6 w-6 text-white animate-pulse" strokeWidth={1.75} />
            : <Flashlight className="h-6 w-6 text-white" strokeWidth={1.75} />}
        </button>
      </div>

      <button
        onClick={() => setManualOpen(true)}
        disabled={analyzing}
        className="mx-auto mt-4 min-h-11 px-5 rounded-full text-[14px] font-semibold inline-flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60"
        style={{ color: BROWN_BTN, backgroundColor: '#FFF8EC', borderColor: '#D8B991' }}
      >
        <Keyboard className="h-4 w-4" strokeWidth={1.9} />
        Enter barcode manually
      </button>

      {error && (
        <p className="text-center text-sm mt-4 px-4 leading-snug" style={{ color: '#B22222' }}>{error}</p>
      )}

      {/* How it works */}
      <div className="mt-7 rounded-2xl px-5 py-5" style={{ backgroundColor: CARD_CREAM }}>
        <h3 className="italic text-[15px] mb-4" style={{ fontFamily: SERIF, color: BROWN }}>How it works</h3>
        <div className="flex items-start justify-between gap-2">
          <Step n={1} label="Point" />
          <Dashes />
          <Step n={2} label="Scan" />
          <Dashes />
          <Step n={3} label={'See\nresult'} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 text-[13px]" style={{ color: MUTED }}>
        <button>Report an issue</button>
        <span className="opacity-50">•</span>
        <button>Help Center</button>
      </div>

      {/* Manual barcode sheet */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4" onClick={() => setManualOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-[28px] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-xl"
            style={{ backgroundColor: '#FFF5E5', border: '1px solid #E4C49B' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full" style={{ backgroundColor: '#D8B991' }} />
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#F1D8B7' }}>
                  <Keyboard className="h-5 w-5" style={{ color: BROWN_BTN }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[18px] font-semibold" style={{ color: BROWN }}>Enter barcode number</h2>
                  <p className="text-[12px] leading-tight mt-0.5" style={{ color: MUTED }}>Use the digits printed below the barcode.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                style={{ color: BROWN_BTN, backgroundColor: '#F6E4CC' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block text-[12px] font-semibold mb-2 px-1" style={{ color: BROWN }}>Barcode</label>
            <div className="flex items-center gap-2 rounded-2xl border px-4" style={{ backgroundColor: '#FFFDF7', borderColor: '#D8B991' }}>
              <Input
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') onManualSubmit(); }}
                placeholder="8901234567890"
                className="h-16 flex-1 border-0 bg-transparent px-0 text-[20px] font-semibold tracking-wide text-[#2C1309] caret-[#6B3520] placeholder:text-[#B9A286] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {manualBarcode && (
                <button type="button" onClick={() => setManualBarcode('')}
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F6E4CC', color: BROWN_BTN }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-2 px-1 text-[11px]" style={{ color: MUTED }}>Usually 8 to 14 digits.</div>
            <Button
              type="button"
              onClick={onManualSubmit}
              disabled={!manualBarcode || analyzing}
              className="mt-5 h-14 w-full rounded-full text-white font-semibold disabled:opacity-60"
              style={{ backgroundColor: BROWN_BTN }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Barcode'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const map = {
    tl: 'top-3 left-3 border-t-2 border-l-2 rounded-tl-md',
    tr: 'top-3 right-3 border-t-2 border-r-2 rounded-tr-md',
    bl: 'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-md',
    br: 'bottom-3 right-3 border-b-2 border-r-2 rounded-br-md',
  };
  return <div className={`absolute w-6 h-6 z-20 border-[#B5662C] ${map[pos]}`} />;
};

const Step = ({ n, label }: { n: number; label: string }) => (
  <div className="flex flex-col items-center gap-2 w-[64px]">
    <div className="relative">
      <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EAD3AE' }}>
        {n === 1 && <ScanLine className="h-5 w-5" style={{ color: BROWN }} strokeWidth={1.75} />}
        {n === 2 && <Flashlight className="h-5 w-5" style={{ color: BROWN }} strokeWidth={1.75} />}
        {n === 3 && <Check className="h-5 w-5" style={{ color: BROWN }} strokeWidth={2} />}
      </div>
      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center" style={{ backgroundColor: BROWN_BTN }}>
        {n}
      </div>
    </div>
    <span className="text-[12px] text-center leading-tight whitespace-pre-line" style={{ color: BROWN }}>{label}</span>
  </div>
);

const Dashes = () => (
  <div className="flex-1 mt-6 border-t border-dashed" style={{ borderColor: '#C9A77A' }} />
);

// ─── Result View ──────────────────────────────────────────────────────────────
const statusConfig: Record<HalalStatus, {
  label: string; title: string; subtitle: string;
  bgColor: string; iconBg: string;
  icon: 'check' | 'x' | 'alert' | 'help';
}> = {
  halal: {
    label: 'HALAL',
    title: 'Halal Verified',
    subtitle: 'This product is permissible under Islamic dietary law.',
    bgColor: '#1A6B3A', iconBg: 'rgba(255,255,255,0.25)', icon: 'check',
  },
  haram: {
    label: 'HARAM',
    title: 'Not Permissible',
    subtitle: 'This product contains prohibited or high-risk ingredients.',
    bgColor: '#991B1B', iconBg: 'rgba(255,255,255,0.25)', icon: 'x',
  },
  mushbooh: {
    label: 'MUSHBOOH',
    title: 'Doubtful — Verify',
    subtitle: 'Some ingredients require further verification.',
    bgColor: '#92400E', iconBg: 'rgba(255,255,255,0.25)', icon: 'alert',
  },
  unknown: {
    label: 'UNKNOWN',
    title: 'Status Unknown',
    subtitle: 'Barakah AI could not determine the halal status.',
    bgColor: '#4B3B2F', iconBg: 'rgba(255,255,255,0.25)', icon: 'help',
  },
};

const ResultView = ({
  onBack, onScanAnother, result, barcode,
}: {
  onBack: () => void;
  onScanAnother: () => void;
  result: ScanResult | null;
  barcode: string | null;
}) => {
  const status = result?.status || 'unknown';
  const cfg = statusConfig[status] || statusConfig.unknown;
  const ingredients = result?.ingredients ?? [];

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center -ml-1" aria-label="Back">
          <ArrowLeft className="h-5 w-5" style={{ color: BROWN }} strokeWidth={1.75} />
        </button>
        <h1 className="italic text-[17px]" style={{ fontFamily: SERIF, color: BROWN }}>Barakah</h1>
        <div className="h-9 w-9" />
      </div>

      {/* ── VERDICT BANNER ── */}
      <div className="px-5">
        <div
          className="rounded-3xl px-6 py-8 flex flex-col items-center text-center relative overflow-hidden"
          style={{ backgroundColor: cfg.bgColor }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20 bg-white" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10 bg-white" />

          {/* Icon */}
          <div className="relative z-10 h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: cfg.iconBg }}>
            {cfg.icon === 'check' && <Check className="h-9 w-9 text-white" strokeWidth={3} />}
            {cfg.icon === 'x' && <X className="h-9 w-9 text-white" strokeWidth={3} />}
            {cfg.icon === 'alert' && <AlertTriangle className="h-9 w-9 text-white" strokeWidth={2.5} />}
            {cfg.icon === 'help' && <HelpCircle className="h-9 w-9 text-white" strokeWidth={2} />}
          </div>

          {/* Large verdict word */}
          <div className="relative z-10 text-[44px] font-black tracking-[0.12em] leading-none text-white" style={{ fontFamily: SERIF }}>
            {cfg.label}
          </div>

          {/* Title */}
          <div className="relative z-10 text-[16px] font-semibold mt-2 text-white/90" style={{ fontFamily: SERIF }}>
            {cfg.title}
          </div>

          {/* Subtitle */}
          <div className="relative z-10 text-[12px] mt-1 leading-snug max-w-[240px] text-white/75">
            {cfg.subtitle}
          </div>

          {/* Pills */}
          <div className="relative z-10 flex items-center gap-2 mt-4 flex-wrap justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <Shield className="h-3 w-3" strokeWidth={2} />
              Verified by Barakah AI
            </div>
            {typeof result?.confidence === 'number' && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                {result.confidence}% confidence
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scan another */}
      <div className="px-5 mt-5">
        <button
          onClick={onScanAnother}
          className="w-full rounded-full py-3.5 text-white text-[13px] font-semibold tracking-[0.14em] flex items-center justify-center gap-2 shadow-sm"
          style={{ backgroundColor: BROWN_BTN }}
        >
          <ScanLine className="h-4 w-4" strokeWidth={2} />
          SCAN ANOTHER PRODUCT
        </button>
      </div>

      {/* Product name */}
      <h2 className="px-5 mt-5 text-center italic text-[28px] leading-tight" style={{ fontFamily: SERIF, color: BROWN }}>
        {result?.product_name || 'Unknown Product'}
      </h2>
      {(result?.brand || barcode) && (
        <p className="px-5 mt-2 text-center text-[13px]" style={{ color: MUTED }}>
          {[result?.brand, barcode ? `Barcode ${barcode}` : null].filter(Boolean).join(' — ')}
        </p>
      )}

      {/* Verified pill */}
      <div className="flex justify-center mt-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium" style={{ backgroundColor: '#F2E2A6', color: '#5C4710' }}>
          <Shield className="h-3.5 w-3.5" strokeWidth={2} />
          Verified by Barakah
        </div>
      </div>

      {result?.verdict && (
        <p className="px-7 mt-4 text-center text-[14px] leading-relaxed" style={{ color: BROWN }}>{result.verdict}</p>
      )}

      {/* Ingredients */}
      <div className="px-5 mt-7 flex items-end justify-between">
        <h3 className="italic text-[22px] leading-tight" style={{ fontFamily: SERIF, color: BROWN }}>
          Detailed<br />Ingredients
        </h3>
        <div className="text-right">
          <div className="text-[18px] font-semibold" style={{ color: BROWN }}>{ingredients.length}</div>
          <div className="text-[10px] tracking-[0.2em]" style={{ color: MUTED }}>INGREDIENTS<br />SCANNED</div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: CARD_CREAM }}>
          {ingredients.length > 0 && (
            <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-3 border-l-4" style={{ backgroundColor: '#FFF4DA', borderColor: BROWN_BTN }}>
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: BROWN_BTN }} strokeWidth={2} />
              <div className="flex-1">
                <div className="text-[10px] tracking-[0.18em] font-semibold" style={{ color: BROWN_BTN }}>KEY INGREDIENT</div>
                <div className="italic text-[15px]" style={{ fontFamily: SERIF, color: BROWN }}>{ingredients[0]?.name}</div>
              </div>
              <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#A35233' }}>
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
          <ul className="divide-y" style={{ borderColor: 'rgba(139,90,43,0.15)' }}>
            {ingredients.length === 0 && (
              <li className="py-3 text-[14px]" style={{ color: MUTED }}>No ingredient list returned for this barcode.</li>
            )}
            {ingredients.map((ing, i) => (
              <li key={`${ing.name}-${i}`} className="flex items-center justify-between py-3">
                <div className="min-w-0 pr-3">
                  <span className="text-[14px] font-medium" style={{ color: BROWN }}>{ing.name}</span>
                  {ing.note && <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{ing.note}</p>}
                </div>
                {ing.ok
                  ? <Check className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2.5} />
                  : <X className="h-4 w-4 shrink-0 text-red-600" strokeWidth={2.5} />}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Halal Alternatives */}
      <div className="px-5 mt-10 flex items-start justify-between">
        <h3 className="italic text-[24px] leading-tight" style={{ fontFamily: SERIF, color: BROWN }}>
          Halal<br />Alternatives
        </h3>
        <div className="flex gap-1.5 mt-2">
          <button className="h-8 w-8 rounded-full border flex items-center justify-center" style={{ borderColor: '#C9A77A', color: BROWN }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 rounded-full border flex items-center justify-center" style={{ borderColor: '#C9A77A', color: BROWN }}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="px-5 mt-2 text-[13px]" style={{ color: MUTED }}>Recommended similar items from verified brands.</p>

      <div className="mt-4 flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {ALTERNATIVES.map((a) => (
          <div key={a.name} className="min-w-[78%] snap-start rounded-2xl overflow-hidden" style={{ backgroundColor: CARD_CREAM }}>
            <div className="relative">
              <img src={a.image} alt={a.name} className="w-full h-44 object-cover" loading="lazy" />
              <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold text-white px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(46,125,78,0.92)' }}>
                On Marketplace <ExternalLink className="h-3 w-3" />
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] tracking-[0.18em] font-semibold" style={{ color: BROWN_BTN }}>{a.brand}</div>
              <div className="text-[15px] font-semibold mt-1" style={{ color: BROWN }}>{a.name}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[15px] font-bold" style={{ color: BROWN }}>{a.price}</div>
                <div className="text-[12px]" style={{ color: BROWN }}>★ {a.rating}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Inject scanline keyframe once
if (typeof document !== 'undefined' && !document.getElementById('halal-scanner-keyframes')) {
  const s = document.createElement('style');
  s.id = 'halal-scanner-keyframes';
  s.innerHTML = `@keyframes scanline { 0%,100% { top: 18%; } 50% { top: 78%; } }`;
  document.head.appendChild(s);
}
