import type { ComponentDefinition, ProceduralKind } from "../../../../packages/core-domain/src";

/*
 * Asset thumbnail — a readable side/front elevation in SVG.
 *
 * Design goals:
 *   - Instantly recognizable at 72×54 px tile size.
 *   - Uses the component's palette (primary/frame/accent/glass) so
 *     variants read differently (light walnut sofa vs dark velvet sofa).
 *   - Pure SVG, no WebGL, so the library grid stays fast and scrolls
 *     smoothly even with hundreds of items.
 *
 * All glyphs draw into an 80×60 viewBox with the "ground line" at y=56.
 */

type ThumbProps = {
  component: ComponentDefinition;
};

export function AssetThumb({ component }: ThumbProps) {
  const kind = component.procedural?.kind ?? "generic-box";
  const palette = component.procedural?.palette ?? {};
  const primary = palette.primary ?? "#8a8f96";
  const frame = palette.frame ?? "#1a1d22";
  const accent = palette.accent ?? "#e8b169";
  const seat = palette.seat ?? "#cbd0da";
  const glass = palette.glass ?? "#b8d5db";

  return (
    <svg viewBox="0 0 80 60" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="asset-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect x="0" y="56" width="80" height="4" fill="url(#asset-floor)" />
      <line x1="4" y1="56" x2="76" y2="56" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
      <Glyph kind={kind} primary={primary} frame={frame} accent={accent} seat={seat} glass={glass} />
    </svg>
  );
}

type GlyphProps = {
  kind: ProceduralKind;
  primary: string;
  frame: string;
  accent: string;
  seat: string;
  glass: string;
};

function Glyph({ kind, primary, frame, accent, seat, glass }: GlyphProps) {
  switch (kind) {
    case "sofa":
      return <SofaGlyph primary={primary} frame={frame} accent={accent} />;
    case "armchair":
      return <ArmchairGlyph primary={primary} frame={frame} accent={accent} />;
    case "chair":
      return <ChairGlyph primary={primary} frame={frame} accent={accent} />;
    case "stool":
      return <StoolGlyph primary={primary} frame={frame} />;
    case "table":
      return <TableGlyph primary={primary} frame={frame} />;
    case "desk":
      return <DeskGlyph primary={primary} frame={frame} />;
    case "bed":
      return <BedGlyph primary={primary} frame={frame} accent={accent} seat={seat} />;
    case "cabinet":
      return <CabinetGlyph primary={primary} frame={frame} accent={accent} />;
    case "bookshelf":
      return <BookshelfGlyph primary={primary} frame={frame} accent={accent} />;
    case "wardrobe":
      return <WardrobeGlyph primary={primary} frame={frame} accent={accent} />;
    case "kitchen-island":
      return <IslandGlyph primary={primary} frame={frame} accent={accent} />;
    case "fridge":
      return <FridgeGlyph primary={primary} frame={frame} accent={accent} />;
    case "stove":
      return <StoveGlyph primary={primary} frame={frame} accent={accent} />;
    case "appliance":
      return <DishwasherGlyph primary={primary} frame={frame} accent={accent} />;
    case "basin":
      return <BasinGlyph primary={primary} frame={frame} accent={accent} />;
    case "bathtub":
      return <BathtubGlyph primary={primary} frame={frame} accent={accent} />;
    case "toilet":
      return <ToiletGlyph primary={primary} frame={frame} />;
    case "lamp-floor":
      return <LampFloorGlyph primary={primary} accent={accent} frame={frame} />;
    case "lamp-table":
      return <LampTableGlyph primary={primary} accent={accent} frame={frame} />;
    case "pendant":
      return <PendantGlyph primary={primary} accent={accent} frame={frame} />;
    case "plant":
      return <PlantGlyph primary={primary} frame={frame} accent={accent} />;
    case "rug":
      return <RugGlyph primary={primary} accent={accent} />;
    case "tv":
      return <TVGlyph primary={primary} frame={frame} />;
    case "door":
      return <DoorGlyph primary={primary} frame={frame} accent={accent} />;
    case "window":
      return <WindowGlyph primary={primary} frame={frame} glass={glass} />;
    default:
      return <GenericGlyph primary={primary} frame={frame} />;
  }
}

/* ———————————————————————————————————— Seating ———————————————————————————————————— */

function SofaGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <path d="M 10 34 Q 10 28 15 28 L 65 28 Q 70 28 70 34 L 70 48 L 10 48 Z" fill={primary} stroke={frame} strokeWidth="0.8" />
      <path d="M 10 34 Q 10 28 15 28 L 15 42 L 10 42 Z" fill={frame} opacity="0.45" />
      <path d="M 70 34 Q 70 28 65 28 L 65 42 L 70 42 Z" fill={frame} opacity="0.45" />
      <rect x="17" y="34" width="22" height="10" rx="2" fill={accent} opacity="0.65" />
      <rect x="41" y="34" width="22" height="10" rx="2" fill={accent} opacity="0.65" />
      <rect x="10" y="47" width="3" height="7" fill={frame} />
      <rect x="67" y="47" width="3" height="7" fill={frame} />
      <rect x="38" y="47" width="4" height="7" fill={frame} />
    </g>
  );
}

function ArmchairGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <path d="M 20 22 Q 20 16 26 16 L 54 16 Q 60 16 60 22 L 60 48 L 20 48 Z" fill={primary} stroke={frame} strokeWidth="0.8" />
      <path d="M 20 22 Q 20 16 26 16 L 26 40 L 20 40 Z" fill={frame} opacity="0.45" />
      <path d="M 60 22 Q 60 16 54 16 L 54 40 L 60 40 Z" fill={frame} opacity="0.45" />
      <rect x="28" y="30" width="24" height="14" rx="3" fill={accent} opacity="0.65" />
      <rect x="20" y="47" width="3" height="7" fill={frame} />
      <rect x="57" y="47" width="3" height="7" fill={frame} />
    </g>
  );
}

function ChairGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <path d="M 28 14 Q 28 12 30 12 L 50 12 Q 52 12 52 14 L 52 36 L 28 36 Z" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="26" y="35" width="28" height="5" rx="1" fill={accent} />
      <line x1="28" y1="40" x2="28" y2="54" stroke={frame} strokeWidth="1.8" />
      <line x1="52" y1="40" x2="52" y2="54" stroke={frame} strokeWidth="1.8" />
      <line x1="30" y1="40" x2="30" y2="54" stroke={frame} strokeWidth="1.2" opacity="0.6" />
      <line x1="50" y1="40" x2="50" y2="54" stroke={frame} strokeWidth="1.2" opacity="0.6" />
    </g>
  );
}

function StoolGlyph({ primary, frame }: { primary: string; frame: string }) {
  return (
    <g>
      <ellipse cx="40" cy="26" rx="16" ry="4" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="28" y1="28" x2="30" y2="54" stroke={frame} strokeWidth="1.8" />
      <line x1="52" y1="28" x2="50" y2="54" stroke={frame} strokeWidth="1.8" />
      <line x1="36" y1="28" x2="38" y2="54" stroke={frame} strokeWidth="1.2" opacity="0.5" />
      <line x1="44" y1="28" x2="42" y2="54" stroke={frame} strokeWidth="1.2" opacity="0.5" />
    </g>
  );
}

/* ———————————————————————————————————— Tables ———————————————————————————————————— */

function TableGlyph({ primary, frame }: { primary: string; frame: string }) {
  return (
    <g>
      <rect x="8" y="28" width="64" height="5" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="13" y1="33" x2="13" y2="54" stroke={frame} strokeWidth="2.2" />
      <line x1="67" y1="33" x2="67" y2="54" stroke={frame} strokeWidth="2.2" />
      <line x1="20" y1="33" x2="20" y2="40" stroke={frame} strokeWidth="1" opacity="0.4" />
      <line x1="60" y1="33" x2="60" y2="40" stroke={frame} strokeWidth="1" opacity="0.4" />
    </g>
  );
}

function DeskGlyph({ primary, frame }: { primary: string; frame: string }) {
  return (
    <g>
      <rect x="8" y="24" width="64" height="5" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="10" y="29" width="14" height="25" fill={frame} opacity="0.65" />
      <line x1="12" y1="35" x2="22" y2="35" stroke={primary} strokeWidth="0.6" />
      <line x1="12" y1="42" x2="22" y2="42" stroke={primary} strokeWidth="0.6" />
      <line x1="12" y1="49" x2="22" y2="49" stroke={primary} strokeWidth="0.6" />
      <line x1="68" y1="29" x2="68" y2="54" stroke={frame} strokeWidth="2.2" />
    </g>
  );
}

/* ———————————————————————————————————— Bedroom ———————————————————————————————————— */

