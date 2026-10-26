import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { CanvasTexture, Color, SRGBColorSpace, Vector3 } from "three";
import type { ChartGlyph, ChartRow } from "../data/chart";
import { drawGlyph, drawLabel, GLYPH_FONT } from "./glyphArt";
import { layoutChart } from "./layout";
import type { PlacedGlyph, PlacedSlat } from "./layout";
import Phoropter, { phoropterWidth } from "./Phoropter";
import type { LensDial } from "./Phoropter";

export interface ChartSceneProps {
  rows: ChartRow[];
  activeId: string | null;
  reduced: boolean;
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
  dials: LensDial[];
  onToggleLens: (id: string) => void;
}

interface Extent {
  top: number;
  bottom: number;
  width: number;
  depth: number;
}

const ROOM = "#0e1822";
const PANEL = "#f6fbff";
const SKY = "#6bb4ee";
const FOV = 38;
const PANEL_FAR = new Color("#a9bccd");
const PANEL_NEAR = new Color(PANEL);

function useFontReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const fonts = document.fonts;
    if (!fonts) {
      Promise.resolve().then(() => live && setReady(true));
      return;
    }
    Promise.all([
      fonts.load(`700 120px ${GLYPH_FONT}`),
      fonts.load(`500 40px ${GLYPH_FONT}`),
    ])
      .catch(() => undefined)
      .then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

function makeTexture(paint: (c: HTMLCanvasElement) => void, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paint(canvas);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function Glyph({
  glyph,
  place,
  active,
  onActive,
  onOpen,
}: {
  glyph: ChartGlyph;
  place: PlacedGlyph;
  active: boolean;
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const texture = useMemo(
    () => makeTexture((c) => drawGlyph(c, glyph.glyph, glyph.state, active), 256, 256),
    [glyph.glyph, glyph.state, active],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    onActive(glyph.id);
  };
  const out = () => {
    document.body.style.cursor = "";
    onActive(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "";
    onOpen(glyph.id);
  };

  return (
    <mesh
      position={[place.x, place.y, place.z]}
      scale={active ? 1.08 : 1}
      onPointerOver={over}
      onPointerOut={out}
      onClick={click}
    >
      <planeGeometry args={[place.size, place.size]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} fog={false} />
    </mesh>
  );
}

function Slat({ slat, shade }: { slat: PlacedSlat; shade: number }) {
  const face = useMemo(() => PANEL_NEAR.clone().lerp(PANEL_FAR, shade), [shade]);
  const label = useMemo(
    () => makeTexture((c) => drawLabel(c, slat.fraction, SKY), 256, 64),
    [slat.fraction],
  );
  useEffect(() => () => label.dispose(), [label]);
  const labelH = Math.max(0.16, slat.height * 0.2);
  return (
    <group position={[0, slat.y, slat.z]}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[slat.width + 0.08, slat.height + 0.08, 0.1]} />
        <meshStandardMaterial color="#1f3347" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[slat.width, slat.height]} />
        <meshBasicMaterial color={face} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[-slat.width / 2 - labelH * 2.2, 0, 0]}>
        <planeGeometry args={[labelH * 4, labelH]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

function Rig({ layout, reduced }: { layout: Extent; reduced: boolean }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const born = useRef<number | null>(null);
  const aim = useMemo(() => new Vector3(), []);
  const goal = useMemo(() => new Vector3(), []);

  const frame = useMemo(() => {
    const height = layout.top - layout.bottom + 0.6;
    const width = layout.width + 1.8;
    const aspect = size.width / Math.max(1, size.height);
    const fit = Math.max(height, width / aspect);
    const distance = (fit / 2 / Math.tan((FOV * Math.PI) / 360)) * 1.04;
    const centerY = (layout.top + layout.bottom) / 2;
    const centerZ = -layout.depth / 2;
    return { distance, centerY, centerZ };
  }, [layout, size.width, size.height]);

  useEffect(() => {
    if (!reduced) return;
    camera.position.set(0, frame.centerY, frame.distance);
    camera.lookAt(0, frame.centerY, frame.centerZ);
    invalidate();
  }, [reduced, camera, frame, invalidate]);

  useFrame((state) => {
    if (reduced) return;
    if (born.current === null) born.current = state.clock.elapsedTime;
    const t = Math.min(1, (state.clock.elapsedTime - born.current) / 1.8);
    const ease = 1 - (1 - t) ** 3;
    const px = state.pointer.x;
    const py = state.pointer.y;
    goal.set(
      px * 1.1 * ease,
      frame.centerY + 0.8 + py * 0.45 * ease,
      frame.distance + (1 - ease) * 3.2,
    );
    camera.position.lerp(goal, t < 1 ? 1 : 0.05);
    aim.set(px * 0.2, frame.centerY - 0.15, frame.centerZ);
    camera.lookAt(aim);
  });

  return null;
}

function Room({ layout }: { layout: Extent }) {
  return (
    <>
      <color attach="background" args={[ROOM]} />
      <fog attach="fog" args={[ROOM, 7, 20]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, layout.top, 1.2]} intensity={10} color={PANEL} distance={10} />
      <pointLight
        position={[0, layout.bottom + 0.3, 0.6]}
        intensity={8}
        color={PANEL}
        distance={6}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, layout.bottom - 0.1, -2]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a2b3c" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, -layout.depth - 2.5]}>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#15263a" roughness={0.9} />
      </mesh>
    </>
  );
}

export default function ChartScene({
  rows,
  activeId,
  reduced,
  onActive,
  onOpen,
  dials,
  onToggleLens,
}: ChartSceneProps) {
  const fontReady = useFontReady();
  const layout = useMemo(() => layoutChart(rows, reduced), [rows, reduced]);
  const byId = useMemo(() => {
    const map = new Map<string, ChartGlyph>();
    rows.forEach((r) => r.glyphs.forEach((g) => map.set(g.id, g)));
    return map;
  }, [rows]);
  const phoropterY = layout.bottom - 0.75;
  const extent: Extent = useMemo(
    () => ({
      top: layout.top,
      bottom: dials.length > 0 ? phoropterY - 1.5 : layout.bottom,
      width: Math.max(layout.width, dials.length > 0 ? phoropterWidth(dials.length) : 0),
      depth: layout.depth,
    }),
    [layout, dials.length, phoropterY],
  );
  const rowsBack = Math.max(1, layout.slats.length - 1);

  useEffect(() => () => {
    document.body.style.cursor = "";
  }, []);

  return (
    <Canvas
      className="chart-canvas"
      data-testid="chart-canvas"
      dpr={[1, 2]}
      frameloop={reduced ? "demand" : "always"}
      camera={{ fov: FOV, position: [0, 0, 10], near: 0.1, far: 60 }}
      onPointerMissed={() => onActive(null)}
    >
      <Room layout={extent} />
      <Rig layout={extent} reduced={reduced} />
      {fontReady && (
        <group key="chart">
          {layout.slats.map((s, i) => (
            <Slat key={s.fraction + s.y} slat={s} shade={reduced ? 0 : (i / rowsBack) * 0.55} />
          ))}
          {layout.glyphs.map((p) => {
            const g = byId.get(p.id);
            return g ? (
              <Glyph
                key={p.id}
                glyph={g}
                place={p}
                active={activeId === p.id}
                onActive={onActive}
                onOpen={onOpen}
              />
            ) : null;
          })}
          {dials.length > 0 && (
            <Phoropter
              dials={dials}
              y={phoropterY}
              reduced={reduced}
              activeId={activeId}
              onToggle={onToggleLens}
              onActive={onActive}
            />
          )}
        </group>
      )}
    </Canvas>
  );
}
