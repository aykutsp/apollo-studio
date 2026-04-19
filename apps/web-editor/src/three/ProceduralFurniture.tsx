import { useMemo } from "react";
import * as THREE from "three";
import type { ProceduralKind, ProceduralPalette, Vec2 } from "../../../../packages/core-domain/src";

/*
 * Procedural furniture library.
 *
 * Every recipe renders at local origin (0,0,0) with:
 *   - x axis → width  (footprint.x)
 *   - z axis → depth  (footprint.y)
 *   - y axis → height (base on y=0, top on y=height)
 *
 * The caller (Scene3D) positions/rotates the returned group.
 * Selection highlight is applied as a thin outline box.
 */

type RecipeProps = {
  width: number;
  depth: number;
  height: number;
  palette: Required<ProceduralPalette>;
};

const DEFAULT_PALETTE: Required<ProceduralPalette> = {
  primary: "#888888",
  secondary: "#444444",
  accent: "#c29a4a",
  seat: "#cccccc",
  frame: "#222222",
  glass: "#b8d5db"
};

function mergePalette(palette: ProceduralPalette | undefined): Required<ProceduralPalette> {
  return {
    ...DEFAULT_PALETTE,
    ...(palette ?? {})
  };
}

function mat(color: string, opts?: { roughness?: number; metalness?: number; opacity?: number; transparent?: boolean; emissive?: string; emissiveIntensity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={opts?.roughness ?? 0.65}
      metalness={opts?.metalness ?? 0.05}
      opacity={opts?.opacity ?? 1}
      transparent={opts?.transparent ?? false}
      emissive={opts?.emissive ?? "#000000"}
      emissiveIntensity={opts?.emissiveIntensity ?? 0}
    />
  );
}

/* ——— Seating ——— */

function Sofa({ width, depth, height, palette }: RecipeProps) {
  const seatH = height * 0.4;
  const backH = height * 0.95;
  const armW = Math.min(0.2, width * 0.08);
  const seatInset = 0.04;
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, seatH / 2, 0]}>
        <boxGeometry args={[width, seatH, depth]} />
        {mat(palette.frame, { roughness: 0.9 })}
      </mesh>
      <mesh castShadow position={[0, seatH + 0.06, 0.02]}>
        <boxGeometry args={[width - seatInset * 2, 0.14, depth * 0.8]} />
        {mat(palette.primary, { roughness: 0.85 })}
      </mesh>
      <mesh castShadow position={[0, (seatH + backH) / 2 + 0.05, -depth / 2 + 0.12]}>
        <boxGeometry args={[width - armW * 2, backH - seatH, 0.18]} />
        {mat(palette.primary, { roughness: 0.88 })}
      </mesh>
      <mesh castShadow position={[-width / 2 + armW / 2, seatH + 0.08, 0]}>
        <boxGeometry args={[armW, 0.22, depth - 0.1]} />
        {mat(palette.accent, { roughness: 0.85 })}
      </mesh>
      <mesh castShadow position={[width / 2 - armW / 2, seatH + 0.08, 0]}>
        <boxGeometry args={[armW, 0.22, depth - 0.1]} />
        {mat(palette.accent, { roughness: 0.85 })}
      </mesh>
      {[0.35, -0.35].map((xRatio) => (
        <mesh key={`back-cushion-${xRatio}`} castShadow position={[width * xRatio, seatH + 0.24, -depth / 2 + 0.26]}>
          <boxGeometry args={[width * 0.34, 0.34, 0.18]} />
          {mat(palette.primary, { roughness: 0.9 })}
        </mesh>
      ))}
    </group>
  );
}

function Armchair({ width, depth, height, palette }: RecipeProps) {
  const seatH = height * 0.4;
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, seatH / 2, 0]}>
        <boxGeometry args={[width, seatH, depth]} />
        {mat(palette.frame, { roughness: 0.9 })}
      </mesh>
      <mesh castShadow position={[0, seatH + 0.06, 0]}>
        <boxGeometry args={[width - 0.14, 0.12, depth - 0.14]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[0, seatH + 0.36, -depth / 2 + 0.08]}>
        <boxGeometry args={[width - 0.24, height - seatH - 0.2, 0.14]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[-width / 2 + 0.05, seatH + 0.16, 0]}>
        <boxGeometry args={[0.08, 0.24, depth - 0.1]} />
        {mat(palette.accent)}
      </mesh>
      <mesh castShadow position={[width / 2 - 0.05, seatH + 0.16, 0]}>
        <boxGeometry args={[0.08, 0.24, depth - 0.1]} />
        {mat(palette.accent)}
      </mesh>
    </group>
  );
}

function DiningChair({ width, depth, height, palette }: RecipeProps) {
  const seatH = height * 0.5;
  const legW = 0.04;
  return (
    <group>
      <mesh castShadow position={[0, seatH - 0.03, 0]}>
        <boxGeometry args={[width, 0.06, depth]} />
        {mat(palette.accent, { roughness: 0.78 })}
      </mesh>
      <mesh castShadow position={[0, seatH + (height - seatH) / 2, -depth / 2 + 0.04]}>
        <boxGeometry args={[width - 0.08, height - seatH, 0.04]} />
        {mat(palette.primary)}
      </mesh>
      {[
        [-width / 2 + legW / 2, -depth / 2 + legW / 2],
        [width / 2 - legW / 2, -depth / 2 + legW / 2],
        [-width / 2 + legW / 2, depth / 2 - legW / 2],
        [width / 2 - legW / 2, depth / 2 - legW / 2]
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, (seatH - 0.06) / 2, z]}>
          <boxGeometry args={[legW, seatH - 0.06, legW]} />
          {mat(palette.frame, { roughness: 0.6 })}
        </mesh>
      ))}
    </group>
  );
}

