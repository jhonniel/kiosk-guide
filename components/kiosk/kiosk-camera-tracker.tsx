"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useKiosk } from "@/hooks/use-kiosk";
import { getKioskSessionId } from "@/features/kiosk/visit-tracking";
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import { getBoolSetting } from "@/features/settings/settings-helpers";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";

const MIN_CAPTURE_MS = 8_000;
const CAMERA_RETRY_MS = 4_000;

/**
 * Captures a webcam snapshot on each kiosk navigation for admin session tracking.
 * Video preview is hidden from visitors; images are stored server-side for admin only.
 */
export function KioskCameraTracker() {
  const pathname = usePathname();
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const settings = data.settings ?? {};
  const offlineEnabled = getBoolSetting(settings, "kiosk_camera_tracking_enabled");
  const [liveEnabled, setLiveEnabled] = useState<boolean | null>(null);
  const enabled = liveEnabled ?? offlineEnabled;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastCaptureAtRef = useRef(0);
  const pendingRef = useRef(false);
  const pendingPageRef = useRef<string | null>(null);
  const startingRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  const secureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost");

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch(`/api/kiosk/display-settings?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { cameraTrackingEnabled?: boolean };
        if (!cancelled && typeof json.cameraTrackingEnabled === "boolean") {
          setLiveEnabled(json.cameraTrackingEnabled);
        }
      } catch {
        // keep offline/bundle value
      }
    }
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    startingRef.current = false;
    setCameraReady(false);
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  const markCameraReady = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setCameraReady(true);
    setNeedsGesture(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled || streamRef.current || startingRef.current || typeof navigator === "undefined") {
      return;
    }
    if (!secureContext) {
      setNeedsGesture(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      markCameraReady();
    } catch (error) {
      stopCamera();
      const name = error instanceof DOMException ? error.name : "";
      // Browsers often block camera until the visitor taps the screen once.
      if (name === "NotAllowedError" || name === "SecurityError") {
        setNeedsGesture(true);
      }
    } finally {
      startingRef.current = false;
    }
  }, [enabled, markCameraReady, secureContext, stopCamera]);

  const captureAndUpload = useCallback(
    async (page: string) => {
      if (!enabled || pendingRef.current) return;

      const video = videoRef.current;
      if (!video || !cameraReady || video.videoWidth === 0) {
        pendingPageRef.current = page;
        return;
      }

      const now = Date.now();
      if (lastCaptureAtRef.current > 0 && now - lastCaptureAtRef.current < MIN_CAPTURE_MS) {
        pendingPageRef.current = page;
        return;
      }

      pendingRef.current = true;
      pendingPageRef.current = null;
      try {
        const canvas = document.createElement("canvas");
        const width = 640;
        const height = Math.round((video.videoHeight / video.videoWidth) * width) || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.72)
        );
        if (!blob) return;

        const form = new FormData();
        form.set("sessionId", getKioskSessionId());
        form.set("page", page);
        form.set("language", language);
        form.set("image", blob, "capture.jpg");

        const res = await fetch("/api/kiosk/session-capture", {
          method: "POST",
          body: form,
        });
        if (res.ok) {
          lastCaptureAtRef.current = now;
        }
      } catch {
        // ignore capture failures
      } finally {
        pendingRef.current = false;
        const pending = pendingPageRef.current;
        if (pending && pending !== page) {
          pendingPageRef.current = null;
          void captureAndUpload(pending);
        }
      }
    },
    [cameraReady, enabled, language]
  );

  const requestCameraFromGesture = useCallback(() => {
    void startCamera();
  }, [startCamera]);

  useEffect(() => {
    if (!enabled) {
      stopCamera();
      setNeedsGesture(false);
      return;
    }

    void startCamera();
    const retryTimer = window.setInterval(() => {
      if (!streamRef.current && !startingRef.current) {
        void startCamera();
      }
    }, CAMERA_RETRY_MS);

    return () => {
      window.clearInterval(retryTimer);
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  useEffect(() => {
    if (!enabled || !needsGesture) return;

    const onGesture = () => {
      requestCameraFromGesture();
    };

    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [enabled, needsGesture, requestCameraFromGesture]);

  useEffect(() => {
    if (!enabled || !cameraReady) return;
    const page = normalizeVisitPage(pathname);
    if (!page) return;
    void captureAndUpload(page);
  }, [pathname, enabled, cameraReady, captureAndUpload]);

  useEffect(() => {
    if (!enabled || !cameraReady) return;
    const pending = pendingPageRef.current;
    if (!pending) return;
    void captureAndUpload(pending);
  }, [cameraReady, enabled, captureAndUpload]);

  if (!enabled) return null;

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-hidden
        onLoadedData={markCameraReady}
        className="pointer-events-none fixed left-0 top-0 z-0 h-[480px] w-[640px] opacity-[0.01]"
      />
      {needsGesture && secureContext ? (
        <button
          type="button"
          onClick={requestCameraFromGesture}
          className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-kiosk-navy/90 px-4 py-2 text-xs font-semibold text-white shadow-lg"
        >
          Tap to enable kiosk camera
        </button>
      ) : null}
      {!secureContext ? (
        <p className="sr-only">
          Camera tracking requires localhost or HTTPS. Open http://localhost:3000 instead of an IP
          address.
        </p>
      ) : null}
    </>
  );
}
