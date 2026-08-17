"use client";

import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class Building3DErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("Building 3D viewer failed to load:", error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-center sm:px-6">
          <p className="text-sm font-semibold text-amber-900">3D building layout failed to load</p>
          <p className="max-w-sm text-xs text-amber-800">
            This is often caused by a stale dev cache. Stop the dev server, then run{" "}
            <code className="rounded bg-white/80 px-1">npm run dev:clean</code>{" "}
            (or delete the <code className="rounded bg-white/80 px-1">.next</code> folder and run{" "}
            <code className="rounded bg-white/80 px-1">npm run dev</code>).
          </p>
          {process.env.NODE_ENV === "development" && this.state.errorMessage ? (
            <p className="max-w-sm break-all text-[10px] text-amber-700/90">
              {this.state.errorMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-kiosk-navy px-4 py-2 text-xs font-semibold text-white hover:bg-kiosk-navy/90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