function Stool({ width, depth, height, palette }: RecipeProps) {
  const seatH = height;
  const legW = 0.04;
  const r = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh castShadow position={[0, seatH - 0.04, 0]}>
        <cylinderGeometry args={[r, r, 0.08, 24]} />
        {mat(palette.accent)}
      </mesh>
      {[
        [-r + legW * 1.5, -r + legW * 1.5],
        [r - legW * 1.5, -r + legW * 1.5],
        [-r + legW * 1.5, r - legW * 1.5],
        [r - legW * 1.5, r - legW * 1.5]
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, (seatH - 0.08) / 2, z]}>
          <boxGeometry args={[legW, seatH - 0.08, legW]} />
          {mat(palette.frame)}
        </mesh>
      ))}
    </group>
  );
}

/* ——— Tables ——— */

function Table({ width, depth, height, palette }: RecipeProps) {
  const topT = 0.04;
  const legW = 0.06;
  const radius = Math.min(width, depth) / 2;
  const round = width === depth;
  return (
    <group>
      {round ? (
        <mesh castShadow position={[0, height - topT / 2, 0]}>
          <cylinderGeometry args={[radius, radius, topT, 48]} />
          {mat(palette.primary, { roughness: 0.5 })}
        </mesh>
      ) : (
        <mesh castShadow position={[0, height - topT / 2, 0]}>
          <boxGeometry args={[width, topT, depth]} />
          {mat(palette.primary, { roughness: 0.5 })}
        </mesh>
      )}
      {round ? (
        <mesh castShadow position={[0, (height - topT) / 2, 0]}>
          <cylinderGeometry args={[legW, legW, height - topT, 12]} />
          {mat(palette.frame)}
        </mesh>
      ) : (
        [
          [-width / 2 + legW, -depth / 2 + legW],
          [width / 2 - legW, -depth / 2 + legW],
          [-width / 2 + legW, depth / 2 - legW],
          [width / 2 - legW, depth / 2 - legW]
        ].map(([x, z], i) => (
          <mesh key={i} castShadow position={[x, (height - topT) / 2, z]}>
            <boxGeometry args={[legW, height - topT, legW]} />
            {mat(palette.frame)}
          </mesh>
        ))
      )}
    </group>
  );
}

function Desk({ width, depth, height, palette }: RecipeProps) {
  const topT = 0.04;
  return (
    <group>
      <mesh castShadow position={[0, height - topT / 2, 0]}>
        <boxGeometry args={[width, topT, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[-width / 2 + 0.3, (height - topT) / 2, 0]}>
        <boxGeometry args={[0.5, height - topT, depth - 0.1]} />
        {mat(palette.frame)}
      </mesh>
      <mesh castShadow position={[width / 2 - 0.02, (height - topT) / 2, 0]}>
        <boxGeometry args={[0.03, height - topT, depth - 0.1]} />
        {mat(palette.frame)}
      </mesh>
    </group>
  );
}

/* ——— Bedroom ——— */

function Bed({ width, depth, height, palette }: RecipeProps) {
  const baseH = 0.28;
  const mattressH = 0.24;
  const headH = height;
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, baseH / 2, 0]}>
        <boxGeometry args={[width, baseH, depth]} />
        {mat(palette.frame, { roughness: 0.85 })}
      </mesh>
      <mesh castShadow position={[0, baseH + mattressH / 2, 0.04]}>
        <boxGeometry args={[width - 0.06, mattressH, depth * 0.92]} />
        {mat(palette.seat, { roughness: 0.9 })}
      </mesh>
      <mesh castShadow position={[0, baseH + mattressH + 0.04, depth * 0.25]}>
        <boxGeometry args={[width - 0.2, 0.08, depth * 0.35]} />
        {mat(palette.accent)}
      </mesh>
      <mesh castShadow position={[-width * 0.22, baseH + mattressH + 0.12, depth * 0.32]}>
        <boxGeometry args={[width * 0.22, 0.16, 0.22]} />
        {mat(palette.seat)}
      </mesh>
      <mesh castShadow position={[width * 0.22, baseH + mattressH + 0.12, depth * 0.32]}>
        <boxGeometry args={[width * 0.22, 0.16, 0.22]} />
        {mat(palette.seat)}
      </mesh>
      <mesh castShadow position={[0, (headH + baseH) / 2 + 0.02, -depth / 2 + 0.04]}>
        <boxGeometry args={[width, headH - baseH - 0.04, 0.1]} />
        {mat(palette.primary, { roughness: 0.9 })}
      </mesh>
    </group>
  );
}

/* ——— Storage ——— */

