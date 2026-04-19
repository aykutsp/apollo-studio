import { useCallback, useEffect, useMemo, useState } from "react";
import {
  measureWallLength,
  type DoorEntity,
  type Entity,
  type ObjectEntity,
  type WallEntity,
  type WindowEntity
} from "../../../../packages/core-domain/src";
import { IconBox, IconCopy, IconTrash } from "./Icon";

/** Paint / wallpaper presets shown as quick-apply swatches on wall inspector. */
const FINISH_PRESETS: { color: string; material: string; name: string }[] = [
  { color: "#f4f0e8", material: "Warm White Plaster",  name: "Warm White" },
  { color: "#dadde4", material: "Cool White Plaster",  name: "Cool White" },
  { color: "#e8e0cf", material: "Linen Paint",          name: "Linen" },
  { color: "#d8c9a8", material: "Sand Paint",           name: "Sand" },
  { color: "#b8a990", material: "Clay Plaster",         name: "Clay" },
  { color: "#8a7a60", material: "Tobacco Paint",        name: "Tobacco" },
  { color: "#5a4d40", material: "Cacao Paint",          name: "Cacao" },
  { color: "#3a3f4a", material: "Slate Paint",          name: "Slate" },
  { color: "#242a35", material: "Midnight Paint",       name: "Midnight" },
  { color: "#a9605a", material: "Terracotta Paint",     name: "Terracotta" },
  { color: "#6b7c5d", material: "Olive Paint",          name: "Olive" },
  { color: "#4f7a8a", material: "Teal Paint",           name: "Teal" },
  { color: "#a88253", material: "Oak Veneer",           name: "Oak" },
  { color: "#3d2a1c", material: "Walnut Veneer",        name: "Walnut" },
  { color: "#c8c2b4", material: "Raw Concrete",         name: "Concrete" },
  { color: "#a15a3d", material: "Red Brick",            name: "Red Brick" }
];

const RECENT_STORAGE_KEY = "apollo:recentColors";
const MAX_RECENTS = 10;

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string").slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function pushRecent(color: string): string[] {
  const current = loadRecents();
  const next = [color, ...current.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / privacy mode errors
  }
  return next;
}

