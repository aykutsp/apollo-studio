import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from "react";
import {
  IconBox,
  IconCube,
  IconCursor,
  IconDownload,
  IconFolder,
  IconGrid,
  IconHand,
  IconHome,
  IconLayers,
  IconLightBulb,
  IconMessage,
  IconNewFile,
  IconPlus,
  IconRedo,
  IconRoom,
  IconRuler,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconSplit,
  IconTree,
  IconUndo,
  IconUpload,
  IconWall
} from "./Icon";

/* ————————————————————————————————————
 * Command palette
 * Lightweight Cmdk-style palette. Keeps a single context so the app shell can
 * register handlers in one place and the palette renders independently.
 * Fuzzy matcher is in-house: subsequence matching with positional bonuses,
 * good enough for ~50 commands without pulling in `cmdk`/`fuse`.
 * ———————————————————————————————————— */

export type CommandGroupId = "Tools" | "View" | "Samples" | "Project" | "Panels";

export type CommandEntry = {
  id: string;
  group: CommandGroupId;
  label: string;
  /** Free-form alias terms used by the fuzzy matcher (lower-case). */
  aliases?: string[];
  /** Right-aligned shortcut chips (e.g. ["V"], ["Ctrl", "Z"]). */
  shortcut?: string[];
  Icon?: (props: { size?: number }) => ReactElement;
  run: () => void;
  disabled?: boolean;
};

type CommandPaletteContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>.");
  }
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      isOpen
    }),
    [isOpen]
  );

  // Global Ctrl/Cmd+K toggle. Honoured anywhere except inside other text inputs
  // when a modifier isn't pressed (the modifier guarantees intent).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (isMod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

/* ————————————————————————————————————
 * Fuzzy matcher
 * Subsequence with bonuses for: prefix match, word-boundary, consecutive runs.
 * Returns null for non-matches so callers can filter.
 * ———————————————————————————————————— */

type MatchResult = {
  score: number;
  /** Indexes in the *display string* that matched, for highlight rendering. */
  positions: number[];
};

function fuzzyMatch(needle: string, haystack: string): MatchResult | null {
  if (!needle) {
    return { score: 0, positions: [] };
  }
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  let hi = 0;
  let score = 0;
  let consecutive = 0;
  let prevWasBoundary = true;
  const positions: number[] = [];

  for (let ni = 0; ni < n.length; ni++) {
    const ch = n[ni];
    let found = -1;
    for (let i = hi; i < h.length; i++) {
      if (h[i] === ch) {
        found = i;
        break;
      }
    }
    if (found === -1) return null;
    positions.push(found);

    // Scoring: base hit is +1; bonus for word-boundary, prefix, and consecutive runs.
    let bonus = 1;
    if (found === 0) bonus += 6;
    if (prevWasBoundary && found > 0) bonus += 3;
    if (found === hi) {
      consecutive += 1;
      bonus += consecutive * 2;
    } else {
      consecutive = 0;
      // Penalise gap distance gently.
      bonus -= Math.min(found - hi, 4) * 0.2;
    }
    score += bonus;

    const next = h[found + 1];
    prevWasBoundary = next === " " || next === "-" || next === "/" || next === "_" || next === undefined;
    hi = found + 1;
  }

  // Slight bias toward shorter haystacks so "Wall" beats "Wallpaper preset".
  score -= Math.max(0, h.length - n.length) * 0.02;
  return { score, positions };
}

function scoreCommand(query: string, command: CommandEntry): MatchResult | null {
  const labelMatch = fuzzyMatch(query, command.label);
  if (labelMatch && (labelMatch.score > 0 || !query)) {
    return labelMatch;
  }
  // Aliases match against label highlight positions of -1 (no highlight).
  for (const alias of command.aliases ?? []) {
    const m = fuzzyMatch(query, alias);
    if (m) {
      return { score: m.score - 0.5, positions: [] };
    }
  }
  // Group name fallback so typing "view" still surfaces the View group.
  const groupMatch = fuzzyMatch(query, command.group);
  if (groupMatch) {
    return { score: groupMatch.score - 1, positions: [] };
  }
  return null;
}

/* ————————————————————————————————————
 * Palette UI
 * ———————————————————————————————————— */

type CommandPaletteProps = {
  commands: CommandEntry[];
};

