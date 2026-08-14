"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CornerDownLeft,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";
import ImageLoader from "@/components/Common/ImageLoader";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { cn } from "@/lib/utils";
import type {
  AiAdvisorMessage,
  AiAdvisorRecommendation,
  AiAdvisorResponse,
} from "@/type/aiAdvisorType";

const GREETING: AiAdvisorMessage = {
  role: "assistant",
  content:
    "Tell me what you need, your preferences, concern, or budget, and I will recommend matching products from the active inventory.",
};

const STARTERS = [
  "Help me choose the right product",
  "Find products that match my needs",
  "Show products within my budget",
];

interface ConversationItem extends AiAdvisorMessage {
  recommendations?: AiAdvisorRecommendation[];
}

export default function AiShoppingAssistant({
  onProductSelect,
}: {
  onProductSelect?: () => void;
}) {
  const { format } = useCurrency();
  const [messages, setMessages] = useState<ConversationItem[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const sendMessage = async (content: string) => {
    const cleanContent = content.trim();
    if (!cleanContent || pending) return;

    const userMessage: ConversationItem = {
      role: "user",
      content: cleanContent,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = nextMessages.map(({ role, content }) => ({
        role,
        content,
      }));
      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as
        AiAdvisorResponse | { error?: string };
      if (!response.ok || !("message" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "The store expert could not respond.",
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.message,
          recommendations: payload.recommendations,
        },
      ]);
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I hit a snag while checking the active inventory. Your last note is still in the box—send it once more and I will pick up where we left off.",
        },
      ]);
      setInput(cleanContent);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setPending(false);
      }
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const restart = () => {
    abortRef.current?.abort();
    setMessages([GREETING]);
    setInput("");
    setPending(false);
  };

  const hasStarted = messages.some((message) => message.role === "user");

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/80 py-4 sm:py-5 lg:pt-1">
        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Shopping advisor online / Active inventory
        </div>
        {hasStarted && (
          <button
            type="button"
            onClick={restart}
            className="inline-flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-primary"
          >
            <RotateCcw className="size-3.5" />
            Reset brief
          </button>
        )}
      </header>

      <div
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto"
        aria-live="polite"
      >
        {!hasStarted ? (
          <div className="flex min-h-full flex-col justify-center py-8 sm:py-12 lg:py-16">
            <div className="max-w-4xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                02 / Ask the store expert
              </p>
              <h2 className="mt-3 max-w-3xl font-display text-[clamp(2.5rem,7vw,6.5rem)] font-bold leading-[0.88] tracking-[-0.055em]">
                What would you
                <span className="block text-primary">like to know?</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Describe what you need, your preferences, concern, or budget.
                Get recommendations from products that are currently active and
                in stock.
              </p>
            </div>

            <div className="mt-8 grid border-y border-border sm:mt-12 sm:grid-cols-3">
              {STARTERS.map((starter, index) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => void sendMessage(starter)}
                  className="group flex min-w-0 items-center gap-4 border-b border-border px-1 py-4 text-left transition last:border-b-0 hover:text-primary sm:min-h-28 sm:flex-col sm:items-start sm:justify-between sm:border-b-0 sm:border-r sm:px-5 sm:py-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
                >
                  <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground">
                    0{index + 1}
                  </span>
                  <span className="flex w-full min-w-0 items-end justify-between gap-3">
                    <span className="text-sm leading-5 text-foreground transition group-hover:text-primary">
                      {starter}
                    </span>
                    <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 py-7 sm:space-y-10 sm:py-10">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-4xl",
                  message.role === "user" && "ml-auto max-w-2xl",
                )}
              >
                <div
                  className={cn(
                    "mb-2 font-mono text-[9px] uppercase tracking-[0.24em]",
                    message.role === "user"
                      ? "text-right text-muted-foreground"
                      : "text-primary",
                  )}
                >
                  {message.role === "user" ? "Your question" : "Store expert"}
                </div>
                <p
                  className={cn(
                    "text-sm leading-6 sm:text-base sm:leading-7",
                    message.role === "user"
                      ? "border-r-2 border-foreground bg-foreground/5 py-3 pl-5 pr-4 text-right"
                      : "border-l-2 border-primary py-2 pl-5 text-foreground",
                  )}
                >
                  {message.content}
                </p>
                {message.recommendations &&
                  message.recommendations.length > 0 && (
                    <div className="mt-5 grid gap-3 lg:grid-cols-3">
                      {message.recommendations.map((recommendation, rank) => (
                        <RecommendationCard
                          key={recommendation.product.id}
                          recommendation={recommendation}
                          rank={rank + 1}
                          formatPrice={format}
                          onSelect={onProductSelect}
                        />
                      ))}
                    </div>
                  )}
              </article>
            ))}
          </div>
        )}

        {pending && (
          <div className="mb-8 flex items-center gap-3 border-l-2 border-primary py-3 pl-5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Checking the active inventory
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="shrink-0 border-t border-border/80 bg-background/80 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:pb-5 sm:pt-4">
        <form
          onSubmit={submit}
          className="group flex items-end gap-3 border border-border bg-card/60 p-2 transition focus-within:border-primary focus-within:ring-glow sm:p-3"
        >
          <label htmlFor="ai-advisor-message" className="sr-only">
            Message the shopping assistant
          </label>
          <textarea
            id="ai-advisor-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Tell me what product you need..."
            rows={1}
            disabled={pending}
            className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-3 text-sm leading-5 outline-none placeholder:text-muted-foreground/70 disabled:opacity-60 sm:text-base"
          />
          <span className="mb-3 hidden items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground lg:inline-flex">
            Enter <CornerDownLeft className="size-3" />
          </span>
          <button
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="Send message"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-30 sm:size-12"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </form>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">
          Website knowledge + live inventory / Confirm details before purchase
        </p>
      </footer>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  rank,
  formatPrice,
  onSelect,
}: {
  recommendation: AiAdvisorRecommendation;
  rank: number;
  formatPrice: (value: number) => string;
  onSelect?: () => void;
}) {
  const { product, reason } = recommendation;

  return (
    <Link
      href={product.href}
      onClick={onSelect}
      className="group relative grid min-w-0 grid-cols-[6rem_1fr] overflow-hidden border border-border bg-card/50 transition duration-500 hover:border-primary lg:block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.image ? (
          <ImageLoader
            src={product.image}
            alt={product.title}
            width={240}
            height={300}
            sizes="(max-width: 1023px) 96px, 25vw"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Sparkles className="size-5 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 hidden bg-gradient-to-t from-black/85 via-transparent to-transparent lg:block" />
        <span className="absolute left-3 top-3 border border-white/20 bg-black/30 px-2 py-1 font-mono text-[8px] tracking-[0.2em] text-white backdrop-blur">
          MATCH 0{rank}
        </span>
      </div>
      <div className="min-w-0 p-3.5 lg:absolute lg:inset-x-0 lg:bottom-0 lg:z-10 lg:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-semibold lg:text-base lg:text-white">
            {product.title}
          </h3>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary lg:text-white" />
        </div>
        <p className="mt-1 font-mono text-xs font-medium text-primary">
          {formatPrice(product.currentPrice)}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground lg:text-white/65">
          {reason}
        </p>
      </div>
    </Link>
  );
}
