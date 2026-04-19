import type { ReactElement } from "react";

/*
 * Collapsed panel handle — Photoshop-style vertical tab that sits in place
 * of a collapsed side panel. Click re-expands the panel.
 *
 * The handle keeps a narrow slot in the workspace grid so the stage
 * width never jumps, and it gives users a visible target to reopen the
 * panel without reaching for the keyboard shortcut.
 */

type PanelHandleProps = {
  side: "left" | "right";
  label: string;
  Icon: (props: { size?: number }) => ReactElement;
  onExpand: () => void;
  subtitle?: string;
};

export function PanelHandle({ side, label, Icon, onExpand, subtitle }: PanelHandleProps) {
  return (
    <button
      type="button"
      className={`panel-handle ${side}`}
      onClick={onExpand}
      title={`Expand ${label} (${side === "left" ? "[" : "]"})`}
      aria-label={`Expand ${label}`}
    >
      <span className="panel-handle-icon">
        <Icon size={16} />
      </span>
      <span className="panel-handle-label">{label}</span>
      {subtitle ? <span className="panel-handle-subtitle">{subtitle}</span> : null}
      <span className="panel-handle-chevron" aria-hidden="true">
        {side === "left" ? "›" : "‹"}
      </span>
    </button>
  );
}
