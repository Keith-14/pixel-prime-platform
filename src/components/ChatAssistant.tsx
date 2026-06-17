import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, HelpCircle, Mic, Plus, Send, Sparkles, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };
type Thread = { id: string; title: string; preview: string; ago: string; messages: Msg[] };

const CREAM_BG = '#FBEAD0';
const CREAM_CARD = '#FFF1DD';
const BROWN = '#2C1309';
const BROWN_TITLE = '#B0431E';
const BROWN_BTN = '#A0431D';
const OLIVE = '#7A8B2A';
const MUTED = '#8B6F5C';
const BORDER = '#E8D3AE';
const SERIF = "'Reem Kufi', serif";

const SAMPLE_HISTORY: Thread[] = [
  {
    id: 't1',
    title: 'How can I forget a bad memory?',
    preview:
      'Forgetting a bad memory entirely may be challenging, as memories are complex and deeply ingrained in the brain. However, there are strategies you can use to cope with and reduce the i…',
    ago: '28 mins ago',
    messages: [],
  },
  {
    id: 't2',
    title: 'How can I forget a bad memory?',
    preview:
      'Forgetting a bad memory entirely may be challenging, as memories are complex and deeply ingrained in the brain. However, there are strategies you can use to cope with and reduce the i…',
    ago: '28 mins ago',
    messages: [],
  },
  {
    id: 't3',
    title: 'How can I forget a bad memory?',
    preview:
      'Forgetting a bad memory entirely may be challenging, as memories are complex and deeply ingrained in the brain. However, there are strategies you can use to cope with and reduce the i…',
    ago: '28 mins ago',
    messages: [],
  },
];

const SUGGESTIONS = [
  { title: '12 Divine Name of Allah S.W.T', sub: 'Learn the Divine Names of Allah S.W.T' },
  { title: '99 Names of Allah', sub: 'Explore the beautiful names of Allah' },
  { title: 'How to perform Wudu', sub: 'Step-by-step guide to ablution' },
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
  const [view, setView] = useState<'home' | 'chat'>('home');
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

  const startNewChat = () => {
    setMessages([]);
    setView('chat');
  };

  const openThread = (t: Thread) => {
    setMessages(t.messages);
    setView('chat');
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col font-arabic max-w-md mx-auto"
      style={{ backgroundColor: CREAM_BG, color: BROWN }}
    >
      {view === 'home' ? (
        <HomeView
          onBack={onClose}
          onNewChat={startNewChat}
          onOpenThread={openThread}
        />
      ) : (
        <ChatView
          userName={userName}
          onBack={() => setView('home')}
          messages={messages}
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          send={send}
          scrollRef={scrollRef}
          onSuggestion={handleSuggestion}
        />
      )}
    </div>
  );
};

/* ---------------- Home View (history) ---------------- */

const Logo = ({ size = 36 }: { size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center"
    style={{ width: size, height: size, backgroundColor: OLIVE }}
  >
    <Sparkles className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.25} />
  </div>
);

const HomeView = ({
  onBack,
  onNewChat,
  onOpenThread,
}: {
  onBack: () => void;
  onNewChat: () => void;
  onOpenThread: (t: Thread) => void;
}) => {
  return (
    <div className="flex-1 overflow-y-auto pb-10">
      {/* Back to Home */}
      <div className="px-5 pt-5 pb-2 flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: BROWN }}>
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          Back to Home
        </button>
      </div>

      {/* Hero */}
      <div className="px-5 pt-6 pb-6 flex flex-col items-center text-center">
        <Logo size={44} />
        <h1 className="mt-4 text-[28px] leading-tight font-bold" style={{ color: BROWN }}>
          Start a New Chat
        </h1>
        <p className="mt-1 text-[22px] leading-tight">
          <span style={{ color: BROWN }}>with </span>
          <span style={{ color: OLIVE, fontWeight: 600 }}>Islamic AI</span>
        </p>

        <button
          onClick={onNewChat}
          className="mt-6 w-full rounded-full py-4 text-white font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform"
          style={{ backgroundColor: BROWN_BTN }}
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Start New Chat
        </button>
      </div>

      {/* Divider */}
      <div className="h-px mx-5" style={{ backgroundColor: BORDER }} />

      {/* History */}
      <div className="px-5 pt-5">
        <h2 className="text-[20px] font-bold mb-3" style={{ color: BROWN }}>
          History
        </h2>
        <div className="flex flex-col gap-3">
          {SAMPLE_HISTORY.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpenThread(t)}
              className="text-left rounded-2xl p-4 border"
              style={{ backgroundColor: CREAM_CARD, borderColor: BORDER }}
            >
              <div className="font-semibold text-[15px] mb-2" style={{ color: BROWN_TITLE }}>
                {t.title}
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: '#5C4736' }}>
                {t.preview}
              </p>
              <div className="mt-3 text-[12px]" style={{ color: MUTED }}>
                {t.ago}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-full border flex items-center justify-center"
          style={{ borderColor: BORDER, color: BROWN }}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-semibold text-[16px]" style={{ color: BROWN }}>
            Islamic Ai Assistant
          </span>
        </div>
        <button
          className="h-9 w-9 rounded-full border flex items-center justify-center"
          style={{ borderColor: BORDER, color: BROWN }}
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-3 pb-3">
        {empty ? (
          <div className="pt-6">
            <h2
              className="text-center italic text-[28px] leading-tight mb-7"
              style={{ fontFamily: SERIF, color: OLIVE }}
            >
              As-salamu alaykum{userName ? `, ${userName}` : ''}!
            </h2>
            <div className="flex flex-col gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => onSuggestion(s.title)}
                  className="text-left rounded-2xl px-4 py-3 border flex items-center gap-3"
                  style={{ backgroundColor: CREAM_CARD, borderColor: BORDER }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] truncate" style={{ color: BROWN }}>
                      {s.title}
                    </div>
                    <div className="text-[12px] truncate" style={{ color: MUTED }}>
                      {s.sub}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: BROWN }} strokeWidth={2} />
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
                      : { backgroundColor: CREAM_CARD, color: BROWN, border: `1px solid ${BORDER}` }
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
                  style={{ backgroundColor: CREAM_CARD, borderColor: BORDER }}
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
      <div className="px-4 pb-6 pt-2 flex items-center gap-3">
        <div
          className="flex-1 flex items-center gap-2 rounded-full px-4 py-3 border"
          style={{ backgroundColor: '#FFF7E5', borderColor: BORDER }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask me Anything..."
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: BROWN }}
          />
          <button className="opacity-70" aria-label="Voice input">
            <Mic className="h-5 w-5" style={{ color: BROWN }} strokeWidth={1.75} />
          </button>
        </div>
        <button
          onClick={send}
          disabled={!input.trim() || isLoading}
          className="h-12 w-12 rounded-full flex items-center justify-center shadow-sm disabled:opacity-50"
          style={{ backgroundColor: BROWN_BTN }}
          aria-label="Send"
        >
          <Send className="h-5 w-5 text-white" strokeWidth={2} />
        </button>
      </div>
    </>
  );
};
