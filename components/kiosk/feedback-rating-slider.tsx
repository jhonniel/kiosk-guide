"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { FeedbackEmoji } from "@/components/kiosk/feedback-emoji";
import { cn } from "@/lib/utils";

interface FeedbackRatingSliderProps {
  question: string;
  number: number;
  /** Whole score 1-5, or null before the visitor rates. */
  value: number | null;
  onChange: (score: number) => void;
  scoreLabel: (score: number) => string;
  placeholder: string;
  className?: string;
}

/** Eases the drawn score toward the target so taps and snaps morph instead of jumping. */
function useEasedValue(target: number) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    let frame = 0;
    const step = () => {
      const next = shownRef.current + (target - shownRef.current) * 0.22;
      shownRef.current = Math.abs(target - next) < 0.005 ? target : next;
      setShown(shownRef.current);
      if (shownRef.current !== target) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

/** Red at 1, amber in the middle, green at 5. */
export function feedbackScoreColor(score: number) {
  const t = Math.min(1, Math.max(0, (score - 1) / 4));
  return `hsl(${Math.round(4 + t * 138)} 72% ${Math.round(48 - t * 8)}%)`;
}

const SCALE = [1, 2, 3, 4, 5];

export function FeedbackRatingSlider({
  question,
  number,
  value,
  onChange,
  scoreLabel,
  placeholder,
  className,
}: FeedbackRatingSliderProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const answered = value !== null;
  const active = answered || dragValue !== null;
  const target = dragValue ?? value ?? 3;
  const shown = useEasedValue(target);
  const rounded = Math.round(target);

  const commit = (raw: number) => {
    setDragValue(null);
    onChange(Math.min(5, Math.max(1, Math.round(raw))));
  };

  const color = active ? feedbackScoreColor(shown) : "#94a3b8";
  const fill = active ? ((target - 1) / 4) * 100 : 0;

  return (
    <div className={cn("@container px-4 py-4 sm:px-5", className)}>
      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:gap-6">
        <div className="flex items-start gap-3 @3xl:w-[38%] @3xl:shrink-0">
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
              answered ? "bg-kiosk-green text-white" : "bg-slate-100 text-slate-500"
            )}
            aria-hidden
          >
            {answered ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
          </span>
          <p className="text-[0.95rem] leading-snug font-medium text-slate-800">{question}</p>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-4">
          <FeedbackEmoji
            value={shown}
            muted={!active}
            className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
          />
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={1}
              max={5}
              step={0.01}
              value={target}
              aria-label={question}
              aria-valuetext={active ? scoreLabel(target) : placeholder}
              className="feedback-range w-full"
              style={{
                ["--feedback-fill" as string]: `${fill}%`,
                ["--feedback-color" as string]: color,
              }}
              onChange={(event) => setDragValue(Number(event.target.value))}
              onPointerUp={(event) => commit(Number(event.currentTarget.value))}
              onKeyUp={(event) => commit(Number(event.currentTarget.value))}
              onBlur={() => {
                if (dragValue !== null) commit(dragValue);
              }}
            />
            <div className="mt-0.5 grid grid-cols-5 text-[0.7rem] text-slate-400">
              {SCALE.map((score) => (
                <span
                  key={score}
                  className={cn(
                    "transition-colors",
                    score === 1 ? "text-left" : score === 5 ? "text-right" : "text-center",
                    active && rounded === score && "font-semibold text-slate-700"
                  )}
                >
                  {scoreLabel(score)}
                </span>
              ))}
            </div>
          </div>
          <span
            className="hidden w-28 shrink-0 rounded-md border px-2.5 py-1.5 text-center text-sm font-semibold transition-colors @xl:block"
            style={
              active
                ? { color, borderColor: color, backgroundColor: "rgba(255,255,255,0.9)" }
                : { color: "#94a3b8", borderColor: "#e2e8f0" }
            }
          >
            {active ? scoreLabel(target) : placeholder}
          </span>
        </div>
      </div>
    </div>
  );
}