function BedGlyph({ primary, frame, accent, seat }: { primary: string; frame: string; accent: string; seat: string }) {
  return (
    <g>
      <rect x="12" y="10" width="10" height="38" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="22" y="30" width="50" height="18" rx="2" fill={frame} opacity="0.9" />
      <rect x="22" y="28" width="50" height="10" rx="3" fill={seat} stroke={frame} strokeWidth="0.6" />
      <rect x="24" y="22" width="14" height="8" rx="2" fill={accent} opacity="0.75" />
      <rect x="56" y="22" width="14" height="8" rx="2" fill={accent} opacity="0.75" />
      <rect x="22" y="47" width="4" height="7" fill={frame} />
      <rect x="68" y="47" width="4" height="7" fill={frame} />
    </g>
  );
}

function NightstandGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="24" y="24" width="32" height="30" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="24" y1="34" x2="56" y2="34" stroke={frame} strokeWidth="0.6" />
      <line x1="24" y1="44" x2="56" y2="44" stroke={frame} strokeWidth="0.6" />
      <circle cx="40" cy="30" r="1.2" fill={accent} />
      <circle cx="40" cy="40" r="1.2" fill={accent} />
      <circle cx="40" cy="50" r="1.2" fill={accent} />
    </g>
  );
}

/* ———————————————————————————————————— Storage ———————————————————————————————————— */

function CabinetGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="14" y="18" width="52" height="36" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="40" y1="18" x2="40" y2="54" stroke={frame} strokeWidth="0.6" />
      <rect x="37" y="33" width="1.5" height="6" fill={accent} />
      <rect x="41.5" y="33" width="1.5" height="6" fill={accent} />
      <rect x="14" y="54" width="52" height="2" fill={frame} opacity="0.6" />
    </g>
  );
}

function WardrobeGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="14" y="8" width="52" height="46" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="40" y1="8" x2="40" y2="54" stroke={frame} strokeWidth="0.7" />
      <line x1="27" y1="8" x2="27" y2="54" stroke={frame} strokeWidth="0.3" opacity="0.5" />
      <line x1="53" y1="8" x2="53" y2="54" stroke={frame} strokeWidth="0.3" opacity="0.5" />
      <rect x="37" y="28" width="1.8" height="8" fill={accent} />
      <rect x="41.2" y="28" width="1.8" height="8" fill={accent} />
    </g>
  );
}

function BookshelfGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="14" y="10" width="52" height="44" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="14" y1="22" x2="66" y2="22" stroke={frame} strokeWidth="0.6" />
      <line x1="14" y1="34" x2="66" y2="34" stroke={frame} strokeWidth="0.6" />
      <line x1="14" y1="46" x2="66" y2="46" stroke={frame} strokeWidth="0.6" />
      {[12, 14, 16, 18, 20].map((h, i) => (
        <rect key={`r1-${i}`} x={18 + i * 4} y={22 - h} width="3" height={h} fill={accent} opacity={0.6 + (i % 2) * 0.2} />
      ))}
      {[10, 14, 16, 12, 18].map((h, i) => (
        <rect key={`r2-${i}`} x={40 + i * 4} y={22 - h} width="3" height={h} fill={accent} opacity={0.6 + (i % 2) * 0.2} />
      ))}
      {[14, 10, 12, 16, 14].map((h, i) => (
        <rect key={`r3-${i}`} x={18 + i * 4} y={34 - h} width="3" height={h} fill={accent} opacity={0.5 + (i % 2) * 0.2} />
      ))}
    </g>
  );
}

/* ———————————————————————————————————— Kitchen ———————————————————————————————————— */

function IslandGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="6" y="26" width="68" height="28" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="4" y="24" width="72" height="4" rx="1" fill={accent} stroke={frame} strokeWidth="0.6" />
      <line x1="28" y1="28" x2="28" y2="54" stroke={frame} strokeWidth="0.5" opacity="0.7" />
      <line x1="52" y1="28" x2="52" y2="54" stroke={frame} strokeWidth="0.5" opacity="0.7" />
      <rect x="14" y="38" width="1.5" height="6" fill={frame} opacity="0.6" />
      <rect x="38" y="38" width="1.5" height="6" fill={frame} opacity="0.6" />
      <rect x="62" y="38" width="1.5" height="6" fill={frame} opacity="0.6" />
    </g>
  );
}

function FridgeGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="24" y="8" width="32" height="46" rx="1.5" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="24" y1="22" x2="56" y2="22" stroke={frame} strokeWidth="0.8" />
      <rect x="51" y="14" width="1.5" height="6" fill={accent} />
      <rect x="51" y="28" width="1.5" height="14" fill={accent} />
      <path d="M 28 12 L 48 12" stroke={frame} strokeWidth="0.3" opacity="0.4" />
    </g>
  );
}

function StoveGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="16" y="24" width="48" height="30" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="18" y="26" width="44" height="8" rx="0.5" fill={frame} opacity="0.8" />
      <circle cx="26" cy="30" r="2.5" fill={accent} opacity="0.8" />
      <circle cx="38" cy="30" r="2.5" fill={accent} opacity="0.8" />
      <circle cx="50" cy="30" r="2.5" fill={accent} opacity="0.8" />
      <rect x="22" y="38" width="36" height="12" rx="1" fill={frame} opacity="0.55" stroke={frame} strokeWidth="0.4" />
      <rect x="22" y="42" width="36" height="1" fill={accent} opacity="0.5" />
    </g>
  );
}

function DishwasherGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="18" y="24" width="44" height="30" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="18" y="24" width="44" height="3" fill={frame} opacity="0.8" />
      <line x1="22" y1="25.5" x2="58" y2="25.5" stroke={accent} strokeWidth="0.4" opacity="0.7" />
      <circle cx="50" cy="25.5" r="0.8" fill={accent} />
      <rect x="20" y="30" width="40" height="22" rx="1" fill="none" stroke={frame} strokeWidth="0.4" opacity="0.5" />
    </g>
  );
}

function MicrowaveGlyph({ primary, frame, accent, glass }: { primary: string; frame: string; accent: string; glass: string }) {
  return (
    <g>
      <rect x="10" y="20" width="60" height="28" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="14" y="24" width="34" height="20" rx="0.5" fill={glass} opacity="0.4" stroke={frame} strokeWidth="0.4" />
      <rect x="52" y="24" width="14" height="20" rx="0.5" fill={frame} opacity="0.85" />
      <rect x="54" y="26" width="10" height="2" fill={accent} opacity="0.8" />
      <circle cx="58" cy="33" r="1" fill={accent} />
      <circle cx="62" cy="33" r="1" fill={accent} />
      <circle cx="58" cy="38" r="1" fill={accent} />
      <circle cx="62" cy="38" r="1" fill={accent} />
    </g>
  );
}

/* ———————————————————————————————————— Sanitary ———————————————————————————————————— */

function BasinGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="16" y="32" width="48" height="22" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <ellipse cx="40" cy="32" rx="18" ry="4" fill={frame} opacity="0.6" />
      <path d="M 40 28 L 40 20 L 42 20 L 42 22 L 44 22 L 44 28" fill="none" stroke={accent} strokeWidth="1" />
      <circle cx="40" cy="32" r="1" fill={frame} />
    </g>
  );
}

function BathtubGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <path d="M 10 30 Q 10 24 14 24 L 66 24 Q 70 24 70 30 L 70 46 Q 70 52 64 52 L 16 52 Q 10 52 10 46 Z" fill={primary} stroke={frame} strokeWidth="0.8" />
      <path d="M 13 30 Q 13 28 15 28 L 65 28 Q 67 28 67 30 L 67 44 Q 67 49 63 49 L 17 49 Q 13 49 13 44 Z" fill={frame} opacity="0.25" />
      <path d="M 60 22 L 60 16 L 64 16 L 64 22" fill="none" stroke={accent} strokeWidth="1" />
    </g>
  );
}

function ToiletGlyph({ primary, frame }: { primary: string; frame: string }) {
  return (
    <g>
      <rect x="28" y="18" width="24" height="16" rx="2" fill={primary} stroke={frame} strokeWidth="0.8" />
      <ellipse cx="40" cy="42" rx="14" ry="8" fill={primary} stroke={frame} strokeWidth="0.8" />
      <ellipse cx="40" cy="41" rx="10" ry="5" fill={frame} opacity="0.4" />
      <rect x="28" y="34" width="24" height="2" fill={frame} opacity="0.6" />
    </g>
  );
}

