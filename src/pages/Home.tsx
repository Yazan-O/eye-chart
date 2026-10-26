import Scene from "../components/Scene";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export default function Home() {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className="stage" data-testid="stage">
      <Scene reducedMotion={reducedMotion} />
      <main className="overlay" data-testid="overlay">
        <h1 data-testid="heading">Scene Shell</h1>
        <p data-testid="tagline">An interactive 3D web app.</p>
        <p data-testid="motion-status">
          Motion: {reducedMotion ? "reduced" : "full"}
        </p>
      </main>
    </div>
  );
}
