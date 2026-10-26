import { Route, Routes } from "react-router-dom";
import { AgentViewProvider } from "./agent/AgentView";
import RootHooks from "./components/RootHooks";
import ScrollToTop from "./components/ScrollToTop";
import ChartPage from "./chart/ChartPage";
import StationPage from "./station/StationPage";
import { LetterRoute, letterRoutePath } from "./letters/routes";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AgentViewProvider>
      <ScrollToTop />
      <RootHooks />
      <div className="app">
        <Routes>
          <Route path="/" element={<ChartPage />} />
          <Route path="/letter/:id" element={<StationPage />} />
          <Route path={letterRoutePath} element={<LetterRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AgentViewProvider>
  );
}
