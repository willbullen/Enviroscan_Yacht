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
  Zap, 
  Lightbulb,
  Navigation, 
  ShieldCheck,
  LogOut,
  BarChart4,
  ClipboardCheck,
  Users,
  DollarSign
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [location] = useLocation();

  return (
    <div
      className={cn(
        "bg-navy-dark text-white flex-shrink-0 fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out z-30",
        "md:sticky md:top-0 md:h-screen md:w-12 w-12",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{ padding: 0, margin: 0 }}
    >
      {/* User Profile */}
      <div className="py-2 border-b border-navy flex items-center justify-center">
        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white">
          <span className="text-xs font-bold">CS</span>
        </div>
      </div>

      {/* Navigation Items - Main */}
      <nav className="flex flex-col items-center p-0">
        <Link href="/">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/" ? "bg-navy" : "hover:bg-navy")} title="Dashboard">
            <Home className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/tasks">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/tasks" ? "bg-navy" : "hover:bg-navy")} title="Tasks">
            <CheckSquare className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/equipment">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/equipment" ? "bg-navy" : "hover:bg-navy")} title="Equipment">
            <Wrench className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/inventory">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/inventory" ? "bg-navy" : "hover:bg-navy")} title="Inventory">
            <Package className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/predictive-maintenance">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/predictive-maintenance" ? "bg-navy" : "hover:bg-navy")} title="Predictive Maintenance">
            <BarChart4 className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/ism-management">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/ism-management" ? "bg-navy" : "hover:bg-navy")} title="ISM Management">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/crew-management">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/crew-management" ? "bg-navy" : "hover:bg-navy")} title="Crew Management">
            <Users className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/financial-management">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/financial-management" ? "bg-navy" : "hover:bg-navy")} title="Financial Management">
            <DollarSign className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/reports">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/reports" ? "bg-navy" : "hover:bg-navy")} title="Reports">
            <FileText className="h-5 w-5" />
          </div>
        </Link>
        
        <Link href="/calendar">
          <div className={cn("flex items-center justify-center p-2 cursor-pointer w-10 h-10", 
            location === "/calendar" ? "bg-navy" : "hover:bg-navy")} title="Calendar">
            <CalendarIcon className="h-5 w-5" />
          </div>
        </Link>
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto py-2 border-t border-navy flex flex-col items-center">
        <Link href="/settings">
          <div className="flex items-center justify-center p-2 hover:bg-navy cursor-pointer w-10 h-10" title="Settings">
            <Settings className="h-5 w-5" />
          </div>
        </Link>
        <Link href="/logout">
          <div className="flex items-center justify-center p-2 hover:bg-navy cursor-pointer w-10 h-10" title="Logout">
            <LogOut className="h-5 w-5" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
