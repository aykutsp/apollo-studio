import {
  addEntity,
  cloneEntity,
  createId,
  type Entity,
  getEntityById,
  removeEntity,
  replaceEntity,
  type Scene,
  type UnitSystem
} from "../../core-domain/src";

export interface EditorCommand {
  label: string;
  execute(scene: Scene): Scene;
  undo(scene: Scene): Scene;
  redo(scene: Scene): Scene;
  serialize(): Record<string, unknown>;
}

class SnapshotCommand implements EditorCommand {
  label: string;
  private readonly nextScene: Scene;
  private readonly previousScene: Scene;

  constructor(label: string, previousScene: Scene, nextScene: Scene) {
    this.label = label;
    this.previousScene = previousScene;
    this.nextScene = nextScene;
  }

  execute(): Scene {
    return this.nextScene;
  }

  undo(): Scene {
    return this.previousScene;
  }

  redo(): Scene {
    return this.nextScene;
  }

  serialize(): Record<string, unknown> {
    return { label: this.label };
  }
}

export function createWallCommand(scene: Scene, wall: Entity): EditorCommand {
  return new SnapshotCommand("Create wall", scene, addEntity(scene, wall));
}

export function placeObjectCommand(scene: Scene, object: Entity): EditorCommand {
  return new SnapshotCommand("Place object", scene, addEntity(scene, object));
}

export function updateEntityCommand(scene: Scene, nextEntity: Entity): EditorCommand {
  const currentEntity = getEntityById(scene, nextEntity.id);
  if (!currentEntity) {
    return new SnapshotCommand("No-op", scene, scene);
  }

  return new SnapshotCommand("Update entity", scene, replaceEntity(scene, nextEntity));
}

export function deleteEntityCommand(scene: Scene, entityId: string): EditorCommand {
  return new SnapshotCommand("Delete entity", scene, removeEntity(scene, entityId));
}

export function duplicateEntityCommand(scene: Scene, entityId: string): EditorCommand {
  const entity = getEntityById(scene, entityId);
  if (!entity) {
    return new SnapshotCommand("No-op", scene, scene);
  }

  return new SnapshotCommand("Duplicate entity", scene, addEntity(scene, cloneEntity(entity, createId(entity.type))));
}

export function changeUnitSystemCommand(scene: Scene, unitSystem: UnitSystem): EditorCommand {
  return new SnapshotCommand("Change unit system", scene, { ...scene, unitSystem });
}
