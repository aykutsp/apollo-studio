import {
  componentCatalog,
  createEmptyScene,
  createId,
  getComponentDefinition,
  getWallById,
  getEntityById,
  projectPointOntoWall,
  sampleScene,
  type ComponentDefinition,
  type DoorEntity,
  type Entity,
  type Scene,
  type UnitSystem,
  type Vec2,
  type WallEntity,
  type WindowEntity
} from "../../core-domain/src";
import {
  changeUnitSystemCommand,
  createWallCommand,
  deleteEntityCommand,
  duplicateEntityCommand,
  placeObjectCommand,
  updateEntityCommand,
  type EditorCommand
} from "../../command-system/src";

export type ToolMode =
  | "select"
  | "pan"
  | "draw-wall"
  | "draw-room"
  | "place-component"
  | "measure";

export type CommandHistory = {
  past: EditorCommand[];
  future: EditorCommand[];
};

export type Measurement = {
  start: Vec2;
  end: Vec2;
};

export type EditorDraft = {
  wallStart: Vec2 | null;
  pendingComponentKey: string | null;
  roomStart: Vec2 | null;
  measureStart: Vec2 | null;
  measurement: Measurement | null;
};

export type EditorState = {
  scene: Scene;
  componentCatalog: ComponentDefinition[];
  selectedEntityId: string | null;
  activeTool: ToolMode;
  history: CommandHistory;
  draft: EditorDraft;
  statusMessage: string;
};

function findComponent(state: EditorState, componentKey: string): ComponentDefinition | null {
  return state.componentCatalog.find((component) => component.key === componentKey) ?? null;
}

export function createInitialEditorState(components: ComponentDefinition[] = componentCatalog): EditorState {
  return {
    scene: sampleScene,
    componentCatalog: components,
    selectedEntityId: null,
    activeTool: "select",
    history: { past: [], future: [] },
    draft: {
      wallStart: null,
      pendingComponentKey: components[0]?.key ?? null,
      roomStart: null,
      measureStart: null,
      measurement: null
    },
    statusMessage: "Ready. Draw walls, place items, or open a sample from the menu."
  };
}

export function loadEmptyProject(state?: EditorState): EditorState {
  const components = state?.componentCatalog ?? componentCatalog;
  return {
    ...createInitialEditorState(components),
    scene: createEmptyScene(),
    statusMessage: "Started a new blank project."
  };
}

export function loadScene(state: EditorState, scene: Scene): EditorState {
  return {
    ...state,
    scene,
    selectedEntityId: null,
    history: { past: [], future: [] },
    draft: {
      ...state.draft,
      wallStart: null,
      roomStart: null,
      measureStart: null,
      measurement: null
    },
    statusMessage: `Loaded ${scene.name}`
  };
}

export function setComponentCatalog(state: EditorState, components: ComponentDefinition[]): EditorState {
  const pendingStillExists = components.some((component) => component.key === state.draft.pendingComponentKey);

  return {
    ...state,
    componentCatalog: components,
    draft: {
      ...state.draft,
      pendingComponentKey: pendingStillExists ? state.draft.pendingComponentKey : components[0]?.key ?? null
    },
    statusMessage: `Catalog ready: ${components.length} components available.`
  };
}

export function applyCommand(state: EditorState, command: EditorCommand, nextSelectionId?: string | null): EditorState {
  return {
    ...state,
    scene: command.execute(state.scene),
    selectedEntityId: nextSelectionId ?? state.selectedEntityId,
    history: {
      past: [...state.history.past, command],
      future: []
    },
    statusMessage: command.label
  };
}

export function undo(state: EditorState): EditorState {
  const command = state.history.past[state.history.past.length - 1];
  if (!command) {
    return state;
  }

  return {
    ...state,
    scene: command.undo(state.scene),
    history: {
      past: state.history.past.slice(0, -1),
      future: [command, ...state.history.future]
    },
    statusMessage: `Undo · ${command.label}`
  };
}

export function redo(state: EditorState): EditorState {
  const command = state.history.future[0];
  if (!command) {
    return state;
  }

  return {
    ...state,
    scene: command.redo(state.scene),
    history: {
      past: [...state.history.past, command],
      future: state.history.future.slice(1)
    },
    statusMessage: `Redo · ${command.label}`
  };
}

