import Navbar from "./components/layout/Navbar";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <Navbar />
      <main style={{ padding: "1.5rem" }}>
        <AppRoutes />
      </main>
    </>
  );
}

export default App;
