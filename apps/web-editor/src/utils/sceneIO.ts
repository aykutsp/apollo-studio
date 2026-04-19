import type { Scene } from "../../../../packages/core-domain/src";

export function serializeScene(scene: Scene): string {
  return JSON.stringify(
    {
      schemaVersion: "0.1.0",
      project: {
        id: scene.id,
        name: scene.name,
        unitSystem: scene.unitSystem
      },
      scene: {
        entities: scene.entities
      }
    },
    null,
    2
  );
}

export function downloadScene(scene: Scene, filename = "apollo-project.json") {
  const blob = new Blob([serializeScene(scene)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readSceneFile(file: File): Promise<Scene> {
  const raw = JSON.parse(await file.text());
  return {
    id: raw?.project?.id ?? "imported-scene",
    name: raw?.project?.name ?? "Imported Project",
    unitSystem: raw?.project?.unitSystem ?? "m",
    entities: raw?.scene?.entities ?? []
  };
}
