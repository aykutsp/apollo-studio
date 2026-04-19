import type { Entity } from "../../../../packages/core-domain/src";
import { IconBox, IconDoor, IconWall, IconWindow } from "./Icon";

type SceneTreePanelProps = {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
};

const GROUPS = [
  { key: "wall",   label: "Structure", Icon: IconWall },
  { key: "door",   label: "Doors",     Icon: IconDoor },
  { key: "window", label: "Windows",   Icon: IconWindow },
  { key: "object", label: "Items",     Icon: IconBox }
] as const;

export function SceneTreePanel({ entities, selectedEntityId, onSelectEntity }: SceneTreePanelProps) {
  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {GROUPS.map((group) => {
        const items = entities.filter((entity) => entity.type === group.key);
        if (items.length === 0) return null;
        return (
          <div key={group.key} className="tree-section">
            <div className="tree-heading">
              <span>{group.label}</span>
              <span className="count">{items.length}</span>
            </div>
            {items.map((entity) => (
              <button
                key={entity.id}
                type="button"
                className="tree-item"
                aria-selected={selectedEntityId === entity.id}
                onClick={() => onSelectEntity(entity.id)}
              >
                <group.Icon size={14} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entity.name}</span>
                <span className="tag">{entity.type}</span>
              </button>
            ))}
          </div>
        );
      })}

      {entities.length === 0 ? (
        <div className="inspector-empty">
          <IconBox size={28} />
          <div className="title">Empty scene</div>
          <div className="body">Draw a wall, drop a room, or load a sample to get started.</div>
        </div>
      ) : null}
    </div>
  );
}