type PropertyPanelProps = {
  selection: Entity | null;
  unitSystem: string;
  projectColors: string[];
  onUpdateWall: <K extends keyof WallEntity>(wall: WallEntity, key: K, value: WallEntity[K]) => void;
  onUpdateWallFinish?: (wall: WallEntity, color: string, material: string) => void;
  onUpdateObject: <K extends keyof ObjectEntity>(object: ObjectEntity, key: K, value: ObjectEntity[K]) => void;
  onUpdateOpening: <T extends DoorEntity | WindowEntity, K extends keyof T>(opening: T, key: K, value: T[K]) => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function PropertyPanel({
  selection,
  unitSystem,
  projectColors,
  onUpdateWall,
  onUpdateWallFinish,
  onUpdateObject,
  onUpdateOpening,
  onDuplicate,
  onDelete
}: PropertyPanelProps) {
  const [recents, setRecents] = useState<string[]>(() => loadRecents());

  const commitColor = useCallback(
    (wall: WallEntity, color: string) => {
      onUpdateWall(wall, "color", color);
      setRecents(pushRecent(color));
    },
    [onUpdateWall]
  );

  const commitFinish = useCallback(
    (wall: WallEntity, color: string, material: string) => {
      if (onUpdateWallFinish) {
        onUpdateWallFinish(wall, color, material);
      } else {
        onUpdateWall(wall, "color", color);
        onUpdateWall({ ...wall, color }, "material", material);
      }
      setRecents(pushRecent(color));
    },
    [onUpdateWall, onUpdateWallFinish]
  );
  if (!selection) {
    return (
      <div className="inspector-empty">
        <IconBox size={32} />
        <div className="title">Nothing selected</div>
        <div className="body">Click a wall, opening, or item in the viewport to edit its parameters.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div className="inspector-head">
        <div>
          <div className="subject">{selection.name}</div>
          <div className="subject-meta">ID · {selection.id}</div>
        </div>
        <span className="type-badge">{selection.type}</span>
      </div>

      {selection.type === "wall" ? (
        <WallFields
          wall={selection}
          unitSystem={unitSystem}
          onUpdate={onUpdateWall}
          onPickColor={(color) => commitColor(selection, color)}
          onPickPreset={(color, material) => commitFinish(selection, color, material)}
          projectColors={projectColors}
          recents={recents}
        />
      ) : null}
      {selection.type === "object" ? <ObjectFields object={selection} onUpdate={onUpdateObject} /> : null}
      {(selection.type === "door" || selection.type === "window") ? (
        <OpeningFields opening={selection} onUpdate={onUpdateOpening} />
      ) : null}

      <div className="inspector-actions">
        <button type="button" className="btn" onClick={onDuplicate}>
          <IconCopy /> Duplicate
        </button>
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          <IconTrash /> Delete
        </button>
      </div>
    </div>
  );
}

function WallFields({
  wall,
  unitSystem,
  onUpdate,
  onPickColor,
  onPickPreset,
  projectColors,
  recents
}: {
  wall: WallEntity;
  unitSystem: string;
  onUpdate: <K extends keyof WallEntity>(wall: WallEntity, key: K, value: WallEntity[K]) => void;
  onPickColor: (color: string) => void;
  onPickPreset: (color: string, material: string) => void;
  projectColors: string[];
  recents: string[];
}) {
  const currentColor = wall.color ?? "#dadde4";
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of projectColors) {
      const norm = c.toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        out.push(c);
      }
    }
    return out.slice(0, 12);
  }, [projectColors]);

  return (
    <>
      <div className="section">
        <div className="section-title">Geometry</div>
        <FieldText label="Name" value={wall.name} onChange={(v) => onUpdate(wall, "name", v)} />
        <div className="field-row">
          <FieldNumber label="Start X" value={wall.start.x} onChange={(v) => onUpdate(wall, "start", { ...wall.start, x: v })} />
          <FieldNumber label="Start Y" value={wall.start.y} onChange={(v) => onUpdate(wall, "start", { ...wall.start, y: v })} />
          <FieldNumber label="End X" value={wall.end.x} onChange={(v) => onUpdate(wall, "end", { ...wall.end, x: v })} />
          <FieldNumber label="End Y" value={wall.end.y} onChange={(v) => onUpdate(wall, "end", { ...wall.end, y: v })} />
        </div>
        <div className="metric-inline">
          <span>Length</span>
          <span className="value">{measureWallLength(wall).toFixed(3)} {unitSystem}</span>
        </div>
      </div>
      <div className="section">
        <div className="section-title">Build</div>
        <div className="field-row">
          <FieldNumber label="Thickness" value={wall.thickness} step={0.05} onChange={(v) => onUpdate(wall, "thickness", v)} />
          <FieldNumber label="Height" value={wall.height} step={0.1} onChange={(v) => onUpdate(wall, "height", v)} />
        </div>
        <FieldText label="Material" value={wall.material} onChange={(v) => onUpdate(wall, "material", v)} />
        <FieldColor
          label="Color"
          value={currentColor}
          onChange={(v) => onPickColor(v)}
        />
      </div>
      <div className="section">
        <div className="section-title">Finish</div>
        <SwatchRow
          label="Paint & wallpaper"
          items={FINISH_PRESETS.map((p) => ({ color: p.color, title: `${p.name} · ${p.material}` }))}
          current={currentColor}
          onPick={(i) => onPickPreset(FINISH_PRESETS[i].color, FINISH_PRESETS[i].material)}
        />
        {deduped.length > 0 ? (
          <SwatchRow
            label="Project palette"
            items={deduped.map((color) => ({ color, title: color }))}
            current={currentColor}
            onPick={(i) => onPickColor(deduped[i])}
          />
        ) : null}
        {recents.length > 0 ? (
          <SwatchRow
            label="Recent"
            items={recents.map((color) => ({ color, title: color }))}
            current={currentColor}
            onPick={(i) => onPickColor(recents[i])}
          />
        ) : null}
      </div>
    </>
  );
}

function SwatchRow({
  label,
  items,
  current,
  onPick
}: {
  label: string;
  items: { color: string; title: string }[];
  current: string;
  onPick: (index: number) => void;
}) {
  return (
    <div className="field-group">
      <span className="field-label">{label}</span>
      <div className="swatch-row">
        {items.map((item, index) => {
          const active = item.color.toLowerCase() === current.toLowerCase();
          return (
            <button
              key={`${label}-${index}-${item.color}`}
              type="button"
              className={`swatch${active ? " active" : ""}`}
              style={{ background: item.color }}
              onClick={() => onPick(index)}
              title={item.title}
              aria-label={item.title}
            />
          );
        })}
      </div>
    </div>
  );
}

