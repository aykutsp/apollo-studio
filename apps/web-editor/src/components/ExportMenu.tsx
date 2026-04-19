import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconCube, IconDownload } from "./Icon";
import {
  exportCompressedSceneJson,
  exportScene,
  resolveActiveScene,
  type ExportFormat
} from "../utils/sceneExport";
import { toast } from "./Toast";

type ExportMenuProps = {
  getSerializedSceneJson?: () => string;
};

type ExportOption = {
  id: ExportFormat | "json-gz";
  label: string;
  description: string;
};

const OPTIONS: ExportOption[] = [
  { id: "glb", label: "GLB", description: "Binary glTF for DCC / Sketchfab" },
  { id: "obj", label: "OBJ", description: "Wavefront OBJ (widely supported)" },
  { id: "stl", label: "STL", description: "Binary STL for 3D printing" },
  { id: "json-gz", label: "Compressed JSON", description: "Apollo project, gzip" }
];

export function ExportMenu({ getSerializedSceneJson }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const runExport = async (option: ExportOption) => {
    setBusy(option.id);
    try {
      if (option.id === "json-gz") {
        if (!getSerializedSceneJson) {
          toast.error("Scene JSON not available");
          return;
        }
        await exportCompressedSceneJson(getSerializedSceneJson());
        toast.success(`Exported ${option.label}`);
        return;
      }

      const scene = resolveActiveScene();
      if (!scene) {
        toast.error("No 3D scene found. Switch to Model or Split view first.");
        return;
      }
      await exportScene(scene, option.id);
      toast.success(`Exported ${option.label}`);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export scene (GLB / OBJ / STL)"
      >
        <IconDownload /> <span>Export</span> <IconChevronDown size={12} />
      </button>
      {open ? (
        <div className="menu-panel" role="menu">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              className="menu-item"
              disabled={busy !== null}
              onClick={() => {
                void runExport(option);
              }}
            >
              <IconCube size={14} />
              <div style={{ display: "grid", gap: 2 }}>
                <span>
                  {option.label}
                  {busy === option.id ? " …" : ""}
                </span>
                <span className="muted">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
