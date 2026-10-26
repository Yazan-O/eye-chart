import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="plain" data-testid="not-found">
      <h1 className="display" data-testid="not-found-heading">
        Page not found
      </h1>
      <Link to="/" className="button" data-testid="home-link">
        Back to the chart
      </Link>
    </main>
  );
}
