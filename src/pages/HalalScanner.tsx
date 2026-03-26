import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, ScanBarcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type HalalStatus = 'halal' | 'not_halal' | 'doubtful' | null;

// Simple mock database of barcodes - in production this would be an API call
const checkHalalStatus = (barcode: string): { status: HalalStatus; productName: string } => {
  // Simulate checking - even barcodes ending in 0,2,4 are halal, odd ending in 1,3 are not, others doubtful
  const lastDigit = parseInt(barcode.slice(-1));
  if ([0, 2, 4, 6, 8].includes(lastDigit)) {
    return { status: 'halal', productName: `Product #${barcode.slice(-6)}` };
  } else if ([1, 3].includes(lastDigit)) {
    return { status: 'not_halal', productName: `Product #${barcode.slice(-6)}` };
  }
  return { status: 'doubtful', productName: `Product #${barcode.slice(-6)}` };
};

export const HalalScanner = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ status: HalalStatus; productName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>('halal-scanner-reader');

  const startScanning = async () => {
    setResult(null);
    setError(null);

    try {
      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 200 },
        },
        (decodedText) => {
          const halalResult = checkHalalStatus(decodedText);
          setResult(halalResult);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {} // ignore scan failures
      );

      setScanning(true);
    } catch (err: any) {
      setError('Camera access denied. Please allow camera permissions.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const statusConfig = {
    halal: {
      label: 'HALAL',
      message: 'This item is Halal certified!\nMay Allah bless what you consume.',
      bgClass: 'bg-primary/20 border-primary/40',
      textClass: 'text-primary',
      badgeBg: 'bg-[#d4c9a8]/90 text-[#2d3a2e]',
      messageBg: 'bg-[#d4c9a8]/90',
    },
    not_halal: {
      label: 'NOT HALAL',
      message: 'This item is NOT Halal.\nPlease avoid consuming this product.',
      bgClass: 'bg-destructive/20 border-destructive/40',
      textClass: 'text-destructive',
      badgeBg: 'bg-destructive/20 text-destructive',
      messageBg: 'bg-destructive/10',
    },
    doubtful: {
      label: 'DOUBTFUL',
      message: 'The Halal status of this item is uncertain.\nWhen in doubt, leave it out.',
      bgClass: 'bg-yellow-500/20 border-yellow-500/40',
      textClass: 'text-yellow-500',
      badgeBg: 'bg-yellow-500/20 text-yellow-600',
      messageBg: 'bg-yellow-500/10',
    },
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center px-5 py-6 pb-32 font-arabic">
        {/* Back button */}
        <div className="w-full flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-foreground hover:bg-primary/8 rounded-xl h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground text-center mb-1">
          Scan a product barcode
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Check if the product is Halal
        </p>

        {/* Scanner viewfinder */}
        <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-[#d4c9a8]/40 bg-[#d4c9a8]/10 mb-6">
          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-primary/70 rounded-tl-md z-10" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary/70 rounded-tr-md z-10" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-primary/70 rounded-bl-md z-10" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-primary/70 rounded-br-md z-10" />

          {/* Scanning line animation */}
          {scanning && (
            <div className="absolute left-4 right-4 h-0.5 bg-destructive z-10 animate-[scanline_2s_ease-in-out_infinite]" />
          )}

          {/* Camera feed container */}
          <div
            id={containerRef.current}
            className="w-full h-full flex items-center justify-center"
          >
            {!scanning && !result && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ScanBarcode className="h-16 w-16 opacity-30" />
                <p className="text-sm">Tap scan to start</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan button */}
        <button
          onClick={scanning ? stopScanning : startScanning}
          className="mb-6 w-16 h-16 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <ScanBarcode className="h-8 w-8 text-foreground" strokeWidth={1.5} />
        </button>

        {/* Error message */}
        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}

        {/* Status badges */}
        <div className="flex gap-3 mb-5">
          {(['halal', 'not_halal', 'doubtful'] as const).map((status) => {
            const config = statusConfig[status];
            const isActive = result?.status === status;
            return (
              <div
                key={status}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                  isActive
                    ? config.badgeBg + ' border-current scale-105 shadow-md'
                    : 'bg-card/50 border-border/30 text-muted-foreground'
                }`}
              >
                {config.label}
              </div>
            );
          })}
        </div>

        {/* Result message */}
        {result && result.status && (
          <div className={`w-full max-w-[340px] rounded-2xl px-6 py-5 text-center ${statusConfig[result.status].messageBg} border border-[#d4c9a8]/30`}>
            <p className="text-[#2d3a2e] font-semibold text-base whitespace-pre-line leading-relaxed">
              {statusConfig[result.status].message}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 20%; }
          50% { top: 75%; }
        }
        #halal-scanner-reader video {
          object-fit: cover !important;
          border-radius: 12px;
        }
        #halal-scanner-reader img {
          display: none;
        }
      `}</style>
    </Layout>
  );
};
