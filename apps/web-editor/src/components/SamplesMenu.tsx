import { useEffect, useRef, useState, type ReactElement } from "react";
import { IconChevronDown, IconHome, IconLightBulb, IconLayers, IconSparkles } from "./Icon";

export type SampleEntry = {
  id: string;
  name: string;
  description: string;
  file: string;
  Icon: (props: { size?: number }) => ReactElement;
};

export const SAMPLES: SampleEntry[] = [
  {
    id: "atelier-loft",
    name: "Atelier Loft",
    description: "Open-plan loft with a reading corner",
    file: "./samples/atelier-loft.json",
    Icon: IconHome
  },
  {
    id: "urban-apartment",
    name: "Urban Apartment",
    description: "Two-bedroom with dining and kitchen",
    file: "./samples/urban-apartment.json",
    Icon: IconLayers
  },
  {
    id: "studio-office",
    name: "Studio Office",
    description: "Collaboration workspace with meeting zone",
    file: "./samples/studio-office.json",
    Icon: IconLightBulb
  }
];

type SamplesMenuProps = {
  onLoadSample: (file: string, name: string) => void;
};

export function SamplesMenu({ onLoadSample }: SamplesMenuProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconSparkles /> <span>Samples</span> <IconChevronDown size={12} />
      </button>
      {open ? (
        <div className="menu-panel" role="menu">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                onLoadSample(sample.file, sample.name);
                setOpen(false);
              }}
            >
              <sample.Icon size={14} />
              <div style={{ display: "grid", gap: 2 }}>
                <span>{sample.name}</span>
                <span className="muted">{sample.description}</span>
              </div>
            </button>
          ))}
          <div className="menu-divider" />
          <button
            type="button"
            role="menuitem"
            className="menu-item"
            onClick={() => {
              onLoadSample(SAMPLES[0].file, SAMPLES[0].name);
              setOpen(false);
            }}
          >
            <IconSparkles size={14} />
            <div>
              <span>Start with the default</span>
            </div>
          </button>
        </div>
      ) : null}
    </div>
  );
}
