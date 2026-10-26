import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";

type SceneProps = { reducedMotion: boolean };

const SPIN_RADIANS_PER_SECOND = 0.4;

function SpinningObject({ reducedMotion }: SceneProps) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (reducedMotion || !mesh.current) return;
    mesh.current.rotation.y += delta * SPIN_RADIANS_PER_SECOND;
    mesh.current.rotation.x += delta * SPIN_RADIANS_PER_SECOND * 0.4;
  });
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.2, 1]} />
      <meshStandardMaterial color="#6ea8fe" flatShading roughness={0.45} />
    </mesh>
  );
}

export default function Scene({ reducedMotion }: SceneProps) {
  return (
    <div className="scene" data-testid="scene">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <color attach="background" args={["#0b1020"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <SpinningObject reducedMotion={reducedMotion} />
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
