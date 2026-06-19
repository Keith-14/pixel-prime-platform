import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Mic, Send, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import aiAssistantLogo from '@/assets/ai-assistant-logo.png.asset.json';
import aiHelpIcon from '@/assets/ai-help-icon.png.asset.json';

type Msg = { role: 'user' | 'assistant'; content: string };

const CREAM_BG = '#FFF1DD';
const BROWN = '#2C1309';
const BROWN_BTN = '#B0552A';
const OLIVE = '#8A8B2A';
const MUTED = '#A89684';
const BORDER = '#E6D4B8';
const INPUT_BG = '#F6EFE2';
const SUGGESTION_COLOR = '#776F69';
const SERIF_ITALIC = "'Newsreader', Georgia, serif";

const SUGGESTIONS = [
  { title: '12 Divine Name of Allah S.W.T', sub: 'Learn the Divine Names of Allah S.W.T' },
  { title: '12 Divine Name of Allah S.W.T', sub: 'Learn the Divine Names of Allah S.W.T' },
  { title: '12 Divine Name of Allah S.W.T', sub: 'Learn the Divine Names of Allah S.W.T' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || 'Failed to connect');
    return;
  }

  if (!resp.body) { onError('No response'); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}

interface ChatAssistantProps {
  open: boolean;
  onClose: () => void;
}

export const ChatAssistant = ({ open, onClose }: ChatAssistantProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userName = user?.displayName?.split(' ')[0] || '';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Msg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setMessages(prev => [...prev, { role: 'assistant', content: err }]);
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  if (!open) return null;

  const handleSuggestion = (s: string) => {
    setInput(s);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col font-arabic max-w-md mx-auto"
      style={{ backgroundColor: CREAM_BG, color: BROWN }}
    >
      <ChatView
        userName={userName}
        onBack={onClose}
        messages={messages}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        send={send}
        scrollRef={scrollRef}
        onSuggestion={handleSuggestion}
      />
    </div>
  );
};

const Logo = ({ size = 32 }: { size?: number }) => (
  <img
    src={aiAssistantLogo.url}
    alt="Islamic AI Assistant"
    className="rounded-full shrink-0 object-cover"
    style={{ width: size, height: size }}
  />
);

/* ---------------- Chat View ---------------- */

const ChatView = ({
  userName,
  onBack,
  messages,
  input,
  setInput,
  isLoading,
  send,
  scrollRef,
  onSuggestion,
}: {
  userName: string;
  onBack: () => void;
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  send: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  onSuggestion: (s: string) => void;
}) => {
  const empty = messages.length === 0;

  return (
    <>
      {/* Header — white bar */}
      <div
        className="px-4 pt-5 pb-4 flex items-center justify-between"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-full border flex items-center justify-center"
          style={{ borderColor: '#D9D2C7', color: BROWN }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span
            className="font-bold text-[17px] tracking-tight"
            style={{ color: BROWN }}
          >
            Islamic Ai Assistant
          </span>
        </div>
        <button
          className="h-10 w-10 rounded-full border flex items-center justify-center"
          style={{ borderColor: '#D9D2C7', color: BROWN }}
          aria-label="Help"
        >
          <img
            src={aiHelpIcon.url}
            alt="Help"
            className="h-4 w-4 object-contain"
          />
        </button>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 pt-10 pb-3"
        style={{ backgroundColor: CREAM_BG }}
      >
        {empty ? (
          <div className="pt-16">
            <h2
              className="text-center italic text-[34px] leading-tight mb-12"
              style={{
                fontFamily: SERIF_ITALIC,
                color: OLIVE,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              As-salamu alaykum{userName ? `, ${userName}` : ''}!
            </h2>
            <div className="flex flex-col gap-4">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestion(s.title)}
                  className="text-left rounded-full px-5 py-3 border flex items-center gap-3 transition-transform active:scale-[0.99]"
                  style={{ backgroundColor: 'transparent', borderColor: SUGGESTION_COLOR }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold text-[15px] truncate"
                      style={{ color: SUGGESTION_COLOR }}
                    >
                      {s.title}
                    </div>
                    <div
                      className="text-[12px] truncate mt-0.5"
                      style={{ color: SUGGESTION_COLOR }}
                    >
                      {s.sub}
                    </div>
                  </div>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0"
                    style={{ color: SUGGESTION_COLOR }}
                    strokeWidth={2}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: BROWN_BTN, color: '#FFF' }
                      : { backgroundColor: '#FFFFFF', color: BROWN, border: `1px solid ${BORDER}` }
                  }
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none [&_p]:m-0" style={{ color: BROWN }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-3 border"
                  style={{ backgroundColor: '#FFFFFF', borderColor: BORDER }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: BROWN_BTN, animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: BROWN_BTN, animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: BROWN_BTN, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        className="px-4 pb-6 pt-3 flex items-center gap-3"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div
          className="flex-1 flex items-center gap-2 rounded-full px-5 py-3.5 border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#B0A89E' }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask me Anything..."
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[#9E948A]"
            style={{ color: BROWN }}
          />
          <button className="opacity-80" aria-label="Voice input">
            <Mic className="h-5 w-5" style={{ color: '#7A6B5E' }} strokeWidth={1.75} />
          </button>
        </div>
        <button
          onClick={send}
          disabled={!input.trim() || isLoading}
          className="h-12 w-12 rounded-full flex items-center justify-center shadow-sm disabled:opacity-50"
          style={{ backgroundColor: BROWN_BTN }}
          aria-label="Send"
        >
          <Send className="h-5 w-5 text-white -ml-0.5" strokeWidth={2} />
        </button>
      </div>
    </>
  );
};