import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import DatasetDetail from "./components/DatasetDetail";
import PsychiatricDataWarehouse from "./components/PsychiatricDataWarehouse";
import AppLayout from "./components/AppLayout";
import routes from "tempo-routes";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import UserProfile from "./components/auth/UserProfile";

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse text-gray-500">
              Loading application...
            </div>
          </div>
        }
        className="h-16"
      >
        <div>
          <Routes>
            <Route path="/" element={<PsychiatricDataWarehouse />} />
            <Route path="/classic" element={<Home />} />
            <Route path="/dataset/:id" element={<DatasetDetail />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          <Toaster />
        </div>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
