import React from "react";
import { createRoot } from "react-dom/client";
import Calendar from "../app/calendar";
import "../app/globals.css";
import "../app/stickers.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Calendar />
  </React.StrictMode>,
);
