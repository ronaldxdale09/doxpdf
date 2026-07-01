"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered when a descendant throws. Receives a reset to retry rendering. */
  fallback: (reset: () => void) => ReactNode;
  /** Notified on capture (e.g. for logging). */
  onError?: (error: Error) => void;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors in its subtree so one bad page, annotation, or
 * bake never white-screens the whole editor. Because our state lives in
 * module-level Zustand stores (not React state), `reset()` re-renders with the
 * user's work intact — no reload, nothing lost.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[DoxPDF] render error captured by boundary", error);
    this.props.onError?.(error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.fallback(this.reset);
    return this.props.children;
  }
}
