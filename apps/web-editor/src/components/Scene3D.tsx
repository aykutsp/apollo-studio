import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, OrbitControls, OrthographicCamera, PerspectiveCamera, TransformControls, useGLTF } from "@react-three/drei";
import { EffectComposer, N8AO, Bloom, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import { useCameraStore } from "../store/cameraStore";
import {
  getWallById,
  measureWallLength,
  openingCenterOnWall,
  type DoorEntity,
  type Entity,
  type ObjectEntity,
  type Scene,
  type WallEntity,
  type WindowEntity
} from "../../../../packages/core-domain/src";
import { ProceduralFurniture } from "../three/ProceduralFurniture";
import { IconCompass, IconEye, IconEyeOff, IconCamera } from "./Icon";

type Scene3DProps = {
  scene: Scene;
  entities: Entity[];
  selectedEntityId: string | null;
  background?: "studio" | "city" | "sunset" | "apartment" | "warehouse" | "dawn";
  onUpdateEntity?: (entity: Entity) => void;
};

type GizmoMode = "translate" | "rotate" | "scale";
type CameraMode = "perspective" | "orthographic";

const BACKGROUND_PRESETS: Record<NonNullable<Scene3DProps["background"]>, NonNullable<Scene3DProps["background"]>> = {
  studio: "studio",
  city: "city",
  sunset: "sunset",
  apartment: "apartment",
  warehouse: "warehouse",
  dawn: "dawn"
};

function CameraSync({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  useFrame(({ camera }) => {
    if (controlsRef.current) {
      useCameraStore.getState().setCam(
        camera.position.toArray() as [number, number, number],
        controlsRef.current.target.toArray() as [number, number, number]
      );
    }
  });
  return null;
}

function LightingRig({ sceneBounds, cameraDistance, useHighQuality }: { sceneBounds: any; cameraDistance: number; useHighQuality: boolean }) {
  const timeOfDay = useCameraStore((state) => state.timeOfDay);

  // Time ranges from 6.0 (6 AM) to 20.0 (8 PM).
  // Map timeOfDay to sun angle: 6 AM = 0 (horizon East), 13 = PI/2 (Zenith), 20 = PI (horizon West).
  const sunAngle = THREE.MathUtils.mapLinear(timeOfDay, 6, 20, 0, Math.PI);

  const sunX = sceneBounds.center.x + Math.cos(sunAngle) * 30;
  const sunY = Math.max(0.5, Math.sin(sunAngle) * 24);
  const sunZ = sceneBounds.center.z + 10;

  const isNight = timeOfDay < 7 || timeOfDay > 19;
  const isSunset = (timeOfDay >= 17 && timeOfDay <= 19) || (timeOfDay >= 6 && timeOfDay <= 8);

  const skyColor = isNight ? "#06080b" : isSunset ? "#1a1215" : "#0b0f15";
  const fogColor = isNight ? "#06080b" : isSunset ? "#2a1c1d" : "#0b0f15";
  const ambientColor = isNight ? "#2c3b59" : isSunset ? "#8a666e" : "#bcc6d8";
  const ambientIntensity = isNight ? 0.15 : isSunset ? 0.3 : 0.45;

  const sunColor = isNight ? "#4a689e" : isSunset ? "#ffab6e" : "#f6edd9";
  const sunIntensity = isNight ? 0.2 : isSunset ? 0.9 : 1.35;

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, cameraDistance * 0.8, cameraDistance * 3]} />

      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize-width={useHighQuality ? 4096 : 2048}
        shadow-mapSize-height={useHighQuality ? 4096 : 2048}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />

      {!isNight && (
        <>
          <directionalLight
            position={[sceneBounds.center.x - 10, 8, sceneBounds.center.z - 6]}
            intensity={0.25}
            color="#7f99c7"
          />
          <directionalLight
            position={[sceneBounds.center.x, 4, sceneBounds.center.z + 16]}
            intensity={0.15}
            color="#d8b880"
          />
        </>
      )}
    </>
  );
}

