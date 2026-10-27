import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  Color,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Points } from "three";

type SharedRef = MutableRefObject<Shared>;
import type { ChartGlyph, ChartRow } from "../data/chart";
import { backOut, clamp01, focusAt, introDone, lampAt, landAt } from "../core/intro";
import type { IntroClock, IntroMode } from "../core/intro";
import {
  ACCENT,
  drawGlyph,
  drawGrain,
  drawHatch,
  GLYPH_FONT,
  INK,
  LAMP_INK,
  PANEL,
  SKY,
} from "./glyphArt";
import { layoutChart } from "./layout";
import type { PlacedGlyph, PlacedSlat, ScreenBox } from "./layout";
import Phoropter, { phoropterWidth } from "./Phoropter";
import type { LensDial } from "./Phoropter";

export interface ChartSceneProps {
  rows: ChartRow[];
  activeId: string | null;
  still: boolean;
  frozen: boolean;
  intro: IntroMode;
  skipAt: number | null;
  shift: number;
  pulse: { id: string; at: number } | null;
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
  onReady: () => void;
  onPlaced: (boxes: Record<string, ScreenBox>) => void;
  dials: LensDial[];
  onToggleLens: (id: string) => void;
}

interface Extent {
  top: number;
  bottom: number;
  width: number;
  depth: number;
}

interface Shared {
  clock: IntroClock;
  born: number | null;
  still: boolean;
  dolly: { to: Vector3; at: number; id: string } | null;
  pulse: { id: string; at: number } | null;
}

const PULSE_MS = 520;

const FOV = 38;
const DUST = 60;
const ROW_DIM = new Color(PANEL).multiplyScalar(0.85);

function now(): number {
  return performance.now();
}

