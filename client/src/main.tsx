import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { VesselProvider } from "@/contexts/VesselContext";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <VesselProvider>
      <App />
      <Toaster />
    </VesselProvider>
  </QueryClientProvider>
);
