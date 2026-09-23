import { useLocation } from "react-router-dom";
//import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/layout/Sidebar";

function App() {
  const { pathname } = useLocation();
  const useSidebarShell = pathname.startsWith("/doctor-schedule");

  if (useSidebarShell) {
    // Doctor-schedule pages manage their own full-bleed layout — no shell.
    return (
      <main>
        <AppRoutes />
      </main>
    );
  }

  return (
    <div className="hh-app-shell">
      <Sidebar />
      <main className="hh-app-content">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;