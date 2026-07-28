import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ArrowLeft, ArrowRight, ChevronDown, Info, Lightbulb, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_CURRENCIES, FALLBACK_EXCHANGE_RATES, CountryCurrency } from '@/data/currencies';

const CREAM = '#FFF5E5';
const CARD_CREAM = '#FFF8F0';
const BROWN_DARK = '#2C1309';
const BROWN = '#A35233';
const BROWN_DEEP = '#78351A';
const ORANGE = '#CE5728';

const QUICK_CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'PKR'];
const USD_NISAB = 4850;
const USD_GOLD_PRICE_PER_GRAM = 79;

const fmt = (n: number, symbol: string) =>
  `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type GoldMode = 'GRAMS' | 'VALUE';

const FieldRow = ({
  label,
  symbol,
  value,
  onChange,
  trailing,
  suffix,
}: {
  label: string;
  symbol?: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
  suffix?: string;
}) => (
  <div className="pt-1">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[15px]" style={{ color: BROWN_DARK }}>{label}</span>
        <Info className="h-3.5 w-3.5" style={{ color: BROWN_DARK, opacity: 0.45 }} />
      </div>
      {trailing}
    </div>
    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: `${BROWN_DARK}25` }}>
      {symbol && <span className="text-2xl font-light" style={{ color: ORANGE }}>{symbol}</span>}
      <input
        type="number"
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-2xl font-light placeholder:opacity-40"
        style={{ color: BROWN_DARK }}
      />
      {suffix && <span className="text-base font-bold" style={{ color: BROWN_DARK }}>{suffix}</span>}
    </div>
  </div>
);

export const Zakat = () => {
  const navigate = useNavigate();
  // Default to India INR or United Kingdom GBP as initial country
  const [selectedCountry, setSelectedCountry] = useState<CountryCurrency>(
    ALL_CURRENCIES.find((c) => c.code === 'INR') || ALL_CURRENCIES[0]
  );
  const [currency, setCurrency] = useState<string>(selectedCountry.code);
  const [showCountry, setShowCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_EXCHANGE_RATES);

  const [cash, setCash] = useState('');
  const [goldMode, setGoldMode] = useState<GoldMode>('GRAMS');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [business, setBusiness] = useState('');
  const [moneyOwed, setMoneyOwed] = useState('');
  const [investments, setInvestments] = useState('');

  // Fetch real-time exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) return;
        const data = (await response.json()) as { rates?: Record<string, number> };
        if (data.rates) {
          setRates((prev) => ({ ...prev, ...data.rates }));
        }
      } catch {
        // Fallback rates remain active
      }
    };
    void fetchRates();
  }, []);

  const selectCountryByCode = (code: string) => {
    setCurrency(code);
    const found = ALL_CURRENCIES.find((c) => c.code === code);
    if (found) {
      setSelectedCountry(found);
    }
  };

  const rate = rates[currency] || FALLBACK_EXCHANGE_RATES[currency] || 1;
  const activeSymbol = selectedCountry.symbol || currency;
  const nisab = USD_NISAB * rate;
  const goldPricePerGram = USD_GOLD_PRICE_PER_GRAM * rate;

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      ({ country, code, symbol }) =>
        country.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        symbol.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  const goldValue = useMemo(() => {
    const n = parseFloat(gold || '0');
    if (goldMode === 'GRAMS') return n * goldPricePerGram;
    return n;
  }, [gold, goldMode, goldPricePerGram]);

  const total = useMemo(() => {
    return (
      parseFloat(cash || '0') +
      goldValue +
      parseFloat(silver || '0') +
      parseFloat(business || '0') +
      parseFloat(moneyOwed || '0') +
      parseFloat(investments || '0')
    );
  }, [cash, goldValue, silver, business, moneyOwed, investments]);

  const zakatable = total >= nisab ? total : 0;

  return (
    <Layout showHeader={false} showNavigation={false}>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: CREAM }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ backgroundColor: CREAM }}>
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5"
            style={{ color: BROWN_DARK }}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1
            className="font-serif italic text-xl font-bold"
            style={{ color: BROWN_DARK, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Zakat Calculator
          </h1>
          <span className="text-sm font-semibold" style={{ color: BROWN_DARK, opacity: 0.75 }}>
            Step 1 of 2
          </span>
        </div>

        <div className="flex-1 px-5 pb-40 overflow-y-auto">
          {/* Nisab Card */}
          <div
            className="rounded-[28px] p-6 text-center relative z-10 shadow-lg"
            style={{ background: `linear-gradient(160deg, ${BROWN_DEEP} 0%, ${ORANGE} 100%)` }}
          >
            {/* Top Dropdown Badge showing Country Name and Currency Code */}
            <button
              onClick={() => setShowCountry((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:bg-black/30 active:scale-95"
              style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
            >
              <span>
                {selectedCountry.country} {selectedCountry.code}
              </span>
              <span className="text-base">{selectedCountry.flag}</span>
              <ChevronDown className="h-4 w-4 opacity-80" />
            </button>

            {/* Dropdown Selection Modal */}
            {showCountry && (
              <div
                className="absolute z-30 left-3 right-3 top-16 rounded-2xl p-3 text-left shadow-2xl border"
                style={{ backgroundColor: CARD_CREAM, borderColor: `${BROWN_DARK}20` }}
              >
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: BROWN_DARK, opacity: 0.5 }} />
                  <input
                    autoFocus
                    type="search"
                    value={countrySearch}
                    onChange={(event) => setCountrySearch(event.target.value)}
                    placeholder="Search country or currency (e.g. India INR)"
                    className="w-full rounded-xl pl-9 pr-3 py-2 text-sm outline-none border"
                    style={{ backgroundColor: '#fff', color: BROWN_DARK, borderColor: `${BROWN_DARK}20` }}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredCountries.map((option) => {
                    const isSelected = selectedCountry.code === option.code && selectedCountry.country === option.country;
                    return (
                      <button
                        key={`${option.country}-${option.code}`}
                        onClick={() => {
                          setSelectedCountry(option);
                          setCurrency(option.code);
                          setShowCountry(false);
                          setCountrySearch('');
                        }}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-left transition-colors hover:bg-black/5"
                        style={{
                          backgroundColor: isSelected ? `${BROWN_DEEP}18` : 'transparent',
                          color: BROWN_DARK,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{option.flag}</span>
                          <span className="font-semibold">
                            {option.country} {option.code}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${BROWN_DARK}10` }}>
                          {option.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="mt-5 text-white/85 text-xs tracking-[0.18em] font-semibold">CURRENT NISAB VALUE</p>
            <p
              className="mt-2 text-white text-5xl font-bold italic tracking-tight"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {fmt(nisab, activeSymbol)}
            </p>
            <p className="mt-3 text-white/80 text-sm">Based on gold price today</p>
          </div>

          {/* Quick Currency Selector */}
          <div className="mt-5 rounded-full p-1.5 flex overflow-x-auto gap-1 no-scrollbar" style={{ backgroundColor: CARD_CREAM }}>
            {QUICK_CURRENCIES.map((code) => {
              const selected = currency === code;
              const curObj = ALL_CURRENCIES.find((c) => c.code === code);
              const symbolStr = curObj?.symbol || code;
              return (
                <button
                  key={code}
                  onClick={() => selectCountryByCode(code)}
                  className="flex-1 min-w-[65px] py-2 px-2 rounded-full text-xs font-bold transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: selected ? BROWN_DEEP : 'transparent',
                    color: selected ? '#fff' : BROWN_DARK,
                  }}
                >
                  {code} ({symbolStr})
                </button>
              );
            })}
          </div>

          {/* Title */}
          <h2
            className="text-center mt-8 mb-5 italic text-3xl font-bold"
            style={{ color: BROWN_DEEP, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Your Wealth
          </h2>

          <div className="space-y-5">
            <FieldRow label="Cash & Savings" symbol={activeSymbol} value={cash} onChange={setCash} />

            <FieldRow
              label="Gold Value"
              symbol={goldMode === 'VALUE' ? activeSymbol : undefined}
              value={gold}
              onChange={setGold}
              suffix={goldMode === 'GRAMS' ? 'g' : undefined}
              trailing={
                <div className="rounded-full p-1 flex text-[11px] font-bold" style={{ backgroundColor: CARD_CREAM }}>
                  {(['GRAMS', 'VALUE'] as GoldMode[]).map((m) => {
                    const sel = goldMode === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setGoldMode(m)}
                        className="px-3 py-1 rounded-full tracking-wider transition-colors"
                        style={{
                          backgroundColor: sel ? BROWN_DARK : 'transparent',
                          color: sel ? '#fff' : BROWN_DARK,
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              }
            />

            <FieldRow label="Silver Value" symbol={activeSymbol} value={silver} onChange={setSilver} />
            <FieldRow label="Business Assets" symbol={activeSymbol} value={business} onChange={setBusiness} />
            <FieldRow label="Money Owed to You" symbol={activeSymbol} value={moneyOwed} onChange={setMoneyOwed} />
            <FieldRow label="Investments & Stocks" symbol={activeSymbol} value={investments} onChange={setInvestments} />
          </div>

          {/* Did you know */}
          <div className="mt-7 rounded-3xl p-5 flex items-start gap-4" style={{ backgroundColor: CARD_CREAM }}>
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#B6E2B6' }}
            >
              <Lightbulb className="h-5 w-5" style={{ color: '#2B5E2B' }} />
            </div>
            <div>
              <p className="font-bold mb-1" style={{ color: BROWN_DARK }}>Did you know?</p>
              <p className="text-sm leading-relaxed" style={{ color: BROWN_DARK, opacity: 0.85 }}>
                Zakat is 2.5% of your total zakatable wealth, provided it remains above the Nisab threshold for a full lunar year (Hawl).
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-5 pt-5 pb-7 rounded-t-[28px]"
          style={{ backgroundColor: '#FFF5E5', boxShadow: '0 -8px 30px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-[0.18em]" style={{ color: BROWN_DARK }}>
              ZAKATABLE WEALTH
            </span>
            <span
              className="text-xl italic font-bold"
              style={{ color: BROWN_DEEP, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {fmt(zakatable, activeSymbol)}
            </span>
          </div>
          <button
            onClick={() =>
              navigate('/zakat-result', {
                state: {
                  cash,
                  goldValue,
                  silver,
                  business,
                  moneyOwed,
                  investments,
                  total,
                  zakatable,
                  zakatPayable: zakatable * 0.025,
                  nisab,
                  symbol: activeSymbol,
                  currency: selectedCountry.code,
                  goldMode,
                  goldRaw: gold,
                  goldPricePerGram,
                },
              })
            }
            className="w-full h-14 rounded-full text-white font-bold tracking-wider flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform"
            style={{ backgroundColor: BROWN_DEEP }}
          >
            CALCULATE ZAKAT <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};
