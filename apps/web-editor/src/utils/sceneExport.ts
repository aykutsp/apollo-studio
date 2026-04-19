import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

export type ExportFormat = "glb" | "obj" | "stl";

const MIME_TYPES: Record<ExportFormat, string> = {
  glb: "model/gltf-binary",
  obj: "text/plain",
  stl: "model/stl"
};

/**
 * Module-level reference to the live Three.js scene. Populated by
 * `setExportSceneSource` from an R3F effect, or discovered on-demand by
 * walking up from the DOM `<canvas>` element (fallback).
 */
let activeSceneGetter: (() => THREE.Scene | null) | null = null;

export function setExportSceneSource(getter: (() => THREE.Scene | null) | null): void {
  activeSceneGetter = getter;
}

function discoverSceneFromDom(): THREE.Scene | null {
  const canvases = document.querySelectorAll("canvas");
  for (const canvas of Array.from(canvases)) {
    // @react-three/fiber stashes its root data on the canvas under `__r3f`.
    const root = (canvas as HTMLCanvasElement & { __r3f?: { root?: { getState: () => { scene: THREE.Scene } }; fiber?: any } }).__r3f;
    if (!root) continue;
    const getState: (() => { scene: THREE.Scene }) | undefined = root.root?.getState ?? root.fiber?.getState;
    try {
      const state = getState?.();
      if (state?.scene) {
        return state.scene;
      }
    } catch {
      // fall through to the next canvas
    }
  }
  return null;
}

export function resolveActiveScene(): THREE.Scene | null {
  if (activeSceneGetter) {
    try {
      const scene = activeSceneGetter();
      if (scene) return scene;
    } catch {
      // fall through
    }
  }
  return discoverSceneFromDom();
}

function defaultFilename(format: ExportFormat): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `apollo_scene_${stamp}.${format}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportGlb(scene: THREE.Scene): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          // If the exporter returned JSON despite binary=true, encode it.
          const text = JSON.stringify(result);
          resolve(new TextEncoder().encode(text).buffer as ArrayBuffer);
        }
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

function exportObj(scene: THREE.Scene): string {
  const exporter = new OBJExporter();
  return exporter.parse(scene);
}

function exportStl(scene: THREE.Scene): ArrayBuffer {
  const exporter = new STLExporter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = exporter.parse(scene, { binary: true });
  if (result instanceof DataView) {
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
  }
  if (result instanceof ArrayBuffer) {
    return result;
  }
  return new TextEncoder().encode(String(result)).buffer as ArrayBuffer;
}

export async function exportScene(
  scene: THREE.Scene,
  format: ExportFormat,
  filename?: string
): Promise<void> {
  const name = filename ?? defaultFilename(format);
  const mime = MIME_TYPES[format];

  if (format === "glb") {
    const buffer = await exportGlb(scene);
    triggerDownload(new Blob([buffer], { type: mime }), name);
    return;
  }

  if (format === "obj") {
    const text = exportObj(scene);
    triggerDownload(new Blob([text], { type: mime }), name);
    return;
  }

  if (format === "stl") {
    const buffer = exportStl(scene);
    triggerDownload(new Blob([buffer], { type: mime }), name);
    return;
  }

  throw new Error(`Unsupported export format: ${format as string}`);
}

/**
 * Compressed JSON export (stretch). Uses native `CompressionStream` to gzip
 * a scene JSON payload and triggers a `.json.gz` download.
 */
export async function exportCompressedSceneJson(
  json: string,
  filename?: string
): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = filename ?? `apollo_scene_${stamp}.json.gz`;

  if (typeof CompressionStream === "undefined") {
    // Graceful fallback: download uncompressed.
    triggerDownload(new Blob([json], { type: "application/json" }), name.replace(/\.gz$/, ""));
    return;
  }

  const input = new Blob([json], { type: "application/json" });
  const compressedStream = input.stream().pipeThrough(new CompressionStream("gzip"));
  const compressedBlob = await new Response(compressedStream).blob();
  triggerDownload(new Blob([compressedBlob], { type: "application/gzip" }), name);
}
