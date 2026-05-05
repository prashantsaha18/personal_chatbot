"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "./MessageBubble";
import { Send, Square, Sparkles, ArrowDown } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  { icon: "✍️", title: "Write for me", desc: "a cover letter for a software engineer role" },
  { icon: "💡", title: "Explain", desc: "how neural networks work in simple terms" },
  { icon: "🐍", title: "Write code", desc: "a Python web scraper with BeautifulSoup" },
  { icon: "📊", title: "Analyze", desc: "pros and cons of microservices vs monolith" },
];

export default function ChatArea({ chatId }: { chatId?: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(chatId);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (chatId) {
      setActiveChatId(chatId);
      setMessages([]);
      fetch(`/api/chats/${chatId}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) && setMessages(data.map((m: any) => ({ role: m.role, content: m.content }))));
    } else {
      setMessages([]);
      setActiveChatId(undefined);
      setStreamingText("");
    }
  }, [chatId]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(fromBottom > 200);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, chatId: activeChatId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body!.getReader();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = new TextDecoder().decode(value).split("\n").filter(l => l.startsWith("data:"));
        for (const line of lines) {
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.chatId && !activeChatId) {
              setActiveChatId(parsed.chatId);
              router.replace(`/chat/${parsed.chatId}`);
            }
            if (parsed.text) { fullText += parsed.text; setStreamingText(fullText); }
          } catch {}
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
      setStreamingText("");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
        setStreamingText("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    if (streamingText) {
      setMessages(prev => [...prev, { role: "assistant", content: streamingText }]);
      setStreamingText("");
    }
    setIsLoading(false);
  };

  const isEmpty = messages.length === 0 && !streamingText;
  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-bg relative">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
                <Sparkles size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">What can I help with?</h1>
              <p className="text-muted text-sm">Powered by xAI Grok</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.title}
                  onClick={() => sendMessage(`${s.title}: ${s.desc}`)}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface/30 hover:bg-surface/70 hover:border-border/80 text-left transition-all duration-150 active:scale-[0.98] group"
                >
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-accent transition-colors">{s.title}</p>
                    <p className="text-muted text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
            {streamingText && (
              <MessageBubble role="assistant" content={streamingText} isStreaming />
            )}
            {isLoading && !streamingText && (
              <div className="flex gap-4 px-4 py-6">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 bg-muted/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-36" />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 p-2 bg-surface border border-border rounded-full shadow-lg hover:bg-hover transition-colors text-muted hover:text-white"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input area */}
      <div className="px-4 pb-6 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-3 bg-surface border rounded-2xl px-4 py-3 transition-all duration-150 ${
            input ? "border-border/80 shadow-lg shadow-black/20" : "border-border/40"
          } focus-within:border-border/80 focus-within:shadow-lg focus-within:shadow-black/20`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Message AI..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-white placeholder-muted text-[15px] leading-6 max-h-44 py-0.5"
            />
            <button
              onClick={isLoading ? stop : () => sendMessage()}
              disabled={!canSend && !isLoading}
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 ${
                isLoading
                  ? "bg-white text-black hover:bg-gray-100"
                  : canSend
                  ? "bg-white text-black hover:bg-gray-100 shadow-md"
                  : "bg-surface/60 text-muted cursor-not-allowed border border-border/40"
              }`}
            >
              {isLoading
                ? <Square size={14} fill="currentColor" />
                : <Send size={14} />
              }
            </button>
          </div>
          <p className="text-center text-[11px] text-muted/50 mt-2">
            AI can make mistakes. Press <kbd className="bg-surface/60 px-1 py-0.5 rounded text-[10px] border border-border/40">Shift + Enter</kbd> for new line.
          </p>
        </div>
      </div>
    </div>
  );
}
