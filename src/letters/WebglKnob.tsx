import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { isBroken, hasLens } from "./types";
import type { LetterProps } from "./types";

const SIZE = 320;
const MAX = 10;
const PX_PER_STEP = 20;

export function angleFor(value: number) {
  return ((135 - value * 27) * Math.PI) / 180;
}

export function stepFromDrag(start: number, dy: number) {
  return Math.max(0, Math.min(MAX, start + Math.round(-dy / PX_PER_STEP)));
}

export default function WebglKnob({ variant }: LetterProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const knob = useRef<Group | null>(null);
  const paint = useRef<(() => void) | null>(null);
  const drag = useRef<{ y: number; start: number } | null>(null);
  const [value, setValue] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: el, antialias: true, preserveDrawingBuffer: true });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0x0b1020);
    const scene = new Scene();
    const camera = new PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 5, 3.2);
    camera.lookAt(0, 0, 0);
    scene.add(new AmbientLight(0xffffff, 0.6));
    const light = new DirectionalLight(0xffffff, 1.4);
    light.position.set(2, 6, 4);
    scene.add(light);
    const group = new Group();
    const body = new Mesh(
      new CylinderGeometry(1.2, 1.3, 0.6, 64),
      new MeshStandardMaterial({ color: 0x3a4670, metalness: 0.4, roughness: 0.4 }),
    );
    const marker = new Mesh(
      new BoxGeometry(0.16, 0.08, 0.8),
      new MeshStandardMaterial({ color: 0xffcc33 }),
    );
    marker.position.set(0, 0.34, -0.7);
    group.add(body, marker);
    scene.add(group);
    for (let v = 0; v <= MAX; v++) {
      const tick = new Mesh(
        new BoxGeometry(0.06, 0.02, v % 5 === 0 ? 0.34 : 0.2),
        new MeshStandardMaterial({ color: 0xc8d0ea }),
      );
      const a = angleFor(v);
      tick.position.set(-Math.sin(a) * 1.65, 0, -Math.cos(a) * 1.65);
      tick.rotation.y = a;
      scene.add(tick);
    }
    knob.current = group;
    paint.current = () => renderer.render(scene, camera);
    group.rotation.y = angleFor(0);
    paint.current();
    return () => {
      paint.current = null;
      knob.current = null;
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (knob.current) knob.current.rotation.y = angleFor(value);
    paint.current?.();
  }, [value]);

  const shown = isBroken(variant) ? 0 : value;

  return (
    <div className="letter-widget">
      {failed ? <p>WebGL is not available in this browser.</p> : null}
      {hasLens(variant) ? (
        <label className="letter-sr">
          Volume knob
          <input
            type="range"
            min={0}
            max={MAX}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.currentTarget.value))}
          />
        </label>
      ) : null}
      <canvas
        ref={canvas}
        width={SIZE}
        height={SIZE}
        className="letter-canvas letter-knob"
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, start: value };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) setValue(stepFromDrag(drag.current.start, e.clientY - drag.current.y));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      />
      <p className="letter-readout">Volume: {shown}</p>
    </div>
  );
}
