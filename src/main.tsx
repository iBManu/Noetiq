//import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PasswordProvider } from "../src/components/PasswordContext";
import { SettingsProvider } from "./components/SettingsContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  //<React.StrictMode>
  <PasswordProvider>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </PasswordProvider>
  //</React.StrictMode>,
);
