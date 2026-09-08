import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import SimulatorPage from "./pages/SimulatorPage";

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <LandingPage onStart={() => setStarted(true)} />;
  }

  return <SimulatorPage />;
}

export default App;
