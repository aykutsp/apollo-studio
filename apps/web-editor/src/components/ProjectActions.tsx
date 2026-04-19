import { IconDownload, IconNewFile, IconRedo, IconUndo, IconUpload } from "./Icon";

type ProjectActionsProps = {
  onNewProject: () => void;
  onSave: () => void;
  onLoad: () => void;
  onImportCatalog: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function ProjectActions({
  onNewProject,
  onSave,
  onLoad,
  onImportCatalog,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: ProjectActionsProps) {
  return (
    <>
      <button type="button" className="btn btn-icon btn-ghost" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
        <IconUndo />
      </button>
      <button type="button" className="btn btn-icon btn-ghost" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
        <IconRedo />
      </button>
      <span className="divider" aria-hidden="true" />
      <button type="button" className="btn btn-ghost" onClick={onNewProject} title="New project">
        <IconNewFile /> <span>New</span>
      </button>
      <button type="button" className="btn btn-ghost" onClick={onLoad} title="Open .json project">
        <IconUpload /> <span>Open</span>
      </button>
      <button type="button" className="btn btn-primary" onClick={onSave} title="Save .json project">
        <IconDownload /> <span>Save</span>
      </button>
      <span className="divider" aria-hidden="true" />
      <button type="button" className="btn btn-ghost btn-sm" onClick={onImportCatalog} title="Import a component catalog .json">
        Catalog
      </button>
    </>
  );
}
