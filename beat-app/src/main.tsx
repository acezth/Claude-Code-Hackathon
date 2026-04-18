import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { config } from "./lib/config";
import "./styles.css";

// If no client ID is set we still render — users can use Demo Mode.
// Google's own script won't error on a missing ID; it only fails at sign-in time.
const clientId = config.google.clientId || "unconfigured.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
