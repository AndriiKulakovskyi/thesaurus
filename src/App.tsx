import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import DatasetDetail from "./components/DatasetDetail";
import PsychiatricDataWarehouse from "./components/PsychiatricDataWarehouse";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div>
        <Routes>
          <Route path="/" element={<PsychiatricDataWarehouse />} />
          <Route path="/classic" element={<Home />} />
          <Route path="/dataset/:id" element={<DatasetDetail />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </div>
    </Suspense>
  );
}

export default App;
