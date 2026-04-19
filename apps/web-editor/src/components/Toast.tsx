import { useEffect, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export type ToastMessage = {
  id: number;
  kind: ToastKind;
  text: string;
};

type Subscriber = (toasts: ToastMessage[]) => void;

const MAX_VISIBLE = 3;
const DEFAULT_TIMEOUT_MS = 3000;

let nextId = 1;
let toasts: ToastMessage[] = [];
const subscribers = new Set<Subscriber>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function notify(): void {
  for (const sub of subscribers) {
    sub([...toasts]);
  }
}

function push(kind: ToastKind, text: string): void {
  const id = nextId++;
  const message: ToastMessage = { id, kind, text };
  toasts = [...toasts, message].slice(-MAX_VISIBLE);
  notify();

  const timer = setTimeout(() => {
    dismiss(id);
  }, DEFAULT_TIMEOUT_MS);
  timers.set(id, timer);
}

function dismiss(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  notify();
}

export const toast = {
  success(text: string): void {
    push("success", text);
  },
  error(text: string): void {
    push("error", text);
  },
  info(text: string): void {
    push("info", text);
  },
  dismiss
};

function useToasts(): ToastMessage[] {
  const [state, setState] = useState<ToastMessage[]>(toasts);
  useEffect(() => {
    subscribers.add(setState);
    return () => {
      subscribers.delete(setState);
    };
  }, []);
  return state;
}

const KIND_STYLES: Record<ToastKind, { accent: string; label: string }> = {
  success: { accent: "oklch(0.72 0.15 150)", label: "OK" },
  error: { accent: "oklch(0.65 0.22 28)", label: "Error" },
  info: { accent: "var(--accent, oklch(0.78 0.16 75))", label: "Info" }
};

export function Toaster() {
  const items = useToasts();

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 9999,
        maxWidth: "min(360px, calc(100vw - 32px))",
        pointerEvents: "none"
      }}
    >
      {items.map((toastMessage) => {
        const style = KIND_STYLES[toastMessage.kind];
        return (
          <div
            key={toastMessage.id}
            role="status"
            style={{
              pointerEvents: "auto",
              background: "var(--surface-raised, #1a1a1a)",
              border: "1px solid var(--border-default, #333)",
              borderLeft: `3px solid ${style.accent}`,
              borderRadius: 6,
              padding: "10px 12px",
              color: "var(--fg-primary, #f0f0f0)",
              fontSize: "var(--fs-sm, 13px)",
              lineHeight: "var(--lh-normal, 1.4)",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "start",
              columnGap: 12,
              boxShadow: "0 6px 24px rgba(0, 0, 0, 0.28)"
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "var(--fs-2xs, 10px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: style.accent,
                  marginBottom: 2
                }}
              >
                {style.label}
              </div>
              <div>{toastMessage.text}</div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toastMessage.id)}
              aria-label="Dismiss"
              style={{
                background: "transparent",
                border: 0,
                color: "var(--fg-tertiary, #888)",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 2
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
