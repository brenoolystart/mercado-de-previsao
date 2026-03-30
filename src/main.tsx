import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n";
import "./index.css";
import { setupGlobalImageErrorHandler } from "./lib/image-overrides";

// Setup global handler to gracefully recover from broken images
setupGlobalImageErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);