function Cabinet({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.6 })}
      </mesh>
      <mesh position={[0, height / 2, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.96, height * 0.92]} />
        {mat(palette.frame, { roughness: 0.3, metalness: 0.12 })}
      </mesh>
      <mesh position={[-0.04, height / 2, depth / 2 + 0.012]}>
        <boxGeometry args={[0.01, height * 0.9, 0.01]} />
        {mat(palette.accent, { metalness: 0.5 })}
      </mesh>
      <mesh position={[0.04, height / 2, depth / 2 + 0.012]}>
        <boxGeometry args={[0.01, height * 0.9, 0.01]} />
        {mat(palette.accent, { metalness: 0.5 })}
      </mesh>
    </group>
  );
}

function Bookshelf({ width, depth, height, palette }: RecipeProps) {
  const shelves = 4;
  const shelfT = 0.03;
  return (
    <group>
      <mesh castShadow position={[-width / 2 + 0.02, height / 2, 0]}>
        <boxGeometry args={[0.04, height, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[width / 2 - 0.02, height / 2, 0]}>
        <boxGeometry args={[0.04, height, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[0, height - 0.015, 0]}>
        <boxGeometry args={[width, shelfT, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh receiveShadow position={[0, shelfT / 2, 0]}>
        <boxGeometry args={[width, shelfT, depth]} />
        {mat(palette.primary)}
      </mesh>
      {Array.from({ length: shelves - 1 }, (_, i) => {
        const y = (height / shelves) * (i + 1);
        return (
          <mesh key={i} castShadow position={[0, y, 0]}>
            <boxGeometry args={[width - 0.08, shelfT, depth - 0.02]} />
            {mat(palette.primary)}
          </mesh>
        );
      })}
      {Array.from({ length: shelves }, (_, i) => {
        const shelfY = (height / shelves) * i + height / shelves / 2;
        return (
          <group key={`books-${i}`}>
            {Array.from({ length: 6 }, (_, b) => {
              const bx = (width - 0.2) * (b / 6 - 0.5 + 0.08);
              const bh = 0.16 + ((b * 37 + i * 11) % 11) / 100;
              const colors = [palette.accent, palette.frame, palette.seat];
              return (
                <mesh key={b} position={[bx, shelfY + bh / 2 - 0.02, 0]}>
                  <boxGeometry args={[0.055, bh, depth * 0.5]} />
                  {mat(colors[(b + i) % colors.length], { roughness: 0.7 })}
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function Wardrobe({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh position={[-width * 0.24, height / 2, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.44, height * 0.94]} />
        {mat(palette.frame, { roughness: 0.35 })}
      </mesh>
      <mesh position={[width * 0.24, height / 2, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.44, height * 0.94]} />
        {mat(palette.frame, { roughness: 0.35 })}
      </mesh>
      <mesh position={[-0.06, height * 0.5, depth / 2 + 0.012]}>
        <boxGeometry args={[0.01, 0.22, 0.01]} />
        {mat(palette.accent, { metalness: 0.5 })}
      </mesh>
      <mesh position={[0.06, height * 0.5, depth / 2 + 0.012]}>
        <boxGeometry args={[0.01, 0.22, 0.01]} />
        {mat(palette.accent, { metalness: 0.5 })}
      </mesh>
    </group>
  );
}

/* ——— Kitchen ——— */

function KitchenIsland({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, (height - 0.04) / 2, 0]}>
        <boxGeometry args={[width, height - 0.04, depth]} />
        {mat(palette.frame)}
      </mesh>
      <mesh castShadow position={[0, height - 0.02, 0]}>
        <boxGeometry args={[width + 0.04, 0.04, depth + 0.04]} />
        {mat(palette.accent, { roughness: 0.25, metalness: 0.1 })}
      </mesh>
      {Array.from({ length: 3 }, (_, i) => {
        const x = (i - 1) * (width * 0.3);
        return (
          <mesh key={i} position={[x, height * 0.42, depth / 2 + 0.005]}>
            <planeGeometry args={[width * 0.24, height * 0.7]} />
            {mat(palette.primary, { roughness: 0.55 })}
          </mesh>
        );
      })}
    </group>
  );
}

function Fridge({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.3, metalness: 0.55 })}
      </mesh>
      <mesh position={[0, height * 0.75, depth / 2 + 0.008]}>
        <planeGeometry args={[width * 0.9, 0.005]} />
        {mat(palette.frame)}
      </mesh>
      <mesh position={[width * 0.3, height * 0.82, depth / 2 + 0.012]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        {mat(palette.accent, { metalness: 0.8 })}
      </mesh>
      <mesh position={[width * 0.3, height * 0.32, depth / 2 + 0.012]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        {mat(palette.accent, { metalness: 0.8 })}
      </mesh>
    </group>
  );
}

function Stove({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.35, metalness: 0.45 })}
      </mesh>
      <mesh position={[0, height + 0.006, 0]}>
        <boxGeometry args={[width * 0.96, 0.01, depth * 0.92]} />
        {mat(palette.accent, { roughness: 0.18, metalness: 0.2 })}
      </mesh>
      {[
        [-width * 0.22, depth * 0.22],
        [width * 0.22, depth * 0.22],
        [-width * 0.22, -depth * 0.22],
        [width * 0.22, -depth * 0.22]
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height + 0.014, z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.008, 20]} />
          {mat("#0b0b0b", { roughness: 0.2, metalness: 0.1 })}
        </mesh>
      ))}
      <mesh position={[0, height * 0.38, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.7, height * 0.3]} />
        {mat("#14171b", { roughness: 0.25 })}
      </mesh>
    </group>
  );
}

/* ——— Sanitary ——— */

function Basin({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height - 0.05, 0]}>
        <boxGeometry args={[width, 0.1, depth]} />
        {mat(palette.primary, { roughness: 0.3 })}
      </mesh>
      <mesh position={[0, height - 0.09, 0]}>
        <boxGeometry args={[width * 0.8, 0.04, depth * 0.7]} />
        {mat(palette.frame, { roughness: 0.4 })}
      </mesh>
      {height > 0.3 ? (
        <mesh castShadow position={[0, (height - 0.1) / 2, 0]}>
          <boxGeometry args={[width, height - 0.1, depth]} />
          {mat(palette.accent)}
        </mesh>
      ) : null}
      <mesh position={[0, height + 0.05, -depth * 0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 12]} />
        {mat(palette.frame, { metalness: 0.6, roughness: 0.2 })}
      </mesh>
    </group>
  );
}

function Bathtub({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.2 })}
      </mesh>
      <mesh position={[0, height - 0.04, 0]}>
        <boxGeometry args={[width - 0.2, 0.02, depth - 0.2]} />
        {mat(palette.accent, { roughness: 0.1, metalness: 0.2 })}
      </mesh>
    </group>
  );
}

