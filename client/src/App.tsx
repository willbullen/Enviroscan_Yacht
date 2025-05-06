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
import BankingPage from "@/pages/BankingPage";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import VesselAdmin from "@/pages/VesselAdmin";
import UserAdmin from "@/pages/UserAdmin";
import FormsAdministration from "@/pages/FormsAdministration";
import MarineTracker from "@/pages/MarineTracker";
import { VoyagesListPage } from "@/pages/VoyagesListPage";
import { VoyageDetailsPage } from "@/pages/VoyageDetailsPage";
import { VoyageCreatePage } from "@/pages/VoyageCreatePage";
import { VoyageEditPage } from "@/pages/VoyageEditPage";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import { VendorProvider } from "@/contexts/VendorContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";

function App() {
  return (
    <AuthProvider>
      <SystemSettingsProvider>
        <VendorProvider>
          <Switch>
            {/* Public Routes */}
            <Route path="/auth" component={AuthPage} />
            
            {/* Protected Routes */}
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/tasks" component={Tasks} />
          <ProtectedRoute path="/equipment" component={Equipment} />
          <ProtectedRoute path="/inventory" component={Inventory} />
          <ProtectedRoute path="/reports" component={Reports} />
          <ProtectedRoute path="/calendar" component={Calendar} />
          <ProtectedRoute path="/predictive-maintenance" component={PredictiveMaintenance} />
          <ProtectedRoute path="/ism-management" component={ISMManagement} />
          <ProtectedRoute path="/crew-management" component={CrewManagement} />
          <ProtectedRoute path="/financial-management" component={FinancialManagement} />
          <ProtectedRoute path="/banking" component={BankingPage} />
          <ProtectedRoute path="/forms-administration" component={FormsAdministration} />
          
          {/* Admin Routes */}
          <ProtectedRoute path="/vessels/admin" component={VesselAdmin} />
          <ProtectedRoute path="/users/admin" component={UserAdmin} />
          
          {/* Voyage Planner Routes */}
          <ProtectedRoute path="/voyages" component={VoyagesListPage} />
          <ProtectedRoute path="/voyages/new" component={VoyageCreatePage} />
          <ProtectedRoute path="/voyages/:id/edit" component={VoyageEditPage} />
          <ProtectedRoute path="/voyages/:id" component={VoyageDetailsPage} />
          
          {/* Marine Tracking Routes */}
          <ProtectedRoute path="/marine-tracker" component={MarineTracker} />
          
          {/* Yacht System Routes */}
          <ProtectedRoute path="/mechanical" component={YachtSystem} />
          <ProtectedRoute path="/electrical" component={YachtSystem} />
          <ProtectedRoute path="/navigation" component={YachtSystem} />
          <ProtectedRoute path="/safety" component={YachtSystem} />
          
          {/* Settings and 404 */}
          <ProtectedRoute path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
        </VendorProvider>
      </SystemSettingsProvider>
    </AuthProvider>
  );
}

export default App;