function ShowerGlyph({ primary, frame, glass }: { primary: string; frame: string; glass: string }) {
  return (
    <g>
      <rect x="14" y="10" width="52" height="44" rx="1" fill={glass} opacity="0.3" stroke={frame} strokeWidth="0.8" />
      <line x1="40" y1="10" x2="40" y2="54" stroke={frame} strokeWidth="0.4" opacity="0.5" />
      <rect x="14" y="50" width="52" height="4" fill={primary} opacity="0.7" />
      <circle cx="58" cy="18" r="2" fill={frame} />
      <line x1="58" y1="20" x2="56" y2="30" stroke={frame} strokeWidth="0.5" strokeDasharray="1 1" />
      <line x1="58" y1="20" x2="60" y2="32" stroke={frame} strokeWidth="0.5" strokeDasharray="1 1" />
    </g>
  );
}

function WashingMachineGlyph({ primary, frame, accent, glass }: { primary: string; frame: string; accent: string; glass: string }) {
  return (
    <g>
      <rect x="18" y="16" width="44" height="38" rx="1" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="18" y="16" width="44" height="4" fill={frame} opacity="0.8" />
      <circle cx="30" cy="18" r="0.8" fill={accent} />
      <circle cx="34" cy="18" r="0.8" fill={accent} />
      <circle cx="56" cy="18" r="1.2" fill={accent} />
      <circle cx="40" cy="36" r="11" fill={frame} opacity="0.8" stroke={frame} strokeWidth="0.6" />
      <circle cx="40" cy="36" r="8" fill={glass} opacity="0.35" />
      <circle cx="40" cy="36" r="2" fill={frame} opacity="0.6" />
    </g>
  );
}

/* ———————————————————————————————————— Lighting ———————————————————————————————————— */

function LampFloorGlyph({ primary, accent, frame }: { primary: string; accent: string; frame: string }) {
  return (
    <g>
      <ellipse cx="40" cy="54" rx="10" ry="2" fill={primary} opacity="0.7" />
      <line x1="40" y1="52" x2="40" y2="20" stroke={primary} strokeWidth="1.4" />
      <polygon points="30,20 50,20 46,6 34,6" fill={accent} stroke={frame} strokeWidth="0.6" />
      <polygon points="32,8 48,8 46,6 34,6" fill={accent} opacity="0.8" />
      <ellipse cx="40" cy="24" rx="3" ry="1" fill="#f6e1b8" opacity="0.6" />
    </g>
  );
}

function LampTableGlyph({ primary, accent, frame }: { primary: string; accent: string; frame: string }) {
  return (
    <g>
      <rect x="30" y="40" width="20" height="14" rx="1" fill={primary} opacity="0.4" />
      <ellipse cx="40" cy="40" rx="6" ry="1.5" fill={primary} stroke={frame} strokeWidth="0.6" />
      <rect x="37" y="30" width="6" height="10" fill={primary} stroke={frame} strokeWidth="0.6" />
      <polygon points="28,30 52,30 48,16 32,16" fill={accent} stroke={frame} strokeWidth="0.6" />
      <ellipse cx="40" cy="22" rx="3" ry="1" fill="#f6e1b8" opacity="0.6" />
    </g>
  );
}

function PendantGlyph({ primary, accent, frame }: { primary: string; accent: string; frame: string }) {
  return (
    <g>
      <line x1="40" y1="4" x2="40" y2="28" stroke={frame} strokeWidth="0.8" />
      <path d="M 26 28 L 54 28 L 50 46 L 30 46 Z" fill={primary} stroke={frame} strokeWidth="0.8" />
      <ellipse cx="40" cy="46" rx="10" ry="2.5" fill={accent} opacity="0.9" />
      <ellipse cx="40" cy="50" rx="12" ry="3" fill="#f6e1b8" opacity="0.3" />
    </g>
  );
}

/* ———————————————————————————————————— Decor ———————————————————————————————————— */

function PlantGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <path d="M 28 54 L 30 42 L 50 42 L 52 54 Z" fill={frame} stroke={frame} strokeWidth="0.6" opacity="0.9" />
      <rect x="30" y="40" width="20" height="3" fill="#3a2a1a" />
      <circle cx="32" cy="30" r="8" fill={primary} opacity="0.85" />
      <circle cx="42" cy="24" r="10" fill={primary} opacity="0.9" />
      <circle cx="48" cy="32" r="7" fill={accent} opacity="0.85" />
      <circle cx="38" cy="36" r="6" fill={accent} opacity="0.85" />
      <path d="M 42 24 L 42 42" stroke={frame} strokeWidth="0.6" opacity="0.5" />
    </g>
  );
}