function ObjectFields({
  object,
  onUpdate
}: {
  object: ObjectEntity;
  onUpdate: <K extends keyof ObjectEntity>(object: ObjectEntity, key: K, value: ObjectEntity[K]) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">Position</div>
        <FieldText label="Name" value={object.name} onChange={(v) => onUpdate(object, "name", v)} />
        <div className="field-row-3">
          <FieldNumber label="X" value={object.position.x} step={0.1} onChange={(v) => onUpdate(object, "position", { ...object.position, x: v })} />
          <FieldNumber label="Y" value={object.position.y} step={0.1} onChange={(v) => onUpdate(object, "position", { ...object.position, y: v })} />
          <FieldNumber label="Z" value={object.position.z} step={0.1} onChange={(v) => onUpdate(object, "position", { ...object.position, z: v })} />
        </div>
        <FieldNumber label="Rotation (°)" value={object.rotation.y} step={15} onChange={(v) => onUpdate(object, "rotation", { ...object.rotation, y: v })} />
      </div>
      <div className="section">
        <div className="section-title">Size</div>
        <div className="field-row-3">
          <FieldNumber label="Width" value={object.footprint.x} step={0.05} onChange={(v) => onUpdate(object, "footprint", { ...object.footprint, x: v })} />
          <FieldNumber label="Depth" value={object.footprint.y} step={0.05} onChange={(v) => onUpdate(object, "footprint", { ...object.footprint, y: v })} />
          <FieldNumber label="Height" value={object.height} step={0.05} onChange={(v) => onUpdate(object, "height", v)} />
        </div>
        <div className="field-row-3">
          <FieldNumber label="Scale X" value={object.scale.x} step={0.05} onChange={(v) => onUpdate(object, "scale", { ...object.scale, x: v })} />
          <FieldNumber label="Scale Y" value={object.scale.y} step={0.05} onChange={(v) => onUpdate(object, "scale", { ...object.scale, y: v })} />
          <FieldNumber label="Scale Z" value={object.scale.z} step={0.05} onChange={(v) => onUpdate(object, "scale", { ...object.scale, z: v })} />
        </div>
      </div>
      <div className="section">
        <div className="section-title">Finish</div>
        <FieldText label="Material" value={object.material} onChange={(v) => onUpdate(object, "material", v)} />
        <FieldText label="Asset key" value={object.assetKey} onChange={(v) => onUpdate(object, "assetKey", v)} />
      </div>
    </>
  );
}

function OpeningFields<T extends DoorEntity | WindowEntity>({
  opening,
  onUpdate
}: {
  opening: T;
  onUpdate: <TEntity extends DoorEntity | WindowEntity, K extends keyof TEntity>(opening: TEntity, key: K, value: TEntity[K]) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">Opening</div>
        <FieldText label="Name" value={opening.name} onChange={(v) => onUpdate(opening, "name" as keyof T, v as T[keyof T])} />
        <div className="field-row">
          <FieldNumber label="Offset" value={opening.offsetAlongWall} step={0.05} onChange={(v) => onUpdate(opening, "offsetAlongWall" as keyof T, v as T[keyof T])} />
          <FieldNumber label="Width" value={opening.width} step={0.05} onChange={(v) => onUpdate(opening, "width" as keyof T, v as T[keyof T])} />
          <FieldNumber label="Height" value={opening.height} step={0.05} onChange={(v) => onUpdate(opening, "height" as keyof T, v as T[keyof T])} />
          {opening.type === "window" ? (
            <FieldNumber
              label="Sill"
              value={(opening as WindowEntity).sillHeight}
              step={0.05}
              onChange={(v) => onUpdate(opening, "sillHeight" as keyof T, v as T[keyof T])}
            />
          ) : null}
        </div>
      </div>
      <div className="section">
        <div className="section-title">Host</div>
        <FieldText label="Material" value={opening.material} onChange={(v) => onUpdate(opening, "material" as keyof T, v as T[keyof T])} />
        <div className="metric-inline">
          <span>Hosted on wall</span>
          <span className="value">{opening.hostWallId}</span>
        </div>
      </div>
    </>
  );
}

function FieldText({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-group">
      <span className="field-label">{label}</span>
      <input className="input" type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  step
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="field-group">
      <span className="field-label">{label}</span>
      <input
        className="input"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step ?? "any"}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) {
            onChange(parsed);
          }
        }}
      />
    </label>
  );
}

function FieldColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-group">
      <span className="field-label">{label}</span>
      <div style={{ display: "grid", gridTemplateColumns: "38px 1fr", gap: "var(--space-2)" }}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{ width: 38, height: 30, padding: 0, border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "transparent" }}
          aria-label={`${label} picker`}
        />
        <input
          className="input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
        />
      </div>
    </label>
  );
}
