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
        "bg-navy-dark text-white flex-shrink-0 fixed inset-y-0 left-0 transform transition-all duration-200 ease-in-out z-30",
        "md:sticky md:top-0 md:h-screen",
        isOpen ? "md:w-64 w-64 translate-x-0" : "md:w-12 w-12 -translate-x-full md:translate-x-0"
      )}
      style={{ padding: 0, margin: 0 }}
    >
      {/* Logo */}
      <div className={cn("py-4 flex items-center justify-center border-b border-navy", isOpen ? "px-4" : "")}>
        {isOpen ? (
          <div className="text-white text-xl font-bold">Eastwind Management</div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">EM</span>
          </div>
        )}
      </div>
      
      {/* User Profile */}
      <div className={cn("py-2 border-b border-navy flex items-center", isOpen ? "px-4" : "justify-center")}>
        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
          <span className="text-xs font-bold">CS</span>
        </div>
        {isOpen && <span className="ml-3 font-medium">Capt. Smith</span>}
      </div>

      {/* Navigation Items - Main */}
      <nav className={cn("flex flex-col p-0", isOpen ? "items-start w-full" : "items-center")}>
        <Link href="/">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )} 
            title="Dashboard"
            onClick={() => setIsOpen(true)}
          >
            <Home className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Dashboard</span>}
          </div>
        </Link>

        <Link href="/tasks">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/tasks" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Tasks"
            onClick={() => setIsOpen(true)}
          >
            <CheckSquare className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Tasks</span>}
          </div>
        </Link>
        
        <Link href="/equipment">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/equipment" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Equipment"
            onClick={() => setIsOpen(true)}
          >
            <Wrench className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Equipment</span>}
          </div>
        </Link>
        
        <Link href="/inventory">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/inventory" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Inventory"
            onClick={() => setIsOpen(true)}
          >
            <Package className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Inventory</span>}
          </div>
        </Link>
        
        <Link href="/predictive-maintenance">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/predictive-maintenance" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Predictive Maintenance"
            onClick={() => setIsOpen(true)}
          >
            <BarChart4 className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Predictive Maintenance</span>}
          </div>
        </Link>
        
        <Link href="/ism-management">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/ism-management" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="ISM Management"
            onClick={() => setIsOpen(true)}
          >
            <ClipboardCheck className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">ISM Management</span>}
          </div>
        </Link>
        
        <Link href="/crew-management">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/crew-management" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Crew Management"
            onClick={() => setIsOpen(true)}
          >
            <Users className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Crew Management</span>}
          </div>
        </Link>
        
        <Link href="/financial-management">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/financial-management" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Financial Management"
            onClick={() => setIsOpen(true)}
          >
            <DollarSign className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Financial Management</span>}
          </div>
        </Link>
        
        <Link href="/reports">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/reports" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Reports"
            onClick={() => setIsOpen(true)}
          >
            <FileText className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Reports</span>}
          </div>
        </Link>
        
        <Link href="/calendar">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10", 
              location === "/calendar" ? "bg-navy" : "hover:bg-navy",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Calendar"
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Calendar</span>}
          </div>
        </Link>
      </nav>

      {/* Sidebar Footer */}
      <div className={cn("mt-auto py-2 border-t border-navy flex flex-col", isOpen ? "items-start w-full" : "items-center")}>
        <Link href="/settings">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10 hover:bg-navy", 
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Settings"
            onClick={() => setIsOpen(true)}
          >
            <Settings className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Settings</span>}
          </div>
        </Link>
        <Link href="/logout">
          <div 
            className={cn(
              "flex items-center p-2 cursor-pointer h-10 hover:bg-navy", 
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
            title="Logout"
            onClick={() => setIsOpen(true)}
          >
            <LogOut className="h-5 w-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">Logout</span>}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;