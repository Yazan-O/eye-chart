import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Group } from "three";
import { ACCENT, GLYPH_FONT, INK } from "./glyphArt";

export interface LensDial {
  id: string;
  glyph: string;
  name: string;
  on: boolean;
  measured: boolean;
  without: string;
  with: string;
  summary: string;
}

const PITCH = 0.46;
const TURNED = -Math.PI / 2;

export const PHOROPTER_SCALE = 1.3;

function bodyWidth(count: number): number {
  return Math.max(1.9, count * PITCH + 1.4);
}

export function phoropterWidth(count: number): number {
  return bodyWidth(count) * PHOROPTER_SCALE;
}

function glyphTexture(glyph: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `700 92px ${GLYPH_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    ctx.fillText(glyph, 64, 68);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function Dial({
  dial,
  x,
  reduced,
  active,
  onToggle,
  onActive,
}: {
  dial: LensDial;
  x: number;
  reduced: boolean;
  active: boolean;
  onToggle: (id: string) => void;
  onActive: (id: string | null) => void;
}) {
  const knob = useRef<Group>(null);
  const label = useMemo(() => glyphTexture(dial.glyph), [dial.glyph]);
  useEffect(() => () => label.dispose(), [label]);
  const target = dial.on ? TURNED : 0;

  useFrame((_, delta) => {
    const k = knob.current;
    if (!k || reduced) return;
    k.rotation.z += (target - k.rotation.z) * Math.min(1, delta * 9);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    onActive(dial.id);
  };
  const out = () => {
    document.body.style.cursor = "";
    onActive(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onToggle(dial.id);
  };

  return (
    <group position={[x, 0.05, 0.17]}>
      <group
        ref={knob}
        rotation={[0, 0, reduced ? target : 0]}
        scale={active ? 1.08 : 1}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      >
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 40]} />
          <meshStandardMaterial
            color={dial.on ? (dial.measured ? ACCENT : "#3a4a5a") : "#2b333c"}
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]}>
          <cylinderGeometry args={[0.105, 0.105, 0.06, 40]} />
          <meshStandardMaterial color="#d7dee5" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.055, 0.062]}>
          <boxGeometry args={[0.022, 0.07, 0.01]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      </group>
      <mesh position={[0, -0.215, -0.005]}>
        <planeGeometry args={[0.13, 0.13]} />
        <meshBasicMaterial map={label} transparent toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

export default function Phoropter({
  dials,
  y,
  reduced,
  activeId,
  onToggle,
  onActive,
}: {
  dials: LensDial[];
  y: number;
  reduced: boolean;
  activeId: string | null;
  onToggle: (id: string) => void;
  onActive: (id: string | null) => void;
}) {
  const width = bodyWidth(dials.length);
  const start = -((dials.length - 1) * PITCH) / 2;
  const eye = width / 2 - 0.34;
  return (
    <group position={[0, y, 0.55]} scale={PHOROPTER_SCALE}>
      <mesh>
        <boxGeometry args={[width, 0.66, 0.3]} />
        <meshStandardMaterial color="#1b2733" metalness={0.35} roughness={0.5} emissive="#0e1822" />
      </mesh>
      <mesh position={[0, -0.02, 0.155]}>
        <boxGeometry args={[width - 0.86, 0.56, 0.02]} />
        <meshStandardMaterial color="#6bb4ee" metalness={0.3} roughness={0.45} emissive="#1d3a52" />
      </mesh>
      {[-eye, eye].map((ex) => (
        <group key={ex} position={[ex, 0, 0.16]}>
          <mesh>
            <torusGeometry args={[0.17, 0.045, 16, 48]} />
            <meshStandardMaterial color="#0f1418" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.15, 48]} />
            <meshStandardMaterial color="#0a1016" metalness={0.9} roughness={0.08} />
          </mesh>
        </group>
      ))}
      {dials.map((d, i) => (
        <Dial
          key={d.id}
          dial={d}
          x={start + i * PITCH}
          reduced={reduced}
          active={activeId === d.id}
          onToggle={onToggle}
          onActive={onActive}
        />
      ))}
      <mesh position={[0, -0.75, -0.05]}>
        <cylinderGeometry args={[0.05, 0.05, 0.84, 16]} />
        <meshStandardMaterial color="#1b2733" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}