export function Scene3D({ scene, entities, selectedEntityId, background = "apartment", onUpdateEntity }: Scene3DProps) {
  const preset = BACKGROUND_PRESETS[background] ?? "apartment";
  const controlsRef = useRef<any>(null);
  const autoHideWalls = useCameraStore((state) => state.autoHideWalls);
  const setAutoHideWalls = useCameraStore((state) => state.setAutoHideWalls);
  const sceneBounds = useMemo(() => computeBounds(entities), [entities]);
  const sceneCenter = useMemo(() => new THREE.Vector3(sceneBounds.center.x, 1.2, sceneBounds.center.z), [sceneBounds]);
  const [showRoof, setShowRoof] = useState(false);
  const [useHighQuality, setUseHighQuality] = useState(false);
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>("translate");
  const [cameraMode, setCameraMode] = useState<CameraMode>("perspective");
  const timeOfDay = useCameraStore((state) => state.timeOfDay);
  const setTimeOfDay = useCameraStore((state) => state.setTimeOfDay);

  const cameraDistance = Math.max(12, sceneBounds.size * 1.3);
  const selectedObject = useMemo(
    () => entities.find((e): e is ObjectEntity => e.type === "object" && e.id === selectedEntityId) ?? null,
    [entities, selectedEntityId]
  );

  const takeSnapshot = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Apollo_Render_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="viewport">
      <div className="viewport-title">
        <span className="eyebrow">Model</span>
        <span className="title">Live 3D</span>
      </div>

      <div className="overlay overlay-top-left" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="badge" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <span style={{ fontSize: "10px", color: "var(--fg-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>Time</span>
          <input 
            type="range" 
            min="6" max="20" step="0.1" 
            value={timeOfDay} 
            onChange={(e) => setTimeOfDay(parseFloat(e.target.value))} 
            style={{ accentColor: "var(--accent)", width: 80 }}
          />
          <span style={{ fontSize: "11px", fontWeight: 600, width: 34 }}>{Math.floor(timeOfDay)}:{(timeOfDay % 1 * 60).toFixed(0).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="overlay overlay-top-right">
        <div className="viewport-badges">
          <button
            type="button"
            className="badge"
            style={{ cursor: "pointer", background: "var(--accent)", color: "#000", fontWeight: 600 }}
            onClick={takeSnapshot}
            title="Export High-Res Image"
          >
            <IconCamera size={12} />
            <span style={{ marginLeft: 4 }}>HD Export</span>
          </button>
          <button
            type="button"
            className="badge"
            style={{ cursor: "pointer" }}
            onClick={() => setAutoHideWalls(!autoHideWalls)}
            title="Auto-hide walls facing the camera"
            aria-pressed={autoHideWalls}
          >
            {autoHideWalls ? <IconEye size={12} /> : <IconEyeOff size={12} />}
            <span style={{ marginLeft: 4 }}>{autoHideWalls ? "X-ray walls" : "All walls"}</span>
          </button>
          <button
            type="button"
            className="badge"
            style={{ cursor: "pointer" }}
            onClick={() => setShowRoof((value) => !value)}
            title="Toggle roof / ceiling"
            aria-pressed={showRoof}
          >
            {showRoof ? "Roof on" : "Roof off"}
          </button>
          <button
            type="button"
            className={`badge ${useHighQuality ? "accent" : ""}`}
            style={{ cursor: "pointer", marginLeft: 8 }}
            onClick={() => setUseHighQuality((value) => !value)}
            title="Toggle high-quality GPU render (AO, Bloom, Antialiasing)"
            aria-pressed={useHighQuality}
          >
            <span>{useHighQuality ? "GPU Render ON" : "GPU Render OFF"}</span>
          </button>
          <button
            type="button"
            className="badge"
            style={{ cursor: "pointer" }}
            onClick={() => setCameraMode((v) => (v === "perspective" ? "orthographic" : "perspective"))}
            title="Toggle orthographic / perspective camera"
            aria-pressed={cameraMode === "orthographic"}
          >
            {cameraMode === "perspective" ? "Persp" : "Ortho"}
          </button>
          <span className="badge accent">{scene.unitSystem}</span>
        </div>
      </div>

      {selectedObject && onUpdateEntity ? (
        <div className="overlay overlay-bottom-left" style={{ left: 12, bottom: 60 }}>
          <div className="viewport-badges">
            <button
              type="button"
              className="badge"
              style={{ cursor: "pointer" }}
              aria-pressed={gizmoMode === "translate"}
              onClick={() => setGizmoMode("translate")}
              title="Translate gizmo (G)"
            >
              Move
            </button>
            <button
              type="button"
              className="badge"
              style={{ cursor: "pointer" }}
              aria-pressed={gizmoMode === "rotate"}
              onClick={() => setGizmoMode("rotate")}
              title="Rotate gizmo (R)"
            >
              Rotate
            </button>
            <button
              type="button"
              className="badge"
              style={{ cursor: "pointer" }}
              aria-pressed={gizmoMode === "scale"}
              onClick={() => setGizmoMode("scale")}
              title="Scale gizmo (S)"
            >
              Scale
            </button>
          </div>
        </div>
      ) : null}

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          preserveDrawingBuffer: true
        }}
      >
        <CameraSwap
          mode={cameraMode}
          position={[sceneBounds.center.x + cameraDistance * 0.6, cameraDistance * 0.7, sceneBounds.center.z + cameraDistance * 0.8]}
          orthoZoom={cameraDistance * 4}
        />
        <LightingRig sceneBounds={sceneBounds} cameraDistance={cameraDistance} useHighQuality={useHighQuality} />

        <Suspense fallback={null}>
          <Environment preset={preset as "apartment"} background={false} />
        </Suspense>

        <Grid
          args={[80, 80]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1c2332"
          sectionSize={2.5}
          sectionThickness={1.1}
          sectionColor="#2c374f"
          fadeDistance={cameraDistance * 2.4}
          fadeStrength={1.15}
          infiniteGrid
          followCamera={false}
          position={[sceneBounds.center.x, 0.002, sceneBounds.center.z]}
        />

        <Floor center={sceneBounds.center} size={80} />

        <ContactShadows
          position={[sceneBounds.center.x, 0.005, sceneBounds.center.z]}
          scale={sceneBounds.size * 3.5}
          far={12}
          blur={2.6}
          opacity={0.52}
          resolution={useHighQuality ? 2048 : 1024}
        />

        {entities.map((entity) => {
          if (entity.type === "wall") {
            const wallOpenings = entities.filter(
              (e): e is DoorEntity | WindowEntity =>
                (e.type === "door" || e.type === "window") && e.hostWallId === entity.id
            );
            return (
              <WallWithOpenings
                key={entity.id}
                wall={entity}
                openings={wallOpenings}
                selected={selectedEntityId === entity.id}
                sceneCenter={sceneCenter}
                autoHide={autoHideWalls}
              />
            );
          }
          if (entity.type === "object") {
            return <ObjectMesh key={entity.id} object={entity} selected={selectedEntityId === entity.id} />;
          }
          return (
            <OpeningPanel
              key={entity.id}
              opening={entity}
              wall={getWallById(scene, entity.hostWallId)}
              selected={selectedEntityId === entity.id}
            />
          );
        })}

        {showRoof ? <Roof entities={entities} sceneCenter={sceneCenter} /> : null}

        {useHighQuality ? (
          <EffectComposer>
            <N8AO aoRadius={0.4} intensity={2} halfRes />
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.5} />
            <SMAA />
          </EffectComposer>
        ) : null}

        <CameraSync controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[sceneBounds.center.x, 1.0, sceneBounds.center.z]}
          enableDamping
          dampingFactor={0.09}
          rotateSpeed={0.7}
          zoomSpeed={0.9}
          panSpeed={0.8}
          maxPolarAngle={Math.PI / 2.02}
          minDistance={2.5}
          maxDistance={cameraMode === "orthographic" ? 400 : 80}
        />

        {selectedObject && onUpdateEntity ? (
          <ObjectGizmo
            key={selectedObject.id}
            object={selectedObject}
            mode={gizmoMode}
            orbitRef={controlsRef}
            onCommit={(next) => onUpdateEntity(next)}
          />
        ) : null}
      </Canvas>

      <div className="overlay overlay-bottom-right">
        <div className="viewport-badges">
          <span className="badge">
            <IconCompass size={12} /> <span style={{ marginLeft: 4 }}>N↑</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function computeBounds(entities: Entity[]) {
  if (entities.length === 0) {
    return { center: { x: 6, z: 6 }, size: 12 };
  }
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
  for (const entity of entities) {
    if (entity.type === "wall") {
      xMin = Math.min(xMin, entity.start.x, entity.end.x);
      xMax = Math.max(xMax, entity.start.x, entity.end.x);
      zMin = Math.min(zMin, entity.start.y, entity.end.y);
      zMax = Math.max(zMax, entity.start.y, entity.end.y);
    }
    if (entity.type === "object") {
      xMin = Math.min(xMin, entity.position.x - entity.footprint.x / 2);
      xMax = Math.max(xMax, entity.position.x + entity.footprint.x / 2);
      zMin = Math.min(zMin, entity.position.z - entity.footprint.y / 2);
      zMax = Math.max(zMax, entity.position.z + entity.footprint.y / 2);
    }
  }
  if (!isFinite(xMin)) {
    return { center: { x: 6, z: 6 }, size: 12 };
  }
  return {
    center: { x: (xMin + xMax) / 2, z: (zMin + zMax) / 2 },
    size: Math.max(xMax - xMin, zMax - zMin, 4)
  };
}

function CameraSwap({ mode, position, orthoZoom }: { mode: CameraMode; position: [number, number, number]; orthoZoom: number }) {
  if (mode === "orthographic") {
    return (
      <OrthographicCamera makeDefault position={position} zoom={orthoZoom} near={0.1} far={400} />
    );
  }
  return <PerspectiveCamera makeDefault position={position} fov={38} near={0.1} far={400} />;
}

type ObjectGizmoProps = {
  object: ObjectEntity;
  mode: GizmoMode;
  orbitRef: React.MutableRefObject<any>;
  onCommit: (entity: ObjectEntity) => void;
};

function ObjectGizmo({ object, mode, orbitRef, onCommit }: ObjectGizmoProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: r3fScene } = useThree();
  const [target, setTarget] = useState<THREE.Object3D | null>(null);

  // Create an invisible proxy object that TransformControls attaches to.
  useEffect(() => {
    const proxy = new THREE.Object3D();
    proxy.position.set(object.position.x, object.position.y, object.position.z);
    proxy.rotation.set(
      THREE.MathUtils.degToRad(object.rotation.x),
      THREE.MathUtils.degToRad(-object.rotation.y),
      THREE.MathUtils.degToRad(object.rotation.z)
    );
    proxy.scale.set(object.scale.x, object.scale.y, object.scale.z);
    r3fScene.add(proxy);
    setTarget(proxy);
    return () => {
      r3fScene.remove(proxy);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object.id]);

  // Sync proxy when the entity updates externally (e.g., from the Inspector).
  useEffect(() => {
    if (!target) return;
    target.position.set(object.position.x, object.position.y, object.position.z);
    target.rotation.set(
      THREE.MathUtils.degToRad(object.rotation.x),
      THREE.MathUtils.degToRad(-object.rotation.y),
      THREE.MathUtils.degToRad(object.rotation.z)
    );
    target.scale.set(object.scale.x, object.scale.y, object.scale.z);
  }, [target, object.position.x, object.position.y, object.position.z, object.rotation.x, object.rotation.y, object.rotation.z, object.scale.x, object.scale.y, object.scale.z]);

  const handleDraggingChanged = (e: THREE.Event) => {
    const dragging = (e as unknown as { value: boolean }).value;
    if (orbitRef.current) {
      orbitRef.current.enabled = !dragging;
    }
    if (!dragging && target) {
      onCommit({
        ...object,
        position: {
          x: roundOne(target.position.x),
          y: roundOne(target.position.y),
          z: roundOne(target.position.z)
        },
        rotation: {
          x: roundOne(THREE.MathUtils.radToDeg(target.rotation.x)),
          y: roundOne(-THREE.MathUtils.radToDeg(target.rotation.y)),
          z: roundOne(THREE.MathUtils.radToDeg(target.rotation.z))
        },
        scale: {
          x: roundOne(target.scale.x),
          y: roundOne(target.scale.y),
          z: roundOne(target.scale.z)
        }
      });
    }
  };

  if (!target) return null;

  return (
    <TransformControls
      object={target}
      mode={mode}
      size={0.75}
      onMouseUp={() => {
        if (target) {
          onCommit({
            ...object,
            position: {
              x: roundOne(target.position.x),
              y: roundOne(target.position.y),
              z: roundOne(target.position.z)
            },
            rotation: {
              x: roundOne(THREE.MathUtils.radToDeg(target.rotation.x)),
              y: roundOne(-THREE.MathUtils.radToDeg(target.rotation.y)),
              z: roundOne(THREE.MathUtils.radToDeg(target.rotation.z))
            },
            scale: {
              x: roundOne(target.scale.x),
              y: roundOne(target.scale.y),
              z: roundOne(target.scale.z)
            }
          });
        }
      }}
      onChange={(e) => {
        // Disable orbit during drag, re-enable on release.
        const ctl = (e?.target as unknown as { dragging?: boolean } | undefined)?.dragging;
        if (orbitRef.current && typeof ctl === "boolean") {
          orbitRef.current.enabled = !ctl;
        }
      }}
    />
  );
  void handleDraggingChanged;
  void groupRef;
}

function roundOne(value: number): number {
  return Math.round(value * 100) / 100;
}

function Floor({ center, size }: { center: { x: number; z: number }; size: number }) {
  const geom = useMemo(() => new THREE.PlaneGeometry(size, size), [size]);
  return (
    <mesh geometry={geom} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[center.x, 0, center.z]}>
      <meshStandardMaterial color="#141820" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

/* ————————————————————————————————————
 * Walls — rendered as segments around their hosted openings.
 * Each opening cuts a real gap in the wall: pillars left/right,
 * lintel above, sill below for windows. No CSG needed.
 * ———————————————————————————————————— */

const DEFAULT_WALL_COLOR = "#dadde4";
const WALL_SEGMENT_MARGIN = 0.005; // meters, avoids razor-thin pillars

type WallWithOpeningsProps = {
  wall: WallEntity;
  openings: (DoorEntity | WindowEntity)[];
  selected: boolean;
  sceneCenter: THREE.Vector3;
  autoHide: boolean;
};

type WallSegment = {
  start: number; // offset along wall (0..length)
  end: number;
  bottom: number; // Y lower bound
  top: number;    // Y upper bound
};

function WallWithOpenings({ wall, openings, selected, sceneCenter, autoHide }: WallWithOpeningsProps) {
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const length = measureWallLength(wall) || 1;
  const centerX = (wall.start.x + wall.end.x) / 2;
  const centerZ = (wall.start.y + wall.end.y) / 2;
  const angle = Math.atan2(dy, dx);

  const wallMid = useMemo(() => new THREE.Vector3(centerX, wall.height / 2, centerZ), [centerX, wall.height, centerZ]);

  const segments = useMemo(
    () => buildWallSegments(wall, openings, length),
    [wall, openings, length]
  );

  const color = selected ? "#e8b169" : wall.color ?? DEFAULT_WALL_COLOR;

  return (
    <group>
      {segments.map((segment, index) => (
        <WallSegmentMesh
          key={`${wall.id}-seg-${index}`}
          wall={wall}
          segment={segment}
          color={color}
          angle={angle}
          length={length}
          wallMid={wallMid}
          autoHide={autoHide && !selected}
          dx={dx}
          dy={dy}
        />
      ))}
    </group>
  );
}

function WallSegmentMesh({
  wall,
  segment,
  color,
  angle,
  length,
  wallMid,
  autoHide,
  dx,
  dy
}: {
  wall: WallEntity;
  segment: WallSegment;
  color: string;
  angle: number;
  length: number;
  wallMid: THREE.Vector3;
  autoHide: boolean;
  dx: number;
  dy: number;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const segLength = Math.max(0.001, segment.end - segment.start);
  const segHeight = Math.max(0.001, segment.top - segment.bottom);
  const midOffset = (segment.start + segment.end) / 2;
  const midY = (segment.bottom + segment.top) / 2;
  const center = openingCenterOnWall(wall, THREE.MathUtils.clamp(midOffset, 0, length));

  useFrame(({ camera }) => {
    if (!materialRef.current) return;
    if (!autoHide) {
      const target = 1;
      const current = materialRef.current.opacity;
      const next = THREE.MathUtils.lerp(current, target, 0.18);
      materialRef.current.opacity = next;
      materialRef.current.transparent = next < 0.985;
      materialRef.current.depthWrite = next > 0.95;
      return;
    }

    const currentState = useCameraStore.getState();
    const targetVec = new THREE.Vector3().fromArray(currentState.target);

    // Dynamic wall normal (points toward target)
    const dir = new THREE.Vector3(dx, 0, dy).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(up, dir).normalize();
    const toTarget = new THREE.Vector3().subVectors(targetVec, wallMid);
    if (normal.dot(toTarget) < 0) normal.negate();

    const toCam = new THREE.Vector3().subVectors(camera.position, wallMid).normalize();
    const facing = normal.dot(toCam);
    let targetOpacity = facing > 0.15 ? 1 : facing < -0.05 ? 0.08 : THREE.MathUtils.mapLinear(facing, -0.05, 0.15, 0.08, 1);

    // If wall is behind the target from camera's perspective, don't hide it
    const distToWall = camera.position.distanceTo(wallMid);
    const distToTarget = camera.position.distanceTo(targetVec);
    if (distToWall > distToTarget + 0.5) {
      targetOpacity = 1;
    }

    const current = materialRef.current.opacity;
    const next = THREE.MathUtils.lerp(current, targetOpacity, 0.18);
    materialRef.current.opacity = next;
    materialRef.current.transparent = next < 0.985;
    materialRef.current.depthWrite = next > 0.95;
  });

  return (
    <mesh
      position={[center.x, midY, center.y]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[segLength, segHeight, wall.thickness]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  );
}

function buildWallSegments(
  wall: WallEntity,
  openings: (DoorEntity | WindowEntity)[],
  length: number
): WallSegment[] {
  const fullHeight = wall.height;

  if (openings.length === 0) {
    return [{ start: 0, end: length, bottom: 0, top: fullHeight }];
  }

  // Clip + sort openings to live strictly inside the wall length.
  const clamped = openings
    .map((opening) => {
      const w = Math.max(0, opening.width);
      const sillH = opening.type === "window" ? Math.max(0, opening.sillHeight) : 0;
      const topH = Math.min(fullHeight, sillH + Math.max(0, opening.height));
      const cStart = Math.max(0, Math.min(length, opening.offsetAlongWall - w / 2));
      const cEnd = Math.max(0, Math.min(length, opening.offsetAlongWall + w / 2));
      return {
        start: cStart,
        end: cEnd,
        sill: sillH,
        top: topH,
        type: opening.type
      };
    })
    .filter((c) => c.end - c.start > WALL_SEGMENT_MARGIN)
    .sort((a, b) => a.start - b.start);

  // Merge overlapping openings (a conservative choice — shows the union).
  const merged: typeof clamped = [];
  for (const c of clamped) {
    const last = merged[merged.length - 1];
    if (last && c.start <= last.end + WALL_SEGMENT_MARGIN) {
      last.end = Math.max(last.end, c.end);
      last.sill = Math.min(last.sill, c.sill);
      last.top = Math.max(last.top, c.top);
    } else {
      merged.push({ ...c });
    }
  }

  const segments: WallSegment[] = [];
  let cursor = 0;

  for (const opening of merged) {
    const pillarStart = cursor;
    const pillarEnd = opening.start - WALL_SEGMENT_MARGIN;

    // Pillar before this opening (full height)
    if (pillarEnd - pillarStart > WALL_SEGMENT_MARGIN) {
      segments.push({ start: pillarStart, end: pillarEnd, bottom: 0, top: fullHeight });
    }

    // Sill (only for windows — sill > 0)
    if (opening.sill > WALL_SEGMENT_MARGIN) {
      segments.push({
        start: opening.start + WALL_SEGMENT_MARGIN,
        end: opening.end - WALL_SEGMENT_MARGIN,
        bottom: 0,
        top: opening.sill
      });
    }

    // Lintel (above opening, if there is any wall left above it)
    if (fullHeight - opening.top > WALL_SEGMENT_MARGIN) {
      segments.push({
        start: opening.start + WALL_SEGMENT_MARGIN,
        end: opening.end - WALL_SEGMENT_MARGIN,
        bottom: opening.top,
        top: fullHeight
      });
    }

    cursor = opening.end + WALL_SEGMENT_MARGIN;
  }

  if (length - cursor > WALL_SEGMENT_MARGIN) {
    segments.push({ start: cursor, end: length, bottom: 0, top: fullHeight });
  }

  return segments;
}

function ObjectMesh({ object, selected }: { object: ObjectEntity; selected: boolean }) {
  const kind = object.procedural?.kind ?? "generic-box";
  const width = object.footprint.x * object.scale.x;
  const depth = object.footprint.y * object.scale.z;
  const height = object.height * object.scale.y;

  return (
    <group
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[
        THREE.MathUtils.degToRad(object.rotation.x),
        THREE.MathUtils.degToRad(-object.rotation.y),
        THREE.MathUtils.degToRad(object.rotation.z)
      ]}
    >
      {object.modelUrl && object.modelUrl.trim() !== "" ? (
        <Suspense fallback={<ProceduralFurniture kind="generic-box" footprint={{x: width, y: depth}} height={height} palette={undefined} selected={selected} />}>
          <ExternalModel url={object.modelUrl} selected={selected} footprint={{ x: width, y: depth }} height={height} />
        </Suspense>
      ) : (
        <ProceduralFurniture
          kind={kind}
          footprint={{ x: width, y: depth }}
          height={height}
          palette={object.procedural?.palette}
          selected={selected}
        />
      )}
    </group>
  );
}

function ExternalModel({ url, selected, footprint, height }: { url: string; selected: boolean; footprint: {x: number, y: number}; height: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone();
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  // Center & auto-scale to fit within footprint/height
  useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    // Avoid division by zero
    const sX = size.x || 1;
    const sY = size.y || 1;
    const sZ = size.z || 1;
    
    const scaleX = footprint.x / sX;
    const scaleY = height / sY;
    const scaleZ = footprint.y / sZ;
    const uniformScale = Math.min(scaleX, Math.min(scaleY, scaleZ));
    
    cloned.scale.set(uniformScale, uniformScale, uniformScale);
    
    // Bottom-center align
    const center = box.getCenter(new THREE.Vector3());
    const bottomY = box.min.y;
    cloned.position.set(-center.x * uniformScale, -bottomY * uniformScale, -center.z * uniformScale);
  }, [cloned, footprint, height]);

  return (
    <group>
      <primitive object={cloned} />
      {selected ? (
        <lineSegments position={[0, height / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(footprint.x + 0.04, height + 0.04, footprint.y + 0.04)]} />
          <lineBasicMaterial color="#e8b169" />
        </lineSegments>
      ) : null}
    </group>
  );
}

function OpeningPanel({
  opening,
  wall,
  selected
}: {
  opening: DoorEntity | WindowEntity;
  wall: WallEntity | null;
  selected: boolean;
}) {
  if (!wall) return null;

  const center = openingCenterOnWall(wall, opening.offsetAlongWall);
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const angle = Math.atan2(dy, dx);
  const baseHeight = opening.type === "door" ? 0 : opening.sillHeight;

  const frameDepth = Math.min(wall.thickness * 0.95, 0.2);
  const frameT = 0.04; // frame thickness
  const panelDepth = 0.04;

  const isDoor = opening.type === "door";
  const leafColor = isDoor ? "#6e4e2a" : "#b8d5db";
  const frameColor = "#2a1e16";

  return (
    <group position={[center.x, baseHeight, center.y]} rotation={[0, -angle, 0]}>
      {/* Frame — four bars around the opening perimeter */}
      {/* Top */}
      <mesh castShadow position={[0, opening.height - frameT / 2, 0]}>
        <boxGeometry args={[opening.width, frameT, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* Bottom — threshold for doors, sill for windows (internal) */}
      <mesh castShadow position={[0, frameT / 2, 0]}>
        <boxGeometry args={[opening.width, frameT, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* Left jamb */}
      <mesh castShadow position={[-opening.width / 2 + frameT / 2, opening.height / 2, 0]}>
        <boxGeometry args={[frameT, opening.height - frameT * 2, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>
      {/* Right jamb */}
      <mesh castShadow position={[opening.width / 2 - frameT / 2, opening.height / 2, 0]}>
        <boxGeometry args={[frameT, opening.height - frameT * 2, frameDepth]} />
        <meshStandardMaterial color={frameColor} roughness={0.7} />
      </mesh>

      {/* Leaf / glass panel, inset slightly inside the frame */}
      <mesh castShadow position={[0, opening.height / 2, 0]}>
        <boxGeometry args={[opening.width - frameT * 2, opening.height - frameT * 2, panelDepth]} />
        <meshStandardMaterial
          color={leafColor}
          roughness={isDoor ? 0.55 : 0.05}
          metalness={isDoor ? 0 : 0.2}
          transparent={!isDoor}
          opacity={isDoor ? 1 : 0.42}
        />
      </mesh>

      {/* Window muntin cross */}
      {!isDoor ? (
        <>
          <mesh position={[0, opening.height / 2, 0]}>
            <boxGeometry args={[frameT * 0.6, opening.height - frameT * 2, panelDepth * 1.1]} />
            <meshStandardMaterial color={frameColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, opening.height / 2, 0]}>
            <boxGeometry args={[opening.width - frameT * 2, frameT * 0.6, panelDepth * 1.1]} />
            <meshStandardMaterial color={frameColor} roughness={0.7} />
          </mesh>
        </>
      ) : null}

      {/* Door handle */}
      {isDoor ? (
        <mesh position={[opening.width * 0.38, opening.height / 2, frameDepth / 2 + 0.015]}>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color="#c29a4a" metalness={0.8} roughness={0.18} />
        </mesh>
      ) : null}

      {selected ? (
        <lineSegments position={[0, opening.height / 2, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(opening.width + 0.06, opening.height + 0.06, frameDepth + 0.04)]} />
          <lineBasicMaterial color="#e8b169" />
        </lineSegments>
      ) : null}
    </group>
  );
}

/* ————————————————————————————————————
 * Optional roof — draws a flat translucent ceiling over room extents.
 * ———————————————————————————————————— */

function Roof({ entities, sceneCenter }: { entities: Entity[]; sceneCenter: THREE.Vector3 }) {
  const bounds = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
    let maxH = 2.7;
    for (const entity of entities) {
      if (entity.type === "wall") {
        xMin = Math.min(xMin, entity.start.x, entity.end.x);
        xMax = Math.max(xMax, entity.start.x, entity.end.x);
        zMin = Math.min(zMin, entity.start.y, entity.end.y);
        zMax = Math.max(zMax, entity.start.y, entity.end.y);
        maxH = Math.max(maxH, entity.height);
      }
    }
    if (!isFinite(xMin)) return null;
    return { xMin, xMax, zMin, zMax, height: maxH };
  }, [entities]);

  if (!bounds) return null;
  const cx = (bounds.xMin + bounds.xMax) / 2;
  const cz = (bounds.zMin + bounds.zMax) / 2;
  void sceneCenter;

  return (
    <mesh position={[cx, bounds.height + 0.02, cz]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[bounds.xMax - bounds.xMin + 0.4, bounds.zMax - bounds.zMin + 0.4]} />
      <meshStandardMaterial color="#dfe3ea" roughness={0.95} transparent opacity={0.32} />
    </mesh>
  );
}
