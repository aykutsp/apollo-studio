import { useMemo, useState } from "react";
import type { ComponentCatalogSummary, ComponentDefinition } from "../../../../packages/core-domain/src";
import { IconSearch } from "./Icon";
import { AssetThumb } from "./AssetThumb";

type AssetLibraryPanelProps = {
  components: ComponentDefinition[];
  catalogs: ComponentCatalogSummary[];
  pendingComponentKey: string | null;
  onSelectComponent: (componentKey: string) => void;
  onAddExternalComponent: (component: ComponentDefinition) => void;
};

export function AssetLibraryPanel({
  components,
  catalogs,
  pendingComponentKey,
  onSelectComponent,
  onAddExternalComponent
}: AssetLibraryPanelProps) {
  const [query, setQuery] = useState("");
  const [catalogId, setCatalogId] = useState("all");
  const [category, setCategory] = useState("all");

  const [showImport, setShowImport] = useState(false);
  const [impUrl, setImpUrl] = useState("");
  const [impName, setImpName] = useState("");
  const [impW, setImpW] = useState("1");
  const [impD, setImpD] = useState("1");
  const [impH, setImpH] = useState("1");

  const handleImport = () => {
    onAddExternalComponent({
      catalogId: "external",
      catalogLabel: "Imported Models",
      key: `ext-${Date.now()}`,
      name: impName || "Unknown Model",
      category: "External",
      family: "furniture",
      placementMode: "free",
      material: "Default",
      footprint: { x: parseFloat(impW) || 1, y: parseFloat(impD) || 1 },
      height: parseFloat(impH) || 1,
      modelUrl: impUrl,
    });
    setImpUrl("");
    setImpName("");
    setShowImport(false);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const component of components) {
      if (catalogId !== "all" && component.catalogId !== catalogId) continue;
      set.add(component.category);
    }
    return ["all", ...Array.from(set).sort()];
  }, [catalogId, components]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return components.filter((component) => {
      if (catalogId !== "all" && component.catalogId !== catalogId) return false;
      if (category !== "all" && component.category !== category) return false;
      if (needle.length === 0) return true;
      return (
        component.name.toLowerCase().includes(needle) ||
        component.category.toLowerCase().includes(needle) ||
        component.family.toLowerCase().includes(needle) ||
        component.key.toLowerCase().includes(needle)
      );
    });
  }, [catalogId, category, components, query]);

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      <div className="library-filters">
        <div className="search-input">
          <IconSearch />
          <input
            type="search"
            className="input"
            placeholder="Search the library"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search components"
          />
        </div>
        <select className="select" value={catalogId} onChange={(event) => setCatalogId(event.target.value)}>
          <option value="all">All catalogs</option>
          {catalogs.map((catalog) => (
            <option key={catalog.id} value={catalog.id}>
              {catalog.label} · {catalog.itemCount}
            </option>
          ))}
        </select>
        <select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All categories" : item}
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", border: "1px dashed var(--border-color)", padding: "8px 0" }} onClick={() => setShowImport(!showImport)}>
        {showImport ? "Cancel Import" : "+ Import GLTF from URL"}
      </button>

      {showImport && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>
          <input className="input" placeholder="GLTF/GLB URL (e.g. from GitHub Raw)" value={impUrl} onChange={e => setImpUrl(e.target.value)} />
          <input className="input" placeholder="Model Name (e.g. Designer Sofa)" value={impName} onChange={e => setImpName(e.target.value)} />
          <div style={{ display: "flex", gap: "8px" }}>
            <input className="input" placeholder="Width (m)" type="number" step="0.1" value={impW} onChange={e => setImpW(e.target.value)} title="Width (m)" />
            <input className="input" placeholder="Depth (m)" type="number" step="0.1" value={impD} onChange={e => setImpD(e.target.value)} title="Depth (m)" />
            <input className="input" placeholder="Height (m)" type="number" step="0.1" value={impH} onChange={e => setImpH(e.target.value)} title="Height (m)" />
          </div>
          <button className="btn btn-primary" onClick={handleImport} disabled={!impUrl.trim()}>Add to Library</button>
        </div>
      )}

      <div className="asset-grid">
        {filtered.map((component) => (
          <button
            key={component.key}
            type="button"
            className="asset-card"
            aria-pressed={pendingComponentKey === component.key}
            onClick={() => onSelectComponent(component.key)}
            title={`${component.name} · ${component.footprint.x.toFixed(2)} × ${component.footprint.y.toFixed(2)} m`}
          >
            <div className="asset-thumb">
              <AssetThumb component={component} />
            </div>
            <div className="asset-name">{component.name}</div>
            <div className="asset-meta">
              <span>{component.category}</span>
              {component.placementMode === "hosted-wall" ? <span className="hosted">wall</span> : null}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="inspector-empty">
          <div className="title">No matches</div>
          <div className="body">Try a different catalog, category, or search term.</div>
        </div>
      ) : null}
    </div>
  );
}
