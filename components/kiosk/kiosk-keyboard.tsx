"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { CornerDownLeft, Delete, Move, X } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { KIOSK_IDLE_ATTRACT_EVENT, type KioskIdleAttractDetail } from "@/lib/kiosk-events";
import { pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const ROWS = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"].map((row) => row.split(""));
const EDGE = 12;
const REPEAT_DELAY_MS = 450;
const REPEAT_EVERY_MS = 70;
/** Hide after this long with no key press, drag or tap on the field. */
const IDLE_HIDE_MS = 30_000;
const POSITION_KEY = "kiosk-keyboard-position";

const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "tel", "url", "password", "number", ""]);
/** Types where selectionStart/setSelectionRange are not available. */
const NO_SELECTION_TYPES = new Set(["email", "number"]);

type Editable = HTMLInputElement | HTMLTextAreaElement;
type Position = { x: number; y: number };

function editableFrom(node: EventTarget | null): Editable | null {
  if (node instanceof HTMLTextAreaElement) {
    return node.readOnly || node.disabled ? null : node;
  }
  if (node instanceof HTMLInputElement) {
    if (node.readOnly || node.disabled) return null;
    return TEXT_INPUT_TYPES.has(node.type) ? node : null;
  }
  return null;
}

/** React tracks input values itself; set through the native setter so onChange fires. */
function setValue(el: Editable, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function selectionOf(el: Editable): [number, number] {
  if (el instanceof HTMLInputElement && NO_SELECTION_TYPES.has(el.type)) {
    return [el.value.length, el.value.length];
  }
  return [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length];
}

function placeCaret(el: Editable, at: number) {
  if (el instanceof HTMLInputElement && NO_SELECTION_TYPES.has(el.type)) return;
  el.setSelectionRange(at, at);
}

function typeText(el: Editable, text: string) {
  const [start, end] = selectionOf(el);
  const max = el.maxLength > 0 ? el.maxLength : Infinity;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  if (next.length > max) return;
  setValue(el, next);
  placeCaret(el, start + text.length);
}

function backspace(el: Editable) {
  const [start, end] = selectionOf(el);
  if (start === end && start === 0) return;
  const from = start === end ? start - 1 : start;
  setValue(el, el.value.slice(0, from) + el.value.slice(end));
  placeCaret(el, from);
}

function pressEnter(el: Editable) {
  const init = { key: "Enter", code: "Enter", bubbles: true, cancelable: true };
  const handled = !el.dispatchEvent(new KeyboardEvent("keydown", init));
  el.dispatchEvent(new KeyboardEvent("keyup", init));
  if (handled) return;
  if (el instanceof HTMLTextAreaElement) {
    typeText(el, "\n");
    return;
  }
  el.form?.requestSubmit();
}

function clamp(pos: Position, width: number, height: number): Position {
  return {
    x: Math.min(Math.max(pos.x, EDGE), Math.max(EDGE, window.innerWidth - width - EDGE)),
    y: Math.min(Math.max(pos.y, EDGE), Math.max(EDGE, window.innerHeight - height - EDGE)),
  };
}

function savedPosition(): Position | null {
  try {
    const raw = window.localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Position;
    return Number.isFinite(parsed.x) && Number.isFinite(parsed.y) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Curved fill just outside a row's top corners, so the step down from a wider row above
 * bends smoothly instead of meeting at a sharp inside corner.
 */
function InnerCorners({ size }: { size: number }) {
  if (size <= 0) return null;
  const fill = (at: string) =>
    `radial-gradient(circle at ${at}, transparent ${size - 0.5}px, white ${size}px)`;
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute top-0"
        style={{ width: size, height: size, left: -size, background: fill("0 100%") }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-0"
        style={{ width: size, height: size, right: -size, background: fill("100% 100%") }}
      />
    </>
  );
}

/**
 * Floating on-screen keyboard for the kiosk touch screen.
 * Appears while a text field has focus and hides when it loses it; drag it anywhere on screen.
 * Fields can opt out with a `data-no-kiosk-keyboard` attribute on themselves or a parent.
 */
export function KioskKeyboard() {
  const { language } = useKiosk();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  // Bumped on every use; restarts the idle-hide countdown.
  const [activity, setActivity] = useState(0);
  const touch = useCallback(() => setActivity((count) => count + 1), []);
  // True while the idle countdown or attract video covers the kiosk.
  const idleScreenRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<Editable | null>(null);
  const restoreInputModeRef = useRef<string | null>(null);
  const userPlacedRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; dx: number; dy: number; last: Position | null } | null>(null);
  const repeatRef = useRef<{ delay: number; interval: number }>({ delay: 0, interval: 0 });

  useEffect(() => {
    setMounted(true);
    const saved = savedPosition();
    if (saved) {
      userPlacedRef.current = true;
      setPosition(saved);
    }
  }, []);

  const release = useCallback(() => {
    const target = targetRef.current;
    if (target) {
      if (restoreInputModeRef.current === null) target.removeAttribute("inputmode");
      else target.setAttribute("inputmode", restoreInputModeRef.current);
    }
    targetRef.current = null;
    restoreInputModeRef.current = null;
    setVisible(false);
    setPressed(null);
  }, []);

  /** Bottom center, or top center when that would cover the field being typed in. */
  const autoPlace = useCallback((target: Editable) => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 680;
    const height = panel?.offsetHeight ?? 300;
    const x = (window.innerWidth - width) / 2;
    const bottomY = window.innerHeight - height - 24;
    const field = target.getBoundingClientRect();
    const y = field.bottom > bottomY - 8 ? 24 : bottomY;
    setPosition(clamp({ x, y }, width, height));
  }, []);

  useEffect(() => {
    const attach = (node: EventTarget | null) => {
      if (idleScreenRef.current) return;
      const el = editableFrom(node);
      if (!el || el.closest("[data-no-kiosk-keyboard]")) return;
      touch();
      if (targetRef.current === el) {
        setVisible(true);
        return;
      }
      if (targetRef.current) release();
      targetRef.current = el;
      restoreInputModeRef.current = el.getAttribute("inputmode");
      // Keep the operating system's own touch keyboard from opening on top of this one.
      el.setAttribute("inputmode", "none");
      setVisible(true);
      if (!userPlacedRef.current) autoPlace(el);
    };
    const onFocusIn = (event: FocusEvent) => attach(event.target);
    // Tapping a field that already had focus (e.g. focused before this mounted) fires no focusin.
    const onPointerUp = (event: PointerEvent) => {
      if (event.target === document.activeElement) attach(event.target);
    };
    const onFocusOut = () => {
      // Focus may be moving straight to another field.
      window.setTimeout(() => {
        if (!editableFrom(document.activeElement)) release();
      }, 0);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [autoPlace, release, touch]);

  // A field can disappear while focused (dialog closes, page changes) without a focusout.
  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => {
      const target = targetRef.current;
      if (!target || !target.isConnected || document.activeElement !== target) release();
    }, 500);
    return () => window.clearInterval(timer);
  }, [visible, release]);

  // Keep it on screen when the window size changes.
  useEffect(() => {
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      setPosition((current) => (current ? clamp(current, panel.offsetWidth, panel.offsetHeight) : current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The smart search closes its results on outside mousedown; typing here is not "outside".
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const stop = (event: Event) => event.stopPropagation();
    panel.addEventListener("mousedown", stop);
    return () => panel.removeEventListener("mousedown", stop);
  }, [mounted]);

  const stopRepeat = useCallback(() => {
    window.clearTimeout(repeatRef.current.delay);
    window.clearInterval(repeatRef.current.interval);
    setPressed(null);
  }, []);

  useEffect(() => stopRepeat, [stopRepeat]);

  /** Hide until the field is tapped again; the field keeps its focus and text. */
  const close = useCallback(() => {
    stopRepeat();
    setVisible(false);
  }, [stopRepeat]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(close, IDLE_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [visible, activity, close]);

  // The idle countdown / attract video takes the whole screen; the keyboard steps aside until a field is tapped again.
  useEffect(() => {
    const onIdleAttract = (event: Event) => {
      const active = (event as CustomEvent<KioskIdleAttractDetail>).detail?.active === true;
      idleScreenRef.current = active;
      if (active) close();
    };
    window.addEventListener(KIOSK_IDLE_ATTRACT_EVENT, onIdleAttract);
    return () => window.removeEventListener(KIOSK_IDLE_ATTRACT_EVENT, onIdleAttract);
  }, [close]);

  const press = useCallback(
    (key: string, event: ReactPointerEvent) => {
      // Never take focus from the field being typed in. (Still bubbles, so the kiosk's idle screen sees the activity.)
      event.preventDefault();
      const target = targetRef.current;
      if (!target) return;
      touch();
      setPressed(key);
      if (key === "enter") {
        pressEnter(target);
        return;
      }
      if (key === "backspace") {
        backspace(target);
        repeatRef.current.delay = window.setTimeout(() => {
          repeatRef.current.interval = window.setInterval(() => {
            if (targetRef.current) backspace(targetRef.current);
          }, REPEAT_EVERY_MS);
        }, REPEAT_DELAY_MS);
        return;
      }
      typeText(target, key);
    },
    [touch]
  );

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Keys type; only the frame around them drags.
    if ((event.target as HTMLElement).closest("button")) return;
    const panel = panelRef.current;
    if (!panel) return;
    touch();
    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      last: null,
    };
    // Capture on the row / grip that was grabbed: the outer frame itself lets taps through.
    (event.target as Element).setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel || drag.pointerId !== event.pointerId) return;
    drag.last = clamp(
      { x: event.clientX - drag.dx, y: event.clientY - drag.dy },
      panel.offsetWidth,
      panel.offsetHeight
    );
    setPosition(drag.last);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.last) return;
    userPlacedRef.current = true;
    try {
      window.localStorage.setItem(POSITION_KEY, JSON.stringify(drag.last));
    } catch {
      // Position just won't be remembered.
    }
  };

  if (!mounted) return null;

  const keyBase =
    "flex aspect-square w-[clamp(2.75rem,4.6vw,3.6rem)] items-center justify-center rounded-full text-xl font-semibold select-none transition-[transform,background-color,color] duration-100";
  // One solid white shape: header and rows touch, each row as wide as its keys, so the outline steps in
  // instead of being a box. Only corners that stick out past the row below are rounded.
  const surface = "pointer-events-auto cursor-grab touch-none bg-white active:cursor-grabbing";
  // Key size scales with the screen, so row heights land on fractional pixels; overlapping by 1px
  // keeps a hairline seam from showing where two rows meet.
  const joined = "relative -mt-px";
  // The number row overhangs the next row by only half a key, so its corners stay small enough to
  // leave room for the inner curve below them.
  const rowShape = ["rounded-b-[12px] px-2 pt-0 pb-1", "px-2 py-1", "rounded-b-[1.75rem] px-2 py-1", "rounded-b-[1.75rem] px-2 py-1"];
  /** Inner (concave) corner size where a row is narrower than the one above it; 0 = same width. */
  const innerCorner = [0, 12, 0, 16];
  const keySize = "clamp(2.75rem,4.6vw,3.6rem)";

  return createPortal(
    <div
      ref={panelRef}
      role="group"
      aria-label="On-screen keyboard"
      aria-hidden={!visible}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        // drop-shadow follows the combined outline, so there are no shadow seams between rows.
        "pointer-events-none fixed top-0 left-0 z-[200] flex flex-col items-center drop-shadow-[0_14px_28px_rgba(15,26,46,0.32)]",
        "transition-[opacity,translate] duration-200 ease-out",
        visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"
      )}
      style={{
        // Placed (autoPlace or a saved spot) before it is ever shown.
        transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : "translate3d(-9999px, 0, 0)",
      }}
    >
      <div
        title={pickLang(language, "Drag to move the keyboard", "I-drag para ilipat ang keyboard", "I-drag aron ibalhin ang keyboard")}
        className={cn(surface, "relative flex h-12 w-full items-center justify-center gap-2 rounded-t-[1.75rem] text-slate-500")}
      >
        <Move aria-hidden className="pointer-events-none h-5 w-5" />
        <button
          type="button"
          tabIndex={-1}
          aria-label={pickLang(language, "Close keyboard", "Isara ang keyboard", "Isira ang keyboard")}
          onPointerDown={(event) => event.preventDefault()}
          onClick={close}
          className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-kiosk-navy active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className={cn(surface, joined, "flex gap-2", rowShape[rowIndex])}>
          <InnerCorners size={innerCorner[rowIndex]} />
          {row.map((key) => (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              onPointerDown={(event) => press(key, event)}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
              className={cn(
                keyBase,
                rowIndex === 0 ? "bg-slate-50 text-slate-600 ring-1 ring-slate-200" : "bg-slate-100 text-kiosk-navy",
                pressed === key && "scale-95 bg-kiosk-navy text-white ring-0"
              )}
            >
              {key}
            </button>
          ))}
          {rowIndex === 0 ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Backspace"
              onPointerDown={(event) => press("backspace", event)}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
              className={cn(
                keyBase,
                "bg-slate-200 text-kiosk-navy",
                pressed === "backspace" && "scale-95 bg-kiosk-navy text-white"
              )}
            >
              <Delete className="h-6 w-6" />
            </button>
          ) : null}
          {rowIndex === 2 ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Enter"
              onPointerDown={(event) => press("enter", event)}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
              className={cn(keyBase, "bg-kiosk-green text-white", pressed === "enter" && "scale-95 brightness-90")}
            >
              <CornerDownLeft className="h-6 w-6" />
            </button>
          ) : null}
        </div>
      ))}
      <div className={cn(surface, joined, "rounded-b-[1.75rem] px-2 pt-1 pb-2")}>
        <InnerCorners size={16} />
        <button
          type="button"
          tabIndex={-1}
          aria-label={pickLang(language, "Space", "Espasyo", "Espasyo")}
          onPointerDown={(event) => press(" ", event)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          // As wide as five keys and their gaps.
          style={{ height: keySize, width: `calc(${keySize} * 5 + 2rem)` }}
          className={cn(
            "flex items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-500 select-none transition-[transform,background-color,color] duration-100",
            pressed === " " && "scale-[0.98] bg-kiosk-navy text-white"
          )}
        >
          space
        </button>
      </div>
    </div>,
    document.body
  );
}
