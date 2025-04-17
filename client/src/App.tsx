import { Switch, Route } from "wouter";
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
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import VesselAdmin from "@/pages/VesselAdmin";
import { VoyagesListPage } from "@/pages/VoyagesListPage";
import { VoyageDetailsPage } from "@/pages/VoyageDetailsPage";
import { VoyageCreatePage } from "@/pages/VoyageCreatePage";
import { VoyageEditPage } from "@/pages/VoyageEditPage";

function App() {
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
      
      {/* Vessel Management Routes */}
      <Route path="/vessels/admin" component={VesselAdmin} />
      
      {/* Voyage Planner Routes */}
      <Route path="/voyages" component={VoyagesListPage} />
      <Route path="/voyages/:id" component={VoyageDetailsPage} />
      
      {/* Yacht System Routes */}
      <Route path="/mechanical" component={YachtSystem} />
      <Route path="/electrical" component={YachtSystem} />
      <Route path="/navigation" component={YachtSystem} />
      <Route path="/safety" component={YachtSystem} />
      
      {/* Settings and 404 */}
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