function Toilet({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth * 0.62]} />
        {mat(palette.primary)}
      </mesh>
      <mesh position={[0, height - 0.02, depth * 0.12]}>
        <boxGeometry args={[width * 0.9, 0.04, depth * 0.7]} />
        {mat(palette.primary, { roughness: 0.25 })}
      </mesh>
      <mesh position={[0, height + 0.15, -depth * 0.12]}>
        <boxGeometry args={[width * 0.85, 0.3, 0.12]} />
        {mat(palette.primary)}
      </mesh>
    </group>
  );
}

/* ——— Lighting ——— */

function LampFloor({ width, depth, height, palette }: RecipeProps) {
  const baseR = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[baseR, baseR, 0.04, 24]} />
        {mat(palette.primary, { metalness: 0.6, roughness: 0.3 })}
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, height - 0.1, 12]} />
        {mat(palette.primary, { metalness: 0.6, roughness: 0.2 })}
      </mesh>
      <mesh castShadow position={[0, height - 0.12, 0]}>
        <coneGeometry args={[0.22, 0.3, 24, 1, true]} />
        {mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.18 })}
      </mesh>
      <pointLight position={[0, height - 0.15, 0]} intensity={0.6} distance={4.5} color="#f6e1b8" />
    </group>
  );
}

function LampTable({ width, depth, height, palette }: RecipeProps) {
  const baseR = Math.min(width, depth) / 2 * 0.6;
  return (
    <group>
      <mesh castShadow position={[0, height * 0.2, 0]}>
        <cylinderGeometry args={[baseR, baseR, height * 0.4, 24]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[0, height - 0.1, 0]}>
        <coneGeometry args={[baseR * 1.5, 0.22, 24, 1, true]} />
        {mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.15 })}
      </mesh>
      <pointLight position={[0, height - 0.08, 0]} intensity={0.35} distance={2.2} color="#f6e1b8" />
    </group>
  );
}

function Pendant({ width, depth, height, palette }: RecipeProps) {
  const cordH = height * 0.55;
  const shadeR = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh position={[0, height - cordH / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, cordH, 8]} />
        {mat(palette.frame)}
      </mesh>
      <mesh castShadow position={[0, height - cordH - 0.12, 0]}>
        <sphereGeometry args={[shadeR, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        {mat(palette.primary, { metalness: 0.55, roughness: 0.28 })}
      </mesh>
      <mesh position={[0, height - cordH - 0.22, 0]}>
        <sphereGeometry args={[shadeR * 0.4, 16, 12]} />
        {mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.25 })}
      </mesh>
      <pointLight position={[0, height - cordH - 0.22, 0]} intensity={0.55} distance={5} color="#f6e1b8" />
    </group>
  );
}

/* ——— Decor ——— */

function Plant({ width, depth, height, palette }: RecipeProps) {
  const potH = Math.min(0.36, height * 0.32);
  const potR = Math.min(width, depth) / 2 * 0.8;
  const leafR = Math.max(width, depth) * 0.55;
  return (
    <group>
      <mesh castShadow position={[0, potH / 2, 0]}>
        <cylinderGeometry args={[potR * 0.9, potR, potH, 20]} />
        {mat(palette.frame, { roughness: 0.9 })}
      </mesh>
      <mesh position={[0, potH + 0.02, 0]}>
        <cylinderGeometry args={[potR * 0.9, potR * 0.9, 0.04, 20]} />
        {mat("#3a2a1a", { roughness: 1 })}
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const leafY = potH + (height - potH) * (0.3 + ((i * 13) % 50) / 100);
        const leafX = Math.cos(angle) * leafR * 0.4;
        const leafZ = Math.sin(angle) * leafR * 0.4;
        return (
          <group key={i} position={[leafX, leafY, leafZ]} rotation={[0, angle, 0.4]}>
            <mesh castShadow>
              <sphereGeometry args={[leafR * 0.35, 8, 6]} />
              {mat(palette.primary, { roughness: 0.85 })}
            </mesh>
          </group>
        );
      })}
      <mesh castShadow position={[0, (potH + height) / 2, 0]}>
        <sphereGeometry args={[leafR * 0.48, 12, 10]} />
        {mat(palette.accent, { roughness: 0.85 })}
      </mesh>
    </group>
  );
}