export function CommandPalette({ commands }: CommandPaletteProps) {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Reset state when opening; focus input once the panel mounts.
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      // Defer to next paint so the input is in the DOM.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [isOpen]);

  // Click-outside to close.
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        close();
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, close]);

  // Filter + group.
  const filtered = useMemo(() => {
    const results: { command: CommandEntry; match: MatchResult }[] = [];
    for (const command of commands) {
      const match = scoreCommand(query.trim(), command);
      if (!match) continue;
      results.push({ command, match });
    }
    if (query.trim()) {
      results.sort((a, b) => b.match.score - a.match.score);
    }
    return results;
  }, [commands, query]);

  // Group preserving original group order.
  const groupedOrder: CommandGroupId[] = ["Tools", "View", "Samples", "Project", "Panels"];
  const grouped = useMemo(() => {
    const map = new Map<CommandGroupId, { command: CommandEntry; match: MatchResult }[]>();
    for (const entry of filtered) {
      const list = map.get(entry.command.group) ?? [];
      list.push(entry);
      map.set(entry.command.group, list);
    }
    return groupedOrder
      .filter((g) => map.has(g))
      .map((g) => ({ group: g, items: map.get(g) ?? [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  // Flat list mirrors the visual order so arrow keys advance through groups.
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  // Clamp activeIndex when the list changes.
  useEffect(() => {
    setActiveIndex((i) => Math.max(0, Math.min(i, flat.length - 1)));
  }, [flat.length]);

  // Scroll the active item into view.
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const entry = flat[activeIndex];
      if (entry && !entry.command.disabled) {
        entry.command.run();
        close();
      }
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, flat.length - 1));
    }
  };

  let runningIndex = -1;

  return (
    <div className="cmdk-overlay" role="presentation">
      <div
        ref={panelRef}
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        <div className="cmdk-input-row">
          <span className="cmdk-input-icon" aria-hidden="true">
            <IconSearch size={14} />
          </span>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Type a command, tool, sample…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            spellCheck={false}
            autoComplete="off"
            aria-label="Search commands"
          />
          <kbd className="kbd cmdk-esc">Esc</kbd>
        </div>

        <div className="cmdk-list" role="listbox" aria-label="Commands">
          {grouped.length === 0 ? (
            <div className="cmdk-empty">No commands match "{query}".</div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="cmdk-group">
                <div className="cmdk-group-label">{group}</div>
                {items.map(({ command }) => {
                  runningIndex += 1;
                  const myIndex = runningIndex;
                  const isActive = myIndex === activeIndex;
                  const Icon = command.Icon;
                  return (
                    <button
                      key={command.id}
                      ref={(el) => {
                        itemRefs.current[myIndex] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className="cmdk-item"
                      data-active={isActive || undefined}
                      data-disabled={command.disabled || undefined}
                      onMouseEnter={() => setActiveIndex(myIndex)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (command.disabled) return;
                        command.run();
                        close();
                      }}
                    >
                      <span className="cmdk-item-icon" aria-hidden="true">
                        {Icon ? <Icon size={14} /> : null}
                      </span>
                      <span className="cmdk-item-label">{command.label}</span>
                      {command.shortcut ? (
                        <span className="cmdk-item-shortcut">
                          {command.shortcut.map((key) => (
                            <kbd key={key} className="kbd">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="cmdk-footer">
          <span>
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd>
            navigate
          </span>
          <span>
            <kbd className="kbd">↵</kbd>
            run
          </span>
          <span>
            <kbd className="kbd">Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

/* ————————————————————————————————————
 * Helper builder — reduces App.tsx boilerplate.
 * Callers pass the action handlers; this returns a typed CommandEntry[].
 * Defined here so the registration shape stays in sync with the palette UI.
 * ———————————————————————————————————— */

export type SampleHandle = {
  id: string;
  name: string;
  file: string;
};

export type BuildCommandsArgs = {
  // Tools
  setTool: (tool: "select" | "pan" | "draw-wall" | "draw-room" | "place-component" | "measure") => void;
  // View
  setViewMode: (mode: "2d" | "3d" | "split") => void;
  // Samples
  samples: SampleHandle[];
  loadSample: (file: string, name: string) => void;
  // Project
  newProject: () => void;
  saveProject: () => void;
  openProject: () => void;
  importCatalog: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Panels
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  selectLeftPanelTab: (tab: "items" | "scene" | "chat" | "files" | "studio") => void;
};

export function buildDefaultCommands(args: BuildCommandsArgs): CommandEntry[] {
  const cmds: CommandEntry[] = [
    // ——— Tools ———
    {
      id: "tool.select",
      group: "Tools",
      label: "Select tool",
      aliases: ["pointer", "arrow", "v"],
      shortcut: ["V"],
      Icon: IconCursor,
      run: () => args.setTool("select")
    },
    {
      id: "tool.pan",
      group: "Tools",
      label: "Pan canvas",
      aliases: ["hand", "h", "drag"],
      shortcut: ["H"],
      Icon: IconHand,
      run: () => args.setTool("pan")
    },
    {
      id: "tool.wall",
      group: "Tools",
      label: "Draw wall",
      aliases: ["wall", "w", "line"],
      shortcut: ["W"],
      Icon: IconWall,
      run: () => args.setTool("draw-wall")
    },
    {
      id: "tool.room",
      group: "Tools",
      label: "Draw room",
      aliases: ["rect", "rectangle", "r", "box"],
      shortcut: ["R"],
      Icon: IconRoom,
      run: () => args.setTool("draw-room")
    },
    {
      id: "tool.place",
      group: "Tools",
      label: "Place component",
      aliases: ["furniture", "object", "p", "asset"],
      shortcut: ["P"],
      Icon: IconSparkles,
      run: () => args.setTool("place-component")
    },
    {
      id: "tool.measure",
      group: "Tools",
      label: "Measure distance",
      aliases: ["ruler", "m", "dimension"],
      shortcut: ["M"],
      Icon: IconRuler,
      run: () => args.setTool("measure")
    },

    // ——— View ———
    {
      id: "view.split",
      group: "View",
      label: "Split (2D + 3D)",
      aliases: ["both", "side", "split"],
      Icon: IconSplit,
      run: () => args.setViewMode("split")
    },
    {
      id: "view.plan",
      group: "View",
      label: "Plan (2D only)",
      aliases: ["2d", "top", "draft"],
      Icon: IconGrid,
      run: () => args.setViewMode("2d")
    },
    {
      id: "view.model",
      group: "View",
      label: "Model (3D only)",
      aliases: ["3d", "scene", "viewer"],
      Icon: IconCube,
      run: () => args.setViewMode("3d")
    },

    // ——— Samples ———
    ...args.samples.map<CommandEntry>((sample) => ({
      id: `sample.${sample.id}`,
      group: "Samples",
      label: `Load · ${sample.name}`,
      aliases: ["sample", "demo", sample.id, sample.name.toLowerCase()],
      Icon:
        sample.id === "atelier-loft"
          ? IconHome
          : sample.id === "urban-apartment"
            ? IconLayers
            : sample.id === "studio-office"
              ? IconLightBulb
              : IconSparkles,
      run: () => args.loadSample(sample.file, sample.name)
    })),

    // ——— Project ———
    {
      id: "project.new",
      group: "Project",
      label: "New project",
      aliases: ["clear", "blank", "reset"],
      Icon: IconNewFile,
      run: args.newProject
    },
    {
      id: "project.open",
      group: "Project",
      label: "Open project…",
      aliases: ["import", "load", "json"],
      Icon: IconUpload,
      run: args.openProject
    },
    {
      id: "project.save",
      group: "Project",
      label: "Save project",
      aliases: ["export", "download", "json"],
      Icon: IconDownload,
      run: args.saveProject
    },
    {
      id: "project.catalog",
      group: "Project",
      label: "Import catalog…",
      aliases: ["library", "components"],
      Icon: IconPlus,
      run: args.importCatalog
    },
    {
      id: "project.undo",
      group: "Project",
      label: "Undo",
      shortcut: ["Ctrl", "Z"],
      Icon: IconUndo,
      run: args.undo,
      disabled: !args.canUndo
    },
    {
      id: "project.redo",
      group: "Project",
      label: "Redo",
      shortcut: ["Ctrl", "Y"],
      Icon: IconRedo,
      run: args.redo,
      disabled: !args.canRedo
    },

    // ——— Panels ———
    {
      id: "panel.left",
      group: "Panels",
      label: "Toggle left panel",
      aliases: ["sidebar", "library"],
      shortcut: ["["],
      Icon: IconBox,
      run: args.toggleLeftPanel
    },
    {
      id: "panel.right",
      group: "Panels",
      label: "Toggle inspector",
      aliases: ["inspector", "right"],
      shortcut: ["]"],
      Icon: IconSettings,
      run: args.toggleRightPanel
    },
    {
      id: "panel.tab.items",
      group: "Panels",
      label: "Show Library tab",
      aliases: ["assets", "components"],
      shortcut: ["1"],
      Icon: IconBox,
      run: () => args.selectLeftPanelTab("items")
    },
    {
      id: "panel.tab.scene",
      group: "Panels",
      label: "Show Scene tab",
      aliases: ["tree", "outline"],
      shortcut: ["2"],
      Icon: IconTree,
      run: () => args.selectLeftPanelTab("scene")
    },
    {
      id: "panel.tab.chat",
      group: "Panels",
      label: "Show Assistant tab",
      aliases: ["ai", "chat"],
      shortcut: ["3"],
      Icon: IconMessage,
      run: () => args.selectLeftPanelTab("chat")
    },
    {
      id: "panel.tab.files",
      group: "Panels",
      label: "Show Files tab",
      aliases: ["io"],
      shortcut: ["4"],
      Icon: IconFolder,
      run: () => args.selectLeftPanelTab("files")
    },
    {
      id: "panel.tab.studio",
      group: "Panels",
      label: "Show Studio tab",
      aliases: ["stats", "settings"],
      shortcut: ["5"],
      Icon: IconSettings,
      run: () => args.selectLeftPanelTab("studio")
    }
  ];
  return cmds;
}
