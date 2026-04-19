import {
  componentCatalog,
  listCatalogSummaries,
  type ComponentCatalogSummary,
  type ComponentDefinition
} from "../../../../packages/core-domain/src";

type CatalogManifestEntry = {
  id: string;
  label: string;
  path: string;
};

type CatalogManifest = {
  catalogs: CatalogManifestEntry[];
};

function dedupeComponents(components: ComponentDefinition[]): ComponentDefinition[] {
  const map = new Map<string, ComponentDefinition>();

  for (const component of components) {
    map.set(`${component.catalogId}:${component.key}`, component);
  }

  return Array.from(map.values());
}

export async function loadRuntimeCatalogs(): Promise<{
  components: ComponentDefinition[];
  catalogs: ComponentCatalogSummary[];
}> {
  try {
    const manifestResponse = await fetch("./catalogs/manifest.json");
    if (!manifestResponse.ok) {
      throw new Error("catalog manifest unavailable");
    }

    const manifest = (await manifestResponse.json()) as CatalogManifest;
    const loaded = await Promise.all(
      manifest.catalogs.map(async (catalog) => {
        const response = await fetch(`.${catalog.path}`);
        if (!response.ok) {
          throw new Error(`catalog unavailable: ${catalog.id}`);
        }

        return (await response.json()) as ComponentDefinition[];
      })
    );

    const components = dedupeComponents(loaded.flat());
    return {
      components,
      catalogs: summarizeComponents(components)
    };
  } catch {
    return {
      components: componentCatalog,
      catalogs: listCatalogSummaries()
    };
  }
}

export async function importUserCatalog(file: File): Promise<ComponentDefinition[]> {
  const raw = JSON.parse(await file.text()) as ComponentDefinition[] | { components: ComponentDefinition[] };
  const components = Array.isArray(raw) ? raw : raw.components;
  return dedupeComponents(components);
}

export function mergeCatalogComponents(
  baseComponents: ComponentDefinition[],
  importedComponents: ComponentDefinition[]
): {
  components: ComponentDefinition[];
  catalogs: ComponentCatalogSummary[];
} {
  const components = dedupeComponents([...baseComponents, ...importedComponents]);
  return {
    components,
    catalogs: summarizeComponents(components)
  };
}

function summarizeComponents(components: ComponentDefinition[]): ComponentCatalogSummary[] {
  const groups = new Map<string, ComponentCatalogSummary>();

  for (const component of components) {
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
