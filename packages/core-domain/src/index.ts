import rawComponentCatalog from "./component-catalog.json";

export type UnitSystem = "mm" | "cm" | "m" | "in" | "ft";

export type EntityType = "wall" | "object" | "door" | "window";

export type Vec2 = {
  x: number;
  y: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type WallEntity = {
  id: string;
  type: "wall";
  name: string;
  start: Vec2;
  end: Vec2;
  thickness: number;
  height: number;
  material: string;
  /** Optional CSS color override. Falls back to a neutral plaster tone. */
  color?: string;
};

export type ObjectEntity = {
  id: string;
  type: "object";
  name: string;
  assetKey: string;
  category: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  material: string;
  footprint: Vec2;
  height: number;
  procedural?: ProceduralRecipe;
  modelUrl?: string;
};

export type HostedOpeningBase = {
  id: string;
  name: string;
  hostWallId: string;
  offsetAlongWall: number;
  width: number;
  height: number;
  material: string;
};

export type DoorEntity = HostedOpeningBase & {
  type: "door";
  sillHeight: 0;
};

export type WindowEntity = HostedOpeningBase & {
  type: "window";
  sillHeight: number;
};

export type Entity = WallEntity | ObjectEntity | DoorEntity | WindowEntity;

export type Scene = {
  id: string;
  name: string;
  unitSystem: UnitSystem;
  entities: Entity[];
};

export type ComponentPlacementMode = "free" | "hosted-wall";

export type ComponentFamily = "furniture" | "casework" | "appliance" | "door" | "window" | "sanitary" | "lighting" | "decor";

export type ProceduralKind =
  | "sofa"
  | "chair"
  | "armchair"
  | "office-chair"
  | "stool"
  | "bar-stool"
  | "bench"
  | "table"
  | "desk"
  | "console"
  | "bed"
  | "nightstand"
  | "dresser"
  | "cabinet"
  | "bookshelf"
  | "wardrobe"
  | "filing-cabinet"
  | "media-console"
  | "kitchen-island"
  | "appliance"
  | "stove"
  | "fridge"
  | "microwave"
  | "dishwasher"
  | "range-hood"
  | "washing-machine"
  | "bathtub"
  | "shower"
  | "toilet"
  | "basin"
  | "door"
  | "window"
  | "rug"
  | "plant"
  | "lamp-floor"
  | "lamp-table"
  | "pendant"
  | "tv"
  | "monitor"
  | "parasol"
  | "grill"
  | "generic-box";

export type ProceduralPalette = {
  primary?: string;
  secondary?: string;
  accent?: string;
  seat?: string;
  frame?: string;
  glass?: string;
};

export type ProceduralRecipe = {
  kind: ProceduralKind;
  palette?: ProceduralPalette;
};

export type ComponentDefinition = {
  catalogId: string;
  catalogLabel: string;
  key: string;
  name: string;
  category: string;
  family: ComponentFamily;
  placementMode: ComponentPlacementMode;
  material: string;
  footprint: Vec2;
  height: number;
  /** Default Y offset from floor, in scene units. Useful for wall-mounted casework. */
  mountHeight?: number;
  defaultSillHeight?: number;
  thumbnailTone?: string;
  vendor?: string;
  procedural?: ProceduralRecipe;
  modelUrl?: string;
};

export type ComponentCatalogSummary = {
  id: string;
  label: string;
  itemCount: number;
};

export const componentCatalog: ComponentDefinition[] = rawComponentCatalog as ComponentDefinition[];

export function listCatalogSummaries(): ComponentCatalogSummary[] {
  const groups = new Map<string, ComponentCatalogSummary>();

  for (const component of componentCatalog) {
    const existing = groups.get(component.catalogId);
    if (existing) {
      existing.itemCount += 1;
      continue;
    }

    groups.set(component.catalogId, {
      id: component.catalogId,
      label: component.catalogLabel,
      itemCount: 1
    });
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function getComponentDefinition(componentKey: string): ComponentDefinition | null {
  return componentCatalog.find((component) => component.key === componentKey) ?? null;
}

export const sampleScene: Scene = {
  id: "atelier-loft",
  name: "Atelier Loft",
  unitSystem: "m",
  entities: [
    {
      id: "wall-n",
      type: "wall",
      name: "North Wall",
      start: { x: 1, y: 8 },
      end: { x: 11, y: 8 },
      thickness: 0.22,
      height: 3.0,
      material: "White Plaster"
    },
    {
      id: "wall-e",
      type: "wall",
      name: "East Wall",
      start: { x: 11, y: 8 },
      end: { x: 11, y: 1 },
      thickness: 0.22,
      height: 3.0,
      material: "White Plaster"
    },
    {
      id: "wall-s",
      type: "wall",
      name: "South Wall",
      start: { x: 11, y: 1 },
      end: { x: 1, y: 1 },
      thickness: 0.22,
      height: 3.0,
      material: "White Plaster"
    },
    {
      id: "wall-w",
      type: "wall",
      name: "West Wall",
      start: { x: 1, y: 1 },
      end: { x: 1, y: 8 },
      thickness: 0.22,
      height: 3.0,
      material: "White Plaster"
    },
    {
      id: "rug-1",
      type: "object",
      name: "Area Rug",
      assetKey: "rug-large",
      category: "Rug",
      position: { x: 4.5, y: 0, z: 4.0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: "Wool",
      footprint: { x: 3.0, y: 2.2 },
      height: 0.02,
      procedural: { kind: "rug", palette: { primary: "#a89b7e", accent: "#5e5038" } }
    },
    {
      id: "sofa-1",
      type: "object",
      name: "Lowline Sofa",
      assetKey: "sofa-lowline",
      category: "Sofa",
      position: { x: 4.5, y: 0, z: 4.2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: "Warm Fabric",
      footprint: { x: 2.2, y: 0.9 },
      height: 0.78,
      procedural: { kind: "sofa", palette: { primary: "#c9b79a", frame: "#2d2721", accent: "#8a6f4a" } }
    },
    {
      id: "coffee-1",
      type: "object",
      name: "Coffee Table",
      assetKey: "table-coffee-round",
      category: "Coffee",
      position: { x: 4.5, y: 0, z: 5.6 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: "Smoked Oak",
      footprint: { x: 0.95, y: 0.95 },
      height: 0.38,
      procedural: { kind: "table", palette: { primary: "#5a4230", frame: "#2a1e15" } }
    },
    {
      id: "armchair-1",
      type: "object",
      name: "Lounge Chair",
      assetKey: "armchair-lounge",
      category: "Armchair",
      position: { x: 3.2, y: 0, z: 6.4 },
      rotation: { x: 0, y: 200, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: "Leather",
      footprint: { x: 0.88, y: 0.84 },
      height: 0.9,
      procedural: { kind: "armchair", palette: { primary: "#7a4a32", frame: "#2b1f18", accent: "#a56b4a" } }
    },
    {
      id: "plant-1",
      type: "object",
      name: "Monstera",
      assetKey: "plant-monstera",
      category: "Plant",
      position: { x: 10.2, y: 0, z: 7.3 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: "Terracotta + Leaves",
      footprint: { x: 0.6, y: 0.6 },
      height: 1.3,
      procedural: { kind: "plant", palette: { primary: "#3a5a3a", frame: "#8a5a3a", accent: "#5e8c4e" } }
    },
    {
      id: "door-1",
      type: "door",
      name: "Entry Door",
      hostWallId: "wall-s",
      offsetAlongWall: 2.4,
      width: 0.9,
      height: 2.1,
      material: "Stained Oak",
      sillHeight: 0
    },
    {
      id: "window-1",
      type: "window",
      name: "East Window",
      hostWallId: "wall-e",
      offsetAlongWall: 3.3,
      width: 2.0,
      height: 1.6,
      material: "Aluminium",
      sillHeight: 0.9
    }
  ]
};

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyScene(): Scene {
  return {
    id: "scene-root",
    name: "Untitled Project",
    unitSystem: "m",
    entities: []
  };
}

export function getEntityById(scene: Scene, entityId: string | null): Entity | null {
  if (!entityId) {
    return null;
  }

  return scene.entities.find((entity) => entity.id === entityId) ?? null;
}

export function replaceEntity(scene: Scene, nextEntity: Entity): Scene {
  return {
    ...scene,
    entities: scene.entities.map((entity) => (entity.id === nextEntity.id ? nextEntity : entity))
  };
}

export function removeEntity(scene: Scene, entityId: string): Scene {
  return {
    ...scene,
    entities: scene.entities.filter((entity) => entity.id !== entityId)
  };
}

export function addEntity(scene: Scene, entity: Entity): Scene {
  return {
    ...scene,
    entities: [...scene.entities, entity]
  };
}

export function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}

export function measureWallLength(wall: WallEntity): number {
  return roundValue(Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y));
}

export function getWallById(scene: Scene, wallId: string): WallEntity | null {
  const entity = scene.entities.find((item) => item.id === wallId);
  return entity?.type === "wall" ? entity : null;
}

export function projectPointOntoWall(wall: WallEntity, point: Vec2): { point: Vec2; offsetAlongWall: number } {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(
    0,
    Math.min(1, ((point.x - wall.start.x) * dx + (point.y - wall.start.y) * dy) / lengthSquared)
  );

  const projectedPoint = {
    x: roundValue(wall.start.x + dx * t),
    y: roundValue(wall.start.y + dy * t)
  };

  return {
    point: projectedPoint,
    offsetAlongWall: roundValue(Math.hypot(projectedPoint.x - wall.start.x, projectedPoint.y - wall.start.y))
  };
}

export function openingCenterOnWall(wall: WallEntity, offsetAlongWall: number): Vec2 {
  const length = measureWallLength(wall) || 1;
  const t = Math.max(0, Math.min(1, offsetAlongWall / length));
  return {
    x: roundValue(wall.start.x + (wall.end.x - wall.start.x) * t),
    y: roundValue(wall.start.y + (wall.end.y - wall.start.y) * t)
  };
}

export function cloneEntity(entity: Entity, id: string): Entity {
  if (entity.type === "wall") {
    return {
      ...entity,
      id,
      name: `${entity.name} Copy`,
      start: { x: entity.start.x + 0.4, y: entity.start.y + 0.4 },
      end: { x: entity.end.x + 0.4, y: entity.end.y + 0.4 }
    };
  }

  if (entity.type === "door" || entity.type === "window") {
    return {
      ...entity,
      id,
      name: `${entity.name} Copy`,
      offsetAlongWall: roundValue(entity.offsetAlongWall + 0.4)
    };
  }

  return {
    ...entity,
    id,
    name: `${entity.name} Copy`,
    position: {
      x: entity.position.x + 0.5,
      y: entity.position.y,
      z: entity.position.z + 0.5
    }
  };
}