function Rug({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, Math.max(height, 0.01), depth]} />
        {mat(palette.primary, { roughness: 0.95 })}
      </mesh>
      <mesh position={[0, height + 0.001, 0]}>
        <ringGeometry args={[Math.min(width, depth) / 2 - 0.08, Math.min(width, depth) / 2 - 0.04, 48]} />
        {mat(palette.accent, { roughness: 0.9 })}
      </mesh>
    </group>
  );
}

function TV({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, height / 2 + 0.8, 0]}>
        <boxGeometry args={[width, height, depth + 0.02]} />
        {mat(palette.frame, { roughness: 0.3 })}
      </mesh>
      <mesh position={[0, height / 2 + 0.8, depth / 2 + 0.005]}>
        <planeGeometry args={[width - 0.05, height - 0.05]} />
        {mat(palette.primary, { roughness: 0.1, metalness: 0.2, emissive: "#081018", emissiveIntensity: 0.6 })}
      </mesh>
    </group>
  );
}

/* ——— Openings (standalone, not hosted — for free placement demos) ——— */

function DoorStand({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.6 })}
      </mesh>
      <mesh position={[width * 0.35, height * 0.5, depth / 2 + 0.006]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        {mat(palette.accent, { metalness: 0.8, roughness: 0.15 })}
      </mesh>
    </group>
  );
}

function WindowStand({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.glass, { roughness: 0.05, metalness: 0.1, opacity: 0.55, transparent: true })}
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width + 0.02, 0.02, depth + 0.01]} />
        {mat(palette.frame)}
      </mesh>
    </group>
  );
}

function GenericBox({ width, depth, height, palette }: RecipeProps) {
  return (
    <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
      <boxGeometry args={[width, height, depth]} />
      {mat(palette.primary)}
    </mesh>
  );
}

function Nightstand({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh position={[0, height * 0.3, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.9, height * 0.25]} />
        {mat(palette.frame, { roughness: 0.35 })}
      </mesh>
      <mesh position={[0, height * 0.72, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.9, height * 0.25]} />
        {mat(palette.frame, { roughness: 0.35 })}
      </mesh>
      <mesh position={[0, height * 0.3, depth / 2 + 0.012]}>
        <boxGeometry args={[width * 0.25, 0.015, 0.015]} />
        {mat(palette.accent, { metalness: 0.6 })}
      </mesh>
      <mesh position={[0, height * 0.72, depth / 2 + 0.012]}>
        <boxGeometry args={[width * 0.25, 0.015, 0.015]} />
        {mat(palette.accent, { metalness: 0.6 })}
      </mesh>
    </group>
  );
}

