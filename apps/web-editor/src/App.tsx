import { useEffect, useMemo, useRef, useState } from "react";
import {
  getEntityById,
  getWallById,
  projectPointOntoWall,
  roundValue,
  type DoorEntity,
  type Entity,
  type ObjectEntity,
  type Vec2,
  type WallEntity,
  type WindowEntity
} from "../../../packages/core-domain/src";
import { listCatalogSummaries, type ComponentCatalogSummary } from "../../../packages/core-domain/src";
import {
  canRedo,
  canUndo,
  commitMeasurement,
  commitRoomRect,
  commitWallPoint,
  createInitialEditorState,
  duplicateSelectedEntity,
  loadEmptyProject,
  loadScene,
  placeHostedOpening,
  placePendingComponent,
  redo,
  removeSelectedEntity,
  sceneStats,
  selectEntity,
  selectedEntity,
  setActiveTool,
  setComponentCatalog,
  setMeasureStart,
  setPendingComponent,
  setRoomStart,
  undo,
  updateSelectedEntity,
  type EditorState,
  type ToolMode
} from "../../../packages/editor-state/src";
import { AssetLibraryPanel } from "./components/AssetLibraryPanel";
import {
  buildDefaultCommands,
  CommandPalette,
  CommandPaletteProvider
} from "./components/CommandPalette";
import { ExportMenu } from "./components/ExportMenu";
import { IconBox, IconFolder, IconMessage, IconSettings, IconTree } from "./components/Icon";
import { PanelHandle } from "./components/PanelHandle";
import { PlanView2D } from "./components/PlanView2D";
import { ProjectActions } from "./components/ProjectActions";
import { PropertyPanel } from "./components/PropertyPanel";
import { RailNav, type LeftPanelTab } from "./components/RailNav";
import { SamplesMenu, SAMPLES } from "./components/SamplesMenu";
import { Scene3D } from "./components/Scene3D";
import { SceneTreePanel } from "./components/SceneTreePanel";
import { StatusBar } from "./components/StatusBar";
import { Toaster, toast } from "./components/Toast";
import { Toolbar } from "./components/Toolbar";
import { ViewModeTabs, type ViewMode } from "./components/ViewModeTabs";
import { importUserCatalog, loadRuntimeCatalogs, mergeCatalogComponents } from "./utils/catalogIO";
import { downloadScene, readSceneFile, serializeScene } from "./utils/sceneIO";

const planSize = 14;
const viewportSize = 840;

type DragSession = {
  originalEntity: Entity;
  startPoint: Vec2;
  pointFromClient: (clientX: number, clientY: number) => Vec2;
};

const SHORTCUT_TOOLS: Record<string, ToolMode> = {
  v: "select",
  h: "pan",
  w: "draw-wall",
  r: "draw-room",
  p: "place-component",
  m: "measure"
};

