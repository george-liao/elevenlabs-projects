import React from "react";
import ReactDOM from "react-dom/client";
import { ConversationProvider } from "@elevenlabs/react";
import App from "./App.tsx";
import "./index.css";

// The ElevenLabs conversation hooks (useConversation, useConversationStatus, …)
// must be used inside a ConversationProvider, so we wrap the whole app once.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConversationProvider>
      <App />
    </ConversationProvider>
  </React.StrictMode>
);
