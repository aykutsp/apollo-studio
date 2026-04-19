import { useEffect, useMemo, useRef, useState } from "react";
import {
  getWallById,
  measureWallLength,
  openingCenterOnWall,
  roundValue,
  type DoorEntity,
  type Entity,
  type ObjectEntity,
  type Scene,
  type Vec2,
  type WallEntity,
  type WindowEntity
} from "../../../../packages/core-domain/src";
import type { Measurement, ToolMode } from "../../../../packages/editor-state/src";
import { useCameraStore } from "../store/cameraStore";
import { buildEntityContextItems, ContextMenu } from "./ContextMenu";

type PlanView2DProps = {
  scene: Scene;
  entities: Entity[];
  selectedEntityId: string | null;
  activeTool: ToolMode;
  wallStart: Vec2 | null;
  roomStart: Vec2 | null;
  measureStart: Vec2 | null;
  measurement: Measurement | null;
  planSize: number;
  viewportSize: number;
  onCanvasPoint: (point: Vec2, shiftKey: boolean) => void;
  onCanvasPointerMove: (point: Vec2) => void;
  onCommitRoom: (start: Vec2, end: Vec2) => void;
  onSetRoomStart: (point: Vec2 | null) => void;
  onCommitMeasurement: (start: Vec2, end: Vec2) => void;
  onSetMeasureStart: (point: Vec2 | null) => void;
  onSelectEntity: (entityId: string) => void;
  onBeginEntityDrag: (
    entityId: string,
    point: Vec2,
    pointFromClient: (clientX: number, clientY: number) => Vec2
  ) => void;
  onPlaceHostedOpening: (wallId: string, point: Vec2) => void;
  /* Optional context-menu actions. If omitted, the entries are disabled. */
  onDuplicateEntity?: (entityId: string) => void;
  onDeleteEntity?: (entityId: string) => void;
  onRenameEntity?: (entityId: string, nextName: string) => void;
};

type PointFromClient = (clientX: number, clientY: number, svg: SVGSVGElement) => Vec2;
type ViewBoxState = { x: number; y: number; size: number };

const GRID_MINOR = 0.5;
const GRID_MAJOR = 2.5;
const SNAP_RADIUS_SCREEN = 10;

