import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadSprites } from "./battle/sprites";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Real artwork, if present, replaces code-drawn figures unit by unit (public/sprites/).
void loadSprites();

// Offline support and "install as app". Only in production builds: during development a cached
// version would hide changes. Needs HTTPS or localhost.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Not available (e.g. plain HTTP on the LAN); the game works without it.
    });
  });
}
