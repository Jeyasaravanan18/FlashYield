import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Bot, MapPin, MessageCircle, Sparkles, X } from "lucide-react";
import { useChatAssistant } from "../../api/hooks";
import { useLocationStore } from "../../store/locationStore";

const quickPrompts = [
  { label: "Find nearby deals", value: "Show me nearby deals" },
  { label: "How pickup works", value: "How does pickup work?" },
  { label: "My tickets", value: "Take me to my tickets" }
];

function CustomerAssistant() {
  const navigate = useNavigate();
  const { label } = useLocationStore();
  const chatAssistant = useChatAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, messages]);

  const sendMessage = (value) => {
    const trimmed = value.trim();
    if (!trimmed || chatAssistant.isPending || isTyping) return;

    const userMessageId = `user-${Date.now()}`;

    setMessages((current) => [
      ...current,
      { id: userMessageId, sender: "user", text: trimmed }
    ]);
    setInput("");
    setIsTyping(true);

    chatAssistant.mutate(trimmed, {
      onSuccess: (data) => {
        setMessages((current) => [
          ...current,
          {
            id: `bot-${Date.now()}`,
            sender: "assistant",
            text: data.reply || "I can help with nearby deals and pickup."
          }
        ]);
      },
      onError: () => {
        setMessages((current) => [
          ...current,
          {
            id: `bot-${Date.now()}`,
            sender: "assistant",
            text: "I could not reach the assistant right now. Try again in a moment."
          }
        ]);
      },
      onSettled: () => {
        setIsTyping(false);
      }
    });

    const query = trimmed.toLowerCase();
    if (query.includes("ticket") || query.includes("claim")) {
      window.setTimeout(() => navigate("/claims"), 450);
    }
    if (query.includes("map")) {
      window.setTimeout(() => navigate("/map"), 450);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[70]">
      {isOpen && (
        <section
          className="mb-3 flex h-[min(620px,calc(100vh-7.5rem))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-2xl shadow-surface-900/20 animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-label="Food Saver assistant"
        >
          <header className="flex items-center justify-between bg-surface-900 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Yield Assistant</h2>
                <p className="flex items-center gap-1 text-xs text-surface-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                  Live near {label}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-surface-300 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-surface-50 p-4" aria-live="polite">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onDealClick={(id) => navigate(`/listings/${id}`)}
                />
              ))}
              {messages.length === 0 && (
                <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-4 text-sm text-surface-500">
                  Ask a question about nearby deals, pickup tokens, or how the app works.
                </div>
              )}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.value}
                      onClick={() => sendMessage(prompt.value)}
                      className="rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-50"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}
              {isTyping && <TypingIndicator />}
              <div ref={messageEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-surface-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-surface-200 bg-surface-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/15">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-surface-900 outline-none placeholder:text-surface-400"
                placeholder="Ask about deals or pickup…"
                aria-label="Message Yield assistant"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatAssistant.isPending || isTyping}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-surface-400">
              Yield uses current marketplace data. It doesn’t access payment details.
            </p>
          </form>
        </section>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        className="group flex h-14 items-center gap-2 rounded-2xl bg-surface-900 px-4 text-sm font-bold text-white shadow-xl shadow-surface-900/30 transition hover:-translate-y-0.5 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        aria-label={isOpen ? "Close assistant" : "Open Food Saver assistant"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Fragment>
            <MessageCircle className="h-5 w-5" />
            <span>Ask Yield</span>
            <span className="h-2 w-2 rounded-full bg-accent-400 group-hover:bg-white" />
          </Fragment>
        )}
      </button>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-tl-sm border border-surface-100 bg-white px-3.5 py-3 text-sm text-surface-500 shadow-sm">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
          <Sparkles className="h-3 w-3" />
          Yield
        </div>
        <div className="flex items-center gap-1.5" aria-label="Yield is typing">
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.2s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.1s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, onDealClick }) {
  const isAssistant = message.sender === "assistant";
  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
          isAssistant
            ? "rounded-tl-sm bg-white text-surface-700 shadow-sm border border-surface-100"
            : "rounded-tr-sm bg-brand-500 text-white"
        }`}
      >
        {isAssistant && (
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
            <Sparkles className="h-3 w-3" />
            Yield
          </div>
        )}
        <RenderChatText text={message.text} />
        {Array.isArray(message.deals) && message.deals.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.deals.map((deal) => (
              <button
                key={deal._id}
                onClick={() => onDealClick(deal._id)}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 p-2.5 text-left hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="block truncate font-bold text-surface-900">{deal.title}</span>
                <span className="mt-1 flex items-center justify-between text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-brand-500" />
                    {deal.merchant?.businessName ?? "Local partner"}
                  </span>
                  <strong className="text-brand-600">₹{deal.discountedPrice}</strong>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RenderChatText({ text }) {
  const blocks = useMemo(
    () =>
      String(text || "")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean),
    [text]
  );

  if (!blocks.length) return null;

  return (
    <div className="space-y-2">
      {blocks.map((line, index) => {
        const bulletMatch = line.match(/^(\d+)\.\s+(.*)$/);
        const dashMatch = line.match(/^[-•]\s+(.*)$/);
        const content = (bulletMatch?.[2] || dashMatch?.[1] || line)
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*/g, "");

        if (bulletMatch || dashMatch) {
          return (
            <div className="flex gap-2" key={`${index}-${line}`}>
              <span className="mt-0.5 shrink-0 font-semibold text-brand-500">
                {bulletMatch ? `${bulletMatch[1]}.` : "•"}
              </span>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        }

        return <p key={`${index}-${line}`} dangerouslySetInnerHTML={{ __html: content }} />;
      })}
    </div>
  );
}

export { CustomerAssistant };
