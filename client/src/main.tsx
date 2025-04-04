import { createRoot } from "react-dom/client";
import App from "./App";
// Bootstrap CSS import
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Custom styles
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Initialize Bootstrap JavaScript components
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>
);