function Dresser({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary)}
      </mesh>
      {Array.from({ length: 3 }, (_, i) => {
        const y = height - height * ((i + 0.5) / 3) + height * 0.02;
        return (
          <group key={i}>
            <mesh position={[0, y, depth / 2 + 0.005]}>
              <planeGeometry args={[width * 0.95, height / 3 - 0.05]} />
              {mat(palette.frame, { roughness: 0.35 })}
            </mesh>
            <mesh position={[-width * 0.2, y, depth / 2 + 0.012]}>
              <boxGeometry args={[width * 0.14, 0.015, 0.015]} />
              {mat(palette.accent, { metalness: 0.6 })}
            </mesh>
            <mesh position={[width * 0.2, y, depth / 2 + 0.012]}>
              <boxGeometry args={[width * 0.14, 0.015, 0.015]} />
              {mat(palette.accent, { metalness: 0.6 })}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Console({ width, depth, height, palette }: RecipeProps) {
  const topT = 0.03;
  return (
    <group>
      <mesh castShadow position={[0, height - topT / 2, 0]}>
        <boxGeometry args={[width, topT, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh position={[0, height * 0.5, 0]}>
        <boxGeometry args={[width * 0.94, 0.02, depth * 0.92]} />
        {mat(palette.primary, { roughness: 0.7 })}
      </mesh>
      <mesh castShadow position={[-width / 2 + 0.02, (height - topT) / 2, 0]}>
        <boxGeometry args={[0.04, height - topT, depth]} />
        {mat(palette.frame)}
      </mesh>
      <mesh castShadow position={[width / 2 - 0.02, (height - topT) / 2, 0]}>
        <boxGeometry args={[0.04, height - topT, depth]} />
        {mat(palette.frame)}
      </mesh>
    </group>
  );
}

function MediaConsole({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh position={[-width * 0.26, height / 2, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.45, height * 0.88]} />
        {mat(palette.frame, { roughness: 0.35 })}
      </mesh>
      <mesh position={[width * 0.26, height / 2, depth / 2 + 0.005]}>
        <boxGeometry args={[width * 0.45, height * 0.88, 0.005]} />
        {mat(palette.primary)}
      </mesh>
      <mesh position={[width * 0.26, height * 0.75, depth / 2 + 0.008]}>
        <boxGeometry args={[width * 0.4, 0.01, 0.005]} />
        {mat(palette.accent, { metalness: 0.2 })}
      </mesh>
      <mesh position={[width * 0.26, height * 0.45, depth / 2 + 0.008]}>
        <boxGeometry args={[width * 0.4, 0.01, 0.005]} />
        {mat(palette.accent, { metalness: 0.2 })}
      </mesh>
      <mesh position={[width * 0.26, height * 0.18, depth / 2 + 0.008]}>
        <boxGeometry args={[width * 0.4, 0.01, 0.005]} />
        {mat(palette.accent, { metalness: 0.2 })}
      </mesh>
    </group>
  );
}

function FilingCabinet({ width, depth, height, palette }: RecipeProps) {
  const drawers = 4;
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.4, metalness: 0.3 })}
      </mesh>
      {Array.from({ length: drawers }, (_, i) => {
        const y = height - (height * (i + 0.5)) / drawers;
        return (
          <group key={i}>
            <mesh position={[0, y, depth / 2 + 0.005]}>
              <planeGeometry args={[width * 0.95, height / drawers - 0.02]} />
              {mat(palette.frame, { roughness: 0.35, metalness: 0.25 })}
            </mesh>
            <mesh position={[0, y, depth / 2 + 0.012]}>
              <boxGeometry args={[width * 0.25, 0.015, 0.015]} />
              {mat(palette.accent, { metalness: 0.7 })}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Bench({ width, depth, height, palette }: RecipeProps) {
  const seatH = height * 0.6;
  const topT = 0.05;
  const legW = 0.05;
  return (
    <group>
      <mesh castShadow position={[0, seatH, 0]}>
        <boxGeometry args={[width, topT, depth]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[0, seatH + topT / 2 + 0.015, 0]}>
        <boxGeometry args={[width - 0.04, 0.03, depth * 0.94]} />
        {mat(palette.accent, { roughness: 0.88 })}
      </mesh>
      {[
        [-width / 2 + legW, -depth / 2 + legW],
        [width / 2 - legW, -depth / 2 + legW],
        [-width / 2 + legW, depth / 2 - legW],
        [width / 2 - legW, depth / 2 - legW]
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, seatH / 2, z]}>
          <boxGeometry args={[legW, seatH, legW]} />
          {mat(palette.frame)}
        </mesh>
      ))}
    </group>
  );
}

function BarStool({ width, depth, height, palette }: RecipeProps) {
  const r = Math.min(width, depth) / 2;
  return (
    <group>
      <mesh castShadow position={[0, height - 0.04, 0]}>
        <cylinderGeometry args={[r, r, 0.08, 24]} />
        {mat(palette.primary)}
      </mesh>
      <mesh castShadow position={[0, height * 0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, height - 0.08, 12]} />
        {mat(palette.frame, { metalness: 0.6 })}
      </mesh>
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[r * 0.95, r * 0.95, 0.02, 24]} />
        {mat(palette.frame, { metalness: 0.6 })}
      </mesh>
      <mesh position={[0, height * 0.4, 0]}>
        <torusGeometry args={[r * 0.75, 0.008, 6, 24]} />
        {mat(palette.accent, { metalness: 0.6 })}
      </mesh>
    </group>
  );
}

function OfficeChair({ width, depth, height, palette }: RecipeProps) {
  const seatH = height * 0.48;
  const r = Math.min(width, depth) / 2;
  return (
    <group>
      {/* Wheeled base */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * r * 0.7, 0.03, Math.sin(angle) * r * 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.04, 12]} />
            {mat(palette.frame)}
          </mesh>
        );
      })}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[r * 0.25, r * 0.3, 0.06, 16]} />
        {mat(palette.frame, { metalness: 0.6 })}
      </mesh>
      <mesh position={[0, seatH - 0.06, 0]}>
        <cylinderGeometry args={[0.03, 0.03, seatH - 0.2, 12]} />
        {mat(palette.frame, { metalness: 0.7 })}
      </mesh>
      <mesh castShadow position={[0, seatH, 0]}>
        <boxGeometry args={[width * 0.8, 0.08, depth * 0.8]} />
        {mat(palette.primary, { roughness: 0.85 })}
      </mesh>
      <mesh castShadow position={[0, seatH + 0.3, -depth * 0.3]}>
        <boxGeometry args={[width * 0.72, 0.54, 0.08]} />
        {mat(palette.accent, { roughness: 0.8 })}
      </mesh>
    </group>
  );
}

function Microwave({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.35, metalness: 0.45 })}
      </mesh>
      <mesh position={[-width * 0.18, height / 2, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.55, height * 0.82]} />
        {mat(palette.glass, { opacity: 0.45, transparent: true, roughness: 0.1 })}
      </mesh>
      <mesh position={[width * 0.25, height / 2, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.35, height * 0.82]} />
        {mat(palette.frame, { roughness: 0.4 })}
      </mesh>
      <mesh position={[width * 0.2, height * 0.72, depth / 2 + 0.01]}>
        <boxGeometry args={[width * 0.3, 0.03, 0.005]} />
        {mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.4 })}
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[width * (0.15 + (i % 2) * 0.14), height * (0.45 - Math.floor(i / 2) * 0.15), depth / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
          {mat(palette.accent, { metalness: 0.7 })}
        </mesh>
      ))}
    </group>
  );
}

