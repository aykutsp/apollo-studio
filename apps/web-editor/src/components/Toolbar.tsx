import type { ReactElement } from "react";
import type { ToolMode } from "../../../../packages/editor-state/src";
import {
  IconCursor,
  IconHand,
  IconRoom,
  IconRuler,
  IconSparkles,
  IconWall
} from "./Icon";

type ToolbarProps = {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
};

type ToolDef = {
  id: ToolMode;
  label: string;
  shortcut: string;
  Icon: (props: { size?: number }) => ReactElement;
};

const TOOLS: ToolDef[] = [
  { id: "select",           label: "Select",  shortcut: "V", Icon: IconCursor },
  { id: "pan",              label: "Pan",     shortcut: "H", Icon: IconHand },
  { id: "draw-wall",        label: "Wall",    shortcut: "W", Icon: IconWall },
  { id: "draw-room",        label: "Room",    shortcut: "R", Icon: IconRoom },
  { id: "place-component",  label: "Place",   shortcut: "P", Icon: IconSparkles },
  { id: "measure",          label: "Measure", shortcut: "M", Icon: IconRuler }
];

export function Toolbar({ activeTool, onSelectTool }: ToolbarProps) {
  return (
    <div className="tool-dock" role="toolbar" aria-label="Primary tools">
      {TOOLS.map((tool, idx) => (
        <div key={tool.id} style={{ display: "contents" }}>
          {idx === 2 || idx === 5 ? <span className="tool-dock-divider" aria-hidden="true" /> : null}
          <button
            type="button"
            className="tool-dock-button"
            aria-pressed={activeTool === tool.id}
            onClick={() => onSelectTool(tool.id)}
            title={`${tool.label}  (${tool.shortcut})`}
            aria-label={`${tool.label} tool, shortcut ${tool.shortcut}`}
          >
            <tool.Icon size={16} />
            <span>{tool.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
