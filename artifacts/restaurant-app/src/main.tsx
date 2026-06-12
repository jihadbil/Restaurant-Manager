import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7040";
setBaseUrl(API_BASE);
setAuthTokenGetter(() => localStorage.getItem("restaurant_token"));

createRoot(document.getElementById("root")!).render(<App />);
