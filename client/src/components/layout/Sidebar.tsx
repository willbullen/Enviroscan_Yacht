import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
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
  PanelRightOpen
} from "lucide-react";
import eastwindLogo from '@/assets/eastwind_logo.svg';
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [location] = useLocation();

  return (
    <div
      className={cn(
        "bg-background/95 backdrop-blur border-r text-foreground flex-shrink-0 fixed inset-y-0 left-0 transform transition-all duration-200 ease-in-out z-30",
        "md:sticky md:top-0 md:h-screen",
        isOpen ? "md:w-64 w-64 translate-x-0" : "md:w-14 w-14 -translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center h-14">
        {isOpen ? (
          <>
            <img src={eastwindLogo} alt="Eastwind Management" className="h-8" />
            <span className="text-lg font-semibold ml-2">Eastwind Inc.</span>
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
        <Link href="/">
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
        </Link>

        <Link href="/tasks">
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
        </Link>
        
        <Link href="/equipment">
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
        </Link>
        
        <Link href="/inventory">
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
        </Link>
        
        <Link href="/predictive-maintenance">
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
            {isOpen && <span>Analytics</span>}
          </div>
        </Link>
        
        <Link href="/ism-management">
          <div 
            className={cn(
              "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors", 
              location === "/ism-management" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              !isOpen && "justify-center p-2"
            )} 
          >
            <ClipboardCheck className={cn("h-5 w-5", isOpen && "mr-2")} />
            {isOpen && <span>Documents</span>}
          </div>
        </Link>
        
        <Link href="/crew-management">
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
            {isOpen && <span>Team</span>}
          </div>
        </Link>
        
        <Link href="/financial-management">
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
        </Link>
        
        <Link href="/reports">
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
        </Link>
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
          <Link href="/settings">
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
          </Link>
          <Link href="/help">
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
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;