function Dishwasher({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.3, metalness: 0.5 })}
      </mesh>
      <mesh position={[0, height - 0.04, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.96, 0.08]} />
        {mat(palette.frame, { metalness: 0.5 })}
      </mesh>
      <mesh position={[width * 0.3, height - 0.04, depth / 2 + 0.01]}>
        <sphereGeometry args={[0.012, 10, 10]} />
        {mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.5 })}
      </mesh>
      <mesh position={[0, height * 0.45, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.94, height * 0.82]} />
        {mat(palette.primary, { roughness: 0.28, metalness: 0.55 })}
      </mesh>
      <mesh position={[0, height * 0.85, depth / 2 + 0.012]}>
        <boxGeometry args={[width * 0.9, 0.015, 0.015]} />
        {mat(palette.accent, { metalness: 0.7 })}
      </mesh>
    </group>
  );
}

function RangeHood({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, height * 0.4, 0]}>
        <boxGeometry args={[width, height * 0.8, depth]} />
        {mat(palette.primary, { roughness: 0.3, metalness: 0.45 })}
      </mesh>
      <mesh position={[0, height * 0.9, 0]}>
        <boxGeometry args={[width * 0.3, height * 0.2, depth * 0.6]} />
        {mat(palette.primary, { roughness: 0.35, metalness: 0.4 })}
      </mesh>
      <mesh position={[0, height * 0.05, depth / 2 - 0.002]}>
        <planeGeometry args={[width * 0.9, height * 0.08]} />
        {mat(palette.frame, { roughness: 0.8 })}
      </mesh>
    </group>
  );
}

function WashingMachine({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        {mat(palette.primary, { roughness: 0.4, metalness: 0.3 })}
      </mesh>
      <mesh position={[0, height * 0.88, depth / 2 + 0.005]}>
        <planeGeometry args={[width * 0.96, height * 0.2]} />
        {mat(palette.frame)}
      </mesh>
      <mesh position={[-width * 0.3, height * 0.88, depth / 2 + 0.01]}>
        <boxGeometry args={[width * 0.28, 0.04, 0.005]} />
        {mat(palette.accent, { metalness: 0.4 })}
      </mesh>
      <mesh position={[width * 0.3, height * 0.88, depth / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
        {mat(palette.accent, { emissive: palette.accent, emissiveIntensity: 0.3 })}
      </mesh>
      <mesh position={[0, height * 0.4, depth / 2 + 0.005]}>
        <circleGeometry args={[Math.min(width, height) * 0.32, 32]} />
        {mat(palette.frame, { roughness: 0.5 })}
      </mesh>
      <mesh position={[0, height * 0.4, depth / 2 + 0.012]}>
        <circleGeometry args={[Math.min(width, height) * 0.26, 32]} />
        {mat(palette.glass, { opacity: 0.35, transparent: true, roughness: 0.08, metalness: 0.1 })}
      </mesh>
    </group>
  );
}

function Shower({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[width, 0.04, depth]} />
        {mat(palette.primary, { roughness: 0.4 })}
      </mesh>
      {/* Glass panels (two sides) */}
      <mesh position={[-width / 2 + 0.01, height / 2, 0]}>
        <boxGeometry args={[0.02, height, depth]} />
        {mat(palette.glass, { opacity: 0.35, transparent: true, roughness: 0.08, metalness: 0.1 })}
      </mesh>
      <mesh position={[0, height / 2, -depth / 2 + 0.01]}>
        <boxGeometry args={[width, height, 0.02]} />
        {mat(palette.glass, { opacity: 0.35, transparent: true, roughness: 0.08, metalness: 0.1 })}
      </mesh>
      {/* Showerhead */}
      <mesh position={[width * 0.32, height * 0.88, -depth * 0.42]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        {mat(palette.accent, { metalness: 0.8, roughness: 0.1 })}
      </mesh>
      <mesh position={[width * 0.32, height * 0.8, -depth * 0.38]} rotation={[Math.PI / 5, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.12, 12]} />
        {mat(palette.accent, { metalness: 0.8, roughness: 0.1 })}
      </mesh>
      {/* Drain */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.005, 16]} />
        {mat(palette.frame, { metalness: 0.7 })}
      </mesh>
    </group>
  );
}

function Monitor({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, 0.02, 0]}>
        <boxGeometry args={[width * 0.4, 0.02, depth]} />
        {mat(palette.frame, { metalness: 0.5 })}
      </mesh>
      <mesh castShadow position={[0, height * 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, height * 0.5, 8]} />
        {mat(palette.frame, { metalness: 0.5 })}
      </mesh>
      <mesh castShadow position={[0, height * 0.72, 0]}>
        <boxGeometry args={[width, height * 0.55, 0.04]} />
        {mat(palette.frame, { roughness: 0.35 })}
      </mesh>
      <mesh position={[0, height * 0.72, 0.022]}>
        <planeGeometry args={[width * 0.96, height * 0.5]} />
        {mat(palette.primary, { emissive: "#081018", emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.2 })}
      </mesh>
    </group>
  );
}

