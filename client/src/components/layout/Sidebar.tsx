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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { href: "/tasks", label: "Tasks", icon: <CheckSquare className="h-5 w-5 mr-3" /> },
    { href: "/equipment", label: "Equipment", icon: <Wrench className="h-5 w-5 mr-3" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="h-5 w-5 mr-3" /> },
    { href: "/predictive-maintenance", label: "Predictive Maintenance", icon: <BarChart4 className="h-5 w-5 mr-3" /> },
    { href: "/ism-management", label: "ISM Management", icon: <ClipboardCheck className="h-5 w-5 mr-3" /> },
    { href: "/crew-management", label: "Crew Management", icon: <Users className="h-5 w-5 mr-3" /> },
    { href: "/financial-management", label: "Financial Management", icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { href: "/reports", label: "Reports", icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: "/calendar", label: "Calendar", icon: <CalendarIcon className="h-5 w-5 mr-3" /> },
  ];

  const systemItems = [
    { href: "/mechanical", label: "Mechanical", icon: <Zap className="h-5 w-5 mr-3" /> },
    { href: "/electrical", label: "Electrical", icon: <Lightbulb className="h-5 w-5 mr-3" /> },
    { href: "/navigation", label: "Navigation", icon: <Navigation className="h-5 w-5 mr-3" /> },
    { href: "/safety", label: "Safety", icon: <ShieldCheck className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div
      className={cn(
        "bg-navy-dark text-white w-64 flex-shrink-0 fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out z-30",
        "md:translate-x-0 md:static md:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Sidebar Header - Desktop */}
      <div className="hidden md:flex items-center p-4 border-b border-navy">
        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l18-5v12L3 11z"></path>
            <path d="M9.5 6.5l1 9.5"></path>
            <path d="M16.5 15.5l-.3-12"></path>
          </svg>
        </div>
        <span className="font-semibold">IDEA YACHT</span>
      </div>

      <div className="flex flex-col h-full overflow-y-auto">
        {/* User Profile */}
        <div className="p-4 border-b border-navy flex items-center">
          <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white mr-3">
            <span className="text-xs font-bold">CS</span>
          </div>
          <div>
            <p className="font-semibold">Captain Smith</p>
            <p className="text-xs text-gray-300">Chief Engineer</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2">
          <div className="mb-4">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Main
            </p>
            {navItems.map((item) => (
              <div key={item.href} className="mb-1">
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-2 text-sm rounded-md cursor-pointer",
                      location === item.href
                        ? "bg-navy"
                        : "hover:bg-navy"
                    )}
                    onClick={() => setIsOpen(true)}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Yacht Systems
            </p>
            {systemItems.map((item) => (
              <div key={item.href} className="mb-1">
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-2 text-sm rounded-md cursor-pointer",
                      location === item.href
                        ? "bg-navy"
                        : "hover:bg-navy"
                    )}
                    onClick={() => setIsOpen(true)}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4 border-t border-navy">
          <Link href="/settings">
            <div className="flex items-center text-sm hover:text-gray-300 cursor-pointer">
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </div>
          </Link>
          <Link href="/logout">
            <div className="flex items-center text-sm hover:text-gray-300 mt-3 cursor-pointer">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
