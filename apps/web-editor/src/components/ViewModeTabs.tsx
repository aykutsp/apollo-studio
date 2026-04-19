import type { ReactElement } from "react";
import { IconCube, IconGrid, IconSplit } from "./Icon";

export type ViewMode = "2d" | "3d" | "split";

type ViewModeTabsProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const OPTIONS: { id: ViewMode; label: string; Icon: (p: { size?: number }) => ReactElement }[] = [
  { id: "2d",    label: "Plan",  Icon: IconGrid },
  { id: "3d",    label: "Model", Icon: IconCube },
  { id: "split", label: "Split", Icon: IconSplit }
];

export function ViewModeTabs({ value, onChange }: ViewModeTabsProps) {
  return (
    <div className="view-switcher" role="tablist" aria-label="View mode">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-pressed={value === option.id}
          aria-selected={value === option.id}
          onClick={() => onChange(option.id)}
        >
          <option.Icon size={14} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