function RugGlyph({ primary, accent }: { primary: string; accent: string }) {
  return (
    <g>
      <rect x="10" y="22" width="60" height="28" rx="1" fill={primary} />
      <rect x="14" y="26" width="52" height="20" rx="0.5" fill="none" stroke={accent} strokeWidth="1" />
      <rect x="18" y="30" width="44" height="12" rx="0.5" fill="none" stroke={accent} strokeWidth="0.6" strokeDasharray="2 2" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`tass-t-${i}`} x1={10 + i * 8} y1="22" x2={12 + i * 8} y2="19" stroke={primary} strokeWidth="0.8" opacity="0.6" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`tass-b-${i}`} x1={10 + i * 8} y1="50" x2={12 + i * 8} y2="53" stroke={primary} strokeWidth="0.8" opacity="0.6" />
      ))}
    </g>
  );
}

function TVGlyph({ primary, frame }: { primary: string; frame: string }) {
  return (
    <g>
      <rect x="8" y="12" width="64" height="34" rx="1.5" fill={frame} />
      <rect x="10" y="14" width="60" height="30" rx="0.5" fill="#081018" />
      <line x1="20" y1="22" x2="30" y2="22" stroke={primary} strokeWidth="0.5" opacity="0.3" />
      <line x1="20" y1="26" x2="38" y2="26" stroke={primary} strokeWidth="0.5" opacity="0.3" />
      <rect x="34" y="46" width="12" height="3" fill={frame} />
      <rect x="26" y="49" width="28" height="2" fill={frame} opacity="0.8" />
    </g>
  );
}

/* ———————————————————————————————————— Openings ———————————————————————————————————— */

function DoorGlyph({ primary, frame, accent }: { primary: string; frame: string; accent: string }) {
  return (
    <g>
      <rect x="26" y="6" width="28" height="48" rx="0.5" fill={primary} stroke={frame} strokeWidth="0.8" />
      <rect x="30" y="10" width="20" height="18" rx="0.5" fill="none" stroke={frame} strokeWidth="0.5" />
      <rect x="30" y="32" width="20" height="18" rx="0.5" fill="none" stroke={frame} strokeWidth="0.5" />
      <circle cx="48" cy="30" r="1.5" fill={accent} />
    </g>
  );
}

function WindowGlyph({ primary, frame, glass }: { primary: string; frame: string; glass: string }) {
  return (
    <g>
      <rect x="12" y="10" width="56" height="40" rx="0.5" fill={glass} opacity="0.35" stroke={frame} strokeWidth="1.4" />
      <rect x="12" y="10" width="56" height="40" rx="0.5" fill="none" stroke={primary} strokeWidth="0.8" />
      <line x1="40" y1="10" x2="40" y2="50" stroke={frame} strokeWidth="1" />
      <line x1="12" y1="30" x2="68" y2="30" stroke={frame} strokeWidth="1" />
    </g>
  );
}

function GenericGlyph({ primary, frame }: { primary: string; frame: string }) {
  return (
    <g>
      <rect x="16" y="20" width="48" height="34" rx="2" fill={primary} stroke={frame} strokeWidth="0.8" />
      <line x1="16" y1="28" x2="64" y2="28" stroke={frame} strokeWidth="0.5" opacity="0.5" />
    </g>
  );
}

/* Dispatch additional kinds that aren't in the enum yet — handled via assetKey fallback */
export function AssetThumbForKind({ kind, palette }: { kind: string; palette?: { primary?: string; frame?: string; accent?: string; glass?: string; seat?: string } }) {
  const primary = palette?.primary ?? "#8a8f96";
  const frame = palette?.frame ?? "#1a1d22";
  const accent = palette?.accent ?? "#e8b169";
  const glass = palette?.glass ?? "#b8d5db";
  const seat = palette?.seat ?? "#cbd0da";

  const props = { primary, frame, accent, glass, seat };
  return (
    <svg viewBox="0 0 80 60" width="100%" height="100%">
      {kind === "nightstand" ? <NightstandGlyph {...props} /> : null}
      {kind === "microwave" ? <MicrowaveGlyph {...props} /> : null}
      {kind === "dishwasher" ? <DishwasherGlyph {...props} /> : null}
      {kind === "shower" ? <ShowerGlyph {...props} /> : null}
      {kind === "washing-machine" ? <WashingMachineGlyph {...props} /> : null}
    </svg>
  );
}
