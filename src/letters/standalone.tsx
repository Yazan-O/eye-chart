import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { LetterRoute, letterRoutePath } from "./routes";
import { letters } from "./registry";

function Index() {
  return (
    <main className="letter-page">
      <h1>Widgets</h1>
      <ul>
        {letters.map((l) => (
          <li key={l.id}>{l.name}</li>
        ))}
      </ul>
    </main>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path={letterRoutePath} element={<LetterRoute />} />
        <Route path="*" element={<Index />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
