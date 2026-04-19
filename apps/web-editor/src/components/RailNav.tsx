import type { ReactElement } from "react";
import { IconBox, IconFolder, IconMessage, IconSettings, IconTree } from "./Icon";

export type LeftPanelTab = "chat" | "scene" | "items" | "files" | "studio";

type TabDef = {
  id: LeftPanelTab;
  label: string;
  shortcut: string;
  Icon: (p: { size?: number }) => ReactElement;
};

/* Grouped by purpose. Primary surfaces the assistant + scene + library;
 * secondary groups files + studio. A visual separator between groups makes
 * the rail feel intentional instead of a flat list of icons. */
const PRIMARY: TabDef[] = [
  { id: "items", label: "Library",   shortcut: "1", Icon: IconBox },
  { id: "scene", label: "Scene",     shortcut: "2", Icon: IconTree },
  { id: "chat",  label: "Assistant", shortcut: "3", Icon: IconMessage }
];

const SECONDARY: TabDef[] = [
  { id: "files",  label: "Files",  shortcut: "4", Icon: IconFolder },
  { id: "studio", label: "Studio", shortcut: "5", Icon: IconSettings }
];

type RailNavProps = {
  value: LeftPanelTab;
  open: boolean;
  onChange: (tab: LeftPanelTab) => void;
  onToggle: (tab: LeftPanelTab) => void;
};

export function RailNav({ value, open, onChange, onToggle }: RailNavProps) {
  const renderButton = (tab: TabDef) => {
    const isActive = value === tab.id && open;
    const isCurrent = value === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        className="rail-button"
        data-active={isActive || undefined}
        data-current={isCurrent || undefined}
        onClick={() => {
          if (value === tab.id) {
            onToggle(tab.id);
          } else {
            onChange(tab.id);
          }
        }}
        title={`${tab.label}`}
        aria-label={tab.label}
        aria-pressed={isActive}
      >
        <span className="rail-button-dot" aria-hidden="true" />
        <tab.Icon size={18} />
        <span className="rail-tooltip">
          <span>{tab.label}</span>
          <kbd className="kbd">{tab.shortcut}</kbd>
        </span>
      </button>
    );
  };

  return (
    <nav className="rail" aria-label="Left navigation">
      <div className="rail-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="rail-group">
        {PRIMARY.map(renderButton)}
      </div>
      <div className="rail-divider" aria-hidden="true" />
      <div className="rail-group">
        {SECONDARY.map(renderButton)}
      </div>
      <div className="rail-group rail-group-bottom">
        <button
          type="button"
          className="rail-button rail-button-muted"
          onClick={() => onToggle(value)}
          title={open ? "Collapse panel ([)" : "Expand panel ([)"}
          aria-label={open ? "Collapse panel" : "Expand panel"}
        >
          <span style={{ fontSize: 14, lineHeight: 1, transform: open ? "scaleX(-1)" : undefined }}>
            ‹
          </span>
        </button>
      </div>
    </nav>
  );
}
