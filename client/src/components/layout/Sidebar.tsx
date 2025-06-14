import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
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
  Map,
  UserCircle,
  Hammer
} from "lucide-react";
import eastwindLogo from '@/assets/eastwind_logo.svg';
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { user, logoutMutation } = useAuth();

  return (
    <div
      className={cn(
        "bg-[hsl(var(--sidebar-background))] text-foreground h-screen overflow-y-auto flex-shrink-0 transition-all duration-300 ease-in-out z-30 sticky top-0 shadow-xl",
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
      
      {/* Create Button with Dropdown */}
      {isOpen && (
        <div className="px-4 mb-2">
          <Button 
            className="w-full justify-start space-x-2 group relative"
            variant="outline"
            title="Create new items quickly in different sections of the application"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Item</span>
            <div className="absolute right-2 top-2 h-4 w-4 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs text-primary font-semibold">?</span>
            </div>
          </Button>
        </div>
      )}

      {/* Navigation Items - Main */}
      <nav className="space-y-1 px-2 py-1">
        {isOpen && <div className="px-3 py-1 text-xs uppercase font-semibold text-muted-foreground/70">Main</div>}
        <NavLink href="/">
          <div 
            className={cn(
              "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
              location === "/" 
                ? "bg-primary/15 text-primary" 
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
              !isOpen && "justify-center p-2"
            )} 
          >
            {location === "/" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
            <LayoutDashboard className={cn("h-5 w-5", isOpen && "mr-3")} />
            {isOpen && <span>Portal</span>}
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
        
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto">
        <nav className="space-y-1 px-2 py-2">
          {isOpen && <div className="px-3 py-1 text-xs uppercase font-semibold text-muted-foreground/70">TOOLS</div>}

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
            <Anchor className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Voyage Planner</span>}
          </div>
        </NavLink>
        
        <NavLink href="/marine-tracker">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/marine-tracker"
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <Map className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Marine Tracker</span>}
          </div>
        </NavLink>

        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto">
        <nav className="space-y-1 px-2 py-2">
          {isOpen && <div className="px-3 py-1 text-xs uppercase font-semibold text-muted-foreground/70">PMS</div>}

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

        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto">
        <nav className="space-y-1 px-2 py-2">
          {isOpen && <div className="px-3 py-1 text-xs uppercase font-semibold text-muted-foreground/70">Administration</div>}

          <NavLink href="/vessels/admin">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/vessels/admin" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/vessels/admin" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <Ship className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Vessels</span>}
            </div>
          </NavLink>
          
          <NavLink href="/forms-administration">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/forms-administration" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/forms-administration" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <FileText className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Forms</span>}
            </div>
          </NavLink>

          <NavLink href="/ism-management">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/ism-management" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/ism-management" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <Shield className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>ISM</span>}
            </div>
          </NavLink>
          
          <NavLink href="/build-management">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/build-management" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/build-management" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <Hammer className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Build Management</span>}
            </div>
          </NavLink>
          
          <NavLink href="/users/admin">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/users/admin" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/users/admin" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <Users className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Users</span>}
            </div>
          </NavLink>
          
          <NavLink href="/crew-management">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/crew-management" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/crew-management" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <Users className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Crew</span>}
            </div>
          </NavLink>
          
          
          
          <NavLink href="/financial-management">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/financial-management" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/financial-management" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <DollarSign className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Finances</span>}
            </div>
          </NavLink>
          
          <NavLink href="/reports">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/reports" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/reports" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <FileText className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Reports</span>}
            </div>
          </NavLink>
        </nav>
        
        <nav className="space-y-1 px-2 py-2 mt-2">
          {isOpen && <div className="px-3 py-1 text-xs uppercase font-semibold text-muted-foreground/70">Preferences</div>}
          <NavLink href="/settings">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/settings" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/settings" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <Settings className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Settings</span>}
            </div>
          </NavLink>
          <NavLink href="/help">
            <div 
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all relative group", 
                location === "/help" 
                  ? "bg-primary/15 text-primary" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !isOpen && "justify-center p-2"
              )} 
            >
              {location === "/help" && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-primary rounded-full"></div>}
              <LifeBuoy className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && <span>Help</span>}
            </div>
          </NavLink>
        </nav>
        
        {/* User Profile - At the very bottom */}
        <div className="px-2 py-3 mt-2 border-t">
          {isOpen ? (
            <div className="px-3 py-2">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium text-primary">
                        {user.fullName.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logoutMutation.mutate()}
                    className="ml-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Not logged in</span>
                </div>
              )}
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logoutMutation.mutate()}
                    className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;