import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/theme.css";
import "./styles/responsive.css";
import { useTabsStore } from "./stores/tabsStore";
import { handleSyncConflict } from "./sync/conflictHandler";
import { registerServiceWorker } from "./sw";

if (process.env.NODE_ENV === "production") {
  registerServiceWorker();
}

if (typeof window !== "undefined") {
  (window as unknown as { __tabsStore: typeof useTabsStore; __handleSyncConflict: typeof handleSyncConflict }).__tabsStore = useTabsStore;
  (window as unknown as { __tabsStore: typeof useTabsStore; __handleSyncConflict: typeof handleSyncConflict }).__handleSyncConflict = handleSyncConflict;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

