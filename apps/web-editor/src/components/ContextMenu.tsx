import { useEffect, useLayoutEffect, useRef, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { IconCopy, IconCursor, IconNewFile, IconTrash } from "./Icon";

/* ————————————————————————————————————
 * Right-click context menu
 * Custom portal — Radix is not installed and the action set is small enough
 * that a hand-rolled menu is simpler than adding a dependency. The menu
 * positions itself at the requested screen coords and clamps to the viewport
 * so it never disappears off the right/bottom edge.
 * ———————————————————————————————————— */

export type ContextMenuItem = {
  id: string;
  label: string;
  shortcut?: string;
  Icon?: (p: { size?: number }) => ReactElement;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
};

type ContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function ContextMenu({ open, x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on Esc, click-outside, scroll, resize, contextmenu (so a second
  // right-click on a different target replaces this one).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    const onMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const onWheel = () => onClose();

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onClose);
    };
  }, [open, onClose]);

  // Clamp inside viewport after the menu lays out so we know its actual height.
  useLayoutEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let nextX = x;
    let nextY = y;
    const margin = 6;
    if (rect.right > window.innerWidth - margin) {
      nextX = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (rect.bottom > window.innerHeight - margin) {
      nextY = Math.max(margin, window.innerHeight - rect.height - margin);
    }
    if (nextX !== x || nextY !== y) {
      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
    }
  }, [open, x, y]);

  if (!open) return null;

  return createPortal(
    <div
      ref={ref}
      className="ctxmenu"
      role="menu"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) =>
        item.id === "__divider__" ? (
          <div key={item.id + Math.random()} className="ctxmenu-divider" aria-hidden="true" />
        ) : (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="ctxmenu-item"
            data-disabled={item.disabled || undefined}
            data-danger={item.danger || undefined}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              onClose();
            }}
          >
            <span className="ctxmenu-item-icon" aria-hidden="true">
              {item.Icon ? <item.Icon size={13} /> : null}
            </span>
            <span>{item.label}</span>
            {item.shortcut ? <span className="ctxmenu-item-shortcut">{item.shortcut}</span> : null}
          </button>
        )
      )}
    </div>,
    document.body
  );
}

/* ————————————————————————————————————
 * Helper builder for the standard entity menu used by PlanView2D.
 * ———————————————————————————————————— */

export type EntityContextActions = {
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
  canDuplicate?: boolean;
  canDelete?: boolean;
  canRename?: boolean;
};

export function buildEntityContextItems(actions: EntityContextActions): ContextMenuItem[] {
  return [
    {
      id: "select",
      label: "Select",
      Icon: IconCursor,
      onSelect: actions.onSelect
    },
    {
      id: "duplicate",
      label: "Duplicate",
      shortcut: "Ctrl+D",
      Icon: IconCopy,
      onSelect: actions.onDuplicate,
      disabled: actions.canDuplicate === false
    },
    {
      id: "rename",
      label: "Rename",
      shortcut: "F2",
      Icon: IconNewFile,
      onSelect: actions.onRename,
      disabled: actions.canRename === false
    },
    {
      id: "__divider__",
      label: "",
      onSelect: () => undefined
    },
    {
      id: "delete",
      label: "Delete",
      shortcut: "Del",
      Icon: IconTrash,
      onSelect: actions.onDelete,
      danger: true,
      disabled: actions.canDelete === false
    }
  ];
}
