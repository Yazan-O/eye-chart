import { Route, Routes } from "react-router-dom";
import ChartPage from "./chart/ChartPage";
import TwinPage from "./twin/TwinPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChartPage />} />
      <Route path="/l/:id/:variant" element={<TwinPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
