"use client";

import { useId, type ReactNode } from "react";
import type { WeatherArtKind } from "@/features/weather/conditions";
import { cn } from "@/lib/utils";

type CloudMotion = "float" | "drift" | "drift-back" | "rumble";

/**
 * Soft 3D-style weather illustration, animated to match the weather (see .wx-* in globals.css):
 * spinning sun rays, drifting clouds, falling rain, lightning strikes, swaying snow, twinkling stars.
 */
export function WeatherArt({ kind, className }: { kind: WeatherArtKind; className?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;

  const sun = (cx: number, cy: number, r: number, withRays = true) => (
    <g>
      <circle className="wx-glow" cx={cx} cy={cy} r={r * 1.8} fill={ref("sun-glow")} />
      {withRays ? (
        <g className="wx-rays">
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={cx - 2.2}
              y={cy - r * 1.62}
              width={4.4}
              height={r * 0.42}
              rx={2.2}
              fill={ref("ray")}
              transform={`rotate(${i * 30} ${cx} ${cy})`}
            />
          ))}
        </g>
      ) : null}
      <g className="wx-sun">
        <circle cx={cx} cy={cy} r={r} fill={ref("sun")} />
        <ellipse cx={cx - r * 0.35} cy={cy - r * 0.42} rx={r * 0.38} ry={r * 0.22} fill="#fff" opacity={0.6} />
      </g>
    </g>
  );

  const moon = (cx: number, cy: number, r: number) => (
    <g>
      <circle className="wx-glow" cx={cx} cy={cy} r={r * 1.7} fill={ref("moon-glow")} />
      <g className="wx-moon">
        <circle cx={cx} cy={cy} r={r} fill={ref("moon")} mask={ref("moon-cut")} />
      </g>
    </g>
  );

  const stars = (
    <g fill="#fff3b8">
      {[
        [24, 30, 0, 4.5],
        [98, 22, 0.7, 3.5],
        [104, 68, 1.4, 4],
        [18, 72, 1, 3],
        [44, 16, 1.9, 2.8],
      ].map(([x, y, delay, s]) => (
        <path
          key={`${x}-${y}`}
          className="wx-twinkle"
          style={{ animationDelay: `${delay}s` }}
          d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`}
        />
      ))}
    </g>
  );

  const cloud = (dark = false, transform?: string, motion: CloudMotion = "float", flash = false) => (
    <g transform={transform}>
      <g className={`wx-cloud-${motion}`}>
        <ellipse cx={61} cy={88} rx={38} ry={6} fill="rgba(55,95,160,0.24)" filter={ref("blur")} />
        <g fill={dark ? ref("cloud-dark") : ref("cloud")}>
          <circle cx={38} cy={68} r={17} />
          <circle cx={58} cy={52} r={25} />
          <circle cx={81} cy={60} r={20} />
          <circle cx={95} cy={73} r={11} />
          <rect x={22} y={64} width={84} height={22} rx={11} />
        </g>
        {flash ? (
          <g className="wx-cloud-flash" fill="#fffbe6">
            <circle cx={58} cy={56} r={22} />
            <circle cx={80} cy={64} r={16} />
            <rect x={28} y={66} width={74} height={18} rx={9} />
          </g>
        ) : null}
        <ellipse cx={52} cy={39} rx={12} ry={6.5} fill="#fff" opacity={dark ? 0.45 : 0.9} />
        <ellipse cx={34} cy={59} rx={7} ry={4} fill="#fff" opacity={dark ? 0.3 : 0.7} />
        <ellipse cx={79} cy={49} rx={6} ry={3.5} fill="#fff" opacity={dark ? 0.3 : 0.65} />
      </g>
    </g>
  );

  const drops = (count: number, speed: "drizzle" | "rain" | "heavy") => (
    <g fill={ref("drop")}>
      {Array.from({ length: count }, (_, i) => {
        const x = 36 + i * (50 / Math.max(1, count - 1));
        const duration = speed === "heavy" ? 0.62 : speed === "rain" ? 0.9 : 1.5;
        const size = speed === "drizzle" ? 0.75 : 1;
        return (
          <path
            key={i}
            className={speed === "heavy" ? "wx-drop-slant" : "wx-drop"}
            style={{ animationDelay: `${((i * 0.41) % 1) * duration}s`, animationDuration: `${duration}s` }}
            d={`M${x} ${90 + (i % 2) * 4} q${4.6 * size} ${7 * size} 0 ${11.4 * size} q${-4.6 * size} ${-4.4 * size} 0 ${-11.4 * size}z`}
          />
        );
      })}
    </g>
  );

  let scene: ReactNode;
  switch (kind) {
    case "clear-day":
      scene = sun(60, 60, 28);
      break;
    case "clear-night":
      scene = (
        <>
          {stars}
          {moon(60, 58, 28)}
        </>
      );
      break;
    case "partly-day":
      scene = (
        <>
          <g className="wx-peek">{sun(78, 42, 21)}</g>
          {cloud(false, "translate(-6 10)", "drift")}
        </>
      );
      break;
    case "partly-night":
      scene = (
        <>
          {stars}
          <g className="wx-peek">{moon(80, 40, 19)}</g>
          {cloud(false, "translate(-6 10)", "drift")}
        </>
      );
      break;
    case "cloudy":
      scene = (
        <>
          {cloud(true, "translate(14 -10) scale(0.72)", "drift-back")}
          {cloud(false, "translate(-4 6)", "drift")}
        </>
      );
      break;
    case "fog":
      scene = (
        <>
          {cloud(false, "translate(0 -6)", "float")}
          <g fill="#d3e0f0">
            {[90, 99, 108].map((y, i) => (
              <rect
                key={y}
                className={i % 2 ? "wx-mist-back" : "wx-mist"}
                style={{ animationDelay: `${i * 0.6}s` }}
                x={24 + i * 6}
                y={y}
                width={72 - i * 10}
                height={5}
                rx={2.5}
              />
            ))}
          </g>
        </>
      );
      break;
    case "drizzle":
      scene = (
        <>
          {cloud(false, "translate(0 -8)", "float")}
          {drops(4, "drizzle")}
        </>
      );
      break;
    case "rain":
      scene = (
        <>
          {cloud(true, "translate(0 -8)", "float")}
          {drops(5, "rain")}
        </>
      );
      break;
    case "heavy-rain":
      scene = (
        <>
          {cloud(true, "translate(0 -8)", "rumble")}
          {drops(7, "heavy")}
        </>
      );
      break;
    case "thunder":
      scene = (
        <>
          {cloud(true, "translate(0 -10)", "rumble", true)}
          <polygon className="wx-flash" points="66,68 49,96 62,96 54,120 84,86 69,86 77,68" fill={ref("bolt")} />
        </>
      );
      break;
    case "snow":
      scene = (
        <>
          {cloud(false, "translate(0 -8)", "float")}
          <g fill="#ffffff" stroke="#c9d8ea" strokeWidth={0.8}>
            {[40, 54, 68, 82].map((x, i) => (
              <circle key={x} className="wx-snow" style={{ animationDelay: `${i * 0.55}s` }} cx={x} cy={90 + (i % 2) * 5} r={2.8} />
            ))}
          </g>
        </>
      );
      break;
  }

  return (
    <svg viewBox="0 0 120 120" className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <radialGradient id={`${id}-sun`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="38%" stopColor="#ffe066" />
          <stop offset="78%" stopColor="#ffbe2e" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <radialGradient id={`${id}-sun-glow`}>
          <stop offset="0%" stopColor="rgba(255,206,72,0.6)" />
          <stop offset="100%" stopColor="rgba(255,206,72,0)" />
        </radialGradient>
        <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,214,90,0.15)" />
          <stop offset="100%" stopColor="rgba(255,190,46,0.85)" />
        </linearGradient>
        <radialGradient id={`${id}-moon`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fffdf0" />
          <stop offset="55%" stopColor="#f8e9a8" />
          <stop offset="100%" stopColor="#e2c25e" />
        </radialGradient>
        <radialGradient id={`${id}-moon-glow`}>
          <stop offset="0%" stopColor="rgba(250,232,160,0.5)" />
          <stop offset="100%" stopColor="rgba(250,232,160,0)" />
        </radialGradient>
        <mask id={`${id}-moon-cut`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <rect width="120" height="120" fill="#fff" />
          <circle cx={kind === "partly-night" ? 90 : 73} cy={kind === "partly-night" ? 33 : 48} r={kind === "partly-night" ? 15 : 22} fill="#000" />
        </mask>
        <linearGradient id={`${id}-cloud`} x1="0" y1="26" x2="0" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f6f9fe" />
          <stop offset="82%" stopColor="#dce8f8" />
          <stop offset="100%" stopColor="#b8cdec" />
        </linearGradient>
        <linearGradient id={`${id}-cloud-dark`} x1="0" y1="26" x2="0" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f4f6fa" />
          <stop offset="50%" stopColor="#dde4ee" />
          <stop offset="100%" stopColor="#9fb1cb" />
        </linearGradient>
        <linearGradient id={`${id}-bolt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6b0" />
          <stop offset="45%" stopColor="#ffd43b" />
          <stop offset="100%" stopColor="#f59f00" />
        </linearGradient>
        <linearGradient id={`${id}-drop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ad3ff" />
          <stop offset="100%" stopColor="#1f7ae0" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      {scene}
    </svg>
  );
}
