import type { UnitSystem } from "../../../../packages/core-domain/src";

type StatusBarProps = {
  message: string;
  unitSystem: UnitSystem;
  walls: number;
  objects: number;
  openings: number;
};

export function StatusBar({ message, unitSystem, walls, objects, openings }: StatusBarProps) {
  return (
    <footer className="statusbar" role="status">
      <span className="dot" aria-hidden="true" />
      <span className="message">{message}</span>
      <span className="sep" />
      <span>Walls · {walls}</span>
      <span className="sep" />
      <span>Items · {objects}</span>
      <span className="sep" />
      <span>Openings · {openings}</span>
      <span className="sep" />
      <span>Units · {unitSystem}</span>
    </footer>
  );
}
