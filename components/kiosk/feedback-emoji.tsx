"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface FeedbackEmojiProps {
  /** Score from 1 (very sad) to 5 (star eyes). Fractions blend between faces. */
  value: number;
  /** Greyed face before the visitor has rated. */
  muted?: boolean;
  className?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`);
  }
  return points.join(" ");
}

/** One face drawn from the score, so it reshapes smoothly while the slider moves. */
export function FeedbackEmoji({ value, muted = false, className }: FeedbackEmojiProps) {
  const gradientId = `feedback-face-${useId().replace(/:/g, "")}`;
  const t = clamp01((value - 1) / 4);

  const hue = lerp(14, 46, t);
  const light = lerp(64, 60, t);
  const faceTop = muted ? "#e5e7eb" : `hsl(${hue} 95% ${light + 10}%)`;
  const faceBottom = muted ? "#cbd5e1" : `hsl(${hue - 4} 92% ${light - 6}%)`;
  const ink = muted ? "#64748b" : "#5b2a0e";

  const browFade = clamp01(1 - t * 2.4);
  const tearFade = clamp01((0.22 - t) / 0.22);
  const blushFade = clamp01((t - 0.55) / 0.3);
  const openMouth = clamp01((t - 0.5) / 0.3);
  const starPhase = muted ? 0 : clamp01((t - 0.8) / 0.18);

  // Corners lift and the middle drops as the score rises: frown -> flat -> wide smile.
  const cornerY = lerp(70, 63, t);
  // Flat mouth at the middle score ("Okay"), frown below it, smile above it.
  const middleY =
    t < 0.5 ? lerp(56, lerp(70, 63, 0.5), t / 0.5) : lerp(lerp(70, 63, 0.5), 84, (t - 0.5) / 0.5);
  const mouthHalf = lerp(13, 19, t);
  const lipY = lerp(cornerY, cornerY + 3, openMouth);
  const mouthEdge = `M ${50 - mouthHalf} ${cornerY} Q 50 ${middleY} ${50 + mouthHalf} ${cornerY}`;
  const mouthFill = `${mouthEdge} Q 50 ${lipY} ${50 - mouthHalf} ${cornerY} Z`;

  const eyeOpen = lerp(1, 0.82, t);

  return (
    <svg viewBox="0 0 100 100" className={cn("select-none", className)} aria-hidden>
      <defs>
        <radialGradient id={gradientId} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={faceTop} />
          <stop offset="100%" stopColor={faceBottom} />
        </radialGradient>
      </defs>

      <circle cx="50" cy="52" r="44" fill="rgba(15,26,46,0.12)" />
      <circle cx="50" cy="50" r="44" fill={`url(#${gradientId})`} />

      {browFade > 0 ? (
        <g stroke={ink} strokeWidth="3.4" strokeLinecap="round" opacity={browFade}>
          <line x1="27" y1={lerp(35, 31, t)} x2="41" y2={lerp(29, 31, t)} />
          <line x1="59" y1={lerp(29, 31, t)} x2="73" y2={lerp(35, 31, t)} />
        </g>
      ) : null}

      <g opacity={1 - starPhase}>
        <ellipse cx="36" cy="43" rx="5" ry={6 * eyeOpen} fill={ink} />
        <ellipse cx="64" cy="43" rx="5" ry={6 * eyeOpen} fill={ink} />
        <circle cx="37.6" cy="40.6" r="1.6" fill="#ffffff" opacity="0.9" />
        <circle cx="65.6" cy="40.6" r="1.6" fill="#ffffff" opacity="0.9" />
      </g>

      {starPhase > 0 ? (
        <g opacity={starPhase}>
          {[36, 64].map((cx) => (
            <g key={cx} transform={`rotate(${lerp(-25, 0, starPhase)} ${cx} 42)`}>
              <polygon
                points={starPoints(cx, 42, lerp(5, 11, starPhase), lerp(2, 4.6, starPhase))}
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      ) : null}

      {tearFade > 0 && !muted ? (
        <path
          d="M 31 52 C 28 58 28 62 31 63 C 34 62 34 58 31 52 Z"
          fill="#60a5fa"
          opacity={tearFade}
        />
      ) : null}

      {blushFade > 0 && !muted ? (
        <g fill="#f472b6" opacity={blushFade * 0.45}>
          <ellipse cx="24" cy="58" rx="6.5" ry="4" />
          <ellipse cx="76" cy="58" rx="6.5" ry="4" />
        </g>
      ) : null}

      {openMouth > 0 ? <path d={mouthFill} fill="#7c2d12" opacity={openMouth} /> : null}
      <path d={mouthEdge} fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}