export function PlanView2D({
  scene,
  entities,
  selectedEntityId,
  activeTool,
  wallStart,
  roomStart,
  measureStart,
  measurement,
  planSize,
  viewportSize,
  onCanvasPoint,
  onCanvasPointerMove,
  onCommitRoom,
  onSetRoomStart,
  onCommitMeasurement,
  onSetMeasureStart,
  onSelectEntity,
  onBeginEntityDrag,
  onPlaceHostedOpening,
  onDuplicateEntity,
  onDeleteEntity,
  onRenameEntity
}: PlanView2DProps) {
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    entityId: string | null;
  }>({ open: false, x: 0, y: 0, entityId: null });

  const openEntityContextMenu = (entityId: string, clientX: number, clientY: number) => {
    setContextMenu({ open: true, x: clientX, y: clientY, entityId });
    onSelectEntity(entityId);
  };
  const closeContextMenu = () => setContextMenu((c) => ({ ...c, open: false }));

  const targetEntity = contextMenu.entityId
    ? entities.find((e) => e.id === contextMenu.entityId) ?? null
    : null;

  const contextItems = buildEntityContextItems({
    onSelect: () => {
      if (contextMenu.entityId) onSelectEntity(contextMenu.entityId);
    },
    onDuplicate: () => {
      if (contextMenu.entityId && onDuplicateEntity) onDuplicateEntity(contextMenu.entityId);
    },
    onDelete: () => {
      if (contextMenu.entityId && onDeleteEntity) onDeleteEntity(contextMenu.entityId);
    },
    onRename: () => {
      if (!contextMenu.entityId || !onRenameEntity || !targetEntity) return;
      const current = "name" in targetEntity ? targetEntity.name : "";
      const next = window.prompt("Rename entity", current);
      if (next != null && next.trim() && next !== current) {
        onRenameEntity(contextMenu.entityId, next.trim());
      }
    },
    canDuplicate: Boolean(onDuplicateEntity),
    canDelete: Boolean(onDeleteEntity),
    canRename: Boolean(onRenameEntity && targetEntity)
  });

  const [viewBox, setViewBox] = useState<ViewBoxState>({ x: 0, y: 0, size: viewportSize });
  const [cursor, setCursor] = useState<Vec2 | null>(null);
  const [cursorScreen, setCursorScreen] = useState<{ x: number; y: number } | null>(null);
  const showCamera2D = useCameraStore((state) => state.showCamera2D);
  const setShowCamera2D = useCameraStore((state) => state.setShowCamera2D);
  const [isShift, setIsShift] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const numericInputRef = useRef<HTMLInputElement | null>(null);
  const [numericLength, setNumericLength] = useState("");
  const panSessionRef = useRef<{
    startClientX: number;
    startClientY: number;
    startViewBox: ViewBoxState;
    moved: boolean;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const suppressCanvasClickRef = useRef(false);

  const minViewSize = viewportSize * 0.18;
  const maxViewSize = viewportSize * 2;

  const clampViewBox = (next: ViewBoxState): ViewBoxState => ({
    size: Math.min(Math.max(next.size, minViewSize), maxViewSize),
    x: next.x,
    y: next.y
  });

  const pointFromClient: PointFromClient = (clientX, clientY, svg) => {
    const rect = svg.getBoundingClientRect();
    const ratioX = (clientX - rect.left) / rect.width;
    const ratioY = (clientY - rect.top) / rect.height;
    const svgX = viewBox.x + ratioX * viewBox.size;
    const svgY = viewBox.y + ratioY * viewBox.size;
    const x = (svgX / viewportSize) * planSize;
    const y = ((viewportSize - svgY) / viewportSize) * planSize;
    return { x: roundValue(x), y: roundValue(y) };
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => setIsShift(event.shiftKey);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (event: MouseEvent) => {
      const session = panSessionRef.current;
      const svg = svgRef.current;
      if (!session || !svg) return;
      const rect = svg.getBoundingClientRect();
      const deltaX = ((event.clientX - session.startClientX) / rect.width) * session.startViewBox.size;
      const deltaY = ((event.clientY - session.startClientY) / rect.height) * session.startViewBox.size;
      if (!session.moved && (Math.abs(event.clientX - session.startClientX) > 2 || Math.abs(event.clientY - session.startClientY) > 2)) {
        session.moved = true;
      }
      setViewBox(clampViewBox({ x: session.startViewBox.x - deltaX, y: session.startViewBox.y - deltaY, size: session.startViewBox.size }));
    };

    const handleMouseUp = () => {
      const session = panSessionRef.current;
      suppressCanvasClickRef.current = Boolean(session?.moved);
      panSessionRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning]);

  const toSvg = (point: Vec2) => ({
    x: (point.x / planSize) * viewportSize,
    y: viewportSize - (point.y / planSize) * viewportSize
  });

  const svgToPlan = (svgPoint: { x: number; y: number }): Vec2 => ({
    x: roundValue((svgPoint.x / viewportSize) * planSize),
    y: roundValue(((viewportSize - svgPoint.y) / viewportSize) * planSize)
  });

  const pxPerMeter = viewportSize / planSize;
  const snapRadiusMeters = SNAP_RADIUS_SCREEN / pxPerMeter * (viewBox.size / viewportSize);

  const snap = (raw: Vec2, referenceFor?: "wall" | "room" | "measure"): Vec2 => {
    const walls = entities.filter((e): e is WallEntity => e.type === "wall");
    for (const wall of walls) {
      for (const end of [wall.start, wall.end]) {
        if (Math.hypot(raw.x - end.x, raw.y - end.y) < snapRadiusMeters) {
          return { x: roundValue(end.x), y: roundValue(end.y) };
        }
      }
    }
    const reference = referenceFor === "wall" ? wallStart : referenceFor === "room" ? roomStart : referenceFor === "measure" ? measureStart : null;
    if (reference && !isShift) {
      const dx = raw.x - reference.x;
      const dy = raw.y - reference.y;
      if (Math.abs(dx) > Math.abs(dy) * 2.5) {
        return { x: snapToGrid(raw.x), y: roundValue(reference.y) };
      }
      if (Math.abs(dy) > Math.abs(dx) * 2.5) {
        return { x: roundValue(reference.x), y: snapToGrid(raw.y) };
      }
    }
    return { x: snapToGrid(raw.x), y: snapToGrid(raw.y) };
  };

  function snapToGrid(v: number): number {
    const step = isShift ? 0.1 : 0.1;
    return roundValue(Math.round(v / step) * step);
  }

  const effectiveCursor = useMemo(() => {
    if (!cursor) return null;
    if (activeTool === "draw-wall") return snap(cursor, "wall");
    if (activeTool === "draw-room") return snap(cursor, "room");
    if (activeTool === "measure") return snap(cursor, "measure");
    return cursor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, activeTool, wallStart, roomStart, measureStart, isShift]);

  const toolClass = `plan-svg tool-${activeTool}${isPanning ? " is-panning" : ""}`;

  // Grid lines SVG pattern
  const gridPattern = useMemo(() => {
    const cell = GRID_MINOR * pxPerMeter;
    const major = GRID_MAJOR * pxPerMeter;
    return { cell, major };
  }, [pxPerMeter]);

  // Measurement display
  const previewMeasure =
    activeTool === "measure" && measureStart && effectiveCursor
      ? { start: measureStart, end: effectiveCursor }
      : null;

  const committedMeasure = measurement;

  // Room preview
  const roomPreview =
    activeTool === "draw-room" && roomStart && effectiveCursor
      ? rectFromDiagonal(roomStart, effectiveCursor)
      : null;

  // Wall preview
  const wallPreview =
    activeTool === "draw-wall" && wallStart && effectiveCursor
      ? { start: wallStart, end: effectiveCursor }
      : null;

  const handlePointerDown = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const shouldPan = event.button === 1 || (event.button === 0 && event.altKey) || (event.button === 0 && activeTool === "pan");
    if (shouldPan) {
      event.preventDefault();
      event.stopPropagation();
      panSessionRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startViewBox: viewBox,
        moved: false
      };
      setIsPanning(true);
      return;
    }

    if (activeTool === "draw-room" && event.button === 0) {
      const point = snap(pointFromClient(event.clientX, event.clientY, svg), "room");
      onSetRoomStart(point);
      return;
    }
  };

  const handlePointerUp = (event: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "draw-room" && roomStart && event.button === 0 && !suppressCanvasClickRef.current) {
      const svg = event.currentTarget;
      const end = snap(pointFromClient(event.clientX, event.clientY, svg), "room");
      if (Math.hypot(end.x - roomStart.x, end.y - roomStart.y) > 0.3) {
        onCommitRoom(roomStart, end);
        return;
      }
      onSetRoomStart(null);
    }
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (suppressCanvasClickRef.current) {
      suppressCanvasClickRef.current = false;
      return;
    }
    const point = pointFromClient(event.clientX, event.clientY, event.currentTarget);

    if (activeTool === "measure") {
      const snapped = snap(point, "measure");
      if (!measureStart) {
        onSetMeasureStart(snapped);
      } else {
        onCommitMeasurement(measureStart, snapped);
      }
      return;
    }

    if (activeTool === "draw-wall") {
      const snapped = snap(point, "wall");
      onCanvasPoint(snapped, event.shiftKey);
      return;
    }

    onCanvasPoint(point, event.shiftKey);
  };

  const handlePointerMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = pointFromClient(event.clientX, event.clientY, event.currentTarget);
    setCursor(point);
    onCanvasPointerMove(point);
    // Track cursor in container-local pixel coords so we can position the
    // numeric-entry chip without a second listener.
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setCursorScreen({
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top
      });
    }
  };

  const zoomLabel = useMemo(() => `${Math.round((viewportSize / viewBox.size) * 100)}%`, [viewBox.size, viewportSize]);

  // Numeric entry chip for "draw-wall" — focus the input the moment the user
  // commits a start point, and clear it when the wall start vanishes.
  useEffect(() => {
    if (activeTool === "draw-wall" && wallStart) {
      setNumericLength("");
      // Focus on next paint so the input is mounted.
      const id = requestAnimationFrame(() => numericInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    setNumericLength("");
    return undefined;
  }, [activeTool, wallStart]);

  const commitNumericLength = () => {
    const length = parseFloat(numericLength.replace(",", "."));
    if (!Number.isFinite(length) || length <= 0) return;
    if (!wallStart || !cursor) return;

    const dx = cursor.x - wallStart.x;
    const dy = cursor.y - wallStart.y;
    const mag = Math.hypot(dx, dy);
    // Fall back to a horizontal vector if the cursor is on top of the start —
    // typing a length still produces a usable wall instead of a no-op.
    const ux = mag > 0.001 ? dx / mag : 1;
    const uy = mag > 0.001 ? dy / mag : 0;
    const endpoint: Vec2 = {
      x: roundValue(wallStart.x + ux * length),
      y: roundValue(wallStart.y + uy * length)
    };
    onCanvasPoint(endpoint, false);
  };

  const showNumericChip = activeTool === "draw-wall" && wallStart && cursorScreen;
  const chipOffsetX = 16;
  const chipOffsetY = 16;

  return (
    <div className="viewport" ref={containerRef}>
      <div className="viewport-title">
        <span className="eyebrow">Plan</span>
        <span className="title">Live 2D</span>
      </div>

      <div className="overlay overlay-top-right">
        <div className="viewport-badges">
          <span className="badge">grid {GRID_MINOR} m</span>
          <span className="badge">{zoomLabel}</span>
          <span className="badge accent">{activeTool}</span>
          <button
            type="button"
            className="badge"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCamera2D(!showCamera2D)}
            title="Toggle Live Camera Radar"
          >
            {showCamera2D ? "Radar On" : "Radar Off"}
          </button>
          <button
            type="button"
            className="badge"
            onClick={() => setViewBox({ x: 0, y: 0, size: viewportSize })}
            style={{ cursor: "pointer" }}
          >
            reset
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        className={toolClass}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.size} ${viewBox.size}`}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setCursor(null)}
        onClick={handleClick}
        onWheel={(event) => {
          event.preventDefault();
          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const ratioX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
          const ratioY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
          setViewBox((current) => {
            const zoomFactor = event.deltaY > 0 ? 1.15 : 0.88;
            const nextSize = Math.min(Math.max(current.size * zoomFactor, minViewSize), maxViewSize);
            const anchorX = current.x + ratioX * current.size;
            const anchorY = current.y + ratioY * current.size;
            const nextX = anchorX - ratioX * nextSize;
            const nextY = anchorY - ratioY * nextSize;
            return clampViewBox({ x: nextX, y: nextY, size: nextSize });
          });
        }}
        onContextMenu={(event) => event.preventDefault()}
        role="img"
        aria-label="2D plan editor"
      >
        <defs>
          <pattern id="plan-grid-minor" width={gridPattern.cell} height={gridPattern.cell} patternUnits="userSpaceOnUse">
            <path d={`M ${gridPattern.cell} 0 L 0 0 0 ${gridPattern.cell}`} fill="none" stroke="rgba(125,143,174,0.07)" strokeWidth="0.6" />
          </pattern>
          <pattern id="plan-grid-major" width={gridPattern.major} height={gridPattern.major} patternUnits="userSpaceOnUse">
            <path d={`M ${gridPattern.major} 0 L 0 0 0 ${gridPattern.major}`} fill="none" stroke="rgba(125,143,174,0.16)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x={-viewportSize * 4} y={-viewportSize * 4} width={viewportSize * 9} height={viewportSize * 9} fill="#0c1118" />
        <rect x={-viewportSize * 4} y={-viewportSize * 4} width={viewportSize * 9} height={viewportSize * 9} fill="url(#plan-grid-minor)" />
        <rect x={-viewportSize * 4} y={-viewportSize * 4} width={viewportSize * 9} height={viewportSize * 9} fill="url(#plan-grid-major)" />

        {/* Origin axes */}
        <line x1={-viewportSize * 4} y1={toSvg({ x: 0, y: 0 }).y} x2={viewportSize * 9} y2={toSvg({ x: 0, y: 0 }).y} stroke="rgba(232,177,105,0.2)" strokeWidth="1" />
        <line x1={toSvg({ x: 0, y: 0 }).x} y1={-viewportSize * 4} x2={toSvg({ x: 0, y: 0 }).x} y2={viewportSize * 9} stroke="rgba(232,177,105,0.2)" strokeWidth="1" />

        {/* Entities */}
        {entities.map((entity) =>
          entity.type === "wall" ? (
            <WallLine
              key={entity.id}
              wall={entity}
              selected={selectedEntityId === entity.id}
              onSelect={onSelectEntity}
              onBeginDrag={onBeginEntityDrag}
              toSvg={toSvg}
              activeTool={activeTool}
              onPlaceHostedOpening={onPlaceHostedOpening}
              pointFromClient={pointFromClient}
              pxPerMeter={pxPerMeter}
              showDimension={selectedEntityId === entity.id || activeTool === "select"}
              onContextMenu={openEntityContextMenu}
            />
          ) : entity.type === "object" ? (
            <ObjectGlyph
              key={entity.id}
              object={entity}
              selected={selectedEntityId === entity.id}
              onSelect={onSelectEntity}
              onBeginDrag={onBeginEntityDrag}
              viewportSize={viewportSize}
              planSize={planSize}
              pointFromClient={pointFromClient}
              onContextMenu={openEntityContextMenu}
            />
          ) : (
            <OpeningGlyph
              key={entity.id}
              opening={entity}
              wall={getWallById(scene, entity.hostWallId)}
              selected={selectedEntityId === entity.id}
              onSelect={onSelectEntity}
              onBeginDrag={onBeginEntityDrag}
              toSvg={toSvg}
              pointFromClient={pointFromClient}
              onContextMenu={openEntityContextMenu}
            />
          )
        )}

        {/* Wall preview */}
        {wallPreview ? (
          <PreviewLine
            start={toSvg(wallPreview.start)}
            end={toSvg(wallPreview.end)}
            color="#e8b169"
            labelText={`${distance(wallPreview.start, wallPreview.end).toFixed(2)} m`}
          />
        ) : null}

        {/* Room preview */}
        {roomPreview ? (
          <g>
            <rect
              x={toSvg({ x: roomPreview.xMin, y: roomPreview.yMax }).x}
              y={toSvg({ x: roomPreview.xMin, y: roomPreview.yMax }).y}
              width={(roomPreview.xMax - roomPreview.xMin) * pxPerMeter}
              height={(roomPreview.yMax - roomPreview.yMin) * pxPerMeter}
              fill="rgba(232,177,105,0.08)"
              stroke="#e8b169"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
            <DimensionLabel
              x={(toSvg({ x: roomPreview.xMin, y: roomPreview.yMax }).x + toSvg({ x: roomPreview.xMax, y: roomPreview.yMax }).x) / 2}
              y={toSvg({ x: roomPreview.xMin, y: roomPreview.yMax }).y - 10}
              text={`${(roomPreview.xMax - roomPreview.xMin).toFixed(2)} m`}
            />
            <DimensionLabel
              x={toSvg({ x: roomPreview.xMax, y: roomPreview.yMax }).x + 10}
              y={(toSvg({ x: roomPreview.xMax, y: roomPreview.yMax }).y + toSvg({ x: roomPreview.xMax, y: roomPreview.yMin }).y) / 2}
              text={`${(roomPreview.yMax - roomPreview.yMin).toFixed(2)} m`}
            />
          </g>
        ) : null}

        {/* Measurement preview */}
        {previewMeasure ? (
          <PreviewLine
            start={toSvg(previewMeasure.start)}
            end={toSvg(previewMeasure.end)}
            color="#4fb3b1"
            labelText={`${distance(previewMeasure.start, previewMeasure.end).toFixed(3)} m`}
            dashed
          />
        ) : null}

        {/* Committed measurement */}
        {committedMeasure ? (
          <PreviewLine
            start={toSvg(committedMeasure.start)}
            end={toSvg(committedMeasure.end)}
            color="#4fb3b1"
            labelText={`${distance(committedMeasure.start, committedMeasure.end).toFixed(3)} m`}
          />
        ) : null}

        {/* Cursor crosshair */}
        {effectiveCursor && activeTool !== "select" && activeTool !== "pan" ? (
          <g>
            <circle cx={toSvg(effectiveCursor).x} cy={toSvg(effectiveCursor).y} r="3" fill="#e8b169" />
            <circle cx={toSvg(effectiveCursor).x} cy={toSvg(effectiveCursor).y} r="9" fill="none" stroke="rgba(232,177,105,0.4)" strokeWidth="1" />
          </g>
        ) : null}

        <CameraIndicator2D toSvg={toSvg} />
      </svg>

      <div className="overlay overlay-bottom-right">
        <div className="viewport-badges">
          {effectiveCursor ? (
            <span className="badge">
              x {effectiveCursor.x.toFixed(2)} · y {effectiveCursor.y.toFixed(2)}
            </span>
          ) : (
            <span className="badge">—</span>
          )}
        </div>
      </div>

      <ContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        items={contextItems}
        onClose={closeContextMenu}
      />
    </div>
  );
}

function rectFromDiagonal(a: Vec2, b: Vec2) {
  return {
    xMin: Math.min(a.x, b.x),
    xMax: Math.max(a.x, b.x),
    yMin: Math.min(a.y, b.y),
    yMax: Math.max(a.y, b.y)
  };
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function PreviewLine({
  start,
  end,
  color,
  labelText,
  dashed
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
  labelText: string;
  dashed?: boolean;
}) {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? "6 4" : undefined}
        strokeLinecap="round"
      />
      <circle cx={start.x} cy={start.y} r="3" fill={color} />
      <circle cx={end.x} cy={end.y} r="3" fill={color} />
      <DimensionLabel x={mx} y={my - 8} text={labelText} />
    </g>
  );
}

function DimensionLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const pad = 4;
  const w = text.length * 5.6 + pad * 2;
  return (
    <g>
      <rect x={x - w / 2} y={y - 10} width={w} height={14} rx="4" fill="rgba(16,20,28,0.92)" stroke="rgba(255,255,255,0.08)" />
      <text x={x} y={y + 1} fill="#e8eef8" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" textAnchor="middle" dominantBaseline="middle">
        {text}
      </text>
    </g>
  );
}

/* ————————————————————————————————————
 * Entity glyphs
 * ———————————————————————————————————— */

type WallLineProps = {
  wall: WallEntity;
  selected: boolean;
  onSelect: (entityId: string) => void;
  onBeginDrag: (entityId: string, point: Vec2, pointFromClient: (clientX: number, clientY: number) => Vec2) => void;
  toSvg: (point: Vec2) => { x: number; y: number };
  activeTool: ToolMode;
  onPlaceHostedOpening: (wallId: string, point: Vec2) => void;
  pointFromClient: PointFromClient;
  pxPerMeter: number;
  showDimension: boolean;
  onContextMenu: (entityId: string, clientX: number, clientY: number) => void;
};

function WallLine({ wall, selected, onSelect, onBeginDrag, toSvg, activeTool, onPlaceHostedOpening, pointFromClient, pxPerMeter, showDimension, onContextMenu }: WallLineProps) {
  const start = toSvg(wall.start);
  const end = toSvg(wall.end);
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const length = measureWallLength(wall);
  const color = selected ? "#e8b169" : wall.color ?? "#c8ccd3";
  const width = Math.max(3, wall.thickness * pxPerMeter);

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="butt"
        style={{ cursor: activeTool === "select" ? "move" : "crosshair" }}
        onMouseDown={(event) => {
          if (activeTool !== "select") return;
          event.stopPropagation();
          const svg = event.currentTarget.ownerSVGElement;
          if (!svg) return;
          const point = pointFromClient(event.clientX, event.clientY, svg);
          onBeginDrag(wall.id, point, (clientX, clientY) => pointFromClient(clientX, clientY, svg));
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (activeTool === "place-component") {
            const svg = event.currentTarget.ownerSVGElement;
            if (!svg) return;
            const point = pointFromClient(event.clientX, event.clientY, svg);
            onPlaceHostedOpening(wall.id, point);
            return;
          }
          onSelect(wall.id);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onContextMenu(wall.id, event.clientX, event.clientY);
        }}
      />
      <circle cx={start.x} cy={start.y} r="2.5" fill={selected ? "#e8b169" : "rgba(255,255,255,0.3)"} />
      <circle cx={end.x} cy={end.y} r="2.5" fill={selected ? "#e8b169" : "rgba(255,255,255,0.3)"} />
      {showDimension && length > 0.3 ? (
        <DimensionLabel x={mx} y={my - width / 2 - 9} text={`${length.toFixed(2)} m`} />
      ) : null}
    </g>
  );
}

type ObjectGlyphProps = {
  object: ObjectEntity;
  selected: boolean;
  onSelect: (entityId: string) => void;
  onBeginDrag: (entityId: string, point: Vec2, pointFromClient: (clientX: number, clientY: number) => Vec2) => void;
  viewportSize: number;
  planSize: number;
  pointFromClient: PointFromClient;
  onContextMenu: (entityId: string, clientX: number, clientY: number) => void;
};

function ObjectGlyph({ object, selected, onSelect, onBeginDrag, viewportSize, planSize, pointFromClient, onContextMenu }: ObjectGlyphProps) {
  const width = (object.footprint.x / planSize) * viewportSize;
  const depth = (object.footprint.y / planSize) * viewportSize;
  const centerX = (object.position.x / planSize) * viewportSize;
  const centerY = viewportSize - (object.position.z / planSize) * viewportSize;

  const fill = selected ? "rgba(232,177,105,0.18)" : "rgba(200,204,211,0.1)";
  const stroke = selected ? "#e8b169" : "rgba(200,204,211,0.55)";

  const glyph = glyphForKind(object.procedural?.kind ?? "generic-box");

  return (
    <g
      transform={`rotate(${-object.rotation.y} ${centerX} ${centerY})`}
      style={{ cursor: "move" }}
      onMouseDown={(event) => {
        event.stopPropagation();
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
        const point = pointFromClient(event.clientX, event.clientY, svg);
        onBeginDrag(object.id, point, (clientX, clientY) => pointFromClient(clientX, clientY, svg));
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(object.id);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu(object.id, event.clientX, event.clientY);
      }}
    >
      <rect
        x={centerX - width / 2}
        y={centerY - depth / 2}
        width={width}
        height={depth}
        rx="2"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {glyph(centerX, centerY, width, depth, stroke)}
    </g>
  );
}

type OpeningGlyphProps = {
  opening: DoorEntity | WindowEntity;
  wall: WallEntity | null;
  selected: boolean;
  onSelect: (entityId: string) => void;
  onBeginDrag: (entityId: string, point: Vec2, pointFromClient: (clientX: number, clientY: number) => Vec2) => void;
  toSvg: (point: Vec2) => { x: number; y: number };
  pointFromClient: PointFromClient;
  onContextMenu: (entityId: string, clientX: number, clientY: number) => void;
};

function OpeningGlyph({ opening, wall, selected, onSelect, onBeginDrag, toSvg, pointFromClient, onContextMenu }: OpeningGlyphProps) {
  if (!wall) return null;

  const center = toSvg(openingCenterOnWall(wall, opening.offsetAlongWall));
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const angleDeg = -(Math.atan2(dy, dx) * 180) / Math.PI;

  const pxPerMeter = Math.hypot(toSvg(wall.end).x - toSvg(wall.start).x, toSvg(wall.end).y - toSvg(wall.start).y) / measureWallLength(wall);
  const halfW = (opening.width * pxPerMeter) / 2;
  const thickness = Math.max(4, wall.thickness * pxPerMeter);

  const color = opening.type === "door" ? "#e8b169" : "#4fb3b1";
  const selectedStroke = selected ? "#e8b169" : color;

  return (
    <g
      transform={`rotate(${angleDeg} ${center.x} ${center.y})`}
      style={{ cursor: "move" }}
      onMouseDown={(event) => {
        event.stopPropagation();
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
        const point = pointFromClient(event.clientX, event.clientY, svg);
        onBeginDrag(opening.id, point, (clientX, clientY) => pointFromClient(clientX, clientY, svg));
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(opening.id);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onContextMenu(opening.id, event.clientX, event.clientY);
      }}
    >
      <rect
        x={center.x - halfW}
        y={center.y - thickness / 2}
        width={halfW * 2}
        height={thickness}
        rx="1"
        fill="#0c1118"
        stroke={selectedStroke}
        strokeWidth="1.5"
      />
      {opening.type === "door" ? (
        <path
          d={`M ${center.x - halfW} ${center.y} A ${halfW * 2} ${halfW * 2} 0 0 1 ${center.x + halfW} ${center.y}`}
          fill="none"
          stroke={selectedStroke}
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      ) : (
        <line x1={center.x - halfW + 2} y1={center.y} x2={center.x + halfW - 2} y2={center.y} stroke={selectedStroke} strokeWidth="1" />
      )}
    </g>
  );
}

function glyphForKind(kind: string) {
  return (cx: number, cy: number, w: number, d: number, stroke: string) => {
    const min = Math.min(w, d);
    if (kind === "sofa") {
      return (
        <g>
          <rect x={cx - w / 2 + 3} y={cy - d / 2 + 3} width={w - 6} height={d * 0.35} rx="2" fill="none" stroke={stroke} strokeWidth="0.8" />
        </g>
      );
    }
    if (kind === "bed") {
      return (
        <g>
          <rect x={cx - w / 2 + 3} y={cy - d / 2 + 3} width={w - 6} height={d * 0.25} rx="1" fill="none" stroke={stroke} strokeWidth="0.8" />
          <line x1={cx} y1={cy - d / 2 + 3} x2={cx} y2={cy + d / 2 - 3} stroke={stroke} strokeWidth="0.6" strokeDasharray="2 3" />
        </g>
      );
    }
    if (kind === "table" || kind === "desk") {
      return null;
    }
    if (kind === "chair" || kind === "stool" || kind === "armchair") {
      return <circle cx={cx} cy={cy} r={min * 0.25} fill="none" stroke={stroke} strokeWidth="0.8" />;
    }
    if (kind === "plant") {
      return (
        <g>
          <circle cx={cx} cy={cy} r={min * 0.35} fill="none" stroke={stroke} strokeWidth="0.8" />
          <circle cx={cx} cy={cy} r={min * 0.2} fill="none" stroke={stroke} strokeWidth="0.6" strokeDasharray="1 2" />
        </g>
      );
    }
    if (kind === "toilet") {
      return <ellipse cx={cx} cy={cy + d * 0.1} rx={w * 0.35} ry={d * 0.3} fill="none" stroke={stroke} strokeWidth="0.8" />;
    }
    if (kind === "basin") {
      return <rect x={cx - w * 0.3} y={cy - d * 0.2} width={w * 0.6} height={d * 0.4} rx="2" fill="none" stroke={stroke} strokeWidth="0.8" />;
    }
    if (kind === "bathtub") {
      return <rect x={cx - w / 2 + 4} y={cy - d / 2 + 4} width={w - 8} height={d - 8} rx="6" fill="none" stroke={stroke} strokeWidth="0.8" />;
    }
    if (kind === "fridge" || kind === "stove" || kind === "appliance") {
      return <line x1={cx - w / 2 + 3} y1={cy} x2={cx + w / 2 - 3} y2={cy} stroke={stroke} strokeWidth="0.8" />;
    }
    if (kind === "cabinet" || kind === "wardrobe" || kind === "bookshelf") {
      return (
        <g>
          <line x1={cx} y1={cy - d / 2 + 2} x2={cx} y2={cy + d / 2 - 2} stroke={stroke} strokeWidth="0.6" />
          <line x1={cx - w / 2 + 2} y1={cy} x2={cx + w / 2 - 2} y2={cy} stroke={stroke} strokeWidth="0.5" strokeDasharray="1 2" />
        </g>
      );
    }
    return null;
  };
}

function CameraIndicator2D({ toSvg }: { toSvg: (point: { x: number; y: number }) => { x: number; y: number } }) {
  const showCamera2D = useCameraStore((state) => state.showCamera2D);
  const pos = useCameraStore((state) => state.pos);
  const target = useCameraStore((state) => state.target);

  if (!showCamera2D) return null;

  const svgPos = toSvg({ x: pos[0], y: pos[2] });
  const svgTarget = toSvg({ x: target[0], y: target[2] });

  const dx = svgTarget.x - svgPos.x;
  const dy = svgTarget.y - svgPos.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <g transform={`translate(${svgPos.x}, ${svgPos.y})`} style={{ pointerEvents: "none" }}>
      <path
        d={`M 0 0 L 40 -15 A 40 40 0 0 1 40 15 Z`}
        fill="rgba(79, 179, 177, 0.15)"
        stroke="none"
        transform={`rotate(${angle})`}
      />
      <circle cx="0" cy="0" r="5" fill="#4fb3b1" />
      <circle cx="0" cy="0" r="8" fill="none" stroke="#4fb3b1" strokeWidth="1.5" />
      <line
        x1={0} y1={0} x2={15} y2={0}
        stroke="#4fb3b1" strokeWidth="2" strokeLinecap="round"
        transform={`rotate(${angle})`}
      />
    </g>
  );
}
