import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { 
  Home, 
  CheckSquare, 
  Settings, 
  Wrench, 
  Package, 
  FileText, 
  Calendar as CalendarIcon,
  LogOut,
  BarChart4,
  ClipboardCheck,
  Users,
  DollarSign,
  LayoutDashboard,
  CircleHelp,
  LifeBuoy,
  Boxes,
  PlusCircle,
  PanelRightOpen,
  Ship,
  Anchor,
  AlertTriangle,
  Clock,
  Shield,
  Map
} from "lucide-react";
import eastwindLogo from '@/assets/eastwind_logo.svg';
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Custom NavLink component that prevents default behavior and uses client-side navigation
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };
  
  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [location] = useLocation();
  const isMobile = useMobile();

  return (
    <div
      className={cn(
        "bg-background/95 backdrop-blur border-r text-foreground h-screen overflow-y-auto flex-shrink-0 transition-all duration-200 ease-in-out z-30 sticky top-0",
        isOpen ? "md:w-64 w-64" : "md:w-14 w-0 md:w-14",
        isMobile ? "fixed left-0" : ""
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center h-14">
        {isOpen ? (
          <>
            <img src={eastwindLogo} alt="Eastwind Management" className="h-8" />
          </>
        ) : (
          <div className="flex items-center justify-center w-full">
            <img src={eastwindLogo} alt="Eastwind" className="h-7" />
          </div>
        )}
      </div>
      
      {/* Create Button */}
      {isOpen && (
        <div className="px-4 mb-2">
          <Button className="w-full justify-start space-x-2">
            <PlusCircle className="h-4 w-4" />
            <span>Quick Create</span>
          </Button>
        </div>
      )}

      {/* Navigation Items - Main */}
      <nav className="space-y-1 px-2">
        <NavLink href="/">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <LayoutDashboard className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Dashboard</span>}
          </div>
        </NavLink>

        <NavLink href="/vessels">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/vessels" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Ship className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Vessels</span>}
          </div>
        </NavLink>

        <NavLink href="/tasks">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/tasks" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <CheckSquare className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Tasks</span>}
          </div>
        </NavLink>
        
        <NavLink href="/equipment">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/equipment" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Wrench className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Equipment</span>}
          </div>
        </NavLink>
        
        <NavLink href="/inventory">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/inventory" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Boxes className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Inventory</span>}
          </div>
        </NavLink>

        <NavLink href="/calendar">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/calendar" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <CalendarIcon className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Calendar</span>}
          </div>
        </NavLink>
        
        <NavLink href="/crew-management">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/crew-management" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Users className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Crew Management</span>}
          </div>
        </NavLink>
        
        <NavLink href="/ism-management">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/ism-management" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Shield className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>ISM Management</span>}
          </div>
        </NavLink>
        
        <NavLink href="/voyages">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/voyages" || location.startsWith("/voyages/")
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Map className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Voyage Planner</span>}
          </div>
        </NavLink>
        
        <NavLink href="/predictive-maintenance">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/predictive-maintenance" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <BarChart4 className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Predictive Maintenance</span>}
          </div>
        </NavLink>
        
        <NavLink href="/financial-management">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/financial-management" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <DollarSign className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Finances</span>}
          </div>
        </NavLink>
        
        <NavLink href="/reports">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/reports" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <FileText className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Reports</span>}
          </div>
        </NavLink>
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto">
        {isOpen && (
          <div className="px-4 py-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-medium text-primary">CS</span>
              </div>
              <div>
                <p className="text-sm font-medium">Capt. Smith</p>
                <p className="text-xs text-muted-foreground">Operations Manager</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="space-y-1 px-2 py-2">
          <NavLink href="/settings">
            <div 
              className={cn(
                "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
                location === "/settings" 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                !isOpen && "justify-center p-2"
              )} 
            >
              <Settings className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Settings</span>}
            </div>
          </NavLink>
          <NavLink href="/help">
            <div 
              className={cn(
                "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
                location === "/help" 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                !isOpen && "justify-center p-2"
              )} 
            >
              <LifeBuoy className={cn("h-5 w-5", isOpen && "mr-2")} />
              {isOpen && <span>Help</span>}
            </div>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;