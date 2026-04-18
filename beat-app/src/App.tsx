import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import SceneScan from "./pages/SceneScan";
import FridgeScan from "./pages/FridgeScan";
import Groceries from "./pages/Groceries";
import Activity from "./pages/Activity";
import Coach from "./pages/Coach";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<SceneScan />} />
        <Route path="/fridge" element={<FridgeScan />} />
        <Route path="/groceries" element={<Groceries />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