export function selectEntity(state: EditorState, entityId: string | null): EditorState {
  return {
    ...state,
    selectedEntityId: entityId,
    statusMessage: entityId ? `Selected ${entityId}` : "Selection cleared"
  };
}

export function setActiveTool(state: EditorState, tool: ToolMode): EditorState {
  return {
    ...state,
    activeTool: tool,
    draft: {
      ...state.draft,
      wallStart: tool === "draw-wall" ? state.draft.wallStart : null,
      roomStart: tool === "draw-room" ? state.draft.roomStart : null,
      measureStart: tool === "measure" ? state.draft.measureStart : null,
      measurement: tool === "measure" ? state.draft.measurement : null
    },
    statusMessage: toolStatusMessage(tool)
  };
}

function toolStatusMessage(tool: ToolMode): string {
  switch (tool) {
    case "draw-wall":        return "Wall tool · click start, then click end.";
    case "draw-room":        return "Room tool · drag a rectangle to create four walls.";
    case "place-component":  return "Placement tool · click in the plan or on a wall for hosted items.";
    case "measure":          return "Measure · click two points to measure distance.";
    case "pan":              return "Pan · drag the canvas to reposition.";
    default:                 return "Select tool · click, drag to move.";
  }
}

export function setPendingComponent(state: EditorState, componentKey: string): EditorState {
  const component = findComponent(state, componentKey);
  return {
    ...state,
    draft: {
      ...state.draft,
      pendingComponentKey: componentKey
    },
    activeTool: "place-component",
    statusMessage: component
      ? component.placementMode === "hosted-wall"
        ? `Place ${component.name} · click on a wall.`
        : `Place ${component.name} · click inside the plan.`
      : "Component placement active."
  };
}

export function commitWallPoint(state: EditorState, point: Vec2): EditorState {
  if (!state.draft.wallStart) {
    return {
      ...state,
      draft: { ...state.draft, wallStart: point },
      statusMessage: `Wall start · ${point.x.toFixed(2)}, ${point.y.toFixed(2)}`
    };
  }

  const wall: WallEntity = {
    id: createId("wall"),
    type: "wall",
    name: `Wall ${state.scene.entities.filter((entity) => entity.type === "wall").length + 1}`,
    start: state.draft.wallStart,
    end: point,
    thickness: 0.2,
    height: 3,
    material: "White Plaster"
  };

  return {
    ...applyCommand(state, createWallCommand(state.scene, wall), wall.id),
    draft: { ...state.draft, wallStart: null }
  };
}

export function cancelWallDraft(state: EditorState): EditorState {
  return {
    ...state,
    draft: { ...state.draft, wallStart: null },
    statusMessage: "Wall cancelled."
  };
}

export function commitRoomRect(state: EditorState, start: Vec2, end: Vec2): EditorState {
  const xMin = Math.min(start.x, end.x);
  const xMax = Math.max(start.x, end.x);
  const yMin = Math.min(start.y, end.y);
  const yMax = Math.max(start.y, end.y);

  if (xMax - xMin < 0.3 || yMax - yMin < 0.3) {
    return { ...state, statusMessage: "Room too small — try a bigger rectangle." };
  }

  const wallSpec = (index: number, name: string, s: Vec2, e: Vec2): WallEntity => ({
    id: createId(`wall-r${index}`),
    type: "wall",
    name,
    start: s,
    end: e,
    thickness: 0.2,
    height: 3,
    material: "White Plaster"
  });

  const n = wallSpec(0, "North", { x: xMin, y: yMax }, { x: xMax, y: yMax });
  const e = wallSpec(1, "East",  { x: xMax, y: yMax }, { x: xMax, y: yMin });
  const s = wallSpec(2, "South", { x: xMax, y: yMin }, { x: xMin, y: yMin });
  const w = wallSpec(3, "West",  { x: xMin, y: yMin }, { x: xMin, y: yMax });

  let next = state;
  for (const wall of [n, e, s, w]) {
    next = applyCommand(next, createWallCommand(next.scene, wall), wall.id);
  }

  return {
    ...next,
    draft: { ...next.draft, roomStart: null },
    statusMessage: `Room · ${(xMax - xMin).toFixed(2)} × ${(yMax - yMin).toFixed(2)} m`
  };
}

