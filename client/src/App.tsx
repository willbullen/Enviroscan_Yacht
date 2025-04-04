import { Switch, Route, useLocation } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Equipment from "@/pages/Equipment";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import YachtSystem from "@/pages/YachtSystem";
import PredictiveMaintenance from "@/pages/PredictiveMaintenance";
import ISMManagement from "@/pages/ISMManagement";
import CrewManagement from "@/pages/CrewManagement";
import FinancialManagement from "@/pages/FinancialManagement";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/hud/MainLayout";
import { useEffect } from "react";

const AppRoutes = () => {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/equipment" component={Equipment} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/reports" component={Reports} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/predictive-maintenance" component={PredictiveMaintenance} />
      <Route path="/ism-management" component={ISMManagement} />
      <Route path="/crew-management" component={CrewManagement} />
      <Route path="/financial-management" component={FinancialManagement} />
      
      {/* Yacht System Routes */}
      <Route path="/mechanical" component={YachtSystem} />
      <Route path="/electrical" component={YachtSystem} />
      <Route path="/navigation" component={YachtSystem} />
      <Route path="/safety" component={YachtSystem} />
      
      <Route component={NotFound} />
    </Switch>
  );
};

function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
    
    // Hide all dropdowns when route changes
    document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }, [location]);

  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
}

export default App;