function Parasol({ width, depth, height, palette }: RecipeProps) {
  const canopyR = Math.max(width, depth) / 2;
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[canopyR * 0.4, canopyR * 0.45, 0.06, 16]} />
        {mat(palette.frame)}
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, height - 0.06, 12]} />
        {mat(palette.frame, { metalness: 0.5 })}
      </mesh>
      <mesh castShadow position={[0, height - 0.1, 0]}>
        <coneGeometry args={[canopyR, 0.35, 16, 1, true]} />
        {mat(palette.primary, { roughness: 0.85 })}
      </mesh>
    </group>
  );
}

function Grill({ width, depth, height, palette }: RecipeProps) {
  return (
    <group>
      <mesh castShadow position={[0, height * 0.4, 0]}>
        <boxGeometry args={[width, height * 0.6, depth]} />
        {mat(palette.primary, { metalness: 0.4 })}
      </mesh>
      <mesh castShadow position={[0, height * 0.85, 0]}>
        <sphereGeometry args={[Math.min(width, depth) / 2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {mat(palette.frame, { metalness: 0.5, roughness: 0.3 })}
      </mesh>
      <mesh position={[0, height * 0.95, depth / 2 + 0.01]}>
        <boxGeometry args={[width * 0.4, 0.04, 0.04]} />
        {mat(palette.accent, { metalness: 0.5 })}
      </mesh>
      <mesh position={[-width * 0.42, height * 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, height * 0.3, 8]} />
        {mat(palette.frame)}
      </mesh>
      <mesh position={[width * 0.42, height * 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, height * 0.3, 8]} />
        {mat(palette.frame)}
      </mesh>
    </group>
  );
}

/* ——— Dispatcher ——— */

export function ProceduralFurniture({
  kind,
  footprint,
  height,
  palette,
  selected
}: {
  kind: ProceduralKind;
  footprint: Vec2;
  height: number;
  palette: ProceduralPalette | undefined;
  selected: boolean;
}) {
  const resolved = useMemo(() => mergePalette(palette), [palette]);
  const tint = selected ? hoistSelection(resolved) : resolved;

  const props: RecipeProps = {
    width: footprint.x,
    depth: footprint.y,
    height,
    palette: tint
  };

  const content = (() => {
    switch (kind) {
      case "sofa":            return <Sofa {...props} />;
      case "armchair":        return <Armchair {...props} />;
      case "office-chair":    return <OfficeChair {...props} />;
      case "chair":           return <DiningChair {...props} />;
      case "stool":           return <Stool {...props} />;
      case "bar-stool":       return <BarStool {...props} />;
      case "bench":           return <Bench {...props} />;
      case "table":           return <Table {...props} />;
      case "desk":            return <Desk {...props} />;
      case "console":         return <Console {...props} />;
      case "bed":             return <Bed {...props} />;
      case "nightstand":      return <Nightstand {...props} />;
      case "dresser":         return <Dresser {...props} />;
      case "cabinet":         return <Cabinet {...props} />;
      case "bookshelf":       return <Bookshelf {...props} />;
      case "wardrobe":        return <Wardrobe {...props} />;
      case "filing-cabinet":  return <FilingCabinet {...props} />;
      case "media-console":   return <MediaConsole {...props} />;
      case "kitchen-island":  return <KitchenIsland {...props} />;
      case "fridge":          return <Fridge {...props} />;
      case "stove":           return <Stove {...props} />;
      case "microwave":       return <Microwave {...props} />;
      case "dishwasher":      return <Dishwasher {...props} />;
      case "range-hood":      return <RangeHood {...props} />;
      case "washing-machine": return <WashingMachine {...props} />;
      case "appliance":       return <Fridge {...props} />;
      case "basin":           return <Basin {...props} />;
      case "bathtub":         return <Bathtub {...props} />;
      case "shower":          return <Shower {...props} />;
      case "toilet":          return <Toilet {...props} />;
      case "lamp-floor":      return <LampFloor {...props} />;
      case "lamp-table":      return <LampTable {...props} />;
      case "pendant":         return <Pendant {...props} />;
      case "plant":           return <Plant {...props} />;
      case "rug":             return <Rug {...props} />;
      case "tv":              return <TV {...props} />;
      case "monitor":         return <Monitor {...props} />;
      case "parasol":         return <Parasol {...props} />;
      case "grill":           return <Grill {...props} />;
      case "door":            return <DoorStand {...props} />;
      case "window":          return <WindowStand {...props} />;
      default:                return <GenericBox {...props} />;
    }
  })();

  return (
    <group>
      {content}
      {selected ? <SelectionBox width={footprint.x} depth={footprint.y} height={height} /> : null}
    </group>
  );
}

function SelectionBox({ width, depth, height }: { width: number; depth: number; height: number }) {
  const geom = useMemo(() => {
    const box = new THREE.BoxGeometry(width + 0.05, height + 0.05, depth + 0.05);
    return new THREE.EdgesGeometry(box);
  }, [width, depth, height]);

  return (
    <lineSegments position={[0, height / 2, 0]} geometry={geom}>
      <lineBasicMaterial color="#e8b169" linewidth={1.5} />
    </lineSegments>
  );
}

function hoistSelection(p: Required<ProceduralPalette>): Required<ProceduralPalette> {
  return p;
}