export function setRoomStart(state: EditorState, point: Vec2 | null): EditorState {
  return {
    ...state,
    draft: { ...state.draft, roomStart: point }
  };
}

export function setMeasureStart(state: EditorState, point: Vec2 | null): EditorState {
  return {
    ...state,
    draft: { ...state.draft, measureStart: point, measurement: null }
  };
}

export function commitMeasurement(state: EditorState, start: Vec2, end: Vec2): EditorState {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  return {
    ...state,
    draft: { ...state.draft, measureStart: null, measurement: { start, end } },
    statusMessage: `Measured · ${distance.toFixed(3)} ${state.scene.unitSystem}`
  };
}

export function placePendingComponent(state: EditorState, point: Vec2): EditorState {
  const component = findComponent(state, state.draft.pendingComponentKey ?? "");
  if (!component || component.placementMode !== "free") {
    return state;
  }

  const object: Entity = {
    id: createId("object"),
    type: "object",
    name: component.name,
    assetKey: component.key,
    category: component.category,
    position: { x: point.x, y: component.mountHeight ?? 0, z: point.y },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    material: component.material,
    footprint: component.footprint,
    height: component.height,
    procedural: component.procedural
  };

  return applyCommand(state, placeObjectCommand(state.scene, object), object.id);
}

export function placeHostedOpening(state: EditorState, wallId: string, point: Vec2): EditorState {
  const wall = getWallById(state.scene, wallId);
  const component = findComponent(state, state.draft.pendingComponentKey ?? "");
  if (!wall) {
    return state;
  }
  if (!component || component.placementMode !== "hosted-wall") {
    return state;
  }

  const projection = projectPointOntoWall(wall, point);

  if (component.family === "door") {
    const door: DoorEntity = {
      id: createId("door"),
      type: "door",
      name: component.name,
      hostWallId: wallId,
      offsetAlongWall: projection.offsetAlongWall,
      width: component.footprint.x,
      height: component.height,
      material: component.material,
      sillHeight: 0
    };

    return applyCommand(state, placeObjectCommand(state.scene, door), door.id);
  }

  if (component.family === "window") {
    const windowEntity: WindowEntity = {
      id: createId("window"),
      type: "window",
      name: component.name,
      hostWallId: wallId,
      offsetAlongWall: projection.offsetAlongWall,
      width: component.footprint.x,
      height: component.height,
      material: component.material,
      sillHeight: component.defaultSillHeight ?? 0.9
    };

    return applyCommand(state, placeObjectCommand(state.scene, windowEntity), windowEntity.id);
  }

  return state;
}

export function updateSelectedEntity(state: EditorState, nextEntity: Entity): EditorState {
  return applyCommand(state, updateEntityCommand(state.scene, nextEntity), nextEntity.id);
}

export function removeSelectedEntity(state: EditorState): EditorState {
  if (!state.selectedEntityId) {
    return state;
  }

  return {
    ...applyCommand(state, deleteEntityCommand(state.scene, state.selectedEntityId), null),
    selectedEntityId: null
  };
}

export function duplicateSelectedEntity(state: EditorState): EditorState {
  if (!state.selectedEntityId) {
    return state;
  }

  return applyCommand(state, duplicateEntityCommand(state.scene, state.selectedEntityId));
}

export function changeUnitSystem(state: EditorState, unitSystem: UnitSystem): EditorState {
  return applyCommand(state, changeUnitSystemCommand(state.scene, unitSystem));
}

export function selectedEntity(state: EditorState): Entity | null {
  return getEntityById(state.scene, state.selectedEntityId);
}

export function canUndo(state: EditorState): boolean {
  return state.history.past.length > 0;
}

export function canRedo(state: EditorState): boolean {
  return state.history.future.length > 0;
}

export function sceneStats(scene: Scene): { walls: number; objects: number; openings: number } {
  let walls = 0;
  let objects = 0;
  let openings = 0;
  for (const entity of scene.entities) {
    if (entity.type === "wall") walls++;
    else if (entity.type === "object") objects++;
    else openings++;
  }
  return { walls, objects, openings };
}
