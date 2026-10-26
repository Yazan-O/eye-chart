import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="overlay overlay--plain" data-testid="not-found">
      <h1 data-testid="not-found-heading">Page not found</h1>
      <Link to="/" data-testid="home-link">
        Back to start
      </Link>
    </main>
  );
}
