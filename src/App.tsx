import { Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ChartPage from "./chart/ChartPage";
import StationPage from "./station/StationPage";
import TwinPage from "./twin/TwinPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<ChartPage />} />
        <Route path="/letter/:id" element={<StationPage />} />
        <Route path="/l/:id/:variant" element={<TwinPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