function App() {
  const [editorState, setEditorState] = useState<EditorState>(() => createInitialEditorState());
  const [catalogSummaries, setCatalogSummaries] = useState<ComponentCatalogSummary[]>(() => listCatalogSummaries());
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>("items");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [autoOpenInspector, setAutoOpenInspector] = useState(true);
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [dragPreview, setDragPreview] = useState<Entity | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const catalogInputRef = useRef<HTMLInputElement | null>(null);
  const ignoreCanvasClickRef = useRef(false);

  const stats = useMemo(() => sceneStats(editorState.scene), [editorState.scene]);
  const currentSelection = useMemo(() => selectedEntity(editorState), [editorState]);
  // Safe fallback — the main session owns the real project-color memory; an
  // empty list keeps PropertyPanel's required prop satisfied until it lands.
  const projectColors = useMemo<string[]>(() => [], []);

  const renderEntities = useMemo(
    () =>
      dragPreview
        ? editorState.scene.entities.map((entity) => (entity.id === dragPreview.id ? dragPreview : entity))
        : editorState.scene.entities,
    [dragPreview, editorState.scene.entities]
  );

  const activeHint = useMemo(() => {
    if (editorState.activeTool === "draw-wall") {
      return {
        title: "Draw wall",
        rows: [
          ["Click", "Start, then end"],
          ["Shift", "Free angle"],
          ["Esc", "Cancel"]
        ]
      };
    }
    if (editorState.activeTool === "draw-room") {
      return {
        title: "Draw room",
        rows: [
          ["Drag", "Corner to corner"],
          ["Release", "Commit"]
        ]
      };
    }
    if (editorState.activeTool === "place-component") {
      return {
        title: "Place component",
        rows: [
          ["Click", "Free placement"],
          ["Click wall", "Hosted door/window"],
          ["Esc", "Cancel"]
        ]
      };
    }
    if (editorState.activeTool === "measure") {
      return {
        title: "Measure distance",
        rows: [
          ["Click", "Start and end"],
          ["Esc", "Reset"]
        ]
      };
    }
    if (editorState.activeTool === "pan") {
      return { title: "Pan canvas", rows: [["Drag", "Reposition view"]] };
    }
    return {
      title: "Select",
      rows: [
        ["Click", "Select entity"],
        ["Drag", "Move selection"],
        ["Esc", "Clear"]
      ]
    };
  }, [editorState.activeTool]);

  // Runtime catalog load
  useEffect(() => {
    let disposed = false;
    void loadRuntimeCatalogs().then((result) => {
      if (disposed) return;
      setEditorState((current) => setComponentCatalog(current, result.components));
      setCatalogSummaries(result.catalogs);
    });
    return () => {
      disposed = true;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        setEditorState((current) => undo(current));
        return;
      }
      if (event.ctrlKey && ((event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y")) {
        event.preventDefault();
        setEditorState((current) => redo(current));
        return;
      }
      if (event.key === "Escape") {
        setEditorState((current) => setActiveTool(current, "select"));
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        setEditorState((current) => removeSelectedEntity(current));
        return;
      }
      if (event.key === "[") {
        event.preventDefault();
        setLeftPanelOpen((value) => !value);
        return;
      }
      if (event.key === "]") {
        event.preventDefault();
        setRightPanelOpen((value) => !value);
        return;
      }
      const nextTool = SHORTCUT_TOOLS[event.key.toLowerCase()];
      if (nextTool) {
        event.preventDefault();
        setEditorState((current) => setActiveTool(current, nextTool));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-open inspector when a selection appears.
  useEffect(() => {
    if (autoOpenInspector && editorState.selectedEntityId) {
      setRightPanelOpen(true);
    }
  }, [editorState.selectedEntityId, autoOpenInspector]);

  // Drag-to-move
  useEffect(() => {
    if (!dragSession) return;

    const buildDraggedEntity = (point: Vec2): Entity => {
      const deltaX = roundValue(point.x - dragSession.startPoint.x);
      const deltaY = roundValue(point.y - dragSession.startPoint.y);
      const entity = dragSession.originalEntity;

      if (entity.type === "wall") {
        return {
          ...entity,
          start: { x: roundValue(entity.start.x + deltaX), y: roundValue(entity.start.y + deltaY) },
          end:   { x: roundValue(entity.end.x + deltaX),   y: roundValue(entity.end.y + deltaY) }
        };
      }

      if (entity.type === "object") {
        return {
          ...entity,
          position: {
            ...entity.position,
            x: roundValue(entity.position.x + deltaX),
            z: roundValue(entity.position.z + deltaY)
          }
        };
      }

      const hostWall = getWallById(editorState.scene, entity.hostWallId);
      if (!hostWall) return entity;
      const projection = projectPointOntoWall(hostWall, point);
      return { ...entity, offsetAlongWall: projection.offsetAlongWall };
    };

    const handleMouseMove = (event: MouseEvent) => {
      const point = dragSession.pointFromClient(event.clientX, event.clientY);
      setDragPreview(buildDraggedEntity(point));
    };
    const handleMouseUp = () => {
      if (dragPreview && JSON.stringify(dragSession.originalEntity) !== JSON.stringify(dragPreview)) {
        setEditorState((current) => updateSelectedEntity(current, dragPreview));
        ignoreCanvasClickRef.current = true;
      }
      setDragSession(null);
      setDragPreview(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragPreview, dragSession, editorState.scene]);

  const handleCanvasPoint = (point: Vec2) => {
    if (ignoreCanvasClickRef.current) {
      ignoreCanvasClickRef.current = false;
      return;
    }
    if (editorState.activeTool === "draw-wall") {
      setEditorState((current) => commitWallPoint(current, point));
      return;
    }
    if (editorState.activeTool === "place-component") {
      setEditorState((current) => placePendingComponent(current, point));
      return;
    }
    setEditorState((current) => selectEntity(current, null));
  };

  const handleBeginEntityDrag = (
    entityId: string,
    point: Vec2,
    pointFromClient: (clientX: number, clientY: number) => Vec2
  ) => {
    if (editorState.activeTool !== "select") return;
    const entity = getEntityById(editorState.scene, entityId);
    if (!entity) return;
    setEditorState((current) => selectEntity(current, entityId));
    setDragSession({ originalEntity: entity, startPoint: point, pointFromClient });
    setDragPreview(entity);
  };

  const loadSampleFile = async (file: string, name: string) => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Failed to load ${name}`);
      const raw = await response.json();
      const scene = {
        id: raw?.project?.id ?? raw?.id ?? "imported-scene",
        name: raw?.project?.name ?? raw?.name ?? name,
        unitSystem: raw?.project?.unitSystem ?? raw?.unitSystem ?? "m",
        entities: raw?.scene?.entities ?? raw?.entities ?? []
      };
      setEditorState((current) => loadScene(current, scene));
    } catch (error) {
      console.error(error);
    }
  };

  const updateWallField = <K extends keyof WallEntity>(wall: WallEntity, key: K, value: WallEntity[K]) => {
    setEditorState((current) => updateSelectedEntity(current, { ...wall, [key]: value }));
  };
  const updateObjectField = <K extends keyof ObjectEntity>(object: ObjectEntity, key: K, value: ObjectEntity[K]) => {
    setEditorState((current) => updateSelectedEntity(current, { ...object, [key]: value }));
  };
  const updateOpeningField = <T extends DoorEntity | WindowEntity, K extends keyof T>(opening: T, key: K, value: T[K]) => {
    setEditorState((current) => updateSelectedEntity(current, { ...opening, [key]: value }));
  };

  // Right-click context menu actions wired into PlanView2D. Selection happens
  // inside PlanView2D when the menu opens, so by the time these run the
  // selected entity is the right-clicked one. We still pass the entityId
  // explicitly to avoid relying on the React state-flush ordering.
  const entityContextHandlers = useMemo(
    () => ({
      onDuplicateEntity: (entityId: string) =>
        setEditorState((current) => duplicateSelectedEntity(selectEntity(current, entityId))),
      onDeleteEntity: (entityId: string) =>
        setEditorState((current) => removeSelectedEntity(selectEntity(current, entityId))),
      onRenameEntity: (entityId: string, nextName: string) =>
        setEditorState((current) => {
          const target = current.scene.entities.find((e) => e.id === entityId);
          if (!target) return current;
          const renamed = { ...target, name: nextName } as Entity;
          return updateSelectedEntity(selectEntity(current, entityId), renamed);
        })
    }),
    []
  );

  const paletteCommands = useMemo(
    () =>
      buildDefaultCommands({
        setTool: (tool) => setEditorState((current) => setActiveTool(current, tool)),
        setViewMode,
        samples: SAMPLES.map((s) => ({ id: s.id, name: s.name, file: s.file })),
        loadSample: loadSampleFile,
        newProject: () => setEditorState((current) => loadEmptyProject(current)),
        saveProject: () => downloadScene(editorState.scene),
        openProject: () => fileInputRef.current?.click(),
        importCatalog: () => catalogInputRef.current?.click(),
        undo: () => setEditorState((current) => undo(current)),
        redo: () => setEditorState((current) => redo(current)),
        canUndo: canUndo(editorState),
        canRedo: canRedo(editorState),
        toggleLeftPanel: () => setLeftPanelOpen((v) => !v),
        toggleRightPanel: () => setRightPanelOpen((v) => !v),
        selectLeftPanelTab: (tab) => {
          setLeftPanelTab(tab);
          setLeftPanelOpen(true);
        }
      }),
    // loadSampleFile + setEditorState wrappers are stable; editorState included
    // so disabled flags on undo/redo and the canvas reference stay current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorState, viewMode]
  );

  return (
    <CommandPaletteProvider>
    <div className="app-shell">
      <CommandPalette commands={paletteCommands} />
      <Toaster />
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-glyph" aria-hidden="true">A</div>
          <div className="brand-text">
            <div className="brand-name">Apollo Studio</div>
            <div className="brand-project">{editorState.scene.name}</div>
          </div>
        </div>

        <div className="topbar-center">
          <ViewModeTabs value={viewMode} onChange={setViewMode} />
        </div>

        <div className="topbar-actions">
          <ProjectActions
            onNewProject={() => setEditorState((current) => loadEmptyProject(current))}
            onSave={() => downloadScene(editorState.scene)}
            onLoad={() => fileInputRef.current?.click()}
            onImportCatalog={() => catalogInputRef.current?.click()}
            onUndo={() => setEditorState((current) => undo(current))}
            onRedo={() => setEditorState((current) => redo(current))}
            canUndo={canUndo(editorState)}
            canRedo={canRedo(editorState)}
          />
          <SamplesMenu onLoadSample={loadSampleFile} />
          <ExportMenu getSerializedSceneJson={() => serializeScene(editorState.scene)} />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const scene = await readSceneFile(file);
            setEditorState((current) => loadScene(current, scene));
            event.target.value = "";
          }}
        />
        <input
          ref={catalogInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const imported = await importUserCatalog(file);
            const merged = mergeCatalogComponents(editorState.componentCatalog, imported);
            setEditorState((current) => setComponentCatalog(current, merged.components));
            setCatalogSummaries(merged.catalogs);
            event.target.value = "";
          }}
        />
      </header>

      <div className={`workspace${leftPanelOpen ? " left-open" : " left-closed"}${rightPanelOpen ? " right-open" : " right-closed"}`}>
        <RailNav
          value={leftPanelTab}
          open={leftPanelOpen}
          onChange={(tab) => {
            setLeftPanelTab(tab);
            setLeftPanelOpen(true);
          }}
          onToggle={() => setLeftPanelOpen((value) => !value)}
        />

        {leftPanelOpen ? (
        <aside className="panel left">
          <div className="panel-header">
            <h2 className="panel-title">{panelTitles[leftPanelTab]}</h2>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className="panel-subtitle">{leftPanelTab}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setLeftPanelOpen(false)}
                title="Close panel ([)"
                aria-label="Close panel"
              >
                ×
              </button>
            </div>
          </div>
          <div className="panel-body">
            {leftPanelTab === "chat" ? <AssistantPanel projectName={editorState.scene.name} /> : null}
            {leftPanelTab === "scene" ? (
              <SceneTreePanel
                entities={editorState.scene.entities}
                selectedEntityId={editorState.selectedEntityId}
                onSelectEntity={(entityId) => setEditorState((current) => selectEntity(current, entityId))}
              />
            ) : null}
            {leftPanelTab === "items" ? (
              <AssetLibraryPanel
                components={editorState.componentCatalog}
                catalogs={catalogSummaries}
                pendingComponentKey={editorState.draft.pendingComponentKey}
                onSelectComponent={(key) => setEditorState((current) => setPendingComponent(current, key))}
                onAddExternalComponent={(def) => {
                  setEditorState((current) => setComponentCatalog(current, [...current.componentCatalog, def]));
                  setCatalogSummaries((curr) => {
                    const exists = curr.find((c) => c.id === def.catalogId);
                    if (exists) {
                      return curr.map((c) => (c.id === def.catalogId ? { ...c, itemCount: c.itemCount + 1 } : c));
                    }
                    return [...curr, { id: def.catalogId, label: def.catalogLabel || "Imported", itemCount: 1 }];
                  });
                }}
              />
            ) : null}
            {leftPanelTab === "files" ? <FilesPanel /> : null}
            {leftPanelTab === "studio" ? (
              <StudioPanel
                stats={stats}
                unitSystem={editorState.scene.unitSystem}
                projectName={editorState.scene.name}
                componentCount={editorState.componentCatalog.length}
                catalogCount={catalogSummaries.length}
              />
            ) : null}
          </div>
        </aside>
        ) : (
          <PanelHandle
            side="left"
            label={panelTitles[leftPanelTab]}
            Icon={leftPanelIcons[leftPanelTab]}
            onExpand={() => setLeftPanelOpen(true)}
          />
        )}

        <section className="stage">
          <div className="stage-canvas" style={{ padding: 12 }}>
            {viewMode === "split" ? (
              <div className="viewport-split" style={{ position: "absolute", inset: 12 }}>
                <PlanView2D
                  scene={editorState.scene}
                  entities={renderEntities}
                  selectedEntityId={editorState.selectedEntityId}
                  activeTool={editorState.activeTool}
                  wallStart={editorState.draft.wallStart}
                  roomStart={editorState.draft.roomStart}
                  measureStart={editorState.draft.measureStart}
                  measurement={editorState.draft.measurement}
                  planSize={planSize}
                  viewportSize={viewportSize}
                  onCanvasPoint={(point) => handleCanvasPoint(point)}
                  onCanvasPointerMove={() => undefined}
                  onCommitRoom={(start, end) => setEditorState((current) => commitRoomRect(current, start, end))}
                  onSetRoomStart={(point) => setEditorState((current) => setRoomStart(current, point))}
                  onCommitMeasurement={(start, end) => setEditorState((current) => commitMeasurement(current, start, end))}
                  onSetMeasureStart={(point) => setEditorState((current) => setMeasureStart(current, point))}
                  onSelectEntity={(entityId) => setEditorState((current) => selectEntity(current, entityId))}
                  onBeginEntityDrag={handleBeginEntityDrag}
                  onPlaceHostedOpening={(wallId, point) => setEditorState((current) => placeHostedOpening(current, wallId, point))}
                  {...entityContextHandlers}
                />
                <Scene3D scene={editorState.scene} entities={renderEntities} selectedEntityId={editorState.selectedEntityId} onUpdateEntity={(next) => setEditorState((cur) => updateSelectedEntity(cur, next))} />
              </div>
            ) : viewMode === "2d" ? (
              <div style={{ position: "absolute", inset: 12 }}>
                <PlanView2D
                  scene={editorState.scene}
                  entities={renderEntities}
                  selectedEntityId={editorState.selectedEntityId}
                  activeTool={editorState.activeTool}
                  wallStart={editorState.draft.wallStart}
                  roomStart={editorState.draft.roomStart}
                  measureStart={editorState.draft.measureStart}
                  measurement={editorState.draft.measurement}
                  planSize={planSize}
                  viewportSize={viewportSize}
                  onCanvasPoint={(point) => handleCanvasPoint(point)}
                  onCanvasPointerMove={() => undefined}
                  onCommitRoom={(start, end) => setEditorState((current) => commitRoomRect(current, start, end))}
                  onSetRoomStart={(point) => setEditorState((current) => setRoomStart(current, point))}
                  onCommitMeasurement={(start, end) => setEditorState((current) => commitMeasurement(current, start, end))}
                  onSetMeasureStart={(point) => setEditorState((current) => setMeasureStart(current, point))}
                  onSelectEntity={(entityId) => setEditorState((current) => selectEntity(current, entityId))}
                  onBeginEntityDrag={handleBeginEntityDrag}
                  onPlaceHostedOpening={(wallId, point) => setEditorState((current) => placeHostedOpening(current, wallId, point))}
                  {...entityContextHandlers}
                />
              </div>
            ) : (
              <div style={{ position: "absolute", inset: 12 }}>
                <Scene3D scene={editorState.scene} entities={renderEntities} selectedEntityId={editorState.selectedEntityId} onUpdateEntity={(next) => setEditorState((cur) => updateSelectedEntity(cur, next))} />
              </div>
            )}
          </div>

          <div className="overlay overlay-bottom-center">
            <Toolbar
              activeTool={editorState.activeTool}
              onSelectTool={(tool) => setEditorState((current) => setActiveTool(current, tool))}
            />
          </div>

          <div className="overlay overlay-bottom-left">
            <div className="hint">
              <div className="hint-head">{activeHint.title}</div>
              {activeHint.rows.map(([key, label]) => (
                <div key={key} className="hint-row">
                  <span>{label}</span>
                  <kbd className="kbd">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </section>

        {rightPanelOpen ? (
        <aside className="panel right">
          <div className="panel-header">
            <h2 className="panel-title">Inspector</h2>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--fs-2xs)", color: "var(--fg-tertiary)", cursor: "pointer" }} title="Auto-open inspector when an item is selected">
                <input
                  type="checkbox"
                  checked={autoOpenInspector}
                  onChange={(event) => setAutoOpenInspector(event.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                auto
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setRightPanelOpen(false)}
                title="Close inspector (])"
                aria-label="Close inspector"
              >
                ×
              </button>
            </div>
          </div>
          <div className="panel-body">
            <PropertyPanel
              selection={currentSelection}
              unitSystem={editorState.scene.unitSystem}
              projectColors={projectColors}
              onUpdateWall={updateWallField}
              onUpdateWallFinish={(wall, color, material) =>
                setEditorState((current) => updateSelectedEntity(current, { ...wall, color, material }))
              }
              onUpdateObject={updateObjectField}
              onUpdateOpening={updateOpeningField}
              onDuplicate={() => setEditorState((current) => duplicateSelectedEntity(current))}
              onDelete={() => setEditorState((current) => removeSelectedEntity(current))}
            />
          </div>
        </aside>
        ) : (
          <PanelHandle
            side="right"
            label="Inspector"
            Icon={IconBox}
            subtitle={currentSelection ? currentSelection.type : ""}
            onExpand={() => setRightPanelOpen(true)}
          />
        )}
      </div>

      <StatusBar
        message={editorState.statusMessage}
        unitSystem={editorState.scene.unitSystem}
        walls={stats.walls}
        objects={stats.objects}
        openings={stats.openings}
      />
    </div>
    </CommandPaletteProvider>
  );
}

const panelTitles: Record<LeftPanelTab, string> = {
  chat: "Assistant",
  scene: "Scene",
  items: "Library",
  files: "Files",
  studio: "Studio"
};

const leftPanelIcons: Record<LeftPanelTab, (props: { size?: number }) => ReturnType<typeof IconMessage>> = {
  chat: IconMessage,
  scene: IconTree,
  items: IconBox,
  files: IconFolder,
  studio: IconSettings
};

function AssistantPanel({ projectName }: { projectName: string }) {
  return (
    <div className="chat-stream">
      <div className="chat-card">
        <div className="chat-title">AI assistant</div>
        <div className="chat-copy">
          Describe what you want to add to <strong>{projectName}</strong>. The assistant will be wired to
          prompts that manipulate the scene graph directly — planned integration via the Anthropic API.
        </div>
        <div className="chip-row">
          <span className="chip">Add a master bedroom</span>
          <span className="chip">Design a kitchen</span>
          <span className="chip">Build a bathroom</span>
          <span className="chip">Place a dining set</span>
        </div>
      </div>
      <div className="chat-composer">
        <input type="text" placeholder="Ask the assistant (preview)" />
        <button type="button" className="btn btn-primary btn-icon" aria-label="Send" disabled>
          <span aria-hidden="true">↑</span>
        </button>
      </div>
      <div className="chat-card">
        <div className="chat-title">Why preview</div>
        <div className="chat-copy">
          The assistant panel is scaffolded so the editor shell is ready for LLM-driven edits.
          Ship your Anthropic key via environment variable when you integrate.
        </div>
      </div>
    </div>
  );
}

function FilesPanel() {
  return (
    <div className="section">
      <div className="section-title">Project I/O</div>
      <div className="chat-copy" style={{ fontSize: "var(--fs-sm)", color: "var(--fg-tertiary)", lineHeight: "var(--lh-normal)" }}>
        Save exports a deterministic JSON snapshot (schema versioned). Open restores any saved project.
        Catalogs can be imported as JSON and merge with the built-in library.
      </div>
      <div style={{ display: "grid", gap: "var(--space-2)", fontSize: "var(--fs-xs)", color: "var(--fg-muted)" }}>
        <div>schemaVersion · 0.1.0</div>
        <div>unit · meters</div>
        <div>format · JSON</div>
      </div>
    </div>
  );
}

function StudioPanel({
  stats,
  unitSystem,
  projectName,
  componentCount,
  catalogCount
}: {
  stats: { walls: number; objects: number; openings: number };
  unitSystem: string;
  projectName: string;
  componentCount: number;
  catalogCount: number;
}) {
  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div className="section">
        <div className="section-title">Project</div>
        <div className="metric-inline"><span>Name</span><span className="value">{projectName}</span></div>
        <div className="metric-inline"><span>Units</span><span className="value">{unitSystem}</span></div>
      </div>
      <div className="section">
        <div className="section-title">Scene</div>
        <div className="metric-inline"><span>Walls</span><span className="value">{stats.walls}</span></div>
        <div className="metric-inline"><span>Openings</span><span className="value">{stats.openings}</span></div>
        <div className="metric-inline"><span>Items</span><span className="value">{stats.objects}</span></div>
      </div>
      <div className="section">
        <div className="section-title">Catalog</div>
        <div className="metric-inline"><span>Components</span><span className="value">{componentCount}</span></div>
        <div className="metric-inline"><span>Catalogs</span><span className="value">{catalogCount}</span></div>
      </div>
    </div>
  );
}

export default App;