function texture(paint: (c: HTMLCanvasElement) => void, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paint(canvas);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function useFontReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const fonts = document.fonts;
    const done = () => {
      if (live) setReady(true);
    };
    if (!fonts) {
      Promise.resolve().then(done);
    } else {
      Promise.all([fonts.load(`700 120px ${GLYPH_FONT}`), fonts.load(`500 40px ${GLYPH_FONT}`)])
        .catch(() => undefined)
        .then(done);
    }
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

const VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = `
uniform sampler2D map;
uniform float uFocus;
uniform float uGhost;
uniform float uLight;
varying vec2 vUv;
void main() {
  float bias = uFocus * 5.0;
  vec4 a = texture2D(map, vUv, bias);
  vec4 g = texture2D(map, vUv + vec2(uGhost * 0.05, 0.0), bias);
  float ga = g.a * 0.42 * step(0.001, uGhost);
  float alpha = max(a.a, ga);
  vec3 col = a.a >= ga ? a.rgb : g.rgb;
  gl_FragColor = vec4(col * uLight, alpha);
}
`;

function Glyph({
  glyph,
  place,
  row,
  active,
  sharedRef,
  onActive,
  onOpen,
  hatchMap,
}: {
  glyph: ChartGlyph;
  place: PlacedGlyph;
  row: number;
  active: boolean;
  sharedRef: SharedRef;
  onActive: (id: string | null) => void;
  onOpen: (id: string) => void;
  hatchMap: CanvasTexture;
}) {
  const s = place.size;
  const map = useMemo(() => texture((c) => drawGlyph(c, glyph.glyph), 256, 256), [glyph.glyph]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          map: { value: map },
          uFocus: { value: 0 },
          uGhost: { value: 0 },
          uLight: { value: 1 },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        toneMapped: false,
      }),
    [map],
  );
  useEffect(
    () => () => {
      map.dispose();
      material.dispose();
    },
    [map, material],
  );

  const face = useRef<Mesh>(null);
  const bar = useRef<Group>(null);
  const slash = useRef<Group>(null);
  const hatch = useRef<Mesh>(null);
  const tick = useRef<Group>(null);
  const body = useRef<Group>(null);
  const ghostRef = useRef({ v: 0, vel: 0 });
  const invalidate = useThree((st) => st.invalidate);
  const ticked = glyph.state === "read" && glyph.lens === "on";

  useFrame(() => {
    const t = sharedRef.current.born === null ? 0 : now() - sharedRef.current.born;
    const { clock } = sharedRef.current;
    const mat = face.current?.material as ShaderMaterial | undefined;
    if (!mat) return;
    const u = mat.uniforms;
    u.uFocus!.value = focusAt(clock, t, row);
    u.uLight!.value = lampAt(clock, t);
    const pulse = sharedRef.current.pulse;
    const pulsing = pulse !== null && pulse.id === glyph.id && now() - pulse.at < PULSE_MS;
    const land = (ms: number) => (pulsing ? backOut(clamp01((now() - pulse.at) / ms)) : landAt(clock, t, row, ms));
    if (pulsing) invalidate();

    const ghost = ghostRef.current;
    if (glyph.state === "misread") {
      ghost.v = backOut(landAt(clock, t, row, 420));
      ghost.vel = 0;
      if (slash.current) slash.current.scale.x = Math.max(0.0001, land(300));
    } else if (sharedRef.current.still || (Math.abs(ghost.v) < 0.002 && Math.abs(ghost.vel) < 0.002)) {
      ghost.v = 0;
      ghost.vel = 0;
    } else {
      const dt = 1 / 30;
      ghost.vel += (-170 * ghost.v - 14 * ghost.vel) * dt;
      ghost.v += ghost.vel * dt;
    }
    u.uGhost!.value = Math.abs(ghost.v);
    if (glyph.state === "read") {
      const k = land(500);
      if (bar.current) bar.current.scale.x = Math.max(0.0001, k);
      if (tick.current) tick.current.scale.setScalar(Math.max(0.0001, k));
    }
    if (glyph.state === "blocked" && hatch.current) {
      const k = land(300);
      hatch.current.scale.x = Math.max(0.0001, k);
      hatch.current.position.x = -(1 - k) * s * 0.6;
    }
    if (body.current) {
      const target = active ? 1.015 : 1;
      const cur = body.current.scale.x;
      body.current.scale.setScalar(sharedRef.current.still ? target : cur + (target - cur) * 0.25);
    }
  });

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
    <group position={[place.x, place.y, place.z]}>
      <group ref={body}>
        <mesh ref={face} material={material} onPointerOver={over} onPointerOut={out} onClick={click}>
          <planeGeometry args={[s, s]} />
        </mesh>
        {glyph.state === "read" && !ticked && (
          <group ref={bar} position={[0, -s * 0.46, 0.004]} scale={[0.0001, 1, 1]}>
            <mesh>
              <planeGeometry args={[s * 0.5, s * 0.035]} />
              <meshBasicMaterial color={LAMP_INK} toneMapped={false} fog={false} />
            </mesh>
          </group>
        )}
        {ticked && (
          <group ref={tick} position={[s * 0.02, -s * 0.02, 0.006]} scale={0.0001}>
            <mesh rotation={[0, 0, 0.8]} position={[-s * 0.16, -s * 0.1, 0]}>
              <planeGeometry args={[s * 0.42, s * 0.09]} />
              <meshBasicMaterial color={SKY} toneMapped={false} fog={false} />
            </mesh>
            <mesh rotation={[0, 0, -0.75]} position={[s * 0.14, 0, 0.001]}>
              <planeGeometry args={[s * 0.72, s * 0.09]} />
              <meshBasicMaterial color={SKY} toneMapped={false} fog={false} />
            </mesh>
          </group>
        )}
        {glyph.state === "misread" && (
          <group rotation={[0, 0, 0.62]} position={[0, 0, 0.006]}>
            <group ref={slash} scale={[0.0001, 1, 1]}>
              <mesh>
                <planeGeometry args={[s * 1.08, s * 0.095]} />
                <meshBasicMaterial color={INK} toneMapped={false} fog={false} />
              </mesh>
              <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[s * 1.05, s * 0.06]} />
                <meshBasicMaterial color={ACCENT} toneMapped={false} fog={false} />
              </mesh>
            </group>
          </group>
        )}
        {glyph.state === "blocked" && (
          <mesh ref={hatch} position={[0, 0, 0.005]} scale={[0.0001, 1, 1]}>
            <planeGeometry args={[s * 1.2, s * 1.2]} />
            <meshBasicMaterial map={hatchMap} transparent toneMapped={false} fog={false} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Slat({
  slat,
  dim,
  lifted,
  sharedRef,
  grain,
}: {
  slat: PlacedSlat;
  dim: boolean;
  lifted: boolean;
  sharedRef: SharedRef;
  grain: CanvasTexture;
}) {
  const face = useRef<MeshBasicMaterial>(null);
  const group = useRef<Group>(null);
  const base = useMemo(() => (dim ? ROW_DIM.clone() : new Color(PANEL)), [dim]);

  useFrame(() => {
    const t = sharedRef.current.born === null ? 0 : now() - sharedRef.current.born;
    const breathe = 1;
    if (face.current) face.current.color.copy(base).multiplyScalar(lampAt(sharedRef.current.clock, t) * breathe);
    if (group.current) {
      const target = slat.z + (lifted ? 0.01 : 0);
      const z = group.current.position.z;
      group.current.position.z = sharedRef.current.still ? target : z + (target - z) * 0.2;
    }
  });

  return (
    <group ref={group} position={[0, slat.y, slat.z]}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[slat.width + 0.08, slat.height + 0.08, 0.1]} />
        <meshStandardMaterial color="#1b2733" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[slat.width, slat.height]} />
        <meshBasicMaterial ref={face} map={grain} color={base} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

function Dust({ extent }: { extent: Extent }) {
  const points = useRef<Points>(null);
  const seeds = useMemo(() => {
    const out: number[] = [];
    let s = 11;
    for (let i = 0; i < DUST * 4; i++) {
      s = (s * 16807) % 2147483647;
      out.push((s % 10000) / 10000);
    }
    return out;
  }, []);
  const initial = useMemo(() => new Float32Array(DUST * 3), []);

  useFrame(() => {
    const p = points.current;
    if (!p) return;
    const attr = p.geometry.getAttribute("position") as BufferAttribute;
    const positions = attr.array as Float32Array;
    const t = now() / 1000;
    const w = extent.width * 1.2;
    const h = extent.top - extent.bottom + 0.6;
    for (let i = 0; i < DUST; i++) {
      const a = seeds[i * 4] ?? 0;
      const b = seeds[i * 4 + 1] ?? 0;
      const c = seeds[i * 4 + 2] ?? 0;
      const d = seeds[i * 4 + 3] ?? 0;
      positions[i * 3] = (a - 0.5) * w + Math.sin(t * 0.13 + d * 6) * 0.25;
      positions[i * 3 + 1] = extent.bottom + ((b + t * 0.012 * (0.5 + c)) % 1) * h;
      positions[i * 3 + 2] = 0.3 + c * 1.6;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initial, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={PANEL}
        size={0.022}
        transparent
        opacity={0.45}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

const DOLLY_MS = 450;
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

function Rig({
  extent,
  shift,
  glyphs,
  sharedRef,
  onOpen,
  onPlaced,
}: {
  extent: Extent;
  shift: number;
  glyphs: PlacedGlyph[];
  sharedRef: SharedRef;
  onOpen: (id: string) => void;
  onPlaced: (boxes: Record<string, ScreenBox>) => void;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const aimRef = useRef(new Vector3());
  const goalRef = useRef(new Vector3());
  const probe = useRef(new Vector3());
  const placed = useRef("");

  const place = useCallback(() => {
    const sig = `${size.width}x${size.height}:${camera.position.toArray().map((n) => n.toFixed(3)).join(",")}:${glyphs.length}`;
    if (sig === placed.current) return;
    placed.current = sig;
    camera.updateMatrixWorld();
    const boxes: Record<string, ScreenBox> = {};
    for (const g of glyphs) {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const [dx, dy] of CORNERS) {
        const v = probe.current.set(g.x + (dx * g.size) / 2, g.y + (dy * g.size) / 2, g.z).project(camera);
        const px = ((v.x + 1) / 2) * size.width;
        const py = ((1 - v.y) / 2) * size.height;
        x0 = Math.min(x0, px);
        y0 = Math.min(y0, py);
        x1 = Math.max(x1, px);
        y1 = Math.max(y1, py);
      }
      boxes[g.id] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    onPlaced(boxes);
  }, [camera, size.width, size.height, glyphs, onPlaced]);

  const frame = useMemo(() => {
    const height = extent.top - extent.bottom + 0.1;
    const width = extent.width + 0.3;
    const aspect = (size.width * (1 - shift)) / Math.max(1, size.height);
    const fit = Math.max(height, width / aspect);
    const distance = fit / 2 / Math.tan((FOV * Math.PI) / 360);
    return { distance, fit, centerY: (extent.top + extent.bottom) / 2, centerZ: -extent.depth / 2 };
  }, [extent, size.width, size.height, shift]);

  useEffect(() => {
    if (shift > 0) {
      camera.setViewOffset(size.width, size.height, -size.width * shift * 0.5, 0, size.width, size.height);
    } else {
      camera.clearViewOffset();
    }
    invalidate();
  }, [camera, size.width, size.height, shift, invalidate]);

  useFrame(() => {
    const aim = aimRef.current;
    const goal = goalRef.current;
    const d = sharedRef.current.dolly;
    if (d) {
      const k = Math.min(1, (now() - d.at) / DOLLY_MS);
      const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      goal.set(d.to.x, d.to.y, d.to.z + 1.4);
      camera.position.lerp(goal, e);
      aim.lerp(d.to, e);
      camera.lookAt(aim);
      if (k >= 1) {
        sharedRef.current.dolly = null;
        onOpen(d.id);
      } else {
        invalidate();
      }
      return;
    }
    const lift = frame.centerY + frame.fit * 0.034;
    camera.position.set(0, lift - 0.04, frame.distance);
    aim.set(0, lift, frame.centerZ);
    camera.lookAt(aim);
    place();
  });

  return null;
}

const SLOW_FRAME_MS = 50;

function Ladder({ onSlow }: { onSlow: () => void }) {
  const statsRef = useRef({ last: 0, sum: 0, n: 0 });
  useFrame(() => {
    const t = performance.now();
    const r = statsRef.current;
    const gap = t - r.last;
    r.last = t;
    if (gap <= 0 || gap > 400) return;
    r.sum += gap;
    r.n += 1;
    if (r.n < 30) return;
    if (r.sum / r.n > SLOW_FRAME_MS) onSlow();
    r.sum = 0;
    r.n = 0;
  });
  return null;
}

function Ticker({ active, invalidateRef }: { active: boolean; invalidateRef: MutableRefObject<() => void> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidateRef.current = () => invalidate();
  }, [invalidate, invalidateRef]);
  useEffect(() => {
    invalidate();
    if (!active) return;
    let id = 0;
    const start = () => {
      window.clearInterval(id);
      if (!document.hidden) id = window.setInterval(() => invalidate(), 1000 / 30);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", start);
    };
  }, [active, invalidate]);
  return null;
}

function Intro({ sharedRef, onReady }: { sharedRef: SharedRef; onReady: () => void }) {
  const told = useRef(false);
  useFrame(() => {
    if (sharedRef.current.born === null) sharedRef.current.born = now();
    if (!told.current && introDone(sharedRef.current.clock, now() - sharedRef.current.born)) {
      told.current = true;
      onReady();
    }
  });
  return null;
}

function ChartScene({
  rows,
  activeId,
  still,
  frozen,
  intro,
  skipAt,
  shift,
  pulse,
  onActive,
  onOpen,
  onReady,
  onPlaced,
  dials,
  onToggleLens,
}: ChartSceneProps) {
  const fontReady = useFontReady();
  const layout = useMemo(() => layoutChart(rows, still), [rows, still]);
  const invalidateRef = useRef<() => void>(() => undefined);
  const [level, setLevel] = useState(0);
  const calm = still || level >= 2;
  const slow = useCallback(() => setLevel((l) => Math.min(2, l + 1)), []);
  useEffect(() => {
    document.documentElement.dataset.perf = String(level);
  }, [level]);
  const sharedRef = useRef<Shared>({
    clock: { mode: intro, rows: rows.length, skipAt: null },
    born: null,
    still,
    dolly: null,
    pulse: null,
  });

  useEffect(() => {
    sharedRef.current.pulse = pulse;
    if (pulse) invalidateRef.current();
  }, [pulse]);

  useEffect(() => {
    sharedRef.current.still = calm;
    sharedRef.current.clock.rows = rows.length;
  }, [sharedRef, calm, rows.length]);

  useEffect(() => {
    if (skipAt !== null) sharedRef.current.clock.skipAt = sharedRef.current.born === null ? 0 : skipAt - sharedRef.current.born;
  }, [sharedRef, skipAt]);


  const hatchMap = useMemo(() => texture(drawHatch, 128, 128), []);
  const grain = useMemo(() => {
    const t = texture(drawGrain, 128, 128);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(4, 1);
    return t;
  }, []);
  useEffect(
    () => () => {
      hatchMap.dispose();
      grain.dispose();
    },
    [hatchMap, grain],
  );

  const byId = useMemo(() => {
    const map = new Map<string, { glyph: ChartGlyph; row: number; index: number }>();
    let index = 0;
    rows.forEach((r, i) => r.glyphs.forEach((g) => map.set(g.id, { glyph: g, row: i, index: index++ })));
    return map;
  }, [rows]);
  const activeRow = activeId ? (byId.get(activeId)?.row ?? -1) : -1;

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

  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );

  return (
    <Canvas
      className="chart-canvas"
      data-testid="chart-canvas"
      aria-hidden="true"
      dpr={level >= 1 ? 1 : [1, 1.5]}
      frameloop={frozen ? "never" : "demand"}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: FOV, position: [0, 0, 10], near: 0.1, far: 60 }}
      onPointerMissed={() => onActive(null)}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[0, layout.top, 1.2]} intensity={10} color={PANEL} distance={10} />
      <Rig extent={extent} shift={shift} glyphs={layout.glyphs} sharedRef={sharedRef} onOpen={onOpen} onPlaced={onPlaced} />
      <Ticker active={!calm && !frozen} invalidateRef={invalidateRef} />
      {!calm && !frozen && <Ladder onSlow={slow} />}
      {fontReady && (
        <>
          <Intro sharedRef={sharedRef} onReady={onReady} />
          {layout.slats.map((s, i) => (
            <Slat
              key={s.fraction + s.y}
              slat={s}
              dim={(rows[i]?.glyphs ?? []).every((g) => g.state === "unread")}
              lifted={activeRow === i}
              sharedRef={sharedRef}
              grain={grain}
            />
          ))}
          {layout.glyphs.map((p) => {
            const entry = byId.get(p.id);
            return entry ? (
              <Glyph
                key={p.id}
                glyph={entry.glyph}
                place={p}
                row={entry.row}
                active={activeId === p.id}
                sharedRef={sharedRef}
                onActive={onActive}
                onOpen={onOpen}
                hatchMap={hatchMap}
              />
            ) : null;
          })}
          {!calm && <Dust extent={extent} />}
          {dials.length > 0 && (
            <Phoropter
              dials={dials}
              y={phoropterY}
              reduced={still}
              activeId={activeId}
              onToggle={onToggleLens}
              onActive={onActive}
            />
          )}
        </>
      )}
    </Canvas>
  );
}

export default memo(ChartScene);
